import { marked } from "marked";
import { createProject } from "./project.js";
import type {
  ConversionResult,
  ConversionLoss,
  HtmlOptions,
  LocalDocBlock,
  LocalDocInline,
  LocalDocMark,
  LocalDocProject,
  LocalDocTableRow,
  MarkdownOptions
} from "./types.js";

type MarkedToken = Record<string, unknown>;

export function fromMarkdown(markdown: string, options: MarkdownOptions = {}): LocalDocProject {
  return fromMarkdownWithLosses(markdown, options).value;
}

export function fromMarkdownWithLosses(
  markdown: string,
  options: MarkdownOptions = {}
): ConversionResult<LocalDocProject> {
  const tokens = marked.lexer(markdown) as MarkedToken[];

  return {
    value: createProject({
      title: options.title ?? firstHeading(tokens) ?? "Untitled document",
      blocks: tokensToBlocks(tokens),
      generator: options.generator ?? { name: "localdoc-markdown", version: "0.2.0-alpha.0" },
      now: options.now
    }),
    losses: []
  };
}

export function toMarkdown(project: LocalDocProject): string {
  return toMarkdownWithLosses(project).value;
}

export function toMarkdownWithLosses(project: LocalDocProject): ConversionResult<string> {
  const losses = collectMarkdownLosses(project.document.blocks);
  return {
    value: `${project.document.blocks.map(renderMarkdownBlock).join("\n\n").trim()}\n`,
    losses
  };
}

function collectMarkdownLosses(blocks: LocalDocBlock[]): ConversionLoss[] {
  return blocks.flatMap((block, index) => {
    if (block.type !== "custom") {
      return block.type === "quote" ? collectMarkdownLosses(block.children) : [];
    }

    return [
      {
        severity: "warning" as const,
        path: `/document/blocks/${index}`,
        feature: "custom-block",
        message: `Custom block ${block.namespace}/${block.name} is rendered as a fallback comment in Markdown.`
      }
    ];
  });
}

export function renderMarkdown(project: LocalDocProject): string {
  return `${project.document.blocks.map(renderMarkdownBlock).join("\n\n").trim()}\n`;
}

function tokensToBlocks(tokens: MarkedToken[]): LocalDocBlock[] {
  return tokens.flatMap((token) => tokenToBlocks(token));
}

function tokenToBlocks(token: MarkedToken): LocalDocBlock[] {
  switch (token.type) {
    case "space":
      return [];
    case "heading":
      return [
        {
          type: "heading",
          level: normalizeHeadingDepth(token.depth),
          children: parseInline(String(token.text ?? ""))
        }
      ];
    case "paragraph":
    case "text":
      if (typeof token.text === "string") {
        const image = parseImageOnlyParagraph(token.text);
        if (image) {
          return [image];
        }
      }
      return [
        {
          type: "paragraph",
          children: parseInline(String(token.text ?? token.raw ?? ""))
        }
      ];
    case "blockquote":
      return [
        {
          type: "quote",
          children: tokensToBlocks((token.tokens as MarkedToken[] | undefined) ?? [])
        }
      ];
    case "code":
      return [
        {
          type: "code",
          text: String(token.text ?? ""),
          ...(typeof token.lang === "string" && token.lang.length > 0
            ? { language: token.lang }
            : {})
        }
      ];
    case "list":
      return [
        {
          type: "list",
          ordered: Boolean(token.ordered),
          items: ((token.items as MarkedToken[] | undefined) ?? []).map((item) => ({
            children: tokensToBlocks((item.tokens as MarkedToken[] | undefined) ?? [])
          }))
        }
      ];
    case "table":
      return [
        {
          type: "table",
          rows: tableTokenToRows(token)
        }
      ];
    case "html":
      return [
        {
          type: "custom",
          namespace: "localdoc.dev/markdown",
          name: "html",
          data: { raw: String(token.raw ?? token.text ?? "") },
          fallback: {
            type: "paragraph",
            children: [{ type: "text", text: "[Unsupported HTML block]" }]
          }
        }
      ];
    default:
      return [
        {
          type: "custom",
          namespace: "localdoc.dev/markdown",
          name: String(token.type ?? "unknown"),
          data: { raw: String(token.raw ?? "") },
          fallback: {
            type: "paragraph",
            children: [{ type: "text", text: "[Unsupported Markdown block]" }]
          }
        }
      ];
  }
}

function parseImageOnlyParagraph(value: string): LocalDocBlock | undefined {
  const match = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)$/.exec(value.trim());
  if (!match) {
    return undefined;
  }

  return {
    type: "image",
    src: match[2] ?? "",
    ...(match[1] ? { alt: match[1] } : {}),
    ...(match[3] ? { title: match[3] } : {})
  };
}

function tableTokenToRows(token: MarkedToken): LocalDocTableRow[] {
  const header = normalizeTableCells(token.header);
  const rows = normalizeTableRows(token.rows);
  const allRows = header.length > 0 ? [header, ...rows] : rows;

  return allRows.map((row) => ({
    cells: row.map((cell) => ({
      children: [{ type: "paragraph", children: parseInline(cell) }]
    }))
  }));
}

function normalizeTableCells(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((cell) => {
    if (typeof cell === "string") {
      return cell;
    }
    if (cell && typeof cell === "object" && "text" in cell) {
      return String((cell as { text: unknown }).text ?? "");
    }
    return String(cell ?? "");
  });
}

function normalizeTableRows(value: unknown): string[][] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeTableCells);
}

