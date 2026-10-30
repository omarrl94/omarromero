// Boss Fight · El Enjambre O(n²): refactoriza para vencer midiendo la complejidad real.
import { check, entry } from './helpers.js';
import { fitComplexity } from '../core/runtime.js';

const SIZES = [200, 400, 800, 1600];
const CASES = [
  { ids: [3, 1, 4, 1, 5], expect: true },
  { ids: [9, 8, 7, 6], expect: false },
  { ids: [], expect: false },
  { ids: [42, 42], expect: true },
  { ids: [5, 17, 3, 99, 21, 64, 3], expect: true },
];

/** Permutación pseudoaleatoria determinista (sin duplicados: el peor caso). */
const uniqueIds = (n) => {
  const a = Array.from({ length: n }, (_, i) => i * 3 + 1);
  let seed = n;
  for (let i = n - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const boss = {
  id: 'boss-swarm',
  module: 6,
  title: 'El Enjambre O(n²)',
  codename: 'BOSS.BIG-O',
  scene: 'boss',
  xp: 500,
  mode: 'run',
  boss: true,
  maxTicks: 6e6,
  story: 'La Reina del Enjambre despliega 1600 drones con identificadores. Tu radar debe detectar si alguno está clonado (ID repetido) cada frame. El código heredado compara todos contra todos: O(n²). Con 1600 drones son ~1,3 millones de comparaciones por frame: la simulación va a cámara lenta y el enjambre te arrolla. Refactoriza.',
  objective: 'hasDuplicate(ids) devuelve true si hay algún ID repetido. Debe ser correcto y escalar como O(n) u O(n log n): el motor mide las operaciones reales con 200, 400, 800 y 1600 drones.',
  concept: {
    title: 'Notación Big O',
    text: 'Big O describe cómo crece el trabajo cuando crece la entrada. Dos bucles anidados sobre n elementos = n² operaciones: duplicar n cuadruplica el tiempo. Un conjunto hash responde «¿ya lo he visto?» en O(1), así que un solo recorrido basta: O(n). Ordenar primero y comparar vecinos cuesta O(n log n).',
  },
  starter: {
    python: `def has_duplicate(ids):
    n = len(ids)
    for i in range(n):
        for j in range(i + 1, n):
            if ids[i] == ids[j]:
                return True
    return False
`,
    java: `public class Main {
    static boolean hasDuplicate(int[] ids) {
        int n = ids.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (ids[i] == ids[j]) {
                    return true;
                }
            }
        }
        return false;
    }
}
`,
    kotlin: `fun hasDuplicate(ids: IntArray): Boolean {
    val n = ids.size
    for (i in 0 until n) {
        for (j in i + 1 until n) {
            if (ids[i] == ids[j]) {
                return true
            }
        }
    }
    return false
}
`,
    swift: `func hasDuplicate(_ ids: [Int]) -> Bool {
    let n = ids.count
    for i in 0..<n {
        for j in (i + 1)..<n {
            if ids[i] == ids[j] {
                return true
            }
        }
    }
    return false
}
`,
    c: `#include <stdbool.h>

// Los IDs siempre están entre 0 y 9999.
bool hasDuplicate(const int *ids, int n) {
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (ids[i] == ids[j]) {
                return true;
            }
        }
    }
    return false;
}
`,
  },
  solution: {
    python: `def has_duplicate(ids):
    seen = set()
    for x in ids:
        if x in seen:
            return True
        seen.add(x)
    return False
`,
    java: `import java.util.*;

public class Main {
    static boolean hasDuplicate(int[] ids) {
        Set<Integer> seen = new HashSet<>();
        for (int x : ids) {
            if (!seen.add(x)) {
                return true;
            }
        }
        return false;
    }
}
`,
    kotlin: `fun hasDuplicate(ids: IntArray): Boolean {
    val seen = mutableSetOf<Int>()
    for (x in ids) {
        if (!seen.add(x)) {
            return true
        }
    }
    return false
}
`,
    swift: `func hasDuplicate(_ ids: [Int]) -> Bool {
    var seen = Set<Int>()
    for x in ids {
        if seen.contains(x) {
            return true
        }
        seen.insert(x)
    }
    return false
}
`,
    c: `#include <stdbool.h>

bool hasDuplicate(const int *ids, int n) {
    bool seen[10000] = {false};
    for (int i = 0; i < n; i++) {
        if (seen[ids[i]]) {
            return true;
        }
        seen[ids[i]] = true;
    }
    return false;
}
`,
  },
  polyglot: {
    python: 'set() es una tabla hash: «x in seen» es O(1) de media. Ojo: «x in lista» es O(n) y esconde un bucle; el motor también lo cuenta.',
    java: 'HashSet<Integer>.add() devuelve false si el elemento ya estaba: detección de duplicados en una sola llamada. Con streams: ids.length != Arrays.stream(ids).distinct().count().',
    kotlin: 'mutableSetOf() es un LinkedHashSet. add() devuelve Boolean como en Java. Idiomático: ids.size != ids.toSet().size.',
    swift: 'Set<Int> exige que el tipo sea Hashable. insert devuelve una tupla (inserted, memberAfterInsert). Alternativa: Set(ids).count != ids.count.',
    c: 'Sin colecciones estándar: si el rango de valores es pequeño, un array de booleanos indexado por ID es un «set» perfecto en O(1). Si no, qsort + vecinos, O(n log n).',
  },
  invoke(ctx) {
    const fn = entry(ctx, 'hasDuplicate');
    const correctness = CASES.map((c) => {
      const arr = [...c.ids];
      const got = fn(arr, arr.length);
      return { ...c, got: !!got };
    });
    const samples = [];
    for (const n of SIZES) {
      const ids = uniqueIds(n);
      ctx.resetTicks();
      const got = fn(ids, n);
      samples.push({ n, ops: Math.max(1, ctx.ticks()), got: !!got });
    }
    return { correctness, samples };
  },
  evaluate({ result }) {
    const val = (result && result.value) || { correctness: [], samples: [] };
    const correct = val.correctness.length > 0 && val.correctness.every((c) => c.got === c.expect) && val.samples.every((s) => s.got === false);
    const fit = fitComplexity(val.samples);
    const fast = ['o1', 'n', 'nlogn'].includes(fit.cls);
    const checks = [
      check('correct', 'Detecta clones correctamente (5 casos + peor caso)', correct,
        val.correctness.filter((c) => c.got !== c.expect).map((c) => `[${c.ids.join(', ')}] → ${c.got}`).join(' · ')),
      check('complexity', 'Complejidad ≤ O(n log n)', correct && fast, val.samples.length ? `Medido: ${fit.label} (pendiente ${fit.slope.toFixed(2)})` : ''),
    ];
    return { checks, scene: { samples: val.samples, fit, correct } };
  },
  duck: {
    complexity: [
      'Cuando duplicas el número de drones, ¿cuántas comparaciones más hace tu código?',
      'Para cada dron, ¿realmente necesitas compararlo con TODOS los demás?',
      'Si fueras apuntando en una libreta cada ID que ya has visto, ¿qué estructura de datos te permitiría consultarla al instante?',
    ],
    correct: ['Prueba a mano con [3, 1, 4, 1, 5]: ¿en qué momento debería tu función darse cuenta del clon?', '¿Qué devuelves con una lista vacía?'],
  },
};

export default [boss];
