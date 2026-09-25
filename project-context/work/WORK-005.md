# WORK-005 - B8 Stage 2 Core Cloud Readiness

Status: ACTIVE

## Aim

Verify MindSpark core cloud operation on Firebase Spark using Authentication + Firestore.

## Core scope

- Firebase Authentication
- Cloud Firestore
- single-owner Firestore rules
- browser/PWA persistence
- cross-owner rejection
- current text/code/math workflows

## Separate optional scope

Firebase Storage and legacy-media workflows are optional and are not prerequisites for core MindSpark operation.

## Safety

Target project: `mindspark-b8-test`

No Storage enablement.
No billing changes.
No cloud writes or deployments until local rule verification is complete and cloud mutation is explicitly authorized.
