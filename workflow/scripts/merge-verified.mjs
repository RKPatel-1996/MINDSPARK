import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import { parse as parseYaml } from 'yaml';

import { runVerifiedMerge, VerifiedMergeError } from '../lib/verified-merge.mjs';

const execFileAsync = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workflowDirectory = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(workflowDirectory, '..');

const usage = `Usage:
  npm run workflow:merge -- --dry-run --feature-branch <branch> --feature-head <sha> --expected-base <sha> --contract-hash <sha256> --verifier-result <path> --gate <npm-script> [--gate <npm-script>]
  npm run workflow:merge -- --execute --feature-branch <branch> --feature-head <sha> --expected-base <sha> --contract-hash <sha256> --verifier-result <path> --gate <npm-script> [--human-approval-reference <reference>]

--dry-run fetches and validates refs/evidence but never switches, merges, runs gates, or pushes.
--execute performs the verified integration flow and may push only main:main.
`;

class ProcessRunner {
  constructor(cwd) {
    this.cwd = cwd;
  }

  async run(command, args) {
    try {
      return await execFileAsync(command, args, {
        cwd: this.cwd,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
      });
    } catch (error) {
      error.stderr = error.stderr ?? '';
      error.stdout = error.stdout ?? '';
      throw error;
    }
  }
}

function parseArguments(argv) {
  const options = { gates: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') return { help: true };
    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (argument === '--execute') {
      options.execute = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`missing value for ${argument}`);
    }
    index += 1;

    switch (argument) {
      case '--feature-branch':
        options.featureBranch = value;
        break;
      case '--feature-head':
        options.featureHead = value;
        break;
      case '--expected-base':
        options.expectedBase = value;
        break;
      case '--contract-hash':
        options.contractHash = value;
        break;
      case '--verifier-result':
        options.verifierResultPath = value;
        break;
      case '--human-approval-reference':
        options.humanApprovalReference = value;
        break;
      case '--gate':
        options.gates.push(value);
        break;
      default:
        throw new Error(`unknown argument: ${argument}`);
    }
  }

  if (Boolean(options.dryRun) === Boolean(options.execute)) {
    throw new Error('choose exactly one of --dry-run or --execute');
  }
  return options;
}

async function loadYamlOrJson(filePath) {
  const source = await readFile(filePath, 'utf8');
  return path.extname(filePath).toLowerCase() === '.json' ? JSON.parse(source) : parseYaml(source);
}

function schemaErrors(validate) {
  return (validate.errors ?? [])
    .map((error) => `${error.instancePath || '/'} ${error.message}`)
    .join('; ');
}

async function loadValidatedEvidence(filePath) {
  const schema = JSON.parse(
    await readFile(path.join(workflowDirectory, 'schemas', 'verifier-result.schema.json'), 'utf8'),
  );
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  const evidence = await loadYamlOrJson(filePath);
  if (!validate(evidence)) {
    throw new Error(`verifier result failed schema validation: ${schemaErrors(validate)}`);
  }
  return evidence;
}

async function requirePackageScripts(gates) {
  const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
  for (const gate of gates) {
    if (typeof packageJson.scripts?.[gate] !== 'string') {
      throw new Error(`configured gate is not a package script: ${gate}`);
    }
  }
}

function emitFailure(error) {
  if (error instanceof VerifiedMergeError) {
    console.log(JSON.stringify(error.result, null, 2));
  } else {
    console.log(
      JSON.stringify(
        {
          status: 'FAIL',
          failure: {
            stage: 'cli',
            message: error?.message ?? 'unknown CLI failure',
          },
          push_result: 'NOT_ATTEMPTED',
        },
        null,
        2,
      ),
    );
  }
  process.exitCode = 1;
}

try {
  const parsed = parseArguments(process.argv.slice(2));
  if (parsed.help) {
    console.log(usage);
  } else {
    if (!parsed.verifierResultPath) {
      throw new Error('--verifier-result is required');
    }
    const verifierPath = path.resolve(parsed.verifierResultPath);
    const evidence = await loadValidatedEvidence(verifierPath);
    await requirePackageScripts(parsed.gates);

    const result = await runVerifiedMerge(
      {
        featureBranch: parsed.featureBranch,
        featureHead: parsed.featureHead,
        expectedBase: parsed.expectedBase,
        contractHash: parsed.contractHash,
        verifierReference: verifierPath,
        humanApprovalReference: parsed.humanApprovalReference,
        gates: parsed.gates,
        dryRun: parsed.dryRun,
        evidence,
      },
      {
        runner: new ProcessRunner(repositoryRoot),
      },
    );
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  emitFailure(error);
}