/**
 * dev-server.js
 *
 * A tiny, zero-dependency static file server for local development. It serves
 * the built dist/ directory exactly the way Cloudflare Pages would:
 *   - `/foo/`      -> dist/foo/index.html
 *   - `/foo`       -> tries dist/foo.html, then dist/foo/index.html
 *   - `.txt`       -> text/plain; charset=utf-8
 *   - unknown path -> dist/404.html with status 404
 *
 * Run `npm run build` first, then `npm run dev`.
 */
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { DIST_DIR } from "./lib/fs-utils.js";
import { info, ok, warn } from "./lib/log.js";

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

function contentType(file) {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

async function tryFile(p) {
  try {
    const s = await stat(p);
    if (s.isFile()) return p;
  } catch {}
  return null;
}

async function resolvePath(urlPath) {
  // Prevent path traversal.
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const safe = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let rel = safe.replace(/^\/+/, "");

  const base = path.join(DIST_DIR, rel);

  if (urlPath === "/" || rel === "") {
    return tryFile(path.join(DIST_DIR, "index.html"));
  }
  // Directory-style URL.
  if (urlPath.endsWith("/")) {
    return tryFile(path.join(base, "index.html"));
  }
  // Exact file.
  const exact = await tryFile(base);
  if (exact) return exact;
  // Extensionless -> .html
  const asHtml = await tryFile(base + ".html");
  if (asHtml) return asHtml;
  // Pretty route -> directory index.
  return tryFile(path.join(base, "index.html"));
}

const server = http.createServer(async (req, res) => {
  try {
    const filePath = await resolvePath(req.url || "/");
    if (filePath) {
      const body = await readFile(filePath);
      res.writeHead(200, {
        "content-type": contentType(filePath),
        "cache-control": "no-cache",
      });
      res.end(body);
      return;
    }
    // 404
    const notFound = await tryFile(path.join(DIST_DIR, "404.html"));
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(notFound ? await readFile(notFound) : "404 Not Found");
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("500 Internal Server Error");
  }
});

server.on("error", (e) => {
  warn(`Dev server error: ${e.message}`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  ok("Development server running");
  info(`  Local website: http://${HOST}:${PORT}/`);
  info("  Press Ctrl+C to stop.");
});
