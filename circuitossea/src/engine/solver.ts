/**
 * Resolución de sistemas lineales A·x = z por eliminación gaussiana con
 * pivote parcial. Módulo puro (sin DOM). Devuelve null si la matriz es singular.
 */
export function solveLinear(A: number[][], z: number[]): number[] | null {
  const n = z.length;
  // Matriz aumentada (copia: no modificamos la entrada)
  const M = A.map((row, i) => [...row, z[i]]);
  let scale = 0;
  for (const row of A) for (const v of row) scale = Math.max(scale, Math.abs(v));
  const tol = Math.max(scale, 1) * 1e-13;

  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < tol) return null;
    if (piv !== col) [M[piv], M[col]] = [M[col], M[piv]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c];
    x[i] = s / M[i][i];
  }
  return x;
}
