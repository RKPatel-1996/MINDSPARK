# Flows

This directory stores durable, project-specific records discovered during governed work.

Rules:

- Record only facts/decisions useful across sessions.
- Prefer concise files with stable IDs (`DISC-###`, `DF-###`, `GAP-###`, `ADR-###`, or dated history records as appropriate).
- Cite repository paths/commits/tests inside records when relevant.
- Do not duplicate volatile Git state that can be queried live.
- If a record becomes stale, supersede or update it explicitly rather than allowing conflicting authorities.
