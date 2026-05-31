import { parse, type HTMLElement, type Node as HtmlNode } from "node-html-parser";
import { createProject } from "./project.js";
import type {
  ConversionResult,
  ConversionLoss,
  HtmlOptions,
  JsonValue,
  LocalDocBlock,
  LocalDocInline,
  LocalDocMark,
  LocalDocProject,
  LocalDocTableRow
} from "./types.js";

export function fromHtml(html: string, options: HtmlOptions = {}): LocalDocProject {
  return fromHtmlWithLosses(html, options).value;
}

export function fromHtmlWithLosses(
  html: string,
  options: HtmlOptions = {}
): ConversionResult<LocalDocProject> {
  const root = parse(html);
  const body = root.querySelector("body") ?? root;

  return {
    value: createProject({
      title: options.title ?? root.querySelector("title")?.textContent.trim() ?? "Untitled document",
      blocks: nodesToBlocks(body.childNodes),
      generator: options.generator ?? { name: "localdoc-html", version: "0.2.0-alpha.0" },
      now: options.now
    }),
    losses: []
  };
}

export function toHtml(project: LocalDocProject): string {
  return toHtmlWithLosses(project).value;
}

export function toHtmlWithLosses(project: LocalDocProject): ConversionResult<string> {
  const losses = collectHtmlLosses(project.document.blocks);
  return {
    value: renderHtmlDocument(project),
    losses
  };
}

function renderHtmlDocument(project: LocalDocProject): string {
  const title = escapeHtml(project.manifest.title);
  const body = project.document.blocks.map(renderHtmlBlock).join("\n");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    `  <title>${title}</title>`,
    "</head>",
    "<body>",
    body,
    "</body>",
    "</html>"
  ].join("\n");
}

function collectHtmlLosses(blocks: LocalDocBlock[]): ConversionLoss[] {
  return blocks.flatMap((block, index) => {
    if (block.type !== "custom") {
      return block.type === "quote" ? collectHtmlLosses(block.children) : [];
    }

    return [
      {
        severity: "warning" as const,
        path: `/document/blocks/${index}`,
        feature: "custom-block",
        message: `Custom block ${block.namespace}/${block.name} is rendered with fallback HTML.`
      }
    ];
  });
}

function nodesToBlocks(nodes: HtmlNode[]): LocalDocBlock[] {
  return nodes.flatMap((node) => nodeToBlocks(node));
}

