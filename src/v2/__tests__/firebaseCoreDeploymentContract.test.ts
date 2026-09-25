import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Firebase core deployment contract', () => {
  it('keeps the Spark core path Firestore-only while preserving the full Storage path', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const scripts = pkg.scripts ?? {};

    expect(scripts['preflight:firebase-core']).toBe('node scripts/preflight-firebase-core.mjs');

    const core = scripts['test:firestore-rules'];
    expect(core).toContain('--only firestore');
    expect(core).toContain('firestore.rules.test.ts');
    expect(core).not.toContain('storage');

    const full = scripts['test:rules'];
    expect(full).toContain('prepare:test-storage-rules');
    expect(full).toContain('--only firestore,storage');

    const preflight = fs.readFileSync(path.join(process.cwd(), 'scripts', 'preflight-firebase-core.mjs'), 'utf8');
    expect(preflight).toContain('MINDSPARK_OWNER_UID');
    expect(preflight).toContain('.generated');
    expect(preflight).not.toMatch(/storage/i);
  });
});
