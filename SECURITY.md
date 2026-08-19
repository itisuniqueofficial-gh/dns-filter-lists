# Security Policy

## Reporting a vulnerability

If you discover a security issue in the build system, website, or CI
configuration, please report it privately rather than opening a public issue:

- Use GitHub's **private vulnerability reporting** (Security → Report a
  vulnerability) on this repository, or
- Contact the maintainers listed in [CODEOWNERS](./.github/CODEOWNERS).

Please include reproduction steps and impact. We aim to acknowledge reports
promptly and will credit reporters who wish to be named.

## Threat model

This is a static site generated from text data in a public repository. There is
no server, no database and no user accounts. The primary attack surface is the
**CI/CD pipeline** processing **untrusted pull requests**.

### Principles

- **All pull requests are untrusted input.** CI never executes
  contributor-provided scripts and treats every domain strictly as text.
- **Least privilege.** Workflows declare the minimum `permissions`. The
  validation workflow uses `contents: read` (plus `pull-requests: write` only to
  post a status comment).
- **No secret exposure to forks.** Deployment secrets are only available to
  trusted workflows running on `main`. Fork PRs run with a read-only token and
  no secrets; the PR-comment and label steps are skipped for forks.
- **Content restrictions.** CI rejects symlinks, binaries/NUL bytes,
  unexpected file types, files outside `src/<category>/domains.txt`, oversized
  files, CRLF endings and path-traversal attempts.
- **Deterministic builds.** A scheduled integrity check rebuilds the project and
  confirms the list payloads are byte-identical, catching tampering or drift.

## Hardening notes for maintainers

- **Pin actions to commit SHAs.** Workflows reference official actions by tag
  (`@v4`, `@v7`, `@v3`) for readability. For maximum supply-chain safety, pin
  each to an immutable commit SHA and update via Dependabot. This is a
  documented, deliberate trade-off — tags are convenient, SHAs are safer.
- **Enable branch protection on `main`:** require a pull request, require the
  `Validate` status check, require at least one approval, require the branch to
  be up to date, and block force pushes and deletions.
- **Enable "Require review from Code Owners"** so security-sensitive categories
  (`malware`, `phishing`, `suspicious`) and the build system get appropriate
  review.
- **Scope deployment tokens** (`CLOUDFLARE_API_TOKEN`) to Pages edit only.

## What we do not claim

Inclusion of a domain in a list is **not** a security verdict. The data is
community-maintained and provided without warranty. Do not treat these lists as
an authoritative determination that any domain is malicious or unlawful.
