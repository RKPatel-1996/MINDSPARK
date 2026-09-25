# Active Work

ACTIVE_WORK: WORK-005

Title: B8 Stage 2 Core Cloud Readiness

Status: ACTIVE

Target Firebase project: `mindspark-b8-test`

Current phase: Auth + Firestore real-cloud round-trip is verified. Firestore rules and required composite indexes are deployed, and the Library bootstrap/read-path defect found during cloud validation is repaired and regression-tested. Remaining acceptance is cross-owner rejection, browser offline persistence, installed-PWA Firestore operation, and text-only/current backup-restore validation.

Safety: Firebase Storage remains disabled and optional. No billing changes. Additional cloud mutations or deployments require explicit authorization.
