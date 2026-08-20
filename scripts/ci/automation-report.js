/**
 * ci/automation-report.js — the coherent PR automation engine.
 *
 * Pipeline (all deterministic, all auditable):
 *   detect changed files → compute normalization + dedup counts (dry) →
 *   validate → cross-category duplicate index → policy/auto-merge decision →
 *   write reports (.validation/*, build/reports/*) → step summary + outputs.
 *
 * SECURITY: only READS repository files. Never executes contributor content.
 *
 * Exit code: 0 when there are no HARD errors (invalid domains / structural /
 * protected binary). Auto-fixable issues (duplicates, non-canonical, whitespace)
 * do NOT fail — the auto-fix workflow commits them. Structural/invalid issues
 * fail so they can't reach production.
 *
 * Environment (all optional; sensible local fallbacks):
 *   GITHUB_BASE_REF / BASE_SHA  base for changed-file + diff detection
 *   PR_IS_FORK, PR_IS_DRAFT     "true"/"false"
 *   GITHUB_OUTPUT, GITHUB_STEP_SUMMARY
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  CATEGORIES,
  ALLOW_COMMENTS,
  MAX_SOURCE_FILE_BYTES,
  CROSS_CATEGORY_DUPLICATE_POLICY,
} from "../../config.js";
import { ROOT, SRC_DIR, categorySourcePath, parseSourceFile, writeText, writeJSON } from "../lib/fs-utils.js";
import { compareDomains } from "../lib/domains.js";
import { evaluateAutoMerge, isProtected, isProtectedPath } from "../lib/policy.js";
import { commitSHA } from "../lib/git.js";

const allowedSlugs = new Set(CATEGORIES.map((c) => c.slug));

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

/** Resolve the base ref for diffing, if any. */
function baseRef() {
  if (process.env.BASE_SHA) return process.env.BASE_SHA;
  if (process.env.GITHUB_BASE_REF) {
    const r = git(["rev-parse", `origin/${process.env.GITHUB_BASE_REF}`]);
    if (r) return r;
    return process.env.GITHUB_BASE_REF;
  }
  return "";
}

/** Changed files relative to base (or all tracked src files locally). */
function changedFiles(base) {
  if (base) {
    const out = git(["diff", "--name-only", `${base}...HEAD`]);
    if (out) return out.split("\n").filter(Boolean);
  }
  // Local fallback: every category source file.
  return CATEGORIES.map((c) => `src/${c.slug}/domains.txt`).filter((p) =>
    fs.existsSync(path.join(ROOT, p))
  );
}

/** Count added domain lines + total diff bytes (for thresholds). */
function diffStats(base) {
  if (!base) return { addedDomains: 0, diffBytes: 0 };
  const diff = git(["diff", `${base}...HEAD`, "--", "src"]);
  const diffBytes = Buffer.byteLength(diff, "utf8");
  let addedDomains = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      const body = line.slice(1).trim();
      if (body && !body.startsWith("#")) addedDomains++;
    }
  }
  return { addedDomains, diffBytes };
}

/* ---- Structural scan (symlinks / unexpected / binary / oversized) ------- */
function structuralErrors() {
  const errors = [];
  if (!fs.existsSync(SRC_DIR)) return ["src/ directory is missing."];
  for (const entry of fs.readdirSync(SRC_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isSymbolicLink()) { errors.push(`Symlink not allowed: src/${entry.name}`); continue; }
    if (!entry.isDirectory()) { errors.push(`Unexpected file in src/: '${entry.name}'`); continue; }
    if (!allowedSlugs.has(entry.name)) { errors.push(`Unknown category directory 'src/${entry.name}/'`); continue; }
    const dir = path.join(SRC_DIR, entry.name);
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.isSymbolicLink()) errors.push(`Symlink not allowed: src/${entry.name}/${f.name}`);
      else if (f.name !== "domains.txt") errors.push(`Unexpected file 'src/${entry.name}/${f.name}'`);
      else {
        const p = path.join(dir, f.name);
        const stat = fs.statSync(p);
        if (stat.size > MAX_SOURCE_FILE_BYTES) errors.push(`src/${entry.name}/domains.txt exceeds size limit`);
        if (/\u0000/.test(fs.readFileSync(p, "utf8"))) errors.push(`src/${entry.name}/domains.txt contains binary/NUL content`);
      }
    }
  }
  return errors;
}

