/**
 * policy.js — the automation Policy Engine.
 *
 * Pure, config-driven decisions about what automation is permitted. Everything
 * derives from config.js so policy scales with the category list and never
 * needs workflow rewrites.
 */
import {
  CATEGORIES,
  PROTECTED_CATEGORIES,
  AUTOMATION,
} from "../../config.js";

const PROTECTED = new Set(PROTECTED_CATEGORIES);

/** Is a category protected (human review required, never auto-merged)? */
export function isProtected(slug) {
  return PROTECTED.has(slug);
}

/** Auto-merge allowed for a single category? */
export function autoMergeAllowedForCategory(slug) {
  return !isProtected(slug);
}

/** Category policy list (used to emit dist/policy.json + docs). */
export function categoryPolicy() {
  return CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    autoMerge: autoMergeAllowedForCategory(c.slug),
  }));
}

/** Does a changed file path fall outside the contributor safe zone? */
export function isProtectedPath(path) {
  // Safe zone: src/** and top-level docs (*.md) + docs/**.
  if (path.startsWith("src/")) return false;
  if (path.startsWith("docs/")) return false;
  if (/^[A-Z0-9_]+\.md$/i.test(path)) return false;
  return AUTOMATION.protectedPaths.some(
    (p) => path === p || path.startsWith(p)
  );
}

/**
 * Decide whether a PR is eligible for automated merge.
 *
 * @param {object} ctx
 * @param {string[]} ctx.changedCategories - category slugs touched
 * @param {boolean}  ctx.protectedPathTouched
 * @param {number}   ctx.changedFiles
 * @param {number}   ctx.addedDomains
 * @param {number}   ctx.diffBytes
 * @param {boolean}  ctx.hasErrors - hard validation errors present
 * @param {boolean}  ctx.isFork - PR from a forked repo (never auto-merge)
 * @param {boolean}  ctx.isDraft
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function evaluateAutoMerge(ctx) {
  const reasons = [];
  if (ctx.hasErrors) reasons.push("validation errors present");
  if (ctx.isFork) reasons.push("PR is from a fork (secrets/merge withheld)");
  if (ctx.isDraft) reasons.push("PR is a draft");
  if (ctx.protectedPathTouched)
    reasons.push("changes touch protected paths (workflows/scripts/config)");

  const protectedCats = (ctx.changedCategories || []).filter(isProtected);
  if (protectedCats.length)
    reasons.push(`protected category requires review: ${protectedCats.join(", ")}`);

  if (ctx.changedFiles > AUTOMATION.maxChangedFiles)
    reasons.push(`too many changed files (${ctx.changedFiles} > ${AUTOMATION.maxChangedFiles})`);
  if (ctx.addedDomains > AUTOMATION.maxAddedDomains)
    reasons.push(`too many added domains (${ctx.addedDomains} > ${AUTOMATION.maxAddedDomains})`);
  if (ctx.diffBytes > AUTOMATION.maxDiffBytes)
    reasons.push(`diff too large (${ctx.diffBytes} > ${AUTOMATION.maxDiffBytes} bytes)`);

  return { eligible: reasons.length === 0, reasons };
}

export { AUTOMATION, PROTECTED_CATEGORIES };
