import type { ConversionLoss, LocalDocProject } from "./types.js";

export interface LocalDocReadOptions {
  onLoss?: "report" | "throw";
}

export interface LocalDocWriteOptions {
  unsupported?: "fallback" | "drop" | "throw";
}

export interface LocalDocReadResult {
  project: LocalDocProject;
  losses: ConversionLoss[];
}

export interface LocalDocWriteResult<T> {
  output: T;
  losses: ConversionLoss[];
}

export interface LocalDocAdapter<Input, Output> {
  name: string;
  read(input: Input, options?: LocalDocReadOptions): LocalDocReadResult;
  write(project: LocalDocProject, options?: LocalDocWriteOptions): LocalDocWriteResult<Output>;
}
