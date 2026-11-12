import { create } from 'zustand';
import { ESTADO_INICIAL, repo, type EstadoJuego, type Sesion } from '../data';

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
}

export const useStore = create<Store>((set, get) => ({
  listo: false, sesion: null, estado: { ...ESTADO_INICIAL },
  async iniciar() {
    const sesion = await repo.sesionActual();
    set({ sesion, listo: true, estado: sesion ? await repo.cargarEstado(sesion.uid) : { ...ESTADO_INICIAL } });
  },
  async entrar(codigo, alias) {
    const sesion = await repo.entrarComoAlumno(codigo, alias);
    const estado = await repo.cargarEstado(sesion.uid);
    await repo.registrarEvento(sesion.uid, 'login');
    set({ sesion, estado });
  },
  async salir() { await repo.salir(); set({ sesion: null, estado: { ...ESTADO_INICIAL } }); },
  async sumaXp(n) {
    const { sesion, estado } = get();
    if (!sesion) return;
    const nuevo = { ...estado, xp: estado.xp + n };
    set({ estado: nuevo });
    await repo.guardarEstado(sesion.uid, nuevo);
  },
}));
