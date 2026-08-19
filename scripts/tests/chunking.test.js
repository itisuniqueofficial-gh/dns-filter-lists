/**
 * Verifies the chunking arithmetic used by the build model: a category with
 * more than MAX_DOMAINS_PER_FILE domains is split into numbered chunks and the
 * aggregate is the union. Uses a synthetic in-memory list so the test is fast
 * and independent of the committed source data.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

/** Local copy of the model's chunk() (kept in sync intentionally). */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

test("chunk splits at the configured boundary", () => {
  const size = 50000;
  const n = size * 2 + 123; // -> 3 chunks
  const domains = Array.from({ length: n }, (_, i) => `d${i}.example`);

  const chunks = chunk(domains, size);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, size);
  assert.equal(chunks[1].length, size);
  assert.equal(chunks[2].length, 123);

  // Aggregate equals the concatenation of all chunks.
  const agg = chunks.flat();
  assert.equal(agg.length, n);
  assert.equal(agg[0], "d0.example");
  assert.equal(agg[n - 1], `d${n - 1}.example`);
});

test("chunk of an exact multiple yields full chunks only", () => {
  const size = 100;
  const domains = Array.from({ length: 300 }, (_, i) => `d${i}.example`);
  const chunks = chunk(domains, size);
  assert.equal(chunks.length, 3);
  assert.ok(chunks.every((c) => c.length === 100));
});
