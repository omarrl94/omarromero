/** Sistemas lineales complejos «a la manera de pizarra»: ecuaciones, reducción, Gauss y Cramer (con determinantes). */
import { C0, add, sub, mul, div, cneg, isZero, nf, rect, par, sumTerms, circ, type C } from './cx';

export const eqLine = (row: C[], names: string[], rhs: C) => `${sumTerms(row.map((c, i) => ({ c, x: names[i] })))} = ${rect(rhs)}`;

export function det(M: C[][]): C {
  const n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return sub(mul(M[0][0], M[1][1]), mul(M[0][1], M[1][0]));
  let s = C0;
  for (let j = 0; j < n; j++) {
    if (isZero(M[0][j])) continue;
    const minor = M.slice(1).map((r) => r.filter((_, k) => k !== j));
    const t = mul(M[0][j], det(minor));
    s = j % 2 === 0 ? add(s, t) : sub(s, t);
  }
  return s;
}
/** Expresión del determinante (2×2 y 3×3 por Sarrus) con los números sustituidos. */
export function detExpr(M: C[][]): string {
  const p = (a: C) => par(a);
  if (M.length === 1) return p(M[0][0]);
  if (M.length === 2) return `${p(M[0][0])}·${p(M[1][1])} − ${p(M[0][1])}·${p(M[1][0])}`;
  if (M.length === 3) {
    const a = M;
    const pos = [[0, 0, 1, 1, 2, 2], [0, 1, 1, 2, 2, 0], [0, 2, 1, 0, 2, 1]].map((q) => `${p(a[q[0]][q[1]])}·${p(a[q[2]][q[3]])}·${p(a[q[4]][q[5]])}`);
    const neg = [[0, 2, 1, 1, 2, 0], [0, 0, 1, 2, 2, 1], [0, 1, 1, 0, 2, 2]].map((q) => `${p(a[q[0]][q[1]])}·${p(a[q[2]][q[3]])}·${p(a[q[4]][q[5]])}`);
    return `${pos.join(' + ')} − ${neg.map((s) => `[${s}]`).join(' − ')}`;
  }
  return '(desarrollo por adjuntos)';
}
export const matLines = (A: C[][], names: string[], z: C[]): string[] => {
  const cells = A.map((r) => r.map((c) => rect(c)));
  const w = Math.max(...cells.flat().map((s) => s.length), 1);
  return A.map((_, i) => `│ ${cells[i].map((s) => s.padStart(w)).join('  ')} │ │ ${names[i].padEnd(3)} │ = │ ${rect(z[i])} │`);
};

export interface Step { que: string; porque?: string; pizarra: string[] }

