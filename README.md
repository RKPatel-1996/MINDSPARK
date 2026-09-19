# MindSpark

MindSpark is a zero-decision opportunistic retrieval learning system powered by FSRS-6, designed to maximize durable memory gained per unit of spare time.

## Architecture & Packaging
MindSpark is a **PWA-first** application.
- The browser/PWA is the primary deployment target.
- The web source is the absolute authority.
- Capacitor is retained strictly as fallback insurance for Android, if ever required.
- Web deployment is via **GitHub Pages**.

## Prerequisites
- **Node.js**: 22 LTS, minimum 22.12.0 for the currently locked toolchain
- **Java**: Required for running the Firebase Local Emulator Suite (for `npm run test:rules`).

## Local Development

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

### Core Verification Commands

Maintain the integrity of the application with these essential checks:

```bash
# Verify TypeScript types
npm run typecheck

# Run the Vitest test suite
npm test

# Run a clean production build and verify generated PWA artifacts
npm run test:pwa-build

# Complete web-release verification (runs all three above)
npm run verify:web-release
```

### Firebase & Security Rules
MindSpark uses a strict single-owner security model.
To test rules against the local emulator (requires Java):
```bash
npm run test:rules
```
*Note: Production Firestore rule deployment requires setting the `MINDSPARK_OWNER_UID` environment variable.*

### Important Notes
- `dist/` and `.generated/` are generated artifact directories and **must not be committed** to version control.

### Troubleshooting Local Dev (Blank Screen)
If a previously previewed production build leaves a service worker controlling `localhost`, the Vite dev page can appear blank because the cached production HTML references hashed assets unavailable from the dev server.

**Recovery:**
1. Open Browser DevTools → Application → Service Workers
2. Unregister the `localhost` worker
3. Clear Cache Storage
4. Reload the page

This is local browser state and not something the application should automatically clear.
