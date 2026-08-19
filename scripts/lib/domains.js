/**
 * Domain normalization and validation.
 *
 * Pure, dependency-free functions shared by every build script. Keeping this
 * logic in one place guarantees that validation, deduplication and the site
 * generator all agree on what a "valid domain" is and how it is canonicalised.
 */

/** Max total length of a domain name (RFC 1035). */
const MAX_DOMAIN_LENGTH = 253;
/** Max length of a single label. */
const MAX_LABEL_LENGTH = 63;

/** A single DNS label: alphanumeric, internal hyphens allowed. */
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** TLD: letters only, or a punycode label (xn--...). Minimum two chars. */
const TLD_RE = /^(?:[a-z]{2,}|xn--[a-z0-9-]{2,})$/;

const IPV4_RE = /^(\d{1,3})(\.\d{1,3}){3}$/;
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/;

/**
 * Normalize a raw domain string to its canonical representation.
 * This does NOT validate; it only canonicalises for comparison/output.
 *
 * - strips a UTF-8 BOM
 * - trims surrounding whitespace
 * - lowercases (ASCII case-folding, sufficient for hostnames)
 * - removes a single trailing dot (FQDN root)
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeDomain(raw) {
  if (typeof raw !== "string") return "";
  let d = raw.replace(/^\uFEFF/, "");
  d = d.trim();
  d = d.toLowerCase();
  if (d.endsWith(".")) d = d.slice(0, -1);
  return d;
}

/**
 * Detect whether a string looks like an IPv4 address (with valid octets).
 * @param {string} s
 */
export function isIPv4(s) {
  const m = s.match(IPV4_RE);
  if (!m) return false;
  return s.split(".").every((oct) => {
    const n = Number(oct);
    return n >= 0 && n <= 255 && String(n) === String(Number(oct));
  });
}

/**
 * Detect whether a string looks like an IPv6 address (heuristic: contains
 * a colon and only hex/colon characters).
 * @param {string} s
 */
export function isIPv6(s) {
  return s.includes(":") && /^[0-9a-f:]+$/.test(s);
}

/**
 * Validate a normalized domain.
 *
 * @param {string} domain - a string that has already been normalized.
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateDomain(domain) {
  if (!domain) return { valid: false, reason: "empty" };

  if (CONTROL_CHARS_RE.test(domain))
    return { valid: false, reason: "contains control characters" };

  if (/\s/.test(domain))
    return { valid: false, reason: "contains whitespace" };

  // Reject URLs / paths / queries / ports / credentials.
  if (domain.includes("://"))
    return { valid: false, reason: "looks like a URL (scheme present)" };
  if (domain.includes("/"))
    return { valid: false, reason: "contains a path separator '/'" };
  if (domain.includes("?"))
    return { valid: false, reason: "contains a query '?'" };
  if (domain.includes("#"))
    return { valid: false, reason: "contains a fragment '#'" };
  if (domain.includes("@"))
    return { valid: false, reason: "contains '@'" };
  if (domain.includes(":"))
    return { valid: false, reason: "contains ':' (port or IPv6 not supported)" };
  if (domain.includes("*"))
    return { valid: false, reason: "contains wildcard '*'" };
  if (domain.includes("_"))
    return { valid: false, reason: "contains underscore '_'" };

  // Reject bare IP addresses (not supported by this list format).
  if (isIPv4(domain)) return { valid: false, reason: "IPv4 address not supported" };
  if (isIPv6(domain)) return { valid: false, reason: "IPv6 address not supported" };

  // Reject non-FQDN hostnames like "localhost".
  if (domain === "localhost")
    return { valid: false, reason: "'localhost' is not a public domain" };

  if (domain.length > MAX_DOMAIN_LENGTH)
    return { valid: false, reason: `exceeds ${MAX_DOMAIN_LENGTH} characters` };

  if (domain.startsWith(".") || domain.endsWith("."))
    return { valid: false, reason: "leading or trailing dot" };
  if (domain.includes(".."))
    return { valid: false, reason: "empty label ('..')" };

  const labels = domain.split(".");
  if (labels.length < 2)
    return { valid: false, reason: "must contain at least two labels" };

  for (const label of labels) {
    if (label.length > MAX_LABEL_LENGTH)
      return { valid: false, reason: `label '${label}' exceeds ${MAX_LABEL_LENGTH} characters` };
    if (!LABEL_RE.test(label))
      return { valid: false, reason: `invalid label '${label}'` };
  }

  const tld = labels[labels.length - 1];
  if (!TLD_RE.test(tld))
    return { valid: false, reason: `invalid TLD '${tld}'` };

  return { valid: true };
}

/**
 * Deterministic comparator for domains. Sorts by "registrable order":
 * plain lexicographic on the canonical string. Stable and locale-independent.
 * @param {string} a
 * @param {string} b
 */
export function compareDomains(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Determine whether a line is a comment or blank (to be ignored as data).
 * @param {string} line
 */
export function isCommentOrBlank(line) {
  const t = line.trim();
  return t === "" || t.startsWith("#");
}
