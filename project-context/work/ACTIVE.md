# Active Work

ACTIVE_WORK: WORK-017

Title: Viewport User-Scaling Accessibility

Status: IN_PROGRESS

Base: `67dac991cab3c793dd952c4bacb49f1e07998944`

Planned branch: `task/work-017-viewport-scaling-v1`

Derived from: `DISC-002` MSR-09

Current phase: WORK-017 permanent RED is established at `6e3a396dfbdbcf7b8d2cf528db87001722fe5884` against the frozen viewport contract. Both source index.html and fresh-built dist/index.html demonstrate the current zoom-blocking defect. The next boundary is the minimal one-line production viewport implementation.

Scope: restore user-controlled browser zoom by establishing an explicit accessibility-safe viewport metadata contract while preserving responsive device-width behavior and the existing PWA release contract.

Safety: no Firebase deployment, production cloud mutation, persisted-data migration, MSR-08 work, MSS-02 work, broad responsive redesign, Storage enablement, billing change, or unrelated accessibility redesign.
