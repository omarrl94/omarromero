import { getStore } from '@netlify/blobs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { enNetlify } from './entorno';

export interface Almacen {
  leer<T>(clave: string): Promise<T | null>;
  guardar(clave: string, valor: unknown): Promise<void>;
}

const memoria = new Map<string, Almacen>();

/** Almacén en disco para desarrollo local y pruebas (carpeta .blobs-local, ignorada por Git). */
function almacenLocal(nombre: string): Almacen {
  const base = join(process.cwd(), '.blobs-local', nombre);
  const ruta = (clave: string) => join(base, `${clave.replace(/[^a-z0-9._-]/gi, '_')}.json`);
  return {
    async leer<T>(clave: string) {
      try {
        return JSON.parse(await readFile(ruta(clave), 'utf8')) as T;
      } catch {
        return null;
      }
    },
    async guardar(clave, valor) {
      const r = ruta(clave);
      await mkdir(dirname(r), { recursive: true });
      await writeFile(r, JSON.stringify(valor));
    },
  };
}

function almacenBlobs(nombre: string): Almacen {
  const store = getStore({ name: nombre, consistency: 'strong' });
  return {
    async leer<T>(clave: string) {
      return ((await store.get(clave, { type: 'json' })) as T | null) ?? null;
    },
    async guardar(clave, valor) {
      await store.setJSON(clave, valor);
    },
  };
}

/** Netlify Blobs en Netlify; disco local fuera de Netlify. */
export function almacen(nombre: string): Almacen {
  let a = memoria.get(nombre);
  if (!a) {
    a = enNetlify() ? almacenBlobs(nombre) : almacenLocal(nombre);
    memoria.set(nombre, a);
  }
  return a;
}
