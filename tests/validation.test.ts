import { describe, expect, it } from "vitest";
import { createProject, validateProject } from "../src/index.js";

describe("validateProject", () => {
  it("accepts a minimal project", () => {
    const project = createProject({ title: "Owned Document" });

    expect(validateProject(project)).toEqual({ ok: true, errors: [] });
  });

  it("rejects a broken manifest", () => {
    const result = validateProject({
      manifest: {
        localdoc: "9.9.9",
        title: "",
        createdAt: "not-a-date",
        updatedAt: "not-a-date"
      },
      document: {
        type: "document",
        version: "0.1.0",
        blocks: []
      }
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('manifest.localdoc must be "0.1.0".');
    expect(result.errors).toContain("manifest.title must be a non-empty string.");
  });

  it("rejects unknown block types", () => {
    const project = createProject({ title: "Bad Block" });
    project.document.blocks.push({ type: "unknown" } as never);

    const result = validateProject(project);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("supported block type");
  });
});
