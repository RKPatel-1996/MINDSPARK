import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uid = process.env.MINDSPARK_OWNER_UID?.trim() ?? '';
const rules = path.join(root, '.generated', 'firestore.rules');
const placeholder = 'REPLACE_WITH_OWNER_UID';

if (!uid) throw new Error('MINDSPARK_OWNER_UID is missing.');
if (!fs.existsSync(rules)) throw new Error('.generated/firestore.rules is missing.');

const content = fs.readFileSync(rules, 'utf8');
if (content.includes(placeholder)) throw new Error('Owner placeholder remains in generated rules.');
if (!content.includes(uid)) throw new Error('Generated rules do not contain expected owner UID.');

console.log('Core Firebase Firestore preflight passed.');
