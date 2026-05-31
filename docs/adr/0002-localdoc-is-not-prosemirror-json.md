# ADR 0002: LocalDoc Is Not ProseMirror JSON

## Status

Accepted

## Context

ProseMirror and Tiptap are important editor ecosystems. Their JSON document
models are schema-governed and excellent for editor runtime behavior.

## Decision

LocalDoc keeps its own package and document format. ProseMirror/Tiptap support
belongs in adapters, not in the canonical LocalDoc format.

## Consequences

LocalDoc can preserve a neutral interchange model while still round-tripping
through real editor ecosystems via adapters and support matrices.
