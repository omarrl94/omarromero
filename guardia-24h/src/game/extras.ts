// Códigos de taller y reto semanal. En modo local viven en este dispositivo (el profesor y el alumno comparten navegador).
const K_COD = 'g24-codigos', K_RETO = 'g24-reto';
export interface CodigoTaller { codigo: string; descripcion: string; xp: number; dinero: number; creado: number }
export interface Reto { distrito: number; nivel: number; xp: number; desde: number }

const lee = <T,>(k: string, def: T): T => { try { return (JSON.parse(localStorage.getItem(k) ?? '') as T) ?? def; } catch { return def; } };
const guarda = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

export const listaCodigos = (): CodigoTaller[] => lee<CodigoTaller[]>(K_COD, []);
export function creaCodigo(descripcion: string, xp = 100, dinero = 50): CodigoTaller {
  const alfa = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rnd = Array.from({ length: 6 }, () => alfa[Math.floor(Math.random() * alfa.length)]).join('');
  const c = { codigo: `TALLER-${rnd}`, descripcion, xp, dinero, creado: Date.now() };
  guarda(K_COD, [...listaCodigos(), c]);
  return c;
}
export const borraCodigo = (codigo: string) => guarda(K_COD, listaCodigos().filter((c) => c.codigo !== codigo));
export const buscaCodigo = (codigo: string) => listaCodigos().find((c) => c.codigo === codigo.trim().toUpperCase());

export const leeReto = (): Reto | null => lee<Reto | null>(K_RETO, null);
export const guardaReto = (r: Reto | null) => guarda(K_RETO, r);