/** Resolución del sistema A·x = z. Devuelve los pasos y la solución. 1–2 incógnitas: reducción; 3 o más: eliminación de Gauss. */
export function reduccion(A: C[][], z: C[], names: string[], firstEq = 1): { steps: Step[]; x: C[] | null } {
  const n = z.length;
  const steps: Step[] = [];
  const Z = (i: number) => circ(firstEq + i);
  if (n === 1) {
    const x = div(z[0], A[0][0]);
    steps.push({ que: `Despejo ${names[0]}.`, pizarra: [`${names[0]} = ${rect(z[0])} / ${par(A[0][0])} = ${rect(x)}`] });
    return { steps, x: [x] };
  }
  if (n === 2) {
    const [a11, a12, a21, a22] = [A[0][0], A[0][1], A[1][0], A[1][1]];
    const D = sub(mul(a11, a22), mul(a12, a21));
    if (isZero(D)) return { steps, x: null };
    // Eliminar la 2.ª incógnita: ①·a22 − ②·a12
    const e1 = sub(mul(a11, a22), mul(a21, a12)); // = D
    const r1 = sub(mul(z[0], a22), mul(z[1], a12));
    const x1 = div(r1, e1);
    steps.push({
      que: `Elimino ${names[1]}: multiplico ${Z(0)} por ${par(a22)} y ${Z(1)} por ${par(a12)} y las resto.`,
      porque: `Así los coeficientes de ${names[1]} son iguales y desaparece al restar.`,
      pizarra: [
        `${Z(0)}·${par(a22)}:  ${eqLine(A[0].map((c) => mul(c, a22)), names, mul(z[0], a22))}`,
        `${Z(1)}·${par(a12)}:  ${eqLine(A[1].map((c) => mul(c, a12)), names, mul(z[1], a12))}`,
        `Resto:  ${rect(e1)}·${names[0]} = ${rect(r1)}  →  ${names[0]} = ${rect(x1)}`,
      ],
    });
    const x2 = div(sub(z[0], mul(a11, x1)), a12);
    steps.push({
      que: `Sustituyo ${names[0]} en ${Z(0)} y despejo ${names[1]}.`,
      pizarra: [`${par(a11)}·${par(x1)} + ${par(a12)}·${names[1]} = ${rect(z[0])}`, `${names[1]} = (${rect(z[0])} − ${rect(mul(a11, x1))}) / ${par(a12)} = ${rect(x2)}`],
    });
    return { steps, x: [x1, x2] };
  }
  // Gauss
  const M = A.map((r, i) => [...r, z[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col; for (let r = col + 1; r < n; r++) if (Math.hypot(M[r][col].re, M[r][col].im) > Math.hypot(M[piv][col].re, M[piv][col].im)) piv = r;
    if (isZero(M[piv][col])) return { steps, x: null };
    [M[col], M[piv]] = [M[piv], M[col]];
    const lines: string[] = [];
    for (let r = col + 1; r < n; r++) {
      if (isZero(M[r][col])) continue;
      const f = div(M[r][col], M[col][col]);
      M[r] = M[r].map((v, k) => sub(v, mul(f, M[col][k])));
      lines.push(`fila ${r + 1} − (${rect(f)})·fila ${col + 1}:  ${eqLine(M[r].slice(0, n), names, M[r][n])}`);
    }
    if (lines.length) steps.push({ que: `Hago ceros bajo ${names[col]}.`, porque: 'Voy dejando el sistema en escalera para despejar de abajo arriba.', pizarra: lines });
  }
  const x: C[] = new Array(n).fill(C0);
  const back: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n]; for (let j = i + 1; j < n; j++) s = sub(s, mul(M[i][j], x[j]));
    x[i] = div(s, M[i][i]);
    back.push(`${names[i]} = ${rect(x[i])}`);
  }
  steps.push({ que: 'Despejo de abajo arriba (sustitución hacia atrás).', pizarra: back.reverse() });
  return { steps, x };
}

/** Cramer: |A|, |A_k| y cociente. */
export function cramer(A: C[][], z: C[], names: string[]): { steps: Step[]; x: C[] | null } {
  const n = z.length;
  const D = det(A);
  const steps: Step[] = [];
  steps.push({ que: 'Escribo el sistema en forma de matrices:  A · x = b.', pizarra: matLines(A, names, z) });
  steps.push({ que: 'Calculo el determinante del sistema |A|.', porque: 'Si |A| = 0 el sistema no tiene solución única.', pizarra: [`|A| = ${detExpr(A)}`, `|A| = ${rect(D)}`] });
  if (isZero(D)) return { steps, x: null };
  const x: C[] = [];
  names.forEach((nm, k) => {
    const Ak = A.map((r, i) => r.map((c, j) => (j === k ? z[i] : c)));
    const Dk = det(Ak); x.push(div(Dk, D));
    steps.push({ que: `Sustituyo la columna de ${nm} por los términos independientes y calculo |A_${nm}|.`, pizarra: [`|A_${nm}| = ${detExpr(Ak)}`, `|A_${nm}| = ${rect(Dk)}`, `${nm} = |A_${nm}| / |A| = ${rect(Dk)} / ${rect(D)} = ${rect(x[k])}`] });
  });
  void n; void cneg; void nf;
  return { steps, x };
}
