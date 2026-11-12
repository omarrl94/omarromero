import { useCallback, useEffect, useState } from 'react';
import { repo, type Intento, type Respuesta } from '../data';
import { useStore } from './store';

/** Carga intentos y respuestas del alumno actual. */
export function useProgreso() {
  const uid = useStore((s) => s.sesion?.uid);
  const [datos, setDatos] = useState<{ intentos: Intento[]; respuestas: Respuesta[]; cargado: boolean }>({ intentos: [], respuestas: [], cargado: false });
  const recarga = useCallback(async () => {
    if (!uid) return;
    const [intentos, respuestas] = await Promise.all([repo.intentos(uid), repo.respuestas(uid)]);
    setDatos({ intentos, respuestas, cargado: true });
  }, [uid]);
  useEffect(() => { void recarga(); }, [recarga]);
  return { ...datos, recarga };
}

export type NivelRubrica = 'excelente' | 'adecuado' | 'reforzar';
export const CRITERIOS_RUBRICA = ['EPI', 'Ausencia de tensión', 'Orden y limpieza', 'Identificación de riesgos', 'Residuos'] as const;
export const VALOR_RUBRICA: Record<NivelRubrica, number> = { excelente: 10, adecuado: 7, reforzar: 4 };
export interface Overrides { desbloqueos: Record<string, number>; taller: Record<string, number | null>; a: number; rubrica: Record<string, Record<string, NivelRubrica>> }
export const overridesVacios = (): Overrides => ({ desbloqueos: {}, taller: {}, a: 0.4, rubrica: {} });

/** Ajustes del profesor para un alumno (en la nube se cachean en este almacén al iniciar sesión). */
export function leeOverrides(uid: string): Overrides {
  try { return { ...overridesVacios(), ...(JSON.parse(localStorage.getItem(`g24-teacher-${uid}`) ?? '{}') as Partial<Overrides>) }; } catch { return overridesVacios(); }
}
export const guardaOverridesLocal = (uid: string, o: Overrides) => { try { localStorage.setItem(`g24-teacher-${uid}`, JSON.stringify(o)); } catch { /* sin almacenamiento */ } };

/** Media de la rúbrica de observación (RA9) o null si no hay valoraciones. */
export function notaRubrica(o: Overrides): number | null {
  const v = Object.values(o.rubrica).flatMap((b) => Object.values(b)).map((n) => VALOR_RUBRICA[n]);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}
