# MindSpark Deployment

## Web/PWA Deployment

MindSpark uses GitHub Pages for web deployment. The deployment process is gated by a rigorous verification step.

```bash
npm run verify:web-release
npm run deploy
```

- `verify:web-release` performs a typecheck, ordinary tests, a fresh production build, and PWA artifact verification.
- `predeploy` automatically runs this verification when `npm run deploy` is executed.
- The verified `dist/` directory produced during verification is the exact artifact published by `gh-pages`.

Firebase/Firestore deployment remains a completely separate process (detailed below) requiring an owner UID and Java for emulator rules tests. The `npm run deploy` command **does not** deploy to Firebase.

Do not commit `dist/` or `.generated/` to version control.

## Firestore Deployment
MindSpark uses a strictly single-owner security model. Deployment is blocked until a valid owner UID is provided.

Deployment sequence:
1. Set `MINDSPARK_OWNER_UID` to your real Firebase Auth UID.
   ```bash
   export MINDSPARK_OWNER_UID=your-real-uid-here
   ```
2. Run the deployment sequence:
   ```bash
   npm run prepare:firestore-rules
   npm run verify:firestore-rules
   npm run preflight:production
   npm run test:rules
   firebase deploy --only firestore
   ```

Do not commit `.generated/firestore.rules` or your real UID.
