import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let hasFailure = false;

function reportPass(msg) {
  console.log(`PASS | ${msg}`);
}

function reportFail(msg) {
  console.log(`FAIL | ${msg}`);
  hasFailure = true;
}

const UID_VAR = process.env.MINDSPARK_OWNER_UID;
const PLACEHOLDER = 'REPLACE_WITH_OWNER_UID';
let trimmedUid = '';

// Check 1: MINDSPARK_OWNER_UID exists and is non-blank
if (!UID_VAR || UID_VAR.trim() === '') {
  reportFail('MINDSPARK_OWNER_UID is missing or blank in environment variables.');
} else {
  trimmedUid = UID_VAR.trim();
  reportPass('MINDSPARK_OWNER_UID environment variable is set.');
}

const generatedRulesPath = path.join(rootDir, '.generated', 'firestore.rules');
const templateRulesPath = path.join(rootDir, 'firestore.rules.template');
const firebaseJsonPath = path.join(rootDir, 'firebase.json');
const gitignorePath = path.join(rootDir, '.gitignore');
const packageJsonPath = path.join(rootDir, 'package.json');

// Check 2: .generated/firestore.rules exists
let generatedContent = '';
if (!fs.existsSync(generatedRulesPath)) {
  reportFail('.generated/firestore.rules does not exist. Run prepare script first.');
} else {
  reportPass('.generated/firestore.rules exists.');
  generatedContent = fs.readFileSync(generatedRulesPath, 'utf8');
}

// Check 3 & 4: Generated rules placeholder/UID checks
if (generatedContent) {
  if (generatedContent.includes(PLACEHOLDER)) {
    reportFail('Generated rules still contain the REPLACE_WITH_OWNER_UID placeholder.');
  } else {
    reportPass('Generated rules do not contain the placeholder.');
  }

  if (trimmedUid && generatedContent.includes(trimmedUid)) {
    reportPass('Generated rules contain the expected owner UID.');
  } else if (trimmedUid) {
    reportFail('Generated rules do NOT contain the expected owner UID.');
  }
}

// Check 5: firebase.json points to the generated rules file
if (fs.existsSync(firebaseJsonPath)) {
  try {
    const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    if (firebaseJson.firestore && firebaseJson.firestore.rules === '.generated/firestore.rules') {
      reportPass('firebase.json points to .generated/firestore.rules.');
    } else {
      reportFail('firebase.json does not point to .generated/firestore.rules.');
    }
  } catch (e) {
    reportFail('firebase.json is malformed or unreadable.');
  }
} else {
  reportFail('firebase.json is missing.');
}

// Check 6: Canonical template contains placeholder and NOT real owner UID
if (fs.existsSync(templateRulesPath)) {
  const templateContent = fs.readFileSync(templateRulesPath, 'utf8');
  if (!templateContent.includes(PLACEHOLDER)) {
    reportFail('Canonical firestore.rules.template is missing the placeholder.');
  } else {
    reportPass('Canonical firestore.rules.template contains the placeholder.');
  }

  if (trimmedUid && templateContent.includes(trimmedUid)) {
    reportFail('Canonical firestore.rules.template contains the REAL owner UID! It should only have the placeholder.');
  } else {
    reportPass('Canonical firestore.rules.template does not contain the real owner UID.');
  }
} else {
  reportFail('Canonical firestore.rules.template is missing.');
}

// Check 7: generated directory in .gitignore
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.generated')) {
    reportPass('.generated directory is covered by .gitignore.');
  } else {
    reportFail('.generated directory is NOT covered by .gitignore.');
  }
} else {
  reportFail('.gitignore is missing.');
}

// Check 8: No Tauri dependency
if (fs.existsSync(packageJsonPath)) {
  const pkgContent = fs.readFileSync(packageJsonPath, 'utf8');
  if (pkgContent.includes('@tauri-apps/api') || pkgContent.includes('@tauri-apps/cli') || pkgContent.includes('tauri')) {
    // Specifically looking for tauri dependencies
    const pkgJson = JSON.parse(pkgContent);
    const hasTauriDeps = (pkgJson.dependencies && pkgJson.dependencies['@tauri-apps/api']) || 
                         (pkgJson.devDependencies && pkgJson.devDependencies['@tauri-apps/cli']);
    if (hasTauriDeps) {
      reportFail('Tauri dependencies found in package.json.');
    } else {
      reportPass('No Tauri dependencies found in package.json.');
    }
  } else {
    reportPass('No Tauri dependencies found in package.json.');
  }
}

if (fs.existsSync(path.join(rootDir, 'src-tauri'))) {
  reportFail('Tauri configuration directory (src-tauri) found.');
} else {
  reportPass('No Tauri configuration directory found.');
}

