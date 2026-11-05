import { normalizarOfertas, type OfertaBruta } from '../shared/ofertas';
import type { CacheOfertas, EstadoFuente } from '../shared/schemas';
import { almacen } from './almacen';
import { cargarEmpresas } from './datos';
import { adzuna } from './fuentes/adzuna';
import { fuentesAts } from './fuentes/ats';
import { sinSecretos, type Fuente } from './fuentes/comun';
import { infojobs } from './fuentes/infojobs';

export const CLAVE_CACHE = 'cache';

export const CACHE_VACIA: CacheOfertas = { actualizado: null, fuentes: [], ofertas: [] };

export async function leerCache(): Promise<CacheOfertas> {
  return (await almacen('ofertas').leer<CacheOfertas>(CLAVE_CACHE)) ?? CACHE_VACIA;
}

/**
 * Consulta todas las fuentes configuradas, normaliza y guarda la caché.
 * Si una fuente falla, se conservan sus ofertas de la caché anterior (si no han caducado)
 * y se marca el error para mostrarlo en la interfaz.
 */
export async function actualizarOfertas(opciones: { fuentes?: Fuente[]; fetchImpl?: typeof fetch; ahora?: Date } = {}) {
  const ahora = opciones.ahora ?? new Date();
  const fuentes = opciones.fuentes ?? [adzuna, infojobs, ...fuentesAts(await cargarEmpresas())];
  const anterior = await leerCache();
  const brutas: OfertaBruta[] = [];
  const estados: EstadoFuente[] = [];

  for (const f of fuentes) {
    const fecha = ahora.toISOString();
    if (!f.configurada()) {
      estados.push({ id: f.id, nombre: f.nombre, estado: 'sin-configurar', total: 0, fecha });
      continue;
    }
    try {
      const lista = await f.obtener(opciones.fetchImpl);
      brutas.push(...lista);
      estados.push({ id: f.id, nombre: f.nombre, estado: 'ok', total: lista.length, fecha });
    } catch (e) {
      const previas = anterior.ofertas.filter((o) => o.fuente === f.id);
      brutas.push(...previas.map((o) => ({ ...o, idFuente: o.id.split(':').slice(1).join(':'), descripcion: o.resumen })));
      estados.push({ id: f.id, nombre: f.nombre, estado: 'error', mensaje: sinSecretos((e as Error).message), total: 0, fecha });
    }
  }

  const { ofertas, descartadas } = normalizarOfertas(brutas, ahora);
  for (const est of estados) est.total = ofertas.filter((o) => o.fuente === est.id).length;
  const cache: CacheOfertas = { actualizado: ahora.toISOString(), fuentes: estados, ofertas };
  await almacen('ofertas').guardar(CLAVE_CACHE, cache);
  return { cache, descartadas };
}
