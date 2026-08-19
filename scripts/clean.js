/**
 * clean.js — remove the dist/ build output.
 */
import { DIST_DIR, rmrf } from "./lib/fs-utils.js";
import { ok, step } from "./lib/log.js";

step("Cleaning build output");
rmrf(DIST_DIR);
ok("Removed dist/.");
