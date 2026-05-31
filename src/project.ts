import {
  LOCALDOC_FORMAT_VERSION,
  type CreateProjectInput,
  type LocalDocProject
} from "./types.js";

export function createProject(input: CreateProjectInput = {}): LocalDocProject {
  const now = normalizeDate(input.now ?? new Date());

  return {
    manifest: {
      localdoc: LOCALDOC_FORMAT_VERSION,
      title: input.title ?? "Untitled document",
      createdAt: now,
      updatedAt: now,
      ...(input.generator ? { generator: input.generator } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {})
    },
    document: {
      type: "document",
      version: LOCALDOC_FORMAT_VERSION,
      blocks: input.blocks ?? [],
      ...(input.documentMetadata ? { metadata: input.documentMetadata } : {})
    }
  };
}

function normalizeDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid LocalDoc date: ${value}`);
  }

  return parsed.toISOString();
}
