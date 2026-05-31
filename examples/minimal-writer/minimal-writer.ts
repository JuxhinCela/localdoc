import { readProject } from "../../src/project-io.js";
import { createProject } from "../../src/project.js";
import type { LocalDocProject } from "../../src/types.js";

export interface MinimalWriterView {
  title: string;
  paragraphs: string[];
  project: LocalDocProject;
}

export function createMinimalWriterProject(title: string, firstParagraph = ""): LocalDocProject {
  const project = createProject({
    title,
    generator: { name: "localdoc-minimal-writer", version: "0.2.0-alpha.0" }
  });

  project.document.blocks.push({
    type: "heading",
    level: 1,
    children: [{ type: "text", text: title }]
  });

  if (firstParagraph) {
    project.document.blocks.push({
      type: "paragraph",
      children: [{ type: "text", text: firstParagraph }]
    });
  }

  return project;
}

export async function openInMinimalWriter(projectPath: string): Promise<MinimalWriterView> {
  const project = await readProject(projectPath);

  return {
    title: project.manifest.title,
    paragraphs: project.document.blocks
      .filter((block) => block.type === "paragraph")
      .map((block) =>
        block.children.map((inline) => (inline.type === "text" ? inline.text : "\n")).join("")
      ),
    project
  };
}
