#!/usr/bin/env node
/**
 * Servidor local (sin Netlify CLI) para probar la web:
 *   npm test   → http://localhost:8888
 * Guarda los datos en ./.datos y, por defecto, NO envía correos:
 * los imprime en la consola (MAIL_MODE=log).
 * Profesor de prueba: profesor@evalua-t.local / profesor-local
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
process.env.ALMACEN_LOCAL ||= join(ROOT, ".datos");
process.env.MAIL_MODE ||= "log";
process.env.ADMIN_EMAILS ||= "profesor@evalua-t.local";
process.env.ADMIN_PASSWORD ||= "profesor-local";

const PUBLIC = join(ROOT, "public");
const PORT = Number(process.env.PORT || 8888);
const api = (await import("../netlify/functions/api.mjs")).default;
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await api(new Request(url, { method: req.method, headers: req.headers, body: req.method === "GET" ? undefined : Buffer.concat(chunks) }));
    const h = Object.fromEntries(r.headers);
    res.writeHead(r.status, h);
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (p.endsWith("/")) p += "index.html";
  try {
    const data = await readFile(join(PUBLIC, p));
    res.writeHead(200, { "Content-Type": TIPOS[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(302, { Location: p.endsWith(".html") || extname(p) ? "/" : p + "/" }).end();
  }
}).listen(PORT, () => console.log(`Exámenes en http://localhost:${PORT}  (profesor: ${process.env.ADMIN_EMAILS} / ${process.env.ADMIN_PASSWORD})`));
