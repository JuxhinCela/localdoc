#!/usr/bin/env node
import { readFile, stat, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { pathToFileURL } from "node:url";
import { createProject } from "./project.js";
import { readProject, writeProject } from "./project-io.js";
import { fromHtml, toHtml } from "./html.js";
import { fromMarkdown, toMarkdown } from "./markdown.js";
import { validateProject } from "./validation.js";
import type { LocalDocProject } from "./types.js";

interface CliIo {
  stdout?: (value: string) => void;
  stderr?: (value: string) => void;
}

export async function main(args = process.argv.slice(2), io: CliIo = {}): Promise<number> {
  const stdout = io.stdout ?? ((value: string) => process.stdout.write(value));
  const stderr = io.stderr ?? ((value: string) => process.stderr.write(value));
  const [command, ...rest] = args;

  try {
    switch (command) {
      case "init":
        return await initCommand(rest, stdout);
      case "inspect":
        return await inspectCommand(rest, stdout);
      case "validate":
        return await validateCommand(rest, stdout, stderr);
      case "convert":
        return await convertCommand(rest, stdout);
      case "--help":
      case "-h":
      case undefined:
        stdout(helpText());
        return command ? 0 : 1;
      default:
        stderr(`Unknown command: ${command}\n\n${helpText()}`);
        return 1;
    }
  } catch (error) {
    stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

async function initCommand(args: string[], stdout: (value: string) => void): Promise<number> {
  const target = args[0];
  if (!target) {
    throw new Error("Usage: localdoc init <dir> --title \"My Document\"");
  }

  const title = readOption(args, "--title") ?? "Untitled document";
  const project = createProject({
    title,
    generator: { name: "localdoc-cli", version: "0.1.0" }
  });

  await writeProject(target, project);
  stdout(`Created LocalDoc project at ${target}\n`);
  return 0;
}

async function inspectCommand(args: string[], stdout: (value: string) => void): Promise<number> {
  const target = args[0];
  if (!target) {
    throw new Error("Usage: localdoc inspect <path>");
  }

  const project = await readProject(target);
  const summary = {
    title: project.manifest.title,
    version: project.manifest.localdoc,
    blocks: project.document.blocks.length,
    updatedAt: project.manifest.updatedAt
  };

  stdout(`${JSON.stringify(summary, null, 2)}\n`);
  return 0;
}

async function validateCommand(
  args: string[],
  stdout: (value: string) => void,
  stderr: (value: string) => void
): Promise<number> {
  const target = args[0];
  if (!target) {
    throw new Error("Usage: localdoc validate <path>");
  }

  const project = await readProject(target);
  const result = validateProject(project);

  if (result.ok) {
    stdout("LocalDoc project is valid.\n");
    return 0;
  }

  stderr(`${result.errors.join("\n")}\n`);
  return 1;
}

async function convertCommand(args: string[], stdout: (value: string) => void): Promise<number> {
  const [input, output] = args;
  if (!input || !output) {
    throw new Error("Usage: localdoc convert <input> <output>");
  }

  const project = await readInput(input);
  await writeOutput(output, project);
  stdout(`Converted ${input} -> ${output}\n`);
  return 0;
}

async function readInput(input: string): Promise<LocalDocProject> {
  if (await isDirectory(input)) {
    return readProject(input);
  }

  const raw = await readFile(input, "utf8");
  switch (extname(input).toLowerCase()) {
    case ".md":
    case ".markdown":
      return fromMarkdown(raw);
    case ".html":
    case ".htm":
      return fromHtml(raw);
    case ".json": {
      const project = JSON.parse(raw) as unknown;
      const result = validateProject(project);
      if (!result.ok) {
        throw new Error(result.errors.join("\n"));
      }
      return project as LocalDocProject;
    }
    default:
      throw new Error(`Unsupported input format: ${input}`);
  }
}

async function writeOutput(output: string, project: LocalDocProject): Promise<void> {
  switch (extname(output).toLowerCase()) {
    case ".md":
    case ".markdown":
      await writeFile(output, toMarkdown(project));
      return;
    case ".html":
    case ".htm":
      await writeFile(output, toHtml(project));
      return;
    case ".json":
      await writeFile(output, `${JSON.stringify(project, null, 2)}\n`);
      return;
    default:
      await writeProject(output, project);
  }
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function helpText(): string {
  return `LocalDoc: open documents for personal word processors.

Usage:
  localdoc init <dir> --title "My Document"
  localdoc inspect <path>
  localdoc validate <path>
  localdoc convert <input> <output>

Formats:
  Input:  .localdoc directory, .md, .markdown, .html, .htm, .json
  Output: .localdoc directory, .md, .markdown, .html, .htm, .json
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const exitCode = await main();
  process.exitCode = exitCode;
}
