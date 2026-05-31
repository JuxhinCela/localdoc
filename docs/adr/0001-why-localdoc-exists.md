# ADR 0001: Why LocalDoc Exists

## Status

Accepted

## Context

AI coding tools make it easier to build custom document editors. Without a
shared interchange layer, those editors risk creating many incompatible private
document formats.

## Decision

LocalDoc will define a local-first document package format, SDK, CLI, schemas,
fixtures, and conformance suite for portable rich-text documents.

## Consequences

LocalDoc prioritizes portability, validation, and adapter behavior over editor
UI features.
