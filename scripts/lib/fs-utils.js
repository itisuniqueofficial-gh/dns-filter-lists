/**
 * Filesystem + source-list helpers shared across build scripts.
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import fs from "node:fs";

import {
  ALLOW_COMMENTS,
  CATEGORIES,
  PATHS,
  SOURCE_FILE_NAME,
} from "../../config.js";
import { normalizeDomain, validateDomain, isCommentOrBlank } from "./domains.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the repository root (two levels up from scripts/lib). */
export const ROOT = resolve(__dirname, "..", "..");

export const SRC_DIR = join(ROOT, PATHS.src);
export const DIST_DIR = join(ROOT, PATHS.dist);
export const SITE_DIR = join(ROOT, PATHS.site);

/** Recursively remove a directory if it exists. */
export function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Ensure a directory exists. */
export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** Write a UTF-8 text file, creating parent directories as needed. */
export function writeText(filePath, contents) {
  ensureDir(dirname(filePath));
  fs.writeFileSync(filePath, contents, "utf8");
}

/** Write pretty JSON with a trailing newline. */
export function writeJSON(filePath, obj) {
  writeText(filePath, JSON.stringify(obj, null, 2) + "\n");
}

/** Copy a file, creating parent directories. */
export function copyFile(from, to) {
  ensureDir(dirname(to));
  fs.copyFileSync(from, to);
}

/** Absolute path to a category's source file. */
export function categorySourcePath(slug) {
  return join(SRC_DIR, slug, SOURCE_FILE_NAME);
}

/**
 * Parse a source file into structured line records. Does not deduplicate.
 * Each record: { lineNumber, raw, normalized, validation, isData }
 *
 * @param {string} filePath
 * @returns {{ records: Array, dataDomains: string[] }}
 */
export function parseSourceFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { records: [], dataDomains: [] };
  }
  const text = fs.readFileSync(filePath, "utf8");
  // Split on LF; detect CRLF separately during validation.
  const lines = text.split("\n");
  const records = [];
  const dataDomains = [];

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1;
    const hasCR = line.endsWith("\r");
    const clean = hasCR ? line.slice(0, -1) : line;

    // A trailing empty element after the final newline is expected; skip it.
    if (idx === lines.length - 1 && clean === "") return;

    if (isCommentOrBlank(clean)) {
      records.push({
        lineNumber,
        raw: clean,
        normalized: "",
        isData: false,
        isComment: clean.trim().startsWith("#"),
        hasCR,
      });
      return;
    }

    const normalized = normalizeDomain(clean);
    const validation = validateDomain(normalized);
    records.push({
      lineNumber,
      raw: clean,
      normalized,
      validation,
      isData: true,
      isComment: false,
      hasCR,
      changed: normalized !== clean,
    });
    if (validation.valid) dataDomains.push(normalized);
  });

  return { records, dataDomains };
}

/**
 * Load every category's normalized+validated domains.
 * @returns {Map<string, { domains: string[], sourcePath: string, exists: boolean }>}
 */
export function loadAllCategories() {
  const result = new Map();
  for (const cat of CATEGORIES) {
    const sourcePath = categorySourcePath(cat.slug);
    const exists = fs.existsSync(sourcePath);
    const { dataDomains } = parseSourceFile(sourcePath);
    result.set(cat.slug, { domains: dataDomains, sourcePath, exists });
  }
  return result;
}

export { fs, join, dirname, resolve, ALLOW_COMMENTS };
