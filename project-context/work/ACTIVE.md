# Active Work

ACTIVE_WORK: WORK-009

Title: Production Dependency Security Remediation

Status: ACTIVE

Base: `aee00bf7c544bbe7634dfb9ae029e54525bdedee`

Branch: `task/work-009-dependency-security-v1`

Derived from: `GAP-003`

Current phase: Registered after audit, dependency-path, reachability, and compatible-version reconnaissance. No dependency changes have been applied yet.

Scope: Remove the verified dependency-security findings through minimal compatible direct and transitive updates while preserving application, backup, routing, build, PWA, and Firebase tooling behavior.

Safety: No force audit fix, major-version upgrade, cloud mutation, deployment, Storage enablement, billing change, or unrelated dependency modernization.
