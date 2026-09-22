const SHA_PATTERN = /^[a-f0-9]{40}$/;
const CONTRACT_HASH_PATTERN = /^[a-f0-9]{64}$/;
const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const GATE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]*$/;

export class VerifiedMergeError extends Error {
  constructor(stage, message, result, cause) {
    super(message, { cause });
    this.name = 'VerifiedMergeError';
    this.stage = stage;
    this.result = result;
  }
}

function createResult(options) {
  return {
    task_id: options.evidence?.task_id ?? null,
    contract_hash: options.contractHash ?? null,
    verifier_decision_reference: options.verifierReference ?? null,
    verifier_decision: options.evidence?.decision ?? null,
    human_approval_reference: options.humanApprovalReference ?? null,
    base_main_sha: options.expectedBase ?? null,
    feature_branch: options.featureBranch ?? null,
    feature_head: options.featureHead ?? null,
    resulting_main_sha: null,
    gates_run: [],
    push_result: 'NOT_ATTEMPTED',
    rollback_result: 'NOT_REQUIRED',
    mode: options.dryRun ? 'DRY_RUN' : 'EXECUTE',
    status: 'PENDING',
    failure: null,
  };
}

function stop(result, stage, message, cause) {
  result.status = 'FAIL';
  result.failure = { stage, message };
  throw new VerifiedMergeError(stage, message, result, cause);
}

function validateInputs(options, result) {
  if (!BRANCH_PATTERN.test(options.featureBranch ?? '') || options.featureBranch === 'main') {
    stop(result, 'inputs', 'feature branch must be an explicit non-main local branch name');
  }
  if (!SHA_PATTERN.test(options.featureHead ?? '')) {
    stop(result, 'inputs', 'feature head must be a lowercase 40-character commit SHA');
  }
  if (!SHA_PATTERN.test(options.expectedBase ?? '')) {
    stop(result, 'inputs', 'expected base must be a lowercase 40-character commit SHA');
  }
  if (!CONTRACT_HASH_PATTERN.test(options.contractHash ?? '')) {
    stop(result, 'inputs', 'contract hash must be a lowercase 64-character SHA-256');
  }
  if (!options.verifierReference) {
    stop(result, 'inputs', 'verifier decision reference is required');
  }
  if (!Array.isArray(options.gates) || options.gates.length === 0) {
    stop(result, 'inputs', 'at least one explicit npm package-script gate is required');
  }
  if (new Set(options.gates).size !== options.gates.length || options.gates.some((gate) => !GATE_PATTERN.test(gate))) {
    stop(result, 'inputs', 'gates must be unique npm script names containing only letters, digits, colon, underscore, or hyphen');
  }

  const evidence = options.evidence;
  if (!evidence || typeof evidence !== 'object') {
    stop(result, 'evidence', 'validated verifier evidence is required');
  }
  if (evidence.decision !== 'ACCEPT') {
    stop(result, 'evidence', 'verifier decision must be ACCEPT');
  }
  if (evidence.contract_hash !== options.contractHash) {
    stop(result, 'evidence', 'contract hash does not match the verifier result');
  }
  if (evidence.feature_head !== options.featureHead) {
    stop(result, 'evidence', 'accepted feature head does not match the verifier result');
  }
  if (evidence.base?.branch !== 'main' || evidence.base?.commit !== options.expectedBase) {
    stop(result, 'evidence', 'expected main baseline does not match the verifier result');
  }
  if (typeof evidence.task_id !== 'string' || evidence.task_id.length === 0) {
    stop(result, 'evidence', 'verifier result task_id is required');
  }
  if (evidence.effective_risk === 'high' && !options.humanApprovalReference) {
    stop(result, 'approval', 'high effective risk requires an explicit human approval reference');
  }
}

async function checked(result, runner, stage, command, args) {
  try {
    const response = await runner.run(command, args);
    return (response?.stdout ?? '').trim();
  } catch (error) {
    const detail = error?.stderr?.trim() || error?.message || 'command failed';
    stop(result, stage, `${command} ${args.join(' ')} failed: ${detail}`, error);
  }
}

