# Active Work

ACTIVE_WORK: WORK-008

Title: Production Bundle Performance Hardening

Status: VERIFIED / READY_FOR_PROMOTION

Base: `b51a0cd5d151c38f4911ebb9bf06c05b0b3de38f`

Branch: `task/work-008-bundle-performance-v1`

Derived from: `GAP-002`

Current phase: Implementation and full verification complete at `9b4df241ea77098df6fcc23d37aa325ebf4e3d35`; ready for canonical promotion.

Scope: Reduce the oversized initial production JavaScript bundle through measured code splitting while preserving routing, offline-first PWA behavior, and product semantics.

Safety: No deployment, Firebase/cloud mutation, dependency-security remediation, FSRS changes, billing changes, or warning-limit suppression.
Verification: initial eager JavaScript gzip reduced from approximately 527.27 kB to 345.89 kB (34.4%); all generated JavaScript chunks are below 500 kB; PWA precache is approximately 2,381.63 KiB; 63 files / 456 ordinary tests PASS; PWA artifact suite 8 / 8 PASS; `verify:web-release` PASS.

Promotion boundary: WORK-008 is not yet canonical. Do not describe GAP-002 as canonically resolved until the feature branch is promoted and reverified on `main`.
