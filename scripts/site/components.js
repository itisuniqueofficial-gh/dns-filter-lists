/**
 * components.js — reusable HTML fragments used by multiple pages.
 * All dynamic numbers originate from the build model (never hard-coded).
 */
import { SITE_URL } from "../../config.js";
import { icon } from "./icons.js";
import { esc } from "./layout.js";

/** Format an integer with thousands separators. */
export function fmt(n) {
  return Number(n || 0).toLocaleString("en-US");
}

/** Human-friendly date (UTC) from an ISO string. */
export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** A labelled statistic tile. `value` may carry a data attribute for JS refresh. */
export function statCard(label, value, opts = {}) {
  const key = opts.statKey ? ` data-stat="${opts.statKey}"` : "";
  const ic = opts.icon ? `<span class="stat-icon" aria-hidden="true">${icon(opts.icon)}</span>` : "";
  return `<div class="stat">
    ${ic}
    <div class="stat-value"${key}>${esc(String(value))}</div>
    <div class="stat-label">${esc(label)}</div>
  </div>`;
}

/** A category summary card used on the homepage and lists page. */
export function categoryCard(cat) {
  return `<article class="card cat-card">
    <div class="cat-card-head">
      <span class="cat-icon" aria-hidden="true">${icon(cat.icon)}</span>
      <h3 class="cat-name"><a href="/${cat.slug}/">${esc(cat.name)}</a></h3>
    </div>
    <p class="cat-desc">${esc(cat.description)}</p>
    <dl class="cat-meta">
      <div><dt>Domains</dt><dd class="mono">${fmt(cat.totalDomains)}</dd></div>
      <div><dt>Files</dt><dd class="mono">${fmt(cat.fileCount)}</dd></div>
    </dl>
    <a class="btn btn-block" href="/${cat.slug}/">View list ${icon("arrow", { size: 16 })}</a>
  </article>`;
}

/** A "popular list" row shown on the homepage. */
export function popularRow(cat) {
  const raw = cat.fullFile ? cat.fullFile.url : (cat.files[0]?.url || "");
  return `<article class="list-row">
    <div class="list-row-main">
      <h3 class="list-row-title"><a href="/${cat.slug}/">${esc(cat.listName)}</a></h3>
      <p class="list-row-meta">
        <span class="badge">${esc(cat.name)}</span>
        <span class="mono">${fmt(cat.totalDomains)} domains</span>
        <span class="muted">Updated ${esc(fmtDate(cat.lastModified))}</span>
      </p>
      ${raw ? `<code class="raw-url" title="${esc(raw)}">${esc(raw)}</code>` : `<span class="muted">No domains yet</span>`}
    </div>
    <div class="list-row-actions">
      ${raw ? `<button class="btn btn-sm copy-btn" type="button" data-copy="${esc(raw)}">${icon("copy", { size: 16 })}<span>Copy URL</span></button>` : ""}
      <a class="btn btn-sm btn-ghost" href="/${cat.slug}/">View</a>
    </div>
  </article>`;
}

/** A single generated file row on a category page (Open / Copy / Download / GitHub). */
export function fileRow(cat, file) {
  return `<tr>
    <td class="mono nowrap"><a href="${file.path}">${esc(file.name)}</a></td>
    <td class="mono num">${fmt(file.count)}</td>
    <td class="file-actions">
      <a class="btn btn-xs" href="${file.path}" target="_blank" rel="noopener">${icon("external", { size: 15 })}<span>Open</span></a>
      <button class="btn btn-xs copy-btn" type="button" data-copy="${esc(file.url)}">${icon("copy", { size: 15 })}<span>Copy URL</span></button>
      <a class="btn btn-xs" href="${file.path}" download>${icon("download", { size: 15 })}<span>Download</span></a>
      <a class="btn btn-xs btn-ghost" href="${cat.sourceUrl}" rel="noopener">${icon("github", { size: 15 })}<span>GitHub</span></a>
    </td>
  </tr>`;
}

/**
 * A usage code block showing how to consume a raw list URL.
 * Kept factual: it is a hostname-per-line text file.
 */
export function usageBlock(cat) {
  const url = cat.fullFile
    ? cat.fullFile.url
    : cat.files[0]
    ? cat.files[0].url
    : `${SITE_URL}/${cat.slug}/domains.txt`;
  return `<pre class="code"><code># Fetch the raw list (plain text, one domain per line)
curl -fsSL ${esc(url)}

# Each line is a hostname; '#' lines are comments.
# Point your DNS/filtering software at this URL or import the file.</code></pre>`;
}

/** Render the "How it works" pipeline. */
export function howItWorks() {
  const steps = [
    ["users", "Community"],
    ["github", "Pull Request"],
    ["check", "Automated Validation"],
    ["layer-group", "Duplicate Detection"],
    ["eye", "Review"],
    ["bolt", "Build"],
    ["cloud", "Cloudflare Pages"],
    ["list", "Public Filter Lists"],
  ];
  const items = steps
    .map(
      ([ic, label], i) =>
        `<li class="flow-step">
      <span class="flow-icon" aria-hidden="true">${icon(ic)}</span>
      <span class="flow-label">${esc(label)}</span>
      ${i < steps.length - 1 ? `<span class="flow-arrow" aria-hidden="true">${icon("arrow", { size: 18 })}</span>` : ""}
    </li>`
    )
    .join("");
  return `<ol class="flow">${items}</ol>`;
}
