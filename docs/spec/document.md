# LocalDoc Document Model

The document model is a JSON tree of blocks and inline content.

## Blocks

v0.2 block types:

- `paragraph`
- `heading`
- `list`
- `quote`
- `code`
- `table`
- `image`
- `custom`

## Inline Content

v0.2 inline types:

- `text`
- `hard_break`

Text MAY carry marks:

- `bold`
- `italic`
- `underline`
- `code`
- `link`

## References

Image `src` and link `href` values MUST be safe relative references or `http(s)`
URLs. They MUST NOT use `javascript:`, `data:`, `file:`, absolute local paths,
backslashes, or parent-directory traversal.
