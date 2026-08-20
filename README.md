# DNS Filter Lists

Open-source, community-maintained, machine-readable **domain filter lists** with
a fully static website and an automated GitHub → Cloudflare Pages pipeline.

**Production site:** <https://dns.itisuniqueofficial.com>

[![Validate](https://github.com/itisuniqueofficial-gh/dns-filter-lists/actions/workflows/validate.yml/badge.svg)](https://github.com/itisuniqueofficial-gh/dns-filter-lists/actions/workflows/validate.yml)
[![Build](https://github.com/itisuniqueofficial-gh/dns-filter-lists/actions/workflows/build.yml/badge.svg)](https://github.com/itisuniqueofficial-gh/dns-filter-lists/actions/workflows/build.yml)

---

## What this is

A platform for browsing, consuming and contributing curated domain lists
(social, advertising, tracking, malware, phishing, suspicious and other). There
is **no backend and no database**: GitHub is the source of truth, a Node.js
build system generates the lists, JSON metadata and the website, and Cloudflare
Pages serves everything from a global CDN.

- **Browse** categories, view statistics and search domains client-side.
- **Consume** raw `.txt` lists directly from DNS/filtering software.
- **Contribute** domains through reviewed pull requests.
- Everything is **generated and validated automatically** — no hand-maintained
  numbers, no hand-split files.

## Features

- Zero runtime dependencies — the build system uses only the Node.js standard library.
- Domain validation, normalization, deterministic sorting and deduplication.
- Automatic file chunking at a configurable size (`MAX_DOMAINS_PER_FILE`).
- Machine-readable metadata: `lists.json`, `stats.json`, per-category `index.json`.
- Client-side search backed by a sharded index (only the needed slice is fetched).
- Accessible (WCAG 2.2 AA practices), responsive from 320px to 4K, light/dark themes.
- SEO complete: canonical URLs, Open Graph/Twitter, sitemap, robots, structured data.
- Hardened CI: least-privilege permissions, no secret exposure to fork PRs,
  rejection of symlinks/binaries/unexpected files.

## Automation

Routine contributor work is almost fully automated by a coherent,
config-driven pipeline. Contributors only add domains and open a PR — the rest
happens automatically:

```text
Pull Request → Auto-fix (normalize + dedupe + sort, safe commit)
            → Automation report (validate + duplicates + policy)
            → Build test + unit tests
            → Single PR comment + labels + uploaded reports
            → Native auto-merge (only when policy permits)
            → main → build → Cloudflare Pages
```

- **Auto-fix** (`.github/workflows/auto-fix.yml`) applies only *deterministic,
  safe* fixes to same-repo PR branches — normalization, within-file
  deduplication and sorting — and commits them as
  `chore: automatically normalize and deduplicate domain lists`. It never
  force-pushes and never changes classification or meaning.
- **Automation report** (`scripts/ci/automation-report.js`) validates domains,
  builds a cross-category duplicate index, and computes auto-merge eligibility.
  It writes `.validation/report.{json,md}` and `build/reports/duplicates.{json,md}`,
  a job summary, and updates a single PR comment. Artifacts are uploaded.
- **Auto-merge policy** is derived from `config.js`. Neutral categories are
  auto-merge eligible; **protected categories require human review** and are
  never auto-merged: `suspicious`, `malware`, `phishing`, `adult`, `gambling`.
  PRs touching protected paths (`.github/`, `scripts/`, `config.js`,
  `package.json`, `site/`) or exceeding size thresholds are labelled
  `needs-review`. The machine-readable policy is published at `/policy.json`.
- **Contributors never manually deduplicate or sort** — automation handles it.
  Only genuinely ambiguous data (invalid domains) fails the check and needs a
  human fix.

Enabling native auto-merge requires the repository setting *Allow auto-merge*
and branch protection on `main`. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Repository structure

```text
.
├── config.js                # Central config: URL, repo, categories, chunk size, policy
├── src/                      # SOURCE OF TRUTH — one domains.txt per category
│   ├── social/domains.txt
│   ├── ads/domains.txt
│   └── ...
├── scripts/                  # Build system (Node, ESM, no dependencies)
│   ├── lib/                  # domains, fs, model, git, log, policy helpers
│   ├── site/                 # HTML generator (layout, components, pages, icons)
│   ├── ci/                   # automation-report / report / verify-dist / hash-dist
│   ├── tests/                # node:test unit tests
│   ├── validate-lists.js  normalize-lists.js  detect-duplicates.js
│   ├── build-lists.js  generate-index.js  generate-stats.js  build-site.js
│   ├── build.js  clean.js  dev-server.js
├── site/                     # Static assets (CSS/JS), favicon, OG image, CF config
│   ├── assets/{styles.css,main.js,filter.js,search.js}
│   ├── _redirects  favicon.svg  og.svg   # _headers is generated into dist/
├── .github/                  # Workflows, PR template, CODEOWNERS, labels, issues
└── dist/                     # GENERATED output (git-ignored) — deployed to Cloudflare
```

## Available lists

| Category   | Slug         | Description                                   |
| ---------- | ------------ | --------------------------------------------- |
| Social     | `social`     | Social media / networking services           |
| Advertising| `ads`        | Ad-serving and ad-delivery infrastructure     |
| Tracking   | `tracking`   | Analytics, telemetry, cross-site tracking     |
| Malware    | `malware`    | Malware distribution / command-and-control    |
| Phishing   | `phishing`   | Phishing / credential harvesting              |
| Suspicious | `suspicious` | Community-flagged low-reputation domains      |
| Other      | `other`      | Miscellaneous submissions                     |

Categories are defined in [`config.js`](./config.js) — the single place to add one.

## Usage

Every list is plain UTF-8 text, one hostname per line, served as
`text/plain; charset=utf-8`.

Raw URLs:

```text
https://dns.itisuniqueofficial.com/social/domains.txt      # complete list
https://dns.itisuniqueofficial.com/social/domains-1.txt    # first chunk
https://dns.itisuniqueofficial.com/social/domains-2.txt    # next chunk (if needed)
```

Fetch from the command line:

```bash
curl -fsSL https://dns.itisuniqueofficial.com/ads/domains.txt
```

Machine-readable metadata:

```text
/lists.json                 catalogue of all categories
/stats.json                 aggregate statistics
/<category>/index.json      per-category detail (files, counts, timestamps)
```

> **Format note.** Lists are hostname-per-line text with `#` comment lines
> (a short provenance header). Many DNS/filtering tools accept a plain hostname
> list or can import one; consult your tool's documentation for the exact
> import method. We do not claim turnkey compatibility with any specific product.

## Local development

Requires **Node.js ≥ 18**. There are no dependencies to install, but `npm install`
works and is harmless.

```bash
npm install        # optional (no runtime dependencies)
npm run validate   # validate source lists
npm run build      # generate dist/
npm run dev        # serve dist/ locally
```

Then open the local website:

```text
http://127.0.0.1:8080/
```

Useful scripts:

| Command                     | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `npm run validate`          | Validate syntax, formatting, duplicates, structure |
| `npm run normalize`         | Dry-run normalization (shows what would change)    |
| `npm run normalize:write`   | Rewrite source files into canonical, sorted form   |
| `npm run duplicates`        | Report within/cross-category duplicates            |
| `npm run report`            | Full automation report (validation + dedup + policy) |
| `npm run build`             | Full pipeline → `dist/`                            |
| `npm run dev`               | Local static server                                |
| `npm test`                  | Unit tests                                         |
| `npm run clean`             | Remove `dist/`                                     |

## Contribution

1. Fork the repository.
2. Create a branch.
3. Edit `src/<category>/domains.txt` (one domain per line).
4. Run `npm run validate`.
5. Open a pull request.
6. CI validates syntax, duplicates and runs a build test, and comments the result.
7. A maintainer reviews and merges.
8. The site and lists rebuild and deploy automatically.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

## Validation

Accepted: `example.com`, `sub.example.com`, `example.co.uk`.
Rejected: URLs (`https://…`), paths, query strings, ports, IP addresses,
`localhost`, wildcards and underscores. Domains are normalized (lowercase,
trimmed, trailing dot removed) before comparison; non-canonical entries fail
validation with a fix hint.

## Build process

`npm run build` runs: **validate → detect duplicates → clean → build model →
lists (`.txt`) → JSON metadata → stats → static site (+ search index + sitemap +
robots)**. Validation and duplicate detection are gatekeepers: an error aborts
the build so an invalid state can never be deployed. Output is deterministic —
identical sources produce identical list payloads.

## Deployment

The production site is hosted on **Cloudflare Pages** with the output directory
`dist/`. See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the recommended Git
integration and the CI-driven alternative.

## Security

All pull requests are treated as untrusted input. CI runs with least-privilege
permissions, never exposes secrets to fork PRs, and never executes
contributor-provided content. See [SECURITY.md](./SECURITY.md).

## License & disclaimer

Code and data are released under the [MIT License](./LICENSE). The domain
classification data is **community-maintained**. Inclusion of a domain does not
constitute a claim that it is malicious, unlawful, or unsafe unless the relevant
category and project methodology explicitly state otherwise.
