import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import * as addFormatsModule from "ajv-formats";
import type { ValidateFunction } from "ajv";
import type { ValidationResult } from "./types.js";

const SCHEMA_FILES = [
  "localdoc.manifest.v0.2.schema.json",
  "localdoc.document.v0.2.schema.json",
  "localdoc.package.v0.2.schema.json"
] as const;

let validatorPromise: Promise<ValidateFunction> | undefined;

export async function validateProjectWithSchemas(project: unknown): Promise<ValidationResult> {
  const validator = await getPackageValidator();
  const ok = validator(project);

  if (ok) {
    return { ok: true, errors: [] };
  }

  return {
    ok: false,
    errors: (validator.errors ?? []).map((error) => {
      const path = error.instancePath || "/";
      return `${path} ${error.message ?? "is invalid"}`;
    })
  };
}

async function getPackageValidator(): Promise<ValidateFunction> {
  validatorPromise ??= createPackageValidator();
  return validatorPromise;
}

async function createPackageValidator(): Promise<ValidateFunction> {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const addFormats = (addFormatsModule as unknown as {
    default: (validator: Ajv2020) => void;
  }).default;
  addFormats(ajv);
  const schemas = await Promise.all(
    SCHEMA_FILES.map(async (file) => {
      const raw = await readFile(new URL(`../schemas/${file}`, import.meta.url), "utf8");
      return JSON.parse(raw) as object;
    })
  );

  const [manifestSchema, documentSchema, packageSchema] = schemas;
  ajv.addSchema(manifestSchema);
  ajv.addSchema(documentSchema);

  return ajv.compile(packageSchema);
}
