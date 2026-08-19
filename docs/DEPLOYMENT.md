# Deployment (Cloudflare Pages)

The site is a static bundle in `dist/`. Cloudflare Pages serves it from a global
CDN. There is no server runtime.

## Option A — Native Git integration (recommended)

This needs **no secrets** in the repository.

1. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
2. Select this repository and the `main` branch.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 18 or newer (set `NODE_VERSION=20` as an environment
     variable if needed).
4. Save and deploy. Cloudflare rebuilds on every push to `main`, and creates
   preview deployments for pull requests automatically.

Because `npm run build` runs validation and duplicate detection first, a build
with invalid data fails and is **not** published.

## Option B — CI-driven deploy (`deploy.yml`)

Use this if you prefer GitHub Actions to own deployment.

1. Create a Cloudflare API token scoped to **Pages: Edit**.
2. Add repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Optionally set a repository variable `CLOUDFLARE_PAGES_PROJECT`
   (defaults to `dns-filter-lists`).
4. On push to `main`, [`deploy.yml`](../.github/workflows/deploy.yml) builds and
   runs `wrangler pages deploy dist`. If the secrets are absent, the deploy step
   is skipped cleanly.

Do not enable both options for the same branch or you will get duplicate
deployments — pick one.

## Custom domain

1. In the Pages project: **Custom domains → Set up a domain** →
   `dns.itisuniqueofficial.com`.
2. Cloudflare provisions TLS automatically. All canonical URLs, the sitemap,
   Open Graph tags and raw list links already use
   `https://dns.itisuniqueofficial.com`.

## Headers and redirects

- `_headers` (generated into `dist/` by the build) sets
  `text/plain; charset=utf-8` for `.txt` lists, JSON content types, caching and
  a strict Content-Security-Policy.
- [`site/_redirects`](../site/_redirects) provides `/docs → /documentation/`.

Both files are copied into `dist/` during the build.

## Verifying a deployment

```bash
curl -I  https://dns.itisuniqueofficial.com/social/domains.txt   # text/plain
curl -fsSL https://dns.itisuniqueofficial.com/stats.json | head
curl -fsSL https://dns.itisuniqueofficial.com/sitemap.xml | head
```
