/**
 * detect-duplicates.js
 *
 * Reports duplicates:
 *  - within a single category  -> ERROR (build fails)
 *  - across categories         -> governed by CROSS_CATEGORY_DUPLICATE_POLICY
 *                                 ("error" | "warning" | "ignore")
 */
import { CROSS_CATEGORY_DUPLICATE_POLICY } from "../config.js";
import { loadAllCategories } from "./lib/fs-utils.js";
import { step, ok, warn, err, info, fmt } from "./lib/log.js";

step("Detecting duplicates");

const cats = loadAllCategories();
let errors = 0;
let warnings = 0;

// Within-category duplicates.
const seenGlobal = new Map(); // domain -> [slugs]
for (const [slug, { domains }] of cats) {
  const seen = new Set();
  for (const d of domains) {
    if (seen.has(d)) {
      errors++;
      err(`Same-category duplicate in '${slug}': ${d}`);
    }
    seen.add(d);
  }
  // Record unique domains for cross-category comparison.
  for (const d of seen) {
    const arr = seenGlobal.get(d) || [];
    arr.push(slug);
    seenGlobal.set(d, arr);
  }
}

// Cross-category duplicates.
let crossCount = 0;
for (const [domain, slugs] of seenGlobal) {
  if (slugs.length > 1) {
    crossCount++;
    const msg = `Cross-category duplicate: ${domain} appears in [${slugs.join(", ")}]`;
    if (CROSS_CATEGORY_DUPLICATE_POLICY === "error") {
      errors++;
      err(msg);
    } else if (CROSS_CATEGORY_DUPLICATE_POLICY === "warning") {
      warnings++;
      warn(msg);
    }
  }
}

info("");
info(`  Cross-category overlaps: ${fmt(crossCount)} (policy: ${CROSS_CATEGORY_DUPLICATE_POLICY})`);

if (errors > 0) {
  err(`Duplicate detection failed: ${errors} error(s).`);
  process.exit(1);
}
ok(`Duplicate detection passed${warnings ? ` (${warnings} warning(s))` : ""}.`);
