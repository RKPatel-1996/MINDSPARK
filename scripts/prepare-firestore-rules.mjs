import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const UID_VAR = process.env.MINDSPARK_OWNER_UID;
const PLACEHOLDER = 'REPLACE_WITH_OWNER_UID';
const TEMPLATE_PATH = path.join(rootDir, 'firestore.rules.template');
const OUT_DIR = path.join(rootDir, '.generated');
const OUT_PATH = path.join(OUT_DIR, 'firestore.rules');

if (!UID_VAR || UID_VAR.trim() === '') {
  console.error("ERROR: MINDSPARK_OWNER_UID environment variable is missing or blank.");
  process.exit(1);
}

const trimmedUid = UID_VAR.trim();
if (trimmedUid.length < 5 || !/^[A-Za-z0-9_-]+$/.test(trimmedUid)) {
  console.error("ERROR: MINDSPARK_OWNER_UID looks invalid. Must be alphanumeric/dashes.");
  process.exit(1);
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
if (!template.includes(PLACEHOLDER)) {
  console.error(`ERROR: Template missing expected placeholder: ${PLACEHOLDER}`);
  process.exit(1);
}

const generated = template.replaceAll(PLACEHOLDER, trimmedUid);
if (generated.includes(PLACEHOLDER)) {
  console.error("ERROR: Placeholder replacement failed.");
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
fs.writeFileSync(OUT_PATH, generated, 'utf8');

console.log(`Successfully prepared deployment rules. Length of UID: ${trimmedUid.length}`);
