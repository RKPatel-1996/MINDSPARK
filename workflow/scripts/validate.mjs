import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import { parse as parseYaml } from 'yaml';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workflowDirectory = path.resolve(scriptDirectory, '..');

const paths = {
  contractSchema: path.join(workflowDirectory, 'schemas', 'task-contract.schema.json'),
  verifierSchema: path.join(workflowDirectory, 'schemas', 'verifier-result.schema.json'),
  mapSchema: path.join(workflowDirectory, 'schemas', 'verify-map.schema.json'),
  contractExample: path.join(workflowDirectory, 'examples', 'task-contract.example.yml'),
  verifierExample: path.join(workflowDirectory, 'examples', 'verifier-result.example.yml'),
  verifyMap: path.join(workflowDirectory, 'verify-map.yml'),
};

const expectedAreas = [
  'domain_schema',
  'import',
  'library',
  'review_fsrs',
  'backup_restore',
  'firebase_persistence',
  'auth',
  'firestore_rules',
  'storage_legacy_media',
  'pwa_release',
  'documentation_tests_only',
];

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function loadPacket(filePath) {
  const source = await readFile(filePath, 'utf8');
  return path.extname(filePath).toLowerCase() === '.json' ? JSON.parse(source) : parseYaml(source);
}

function formatErrors(validate) {
  return (validate.errors ?? [])
    .map((error) => `${error.instancePath || '/'} ${error.message}`)
    .join('; ');
}

function requireValid(label, validate, value) {
  if (!validate(value)) {
    throw new Error(`${label} did not validate: ${formatErrors(validate)}`);
  }
}

function requireInvalid(label, validate, value) {
  if (validate(value)) {
    throw new Error(`${label} unexpectedly validated`);
  }
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = {
  contract: ajv.compile(await loadJson(paths.contractSchema)),
  result: ajv.compile(await loadJson(paths.verifierSchema)),
  map: ajv.compile(await loadJson(paths.mapSchema)),
};

async function validateOne(kind, filePath) {
  const validate = validators[kind];
  if (!validate) {
    throw new Error(`Unknown packet kind '${kind}'. Use contract, result, or map.`);
  }
  const resolvedPath = path.resolve(filePath);
  requireValid(`${kind} packet`, validate, await loadPacket(resolvedPath));
  console.log(`PASS ${kind}: ${resolvedPath}`);
}

async function selfTest() {
  const contract = await loadPacket(paths.contractExample);
  requireValid('example contract', validators.contract, contract);

  const malformedRisk = structuredClone(contract);
  malformedRisk.risk = 'critical';
  requireInvalid('malformed risk', validators.contract, malformedRisk);

  const missingRequired = structuredClone(contract);
  delete missingRequired.objective;
  requireInvalid('missing required field', validators.contract, missingRequired);

  const verifierResult = await loadPacket(paths.verifierExample);
  requireValid('example verifier result', validators.result, verifierResult);
  const expectedHash = await sha256(paths.contractExample);
  if (verifierResult.contract_hash !== expectedHash) {
    throw new Error(`verifier contract_hash mismatch: expected ${expectedHash}`);
  }

  const malformedDecision = structuredClone(verifierResult);
  malformedDecision.decision = 'APPROVE';
  requireInvalid('malformed verifier decision', validators.result, malformedDecision);

  const verifyMap = await loadPacket(paths.verifyMap);
  requireValid('verify map', validators.map, verifyMap);
  const actualAreas = Object.keys(verifyMap.areas).sort();
  const requiredAreas = [...expectedAreas].sort();
  if (JSON.stringify(actualAreas) !== JSON.stringify(requiredAreas)) {
    throw new Error('verify map semantic areas do not match the required top-level area set');
  }

  const checks = [
    'example contract validates',
    'malformed risk fails',
    'missing required field fails',
    'example verifier result validates and matches contract hash',
    'malformed verifier decision fails',
    'verify-map.yml validates',
    'verify-map.yml contains every required semantic area',
  ];
  for (const check of checks) console.log(`PASS ${check}`);
  console.log(`Workflow infrastructure validation passed (${checks.length} checks).`);
}

const [kind, filePath] = process.argv.slice(2);
if (kind || filePath) {
  if (!kind || !filePath) {
    throw new Error('Usage: validate.mjs <contract|result|map> <packet-path>');
  }
  await validateOne(kind, filePath);
} else {
  await selfTest();
}