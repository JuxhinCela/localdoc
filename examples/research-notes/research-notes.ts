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
    namespace: "localdoc.dev/examples/research",
    name: "research-note",
    data: { sourceId, quote },
    fallback: {
      type: "quote",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", text: quote }]
        }
      ]
    }
  });
}

function extractResearchNotes(blocks: LocalDocBlock[]): Array<{ sourceId: string; quote: string }> {
  return blocks.flatMap((block) => {
    if (
      block.type !== "custom" ||
      block.namespace !== "localdoc.dev/examples/research" ||
      block.name !== "research-note"
    ) {
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
