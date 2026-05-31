# ADR 0003: Reader to LocalDoc to Writer

## Status

Accepted

## Context

Document formats rarely convert losslessly. A useful interchange project must
be explicit about what was preserved, degraded, or dropped.

## Decision

LocalDoc adapters follow a reader to LocalDoc to writer pipeline. Conversions
must report losses with `ConversionLoss`.

## Consequences

Adapters can be honest about partial support while still participating in the
same conformance ecosystem.