function firstHeading(tokens: MarkedToken[]): string | undefined {
  const heading = tokens.find((token) => token.type === "heading" && typeof token.text === "string");
  return heading ? String(heading.text) : undefined;
}

function normalizeHeadingDepth(depth: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  if (depth === 1 || depth === 2 || depth === 3 || depth === 4 || depth === 5 || depth === 6) {
    return depth;
  }
  return 1;
}

function parseInline(value: string, inheritedMarks: LocalDocMark[] = []): LocalDocInline[] {
  const output: LocalDocInline[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const remaining = value.slice(cursor);
    const match = findNextInlineMatch(remaining);

    if (!match) {
      pushText(output, remaining, inheritedMarks);
      break;
    }

    if (match.index > 0) {
      pushText(output, remaining.slice(0, match.index), inheritedMarks);
    }

    const token = match.value;
    if (token.kind === "link") {
      output.push(
        ...parseInline(token.label, [
          ...inheritedMarks,
          {
            type: "link",
            href: token.href,
            ...(token.title ? { title: token.title } : {})
          }
        ])
      );
    } else {
      output.push(...parseInline(token.text, [...inheritedMarks, { type: token.kind }]));
    }

    cursor += match.index + token.raw.length;
  }

  return output;
}

type InlineMatch =
  | { kind: "bold" | "italic" | "code"; raw: string; text: string }
  | { kind: "link"; raw: string; label: string; href: string; title?: string };

function findNextInlineMatch(input: string): { index: number; value: InlineMatch } | undefined {
  const patterns: Array<[RegExp, (match: RegExpExecArray) => InlineMatch]> = [
    [
      /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/,
      (match) => ({
        kind: "link",
        raw: match[0],
        label: match[1] ?? "",
        href: match[2] ?? "",
        ...(match[3] ? { title: match[3] } : {})
      })
    ],
    [
      /\*\*([^*]+)\*\*/,
      (match) => ({ kind: "bold", raw: match[0], text: match[1] ?? "" })
    ],
    [
      /`([^`]+)`/,
      (match) => ({ kind: "code", raw: match[0], text: match[1] ?? "" })
    ],
    [
      /\*([^*]+)\*/,
      (match) => ({ kind: "italic", raw: match[0], text: match[1] ?? "" })
    ]
  ];

  const matches = patterns.flatMap(([pattern, map]) => {
    const match = pattern.exec(input);
    return match && match.index >= 0 ? [{ index: match.index, value: map(match) }] : [];
  });

  return matches.sort((left, right) => left.index - right.index)[0];
}

function pushText(output: LocalDocInline[], value: string, marks: LocalDocMark[]): void {
  if (value.length === 0) {
    return;
  }

  output.push({
    type: "text",
    text: value,
    ...(marks.length > 0 ? { marks } : {})
  });
}

function renderMarkdownBlock(block: LocalDocBlock): string {
  switch (block.type) {
    case "paragraph":
      return renderMarkdownInline(block.children);
    case "heading":
      return `${"#".repeat(block.level)} ${renderMarkdownInline(block.children)}`;
    case "quote":
      return block.children
        .map(renderMarkdownBlock)
        .join("\n\n")
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "code":
      return `\`\`\`${block.language ?? ""}\n${block.text}\n\`\`\``;
    case "list":
      return block.items
        .map((item, index) => {
          const marker = block.ordered ? `${index + 1}.` : "-";
          const rendered = item.children.map(renderMarkdownBlock).join("\n\n");
          return rendered
            .split("\n")
            .map((line, lineIndex) => (lineIndex === 0 ? `${marker} ${line}` : `  ${line}`))
            .join("\n");
        })
        .join("\n");
    case "table":
      return renderMarkdownTable(block.rows);
    case "image":
      return `![${escapeMarkdownLabel(block.alt ?? "")}](${block.src}${
        block.title ? ` "${block.title}"` : ""
      })`;
    case "custom":
      return block.fallback
        ? renderMarkdownBlock(block.fallback)
        : `<!-- localdoc-custom:${block.namespace}/${block.name} ${JSON.stringify(block.data)} -->`;
  }
}

function renderMarkdownTable(rows: LocalDocTableRow[]): string {
  if (rows.length === 0) {
    return "";
  }

  const renderedRows = rows.map((row) =>
    row.cells.map((cell) => cell.children.map(renderMarkdownBlock).join(" ").replace(/\n+/g, " "))
  );
  const width = Math.max(...renderedRows.map((row) => row.length));
  const normalized = renderedRows.map((row) =>
    Array.from({ length: width }, (_, index) => row[index] ?? "")
  );

  const [header, ...body] = normalized;
  const separator = Array.from({ length: width }, () => "---");
  return [header, separator, ...body].map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function renderMarkdownInline(inlines: LocalDocInline[]): string {
  return inlines
    .map((inline) => {
      if (inline.type === "hard_break") {
        return "  \n";
      }

      return renderMarkedText(inline.text, inline.marks ?? []);
    })
    .join("");
}

function renderMarkedText(value: string, marks: LocalDocMark[]): string {
  return marks.reduce((current, mark) => {
    switch (mark.type) {
      case "bold":
        return `**${current}**`;
      case "italic":
        return `*${current}*`;
      case "underline":
        return `<u>${current}</u>`;
      case "code":
        return `\`${current}\``;
      case "link":
        return `[${current}](${mark.href}${mark.title ? ` "${mark.title}"` : ""})`;
    }
  }, value);
}

function escapeMarkdownLabel(value: string): string {
  return value.replace(/]/g, "\\]");
}

export type { HtmlOptions };
