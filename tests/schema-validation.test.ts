import { describe, expect, it } from "vitest";
import { createProject, validateProjectWithSchemas } from "../src/index.js";

describe("JSON Schema validation", () => {
  it("accepts valid LocalDoc projects", async () => {
    const project = createProject({
      id: "doc_schema_valid",
      title: "Schema Valid",
      now: "2026-05-31T00:00:00.000Z"
    });

    await expect(validateProjectWithSchemas(project)).resolves.toEqual({ ok: true, errors: [] });
  });

  it("rejects invalid LocalDoc projects", async () => {
    const result = await validateProjectWithSchemas({
      manifest: {
        localdoc: "0.2",
        id: "bad",
        title: "",
        createdAt: "not a date",
        updatedAt: "not a date"
      },
      document: {
        type: "document",
        version: "0.2",
        blocks: [{ type: "image", src: "../secret.txt" }]
      }
    });

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("must match pattern");
  });
});
