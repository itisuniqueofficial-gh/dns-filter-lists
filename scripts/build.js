/**
 * build.js — full production build pipeline.
 *
 *   clean -> validate -> detect duplicates -> build model once ->
 *   lists (.txt) -> JSON index -> stats -> static site (+search+sitemap+robots)
 *
 * Validation and duplicate detection run in-process and abort the build on
 * any error, so a failed validation can never produce a deployable dist/.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { DIST_DIR, rmrf } from "./lib/fs-utils.js";
import { buildModel } from "./lib/model.js";
import { buildLists } from "./build-lists.js";
import { generateIndex } from "./generate-index.js";
import { generateStats } from "./generate-stats.js";
import { buildSite } from "./build-site.js";
import { step, ok, err, info, color } from "./lib/log.js";

const here = path.dirname(fileURLToPath(import.meta.url));

function run(scriptRelPath, label) {
  const r = spawnSync(process.execPath, [path.join(here, scriptRelPath)], {
    stdio: "inherit",
  });
  if (r.status !== 0) {
    err(`${label} failed — aborting build.`);
    process.exit(r.status || 1);
  }
}

const t0 = Date.now();
info(color.bold("Building DNS Filter Lists\n"));

// 1. Gatekeepers: never build on invalid or duplicated data.
run("validate-lists.js", "Validation");
run("detect-duplicates.js", "Duplicate detection");

// 2. Clean output.
step("Cleaning dist/");
rmrf(DIST_DIR);
ok("dist/ cleared.");

// 3. Build the model once and share it across every generator.
const model = buildModel();
buildLists(model);
generateIndex(model);
generateStats(model);
buildSite(model);

const secs = ((Date.now() - t0) / 1000).toFixed(2);
info("");
ok(color.bold(`Build complete in ${secs}s → dist/`));
