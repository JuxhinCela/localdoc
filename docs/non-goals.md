# Non-Goals

LocalDoc is intentionally narrow.

- It is not a Word clone.
- It is not an editor framework.
- It is not a DOCX compatibility guarantee.
- It is not a layout or pagination engine.
- It is not a collaboration engine.
- It is not a cloud document service.
- It does not store selection state, cursor state, undo stacks, plugin state, or
  CRDT internals in core documents.

LocalDoc stores document interchange state so multiple editors and adapters can
read, validate, preserve, and convert the same local package.
