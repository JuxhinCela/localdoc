# AI Builder Prompt

Use this prompt when asking an AI coding agent to create a LocalDoc-compatible
editor.

```text
Build a local-first rich-text document editor that stores every project as a
LocalDoc package. Use the `localdoc` npm package for reading, writing,
validating, and conformance-checking projects.

Requirements:
- Do not invent a private storage format.
- Save the project as:
  - manifest.json
  - document.json
  - assets/
- Preserve unknown LocalDoc metadata and custom blocks.
- Preserve custom block `namespace`, `name`, `data`, and `fallback`.
- Support at least paragraphs, headings, links, bold, italic, and code.
- Report lossy imports or exports with `ConversionLoss`.
- Keep all user documents local unless the user explicitly exports them.
- Do not use vendor logos or imply official compatibility with any office suite.

Success criteria:
- The editor can open a project created by another LocalDoc editor.
- The editor can save the project without destroying unknown metadata.
- `localdoc validate <project>` passes after save.
- `localdoc conformance --json` passes in the project.
```
