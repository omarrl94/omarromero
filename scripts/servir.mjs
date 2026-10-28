#!/usr/bin/env node
// Servidor local mínimo para probar dist/: http://localhost:8000
// También sirve /accion (enlaces de los correos) y la función de correo de Netlify,
// para probar los avisos con MAIL_MODE=log y los emuladores de Firebase.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".map": "application/json", ".txt": "text/plain; charset=utf-8" };
const puerto = Number(process.env.PORT || 8000);
const funciones = { correo: () => import("../netlify/functions/correo.mjs") };

async function funcion(nombre, req, res) {
  const cuerpo = [];
  for await (const trozo of req) cuerpo.push(trozo);
  const peticion = new Request(`http://localhost:${puerto}${req.url}`, {
    method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(cuerpo)
  });
  const r = await (await funciones[nombre]()).default(peticion);
  res.writeHead(r.status, Object.fromEntries(r.headers)).end(Buffer.from(await r.arrayBuffer()));
}

createServer(async (req, res) => {
  const ruta = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const fn = ruta.match(/^\.netlify[/\\]functions[/\\](\w+)$/)?.[1];
  if (fn && funciones[fn]) {
    try { await funcion(fn, req, res); } catch (e) { console.error(e); res.writeHead(500).end(); }
    return;
  }
  const fichero = join(dist, !ruta || ruta === "accion" ? "index.html" : ruta);
  if (!fichero.startsWith(dist)) { res.writeHead(403).end(); return; }
  try {
    const datos = await readFile(fichero);
    res.writeHead(200, { "Content-Type": tipos[extname(fichero)] || "application/octet-stream" }).end(datos);
  } catch {
    res.writeHead(404).end("No encontrado");
  }
}).listen(puerto, () => console.log(`Sirviendo dist/ en http://localhost:${puerto}`));
