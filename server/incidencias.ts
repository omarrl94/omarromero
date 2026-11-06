/** Avisos del alumnado y los tutores sobre empresas (correo que rebota, no acepta prácticas…). */
import { createHash } from 'node:crypto';
import { almacen } from './almacen';

export const TIPOS_INCIDENCIA = ['rebote', 'no-acepta', 'correo-equivocado', 'otro'] as const;
export type TipoIncidencia = (typeof TIPOS_INCIDENCIA)[number];

export interface Incidencia {
  empresaId: string;
  tipo: TipoIncidencia;
  comentario: string;
  fecha: string;
  /** Correo de quien avisa (visible solo para superadmin, para poder preguntarle). */
  email: string;
}

const clave = (empresaId: string, uid: string) => `e-${empresaId}-${createHash('sha256').update(uid).digest('hex').slice(0, 16)}`;

/** Un aviso por persona y empresa (el último sustituye al anterior). */
export async function guardarIncidencia(uid: string, i: Incidencia): Promise<void> {
  await almacen('incidencias').guardar(clave(i.empresaId, uid), i);
}

export async function listarIncidencias(): Promise<Incidencia[]> {
  const a = almacen('incidencias');
  const lista = await Promise.all((await a.claves('e-')).map((k) => a.leer<Incidencia>(k)));
  return lista.filter((x): x is Incidencia => Boolean(x)).sort((x, y) => y.fecha.localeCompare(x.fecha));
}

export async function empresasOcultas(): Promise<string[]> {
  const a = almacen('empresas-ocultas');
  const claves = await a.claves('o-');
  const valores = await Promise.all(claves.map((k) => a.leer<boolean>(k)));
  return claves.filter((_, n) => valores[n]).map((k) => k.slice(2));
}

export async function ocultarEmpresa(empresaId: string, ocultar: boolean): Promise<void> {
  await almacen('empresas-ocultas').guardar(`o-${empresaId}`, ocultar ? true : null);
}