function nodeToBlocks(node: HtmlNode): LocalDocBlock[] {
  if (isTextNode(node)) {
    const text = node.textContent.trim();
    return text ? [{ type: "paragraph", children: [{ type: "text", text }] }] : [];
  }

  if (!isElement(node)) {
    return [];
  }

  const tag = tagName(node);

  if (/^h[1-6]$/.test(tag)) {
    return [
      {
        type: "heading",
        level: Number(tag.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6,
        children: nodesToInlines(node.childNodes)
      }
    ];
  }

  switch (tag) {
    case "p":
      return [{ type: "paragraph", children: nodesToInlines(node.childNodes) }];
    case "blockquote":
      return [{ type: "quote", children: nodesToBlocks(node.childNodes) }];
    case "pre": {
      const code = node.querySelector("code");
      const className = code?.getAttribute("class") ?? "";
      const language = className.startsWith("language-") ? className.slice("language-".length) : "";
      return [
        {
          type: "code",
          text: (code ?? node).textContent,
          ...(language ? { language } : {})
        }
      ];
    }
    case "ul":
    case "ol":
      return [
        {
          type: "list",
          ordered: tag === "ol",
          items: node
            .querySelectorAll("li")
            .filter((li) => li.parentNode === node)
            .map((li) => ({
              children:
                nodesToBlocks(li.childNodes).length > 0
                  ? nodesToBlocks(li.childNodes)
                  : [{ type: "paragraph", children: nodesToInlines(li.childNodes) }]
            }))
        }
      ];
    case "table":
      return [{ type: "table", rows: tableElementToRows(node) }];
    case "img":
      return [
        {
          type: "image",
          src: node.getAttribute("src") ?? "",
          ...(node.getAttribute("alt") ? { alt: node.getAttribute("alt") ?? "" } : {}),
          ...(node.getAttribute("title") ? { title: node.getAttribute("title") ?? "" } : {})
        }
      ];
    case "div":
      if (node.hasAttribute("data-localdoc-custom")) {
        const namespace = node.getAttribute("data-localdoc-namespace") ?? "localdoc.dev/html";
        const name = node.getAttribute("data-localdoc-name") ?? "custom";
        return [
          {
            type: "custom",
            namespace,
            name,
            data: parseCustomData(node.textContent),
            fallback: {
              type: "paragraph",
              children: [{ type: "text", text: "[Unsupported custom HTML block]" }]
            }
          }
        ];
      }
      return nodesToBlocks(node.childNodes);
    default:
      return nodesToBlocks(node.childNodes);
  }
}

function tableElementToRows(table: HTMLElement): LocalDocTableRow[] {
  return table.querySelectorAll("tr").map((row) => ({
    cells: row.querySelectorAll("th,td").map((cell) => ({
      children: [{ type: "paragraph", children: nodesToInlines(cell.childNodes) }]
    }))
  }));
}

function nodesToInlines(nodes: HtmlNode[], inheritedMarks: LocalDocMark[] = []): LocalDocInline[] {
  return nodes.flatMap((node) => nodeToInlines(node, inheritedMarks));
}

function nodeToInlines(node: HtmlNode, inheritedMarks: LocalDocMark[]): LocalDocInline[] {
  if (isTextNode(node)) {
    return node.textContent.length > 0
      ? [
          {
            type: "text",
            text: node.textContent,
            ...(inheritedMarks.length > 0 ? { marks: inheritedMarks } : {})
          }
        ]
      : [];
  }

  if (!isElement(node)) {
    return [];
  }

  const tag = tagName(node);

  switch (tag) {
    case "br":
      return [{ type: "hard_break" }];
    case "strong":
    case "b":
      return nodesToInlines(node.childNodes, [...inheritedMarks, { type: "bold" }]);
    case "em":
    case "i":
      return nodesToInlines(node.childNodes, [...inheritedMarks, { type: "italic" }]);
    case "u":
      return nodesToInlines(node.childNodes, [...inheritedMarks, { type: "underline" }]);
    case "code":
      return nodesToInlines(node.childNodes, [...inheritedMarks, { type: "code" }]);
    case "a": {
      const href = node.getAttribute("href") ?? "";
      const title = node.getAttribute("title") ?? undefined;
      return nodesToInlines(node.childNodes, [
        ...inheritedMarks,
        { type: "link", href, ...(title ? { title } : {}) }
      ]);
    }
    default:
      return nodesToInlines(node.childNodes, inheritedMarks);
  }
}

function renderHtmlBlock(block: LocalDocBlock): string {
  switch (block.type) {
    case "paragraph":
      return `<p>${renderHtmlInline(block.children)}</p>`;
    case "heading":
      return `<h${block.level}>${renderHtmlInline(block.children)}</h${block.level}>`;
    case "quote":
      return `<blockquote>\n${block.children.map(renderHtmlBlock).join("\n")}\n</blockquote>`;
    case "code":
      return `<pre><code${
        block.language ? ` class="language-${escapeAttribute(block.language)}"` : ""
      }>${escapeHtml(block.text)}</code></pre>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .map((item) => `<li>${item.children.map(renderHtmlBlock).join("\n")}</li>`)
        .join("\n");
      return `<${tag}>\n${items}\n</${tag}>`;
    }
    case "table":
      return renderHtmlTable(block.rows);
    case "image":
      return `<img src="${escapeAttribute(block.src)}" alt="${escapeAttribute(block.alt ?? "")}"${
        block.title ? ` title="${escapeAttribute(block.title)}"` : ""
      }>`;
    case "custom":
      return block.fallback
        ? renderHtmlBlock(block.fallback)
        : `<div data-localdoc-custom data-localdoc-namespace="${escapeAttribute(
            block.namespace
          )}" data-localdoc-name="${escapeAttribute(block.name)}" hidden>${escapeHtml(
            JSON.stringify(block.data)
          )}</div>`;
  }
}

function renderHtmlTable(rows: LocalDocTableRow[]): string {
  const renderedRows = rows
    .map((row, rowIndex) => {
      const cellTag = rowIndex === 0 ? "th" : "td";
      const cells = row.cells
        .map((cell) => `<${cellTag}>${cell.children.map(renderHtmlBlock).join("\n")}</${cellTag}>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("\n");

  return `<table>\n${renderedRows}\n</table>`;
}

function renderHtmlInline(inlines: LocalDocInline[]): string {
  return inlines
    .map((inline) => {
      if (inline.type === "hard_break") {
        return "<br>";
      }

      return applyHtmlMarks(escapeHtml(inline.text), inline.marks ?? []);
    })
    .join("");
}

function applyHtmlMarks(value: string, marks: LocalDocMark[]): string {
  return marks.reduce((current, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong>${current}</strong>`;
      case "italic":
        return `<em>${current}</em>`;
      case "underline":
        return `<u>${current}</u>`;
      case "code":
        return `<code>${current}</code>`;
      case "link":
        return `<a href="${escapeAttribute(mark.href)}"${
          mark.title ? ` title="${escapeAttribute(mark.title)}"` : ""
        }>${current}</a>`;
    }
  }, value);
}

function parseCustomData(value: string): JsonValue {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isJsonValue(parsed) ? parsed : { raw: value };
  } catch {
    return { raw: value };
  }
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function isTextNode(node: HtmlNode): boolean {
  return node.nodeType === 3;
}

function isElement(node: HtmlNode): node is HTMLElement {
  return node.nodeType === 1;
}

function tagName(node: HTMLElement): string {
  return (node.rawTagName || node.tagName || "").toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
