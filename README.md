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
- **Java**: Required for running the Firebase Local Emulator Suite (for `npm run test:firestore-rules`).

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
MindSpark uses a strict single-owner Firestore security model. Core current operation uses Firebase Authentication + Firestore; Firebase Storage is optional for legacy media workflows.
To test the core Firestore rules against the local emulator (requires Java):
```bash
npm run test:firestore-rules
```
Use `npm run test:rules` only when deliberately validating the stricter legacy Firestore + Storage rule path.

*Note: Core Firestore rule generation and deployment requires setting the `MINDSPARK_OWNER_UID` environment variable. Storage rule deployment is separate and is only relevant when the optional legacy-media path is deliberately enabled and validated.*

### Backup and Recovery

See [MindSpark V1 Backup and Recovery](docs/MINDSPARK_BACKUP_RECOVERY.md) for the archive format, non-destructive restore workflow, conflict behavior, security model, and recovery limitations.

### Optional Legacy Image Storage & Offline Behavior
Normal text/code/math operation does not require Firebase Storage. For legacy media-bearing knowledge items, image metadata is stored with the normal application data while image bytes are stored separately in Firebase Storage.

When that optional media path is used, Firebase Storage image bytes are **not guaranteed to be available offline** unless the browser already has them cached. If an image URL cannot be resolved, Library and Review degrade to the stored alt text rather than blocking the workflow.

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
