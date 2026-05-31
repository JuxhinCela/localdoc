# LocalDoc Package

## `manifest.json`

Required fields:

- `localdoc`: MUST be `"0.2"`.
- `id`: MUST be a stable non-empty document ID beginning with `doc_`.
- `title`: MUST be a non-empty string.
- `createdAt`: MUST be an ISO date-time string.
- `updatedAt`: MUST be an ISO date-time string.

Optional fields:

- `generator`: name, version, and URL for the tool that wrote the package.
- `metadata`: JSON object for package-level metadata.

## `document.json`

Required fields:

- `type`: MUST be `"document"`.
- `version`: MUST be `"0.2"`.
- `blocks`: MUST be an array of LocalDoc blocks.

Optional fields:

- `metadata`: JSON object for document-level metadata.

## Serialization

Writers SHOULD use deterministic two-space JSON serialization with a trailing
newline.
