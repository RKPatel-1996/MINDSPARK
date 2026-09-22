import assert from 'node:assert/strict';
import test from 'node:test';

import { runVerifiedMerge, VerifiedMergeError } from '../lib/verified-merge.mjs';

const BASE = 'a'.repeat(40);
const FEATURE = 'b'.repeat(40);
const RACE = 'c'.repeat(40);
const CONTRACT_HASH = 'd'.repeat(64);
const FEATURE_BRANCH = 'task/example-feature';

function commandFailure(message) {
  return Object.assign(new Error(message), { stderr: message, stdout: '' });
}

class FakeRunner {
  constructor(overrides = {}) {
    this.calls = [];
    this.currentBranch = 'integration-runner';
    this.clean = overrides.clean ?? true;
    this.localMain = BASE;
    this.originMain = BASE;
    this.featureRef = overrides.featureRef ?? FEATURE;
    this.nonFastForward = overrides.nonFastForward ?? false;
    this.failedGate = overrides.failedGate ?? null;
    this.raceMain = overrides.raceMain ?? null;
    this.pushFailure = overrides.pushFailure ?? false;
    this.fetchCount = 0;
    this.pushes = [];
  }

  async run(command, args) {
    this.calls.push({ command, args: [...args] });

    if (command === 'npm') {
      const gate = args[1];
      if (gate === this.failedGate) throw commandFailure(`gate failed: ${gate}`);
      return { stdout: '', stderr: '' };
    }
    if (command !== 'git') throw commandFailure(`unexpected command: ${command}`);

    if (args[0] === 'status') {
      return { stdout: this.clean ? '' : ' M dirty-file\n', stderr: '' };
    }
    if (args[0] === 'branch' && args[1] === '--show-current') {
      return { stdout: `${this.currentBranch}\n`, stderr: '' };
    }
    if (args[0] === 'fetch') {
      this.fetchCount += 1;
      if (this.fetchCount === 2 && this.raceMain) this.originMain = this.raceMain;
      return { stdout: '', stderr: '' };
    }
    if (args[0] === 'show-ref') {
      return { stdout: '', stderr: '' };
    }
    if (args[0] === 'rev-parse') {
      const ref = args[1];
      if (ref === '--show-toplevel') return { stdout: '/repo\n', stderr: '' };
      if (ref === `${BASE}^{commit}`) return { stdout: `${BASE}\n`, stderr: '' };
      if (ref === `${FEATURE}^{commit}`) return { stdout: `${FEATURE}\n`, stderr: '' };
      if (ref === 'refs/remotes/origin/main') return { stdout: `${this.originMain}\n`, stderr: '' };
      if (ref === 'refs/heads/main') return { stdout: `${this.localMain}\n`, stderr: '' };
      if (ref === `refs/heads/${FEATURE_BRANCH}`) {
        return { stdout: `${this.featureRef}\n`, stderr: '' };
      }
      throw commandFailure(`unknown rev: ${ref}`);
    }
    if (args[0] === 'merge-base') {
      const older = args[2];
      const newer = args[3];
      if (this.nonFastForward && newer === FEATURE && older === BASE) {
        throw commandFailure('not an ancestor');
      }
      return { stdout: '', stderr: '' };
    }
    if (args[0] === 'switch') {
      this.currentBranch = args[1];
      return { stdout: '', stderr: '' };
    }
    if (args[0] === 'merge') {
      assert.equal(args[1], '--ff-only');
      if (args[2] === 'refs/remotes/origin/main') this.localMain = this.originMain;
      else if (args[2] === FEATURE) this.localMain = FEATURE;
      else throw commandFailure(`unexpected merge target: ${args[2]}`);
      return { stdout: '', stderr: '' };
    }
    if (args[0] === 'reset') {
      assert.equal(args[1], '--hard');
      this.localMain = args[2];
      return { stdout: '', stderr: '' };
    }
    if (args[0] === 'push') {
      this.pushes.push([...args]);
      if (this.pushFailure) throw commandFailure('push outcome is unknown');
      this.originMain = this.localMain;
      return { stdout: '', stderr: '' };
    }

    throw commandFailure(`unexpected git arguments: ${args.join(' ')}`);
  }
}

function acceptedEvidence(overrides = {}) {
  return {
    task_id: 'example-task',
    contract_hash: CONTRACT_HASH,
    base: { branch: 'main', commit: BASE },
    feature_head: FEATURE,
    decision: 'ACCEPT',
    reject_class: null,
    effective_risk: 'normal',
    contract_violations: [],
    diff_issues: [],
    compatibility_findings: [],
    tests_run: [{ command: 'npm run gate:one', result: 'PASS' }],
    missing_evidence: [],
    remaining_risks: [],
    ...overrides,
  };
}

function options(overrides = {}) {
  return {
    featureBranch: FEATURE_BRANCH,
    featureHead: FEATURE,
    expectedBase: BASE,
    contractHash: CONTRACT_HASH,
    verifierReference: '/evidence/verifier-result.yml',
    gates: ['gate:one', 'gate:two'],
    dryRun: false,
    evidence: acceptedEvidence(),
    ...overrides,
  };
}

async function run(fake, overrides = {}) {
  return runVerifiedMerge(options(overrides), { runner: fake, npmCommand: 'npm' });
}

function gitCalls(fake, operation) {
  return fake.calls.filter((call) => call.command === 'git' && call.args[0] === operation);
}

