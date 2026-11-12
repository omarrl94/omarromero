// Validador del cuadro/circuitos propuestos por el alumno frente a una tabla de referencia.
export interface FilaTabla { pia: number; seccion: number; tubo: number }
export interface Propuesta { circuito: string; pia?: number; seccion?: number; tubo?: number }
export interface Incumplimiento { circuito: string; campo: 'pia' | 'seccion' | 'tubo'; mensaje: string; cita: { doc: string; ref: string } }

export function validaCuadro(props: Propuesta[], tabla: Record<string, FilaTabla>, cita: (c: string) => { doc: string; ref: string }): { incumplimientos: Incumplimiento[]; aciertos: number; total: number } {
  const campos = ['pia', 'seccion', 'tubo'] as const;
  const etiqueta = { pia: 'calibre del PIA', seccion: 'sección del conductor', tubo: 'diámetro del tubo' };
  const unidad = { pia: 'A', seccion: 'mm²', tubo: 'mm' };
  const inc: Incumplimiento[] = [];
  let aciertos = 0;
  for (const p of props) {
    const ref = tabla[p.circuito];
    for (const c of campos) {
      if (!ref) continue;
      if (p[c] === ref[c]) aciertos++;
      else inc.push({ circuito: p.circuito, campo: c, mensaje: `${p.circuito}: ${etiqueta[c]} ${p[c] === undefined ? 'sin elegir' : `${p[c]} ${unidad[c]}`}; el valor de la tabla es ${ref[c]} ${unidad[c]}.`, cita: cita(p.circuito) });
    }
  }
  return { incumplimientos: inc, aciertos, total: props.filter((p) => tabla[p.circuito]).length * campos.length };
}
