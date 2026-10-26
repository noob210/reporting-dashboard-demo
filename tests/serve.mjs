// Serves the static export in out/ under the /reporting-dashboard-demo/ subpath,
// mirroring how GitHub Pages hosts a project site.
import { createServer } from "node:http";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const BASE = "/reporting-dashboard-demo";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

export function startServer({ port = 0, outDir = join(process.cwd(), "out") } = {}) {
  if (!existsSync(outDir)) throw new Error(`Missing ${outDir}. Run "npm run build" first.`);
  const root = mkdtempSync(join(tmpdir(), "rdd-"));
  cpSync(outDir, join(root, BASE.slice(1)), { recursive: true });

  const notFoundPage = join(root, BASE.slice(1), "404.html");

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    let file = normalize(join(root, pathname));
    if (!file.startsWith(root + sep) && file !== root) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) {
      if (!pathname.endsWith("/")) {
        res.writeHead(301, { Location: pathname + "/" }).end();
        return;
      }
      file = join(file, "index.html");
    }
    if (!existsSync(file)) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      res.end(existsSync(notFoundPage) ? readFileSync(notFoundPage) : "Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      resolve({
        origin: `http://127.0.0.1:${actualPort}`,
        close: () =>
          new Promise((done) => {
            server.close(() => {
              rmSync(root, { recursive: true, force: true });
              done();
            });
          }),
      });
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const port = Number(process.env.PORT ?? 4173);
  startServer({ port }).then(({ origin }) => {
    console.log(`Serving out/ at ${origin}${BASE}/`);
  });
}
