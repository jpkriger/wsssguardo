// Client-side report export.
//
// The styled report lives only in the browser as rendered React/Tailwind markup.
// Instead of asking the backend to rebuild (and re-style) it, we serialize the
// live preview node together with the page's own stylesheets so the exported
// HTML/PDF look exactly like what the user sees in the preview pane.

/**
 * Serialize every same-origin stylesheet currently applied to the document.
 * Cross-origin sheets (e.g. third-party fonts) throw on `.cssRules` access, so
 * we fall back to re-linking them by href.
 */
function collectDocumentStyles(): string {
  const parts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      let css = "";
      for (const rule of Array.from(rules)) {
        css += rule.cssText + "\n";
      }
      parts.push(`<style>${css}</style>`);
    } catch {
      // Opaque (cross-origin) sheet: re-reference it by URL instead.
      if (sheet.href) {
        parts.push(`<link rel="stylesheet" href="${sheet.href}">`);
      }
    }
  }

  return parts.join("\n");
}

// In-document anchor navigation (e.g. the technical report's "jump to finding"
// links) uses fragment URLs like `<a href="#finding-123">`. Because the
// exported document sets a `<base href>` so fonts/images keep resolving, a bare
// fragment would otherwise resolve against that base origin and navigate away
// from the saved file instead of scrolling within it. This handler matches on
// the raw `href` attribute, so it scrolls correctly regardless of `<base>`.
const ANCHOR_NAV_SCRIPT = `<script>
document.addEventListener("click", function (event) {
  var anchor = event.target.closest && event.target.closest('a[href^="#"]');
  if (!anchor) return;
  var id = decodeURIComponent(anchor.getAttribute("href").slice(1));
  if (!id) return;
  var target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
});
</script>`;

/**
 * Build a standalone HTML document from a live DOM node, inlining the page's
 * styles and resolving relative URLs against the current origin so fonts and
 * images keep working outside the app.
 */
function buildStandaloneHtml(node: HTMLElement, title: string): string {
  const styles = collectDocumentStyles();
  const body = node.outerHTML;
  const safeTitle = title.replace(/[<>&]/g, "");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="${location.origin}/">
<title>${safeTitle}</title>
${styles}
<style>
  @page { margin: 16mm; }
  html, body { background: #ffffff; margin: 0; padding: 0; }
  body { padding: 24px; }
  html { scroll-behavior: smooth; }
</style>
</head>
<body>
${body}
${ANCHOR_NAV_SCRIPT}
</body>
</html>`;
}

function triggerDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
    .replace(/\s+/g, "-");
  return cleaned.length > 0 ? cleaned : "relatorio";
}

/** Export the preview node as a self-contained, styled `.html` file. */
export function exportPreviewAsHtml(node: HTMLElement, title: string): void {
  const html = buildStandaloneHtml(node, title);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFileName(title)}.html`);
}
