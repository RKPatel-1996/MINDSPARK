# Active Work

ACTIVE_WORK: WORK-005

Title: B8 Stage 2 Core Cloud Readiness

Status: ACTIVE

Target Firebase project: `mindspark-b8-test`

Current phase: Auth + Firestore real-cloud round-trip, browser offline persistence/reconnect, installed-PWA Firestore operation, and real-cloud text-only backup/restore are verified. The Library bootstrap defect, active-card reconnect-status defect, and missing backup-query index are repaired and regression-protected. Remaining acceptance is real cross-owner Firestore rejection.

Safety: Firebase Storage remains disabled and optional. No billing changes. Additional cloud mutations or deployments require explicit authorization.
