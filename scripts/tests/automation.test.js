/**
 * Automation + policy + model tests. Run with `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeDomain, validateDomain, compareDomains } from "../lib/domains.js";
import {
  isProtected,
  autoMergeAllowedForCategory,
  isProtectedPath,
  evaluateAutoMerge,
} from "../lib/policy.js";
import { buildModel } from "../lib/model.js";

/* ---- deterministic dedup + sort (the core auto-fix guarantee) ---------- */
test("normalize + dedup + sort is deterministic and idempotent", () => {
  const input = ["Instagram.com", "instagram.com", "youtube.com", "instagram.com", "youtube.com", "example.org"];
  const clean = [...new Set(input.map(normalizeDomain))].sort(compareDomains);
  assert.deepEqual(clean, ["example.org", "instagram.com", "youtube.com"]);
  // idempotent: running again yields the same result
  const again = [...new Set(clean.map(normalizeDomain))].sort(compareDomains);
  assert.deepEqual(again, clean);
});

test("invalid domains are never auto-normalized into validity", () => {
  for (const d of ["https://example.com/path", "*.example.com", "localhost", "127.0.0.1"]) {
    assert.equal(validateDomain(normalizeDomain(d)).valid, false, `${d} must stay invalid`);
  }
});

/* ---- policy engine ------------------------------------------------------ */
test("protected categories are never auto-mergeable", () => {
  for (const p of ["malware", "phishing", "suspicious", "adult", "gambling"]) {
    assert.equal(isProtected(p), true);
    assert.equal(autoMergeAllowedForCategory(p), false);
  }
});

test("neutral categories are auto-mergeable", () => {
  for (const n of ["social", "ads", "streaming", "shopping", "news"]) {
    assert.equal(isProtected(n), false);
    assert.equal(autoMergeAllowedForCategory(n), true);
  }
});

test("protected paths detected; src/docs are safe", () => {
  assert.equal(isProtectedPath("src/social/domains.txt"), false);
  assert.equal(isProtectedPath("README.md"), false);
  assert.equal(isProtectedPath("docs/DEPLOYMENT.md"), false);
  assert.equal(isProtectedPath(".github/workflows/deploy.yml"), true);
  assert.equal(isProtectedPath("scripts/build.js"), true);
  assert.equal(isProtectedPath("config.js"), true);
  assert.equal(isProtectedPath("package.json"), true);
});

test("evaluateAutoMerge enforces every gate", () => {
  const ok = evaluateAutoMerge({
    changedCategories: ["social"], protectedPathTouched: false,
    changedFiles: 1, addedDomains: 3, diffBytes: 500,
    hasErrors: false, isFork: false, isDraft: false,
  });
  assert.equal(ok.eligible, true, ok.reasons.join("; "));

  const blockedProtected = evaluateAutoMerge({
    changedCategories: ["malware"], protectedPathTouched: false,
    changedFiles: 1, addedDomains: 1, diffBytes: 100,
    hasErrors: false, isFork: false, isDraft: false,
  });
  assert.equal(blockedProtected.eligible, false);

  const blockedFork = evaluateAutoMerge({
    changedCategories: ["social"], protectedPathTouched: false,
    changedFiles: 1, addedDomains: 1, diffBytes: 100,
    hasErrors: false, isFork: true, isDraft: false,
  });
  assert.equal(blockedFork.eligible, false);

  const blockedErrors = evaluateAutoMerge({
    changedCategories: ["social"], protectedPathTouched: false,
    changedFiles: 1, addedDomains: 1, diffBytes: 100,
    hasErrors: true, isFork: false, isDraft: false,
  });
  assert.equal(blockedErrors.eligible, false);

  const blockedSize = evaluateAutoMerge({
    changedCategories: ["social"], protectedPathTouched: false,
    changedFiles: 999, addedDomains: 1, diffBytes: 100,
    hasErrors: false, isFork: false, isDraft: false,
  });
  assert.equal(blockedSize.eligible, false);
});

/* ---- model + metadata --------------------------------------------------- */
test("buildModel produces sorted, deduped categories with totals", () => {
  const m = buildModel();
  assert.ok(m.categories.length >= 7);
  for (const c of m.categories) {
    // sorted
    const sorted = [...c.domains].sort(compareDomains);
    assert.deepEqual(c.domains, sorted, `${c.slug} domains must be sorted`);
    // deduped
    assert.equal(new Set(c.domains).size, c.domains.length, `${c.slug} must be unique`);
    // file/chunk arithmetic
    assert.equal(c.fileCount, c.files.length);
  }
  assert.equal(
    m.totals.domains,
    m.categories.reduce((s, c) => s + c.totalDomains, 0)
  );
});
