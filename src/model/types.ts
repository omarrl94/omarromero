/** Modelo único del circuito. Las vistas (esquema/unifilar/multifilar/real) se derivan de él. */
export type ViewId = 'schematic' | 'unifilar' | 'multifilar' | 'real';

export interface TermRef { comp: string; term: number }

export interface Component {
  id: string;
  type: string; // clave de la biblioteca
  x: number; // posición en la vista activa (rejilla de 20 px). Por vista: ver `pos`
  y: number;
  rot: 0 | 90 | 180 | 270;
  params: Record<string, number | boolean | string>;
  label?: string;
  /** No se dibuja (pero sí se simula): lo usa «Parte de avería» para esconder la avería. */
  hidden?: boolean;
  /** Posición propia en otras vistas (se autogenera si falta). Reservado fases 4-5. */
  pos?: Partial<Record<ViewId, { x: number; y: number; rot: number }>>;
}

export interface Wire {
  id: string;
  a: TermRef;
  b: TermRef;
  // Datos físicos del conductor (usados desde la fase 4/6)
  section?: number; // mm²
  color?: string;
  length?: number; // m
  material?: 'Cu' | 'Al';
  /** Conductor de retorno generado automáticamente al montar en unifilar (no lo dibuja el alumno). */
  auto?: boolean;
}

export interface Project {
  version: number;
  name: string;
  components: Component[];
  wires: Wire[];
  /** Configuración del cuadro eléctrico (vista «Cuadro»). */
  panel?: import('./panel').PanelConfig;
  /** Datos del cajetín del plano. */
  sheet?: { alumno: string; curso: string; titulo: string; escala: string };
}

export const PROJECT_VERSION = 1;
