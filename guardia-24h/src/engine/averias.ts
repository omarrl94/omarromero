// Inyector de averías e instrumentos virtuales sobre un circuito monofásico simple (F, N, PE).
// Todo se calcula desde el estado del circuito. La tensión nominal llega por parámetro.
export type Averia = 'ninguna' | 'fase_abierta' | 'neutro_cortado' | 'borna_floja' | 'fuga_tierra' | 'inversion_fn' | 'cortocircuito' | 'tierra_abierta';

export interface CircuitoSim {
  alimentado: boolean; faseAbierta: boolean; neutroAbierto: boolean; tierraAbierta: boolean;
  rContactoOhm: number; fugaMa: number; aislamientoMOhm: number; inversionFN: boolean; cortocircuito: boolean;
}
export const circuitoSano = (): CircuitoSim => ({
  alimentado: true, faseAbierta: false, neutroAbierto: false, tierraAbierta: false,
  rContactoOhm: 0, fugaMa: 0, aislamientoMOhm: 999, inversionFN: false, cortocircuito: false,
});

export function inyecta(base: CircuitoSim, a: Averia): CircuitoSim {
  const c = { ...base };
  switch (a) {
    case 'fase_abierta': c.faseAbierta = true; break;
    case 'neutro_cortado': c.neutroAbierto = true; break;
    case 'borna_floja': c.rContactoOhm = 12; break;
    case 'fuga_tierra': c.fugaMa = 45; c.aislamientoMOhm = 0.08; break;
    case 'inversion_fn': c.inversionFN = true; break;
    case 'cortocircuito': c.cortocircuito = true; break;
    case 'tierra_abierta': c.tierraAbierta = true; break;
  }
  return c;
}

export type Punto = 'F' | 'N' | 'PE';
export interface Lectura { valor: number; unidad: string; texto: string; danio?: boolean }

/** Multímetro en tensión. Solo hay lectura con el circuito alimentado. */
export function mideTension(c: CircuitoSim, a: Punto, b: Punto, tensionV: number): Lectura {
  const par = [a, b].sort().join('-');
  let v = 0;
  if (c.alimentado && !c.cortocircuito) {
    const fase = c.faseAbierta ? 0 : tensionV;
    switch (par) {
      case 'F-N': v = c.neutroAbierto || c.faseAbierta ? 0 : tensionV; break;
      case 'F-PE': v = c.tierraAbierta ? 0 : c.inversionFN ? 0 : fase; break;
      case 'N-PE': v = c.tierraAbierta ? 0 : c.inversionFN ? fase : c.neutroAbierto ? fase : 0; break;
    }
  }
  return { valor: v, unidad: 'V', texto: `${v.toFixed(0)} V` };
}

/** Continuidad: SOLO sin tensión. Medirla con el circuito alimentado daña el equipo y es un error de seguridad grave. */
export function mideContinuidad(c: CircuitoSim, p: Punto): Lectura {
  if (c.alimentado) return { valor: NaN, unidad: 'Ω', texto: 'Equipo dañado: medida de continuidad con tensión', danio: true };
  const abierto = (p === 'F' && c.faseAbierta) || (p === 'N' && c.neutroAbierto) || (p === 'PE' && c.tierraAbierta);
  if (abierto) return { valor: Infinity, unidad: 'Ω', texto: 'OL (circuito abierto)' };
  const r = 0.2 + (p === 'F' ? c.rContactoOhm : 0);
  return { valor: r, unidad: 'Ω', texto: `${r.toFixed(2)} Ω` };
}

export function mideAislamiento(c: CircuitoSim): Lectura {
  if (c.alimentado) return { valor: NaN, unidad: 'MΩ', texto: 'Equipo dañado: aislamiento con tensión', danio: true };
  return { valor: c.aislamientoMOhm, unidad: 'MΩ', texto: `${c.aislamientoMOhm >= 999 ? '>999' : c.aislamientoMOhm} MΩ` };
}

/** Pinza para corriente de fuga (mA). */
export const mideFuga = (c: CircuitoSim): Lectura => ({ valor: c.fugaMa, unidad: 'mA', texto: `${c.fugaMa} mA` });

/** El diferencial de 30 mA dispara si la fuga supera su sensibilidad. */
export const diferencialDispara = (c: CircuitoSim, sensibilidadMa = 30): boolean => c.fugaMa >= sensibilidadMa;
