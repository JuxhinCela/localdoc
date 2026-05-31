import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { main } from "../src/cli.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("CLI", () => {
  it("initializes, inspects, and validates a project", async () => {
    const dir = await mkdtemp(join(tmpdir(), "localdoc-cli-"));
    tempDirs.push(dir);
    const projectPath = join(dir, "owned.localdoc");
    const stdout: string[] = [];
    const stderr: string[] = [];

    expect(
      await main(["init", projectPath, "--title", "Owned Docs"], {
        stdout: (value) => stdout.push(value),
        stderr: (value) => stderr.push(value)
      })
    ).toBe(0);

    expect(
      await main(["inspect", projectPath], {
        stdout: (value) => stdout.push(value),
        stderr: (value) => stderr.push(value)
      })
    ).toBe(0);

    expect(
      await main(["validate", projectPath], {
        stdout: (value) => stdout.push(value),
        stderr: (value) => stderr.push(value)
      })
    ).toBe(0);

    expect(stdout.join("")).toContain("Owned Docs");
    expect(stdout.join("")).toContain("LocalDoc project is valid.");
    expect(stderr.join("")).toBe("");
  });

  it("prints validation JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "localdoc-cli-json-"));
    tempDirs.push(dir);
    const projectPath = join(dir, "owned.localdoc");
    const stdout: string[] = [];

    expect(await main(["init", projectPath, "--title", "Owned Docs"], quietIo())).toBe(0);
    expect(
      await main(["validate", projectPath, "--json"], {
        stdout: (value) => stdout.push(value),
        stderr: () => undefined
      })
    ).toBe(0);

    expect(JSON.parse(stdout.join(""))).toEqual({ status: "pass", errors: [] });
  });

  it("converts Markdown to LocalDoc to HTML", async () => {
    const dir = await mkdtemp(join(tmpdir(), "localdoc-convert-"));
    tempDirs.push(dir);
    const markdownPath = join(dir, "source.md");
    const projectPath = join(dir, "source.localdoc");
    const htmlPath = join(dir, "source.html");

    await writeFile(markdownPath, "# Portable\n\nMove between **editors**.\n");

    expect(await main(["convert", markdownPath, projectPath], quietIo())).toBe(0);
    expect(await main(["convert", projectPath, htmlPath], quietIo())).toBe(0);

    const html = await readFile(htmlPath, "utf8");
    expect(html).toContain("<h1>Portable</h1>");
    expect(html).toContain("<strong>editors</strong>");
  });

  it("runs conformance checks", async () => {
    const stdout: string[] = [];

    expect(
      await main(["conformance", "--json"], {
        stdout: (value) => stdout.push(value),
        stderr: () => undefined
      })
    ).toBe(0);

    const report = JSON.parse(stdout.join(""));
    expect(report.suite).toBe("localdoc-core-v0.2");
    expect(report.status).toBe("pass");
  });
});

function quietIo() {
  return {
    stdout: () => undefined,
    stderr: () => undefined
  };
}
