export const LOCALDOC_FORMAT_VERSION = "0.2" as const;
export const LOCALDOC_PACKAGE_VERSION = "0.2.0-alpha.0" as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export interface LocalDocGenerator {
  name: string;
  version?: string;
  url?: string;
}

export interface LocalDocManifest {
  localdoc: typeof LOCALDOC_FORMAT_VERSION;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  generator?: LocalDocGenerator;
  metadata?: JsonObject;
}

export interface LocalDocDocument {
  type: "document";
  version: typeof LOCALDOC_FORMAT_VERSION;
  blocks: LocalDocBlock[];
  metadata?: JsonObject;
}

export interface LocalDocProject {
  manifest: LocalDocManifest;
  document: LocalDocDocument;
}

export type LocalDocMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "code" }
  | { type: "link"; href: string; title?: string };

export type LocalDocInline =
  | {
      type: "text";
      text: string;
      marks?: LocalDocMark[];
      metadata?: JsonObject;
    }
  | {
      type: "hard_break";
      metadata?: JsonObject;
    };

export type LocalDocListItem = {
  children: LocalDocBlock[];
  metadata?: JsonObject;
};

export type LocalDocTableCell = {
  children: LocalDocBlock[];
  metadata?: JsonObject;
};

export type LocalDocTableRow = {
  cells: LocalDocTableCell[];
  metadata?: JsonObject;
};

export type LocalDocBlock =
  | {
      type: "paragraph";
      children: LocalDocInline[];
      metadata?: JsonObject;
    }
  | {
      type: "heading";
      level: 1 | 2 | 3 | 4 | 5 | 6;
      children: LocalDocInline[];
      metadata?: JsonObject;
    }
  | {
      type: "list";
      ordered: boolean;
      items: LocalDocListItem[];
      metadata?: JsonObject;
    }
  | {
      type: "quote";
      children: LocalDocBlock[];
      metadata?: JsonObject;
    }
  | {
      type: "code";
      text: string;
      language?: string;
      metadata?: JsonObject;
    }
  | {
      type: "table";
      rows: LocalDocTableRow[];
      metadata?: JsonObject;
    }
  | {
      type: "image";
      src: string;
      alt?: string;
      title?: string;
      metadata?: JsonObject;
    }
  | {
      type: "custom";
      namespace: string;
      name: string;
      data: JsonValue;
      fallback?: Exclude<LocalDocBlock, { type: "custom" }>;
      metadata?: JsonObject;
    };

export interface CreateProjectInput {
  id?: string;
  title?: string;
  blocks?: LocalDocBlock[];
  generator?: LocalDocGenerator;
  metadata?: JsonObject;
  documentMetadata?: JsonObject;
  now?: string | Date;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export type ConversionLossSeverity = "info" | "warning" | "error";

export interface ConversionLoss {
  severity: ConversionLossSeverity;
  path: string;
  feature: string;
  message: string;
}

export interface ConversionResult<T> {
  value: T;
  losses: ConversionLoss[];
}

export interface MarkdownOptions {
  title?: string;
  generator?: LocalDocGenerator;
  now?: string | Date;
}

export interface HtmlOptions {
  title?: string;
  generator?: LocalDocGenerator;
  now?: string | Date;
}
