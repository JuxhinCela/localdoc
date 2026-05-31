import {
  LOCALDOC_FORMAT_VERSION,
  type JsonObject,
  type JsonValue,
  type LocalDocBlock,
  type LocalDocInline,
  type LocalDocMark,
  type LocalDocProject,
  type ValidationResult
} from "./types.js";

export class LocalDocValidationError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors.join("\n"));
    this.name = "LocalDocValidationError";
    this.errors = errors;
  }
}

export function validateProject(project: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(project)) {
    return { ok: false, errors: ["Project must be an object."] };
  }

  const manifest = project.manifest;
  const document = project.document;

  if (!isRecord(manifest)) {
    errors.push("manifest must be an object.");
  } else {
    if (manifest.localdoc !== LOCALDOC_FORMAT_VERSION) {
      errors.push(`manifest.localdoc must be "${LOCALDOC_FORMAT_VERSION}".`);
    }
    if (!isNonEmptyString(manifest.id)) {
      errors.push("manifest.id must be a non-empty string.");
    }
    if (!isNonEmptyString(manifest.title)) {
      errors.push("manifest.title must be a non-empty string.");
    }
    if (!isIsoDate(manifest.createdAt)) {
      errors.push("manifest.createdAt must be an ISO date string.");
    }
    if (!isIsoDate(manifest.updatedAt)) {
      errors.push("manifest.updatedAt must be an ISO date string.");
    }
    if (manifest.generator !== undefined) {
      validateGenerator(manifest.generator, "manifest.generator", errors);
    }
    if (manifest.metadata !== undefined && !isJsonObject(manifest.metadata)) {
      errors.push("manifest.metadata must be a JSON object.");
    }
  }

  if (!isRecord(document)) {
    errors.push("document must be an object.");
  } else {
    if (document.type !== "document") {
      errors.push('document.type must be "document".');
    }
    if (document.version !== LOCALDOC_FORMAT_VERSION) {
      errors.push(`document.version must be "${LOCALDOC_FORMAT_VERSION}".`);
    }
    if (!Array.isArray(document.blocks)) {
      errors.push("document.blocks must be an array.");
    } else {
      document.blocks.forEach((block, index) => {
        validateBlock(block, `document.blocks[${index}]`, errors);
      });
    }
    if (document.metadata !== undefined && !isJsonObject(document.metadata)) {
      errors.push("document.metadata must be a JSON object.");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function assertValidProject(project: unknown): asserts project is LocalDocProject {
  const result = validateProject(project);
  if (!result.ok) {
    throw new LocalDocValidationError(result.errors);
  }
}

function validateGenerator(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  if (!isNonEmptyString(value.name)) {
    errors.push(`${path}.name must be a non-empty string.`);
  }
  if (value.version !== undefined && typeof value.version !== "string") {
    errors.push(`${path}.version must be a string.`);
  }
  if (value.url !== undefined && typeof value.url !== "string") {
    errors.push(`${path}.url must be a string.`);
  }
}

function validateBlock(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  if (value.metadata !== undefined && !isJsonObject(value.metadata)) {
    errors.push(`${path}.metadata must be a JSON object.`);
  }

  switch (value.type) {
    case "paragraph":
      validateInlineArray(value.children, `${path}.children`, errors);
      return;
    case "heading":
      if (![1, 2, 3, 4, 5, 6].includes(value.level as number)) {
        errors.push(`${path}.level must be an integer from 1 to 6.`);
      }
      validateInlineArray(value.children, `${path}.children`, errors);
      return;
    case "list":
      if (typeof value.ordered !== "boolean") {
        errors.push(`${path}.ordered must be a boolean.`);
      }
      if (!Array.isArray(value.items)) {
        errors.push(`${path}.items must be an array.`);
      } else {
        value.items.forEach((item, index) => {
          validateListItem(item, `${path}.items[${index}]`, errors);
        });
      }
      return;
    case "quote":
      validateBlockArray(value.children, `${path}.children`, errors);
      return;
    case "code":
      if (typeof value.text !== "string") {
        errors.push(`${path}.text must be a string.`);
      }
      if (value.language !== undefined && typeof value.language !== "string") {
        errors.push(`${path}.language must be a string.`);
      }
      return;
    case "table":
      if (!Array.isArray(value.rows)) {
        errors.push(`${path}.rows must be an array.`);
      } else {
        value.rows.forEach((row, rowIndex) => {
          validateTableRow(row, `${path}.rows[${rowIndex}]`, errors);
        });
      }
      return;
    case "image":
      if (!isNonEmptyString(value.src)) {
        errors.push(`${path}.src must be a non-empty string.`);
      } else if (!isSafeReference(value.src)) {
        errors.push(`${path}.src must be a safe relative asset path or http(s) URL.`);
      }
      if (value.alt !== undefined && typeof value.alt !== "string") {
        errors.push(`${path}.alt must be a string.`);
      }
      if (value.title !== undefined && typeof value.title !== "string") {
        errors.push(`${path}.title must be a string.`);
      }
      return;
    case "custom":
      if (!isNonEmptyString(value.namespace)) {
        errors.push(`${path}.namespace must be a non-empty string.`);
      }
      if (!isNonEmptyString(value.name)) {
        errors.push(`${path}.name must be a non-empty string.`);
      }
      if (!isJsonValue(value.data)) {
        errors.push(`${path}.data must be JSON-serializable.`);
      }
      if (value.fallback !== undefined) {
        validateFallbackBlock(value.fallback, `${path}.fallback`, errors);
      }
      return;
    default:
      errors.push(`${path}.type is not a supported block type.`);
  }
}

function validateListItem(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (value.metadata !== undefined && !isJsonObject(value.metadata)) {
    errors.push(`${path}.metadata must be a JSON object.`);
  }
  validateBlockArray(value.children, `${path}.children`, errors);
}

function validateTableRow(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (value.metadata !== undefined && !isJsonObject(value.metadata)) {
    errors.push(`${path}.metadata must be a JSON object.`);
  }
  if (!Array.isArray(value.cells)) {
    errors.push(`${path}.cells must be an array.`);
    return;
  }
  value.cells.forEach((cell, cellIndex) => {
    validateTableCell(cell, `${path}.cells[${cellIndex}]`, errors);
  });
}

function validateTableCell(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (value.metadata !== undefined && !isJsonObject(value.metadata)) {
    errors.push(`${path}.metadata must be a JSON object.`);
  }
  validateBlockArray(value.children, `${path}.children`, errors);
}

function validateBlockArray(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }

  value.forEach((block, index) => {
    validateBlock(block, `${path}[${index}]`, errors);
  });
}

function validateInlineArray(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }

  value.forEach((inline, index) => {
    validateInline(inline, `${path}[${index}]`, errors);
  });
}

