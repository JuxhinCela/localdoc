# LocalDoc Assets

Assets live under the package `assets/` directory.

Asset references MUST be relative paths and MUST NOT traverse outside the
package.

v0.2 validates reference safety. Full asset existence, MIME allowlist, and
integrity checks are planned for a later alpha.

## Security

Processors MUST treat package paths and imported assets as untrusted input.
Lossy exports SHOULD report missing or unsupported assets with `ConversionLoss`.
