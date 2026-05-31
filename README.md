# LocalDoc

**Build local-first document editors. Own the files they create.**

LocalDoc is an open local-first document package format, TypeScript SDK, CLI,
and conformance suite for portable rich-text documents.

AI can generate custom editors. LocalDoc gives those editors a shared
interchange layer so documents remain portable between tools instead of getting
trapped inside one app's private JSON.

LocalDoc is not an editor framework, not a Word clone, and not a DOCX
compatibility layer.

```text
Markdown ─┐
HTML ─────┤
Tiptap ───┤
          ▼
      LocalDoc Core
          ▲
          ├── validators
          ├── conformance suite
          ├── adapters
          └── browser demos
```

## What It Does

- Defines a `.localdoc/` package format for portable rich-text documents.
- Validates packages with runtime checks and JSON Schema.
- Converts Markdown and HTML to and from LocalDoc.
- Reports conversion losses instead of pretending every format is lossless.
- Provides a CLI for init, inspect, validate, convert, and conformance checks.
- Preserves unknown custom blocks through a fallback-based extension model.

## Install

```bash
npm install localdoc@alpha
```

For local development:

```bash
npm install
npm run check
```

## CLI

```bash
localdoc init ./my-note.localdoc --title "My Note"
localdoc inspect ./my-note.localdoc
localdoc validate ./my-note.localdoc --json
localdoc convert ./README.md ./readme.localdoc
localdoc convert ./readme.localdoc ./readme.html
localdoc conformance --json
```

During development, run the CLI from source:

```bash
npm run localdoc -- conformance --json
```

## SDK

```ts
import {
  fromMarkdownWithLosses,
  readProject,
  toHtmlWithLosses,
  validateProject,
  validateProjectWithSchemas,
  writeProject
} from "localdoc";

const { value: project, losses } = fromMarkdownWithLosses(
  "# My private editor\n\nHello from LocalDoc.",
  { title: "My private editor" }
);

if (losses.length > 0) {
  console.warn(losses);
}

const runtimeResult = validateProject(project);
const schemaResult = await validateProjectWithSchemas(project);
if (!runtimeResult.ok || !schemaResult.ok) {
  throw new Error([...runtimeResult.errors, ...schemaResult.errors].join("\n"));
}

await writeProject("./my-private-editor.localdoc", project);

const loaded = await readProject("./my-private-editor.localdoc");
console.log(toHtmlWithLosses(loaded).value);
```

## Project Format

A LocalDoc project is a directory:

```text
my-document.localdoc/
  manifest.json
  document.json
  assets/
```

`manifest.json` stores package-level metadata:

```json
{
  "localdoc": "0.2",
  "id": "doc_my_document",
  "title": "My Document",
  "createdAt": "2026-05-31T00:00:00.000Z",
  "updatedAt": "2026-05-31T00:00:00.000Z",
  "generator": {
    "name": "localdoc-cli",
    "version": "0.2.0-alpha.0"
  }
}
```

`document.json` stores portable blocks and inline marks. Unknown
editor-specific content should use custom blocks with fallbacks so another
editor can preserve the content even when it cannot render the full feature.

## Why This Exists

People should be able to build writing tools that fit them without giving up
file ownership or portability.

LocalDoc is for people who want their documents to outlive any one editor.

## v0.2 Alpha Focus

The current alpha is about proving protocol credibility:

- formal spec docs
- JSON Schemas
- valid and invalid fixtures
- conformance checks
- conversion-loss reporting
- extension preservation

DOCX, ODT, collaboration, and full editor generation are intentionally out of
scope for this phase.

## Examples

- `examples/minimal-writer`: a tiny editor-shaped workflow for plain writing.
- `examples/research-notes`: a tiny editor-shaped workflow for notes, quotes,
  links, and custom metadata.
- `docs/AI_BUILDER_PROMPT.md`: a prompt template for generating a compatible
  local editor with AI.

## License

MIT
