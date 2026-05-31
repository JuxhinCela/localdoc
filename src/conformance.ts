import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fromHtml, toHtml } from "./html.js";
import { fromMarkdown, toMarkdown } from "./markdown.js";
import { createProject } from "./project.js";
import { readProject, writeProject } from "./project-io.js";
import { validateProject } from "./validation.js";
import { validateProjectWithSchemas } from "./schema-validation.js";
import type { LocalDocBlock } from "./types.js";

export type ConformanceStatus = "pass" | "fail";

export interface ConformanceCheck {
  id: string;
  status: ConformanceStatus;
  message?: string;
}

export interface ConformanceReport {
  suite: "localdoc-core-v0.2";
  status: ConformanceStatus;
  profile: "core-richtext";
  checks: ConformanceCheck[];
}

export interface ConformanceOptions {
  fixturesDir?: string;
}

export async function runConformance(
  options: ConformanceOptions = {}
): Promise<ConformanceReport> {
  const fixturesDir = options.fixturesDir ?? new URL("../fixtures", import.meta.url).pathname;
  const checks: ConformanceCheck[] = [];

  checks.push(...(await checkValidFixtures(fixturesDir)));
  checks.push(...(await checkInvalidFixtures(fixturesDir)));
  checks.push(checkMarkdownRoundTrip());
  checks.push(checkHtmlRoundTrip());
  checks.push(await checkUnknownCustomBlockPreserved());

  return {
    suite: "localdoc-core-v0.2",
    status: checks.every((check) => check.status === "pass") ? "pass" : "fail",
    profile: "core-richtext",
    checks
  };
}

async function checkValidFixtures(fixturesDir: string): Promise<ConformanceCheck[]> {
  const validDir = join(fixturesDir, "valid");
  const names = await readLocalDocFixtureNames(validDir);

  return Promise.all(
    names.map(async (name) => {
      const id = `fixture.valid.${name}`;
      try {
        const project = await readProject(join(validDir, name));
        const schemaResult = await validateProjectWithSchemas(project);
        return schemaResult.ok
          ? pass(id)
          : fail(id, `Schema errors: ${schemaResult.errors.join("; ")}`);
      } catch (error) {
        return fail(id, errorMessage(error));
      }
    })
  );
}

async function checkInvalidFixtures(fixturesDir: string): Promise<ConformanceCheck[]> {
  const invalidDir = join(fixturesDir, "invalid");
  const names = await readLocalDocFixtureNames(invalidDir);

  return Promise.all(
    names.map(async (name) => {
      const id = `fixture.invalid.${name}`;
      try {
        const project = await readProject(join(invalidDir, name));
        const schemaResult = await validateProjectWithSchemas(project);
        return validateProject(project).ok || schemaResult.ok
          ? fail(id, "Invalid fixture passed validation.")
          : pass(id);
      } catch {
        return pass(id);
      }
    })
  );
}

function checkMarkdownRoundTrip(): ConformanceCheck {
  const project = fromMarkdown("# Portable\n\nA **local** document with [a link](https://example.com).\n", {
    now: "2026-05-31T00:00:00.000Z"
  });
  const rendered = toMarkdown(project);

  return rendered.includes("# Portable") &&
    rendered.includes("**local**") &&
    rendered.includes("[a link](https://example.com)")
    ? pass("roundtrip.markdown.basic")
    : fail("roundtrip.markdown.basic", "Markdown did not preserve heading, bold text, and link.");
}

function checkHtmlRoundTrip(): ConformanceCheck {
  const project = fromHtml(
    "<html><head><title>Portable</title></head><body><h1>Portable</h1><p><strong>Local</strong></p></body></html>",
    { now: "2026-05-31T00:00:00.000Z" }
  );
  const rendered = toHtml(project);

  return rendered.includes("<h1>Portable</h1>") && rendered.includes("<strong>Local</strong>")
    ? pass("roundtrip.html.basic")
    : fail("roundtrip.html.basic", "HTML did not preserve heading and bold text.");
}

async function checkUnknownCustomBlockPreserved(): Promise<ConformanceCheck> {
  const tempDir = await mkdtemp(join(tmpdir(), "localdoc-conformance-"));
  const projectPath = join(tempDir, "custom.localdoc");

  try {
    const customBlock: LocalDocBlock = {
      type: "custom",
      namespace: "example.com/research",
      name: "citation-card",
      data: { sourceId: "source-a" },
      fallback: {
        type: "paragraph",
        children: [{ type: "text", text: "[Citation card]" }]
      }
    };
    const project = createProject({
      title: "Custom",
      blocks: [customBlock],
      now: "2026-05-31T00:00:00.000Z"
    });

    await writeProject(projectPath, project);
    const loaded = await readProject(projectPath);

    return JSON.stringify(loaded.document.blocks[0]) === JSON.stringify(customBlock)
      ? pass("extensions.unknown-block-preserved")
      : fail("extensions.unknown-block-preserved", "Custom block changed after read/write.");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function readLocalDocFixtureNames(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(".localdoc"))
    .map((entry) => entry.name)
    .sort();
}

function pass(id: string): ConformanceCheck {
  return { id, status: "pass" };
}

function fail(id: string, message: string): ConformanceCheck {
  return { id, status: "fail", message };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
