import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('=== PWA Clean Build & Artifact Verification ===');

// Step 1: Clean dist directory to guarantee no stale build output
if (fs.existsSync(distDir)) {
  console.log('1. Cleaning existing dist/ directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
} else {
  console.log('1. dist/ directory clean (does not exist).');
}

// Step 2: Run fresh production build
console.log('2. Running fresh production build (vite build)...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (err) {
  console.error('Build failed during PWA verification sequence.');
  process.exit(1);
}

// Step 3: Run targeted build-artifact verification suite
console.log('3. Running PWA build-artifact verification test suite...');
try {
  execSync('npx vitest run src/v2/__tests__/pwaBuildArtifacts.test.ts', {
    cwd: rootDir,
    stdio: 'inherit',
  });
  console.log('=== PWA Build Artifact Verification Passed Successfully ===');
} catch (err) {
  console.error('PWA build artifact verification failed.');
  process.exit(1);
}