test('clean successful integration uses ff-only and pushes only main', async () => {
  const fake = new FakeRunner();
  const result = await run(fake);

  assert.equal(result.status, 'PASS');
  assert.equal(result.resulting_main_sha, FEATURE);
  assert.equal(result.push_result, 'PUSHED');
  assert.deepEqual(result.gates_run, [
    { gate: 'gate:one', result: 'PASS' },
    { gate: 'gate:two', result: 'PASS' },
  ]);
  assert.equal(fake.localMain, FEATURE);
  assert.equal(fake.originMain, FEATURE);
  assert.equal(gitCalls(fake, 'merge').length, 2);
  assert.ok(gitCalls(fake, 'merge').every((call) => call.args[1] === '--ff-only'));
  assert.deepEqual(fake.pushes, [['push', 'origin', 'main:main']]);
});

test('dirty working tree is rejected before fetch or push', async () => {
  const fake = new FakeRunner({ clean: false });

  await assert.rejects(run(fake), (error) => {
    assert.ok(error instanceof VerifiedMergeError);
    assert.equal(error.stage, 'preflight');
    return true;
  });
  assert.equal(gitCalls(fake, 'fetch').length, 0);
  assert.equal(fake.pushes.length, 0);
});

test('feature HEAD mismatch is rejected', async () => {
  const fake = new FakeRunner({ featureRef: RACE });

  await assert.rejects(run(fake), (error) => {
    assert.equal(error.stage, 'feature_head');
    return true;
  });
  assert.equal(gitCalls(fake, 'switch').length, 0);
  assert.equal(fake.pushes.length, 0);
});

test('verifier decision other than ACCEPT is rejected without Git commands', async () => {
  const fake = new FakeRunner();
  const evidence = acceptedEvidence({ decision: 'REJECT', reject_class: 'A' });

  await assert.rejects(run(fake, { evidence }), (error) => {
    assert.equal(error.stage, 'evidence');
    return true;
  });
  assert.equal(fake.calls.length, 0);
});

test('non-fast-forward ancestry mismatch is rejected', async () => {
  const fake = new FakeRunner({ nonFastForward: true });

  await assert.rejects(run(fake), (error) => {
    assert.equal(error.stage, 'ancestry');
    return true;
  });
  assert.equal(gitCalls(fake, 'switch').length, 0);
  assert.equal(fake.pushes.length, 0);
});

test('main verification failure prevents push and restores local main', async () => {
  const fake = new FakeRunner({ failedGate: 'gate:two' });

  await assert.rejects(run(fake), (error) => {
    assert.equal(error.stage, 'main_verification');
    assert.equal(error.result.rollback_result, 'RESTORED');
    assert.deepEqual(error.result.gates_run, [
      { gate: 'gate:one', result: 'PASS' },
      { gate: 'gate:two', result: 'FAIL' },
    ]);
    return true;
  });
  assert.equal(fake.pushes.length, 0);
  assert.equal(fake.localMain, BASE);
  assert.deepEqual(gitCalls(fake, 'reset').at(-1)?.args, ['reset', '--hard', BASE]);
});

test('origin advancement before push stops and restores main to refreshed origin', async () => {
  const fake = new FakeRunner({ raceMain: RACE });

  await assert.rejects(run(fake), (error) => {
    assert.equal(error.stage, 'pre_push_race');
    assert.equal(error.result.rollback_result, 'RESTORED');
    return true;
  });
  assert.equal(fake.pushes.length, 0);
  assert.equal(fake.localMain, RACE);
  assert.deepEqual(gitCalls(fake, 'reset').at(-1)?.args, ['reset', '--hard', RACE]);
});

test('force-push path is impossible', async () => {
  const fake = new FakeRunner();
  await run(fake);

  const pushCalls = gitCalls(fake, 'push');
  assert.equal(pushCalls.length, 1);
  assert.ok(pushCalls.every((call) => call.args.every((argument) => !argument.includes('force'))));
});

test('feature branch push path is impossible', async () => {
  const fake = new FakeRunner();
  await run(fake);

  assert.deepEqual(fake.pushes, [['push', 'origin', 'main:main']]);
  assert.ok(fake.pushes.flat().every((argument) => !argument.includes(FEATURE_BRANCH)));
});

test('dry-run validates refs without switching, merging, running gates, or pushing', async () => {
  const fake = new FakeRunner();
  const result = await run(fake, { dryRun: true });

  assert.equal(result.status, 'DRY_RUN');
  assert.ok(result.gates_run.every((gate) => gate.result === 'NOT_RUN'));
  assert.equal(gitCalls(fake, 'switch').length, 0);
  assert.equal(gitCalls(fake, 'merge').length, 0);
  assert.equal(gitCalls(fake, 'push').length, 0);
  assert.equal(fake.calls.filter((call) => call.command === 'npm').length, 0);
});

test('high effective risk requires explicit human approval evidence', async () => {
  const fake = new FakeRunner();
  const evidence = acceptedEvidence({ effective_risk: 'high' });

  await assert.rejects(run(fake, { evidence }), (error) => {
    assert.equal(error.stage, 'approval');
    return true;
  });
  assert.equal(fake.calls.length, 0);
});
test('push failure is reported as unconfirmed and never triggers local history rewrite', async () => {
  const fake = new FakeRunner({ pushFailure: true });

  await assert.rejects(run(fake), (error) => {
    assert.equal(error.stage, 'push');
    assert.equal(error.result.push_result, 'ATTEMPTED_UNCONFIRMED');
    assert.equal(error.result.rollback_result, 'NOT_REQUIRED');
    return true;
  });
  assert.equal(fake.pushes.length, 1);
  assert.equal(fake.localMain, FEATURE);
  assert.equal(gitCalls(fake, 'reset').length, 0);
});