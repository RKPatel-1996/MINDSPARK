import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PLACEHOLDER = 'REPLACE_WITH_OWNER_UID';
const CONFIG_PATH = path.join(rootDir, 'test-config', 'firestore-test-owner.json');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`ERROR: Test owner configuration not found at ${CONFIG_PATH}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const TEST_OWNER_UID = config.ownerUid;

if (!TEST_OWNER_UID || typeof TEST_OWNER_UID !== 'string') {
  console.error(`ERROR: Invalid or missing ownerUid in ${CONFIG_PATH}`);
  process.exit(1);
}

const TEMPLATE_PATH = path.join(rootDir, 'firestore.rules.template');
const OUT_DIR = path.join(rootDir, '.generated');
const OUT_PATH = path.join(OUT_DIR, 'firestore.test.rules');

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`ERROR: Canonical template not found at ${TEMPLATE_PATH}`);
  process.exit(1);
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
if (!template.includes(PLACEHOLDER)) {
  console.error(`ERROR: Template missing expected placeholder: ${PLACEHOLDER}`);
  process.exit(1);
}

const generated = template.replaceAll(PLACEHOLDER, TEST_OWNER_UID);

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
fs.writeFileSync(OUT_PATH, generated, 'utf8');

console.log(`Successfully prepared test deployment rules with test UID: ${TEST_OWNER_UID}`);
