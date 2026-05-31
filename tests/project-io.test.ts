import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { createProject, readProject, writeProject } from "../src/index.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("project IO", () => {
  it("writes and reads a valid .localdoc folder", async () => {
    const dir = await mkdtemp(join(tmpdir(), "localdoc-"));
    tempDirs.push(dir);
    const projectPath = join(dir, "demo.localdoc");

    const project = createProject({
      title: "Portable",
      metadata: { owner: "user" },
      documentMetadata: { unknownEditorState: { mode: "focus" } }
    });
    project.document.blocks.push({
      type: "custom",
      namespace: "example.com/editor",
      name: "state",
      data: { panel: "notes" },
      fallback: {
        type: "paragraph",
        children: [{ type: "text", text: "[Editor state]" }]
      }
    });

    await writeProject(projectPath, project);
    const loaded = await readProject(projectPath);

    expect(loaded.manifest.title).toBe("Portable");
    expect(loaded.manifest.metadata).toEqual({ owner: "user" });
    expect(loaded.document.metadata).toEqual({ unknownEditorState: { mode: "focus" } });
    expect(loaded.document.blocks[0]).toEqual({
      type: "custom",
      namespace: "example.com/editor",
      name: "state",
      data: { panel: "notes" },
      fallback: {
        type: "paragraph",
        children: [{ type: "text", text: "[Editor state]" }]
      }
    });
  });
});
