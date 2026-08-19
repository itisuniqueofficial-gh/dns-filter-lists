/**
 * build-lists.js
 *
 * Writes the generated `.txt` list files into dist/<category>/:
 *   - domains-1.txt, domains-2.txt, ...  (chunked at MAX_DOMAINS_PER_FILE)
 *   - domains.txt                         (full aggregate, when non-empty)
 *
 * Files are plain UTF-8, LF endings, one domain per line, final newline.
 * A short comment header is included for provenance; DNS/filter tools that
 * read hostname-per-line ignore `#` comment lines.
 */
import path from "node:path";

import { SITE_URL, REPO_URL } from "../config.js";
import { DIST_DIR, writeText } from "./lib/fs-utils.js";
import { buildModel } from "./lib/model.js";
import { step, ok, info, fmt, color } from "./lib/log.js";

export function buildLists(model = buildModel()) {
  step("Building list files");
  let fileCount = 0;

  for (const cat of model.categories) {
    const header =
      `# ${cat.listName}\n` +
      `# Source: ${REPO_URL}\n` +
      `# Docs:   ${SITE_URL}/documentation/\n` +
      `# Generated: ${model.generatedAt}\n` +
      `# Domains in this file: {COUNT}\n` +
      `# This list is community-maintained data, provided without warranty.\n`;

    const emit = (file) => {
      const body = file.domains.join("\n");
      const text =
        header.replace("{COUNT}", String(file.count)) +
        (body ? body + "\n" : "");
      const outPath = path.join(DIST_DIR, cat.slug, file.name);
      writeText(outPath, text);
      fileCount++;
    };

    for (const f of cat.files) emit(f);
    if (cat.fullFile) emit(cat.fullFile);

    if (cat.totalDomains > 0) {
      info(
        `  ${color.gray("•")} ${cat.slug}: ${fmt(cat.totalDomains)} domains in ${cat.files.length} chunk(s)` +
          (cat.fullFile ? " + domains.txt" : "")
      );
    }
  }

  ok(`Wrote ${fmt(fileCount)} list file(s) to dist/.`);
  return model;
}

// Allow standalone execution.
if (import.meta.url === `file://${process.argv[1]}`) {
  buildLists();
}
