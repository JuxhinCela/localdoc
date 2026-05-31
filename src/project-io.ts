import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertValidProject } from "./validation.js";
import type { LocalDocProject } from "./types.js";

export async function readProject(projectPath: string): Promise<LocalDocProject> {
  const [manifestRaw, documentRaw] = await Promise.all([
    readFile(join(projectPath, "manifest.json"), "utf8"),
    readFile(join(projectPath, "document.json"), "utf8")
  ]);

  const project = {
    manifest: JSON.parse(manifestRaw) as unknown,
    document: JSON.parse(documentRaw) as unknown
  };

  assertValidProject(project);
  return project;
}

export async function writeProject(
  projectPath: string,
  project: LocalDocProject
): Promise<void> {
  assertValidProject(project);

  await mkdir(join(projectPath, "assets"), { recursive: true });
  await Promise.all([
    writeFile(join(projectPath, "manifest.json"), `${JSON.stringify(project.manifest, null, 2)}\n`),
    writeFile(join(projectPath, "document.json"), `${JSON.stringify(project.document, null, 2)}\n`)
  ]);
}
