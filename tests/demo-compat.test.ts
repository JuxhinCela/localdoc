import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  createMinimalWriterProject,
  openInMinimalWriter
} from "../examples/minimal-writer/minimal-writer.js";
import {
  addResearchNote,
  openInResearchNotes
} from "../examples/research-notes/research-notes.js";
import { readProject, validateProject, writeProject } from "../src/index.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("demo compatibility", () => {
  it("lets both demo editors preserve unknown metadata", async () => {
    const dir = await mkdtemp(join(tmpdir(), "localdoc-demos-"));
    tempDirs.push(dir);
    const projectPath = join(dir, "shared.localdoc");

    const project = createMinimalWriterProject("Shared Draft", "First paragraph");
    project.document.metadata = { minimalWriterCursor: 14 };

    await writeProject(projectPath, project);

    const researchView = await openInResearchNotes(projectPath);
    addResearchNote(researchView, "source-a", "A synthetic citation");
    await writeProject(projectPath, researchView.project);

    const minimalView = await openInMinimalWriter(projectPath);
    expect(minimalView.title).toBe("Shared Draft");

    const loaded = await readProject(projectPath);
    expect(validateProject(loaded).ok).toBe(true);
    expect(loaded.document.metadata).toEqual({ minimalWriterCursor: 14 });
    expect(loaded.document.blocks.some((block) => block.type === "custom")).toBe(true);
  });
});