/* ---- Per-category analysis --------------------------------------------- */
function analyzeCategory(slug) {
  const file = categorySourcePath(slug);
  const rel = `src/${slug}/domains.txt`;
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf8");
  const { records } = parseSourceFile(file);
  const validNormalized = [];
  const invalid = [];
  let normalizedCount = 0;
  let whitespace = 0;
  for (const r of records) {
    if (!r.isData) continue;
    if (r.raw !== r.raw.trim()) whitespace++;
    if (!r.validation.valid) {
      invalid.push({ file: rel, line: r.lineNumber, raw: r.raw, reason: r.validation.reason });
      continue;
    }
    if (r.changed) normalizedCount++;
    validNormalized.push(r.normalized);
  }
  const unique = new Set(validNormalized);
  const duplicatesRemoved = validNormalized.length - unique.size;
  const sorted = [...unique].sort(compareDomains);

  return {
    slug, rel,
    validBefore: validNormalized.length,
    validAfter: unique.size,
    duplicatesRemoved,
    normalizedCount,
    invalid,
    domains: sorted,
  };
}

/* ---- Cross-category duplicate index ------------------------------------ */
function crossCategoryIndex() {
  const map = new Map();
  for (const cat of CATEGORIES) {
    const file = categorySourcePath(cat.slug);
    if (!fs.existsSync(file)) continue;
    const { dataDomains } = parseSourceFile(file);
    for (const d of new Set(dataDomains)) {
      const arr = map.get(d) || [];
      arr.push(cat.slug);
      map.set(d, arr);
    }
  }
  const cross = {};
  for (const [domain, slugs] of map) if (slugs.length > 1) cross[domain] = slugs.sort();
  return cross;
}

/* ======================================================================= */
const base = baseRef();
const changed = changedFiles(base);
const changedSrc = changed.filter((f) => f.startsWith("src/") && f.endsWith("domains.txt"));
const changedCategories = [
  ...new Set(changedSrc.map((f) => f.split("/")[1]).filter((s) => allowedSlugs.has(s))),
];
const protectedPathTouched = changed.some(isProtectedPath);
const { addedDomains, diffBytes } = diffStats(base);

// Analyze changed categories (or all, locally).
const analyzeSlugs = changedCategories.length ? changedCategories : CATEGORIES.map((c) => c.slug);
const analyses = analyzeSlugs.map(analyzeCategory).filter(Boolean);

const totals = analyses.reduce(
  (t, a) => {
    t.validBefore += a.validBefore;
    t.validAfter += a.validAfter;
    t.duplicatesRemoved += a.duplicatesRemoved;
    t.normalized += a.normalizedCount;
    t.invalid += a.invalid.length;
    return t;
  },
  { validBefore: 0, validAfter: 0, duplicatesRemoved: 0, normalized: 0, invalid: 0 }
);

const invalidList = analyses.flatMap((a) => a.invalid);
const structural = structuralErrors();
const cross = crossCategoryIndex();
const crossCount = Object.keys(cross).length;

const errors = [
  ...structural,
  ...invalidList.map((i) => `Invalid domain: ${i.raw} (${i.reason}) — ${i.file}:${i.line}`),
];
const warnings = [];
if (protectedPathTouched)
  warnings.push("PR modifies protected paths (workflows/scripts/config) — needs maintainer review.");
if (CROSS_CATEGORY_DUPLICATE_POLICY === "warning") {
  for (const [d, slugs] of Object.entries(cross)) warnings.push(`Cross-category duplicate: ${d} in [${slugs.join(", ")}]`);
}

const autoFixNeeded = totals.duplicatesRemoved > 0 || totals.normalized > 0;
const passed = errors.length === 0;

const autoMerge = evaluateAutoMerge({
  changedCategories,
  protectedPathTouched,
  changedFiles: changedSrc.length,
  addedDomains,
  diffBytes,
  hasErrors: !passed,
  isFork: process.env.PR_IS_FORK === "true",
  isDraft: process.env.PR_IS_DRAFT === "true",
});

/* ---- Reports ----------------------------------------------------------- */
const report = {
  generatedAt: new Date().toISOString(),
  commit: commitSHA(),
  base: base || null,
  filesProcessed: analyses.length,
  categoriesProcessed: analyzeSlugs.length,
  changedCategories,
  protectedPathTouched,
  totals: {
    domainsBefore: totals.validBefore,
    domainsAfter: totals.validAfter,
    duplicatesRemoved: totals.duplicatesRemoved,
    normalized: totals.normalized,
    invalid: totals.invalid,
    crossCategory: crossCount,
    addedDomains,
  },
  autoFixNeeded,
  passed,
  autoMerge,
  errors,
  warnings,
};

