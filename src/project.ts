import { randomUUID } from "node:crypto";
import {
  LOCALDOC_FORMAT_VERSION,
  LOCALDOC_PACKAGE_VERSION,
  type CreateProjectInput,
  type LocalDocProject
} from "./types.js";

export function createProject(input: CreateProjectInput = {}): LocalDocProject {
  const now = normalizeDate(input.now ?? new Date());

  return {
    manifest: {
      localdoc: LOCALDOC_FORMAT_VERSION,
      id: input.id ?? `doc_${randomUUID()}`,
      title: input.title ?? "Untitled document",
      createdAt: now,
      updatedAt: now,
      generator: input.generator ?? { name: "localdoc", version: LOCALDOC_PACKAGE_VERSION },
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
