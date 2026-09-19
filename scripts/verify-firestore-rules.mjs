import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const UID_VAR = process.env.MINDSPARK_OWNER_UID;
const PLACEHOLDER = 'REPLACE_WITH_OWNER_UID';
const OUT_PATH = path.join(rootDir, '.generated', 'firestore.rules');

if (!fs.existsSync(OUT_PATH)) {
  console.error("ERROR: Generated rules file does not exist. Run prepare-firestore-rules first.");
  process.exit(1);
}

if (!UID_VAR || UID_VAR.trim() === '') {
  console.error("ERROR: MINDSPARK_OWNER_UID environment variable is missing or blank.");
  process.exit(1);
}

const trimmedUid = UID_VAR.trim();
const content = fs.readFileSync(OUT_PATH, 'utf8');

if (content.includes(PLACEHOLDER)) {
  console.error("ERROR: Generated rules still contain the placeholder!");
  process.exit(1);
}

if (!content.includes(trimmedUid)) {
  console.error("ERROR: Generated rules do NOT contain the expected MINDSPARK_OWNER_UID!");
  process.exit(1);
}

console.log("Firestore rules verification passed.");
