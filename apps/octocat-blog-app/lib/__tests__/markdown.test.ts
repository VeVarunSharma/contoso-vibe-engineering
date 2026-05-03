import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  describe("safe formatting", () => {
    it("renders bold text", () => {
      expect(renderMarkdown("**bold**")).toContain("<strong>bold</strong>");
    });

    it("renders italics", () => {
      expect(renderMarkdown("*italic*")).toContain("<em>italic</em>");
    });

    it("renders headings", () => {
      const html = renderMarkdown("# Title");
      expect(html).toContain("<h1>Title</h1>");
    });

    it("renders inline code", () => {
      expect(renderMarkdown("Use `npm` here")).toContain("<code>npm</code>");
    });

    it("renders code blocks", () => {
      const html = renderMarkdown("```\nconst x = 1;\n```");
      expect(html).toContain("<pre>");
      expect(html).toContain("const x = 1;");
    });

    it("renders links with safe attributes", () => {
      const html = renderMarkdown("[GitHub](https://github.com)");
      expect(html).toContain('href="https://github.com"');
      expect(html).toContain("GitHub");
    });

    it("renders unordered lists", () => {
      const html = renderMarkdown("- one\n- two");
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>one</li>");
      expect(html).toContain("<li>two</li>");
    });

    it("renders empty input as empty string", () => {
      expect(renderMarkdown("")).toBe("");
    });
  });

  describe("XSS protection", () => {
    it("strips inline <script> tags", () => {
      const html = renderMarkdown("<script>alert('xss')</script>");
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("alert(");
    });

    it("strips <script> tags inside markdown content", () => {
      const html = renderMarkdown("Hello <script>alert(1)</script> world");
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("alert(1)");
    });

    it("strips javascript: links", () => {
      const html = renderMarkdown("[click](javascript:alert('xss'))");
      expect(html).not.toMatch(/href\s*=\s*["']?\s*javascript:/i);
    });

    it("strips onerror attribute on img", () => {
      const html = renderMarkdown(
        '<img src="x" onerror="alert(\'xss\')" />'
      );
      expect(html).not.toContain("onerror");
      expect(html).not.toContain("alert(");
    });

    it("strips iframe tags", () => {
      const html = renderMarkdown(
        '<iframe src="https://evil.example"></iframe>'
      );
      expect(html).not.toContain("<iframe");
    });

    it("strips style tags", () => {
      const html = renderMarkdown(
        "<style>body { background: url('javascript:alert(1)') }</style>"
      );
      expect(html).not.toContain("<style");
    });

    it("strips inline event handlers in HTML", () => {
      const html = renderMarkdown('<a href="#" onclick="steal()">x</a>');
      expect(html).not.toContain("onclick");
    });

    it("strips data: URI scripts", () => {
      const html = renderMarkdown(
        "[click](data:text/html,<script>alert('xss')</script>)"
      );
      expect(html).not.toContain("<script>");
    });

    it("strips form tags", () => {
      const html = renderMarkdown(
        '<form action="https://evil.example"><input /></form>'
      );
      expect(html).not.toContain("<form");
    });
  });
});
