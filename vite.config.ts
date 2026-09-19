import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults } from 'vitest/config';

export default defineConfig(({ mode }) => {
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        VitePWA({
          registerType: 'prompt',
          injectRegister: false,
          manifest: false, // Use our explicit public/manifest.json
          workbox: {
            globPatterns: ['**/*.{js,css,html,png,svg,json}'],
            // No runtimeCaching rules added - only precached static application shell assets
          },
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        exclude: [...configDefaults.exclude],
        setupFiles: ['./src/v2/app/__tests__/setup.ts']
      }
    };
});