async function ensureClean(result, runner, stage) {
  const status = await checked(
    result,
    runner,
    stage,
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
  );
  if (status !== '') {
    stop(result, stage, 'working tree must be clean');
  }
}

async function requireAncestor(result, runner, older, newer, label) {
  try {
    await runner.run('git', ['merge-base', '--is-ancestor', older, newer]);
  } catch (error) {
    stop(result, 'ancestry', `${label}: ${older} is not an ancestor of ${newer}`, error);
  }
}

async function rollbackLocalMain(result, runner, target) {
  try {
    await runner.run('git', ['reset', '--hard', target]);
    const localMain = (await runner.run('git', ['rev-parse', 'refs/heads/main'])).stdout.trim();
    const status = (
      await runner.run('git', ['status', '--porcelain=v1', '--untracked-files=all'])
    ).stdout.trim();
    result.resulting_main_sha = localMain;
    result.rollback_result = localMain === target && status === '' ? 'RESTORED' : 'FAILED';
  } catch {
    result.rollback_result = 'FAILED';
  }
}

export async function runVerifiedMerge(options, dependencies) {
  const result = createResult(options);
  const runner = dependencies?.runner;
  const npmCommand = dependencies?.npmCommand ?? (process.platform === 'win32' ? 'npm.cmd' : 'npm');

  if (!runner || typeof runner.run !== 'function') {
    stop(result, 'inputs', 'command runner is required');
  }
  validateInputs(options, result);

  let switchedToMain = false;
  let pushAttempted = false;
  let rollbackTarget = options.expectedBase;

  try {
    await checked(result, runner, 'preflight', 'git', ['rev-parse', '--show-toplevel']);
    await ensureClean(result, runner, 'preflight');
    const startingBranch = await checked(result, runner, 'preflight', 'git', ['branch', '--show-current']);
    if (!startingBranch) {
      stop(result, 'preflight', 'detached HEAD is not suitable for merge automation');
    }

    await checked(result, runner, 'fetch', 'git', ['fetch', '--prune', 'origin', 'main']);
    await ensureClean(result, runner, 'fetch');

    await checked(result, runner, 'refs', 'git', ['show-ref', '--verify', '--quiet', 'refs/heads/main']);
    await checked(result, runner, 'refs', 'git', ['show-ref', '--verify', '--quiet', 'refs/remotes/origin/main']);
    await checked(
      result,
      runner,
      'refs',
      'git',
      ['show-ref', '--verify', '--quiet', `refs/heads/${options.featureBranch}`],
    );

    const expectedBase = await checked(
      result,
      runner,
      'refs',
      'git',
      ['rev-parse', `${options.expectedBase}^{commit}`],
    );
    const originMain = await checked(
      result,
      runner,
      'refs',
      'git',
      ['rev-parse', 'refs/remotes/origin/main'],
    );
    const localMain = await checked(result, runner, 'refs', 'git', ['rev-parse', 'refs/heads/main']);
    const featureBranchHead = await checked(
      result,
      runner,
      'refs',
      'git',
      ['rev-parse', `refs/heads/${options.featureBranch}`],
    );
    const featureCommit = await checked(
      result,
      runner,
      'refs',
      'git',
      ['rev-parse', `${options.featureHead}^{commit}`],
    );

    if (expectedBase !== options.expectedBase) {
      stop(result, 'refs', 'expected base does not resolve to the supplied commit');
    }
    if (originMain !== options.expectedBase) {
      stop(result, 'baseline', 'origin/main does not equal the explicitly accepted base');
    }
    if (featureBranchHead !== options.featureHead || featureCommit !== options.featureHead) {
      stop(result, 'feature_head', 'local feature branch does not match the explicitly accepted feature HEAD');
    }

    await requireAncestor(result, runner, localMain, originMain, 'local main cannot fast-forward to origin/main');
    await requireAncestor(result, runner, options.expectedBase, options.featureHead, 'feature is not based on the accepted main');
    await requireAncestor(result, runner, originMain, options.featureHead, 'feature cannot fast-forward from origin/main');

    rollbackTarget = originMain;

    if (options.dryRun) {
      result.gates_run = options.gates.map((gate) => ({ gate, result: 'NOT_RUN' }));
      result.status = 'DRY_RUN';
      return result;
    }

    await checked(result, runner, 'switch_main', 'git', ['switch', 'main']);
    switchedToMain = true;
    await checked(
      result,
      runner,
      'update_main',
      'git',
      ['merge', '--ff-only', 'refs/remotes/origin/main'],
    );
    const updatedMain = await checked(result, runner, 'update_main', 'git', ['rev-parse', 'refs/heads/main']);
    if (updatedMain !== originMain) {
      stop(result, 'update_main', 'local main did not match origin/main after safe update');
    }

    await checked(result, runner, 'merge_feature', 'git', ['merge', '--ff-only', options.featureHead]);
    const mergedMain = await checked(result, runner, 'merge_feature', 'git', ['rev-parse', 'refs/heads/main']);
    result.resulting_main_sha = mergedMain;
    if (mergedMain !== options.featureHead) {
      stop(result, 'merge_feature', 'ff-only merge did not produce the accepted feature HEAD');
    }

    for (const gate of options.gates) {
      try {
        await runner.run(npmCommand, ['run', gate]);
        result.gates_run.push({ gate, result: 'PASS' });
      } catch (error) {
        result.gates_run.push({ gate, result: 'FAIL' });
        stop(result, 'main_verification', `main verification gate failed: ${gate}`, error);
      }
    }
    await ensureClean(result, runner, 'main_verification');

    await checked(result, runner, 'pre_push_fetch', 'git', ['fetch', '--prune', 'origin', 'main']);
    const refreshedOriginMain = await checked(
      result,
      runner,
      'pre_push_fetch',
      'git',
      ['rev-parse', 'refs/remotes/origin/main'],
    );
    rollbackTarget = refreshedOriginMain;
    if (refreshedOriginMain !== originMain) {
      stop(result, 'pre_push_race', 'origin/main advanced after verification; refusing to push');
    }

    const beforePushMain = await checked(
      result,
      runner,
      'pre_push',
      'git',
      ['rev-parse', 'refs/heads/main'],
    );
    if (beforePushMain !== options.featureHead) {
      stop(result, 'pre_push', 'local main changed after verification');
    }
    await ensureClean(result, runner, 'pre_push');

    pushAttempted = true;
    result.push_result = 'ATTEMPTED_UNCONFIRMED';
    await checked(result, runner, 'push', 'git', ['push', 'origin', 'main:main']);
    result.push_result = 'PUSHED';

    await checked(result, runner, 'post_push', 'git', ['fetch', '--prune', 'origin', 'main']);
    const finalLocalMain = await checked(
      result,
      runner,
      'post_push',
      'git',
      ['rev-parse', 'refs/heads/main'],
    );
    const finalOriginMain = await checked(
      result,
      runner,
      'post_push',
      'git',
      ['rev-parse', 'refs/remotes/origin/main'],
    );
    result.resulting_main_sha = finalLocalMain;
    if (finalLocalMain !== finalOriginMain || finalLocalMain !== options.featureHead) {
      stop(
        result,
        'post_push',
        'post-push verification failed; do not rewrite main, use a new hotfix branch',
      );
    }
    await ensureClean(result, runner, 'post_push');

    result.status = 'PASS';
    return result;
  } catch (error) {
    const failure =
      error instanceof VerifiedMergeError
        ? error
        : new VerifiedMergeError('unexpected', error?.message ?? 'unexpected failure', result, error);

    if (switchedToMain && !pushAttempted) {
      await rollbackLocalMain(result, runner, rollbackTarget);
    }
    throw failure;
  }
}