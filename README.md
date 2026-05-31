# LocalDoc

**Build your own Word. Own your documents.**

LocalDoc is an open protocol for personally owned word processors: local-first,
AI-buildable, portable, and free from office-suite lock-in.

The future of documents should be personal, local, and portable. AI can now help
anyone build a private writing app. LocalDoc makes sure those apps can still
speak the same document language.

No single vendor should control how personal documents are created, stored, or
moved.

## What It Is

LocalDoc is the open document layer for people building their own writing tools.
It gives AI-generated editors a shared project format, SDK, CLI, and conversion
path so users are not trapped in one generated app.

LocalDoc v0.1 supports Markdown and HTML. It does not claim official
compatibility with any office suite and does not implement DOCX yet.

## Install

```bash
npm install localdoc
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
localdoc validate ./my-note.localdoc
localdoc convert ./README.md ./readme.localdoc
localdoc convert ./readme.localdoc ./readme.html
```

During development, run the CLI from source:

```bash
npm run localdoc -- init ./tmp/demo.localdoc --title "Demo"
```

## SDK

```ts
import {
  createProject,
  fromMarkdown,
  readProject,
  toHtml,
  validateProject,
  writeProject
} from "localdoc";

const project = fromMarkdown("# My private editor\n\nHello from LocalDoc.", {
  title: "My private editor"
});

const result = validateProject(project);
if (!result.ok) {
  throw new Error(result.errors.join("\n"));
}

await writeProject("./my-private-editor.localdoc", project);

const loaded = await readProject("./my-private-editor.localdoc");
console.log(toHtml(loaded));

const empty = createProject({ title: "Blank document" });
```

## Project Format

A LocalDoc project is a directory:

```text
my-document.localdoc/
  manifest.json
  document.json
  assets/
```

`manifest.json` stores project-level metadata:

```json
{
  "localdoc": "0.1.0",
  "title": "My Document",
  "createdAt": "2026-05-31T00:00:00.000Z",
  "updatedAt": "2026-05-31T00:00:00.000Z",
  "generator": {
    "name": "localdoc-cli",
    "version": "0.1.0"
  }
}
```

`document.json` stores portable blocks and inline marks. Unknown editor-specific
data should live in `metadata` or `custom` blocks so another editor can preserve
it even when it cannot render it.

## Why This Exists

AI makes it possible for every person, team, classroom, studio, or community to
build a writing tool that fits them. But without an open protocol, every
AI-generated editor becomes a new silo.

LocalDoc is for a world where everyone can have a private, personal word
processor, and still keep their documents portable.

## Examples

- `examples/minimal-writer`: a tiny editor-shaped workflow for plain writing.
- `examples/research-notes`: a tiny editor-shaped workflow for notes, quotes,
  links, and custom metadata.
- `docs/AI_BUILDER_PROMPT.md`: a prompt template for generating a compatible
  local editor with AI.

## Public Positioning

GitHub description:

> Open protocol and SDK for AI-generated personal word processors.

Short pitch:

> LocalDoc helps developers build private, user-owned document editors without
> trapping users in one app or vendor format.

## License

MIT
