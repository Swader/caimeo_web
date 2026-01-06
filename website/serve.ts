import path from "node:path";
import { fileURLToPath } from "node:url";

const WEBSITE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(WEBSITE_DIR, "dist");

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? "8000");

function contentTypeFor(filePath: string): string | undefined {
  switch (path.extname(filePath).toLowerCase()) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".pdf":
      return "application/pdf";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".ttf":
      return "font/ttf";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return undefined;
  }
}

function resolveDistPath(pathname: string): string | null {
  let safePath = decodeURIComponent(pathname);
  if (safePath === "/") safePath = "/index.html";
  if (safePath.endsWith("/")) safePath += "index.html";
  if (safePath.startsWith("/")) safePath = safePath.slice(1);

  const resolved = path.resolve(DIST_DIR, safePath);
  const relative = path.relative(DIST_DIR, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

const server = Bun.serve({
  hostname: HOST,
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const filePath = resolveDistPath(url.pathname);
    if (!filePath) return new Response("Bad Request", { status: 400 });

    const file = Bun.file(filePath);
    if (!(await file.exists())) return new Response("Not Found", { status: 404 });

    const headers = new Headers();
    const contentType = contentTypeFor(filePath) ?? file.type;
    if (contentType) headers.set("content-type", contentType);
    headers.set("cache-control", "no-cache");

    return new Response(file, { headers });
  },
});

console.log(`Serving ${DIST_DIR} at http://${server.hostname}:${server.port}`);


