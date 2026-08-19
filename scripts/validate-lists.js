/**
 * validate-lists.js
 *
 * Validates every source list without modifying anything. Exits non-zero when
 * any error is found so CI fails. Warnings do not fail the build.
 *
 * Checks per file:
 *  - file exists / readable
 *  - file size within MAX_SOURCE_FILE_BYTES
 *  - LF line endings (no CRLF)
 *  - final newline present
 *  - no leading/trailing whitespace on data lines
 *  - every data line is a valid domain (syntax, labels, TLD, IP/URL rejection)
 *  - normalization is idempotent (line already canonical) -> otherwise error,
 *    prompting `npm run normalize:write`
 *  - no duplicate domains within the file
 *  - comments only if ALLOW_COMMENTS
 */
import fs from "node:fs";
import path from "node:path";

import {
  CATEGORIES,
  ALLOW_COMMENTS,
  MAX_SOURCE_FILE_BYTES,
} from "../config.js";
import {
  SRC_DIR,
  categorySourcePath,
  parseSourceFile,
} from "./lib/fs-utils.js";
import { step, ok, warn, err, info, fmt, color } from "./lib/log.js";

let errors = 0;
let warnings = 0;

function fail(msg) {
  errors++;
  err(msg);
}
function caution(msg) {
  warnings++;
  warn(msg);
}

step("Validating source lists");

// Detect unexpected files/directories inside src/.
const allowedSlugs = new Set(CATEGORIES.map((c) => c.slug));
if (fs.existsSync(SRC_DIR)) {
  for (const entry of fs.readdirSync(SRC_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (!entry.isDirectory()) {
      fail(`Unexpected file in src/: '${entry.name}' (only category directories are allowed)`);
      continue;
    }
    if (!allowedSlugs.has(entry.name)) {
      fail(`Unknown category directory 'src/${entry.name}/'. Add it to config.js CATEGORIES first.`);
      continue;
    }
    // Only domains.txt allowed inside a category directory.
    const inner = fs.readdirSync(path.join(SRC_DIR, entry.name));
    for (const f of inner) {
      if (f !== "domains.txt") {
        fail(`Unexpected file 'src/${entry.name}/${f}' (only domains.txt is allowed)`);
      }
    }
  }
}

for (const cat of CATEGORIES) {
  const file = categorySourcePath(cat.slug);
  const rel = path.relative(SRC_DIR, file);

  if (!fs.existsSync(file)) {
    caution(`src/${rel} missing (category '${cat.slug}' has no source file yet)`);
    continue;
  }

  const stat = fs.statSync(file);
  if (stat.size > MAX_SOURCE_FILE_BYTES) {
    fail(`src/${rel} is ${fmt(stat.size)} bytes, exceeds limit ${fmt(MAX_SOURCE_FILE_BYTES)}`);
  }

  const rawText = fs.readFileSync(file, "utf8");
  if (rawText.includes("\r")) {
    fail(`src/${rel}: CRLF line endings detected — use LF only`);
  }
  if (rawText.length > 0 && !rawText.endsWith("\n")) {
    fail(`src/${rel}: missing final newline`);
  }
  if (/\u0000/.test(rawText)) {
    fail(`src/${rel}: NUL byte detected (binary content not allowed)`);
  }

  const { records } = parseSourceFile(file);
  const seen = new Map(); // normalized -> first line number
  let dataCount = 0;

  for (const r of records) {
    if (r.isComment) {
      if (!ALLOW_COMMENTS) {
        fail(`src/${rel}:${r.lineNumber}: comments are not allowed`);
      }
      continue;
    }
    if (!r.isData) continue; // blank line
    dataCount++;

    if (r.raw !== r.raw.trim()) {
      fail(`src/${rel}:${r.lineNumber}: leading/trailing whitespace`);
    }
    if (!r.validation.valid) {
      fail(`src/${rel}:${r.lineNumber}: invalid domain '${r.raw}' (${r.validation.reason})`);
      continue;
    }
    if (r.changed) {
      fail(
        `src/${rel}:${r.lineNumber}: '${r.raw}' is not canonical (expected '${r.normalized}'). Run: npm run normalize:write`
      );
    }
    if (seen.has(r.normalized)) {
      fail(
        `src/${rel}:${r.lineNumber}: duplicate '${r.normalized}' (first seen on line ${seen.get(r.normalized)})`
      );
    } else {
      seen.set(r.normalized, r.lineNumber);
    }
  }

  info(`  ${color.gray("•")} src/${rel}: ${fmt(dataCount)} domains`);
}

info("");
if (errors > 0) {
  err(`Validation failed: ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
} else if (warnings > 0) {
  warn(`Validation passed with ${warnings} warning(s).`);
} else {
  ok("Validation passed. All source lists are clean.");
}
