import { useCallback, useEffect, useState } from 'react';
import { useStore } from './store';

type Leidas = Record<string, string[]>;
const clave = (uid: string) => `g24-teoria-${uid}`;
const lee = (uid: string): Leidas => { try { return JSON.parse(localStorage.getItem(clave(uid)) ?? '{}') as Leidas; } catch { return {}; } };

/** Secciones de teoría leídas (preferencia local del dispositivo). */
export function useTeoriaLeida() {
  const uid = useStore((s) => s.sesion?.uid) ?? '';
  const [leidas, setLeidas] = useState<Leidas>({});
  useEffect(() => { setLeidas(lee(uid)); }, [uid]);
  const alterna = useCallback((d: number, id: string) => {
    const act = lee(uid), k = String(d), lista = new Set(act[k] ?? []);
    if (lista.has(id)) lista.delete(id); else lista.add(id);
    act[k] = [...lista];
    try { localStorage.setItem(clave(uid), JSON.stringify(act)); } catch { /* sin almacenamiento */ }
    setLeidas(act);
  }, [uid]);
  return { leidas, alterna, cuenta: (d: number) => leidas[String(d)]?.length ?? 0 };
}
