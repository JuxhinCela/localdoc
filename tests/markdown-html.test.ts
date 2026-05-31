import { describe, expect, it } from "vitest";
import {
  fromHtml,
  fromMarkdown,
  toHtml,
  toMarkdown,
  validateProject
} from "../src/index.js";

describe("Markdown and HTML conversion", () => {
  it("converts Markdown to LocalDoc and back", () => {
    const project = fromMarkdown(
      [
        "# Personal Word Processor",
        "",
        "A **local** document with [portable links](https://example.com).",
        "",
        "- Own your files",
        "- Move between editors"
      ].join("\n"),
      { now: "2026-05-31T00:00:00.000Z" }
    );

    expect(validateProject(project).ok).toBe(true);

    const markdown = toMarkdown(project);
    expect(markdown).toContain("# Personal Word Processor");
    expect(markdown).toContain("**local**");
    expect(markdown).toContain("[portable links](https://example.com)");
    expect(markdown).toContain("- Own your files");
  });

  it("keeps Markdown image blocks as portable image blocks", () => {
    const project = fromMarkdown("![Diagram](assets/diagram.png \"System map\")\n", {
      now: "2026-05-31T00:00:00.000Z"
    });

    expect(project.document.blocks[0]).toEqual({
      type: "image",
      src: "assets/diagram.png",
      alt: "Diagram",
      title: "System map"
    });
    expect(toMarkdown(project)).toContain('![Diagram](assets/diagram.png "System map")');
  });

  it("converts HTML to LocalDoc and back", () => {
    const project = fromHtml(
      [
        "<!doctype html>",
        "<html>",
        "<head><title>Research Notes</title></head>",
        "<body>",
        "<h1>Research Notes</h1>",
        "<p><strong>Local</strong> notes with <a href=\"https://example.com\">sources</a>.</p>",
        "<blockquote><p>Keep documents portable.</p></blockquote>",
        "</body>",
        "</html>"
      ].join("\n"),
      { now: "2026-05-31T00:00:00.000Z" }
    );

    expect(validateProject(project).ok).toBe(true);
    expect(project.manifest.title).toBe("Research Notes");

    const html = toHtml(project);
    expect(html).toContain("<h1>Research Notes</h1>");
    expect(html).toContain("<strong>Local</strong>");
    expect(html).toContain('<a href="https://example.com">sources</a>');
  });
});