// Check 9: No authoritative Firestore /cardStates collection
const checkDirForString = (dir, str, excludeTests = false) => {
  let found = false;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (excludeTests && (file === '__tests__' || file === 'tests')) {
        continue;
      }
      if (checkDirForString(fullPath, str, excludeTests)) found = true;
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      if (excludeTests && (file.includes('.test.') || file.includes('.spec.'))) {
        continue;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(str)) found = true;
    }
  }
  return found;
};

const firebasePersistenceDir = path.join(rootDir, 'src', 'v2', 'persistence', 'firebase');
if (fs.existsSync(firebasePersistenceDir)) {
  if (checkDirForString(firebasePersistenceDir, 'cardStates') || checkDirForString(firebasePersistenceDir, '/cardStates')) {
    reportFail('Found /cardStates reference in Firestore persistence code.');
  } else {
    reportPass('No /cardStates collection reference found in Firestore persistence code.');
  }
} else {
  reportPass('Firebase persistence directory missing (cannot scan for cardStates).');
}

// Check 10: PWA Architecture & Configuration Invariants
let pkgJson = {};
try {
  pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (e) {
  reportFail('Failed to parse package.json for PWA preflight checks.');
}

// 10a. vite-plugin-pwa pinned at expected version 1.3.0
const pwaDepVersion = (pkgJson.devDependencies && pkgJson.devDependencies['vite-plugin-pwa']) ||
                      (pkgJson.dependencies && pkgJson.dependencies['vite-plugin-pwa']);
if (pwaDepVersion === '1.3.0') {
  reportPass('vite-plugin-pwa is pinned at 1.3.0.');
} else {
  reportFail(`vite-plugin-pwa is expected to be pinned at 1.3.0, found: ${pwaDepVersion}`);
}

// 10b. package.json contains the dedicated test:pwa-build verification script
if (pkgJson.scripts && pkgJson.scripts['test:pwa-build']) {
  reportPass('package.json contains dedicated test:pwa-build script.');
} else {
  reportFail('package.json is missing test:pwa-build script.');
}

// 10c. vite.config.ts configuration invariants
const viteConfigPath = path.join(rootDir, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

  if (viteConfig.includes("base: './'") || viteConfig.includes('base: "./"')) {
    reportPass("vite.config.ts has relative deployment base (base: './').");
  } else {
    reportFail("vite.config.ts must maintain relative base (base: './').");
  }

  if (viteConfig.includes("registerType: 'prompt'") || viteConfig.includes('registerType: "prompt"')) {
    reportPass("vite.config.ts configures prompt-based SW registration (registerType: 'prompt').");
  } else {
    reportFail("vite.config.ts must configure prompt-based SW registration (registerType: 'prompt').");
  }

  if (viteConfig.includes('injectRegister: false')) {
    reportPass('vite.config.ts disables automatic script injection (injectRegister: false).');
  } else {
    reportFail('vite.config.ts must disable automatic script injection (injectRegister: false).');
  }

  if (viteConfig.includes('manifest: false')) {
    reportPass('vite.config.ts uses explicit public/manifest.json (manifest: false).');
  } else {
    reportFail('vite.config.ts must use explicit public/manifest.json (manifest: false).');
  }
} else {
  reportFail('vite.config.ts is missing.');
}

// 10d. Approved React registration path exists and no duplicate/unauthorized SW registration mechanisms exist
const srcDir = path.join(rootDir, 'src');
const indexPath = path.join(rootDir, 'index.html');

let hasApprovedRegistration = false;
if (fs.existsSync(srcDir)) {
  hasApprovedRegistration = checkDirForString(srcDir, 'virtual:pwa-register/react');
}
if (hasApprovedRegistration) {
  reportPass("Approved React PWA registration path (virtual:pwa-register/react) found in src.");
} else {
  reportFail("Approved React PWA registration path (virtual:pwa-register/react) not found in src.");
}

let unauthorizedSwFound = false;
if (fs.existsSync(srcDir)) {
  if (checkDirForString(srcDir, 'serviceWorker.register', true) ||
      checkDirForString(srcDir, 'navigator.serviceWorker.register', true) ||
      checkDirForString(srcDir, 'registerSW.js', true)) {
    unauthorizedSwFound = true;
  }
}
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  if (indexHtml.includes('serviceWorker.register') ||
      indexHtml.includes('navigator.serviceWorker.register') ||
      indexHtml.includes('registerSW.js')) {
    unauthorizedSwFound = true;
  }
}

if (!unauthorizedSwFound) {
  reportPass('No unauthorized or duplicate service worker registration mechanisms found in src or index.html.');
} else {
  reportFail('Unauthorized or duplicate service worker registration found in src or index.html.');
}

// Java availability check
try {
  execSync('java -version', { stdio: 'ignore' });
  console.log("PASS | Java available. 'npm run test:rules' can be executed.");
} catch (e) {
  console.log("BLOCKED | Firestore emulator rules tests require Java");
}

if (hasFailure) {
  console.error("\\nPreflight checks failed! Do not deploy.");
  process.exit(1);
} else {
  console.log("\\nAll preflight checks passed successfully.");
}
