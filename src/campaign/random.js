// Aleatoriedad reproducible para los retos generados (misma semilla ⇒ mismos retos).
export function mulberry32(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle(arr) {
      const a2 = [...arr];
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    },
    pickN(arr, n) { return this.shuffle(arr).slice(0, n); },
  };
}

/** IP de los rangos reservados para documentación (RFC 5737): nunca son reales. */
export function docIp(r) {
  return `${r.pick(['192.0.2', '198.51.100', '203.0.113'])}.${r.int(2, 250)}`;
}

/** Barajar las opciones de una pregunta manteniendo cuál es la correcta. */
export function shuffleQuestion(r, q) {
  const order = r.shuffle(q.options.map((_, i) => i));
  return { ...q, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
}
