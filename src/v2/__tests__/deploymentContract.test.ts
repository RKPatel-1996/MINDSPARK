import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Deployment Script Contract', () => {
  it('enforces deterministic deployment verification without a second build', () => {
    const pkgJsonPath = path.join(process.cwd(), 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const scripts = pkgJson.scripts || {};

    const webRelease = scripts['verify:web-release'];

    // 1. verify:web-release exists and runs the required sequence in order
    expect(webRelease).toBeDefined();
    const typecheckIdx = webRelease.indexOf('npm run typecheck');
    const testIdx = webRelease.indexOf('npm test');
    const pwaBuildIdx = webRelease.indexOf('npm run test:pwa-build');

    expect(typecheckIdx).toBeGreaterThanOrEqual(0);
    expect(testIdx).toBeGreaterThan(typecheckIdx);
    expect(pwaBuildIdx).toBeGreaterThan(testIdx);

    // It must NOT contain a separate `npm run build` command
    const withoutPwaBuild = webRelease.replace('npm run test:pwa-build', '');
    expect(withoutPwaBuild).not.toContain('npm run build');

    // 2. predeploy invokes the verified release path and DOES NOT run a second build
    expect(scripts['predeploy']).toBe('npm run verify:web-release');
    expect(scripts['predeploy']).not.toContain('npm run build'); // MUST NOT rebuild after verification

    // 3. deploy still publishes the dist directory
    expect(scripts['deploy']).toBeDefined();
    expect(scripts['deploy']).toContain('gh-pages');
    expect(scripts['deploy']).toContain('-d dist');
  });
});
