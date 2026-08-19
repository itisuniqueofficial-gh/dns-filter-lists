/**
 * normalize-lists.js
 *
 * Rewrites source files into canonical form:
 *  - normalize every domain (lowercase, trim, strip trailing dot, LF)
 *  - drop blank lines and (optionally) preserve comments at the top
 *  - deterministic alphabetical sort
 *  - deduplicate within the file
 *  - LF endings + final newline
 *
 * Dry-run by default (prints a diff summary). Pass `--write` to modify files.
 * Invalid domains are reported and left in place so the author can fix them;
 * they are NOT silently discarded.
 */
import fs from "node:fs";
import path from "node:path";

import { CATEGORIES, ALLOW_COMMENTS } from "../config.js";
import { SRC_DIR, categorySourcePath, parseSourceFile, writeText } from "./lib/fs-utils.js";
import { compareDomains } from "./lib/domains.js";
import { step, ok, warn, info, fmt, color } from "./lib/log.js";

const WRITE = process.argv.includes("--write");

step(WRITE ? "Normalizing source lists (writing)" : "Normalizing source lists (dry run)");

let totalChanged = 0;
let invalidTotal = 0;

for (const cat of CATEGORIES) {
  const file = categorySourcePath(cat.slug);
  const rel = path.relative(SRC_DIR, file);
  if (!fs.existsSync(file)) continue;

  const { records } = parseSourceFile(file);
  const comments = [];
  const valid = new Set();
  let invalid = 0;

  for (const r of records) {
    if (r.isComment) {
      if (ALLOW_COMMENTS) comments.push(r.raw.trimEnd());
      continue;
    }
    if (!r.isData) continue;
    if (!r.validation.valid) {
      invalid++;
      warn(`  src/${rel}:${r.lineNumber}: invalid '${r.raw}' (${r.validation.reason}) — left unchanged`);
      continue;
    }
    valid.add(r.normalized);
  }

  const sorted = [...valid].sort(compareDomains);
  const body = sorted.join("\n");
  const header = comments.length ? comments.join("\n") + "\n" : "";
  const next = (header + body).replace(/\n*$/, "") + "\n";
  const current = fs.readFileSync(file, "utf8");

  invalidTotal += invalid;

  if (next !== current) {
    totalChanged++;
    const before = current.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length;
    info(
      `  ${color.gray("•")} src/${rel}: ${fmt(before)} → ${fmt(sorted.length)} domains` +
        (WRITE ? "" : color.gray(" (dry run)"))
    );
    if (WRITE) writeText(file, next);
  }
}

info("");
if (invalidTotal > 0) {
  warn(`${invalidTotal} invalid domain(s) were left unchanged. Fix or remove them.`);
}
if (totalChanged === 0) {
  ok("All source lists already canonical.");
} else if (WRITE) {
  ok(`Normalized ${totalChanged} file(s).`);
} else {
  warn(`${totalChanged} file(s) would change. Re-run with: npm run normalize:write`);
}
