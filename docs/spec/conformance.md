# LocalDoc Conformance

The conformance suite exists to make LocalDoc testable as a protocol.

```bash
localdoc conformance
localdoc conformance --json
```

## Core Checks

v0.2 core conformance checks include:

- valid fixtures pass runtime validation and JSON Schema validation
- invalid fixtures fail validation
- Markdown basic round-trip
- HTML basic round-trip
- unknown custom blocks survive read/write

## JSON Output

```json
{
  "suite": "localdoc-core-v0.2",
  "status": "pass",
  "profile": "core-richtext",
  "checks": [
    { "id": "fixture.valid.basic.localdoc", "status": "pass" }
  ]
}
```
