# Adapter Authoring

Adapters translate between another document model and LocalDoc.

## Contract

Adapters should expose this shape:

```ts
export interface LocalDocAdapter<Input, Output> {
  name: string;
  read(input: Input, options?: LocalDocReadOptions): LocalDocReadResult;
  write(project: LocalDocProject, options?: LocalDocWriteOptions): LocalDocWriteResult<Output>;
}
```

## Rules

- Report lossy behavior with `ConversionLoss`.
- Preserve unknown custom blocks when reading and writing LocalDoc.
- Prefer fallbacks over deletion.
- Document unsupported features in a support matrix.
- Add fixtures for every feature the adapter claims to round-trip.

## Loss Example

```json
{
  "severity": "warning",
  "path": "/document/blocks/3",
  "feature": "table-column-width",
  "message": "Table column widths were not preserved."
}
```
