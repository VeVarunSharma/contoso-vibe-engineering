/**
 * Escapes a string for safe interpolation into Markdown content.
 *
 * Strips newlines and escapes characters that have semantic meaning in
 * Markdown or HTML. Use this on any user-supplied field before embedding it
 * in a GitHub issue body or other Markdown-rendered context to prevent
 * injection attacks (e.g. fake heading rows, embedded HTML, malicious links).
 *
 * Note: This is intentionally aggressive — fields treated as plain identifiers
 * (name, email, subject, priority) should never need formatting. For
 * fields where users may legitimately use markdown (e.g. description), do
 * not apply this helper; rely on GitHub's own renderer + sandboxed display.
 */
export function escapeMarkdown(input: string | null | undefined): string {
  if (input == null) return "";

  const stringified = String(input);

  return stringified
    .replace(/[\r\n]+/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!")
    .replace(/\|/g, "\\|")
    .trim();
}
