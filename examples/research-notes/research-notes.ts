import { readProject } from "../../src/project-io.js";
import type { LocalDocBlock, LocalDocProject } from "../../src/types.js";

export interface ResearchNotesView {
  title: string;
  notes: Array<{ sourceId: string; quote: string }>;
  project: LocalDocProject;
}

export async function openInResearchNotes(projectPath: string): Promise<ResearchNotesView> {
  const project = await readProject(projectPath);

  return {
    title: project.manifest.title,
    notes: extractResearchNotes(project.document.blocks),
    project
  };
}

export function addResearchNote(view: ResearchNotesView, sourceId: string, quote: string): void {
  view.notes.push({ sourceId, quote });
  view.project.document.blocks.push({
    type: "custom",
    kind: "research-note",
    data: { sourceId, quote }
  });
}

function extractResearchNotes(blocks: LocalDocBlock[]): Array<{ sourceId: string; quote: string }> {
  return blocks.flatMap((block) => {
    if (block.type !== "custom" || block.kind !== "research-note") {
      return [];
    }

    const data = block.data;
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      typeof data.sourceId !== "string" ||
      typeof data.quote !== "string"
    ) {
      return [];
    }

    return [{ sourceId: data.sourceId, quote: data.quote }];
  });
}
