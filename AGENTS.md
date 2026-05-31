# AGENTS.md

Guidance for AI coding agents working on LocalDoc.

## Project Invariants

- LocalDoc Core stores interchange state, not editor runtime state.
- Do not add cursor state, selection state, undo stacks, plugin state, or CRDT
  internals to the core document model.
- Do not silently drop unknown custom blocks.
- All lossy import/export behavior must be reported with `ConversionLoss`.
- All schema changes require fixture updates.
- Asset and URL references must not allow traversal outside the package.
- Treat imported HTML, package paths, and assets as untrusted input.
- Public copy must not imply Microsoft affiliation, endorsement, or DOCX
  compatibility.

## Preferred Work Shape

- Keep core changes small and spec-backed.
- Add or update conformance checks for protocol behavior.
- Prefer adapters over broadening the core model.
- Use synthetic fixtures only. Never commit private documents.
