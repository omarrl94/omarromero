import type { EnlaceProfundo } from '../config/ffe.config';
import { config, perfilPorId } from '../config/ffe.config';

export interface EnlaceGenerado {
  id: string;
  nombre: string;
  url: string;
  probado: boolean;
  fechaPrueba: string | null;
}

/** Construye la URL de búsqueda filtrada de un portal para un perfil y una ubicación. */
export function construirEnlace(enlace: EnlaceProfundo, terminos: string, lugar: string = config.lugarBusqueda): string {
  return enlace.plantilla.replace('{q}', encodeURIComponent(terminos)).replace('{lugar}', encodeURIComponent(lugar));
}

/**
 * Enlaces de todos los portales para un perfil.
 * Con `soloProbados`, se omiten los que no se han comprobado (comportamiento de producción).
 */
export function enlacesParaPerfil(perfilId: string, opciones: { soloProbados: boolean; lugar?: string }): EnlaceGenerado[] {
  const perfil = perfilPorId(perfilId);
  if (!perfil) return [];
  return config.enlacesProfundos
    .filter((e) => !opciones.soloProbados || e.probado)
    .filter((e) => !('ciclos' in e) || !e.ciclos || (e.ciclos as readonly string[]).includes(perfil.ciclo))
    .map((e) => ({
      id: e.id,
      nombre: e.nombre,
      url: construirEnlace(e, perfil.busqueda, opciones.lugar),
      probado: e.probado,
      fechaPrueba: e.fechaPrueba,
    }));
}
