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
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              const moduleId = id.replace(/\\/g, '/');

              if (
                moduleId.includes('/node_modules/@firebase/firestore/') ||
                moduleId.includes('/node_modules/firebase/firestore/')
              ) {
                return 'vendor-firestore';
              }

              if (
                moduleId.includes('/node_modules/@firebase/webchannel-wrapper/') ||
                moduleId.includes('/node_modules/idb/') ||
                moduleId.includes('/node_modules/re2js/')
              ) {
                return 'vendor-firestore-transport';
              }

              if (
                moduleId.includes('/node_modules/@firebase/auth/') ||
                moduleId.includes('/node_modules/firebase/auth/')
              ) {
                return 'vendor-firebase-auth';
              }

              if (
                moduleId.includes('/node_modules/@firebase/') ||
                moduleId.includes('/node_modules/firebase/')
              ) {
                return 'vendor-firebase-core';
              }

              if (
                moduleId.includes('/node_modules/react/') ||
                moduleId.includes('/node_modules/react-dom/') ||
                moduleId.includes('/node_modules/react-router/') ||
                moduleId.includes('/node_modules/react-router-dom/') ||
                moduleId.includes('/node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }

              if (moduleId.includes('/node_modules/zod/')) {
                return 'vendor-zod';
              }

              if (moduleId.includes('/node_modules/ts-fsrs/')) {
                return 'vendor-fsrs';
              }

              return undefined;
            },
          },
        },
      },
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
