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

Firebase deployment remains a completely separate process (detailed below) requiring an owner UID and Java for emulator rules tests. It covers both Firestore and Firebase Storage. The `npm run deploy` command **does not** deploy to Firebase.

Do not commit `dist/` or `.generated/` to version control.

## Firebase Firestore & Storage Deployment
MindSpark uses a strictly single-owner security model. Deployment is blocked until a valid owner UID is provided.

Deployment sequence:
1. Set `MINDSPARK_OWNER_UID` to your real Firebase Auth UID.
   ```bash
   export MINDSPARK_OWNER_UID=your-real-uid-here
   ```
2. Generate and verify both production rule sets:
   ```bash
   npm run prepare:firestore-rules
   npm run prepare:storage-rules
   npm run verify:firestore-rules
   npm run verify:storage-rules
   npm run preflight:production
   npm run test:rules
   ```
3. Deploy Firestore and Storage together:
   ```bash
   firebase deploy --only firestore,storage
   ```

Do not commit generated files under `.generated/` or your real UID.

### Image Storage Note
Knowledge-item image metadata is stored in Firestore, while image bytes are stored in Firebase Storage under the owner-scoped `knowledgeImages` path.

The current v1 PWA does not guarantee offline availability of Firebase Storage image bytes. Review and Library remain functional when an image cannot be resolved and fall back to the image alt text.
