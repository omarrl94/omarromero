#!/usr/bin/env node
/**
 * Servidor local mínimo (sin Netlify CLI) para probar el examen:
 *   npm test            → http://localhost:8888
 * Sirve public/ y enruta /api/* a las funciones. Con MAIL_MODE=log
 * no envía nada: imprime el correo en la consola.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "public");
const PORT = Number(process.env.PORT || 8888);

const examen = (await import("../netlify/functions/examen.mjs")).default;
const entregar = (await import("../netlify/functions/entregar.mjs")).default;
const RUTAS = { "/api/examen": examen, "/api/entregar": entregar };
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const fn = RUTAS[url.pathname];
  if (fn) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await fn(new Request(url, { method: req.method, headers: req.headers, body: req.method === "POST" ? Buffer.concat(chunks) : undefined }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let p = normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  if (p.endsWith("/")) p += "index.html";
  try {
    const data = await readFile(join(PUBLIC, p));
    res.writeHead(200, { "Content-Type": TIPOS[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end("No encontrado");
  }
}).listen(PORT, () => console.log(`Exámenes en http://localhost:${PORT}`));
