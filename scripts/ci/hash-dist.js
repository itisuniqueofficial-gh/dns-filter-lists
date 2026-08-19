/**
 * ci/hash-dist.js
 *
 * Prints a stable hash of the *data* content of the build — the sorted domain
 * payloads of every generated .txt file, with comment/provenance headers
 * (which contain a build timestamp) stripped. This verifies that list content
 * is deterministic across rebuilds without being tripped up by the intended
 * per-build `Generated:` timestamp.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { DIST_DIR } from "../lib/fs-utils.js";

/** Recursively collect all .txt files under dist/. */
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && e.name.endsWith(".txt")) out.push(p);
  }
  return out;
}

const files = walk(DIST_DIR).sort();
const hash = crypto.createHash("sha256");

for (const f of files) {
  const rel = path.relative(DIST_DIR, f);
  const data = fs
    .readFileSync(f, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trimStart().startsWith("#"))
    .join("\n");
  hash.update(rel + "\0" + data + "\n");
}

process.stdout.write(hash.digest("hex") + "\n");
