/**
 * Almacenamiento clave → JSON.
 *  · En Netlify: Netlify Blobs (incluido en el plan gratuito, sin configurar nada).
 *  · En local:   carpeta indicada en ALMACEN_LOCAL (lo usa `npm test`).
 *
 * Almacenes: usuarios · examenes · entregas · progreso · sistema
 */
import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { join } from "node:path";

function local(dir, nombre) {
  const base = join(dir, nombre);
  const archivo = (k) => join(base, encodeURIComponent(k) + ".json");
  return {
    async get(k) {
      try { return JSON.parse(await readFile(archivo(k), "utf8")); } catch { return null; }
    },
    async set(k, v) {
      await mkdir(base, { recursive: true });
      await writeFile(archivo(k), JSON.stringify(v, null, 1));
    },
    async del(k) { await rm(archivo(k), { force: true }); },
    async list(prefijo = "") {
      try {
        return (await readdir(base))
          .map((f) => decodeURIComponent(f.replace(/\.json$/, "")))
          .filter((k) => k.startsWith(prefijo));
      } catch { return []; }
    },
  };
}

function blobs(nombre) {
  const s = getStore({ name: nombre, consistency: "strong" });
  return {
    get: (k) => s.get(k, { type: "json" }),
    set: (k, v) => s.setJSON(k, v),
    del: (k) => s.delete(k),
    async list(prefijo = "") {
      const { blobs } = await s.list({ prefix: prefijo });
      return blobs.map((b) => b.key);
    },
  };
}

export function almacen(nombre) {
  const dir = process.env.ALMACEN_LOCAL;
  return dir ? local(dir, nombre) : blobs(nombre);
}

/** Lee varias claves en paralelo (descarta las que ya no existen). */
export async function leerTodas(store, claves) {
  return (await Promise.all(claves.map((k) => store.get(k)))).filter(Boolean);
}
