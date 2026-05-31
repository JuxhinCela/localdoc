# AI Builder Prompt

Use this prompt when asking an AI coding agent to create a LocalDoc-compatible
editor.

```text
Build a local-first document editor that stores every project as a LocalDoc
folder. Use the `localdoc` npm package for reading, writing, and validating
projects.

Requirements:
- Do not invent a private storage format.
- Save the project as:
  - manifest.json
  - document.json
  - assets/
- Preserve unknown LocalDoc metadata and custom blocks.
- Support at least paragraphs, headings, links, bold, italic, and code.
- Keep all user documents local unless the user explicitly exports them.
- Do not use vendor logos or imply official compatibility with any office suite.

Success criteria:
- The editor can open a project created by another LocalDoc editor.
- The editor can save the project without destroying unknown metadata.
- `localdoc validate <project>` passes after save.
```
