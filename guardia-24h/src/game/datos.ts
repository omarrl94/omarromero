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

export function leeOverrides(uid: string): { desbloqueos: Record<string, number>; taller: Record<string, number | null>; a: number } {
  try { return JSON.parse(localStorage.getItem(`g24-teacher-${uid}`) ?? '') as ReturnType<typeof leeOverrides>; } catch { return { desbloqueos: {}, taller: {}, a: 0.4 }; }
}