writeJSON(path.join(ROOT, ".validation", "report.json"), report);
writeJSON(path.join(ROOT, "build", "reports", "duplicates.json"), cross);

const dupMd =
  `# Cross-category duplicates\n\n` +
  (crossCount === 0
    ? "None.\n"
    : Object.entries(cross).map(([d, s]) => `- \`${d}\` → ${s.join(", ")}`).join("\n") + "\n");
writeText(path.join(ROOT, "build", "reports", "duplicates.md"), dupMd);

/* ---- PR comment body (single, updated in place by the workflow) -------- */
function commentMd() {
  const L = [];
  L.push("## DNS Filter Lists Automation", "");
  if (passed) {
    L.push("✅ Domain validation passed");
    L.push("✅ Normalization checked");
    L.push("✅ Duplicate cleanup checked");
    L.push("✅ Sorting deterministic");
  } else {
    L.push("❌ Validation failed", "", "Errors:");
    for (const e of errors.slice(0, 40)) L.push(`- ${e}`);
    if (errors.length > 40) L.push(`- …and ${errors.length - 40} more`);
  }
  L.push("", "**Automatic changes (applied by the auto-fix workflow):**");
  L.push(`- ${totals.duplicatesRemoved} duplicate(s) removed`);
  L.push(`- ${totals.normalized} domain(s) normalized`);
  if (warnings.length) {
    L.push("", "**Warnings:**");
    for (const w of warnings.slice(0, 20)) L.push(`- ${w}`);
  }
  L.push("", `**Auto-merge:** ${autoMerge.eligible ? "ELIGIBLE" : "not eligible"}`);
  if (!autoMerge.eligible) for (const r of autoMerge.reasons) L.push(`- ${r}`);
  L.push("", passed
    ? (autoFixNeeded ? "Status: automatic cleanup will be committed to this branch." : "Status: READY FOR REVIEW")
    : "Required action: fix the invalid entries and push another commit. No manual deduplication is needed.");
  return L.join("\n") + "\n";
}
writeText(path.join(ROOT, ".validation", "comment.md"), commentMd());

/* ---- Labels ------------------------------------------------------------ */
const labels = new Set(["automation"]);
labels.add(passed ? "validation-passed" : "validation-failed");
if (invalidList.length) labels.add("invalid-domain");
if (autoFixNeeded) labels.add("auto-fixed");
if (crossCount > 0) labels.add("duplicate");
if (protectedPathTouched) labels.add("needs-review");
if (autoMerge.eligible) labels.add("ready-to-merge");
else labels.add("needs-review");

/* ---- Step summary + GITHUB_OUTPUT -------------------------------------- */
const summary =
  `## Domain Filter Automation\n\n` +
  `| Metric | Value |\n|---|---|\n` +
  `| Files processed | ${report.filesProcessed} |\n` +
  `| Domains before | ${totals.validBefore} |\n` +
  `| Domains after | ${totals.validAfter} |\n` +
  `| Duplicates removed | ${totals.duplicatesRemoved} |\n` +
  `| Normalized | ${totals.normalized} |\n` +
  `| Invalid | ${totals.invalid} |\n` +
  `| Cross-category duplicates | ${crossCount} |\n` +
  `| Validation | ${passed ? "PASS" : "FAIL"} |\n` +
  `| Auto-fix needed | ${autoFixNeeded ? "yes" : "no"} |\n` +
  `| Auto-merge | ${autoMerge.eligible ? "ELIGIBLE" : "not eligible"} |\n`;

if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
if (process.env.GITHUB_OUTPUT) {
  const out = [
    `passed=${passed}`,
    `autofix_needed=${autoFixNeeded}`,
    `automerge_eligible=${autoMerge.eligible}`,
    `labels=${[...labels].join(",")}`,
    `duplicates_removed=${totals.duplicatesRemoved}`,
    `normalized=${totals.normalized}`,
  ].join("\n");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, out + "\n");
}

// Console output.
process.stdout.write(summary + "\n");
if (!passed) {
  process.stderr.write("Errors:\n" + errors.map((e) => "  - " + e).join("\n") + "\n");
}
process.exit(passed ? 0 : 1);