function validateInline(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  if (value.metadata !== undefined && !isJsonObject(value.metadata)) {
    errors.push(`${path}.metadata must be a JSON object.`);
  }

  switch (value.type) {
    case "text":
      if (typeof value.text !== "string") {
        errors.push(`${path}.text must be a string.`);
      }
      if (value.marks !== undefined) {
        validateMarks(value.marks, `${path}.marks`, errors);
      }
      return;
    case "hard_break":
      return;
    default:
      errors.push(`${path}.type is not a supported inline type.`);
  }
}

function validateMarks(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }

  value.forEach((mark, index) => {
    validateMark(mark, `${path}[${index}]`, errors);
  });
}

function validateMark(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  switch (value.type) {
    case "bold":
    case "italic":
    case "underline":
    case "code":
      return;
    case "link":
      if (!isNonEmptyString(value.href)) {
        errors.push(`${path}.href must be a non-empty string.`);
      } else if (!isSafeReference(value.href)) {
        errors.push(`${path}.href must be a safe relative path or http(s) URL.`);
      }
      if (value.title !== undefined && typeof value.title !== "string") {
        errors.push(`${path}.title must be a string.`);
      }
      return;
    default:
      errors.push(`${path}.type is not a supported mark type.`);
  }
}

export function isJsonObject(value: unknown): value is JsonObject {
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return Number.isFinite(value) || typeof value !== "number";
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isJsonObject(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validateFallbackBlock(value: unknown, path: string, errors: string[]): void {
  if (isRecord(value) && value.type === "custom") {
    errors.push(`${path} must not be another custom block.`);
    return;
  }

  validateBlock(value, path, errors);
}

function isSafeReference(value: string): boolean {
  const lower = value.trim().toLowerCase();
  if (
    lower.length === 0 ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("/") ||
    lower.includes("\\")
  ) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return !value.split("/").some((part) => part === "..");
  }
}

export function text(value: string, marks?: LocalDocMark[]): LocalDocInline {
  return {
    type: "text",
    text: value,
    ...(marks && marks.length > 0 ? { marks } : {})
  };
}

export function paragraph(children: LocalDocInline[]): LocalDocBlock {
  return { type: "paragraph", children };
}
