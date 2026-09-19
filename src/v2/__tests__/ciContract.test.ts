import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CI Workflow Contract', () => {
  it('ensures web-release-verification workflow does not contain deployment commands', () => {
    const workflowPath = path.resolve(process.cwd(), '.github/workflows/web-release-verification.yml');
    
    // Workflow must exist
    expect(fs.existsSync(workflowPath)).toBe(true);
    
    const content = fs.readFileSync(workflowPath, 'utf8');
    
    // Must contain correct verification setup
    expect(content).toContain('npm ci');
    expect(content).toContain('npm run verify:web-release');
    
    // Must use approved Node runtime
    expect(content).toContain("node-version: '22.12.0'");
    
    // Must NEVER contain deployment or unrelated firebase commands
    expect(content).not.toMatch(/npm run deploy/);
    expect(content).not.toMatch(/gh-pages/);
    expect(content).not.toMatch(/firebase deploy/);
  });
});
