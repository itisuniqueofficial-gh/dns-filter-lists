/**
 * Git helpers. All functions degrade gracefully when git is unavailable
 * (e.g. a shallow checkout or a tarball export) so the build never breaks.
 */
import { execFileSync } from "node:child_process";

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/** Short commit SHA, or "" if unavailable. */
export function commitSHA() {
  return (
    process.env.GITHUB_SHA?.slice(0, 12) || git(["rev-parse", "--short=12", "HEAD"])
  );
}

/**
 * ISO timestamp of the last commit that touched a path, falling back to now.
 * @param {string} path
 */
export function lastModified(path) {
  const iso = git(["log", "-1", "--format=%cI", "--", path]);
  return iso || new Date().toISOString();
}

/** Count of unique commit authors across the repository. */
export function contributorCount() {
  const out = git(["shortlog", "-sne", "HEAD"]);
  if (!out) return 0;
  return out.split("\n").filter(Boolean).length;
}
