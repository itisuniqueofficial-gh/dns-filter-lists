/**
 * pages.js — one render function per page. Each returns a full HTML document
 * via layout(). Statistics come from the model; nothing is hard-coded.
 */
import { SITE_URL, REPO_URL, REPO_BRANCH, MAX_DOMAINS_PER_FILE } from "../../config.js";
import { layout, esc, breadcrumbs, absUrl } from "./layout.js";
import { icon } from "./icons.js";
import {
  fmt,
  fmtDate,
  statCard,
  categoryCard,
  popularRow,
  fileRow,
  usageBlock,
  howItWorks,
} from "./components.js";

const DISCLAIMER =
  "This project provides community-maintained domain classification lists. " +
  "Inclusion of a domain does not constitute a claim that the domain is " +
  "malicious, unlawful, or unsafe unless the relevant category and project " +
  "methodology explicitly state otherwise.";

/* ------------------------------------------------------------------ home */
export function homePage(model) {
  const withData = model.categories.filter((c) => c.totalDomains > 0);
  const popular = withData.slice(0, 6);

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "DNS Filter Lists",
      url: SITE_URL,
      description:
        "Community-maintained, machine-readable domain lists for filtering, blocking and domain classification.",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search/?q={query}`,
        "query-input": "required name=query",
      },
    },
  ];

  const body = `
  <section class="hero">
    <div class="container">
      <p class="eyebrow">Open Source · Community Maintained</p>
      <h1>Open Domain Filter Lists</h1>
      <p class="lede">Community-maintained, machine-readable domain lists for
        filtering, blocking and domain classification. No backend, no database —
        just versioned text files served from a global CDN.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/lists/">${icon("list", { size: 18 })}Browse Lists</a>
        <a class="btn btn-ghost" href="${REPO_URL}" rel="noopener">${icon("github", { size: 18 })}Contribute on GitHub</a>
      </div>
      <ul class="badge-row" aria-label="Project properties">
        <li>${icon("check", { size: 16 })}Open Source</li>
        <li>${icon("check", { size: 16 })}Automated Validation</li>
        <li>${icon("cloud", { size: 16 })}Cloudflare CDN</li>
        <li>${icon("users", { size: 16 })}Community Maintained</li>
      </ul>
    </div>
  </section>

  <section class="section" aria-labelledby="stats-h">
    <div class="container">
      <h2 id="stats-h" class="sr-only">Project statistics</h2>
      <div class="stat-grid">
        ${statCard("Total Domains", fmt(model.totals.domains), { statKey: "totals.domains", icon: "list" })}
        ${statCard("Categories", fmt(model.totals.categoriesConfigured), { statKey: "totals.categories", icon: "layer-group" })}
        ${statCard("List Files", fmt(model.totals.files), { statKey: "totals.files", icon: "file" })}
        ${statCard("Contributors", fmt(model.totals.contributors), { statKey: "totals.contributors", icon: "users" })}
        ${statCard("Last Update", fmtDate(model.generatedAt), { icon: "clock" })}
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="cats-h">
    <div class="container">
      <div class="section-head">
        <h2 id="cats-h">Categories</h2>
        <a class="link-arrow" href="/lists/">All lists ${icon("arrow", { size: 15 })}</a>
      </div>
      <div class="card-grid">
        ${model.categories.map(categoryCard).join("\n")}
      </div>
    </div>
  </section>

  ${
    popular.length
      ? `<section class="section" aria-labelledby="popular-h">
    <div class="container">
      <div class="section-head"><h2 id="popular-h">Popular Lists</h2></div>
      <div class="list-rows">${popular.map(popularRow).join("\n")}</div>
    </div>
  </section>`
      : ""
  }

  <section class="section section-alt" aria-labelledby="how-h">
    <div class="container">
      <div class="section-head"><h2 id="how-h">How It Works</h2></div>
      <p class="section-intro">Every change flows through the same automated,
        reviewable pipeline before it reaches production.</p>
      ${howItWorks()}
    </div>
  </section>

  <section class="section" aria-labelledby="meta-h">
    <div class="container narrow">
      <h2 id="meta-h">Machine-readable metadata</h2>
      <p>Consume the catalogue programmatically. All endpoints are static JSON.</p>
      <ul class="link-list mono">
        <li><a href="/lists.json">/lists.json</a> — catalogue of every category</li>
        <li><a href="/stats.json">/stats.json</a> — aggregate statistics</li>
        <li><a href="/social/index.json">/&lt;category&gt;/index.json</a> — per-category detail</li>
      </ul>
      <p class="disclaimer">${esc(DISCLAIMER)}</p>
    </div>
  </section>`;

  return layout({
    title: "Open Domain Filter Lists",
    description:
      "Community-maintained, machine-readable domain filter lists for DNS filtering, ad/tracker blocking and domain classification. Free, open-source, CDN-delivered.",
    path: "/",
    body,
    jsonld,
  });
}

/* ------------------------------------------------------------------ lists */
export function listsPage(model) {
  const { nav, jsonld } = breadcrumbs([
    { name: "Home", href: "/" },
    { name: "Lists" },
  ]);
  const rows = model.categories
    .map(
      (c) => `<tr data-name="${esc(c.name.toLowerCase())} ${esc(c.slug)}">
      <td><a href="/${c.slug}/" class="cell-title">${icon(c.icon, { size: 18 })}<span>${esc(c.name)}</span></a>
        <span class="cell-desc">${esc(c.description)}</span></td>
      <td class="mono num">${fmt(c.totalDomains)}</td>
      <td class="mono num">${fmt(c.fileCount)}</td>
      <td class="nowrap muted">${esc(fmtDate(c.lastModified))}</td>
      <td class="nowrap"><a class="btn btn-xs" href="/${c.slug}/">View ${icon("arrow", { size: 14 })}</a></td>
    </tr>`
    )
    .join("\n");

  const body = `
  <section class="section">
    <div class="container">
      ${nav}
      <h1>Filter Lists</h1>
      <p class="lede">Browse every domain category. Each list is generated,
        validated and deduplicated automatically on every merge.</p>

      <div class="toolbar">
        <label class="field">
          <span class="sr-only">Filter categories</span>
          <span class="field-icon" aria-hidden="true">${icon("search", { size: 18 })}</span>
          <input type="search" id="list-filter" placeholder="Filter categories…" autocomplete="off">
        </label>
      </div>

      <div class="table-wrap">
        <table class="data-table" id="lists-table">
          <thead><tr>
            <th scope="col">Category</th>
            <th scope="col" class="num">Domains</th>
            <th scope="col" class="num">Files</th>
            <th scope="col">Updated</th>
            <th scope="col"><span class="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="empty-state" id="lists-empty" hidden>No categories match your filter.</p>
      </div>
    </div>
  </section>`;

  return layout({
    title: "Filter Lists",
    description:
      "Browse all community-maintained domain filter list categories: social, advertising, tracking, malware, phishing, suspicious and more.",
    path: "/lists/",
    body,
    jsonld: [jsonld],
    scripts: ["/assets/filter.js"],
  });
}

/* --------------------------------------------------------------- category */
export function categoryPage(cat, model) {
  const { nav, jsonld } = breadcrumbs([
    { name: "Home", href: "/" },
    { name: "Lists", href: "/lists/" },
    { name: cat.name },
  ]);

  const files = [];
  if (cat.fullFile) files.push(cat.fullFile);
  files.push(...cat.files);

  const fileRows = cat.totalDomains
    ? files.map((f) => fileRow(cat, f)).join("\n")
    : `<tr><td colspan="3" class="empty-state">No domains in this category yet. ${`<a href="/contribute/">Contribute some</a>.`}</td></tr>`;

  const datasetJsonld = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: cat.listName,
    description: cat.description,
    url: absUrl(`/${cat.slug}/`),
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: "It Is Unique Official" },
    dateModified: cat.lastModified,
    ...(cat.fullFile
      ? {
          distribution: {
            "@type": "DataDownload",
            encodingFormat: "text/plain",
            contentUrl: cat.fullFile.url,
          },
        }
      : {}),
  };

  const body = `
  <section class="section">
    <div class="container">
      ${nav}
      <div class="page-head">
        <span class="cat-icon lg" aria-hidden="true">${icon(cat.icon, { size: 28 })}</span>
        <div>
          <h1>${esc(cat.listName)}</h1>
          <p class="lede">${esc(cat.description)}</p>
        </div>
      </div>

      <div class="stat-grid compact">
        ${statCard("Domains", fmt(cat.totalDomains))}
        ${statCard("Files", fmt(cat.fileCount))}
        ${statCard("Chunk size", fmt(MAX_DOMAINS_PER_FILE))}
        ${statCard("Updated", fmtDate(cat.lastModified))}
      </div>

      <h2>Available files</h2>
      <div class="table-wrap">
        <table class="data-table files-table">
          <thead><tr><th scope="col">File</th><th scope="col" class="num">Domains</th><th scope="col">Actions</th></tr></thead>
          <tbody>${fileRows}</tbody>
        </table>
      </div>
      ${
        cat.chunked
          ? `<p class="note">${icon("triangle-exclamation", { size: 15 })} This category exceeds ${fmt(MAX_DOMAINS_PER_FILE)} domains and is split into numbered chunks. <code>domains.txt</code> contains the complete list.</p>`
          : ""
      }

      <h2>Usage</h2>
      <p>Lists are plain UTF-8 text, one hostname per line. Point your DNS or
        filtering software at a raw URL, or download and import the file.</p>
      ${usageBlock(cat)}

      <h2>Source</h2>
      <p>This list is generated from a single source file in the repository.
        Inspect the source, history and open pull requests on GitHub.</p>
      <p class="btn-row">
        <a class="btn btn-sm btn-ghost" href="${cat.sourceUrl}" rel="noopener">${icon("github", { size: 16 })}View source</a>
        <a class="btn btn-sm btn-ghost" href="${cat.historyUrl}" rel="noopener">${icon("clock", { size: 16 })}History</a>
        <a class="btn btn-sm btn-ghost" href="/${cat.slug}/index.json">${icon("code", { size: 16 })}index.json</a>
      </p>

      <p class="disclaimer">${esc(DISCLAIMER)}</p>
    </div>
  </section>`;

  return layout({
    title: cat.listName,
    description: `${cat.description} ${fmt(cat.totalDomains)} domains across ${fmt(cat.fileCount)} file(s), available as raw plain-text and JSON.`,
    path: `/${cat.slug}/`,
    body,
    jsonld: [jsonld, datasetJsonld],
  });
}

/* ----------------------------------------------------------------- search */
export function searchPage(model) {
  const { nav, jsonld } = breadcrumbs([
    { name: "Home", href: "/" },
    { name: "Search" },
  ]);

  const body = `
  <section class="section">
    <div class="container narrow">
      ${nav}
      <h1>Search Domains</h1>
      <p class="lede">Check whether a domain is present in any list. Search runs
        entirely in your browser against a pre-built index — no server, no tracking.</p>

      <form class="search-form" id="search-form" role="search">
        <label class="field field-lg">
          <span class="sr-only">Domain to search</span>
          <span class="field-icon" aria-hidden="true">${icon("search")}</span>
          <input type="search" id="search-input" name="q" inputmode="url"
            placeholder="instagram.com" autocomplete="off" autocapitalize="off" spellcheck="false">
        </label>
        <button class="btn btn-primary" type="submit">Search</button>
      </form>

      <p class="search-status" id="search-status" aria-live="polite"></p>
      <div id="search-results" class="search-results" aria-live="polite"></div>

      <p class="disclaimer">Results indicate only that a domain is present in this
        project's community-maintained lists. They are not a security verdict.</p>
    </div>
  </section>`;

  return layout({
    title: "Search Domains",
    description:
      "Search community-maintained domain filter lists client-side. Find which category and file a domain appears in.",
    path: "/search/",
    body,
    jsonld: [jsonld],
    scripts: ["/assets/search.js"],
  });
}

/* ------------------------------------------------------------- contribute */
export function contributePage(model) {
  const { nav, jsonld } = breadcrumbs([
    { name: "Home", href: "/" },
    { name: "Contribute" },
  ]);

  const steps = [
    ["github", "Fork the repository on GitHub."],
    ["code-branch", "Create a branch for your change."],
    ["file-circle-plus", `Add domains to the relevant <code>src/&lt;category&gt;/domains.txt</code>.`],
    ["check", "Run <code>npm run validate</code> locally."],
    ["code-pull-request", "Open a Pull Request."],
    ["robot", "Automated checks run (syntax, duplicates, build)."],
    ["user-check", "A maintainer reviews your change."],
    ["code-merge", "Your PR is merged."],
    ["cloud", "Lists and the site rebuild and deploy automatically."],
  ];

  const body = `
  <section class="section">
    <div class="container narrow">
      ${nav}
      <h1>Contribute</h1>
      <p class="lede">This project is built entirely from community pull requests.
        Adding or correcting a domain takes a few minutes.</p>

      <div class="btn-row">
        <a class="btn btn-primary" href="${REPO_URL}/blob/${REPO_BRANCH}/CONTRIBUTING.md" rel="noopener">${icon("book", { size: 18 })}Read Contribution Guide</a>
        <a class="btn btn-ghost" href="${REPO_URL}/tree/${REPO_BRANCH}/src" rel="noopener">${icon("github", { size: 18 })}Open GitHub Repository</a>
      </div>

      <h2>How to contribute</h2>
      <ol class="steps steps-icon">
        ${steps.map(([ic, s]) => `<li><span class="step-icon" aria-hidden="true">${icon(ic)}</span><span class="step-text">${s}</span></li>`).join("\n")}
      </ol>

      <h2>Submit a domain</h2>
      <p>Edit the source file for the category directly on GitHub, then open a
        pull request. The build system handles sorting, deduplication and chunking.</p>
      <div class="card-grid two">
        ${model.categories
          .map(
            (c) =>
              `<a class="btn btn-sm btn-ghost" href="${REPO_URL}/edit/${REPO_BRANCH}/src/${c.slug}/domains.txt" rel="noopener">${icon(c.icon, { size: 16 })}Add to ${esc(c.name)}</a>`
          )
          .join("\n")}
      </div>

      <h2>Rules</h2>
      <ul class="check-list">
        <li>${icon("check", { size: 16 })}One domain per line, lowercase, no trailing dot.</li>
        <li>${icon("check", { size: 16 })}No URLs, paths, ports, IP addresses or wildcards.</li>
        <li>${icon("check", { size: 16 })}No duplicates within a category.</li>
        <li>${icon("check", { size: 16 })}UTF-8, LF line endings, final newline.</li>
      </ul>
    </div>
  </section>`;

  return layout({
    title: "Contribute",
    description:
      "Contribute domains to the community filter lists via GitHub pull requests. Automated validation, duplicate detection and deployment.",
    path: "/contribute/",
    body,
    jsonld: [jsonld],
  });
}

/* ---------------------------------------------------------- documentation */
export function documentationPage(model) {
  const { nav, jsonld } = breadcrumbs([
    { name: "Home", href: "/" },
    { name: "Documentation" },
  ]);

  const body = `
  <section class="section">
    <div class="container doc-layout">
      <div class="doc-main">
      ${nav}
      <h1>Documentation</h1>
      <p class="lede">Everything you need to consume or contribute to the lists.</p>

      <h2 id="format">List format</h2>
      <p>Each generated list is a plain-text file served as
        <code>text/plain; charset=utf-8</code>. Rules:</p>
      <ul>
        <li>One domain per line.</li>
        <li>UTF-8 encoding, LF line endings, trailing newline.</li>
        <li>Lines beginning with <code>#</code> are comments (a short provenance header is prepended).</li>
        <li>Domains are lowercase, deduplicated and sorted deterministically.</li>
      </ul>

      <h2 id="syntax">Domain syntax</h2>
      <p>Accepted: <code class="mono">example.com</code>, <code class="mono">sub.example.com</code>,
        <code class="mono">example.co.uk</code>. Rejected: URLs, paths, query strings, ports,
        IP addresses, <code class="mono">localhost</code>, wildcards and underscores.</p>

      <h2 id="raw">Raw list usage</h2>
      <p>Fetch any list directly:</p>
      <pre class="code"><code>curl -fsSL ${esc(SITE_URL)}/social/domains.txt</code></pre>
      <p>Large categories are chunked into <code>domains-1.txt</code>,
        <code>domains-2.txt</code>, … at ${fmt(MAX_DOMAINS_PER_FILE)} domains per file.
        <code>domains.txt</code> is the complete aggregate.</p>

      <h2 id="api">Metadata / API</h2>
      <p>Static JSON endpoints, regenerated on every build:</p>
      <ul class="link-list mono">
        <li><a href="/lists.json">/lists.json</a></li>
        <li><a href="/stats.json">/stats.json</a></li>
        <li><a href="/social/index.json">/&lt;category&gt;/index.json</a></li>
      </ul>

      <h2 id="automation">Automation</h2>
      <p>Pull requests trigger validation and a build test. Merges to
        <code>${esc(REPO_BRANCH)}</code> regenerate every list, JSON file, the
        sitemap and the site, then deploy to Cloudflare Pages. A scheduled
        integrity check re-verifies everything periodically.</p>

      <h2 id="contribution">Contribution process</h2>
      <p>See the <a href="/contribute/">contribution page</a> and
        <a href="${REPO_URL}/blob/${REPO_BRANCH}/CONTRIBUTING.md" rel="noopener">CONTRIBUTING.md</a>.</p>

      <h2 id="release">Release process</h2>
      <p>There are no manual releases. Production is a direct reflection of the
        <code>${esc(REPO_BRANCH)}</code> branch: every merged, validated change
        is deployed automatically.</p>

      <h2 id="security">Security model</h2>
      <p>All pull requests are treated as untrusted input. CI runs with
        least-privilege permissions, never exposes secrets to fork PRs, and never
        executes contributor-provided content. Domain data is treated strictly as
        text — never as executable content. See
        <a href="${REPO_URL}/blob/${REPO_BRANCH}/SECURITY.md" rel="noopener">SECURITY.md</a>.</p>

      <h2 id="disclaimer">Disclaimer</h2>
      <p class="disclaimer">${esc(DISCLAIMER)}</p>
      </div>

      <nav class="doc-toc" aria-label="On this page">
        <p class="toc-title">On this page</p>
        <ul>
          <li><a href="#format">List format</a></li>
          <li><a href="#syntax">Domain syntax</a></li>
          <li><a href="#raw">Raw list usage</a></li>
          <li><a href="#api">Metadata / API</a></li>
          <li><a href="#automation">Automation</a></li>
          <li><a href="#contribution">Contribution</a></li>
          <li><a href="#release">Release process</a></li>
          <li><a href="#security">Security model</a></li>
          <li><a href="#disclaimer">Disclaimer</a></li>
        </ul>
      </nav>
    </div>
  </section>`;

  return layout({
    title: "Documentation",
    description:
      "Documentation for the DNS Filter Lists: list format, domain syntax, raw usage, JSON metadata, automation, release and security model.",
    path: "/documentation/",
    body,
    jsonld: [jsonld],
  });
}

/* -------------------------------------------------------------------- 404 */
export function notFoundPage() {
  const body = `
  <section class="section">
    <div class="container narrow center">
      <p class="error-icon" aria-hidden="true">${icon("circle-exclamation")}</p>
      <p class="error-code">404</p>
      <h1>Page not found</h1>
      <p class="lede center-lede">The page you are looking for does not exist or has moved.</p>
      <div class="btn-row center">
        <a class="btn btn-primary" href="/">${icon("home")}Home</a>
        <a class="btn btn-ghost" href="/lists/">${icon("list")}Browse Lists</a>
        <a class="btn btn-ghost" href="/documentation/">${icon("book")}Documentation</a>
      </div>
    </div>
  </section>`;

  return layout({
    title: "Page not found",
    description: "The requested page could not be found.",
    path: "/404.html",
    body,
    noindex: true,
  });
}
