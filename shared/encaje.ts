import type { Ciclo } from '../config/ffe.config';
import { config } from '../config/ffe.config';

export interface PreferenciasEncaje {
  ciclo: Ciclo;
  perfiles: string[];
  zona: string | null;
}

interface EmpresaEncajable {
  perfiles: string[];
  zona: string;
  programaPracticas?: unknown;
}

/**
 * Puntuación de encaje 0-100 entre una empresa y las preferencias del alumno.
 * - 70 puntos por perfiles: proporción de perfiles elegidos que la empresa recomienda
 *   (si no ha elegido ninguno, cuenta la afinidad con el ciclo).
 * - 20 puntos por zona (10 si la empresa trabaja en remoto/híbrido).
 * - 10 puntos si la propia empresa publica un programa de prácticas.
 * Las empresas sin ningún perfil del ciclo del alumno puntúan 0.
 */
export function puntuarEncaje(empresa: EmpresaEncajable, pref: PreferenciasEncaje): number {
  const perfilesCiclo = config.perfiles.filter((p) => p.ciclo === pref.ciclo).map((p) => p.id as string);
  const delCiclo = empresa.perfiles.filter((p) => perfilesCiclo.includes(p));
  if (delCiclo.length === 0) return 0;

  let puntos: number;
  if (pref.perfiles.length > 0) {
    const coincidencias = pref.perfiles.filter((p) => delCiclo.includes(p)).length;
    puntos = coincidencias === 0 ? 10 : 30 + 40 * (coincidencias / pref.perfiles.length);
  } else {
    puntos = 30 + 40 * Math.min(1, delCiclo.length / 3);
  }

  if (pref.zona) {
    if (empresa.zona === pref.zona) puntos += 20;
    else if (empresa.zona === 'remoto') puntos += 10;
  } else {
    puntos += 10;
  }

  if (empresa.programaPracticas) puntos += 10;
  return Math.round(Math.min(100, puntos));
}

export function etiquetaEncaje(puntos: number): 'alto' | 'medio' | 'bajo' {
  if (puntos >= 70) return 'alto';
  if (puntos >= 45) return 'medio';
  return 'bajo';
}
