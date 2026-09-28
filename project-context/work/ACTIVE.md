# Active Work

ACTIVE_WORK: WORK-018

Title: Library Keyboard and Inspector Accessibility

Status: IN_PROGRESS

Base: `a4aa2c3d1f344609db8c10c37e8705d2992de872`

Planned branch: `task/work-018-library-keyboard-accessibility-v1`

Derived from: `DISC-002` MSR-08

Current phase: WORK-018 reconnaissance is complete and the revised accessibility design is frozen. Normal-mode cards gain keyboard button semantics; the existing native Select-mode checkbox remains authoritative; the inspector gains dialog semantics and bounded focus entry/restoration. Next is permanent RED before production implementation.

Scope: keyboard-equivalent Library item activation plus item-inspector dialog/focus entry and restoration, with existing pointer, selection, lifecycle, and layout behavior preserved.

Safety: MSS-02 remains separate; no Firebase deployment, cloud mutation, Storage enablement, billing change, persisted-data migration, or unrelated accessibility redesign.
