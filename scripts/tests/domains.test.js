/**
 * Unit tests for the core domain + model logic. Run with `npm test`
 * (uses Node's built-in test runner, no dependencies).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeDomain, validateDomain, compareDomains } from "../lib/domains.js";

test("normalizeDomain lowercases, trims and strips trailing dot", () => {
  assert.equal(normalizeDomain("Instagram.COM"), "instagram.com");
  assert.equal(normalizeDomain("  example.org  "), "example.org");
  assert.equal(normalizeDomain("example.com."), "example.com");
  assert.equal(normalizeDomain("\uFEFFexample.com"), "example.com");
});

test("valid domains are accepted", () => {
  for (const d of [
    "example.com",
    "example.org",
    "sub.example.com",
    "a.b.c.example.co.uk",
    "xn--80ak6aa92e.com",
  ]) {
    assert.equal(validateDomain(d).valid, true, `${d} should be valid`);
  }
});

test("invalid domains are rejected", () => {
  for (const d of [
    "https://example.com",
    "http://example.com",
    "example.com/path",
    "example.com?x=1",
    "example.com:8080",
    "localhost",
    "127.0.0.1",
    "::1",
    "*.example.com",
    "under_score.com",
    "example",
    "-bad.com",
    "bad-.com",
    "a..b.com",
    "",
  ]) {
    assert.equal(validateDomain(d).valid, false, `${d} should be invalid`);
  }
});

test("compareDomains produces deterministic ascending order", () => {
  const input = ["c.com", "a.com", "b.com"];
  assert.deepEqual([...input].sort(compareDomains), ["a.com", "b.com", "c.com"]);
});
