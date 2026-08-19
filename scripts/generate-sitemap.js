/**
 * generate-sitemap.js
 *
 * Generates dist/sitemap.xml and dist/robots.txt from the build model. Both
 * use the canonical HTTPS production origin. Runnable standalone or imported
 * by build-site.js.
 *
 * `lastmod` uses the model's generated date (date only, no time) so the
 * sitemap stays stable within a day and never injects volatile timestamps
 * into the list payloads themselves.
 */
import path from "node:path";

import { SITE_URL } from "../config.js";
import { DIST_DIR, writeText } from "./lib/fs-utils.js";
import { buildModel } from "./lib/model.js";
import { step, ok, fmt } from "./lib/log.js";

/** Static, indexable routes (technical artifacts are intentionally excluded). */
const STATIC_PATHS = ["/", "/lists/", "/search/", "/contribute/", "/documentation/"];

export function generateSitemap(model = buildModel()) {
  const catPaths = model.categories.map((c) => `/${c.slug}/`);
  const all = [...STATIC_PATHS, ...catPaths];
  const lastmod = model.generatedAt.slice(0, 10);

  const urls = all
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}${p}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    )
    .join("\n");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  writeText(path.join(DIST_DIR, "sitemap.xml"), xml);

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  writeText(path.join(DIST_DIR, "robots.txt"), robots);

  return all.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  step("Generating sitemap.xml + robots.txt");
  const n = generateSitemap();
  ok(`sitemap.xml (${fmt(n)} URLs) + robots.txt`);
}
