# Architecture

LocalDoc is a package format and interoperability layer for local-first
rich-text documents.

```text
Reader adapters
  Markdown, HTML, Tiptap, future DOCX/ODT
        |
        v
LocalDoc package
  manifest.json
  document.json
  assets/
        |
        v
Writer adapters
  Markdown, HTML, Tiptap, future DOCX/ODT
```

## Core Responsibilities

- Define a stable document package shape.
- Validate manifests, documents, references, and extension fallbacks.
- Preserve unknown custom blocks.
- Report import/export losses.
- Provide fixtures and conformance checks.

## Non-Responsibilities

- Rendering an editor UI.
- Storing editor runtime state.
- Providing page-layout fidelity.
- Solving real-time collaboration.
- Guaranteeing compatibility with office suite formats.
