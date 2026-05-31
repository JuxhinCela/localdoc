export { LOCALDOC_FORMAT_VERSION } from "./types.js";
export type {
  ConversionLoss,
  ConversionLossSeverity,
  ConversionResult,
  CreateProjectInput,
  HtmlOptions,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  LocalDocBlock,
  LocalDocDocument,
  LocalDocGenerator,
  LocalDocInline,
  LocalDocListItem,
  LocalDocManifest,
  LocalDocMark,
  LocalDocProject,
  LocalDocTableCell,
  LocalDocTableRow,
  MarkdownOptions,
  ValidationResult
} from "./types.js";
export type {
  LocalDocAdapter,
  LocalDocReadOptions,
  LocalDocReadResult,
  LocalDocWriteOptions,
  LocalDocWriteResult
} from "./adapter.js";
export { createProject } from "./project.js";
export { readProject, writeProject } from "./project-io.js";
export type { ConformanceCheck, ConformanceReport, ConformanceStatus } from "./conformance.js";
export { runConformance } from "./conformance.js";
export { fromMarkdown, fromMarkdownWithLosses, toMarkdown, toMarkdownWithLosses } from "./markdown.js";
export { fromHtml, fromHtmlWithLosses, toHtml, toHtmlWithLosses } from "./html.js";
export { validateProjectWithSchemas } from "./schema-validation.js";
export {
  LocalDocValidationError,
  assertValidProject,
  isJsonObject,
  isJsonValue,
  paragraph,
  text,
  validateProject
} from "./validation.js";
