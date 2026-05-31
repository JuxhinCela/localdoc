# Codex For OSS Application Packet

## Project Summary

LocalDoc is an open local-first document package format, TypeScript SDK, CLI,
and conformance suite for portable rich-text documents.

## Why It Matters

AI coding tools make it easy for people to generate custom document editors.
Without a shared protocol, those editors can create many incompatible private
JSON formats. LocalDoc gives those tools a common package format, validation
layer, fixture suite, and conformance target.

## Current Status

- Public GitHub repo.
- v0.1.0 release.
- v0.2 alpha foundation work.
- Runtime validator and JSON Schema validator.
- CLI for init, inspect, validate, convert, and conformance.
- Markdown and HTML adapters.
- Valid and invalid fixtures.
- Conversion-loss model.

## How Codex Would Help

- Expand conformance fixtures.
- Harden HTML and asset parsing.
- Build the Tiptap/ProseMirror adapter.
- Maintain adapter support matrices.
- Add browser interchange demos.
- Review security-sensitive conversion code.
