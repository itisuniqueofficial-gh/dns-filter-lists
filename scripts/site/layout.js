/**
 * layout.js — the site shell.
 *
 * Provides HTML escaping and a single `layout()` function that wraps page
 * bodies in a consistent, SEO-complete, accessible document. Header and footer
 * are defined once here so every page is identical.
 */
import { SITE_URL, REPO_URL, ORG_NAME } from "../../config.js";
import { icon } from "./icons.js";

/** Escape a string for safe interpolation into HTML text/attributes. */
export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Absolute canonical URL for a site-root-relative path. */
export function absUrl(path) {
  if (!path.startsWith("/")) path = "/" + path;
  return SITE_URL + path;
}

const YEAR = new Date().getFullYear();

const NAV = [
  { href: "/lists/", label: "Lists" },
  { href: "/search/", label: "Search" },
  { href: "/documentation/", label: "Documentation" },
  { href: "/contribute/", label: "Contribute" },
];

function header(activePath) {
  const links = NAV.map((n) => {
    const active =
      n.href === activePath ||
      (n.href !== "/" && activePath.startsWith(n.href));
    return `<li><a href="${n.href}"${active ? ' aria-current="page"' : ""}>${esc(
      n.label
    )}</a></li>`;
  }).join("");

  return `<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">${icon("shield", { size: 22 })}</span>
      <span class="brand-text">DNS Filter Lists</span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
      <span class="nav-toggle-open" aria-hidden="true">${icon("menu")}</span>
      <span class="nav-toggle-close" aria-hidden="true">${icon("close")}</span>
    </button>
    <nav class="site-nav" id="site-nav" aria-label="Primary">
      <ul class="nav-list">
        ${links}
        <li class="nav-gh"><a class="btn btn-ghost btn-sm" href="${REPO_URL}" rel="noopener">${icon(
    "github",
    { size: 18 }
  )}<span>GitHub</span></a></li>
      </ul>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <span class="brand-mark" aria-hidden="true">${icon("shield", { size: 20 })}</span>
      <div>
        <p class="footer-title">DNS Filter Lists</p>
        <p class="footer-tagline">Open-source community domain lists.</p>
      </div>
    </div>
    <nav class="footer-nav" aria-label="Footer">
      <a href="/lists/">Lists</a>
      <a href="/documentation/">Documentation</a>
      <a href="/contribute/">Contribute</a>
      <a href="${REPO_URL}" rel="noopener">GitHub</a>
      <a href="/documentation/#security">Security</a>
    </nav>
  </div>
  <div class="container footer-bottom">
    <p>&copy; ${YEAR} ${esc(ORG_NAME)}. Community-maintained data, provided without warranty.</p>
  </div>
</footer>`;
}

/**
 * Render breadcrumbs and matching BreadcrumbList JSON-LD.
 * @param {{name:string, href?:string}[]} items
 */
export function breadcrumbs(items) {
  const li = items
    .map((it, i) => {
      const last = i === items.length - 1;
      const inner = last || !it.href
        ? `<span aria-current="page">${esc(it.name)}</span>`
        : `<a href="${it.href}">${esc(it.name)}</a>`;
      return `<li>${inner}</li>`;
    })
    .join("");
  const nav = `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${li}</ol></nav>`;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.href ? { item: absUrl(it.href) } : {}),
    })),
  };
  return { nav, jsonld };
}

/**
 * Build a full HTML document.
 * @param {object} o
 * @param {string} o.title           - page <title> (without site suffix)
 * @param {string} o.description      - meta description
 * @param {string} o.path             - site-root-relative path (for canonical + nav)
 * @param {string} o.body             - page body HTML
 * @param {object[]} [o.jsonld]        - array of JSON-LD objects to embed
 * @param {string[]} [o.scripts]       - extra script srcs (module)
 * @param {boolean} [o.noindex]        - add noindex robots
 */
export function layout(o) {
  const canonical = absUrl(o.path);
  const fullTitle =
    o.path === "/" ? `${o.title}` : `${o.title} — DNS Filter Lists`;
  const jsonldBlocks = (o.jsonld || [])
    .map(
      (j) =>
        `<script type="application/ld+json">${JSON.stringify(j)}</script>`
    )
    .join("\n  ");
  const extraScripts = (o.scripts || [])
    .map((s) => `<script type="module" src="${s}"></script>`)
    .join("\n  ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(o.description)}">
  <link rel="canonical" href="${canonical}">
  ${o.noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow">'}
  <meta name="theme-color" content="#0b1020" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="DNS Filter Lists">
  <meta property="og:title" content="${esc(o.title)}">
  <meta property="og:description" content="${esc(o.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/og.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(o.title)}">
  <meta name="twitter:description" content="${esc(o.description)}">
  <meta name="twitter:image" content="${SITE_URL}/og.svg">

  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/styles.css">
  ${jsonldBlocks}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${header(o.path)}
  <main id="main" tabindex="-1">
    ${o.body}
  </main>
  ${footer()}
  <script type="module" src="/assets/main.js"></script>
  ${extraScripts}
</body>
</html>
`;
}
