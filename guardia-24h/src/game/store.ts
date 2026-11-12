import { create } from 'zustand';
import { guardaOverridesLocal, overridesVacios, type Overrides } from './datos';
import { ESTADO_INICIAL, repo, type EstadoJuego, type Sesion } from '../data';

async function cacheaOverrides(uid: string) {
  try { const o = await repo.cargarOverrides?.(uid); if (o) guardaOverridesLocal(uid, { ...overridesVacios(), ...(o as Partial<Overrides>) }); } catch { /* sin conexión: se usa la última copia */ }
}

export const RANGOS = [
  { nombre: 'Aprendiz', xp: 0 }, { nombre: 'Oficial 2.ª', xp: 100 }, { nombre: 'Oficial 1.ª', xp: 300 },
  { nombre: 'Encargado', xp: 700 }, { nombre: 'Jefe de obra', xp: 1500 },
] as const;
export const rangoDe = (xp: number) => [...RANGOS].reverse().find((r) => xp >= r.xp)!.nombre;

interface Store {
  listo: boolean; sesion: Sesion | null; estado: EstadoJuego;
  iniciar(): Promise<void>;
  entrar(codigo: string, alias: string): Promise<void>;
  salir(): Promise<void>;
  sumaXp(n: number): Promise<void>;
  recompensa(r: { xp?: number; dinero?: number; reputacion?: number; logros?: string[]; inventario?: string[] }): Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  listo: false, sesion: null, estado: { ...ESTADO_INICIAL },
  async iniciar() {
    const sesion = await repo.sesionActual();
    if (sesion) await cacheaOverrides(sesion.uid);
    set({ sesion, listo: true, estado: sesion ? await repo.cargarEstado(sesion.uid) : { ...ESTADO_INICIAL } });
  },
  async entrar(codigo, alias) {
    const sesion = await repo.entrarComoAlumno(codigo, alias);
    await cacheaOverrides(sesion.uid);
    const estado = await repo.cargarEstado(sesion.uid);
    await repo.registrarEvento(sesion.uid, 'login');
    set({ sesion, estado });
  },
  async salir() { await repo.salir(); set({ sesion: null, estado: { ...ESTADO_INICIAL } }); },
  async recompensa(r) {
    const { sesion, estado } = get();
    if (!sesion) return;
    const nuevo: EstadoJuego = {
      ...estado, xp: estado.xp + (r.xp ?? 0), dinero: Math.max(0, estado.dinero + (r.dinero ?? 0)),
      reputacion: Math.min(100, Math.max(0, estado.reputacion + (r.reputacion ?? 0))),
      logros: [...new Set([...estado.logros, ...(r.logros ?? [])])], inventario: [...new Set([...estado.inventario, ...(r.inventario ?? [])])],
    };
    set({ estado: nuevo });
    await repo.guardarEstado(sesion.uid, nuevo);
  },
  async sumaXp(n) {
    const { sesion, estado } = get();
    if (!sesion) return;
    const nuevo = { ...estado, xp: estado.xp + n };
    set({ estado: nuevo });
    await repo.guardarEstado(sesion.uid, nuevo);
  },
}));
