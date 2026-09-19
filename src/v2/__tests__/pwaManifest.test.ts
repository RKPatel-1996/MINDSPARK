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

describe('MindSpark PWA Source Manifest and Install Metadata', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const publicDir = path.join(rootDir, 'public');
  const manifestPath = path.join(publicDir, 'manifest.json');

  it('manifest exists in public directory and conforms to PWA install requirements', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest: WebAppManifest = JSON.parse(raw);

    // Identity
    expect(manifest.name).toBe('MindSpark');
    expect(manifest.short_name).toBe('MindSpark');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.description).toBeDefined();
    expect(manifest.description!.length).toBeGreaterThan(10);

    // Display & Navigation
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');

    // Visual theme
    expect(manifest.background_color.toLowerCase()).not.toBe('#000000'); // Neutral startup, not OLED black
    expect(manifest.background_color.toLowerCase()).toBe('#f4f4f0');
    expect(manifest.theme_color).toBe('#426A5A');

    // Icons
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const sizes = manifest.icons.map(icon => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');

    // Maskable icon check
    const maskableIcon = manifest.icons.find(icon => icon.purpose?.includes('maskable'));
    expect(maskableIcon).toBeDefined();

    // Verify all referenced icons exist in public directory
    for (const icon of manifest.icons) {
      const iconFileName = path.basename(icon.src);
      const iconFilePath = path.join(publicDir, iconFileName);
      expect(fs.existsSync(iconFilePath), `Referenced icon ${icon.src} (${iconFileName}) should exist in ${publicDir}`).toBe(true);
    }
  });

  it('index.html contains manifest link, title, and mobile web app meta tags', () => {
    const indexPath = path.join(rootDir, 'index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');

    expect(html).toContain('<title>MindSpark</title>');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('name="mobile-web-app-capable"');
    expect(html).toContain('name="apple-mobile-web-app-capable"');
  });
});
