/**
 * model.js
 *
 * Produces the canonical, deterministic data model consumed by every
 * generator (lists, index JSON, stats, site). Building the model once and
 * sharing it guarantees the `.txt` files, JSON metadata and rendered HTML can
 * never disagree.
 */
import {
  CATEGORIES,
  MAX_DOMAINS_PER_FILE,
  EMIT_FULL_FILE,
  SITE_URL,
  REPO_URL,
  REPO_BRANCH,
} from "../../config.js";
import { compareDomains } from "./domains.js";
import { loadAllCategories, categorySourcePath } from "./fs-utils.js";
import { commitSHA, lastModified, contributorCount } from "./git.js";

/** Split a sorted array into chunks of at most `size`. */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Build the full model.
 * @returns {object}
 */
export function buildModel() {
  const generatedAt = new Date().toISOString();
  const commit = commitSHA();
  const loaded = loadAllCategories();

  const categories = CATEGORIES.map((cat) => {
    const raw = loaded.get(cat.slug)?.domains ?? [];
    // Deduplicate + deterministic sort.
    const domains = [...new Set(raw)].sort(compareDomains);
    const chunks = chunk(domains, MAX_DOMAINS_PER_FILE);

    const files = [];

    // Stable per-chunk files: domains-1.txt, domains-2.txt, ...
    chunks.forEach((c, i) => {
      const name = `domains-${i + 1}.txt`;
      files.push({
        name,
        path: `/${cat.slug}/${name}`,
        url: `${SITE_URL}/${cat.slug}/${name}`,
        count: c.length,
        domains: c,
      });
    });

    // Full aggregate file `domains.txt`.
    let fullFile = null;
    if (EMIT_FULL_FILE && domains.length > 0) {
      fullFile = {
        name: "domains.txt",
        path: `/${cat.slug}/domains.txt`,
        url: `${SITE_URL}/${cat.slug}/domains.txt`,
        count: domains.length,
        domains,
        aggregate: true,
      };
    }

    const srcRel = `src/${cat.slug}/domains.txt`;
    return {
      slug: cat.slug,
      name: cat.name,
      listName: cat.listName,
      description: cat.description,
      icon: cat.icon,
      totalDomains: domains.length,
      fileCount: chunks.length,
      chunked: chunks.length > 1,
      domains,
      files, // chunk files only
      fullFile, // aggregate domains.txt (or null when empty)
      lastModified: lastModified(categorySourcePath(cat.slug)),
      pageUrl: `${SITE_URL}/${cat.slug}/`,
      sourceUrl: `${REPO_URL}/blob/${REPO_BRANCH}/${srcRel}`,
      historyUrl: `${REPO_URL}/commits/${REPO_BRANCH}/${srcRel}`,
    };
  });

  const totals = {
    domains: categories.reduce((s, c) => s + c.totalDomains, 0),
    categories: categories.filter((c) => c.totalDomains > 0).length,
    categoriesConfigured: categories.length,
    files: categories.reduce((s, c) => s + c.files.length, 0),
    contributors: contributorCount(),
  };

  return { generatedAt, commit, categories, totals };
}
