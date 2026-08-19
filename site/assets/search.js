/**
 * search.js — client-side domain search against the sharded index.
 *
 * The index is split by first character (see build-site.js) so only the
 * relevant shard is fetched. Everything runs in the browser: no server,
 * no tracking. Also powers a lightweight "domain viewer": /search/?q=domain
 * deep-links directly to a result.
 */
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const status = document.getElementById("search-status");
const results = document.getElementById("search-results");

if (form && input && results) {
  const shardCache = new Map();
  let catNames = null;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  /** Reduce user input to a canonical hostname for matching. */
  function normalize(raw) {
    let d = raw.trim().toLowerCase();
    d = d.replace(/^[a-z]+:\/\//, ""); // strip scheme
    d = d.replace(/[/?#].*$/, ""); // strip path/query/fragment
    d = d.replace(/\.$/, ""); // strip trailing dot
    return d;
  }

  function shardKey(domain) {
    const ch = domain[0] || "_";
    return /[a-z0-9]/.test(ch) ? ch : "_";
  }

  async function loadCatNames() {
    if (catNames) return catNames;
    catNames = {};
    try {
      const res = await fetch("/lists.json", { cache: "no-cache" });
      if (res.ok) {
        const data = await res.json();
        for (const c of data.categories) catNames[c.category] = c.name;
      }
    } catch {
      /* fall back to slug */
    }
    return catNames;
  }

  async function loadShard(key) {
    if (shardCache.has(key)) return shardCache.get(key);
    try {
      const res = await fetch(`/search-index/${key}.json`, { cache: "no-cache" });
      const data = res.ok ? await res.json() : [];
      shardCache.set(key, data);
      return data;
    } catch {
      shardCache.set(key, []);
      return [];
    }
  }

  function render(query, matches, names) {
    if (matches.length === 0) {
      status.textContent = `No results for "${query}". This domain is not in any list.`;
      results.innerHTML = "";
      return;
    }
    status.textContent = `${matches.length.toLocaleString(
      "en-US"
    )} result${matches.length === 1 ? "" : "s"} for "${query}".`;

    results.innerHTML = matches
      .map(([domain, slug, file]) => {
        const name = names[slug] || slug;
        return `<article class="result">
          <div class="result-domain">${esc(domain)}</div>
          <div class="result-meta">
            <span>Category: <a href="/${esc(slug)}/">${esc(name)}</a></span>
            <span>Source: <a class="mono" href="/${esc(slug)}/${esc(
          file
        )}">${esc(slug)}/${esc(file)}</a></span>
            <span class="badge">Listed</span>
          </div>
        </article>`;
      })
      .join("");
  }

  async function search(rawQuery) {
    const query = normalize(rawQuery);
    if (!query) {
      status.textContent = "Enter a domain to search.";
      results.innerHTML = "";
      return;
    }
    status.textContent = "Searching…";
    const [shard, names] = await Promise.all([
      loadShard(shardKey(query)),
      loadCatNames(),
    ]);

    // Exact matches first, then substring matches, capped for performance.
    const exact = [];
    const partial = [];
    for (const entry of shard) {
      const d = entry[0];
      if (d === query) exact.push(entry);
      else if (d.includes(query)) partial.push(entry);
    }
    const matches = [...exact, ...partial].slice(0, 100);
    render(query, matches, names);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value;
    history.replaceState(null, "", q ? `/search/?q=${encodeURIComponent(normalize(q))}` : "/search/");
    search(q);
  });

  // Deep link: /search/?q=example.com
  const params = new URLSearchParams(location.search);
  const initial = params.get("q");
  if (initial) {
    input.value = initial;
    search(initial);
  }
}
