# LocalDoc Extensions

LocalDoc supports custom blocks so editors can preserve content they do not
fully understand.

## Custom Block Shape

```json
{
  "type": "custom",
  "namespace": "example.com/research",
  "name": "citation-card",
  "data": {
    "sourceId": "source-a"
  },
  "fallback": {
    "type": "paragraph",
    "children": [{ "type": "text", "text": "[Citation card]" }]
  }
}
```

## Rules

- `namespace` MUST identify the extension owner or domain.
- `name` MUST identify the custom block within the namespace.
- `data` MUST be JSON-serializable.
- `fallback` SHOULD be provided for renderers that do not support the custom
  block.
- A conforming processor MUST preserve unknown custom blocks unless the user
  explicitly chooses a lossy export.
- Lossy exports MUST report dropped or degraded custom content.
