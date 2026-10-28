#!/usr/bin/env node
// Servidor estático mínimo para probar dist/ en local: http://localhost:8000
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".map": "application/json", ".txt": "text/plain; charset=utf-8" };
const puerto = Number(process.env.PORT || 8000);

createServer(async (req, res) => {
  const ruta = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const fichero = join(dist, ruta || "index.html");
  if (!fichero.startsWith(dist)) { res.writeHead(403).end(); return; }
  try {
    const datos = await readFile(fichero);
    res.writeHead(200, { "Content-Type": tipos[extname(fichero)] || "application/octet-stream" }).end(datos);
  } catch {
    res.writeHead(404).end("No encontrado");
  }
}).listen(puerto, () => console.log(`Sirviendo dist/ en http://localhost:${puerto}`));
