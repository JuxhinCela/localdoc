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
        id: "",
        title: "",
        createdAt: "not-a-date",
        updatedAt: "not-a-date"
      },
      document: {
        type: "document",
        version: "0.2",
        blocks: []
      }
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('manifest.localdoc must be "0.2".');
    expect(result.errors).toContain("manifest.id must be a non-empty string.");
    expect(result.errors).toContain("manifest.title must be a non-empty string.");
  });

  it("rejects unknown block types", () => {
    const project = createProject({ title: "Bad Block" });
    project.document.blocks.push({ type: "unknown" } as never);

    const result = validateProject(project);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("supported block type");
  });

  it("rejects unsafe asset and link references", () => {
    const project = createProject({ title: "Unsafe" });
    project.document.blocks.push(
      { type: "image", src: "../secret.txt" },
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "bad",
            marks: [{ type: "link", href: "javascript:alert(1)" }]
          }
        ]
      }
    );

    const result = validateProject(project);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("safe relative asset path");
    expect(result.errors.join("\n")).toContain("safe relative path");
  });
});
