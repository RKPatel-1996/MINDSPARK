import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

interface ManifestIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: string;
}

interface WebAppManifest {
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  scope: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
}

describe('MindSpark PWA Fresh Build Artifact Verification', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const distDir = path.join(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');
  const distManifestPath = path.join(distDir, 'manifest.json');
  const swPath = path.join(distDir, 'sw.js');

  it('1. verifies dist/ and production manifest exist with valid metadata', () => {
    expect(fs.existsSync(distDir), 'dist/ directory must exist').toBe(true);
    expect(fs.existsSync(distManifestPath), 'dist/manifest.json must exist').toBe(true);

    const raw = fs.readFileSync(distManifestPath, 'utf-8');
    const manifest: WebAppManifest = JSON.parse(raw);

    expect(manifest.name).toBe('MindSpark');
    expect(manifest.short_name).toBe('MindSpark');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.theme_color).toBe('#426A5A');
  });

  it('2. verifies all referenced icons exist in build output', () => {
    const raw = fs.readFileSync(distManifestPath, 'utf-8');
    const manifest: WebAppManifest = JSON.parse(raw);

    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of manifest.icons) {
      const iconFileName = path.basename(icon.src);
      const iconFilePath = path.join(distDir, iconFileName);
      expect(fs.existsSync(iconFilePath), `Built icon ${iconFileName} should exist in dist/`).toBe(true);
    }
  });

  it('3. verifies service worker exists', () => {
    expect(fs.existsSync(swPath), 'dist/sw.js should exist').toBe(true);
  });

  it('4. verifies exactly one registration mechanism exists (no registerSW.js in index.html, handled in app bundle)', () => {
    expect(fs.existsSync(distIndexPath), 'dist/index.html should exist').toBe(true);
    const distIndexContent = fs.readFileSync(distIndexPath, 'utf-8');

    // Ensure only one registration path exists: explicit React registration in the app bundle,
    // and NO duplicate script tag in index.html:
    expect(distIndexContent).not.toContain('registerSW.js');

    // Confirm that the bundled client code contains the Workbox / service worker registration
    const assetsDir = path.join(distDir, 'assets');
    const assetFiles = fs.readdirSync(assetsDir);
    const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));
    const combinedJs = jsFiles.map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf-8')).join('\n');

    expect(combinedJs).toMatch(/serviceWorker|workbox/i);
    expect(combinedJs).toContain('./sw.js');
  });

  it('5. verifies static shell assets appear in service worker precache output', () => {
    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('precacheAndRoute(');

    // Static application shell assets (handles minified & unminified keys):
    expect(swContent).toMatch(/(?:"url"|url):\s*"index\.html"/);
    expect(swContent).toMatch(/(?:"url"|url):\s*"manifest\.json"/);
    expect(swContent).toMatch(/(?:"url"|url):\s*"assets\/index-.*\.js"/);
    expect(swContent).toMatch(/(?:"url"|url):\s*"assets\/index-.*\.css"/);
    expect(swContent).toMatch(/(?:"url"|url):\s*"icon-192\.png"/);
    expect(swContent).toMatch(/(?:"url"|url):\s*"icon-512\.png"/);
    expect(swContent).toMatch(/(?:"url"|url):\s*"icon\.svg"/);
    expect(swContent).toMatch(/(?:"url"|url):\s*"icon-maskable-512\.png"/);
  });

  it('6. verifies no Firestore/Firebase network runtime-caching rule was introduced', () => {
    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Confirm no Firebase / Firestore / Google Auth endpoints are cached or intercepted
    expect(swContent).not.toContain('firestore.googleapis.com');
    expect(swContent).not.toContain('identitytoolkit.googleapis.com');
    expect(swContent).not.toContain('securetoken.googleapis.com');
    expect(swContent).not.toContain('firebaseio.com');

    // Confirm no aggressive runtime caching or push / background sync features
    expect(swContent).not.toContain("self.addEventListener('push'");
    expect(swContent).not.toContain("self.addEventListener('sync'");
    expect(swContent).not.toContain('NetworkFirst');
    expect(swContent).not.toContain('StaleWhileRevalidate');
  });

  it('7. verifies relative-base / GitHub Pages deployment compatibility', () => {
    const distIndexContent = fs.readFileSync(distIndexPath, 'utf-8');

    // Assets must resolve relatively
    expect(distIndexContent).toContain('src="./assets/');
    expect(distIndexContent).toContain('href="./assets/');
    expect(distIndexContent).toContain('href="./manifest.json"');
    expect(distIndexContent).toContain('href="./icon.svg"');
    expect(distIndexContent).not.toContain('registerSW.js');
  });
});
