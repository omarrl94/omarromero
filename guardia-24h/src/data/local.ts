import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  ESTADO_INICIAL, normalizaAlias, normalizaCodigo, validaEntrada,
  type EstadoJuego, type Intento, type Repo, type Sesion,
} from './repo';

interface Esquema extends DBSchema {
  kv: { key: string; value: unknown };
  intentos: { key: number; value: Intento & { uid: string }; indexes: { uid: string } };
  eventos: { key: number; value: { uid: string; tipo: string; datos?: unknown; ts: number }; indexes: { uid: string } };
}

let dbp: Promise<IDBPDatabase<Esquema>> | null = null;
export const db = () =>
  (dbp ??= openDB<Esquema>('guardia24h', 1, {
    upgrade(d) {
      d.createObjectStore('kv');
      d.createObjectStore('intentos', { autoIncrement: true }).createIndex('uid', 'uid');
      d.createObjectStore('eventos', { autoIncrement: true }).createIndex('uid', 'uid');
    },
  }));

/** Modo local: todo vive en este dispositivo. Cualquier código de clase es válido. */
export const repoLocal: Repo = {
  modo: 'local',
  async sesionActual() {
    return ((await (await db()).get('kv', 'sesion')) as Sesion | undefined) ?? null;
  },
  async entrarComoAlumno(codigo, alias) {
    const err = validaEntrada(codigo, alias);
    if (err) throw new Error(err);
    const c = normalizaCodigo(codigo), a = normalizaAlias(alias);
    const uid = `local-${c}-${a.toLowerCase()}`;
    const s: Sesion = { uid, alias: a, claseCodigo: c, rol: 'alumno' };
    await (await db()).put('kv', s, 'sesion');
    return s;
  },
  async salir() { await (await db()).delete('kv', 'sesion'); },
  async cargarEstado(uid) {
    return ((await (await db()).get('kv', `estado:${uid}`)) as EstadoJuego | undefined) ?? { ...ESTADO_INICIAL };
  },
  async guardarEstado(uid, e) { await (await db()).put('kv', e, `estado:${uid}`); },
  async registrarIntento(uid, i) { await (await db()).add('intentos', { ...i, uid }); },
  async intentos(uid) {
    return (await (await db()).getAllFromIndex('intentos', 'uid', uid)) as Intento[];
  },
  async registrarEvento(uid, tipo, datos) { await (await db()).add('eventos', { uid, tipo, datos, ts: Date.now() }); },
};
