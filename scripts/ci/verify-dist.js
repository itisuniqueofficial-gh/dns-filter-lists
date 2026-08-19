/**
 * ci/verify-dist.js
 *
 * Asserts that a build produced every expected artifact. Fails (exit 1) if
 * anything is missing so the scheduled integrity check catches regressions.
 */
import fs from "node:fs";
import path from "node:path";

import { CATEGORIES } from "../../config.js";
import { DIST_DIR } from "../lib/fs-utils.js";
import { ok, err, info } from "../lib/log.js";

const expected = [
  "index.html",
  "404.html",
  "lists.json",
  "stats.json",
  "sitemap.xml",
  "robots.txt",
  "search-index/manifest.json",
  "lists/index.html",
  "search/index.html",
  "contribute/index.html",
  "documentation/index.html",
];

for (const cat of CATEGORIES) {
  expected.push(`${cat.slug}/index.html`, `${cat.slug}/index.json`);
  // Categories with data must have list files.
  const src = path.join(DIST_DIR, cat.slug, "domains.txt");
  if (fs.existsSync(src)) expected.push(`${cat.slug}/domains.txt`, `${cat.slug}/domains-1.txt`);
}

let missing = 0;
for (const rel of expected) {
  const p = path.join(DIST_DIR, rel);
  if (!fs.existsSync(p)) {
    missing++;
    err(`Missing artifact: dist/${rel}`);
  }
}

if (missing) {
  err(`verify-dist failed: ${missing} artifact(s) missing.`);
  process.exit(1);
}
info(`Checked ${expected.length} artifacts.`);
ok("All expected build artifacts present.");
