/**
 * generate-index.js
 *
 * Emits machine-readable metadata:
 *   dist/<category>/index.json   per-category detail
 *   dist/lists.json              catalogue of all categories
 *
 * JSON is deterministic (sorted domains, stable field order) so byte-for-byte
 * output only changes when source data changes.
 */
import path from "node:path";

import { SITE_URL, REPO_URL, AUTOMATION } from "../config.js";
import { DIST_DIR, writeJSON } from "./lib/fs-utils.js";
import { buildModel } from "./lib/model.js";
import { categoryPolicy } from "./lib/policy.js";
import { step, ok, fmt } from "./lib/log.js";

function categoryIndex(cat, model) {
  const files = [...cat.files];
  if (cat.fullFile) {
    files.unshift({
      name: cat.fullFile.name,
      path: cat.fullFile.path,
      url: cat.fullFile.url,
      count: cat.fullFile.count,
      aggregate: true,
    });
  }
  return {
    name: cat.listName,
    category: cat.slug,
    description: cat.description,
    totalDomains: cat.totalDomains,
    fileCount: cat.fileCount,
    chunked: cat.chunked,
    lastModified: cat.lastModified,
    generatedAt: model.generatedAt,
    commit: model.commit,
    page: cat.pageUrl,
    source: cat.sourceUrl,
    files: files.map((f) => ({
      path: f.path,
      url: f.url,
      count: f.count,
      ...(f.aggregate ? { aggregate: true } : {}),
    })),
  };
}

export function generateIndex(model = buildModel()) {
  step("Generating JSON metadata");

  for (const cat of model.categories) {
    writeJSON(path.join(DIST_DIR, cat.slug, "index.json"), categoryIndex(cat, model));
  }

  const lists = {
    site: SITE_URL,
    repository: REPO_URL,
    generatedAt: model.generatedAt,
    commit: model.commit,
    totalDomains: model.totals.domains,
    categoryCount: model.totals.categoriesConfigured,
    fileCount: model.totals.files,
    categories: model.categories.map((c) => ({
      category: c.slug,
      name: c.listName,
      description: c.description,
      totalDomains: c.totalDomains,
      fileCount: c.fileCount,
      lastModified: c.lastModified,
      index: `${SITE_URL}/${c.slug}/index.json`,
      page: c.pageUrl,
    })),
  };
  writeJSON(path.join(DIST_DIR, "lists.json"), lists);

  // Machine-readable automation policy (per-category auto-merge + thresholds).
  writeJSON(path.join(DIST_DIR, "policy.json"), {
    generatedAt: model.generatedAt,
    autoMergeMethod: AUTOMATION.autoMergeMethod,
    thresholds: {
      maxChangedFiles: AUTOMATION.maxChangedFiles,
      maxAddedDomains: AUTOMATION.maxAddedDomains,
      maxDiffBytes: AUTOMATION.maxDiffBytes,
    },
    categories: categoryPolicy(),
  });

  ok(`Generated lists.json + policy.json + ${fmt(model.categories.length)} category index files.`);
  return model;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateIndex();
}
