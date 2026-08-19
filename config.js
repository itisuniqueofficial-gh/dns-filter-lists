/**
 * Central configuration for the DNS Filter Lists platform.
 *
 * This is the single source of truth for:
 *  - the canonical production URL,
 *  - the GitHub repository,
 *  - the list categories,
 *  - the chunking / duplicate policy.
 *
 * Every build script and the site generator import from this file so that
 * there is never a hard-coded value scattered across the codebase.
 */

/** Canonical production origin. Always HTTPS, no trailing slash, no `www.`. */
export const SITE_URL = "https://dns.itisuniqueofficial.com";

/** Public repository (used for "GitHub source" links). */
export const REPO_URL = "https://github.com/itisuniqueofficial-gh/dns-filter-lists";

/** Raw branch used for GitHub "view source" links. */
export const REPO_BRANCH = "main";

/** Organisation / author displayed in the footer. */
export const ORG_NAME = "It Is Unique Official";

/**
 * Maximum number of domains written to a single generated `.txt` chunk.
 * The build system splits large category lists into `domains-1.txt`,
 * `domains-2.txt`, ... automatically. Contributors never maintain chunks.
 */
export const MAX_DOMAINS_PER_FILE = 50000;

/**
 * When the whole category fits in a single file (<= MAX_DOMAINS_PER_FILE),
 * emit a stable `domains.txt` in addition to `domains-1.txt`.
 * When it does not fit, `domains.txt` is still emitted as the full,
 * unchunked list (documented as potentially large).
 */
export const EMIT_FULL_FILE = true;

/**
 * Cross-category duplicate policy.
 *  - "error"   -> build fails if a domain appears in two categories
 *  - "warning" -> logged but build succeeds (default)
 *  - "ignore"  -> not reported
 * Same-category duplicates are ALWAYS an error.
 */
export const CROSS_CATEGORY_DUPLICATE_POLICY = "warning";

/** Hard limit on a single source file size (bytes). Guards against abuse. */
export const MAX_SOURCE_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

/** Allowed source file name inside each category directory. */
export const SOURCE_FILE_NAME = "domains.txt";

/** Whether `#` comments are permitted in source files. */
export const ALLOW_COMMENTS = true;

/**
 * The list categories. Order here controls display order on the site.
 * `slug` is the URL segment and the `src/<slug>/` directory name.
 */
export const CATEGORIES = [
  {
    slug: "social",
    name: "Social",
    listName: "Social Domains",
    description:
      "Domains belonging to social media and social networking services.",
    icon: "share-nodes",
  },
  {
    slug: "suspicious",
    name: "Suspicious",
    listName: "Suspicious Domains",
    description:
      "Domains flagged by the community as suspicious or low-reputation.",
    icon: "triangle-exclamation",
  },
  {
    slug: "ads",
    name: "Advertising",
    listName: "Advertising Domains",
    description:
      "Domains serving advertisements and ad-delivery infrastructure.",
    icon: "rectangle-ad",
  },
  {
    slug: "tracking",
    name: "Tracking",
    listName: "Tracking Domains",
    description:
      "Domains used for analytics, telemetry and cross-site user tracking.",
    icon: "eye",
  },
  {
    slug: "malware",
    name: "Malware",
    listName: "Malware Domains",
    description:
      "Domains associated with malware distribution and command-and-control.",
    icon: "bug",
  },
  {
    slug: "phishing",
    name: "Phishing",
    listName: "Phishing Domains",
    description:
      "Domains associated with phishing and credential-harvesting campaigns.",
    icon: "fish",
  },
  {
    slug: "other",
    name: "Other",
    listName: "Other Domains",
    description:
      "Miscellaneous community-submitted domains that do not fit another category.",
    icon: "layer-group",
  },
];

/** Convenience lookup: slug -> category object. */
export const CATEGORY_BY_SLUG = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);

/** Directory layout (relative to repo root). */
export const PATHS = {
  src: "src",
  dist: "dist",
  site: "site",
};

export default {
  SITE_URL,
  REPO_URL,
  REPO_BRANCH,
  ORG_NAME,
  MAX_DOMAINS_PER_FILE,
  EMIT_FULL_FILE,
  CROSS_CATEGORY_DUPLICATE_POLICY,
  MAX_SOURCE_FILE_BYTES,
  SOURCE_FILE_NAME,
  ALLOW_COMMENTS,
  CATEGORIES,
  CATEGORY_BY_SLUG,
  PATHS,
};
