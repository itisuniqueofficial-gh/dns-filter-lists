/**
 * ci/report.js
 *
 * Single source of truth for CI validation output. Runs the full set of
 * repository checks against src/ and prints a human-readable report plus a
 * GitHub-flavoured markdown block suitable for a PR comment.
 *
 * Usage:
 *   node scripts/ci/report.js                 # human output + exit code
 *   node scripts/ci/report.js --comment FILE  # also write PR comment md
 *   node scripts/ci/report.js --summary       # append to $GITHUB_STEP_SUMMARY
 *
 * Exit code is non-zero when any ERROR is found so CI fails and no deploy
 * can proceed. Warnings never fail the build.
 *
 * SECURITY: this script only ever READS repository files. It never executes
 * contributor-provided content and treats every domain purely as text.
 */
import fs from "node:fs";
import path from "node:path";

import {
  CATEGORIES,
  ALLOW_COMMENTS,
  MAX_SOURCE_FILE_BYTES,
  CROSS_CATEGORY_DUPLICATE_POLICY,
} from "../../config.js";
import { SRC_DIR, categorySourcePath, parseSourceFile } from "../lib/fs-utils.js";

const allowedSlugs = new Set(CATEGORIES.map((c) => c.slug));

/** @type {{level:'error'|'warning', category?:string, message:string}[]} */
const problems = [];
const add = (level, message, category) => problems.push({ level, message, category });

/* ---- 1. Repository structure / security checks -------------------------- */
function scanTree() {
  if (!fs.existsSync(SRC_DIR)) {
    add("error", "src/ directory is missing.");
    return;
  }
  for (const entry of fs.readdirSync(SRC_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isSymbolicLink()) {
      add("error", `Symlink not allowed: src/${entry.name}`);
      continue;
    }
    if (!entry.isDirectory()) {
      add("error", `Unexpected file in src/: '${entry.name}' (only category directories allowed).`);
      continue;
    }
    if (!allowedSlugs.has(entry.name)) {
      add("error", `Unknown category directory 'src/${entry.name}/'. Add it to config.js first.`);
      continue;
    }
    const dir = path.join(SRC_DIR, entry.name);
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.isSymbolicLink()) {
        add("error", `Symlink not allowed: src/${entry.name}/${f.name}`, entry.name);
      } else if (f.name !== "domains.txt") {
        add("error", `Unexpected file 'src/${entry.name}/${f.name}' (only domains.txt allowed).`, entry.name);
      }
    }
  }
}

/* ---- 2. Per-file content validation ------------------------------------- */
function validateFiles() {
  for (const cat of CATEGORIES) {
    const file = categorySourcePath(cat.slug);
    const rel = `src/${cat.slug}/domains.txt`;
    if (!fs.existsSync(file)) continue;

    const stat = fs.statSync(file);
    if (stat.size > MAX_SOURCE_FILE_BYTES) {
      add("error", `${rel}: ${stat.size} bytes exceeds limit ${MAX_SOURCE_FILE_BYTES}.`, cat.slug);
    }

    const raw = fs.readFileSync(file, "utf8");
    if (raw.includes("\r")) add("error", `${rel}: CRLF line endings — use LF only.`, cat.slug);
    if (raw.length && !raw.endsWith("\n")) add("error", `${rel}: missing final newline.`, cat.slug);
    if (/\u0000/.test(raw)) add("error", `${rel}: binary/NUL content not allowed.`, cat.slug);

    const { records } = parseSourceFile(file);
    const seen = new Map();
    for (const r of records) {
      if (r.isComment) {
        if (!ALLOW_COMMENTS) add("error", `${rel}:${r.lineNumber}: comments not allowed.`, cat.slug);
        continue;
      }
      if (!r.isData) continue;
      if (r.raw !== r.raw.trim())
        add("error", `${rel}:${r.lineNumber}: leading/trailing whitespace.`, cat.slug);
      if (!r.validation.valid) {
        add("error", `Invalid domain: ${r.raw} (${r.validation.reason}) — ${rel}:${r.lineNumber}`, cat.slug);
        continue;
      }
      if (r.changed)
        add("error", `Not canonical: '${r.raw}' should be '${r.normalized}' — ${rel}:${r.lineNumber}`, cat.slug);
      if (seen.has(r.normalized))
        add("error", `Duplicate: ${r.normalized} — ${rel}:${r.lineNumber} (first seen line ${seen.get(r.normalized)})`, cat.slug);
      else seen.set(r.normalized, r.lineNumber);
    }
  }
}

/* ---- 3. Cross-category duplicates --------------------------------------- */
function crossCategory() {
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
  for (const [domain, slugs] of map) {
    if (slugs.length > 1 && CROSS_CATEGORY_DUPLICATE_POLICY !== "ignore") {
      const level = CROSS_CATEGORY_DUPLICATE_POLICY === "error" ? "error" : "warning";
      add(level, `Cross-category duplicate: ${domain} in [${slugs.join(", ")}]`);
    }
  }
}

scanTree();
validateFiles();
crossCategory();

const errors = problems.filter((p) => p.level === "error");
const warnings = problems.filter((p) => p.level === "warning");
const passed = errors.length === 0;

/* ---- Build the markdown comment ----------------------------------------- */
function markdown() {
  const lines = ["## Domain List Validation", ""];
  if (passed) {
    lines.push("✅ **All automated checks passed.**", "");
    lines.push("- ✓ Domain syntax");
    lines.push("- ✓ Duplicate detection");
    lines.push("- ✓ Formatting");
    lines.push("- ✓ Category validation");
    lines.push("- ✓ Build test");
    if (warnings.length) {
      lines.push("", `> ${warnings.length} warning(s):`);
      for (const w of warnings) lines.push(`> - ${w.message}`);
    }
  } else {
    lines.push("❌ **Validation failed.**", "", "Problems:", "");
    for (const e of errors.slice(0, 50)) lines.push(`- ${e.message}`);
    if (errors.length > 50) lines.push(`- …and ${errors.length - 50} more.`);
    if (warnings.length) {
      lines.push("", "Warnings:");
      for (const w of warnings.slice(0, 20)) lines.push(`- ${w.message}`);
    }
    lines.push("", "Please fix these issues and push another commit. No manual cleanup is required.");
  }
  return lines.join("\n") + "\n";
}

const md = markdown();

/* ---- Emit outputs -------------------------------------------------------- */
const commentIdx = process.argv.indexOf("--comment");
if (commentIdx !== -1 && process.argv[commentIdx + 1]) {
  fs.writeFileSync(process.argv[commentIdx + 1], md, "utf8");
}
if (process.argv.includes("--summary") && process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md, "utf8");
}

/* Emit label suggestions for the workflow (GITHUB_OUTPUT). */
const labels = new Set();
if (!passed) labels.add("validation-failed");
if (problems.some((p) => /Duplicate/i.test(p.message))) labels.add("duplicate");
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `passed=${passed}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `labels=${[...labels].join(",")}\n`);
}

// Human-readable console output.
process.stdout.write(md.replace(/^## /, "").replace(/\*\*/g, ""));

process.exit(passed ? 0 : 1);
