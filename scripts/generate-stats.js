/**
 * generate-stats.js
 *
 * Emits dist/stats.json — the single source of truth for every statistic
 * shown on the site. The site build reads this file so numbers are NEVER
 * hard-coded in HTML.
 */
import path from "node:path";

import { SITE_URL, REPO_URL } from "../config.js";
import { DIST_DIR, writeJSON } from "./lib/fs-utils.js";
import { buildModel } from "./lib/model.js";
import { step, ok, fmt } from "./lib/log.js";

export function generateStats(model = buildModel()) {
  step("Generating statistics");

  const stats = {
    site: SITE_URL,
    repository: REPO_URL,
    generatedAt: model.generatedAt,
    commit: model.commit,
    totals: {
      domains: model.totals.domains,
      categories: model.totals.categoriesConfigured,
      categoriesWithData: model.totals.categories,
      files: model.totals.files,
      contributors: model.totals.contributors,
    },
    categories: model.categories.map((c) => ({
      category: c.slug,
      name: c.name,
      domains: c.totalDomains,
      files: c.fileCount,
      lastModified: c.lastModified,
    })),
  };

  writeJSON(path.join(DIST_DIR, "stats.json"), stats);
  ok(`Generated stats.json (${fmt(model.totals.domains)} domains across ${model.totals.categoriesConfigured} categories).`);
  return model;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateStats();
}
