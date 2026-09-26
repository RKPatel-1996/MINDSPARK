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

Firebase deployment remains a completely separate process requiring an owner UID and Java for emulator rule tests. The core path uses Authentication + Firestore only; the Storage-aware rule path is retained separately for optional legacy media. The `npm run deploy` command **does not** deploy to Firebase.

Do not commit `dist/` or `.generated/` to version control.

## Firebase Core Deployment — Spark Compatible
MindSpark uses a strictly single-owner Firestore security model. Core deployment uses Authentication + Firestore and does not require Firebase Storage.

Deployment sequence:
1. Set `MINDSPARK_OWNER_UID` to your real Firebase Auth UID.
   ```bash
   export MINDSPARK_OWNER_UID=your-real-uid-here
   ```
2. Generate and verify the core Firestore rules:
   ```bash
   npm run prepare:firestore-rules
   npm run verify:firestore-rules
   npm run preflight:firebase-core
   npm run test:firestore-rules
   ```
3. Deploy Firestore only:
   ```bash
   firebase deploy --only firestore --project <target-project-id>
   ```

Do not commit generated files under `.generated/` or your real UID. Any Firebase deployment remains an explicit, separately authorized operation.

### Optional Legacy Image Storage
Normal text/code/math operation does not require Firebase Storage. For legacy media-bearing records, image metadata is stored in Firestore while image bytes are stored in Firebase Storage under the owner-scoped `knowledgeImages` path.

When that optional media path is used, the PWA does not guarantee offline availability of Firebase Storage image bytes. Review and Library remain functional when an image cannot be resolved and fall back to the stored image alt text.

## Optional Legacy Media

Firebase Storage is optional and only required for legacy media-bearing workflows. `npm run preflight:production` and `npm run test:rules` retain the stricter Firestore + Storage verification path; they are not prerequisites for the current Firestore-only core path.
