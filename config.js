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
  { slug: "social", name: "Social", listName: "Social Domains", icon: "share-nodes",
    description: "Domains belonging to social media and social networking services." },
  { slug: "suspicious", name: "Suspicious", listName: "Suspicious Domains", icon: "triangle-exclamation",
    description: "Domains flagged by the community as suspicious or low-reputation." },
  { slug: "ads", name: "Advertising", listName: "Advertising Domains", icon: "rectangle-ad",
    description: "Domains serving advertisements and ad-delivery infrastructure." },
  { slug: "tracking", name: "Tracking", listName: "Tracking Domains", icon: "eye",
    description: "Domains used for analytics, telemetry and cross-site user tracking." },
  { slug: "malware", name: "Malware", listName: "Malware Domains", icon: "bug",
    description: "Domains associated with malware distribution and command-and-control." },
  { slug: "phishing", name: "Phishing", listName: "Phishing Domains", icon: "fish",
    description: "Domains associated with phishing and credential-harvesting campaigns." },
  { slug: "adult", name: "Adult", listName: "Adult Domains", icon: "user-lock",
    description: "Domains associated with adult-oriented content and services." },
  { slug: "gambling", name: "Gambling", listName: "Gambling Domains", icon: "dice",
    description: "Domains associated with gambling, betting and wagering services." },
  { slug: "streaming", name: "Streaming", listName: "Streaming Domains", icon: "play",
    description: "Domains for video, audio and media streaming services." },
  { slug: "gaming", name: "Gaming", listName: "Gaming Domains", icon: "gamepad",
    description: "Domains for video games and gaming platforms." },
  { slug: "cryptocurrency", name: "Cryptocurrency", listName: "Cryptocurrency Domains", icon: "bitcoin",
    description: "Domains related to cryptocurrency and blockchain services." },
  { slug: "shopping", name: "Shopping", listName: "Shopping Domains", icon: "cart-shopping",
    description: "Domains for e-commerce and online shopping services." },
  { slug: "dating", name: "Dating", listName: "Dating Domains", icon: "heart",
    description: "Domains for dating and matchmaking services." },
  { slug: "email", name: "Email", listName: "Email Domains", icon: "envelope",
    description: "Domains providing email and webmail services." },
  { slug: "messaging", name: "Messaging", listName: "Messaging Domains", icon: "comments",
    description: "Domains for chat and instant-messaging services." },
  { slug: "forums", name: "Forums", listName: "Forums Domains", icon: "comment-dots",
    description: "Domains for forums and online discussion communities." },
  { slug: "news", name: "News", listName: "News Domains", icon: "newspaper",
    description: "Domains for news outlets and media publications." },
  { slug: "ai", name: "AI", listName: "AI Domains", icon: "wand-magic-sparkles",
    description: "Domains for artificial-intelligence tools and services." },
  { slug: "analytics", name: "Analytics", listName: "Analytics Domains", icon: "chart-line",
    description: "Domains providing web and product analytics." },
  { slug: "telemetry", name: "Telemetry", listName: "Telemetry Domains", icon: "wave-square",
    description: "Domains collecting device or application telemetry." },
  { slug: "cookie-consent", name: "Cookie/Consent", listName: "Cookie/Consent Domains", icon: "cookie-bite",
    description: "Domains serving cookie and consent-management scripts." },
  { slug: "affiliate", name: "Affiliate", listName: "Affiliate Domains", icon: "link",
    description: "Domains used for affiliate marketing and referral tracking." },
  { slug: "redirect", name: "Redirect/Shortener", listName: "Redirect Domains", icon: "arrow-right-arrow-left",
    description: "Domains used as redirectors and URL shorteners." },
  { slug: "vpn-proxy", name: "VPN/Proxy", listName: "VPN/Proxy Domains", icon: "shield-halved",
    description: "Domains for VPN and proxy services." },
  { slug: "hosting", name: "Hosting/CDN", listName: "Hosting/CDN Domains", icon: "server",
    description: "Domains for hosting providers and content-delivery networks." },
  { slug: "developer", name: "Developer", listName: "Developer Domains", icon: "code",
    description: "Domains for developer tools and technology platforms." },
  { slug: "education", name: "Education", listName: "Education Domains", icon: "graduation-cap",
    description: "Domains for educational institutions and learning platforms." },
  { slug: "finance", name: "Finance", listName: "Finance Domains", icon: "coins",
    description: "Domains for banking, payments and financial services." },
  { slug: "government", name: "Government", listName: "Government Domains", icon: "building-columns",
    description: "Domains for government and public-sector services." },
  { slug: "health", name: "Health", listName: "Health Domains", icon: "heart-pulse",
    description: "Domains for health, medical and wellness services." },
  { slug: "utilities", name: "Utilities", listName: "Utilities Domains", icon: "toolbox",
    description: "Miscellaneous utility and infrastructure domains." },
  { slug: "other", name: "Other", listName: "Other Domains", icon: "layer-group",
    description: "Miscellaneous community-submitted domains that do not fit another category." },
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
