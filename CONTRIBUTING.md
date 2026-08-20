# Contributing

Thank you for helping improve DNS Filter Lists. Contributions are made through
GitHub pull requests and validated automatically.

## TL;DR

1. Fork and create a branch.
2. Edit `src/<category>/domains.txt` — one domain per line.
3. Run `npm run validate` (or let CI do it).
4. Open a pull request and fill in the template.
5. Fix anything CI flags, then wait for review.

## What belongs where

| Category     | File                        | Contents                                   |
| ------------ | --------------------------- | ------------------------------------------ |
| Social       | `src/social/domains.txt`    | Social media / networking services         |
| Advertising  | `src/ads/domains.txt`       | Ad-serving / ad-delivery infrastructure    |
| Tracking     | `src/tracking/domains.txt`  | Analytics, telemetry, cross-site tracking  |
| Malware      | `src/malware/domains.txt`   | Malware distribution / C2                  |
| Phishing     | `src/phishing/domains.txt`  | Phishing / credential harvesting           |
| Suspicious   | `src/suspicious/domains.txt`| Low-reputation / community-flagged         |
| Other        | `src/other/domains.txt`     | Anything that does not fit above           |

To propose a **new category**, open an issue using the "Propose a new category"
template. A maintainer adds it to [`config.js`](./config.js); the directory and
all pages/metadata are then generated automatically.

## Domain rules

**Accepted**

```text
example.com
sub.example.com
example.co.uk
```

**Rejected**

```text
https://example.com     # no scheme / URL
example.com/path        # no path
example.com?x=1         # no query string
example.com:8080        # no port
127.0.0.1               # no IP addresses
localhost               # not a public domain
*.example.com           # no wildcards
under_score.com         # no underscores
```

Formatting requirements for source files:

- UTF-8 encoding, **LF** line endings, one domain per line, final newline.
- Lowercase, trimmed, no trailing dot (run `npm run normalize:write` to fix).
- No duplicates within a category.
- `#` comment lines are allowed (used for a short header).

You do **not** need to sort the file or split it into numbered files — the build
system sorts, deduplicates and chunks automatically at
`MAX_DOMAINS_PER_FILE` domains per file.

## Local checks

```bash
npm run validate        # syntax, formatting, duplicates, structure
npm run normalize       # preview canonicalisation (dry run)
npm run normalize:write # apply canonicalisation + sort
npm run duplicates      # within/cross-category duplicate report
npm run build           # full build (also runs validation)
npm test                # unit tests
```

## What CI does on your PR

- Validates syntax, formatting, structure and duplicates.
- Runs the unit tests and a full build test.
- Posts a comment with a ✅/❌ summary and the exact problems, if any.
- Applies `validation-failed` / `duplicate` labels automatically.

On failure, just push another commit — no manual cleanup is required and the
comment updates in place.

## Review and merge

- A maintainer (see [CODEOWNERS](./.github/CODEOWNERS)) reviews the change.
- `main` is protected: merging requires a green CI run and approval.
- On merge, the lists, metadata and site rebuild and deploy automatically.

## What CI does on your PR

- **Auto-fix** commits safe cleanup to your branch (same-repo PRs) — you do
  **not** need to deduplicate, lowercase or sort anything manually. The commit
  is `chore: automatically normalize and deduplicate domain lists` and never
  force-pushes or changes meaning.
- **Validation** runs the automation report: domain syntax, normalization,
  within/cross-category duplicates and a full build + unit tests.
- Posts a single ✅/❌ comment with a change summary (duplicates removed,
  normalized, invalid, cross-category), applies labels, and uploads reports
  (`.validation/report.*`, `build/reports/duplicates.*`) as artifacts.

Only **hard** problems fail the check: invalid domains (URLs, IPs, `localhost`,
wildcards, underscores, malformed), unexpected/binary/symlinked files, or
unknown categories. Auto-fixable formatting never fails — it just gets fixed.

## Fixing a failed PR

If the check is ❌, read the PR comment. It lists the exact invalid entries,
e.g. `Invalid domain: https://example.com`. Remove or correct them and push
again — the comment updates in place. You never need to fix duplicates or
sorting yourself.

## Auto-merge policy

Auto-merge is **config-driven** (`config.js`) and only opts a PR into GitHub's
native auto-merge (which still respects branch protection and reviews). A PR is
eligible only when **all** of these hold:

- it comes from this repository (not a fork),
- it is not a draft,
- there are no validation errors,
- it does not touch a **protected category**,
- it does not touch **protected paths** (`.github/`, `scripts/`, `config.js`,
  `package.json`, `site/`),
- it is within size thresholds (changed files / added domains / diff size).

**Protected categories always require human review** and are never
auto-merged: `suspicious`, `malware`, `phishing`, `adult`, `gambling`. This
controls *workflow review requirements only* — it is not a claim about the
domains themselves. The live policy is published at `/policy.json`.

### Enabling auto-merge (maintainers)

1. Repository **Settings → General → Allow auto-merge**.
2. Branch protection on `main`: require the **Validate** status check (and
   approvals where you want them), require up-to-date branches, block force
   pushes and deletions.
3. Optionally configure a GitHub App/PAT for the Auto-fix push so the cleanup
   commit re-runs checks (the default `GITHUB_TOKEN` push intentionally does
   not re-trigger workflows, which prevents automation loops).

## Automated rejection policy

Normal validation failures are **not** auto-closed. CI fails, comments and
labels the PR, and you are free to fix it. Only in cases of clear repository
abuse (e.g. binaries, symlinks, path traversal, or attempts to add executable
content) may a PR be closed after being flagged. This policy exists so honest
mistakes are easy to correct while abuse is contained.

## Code of conduct

Be respectful and constructive. Submissions that promote harassment or target
protected groups are not accepted.
