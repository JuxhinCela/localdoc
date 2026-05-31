export { LOCALDOC_FORMAT_VERSION } from "./types.js";
export type {
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
export { createProject } from "./project.js";
export { readProject, writeProject } from "./project-io.js";
export { fromMarkdown, toMarkdown } from "./markdown.js";
export { fromHtml, toHtml } from "./html.js";
export {
  LocalDocValidationError,
  assertValidProject,
  isJsonObject,
  isJsonValue,
  paragraph,
  text,
  validateProject
} from "./validation.js";
