// Módulo 3 · Estructuras de datos: la bodega, el inventario y los buffers de la nave.
import { check, entry } from './helpers.js';
import { stripComments } from '../core/transpiler.js';
import { dictToObject } from '../core/runtime.js';

const CARGO = [42, 7, 93, 15, 68, 23, 81, 4];

const sortCargo = {
  id: 'm3-sort-cargo',
  module: 3,
  title: 'Ordenar la Bodega',
  codename: 'ARRAY.SORT',
  scene: 'cargo',
  xp: 200,
  mode: 'run',
  story: 'La bodega de carga está desequilibrada: los contenedores pesados flotan arriba y la nave cabecea. Escribe sortCargo para ordenar los pesos de menor a mayor. Cada intercambio que hagas se ve en directo en la bodega.',
  objective: 'Implementa sortCargo(cargo) que ordene el array EN SU SITIO, de menor a mayor, con tu propio algoritmo (sin sort() de la librería).',
  concept: {
    title: 'Arrays, índices y ordenación',
    text: 'Un array guarda elementos contiguos accesibles por índice, de 0 a n-1. Bubble sort compara vecinos (j y j+1) e intercambia los desordenados; tras cada pasada el mayor «burbujea» al final. Acceder a cargo[n] es salirse del array.',
  },
  starter: {
    python: `def sort_cargo(cargo):
    n = len(cargo)
    for i in range(n):
        for j in range(n - i):
            if cargo[j] > cargo[j + 1]:
                cargo[j], cargo[j + 1] = cargo[j + 1], cargo[j]
`,
    java: `public class Main {
    static void sortCargo(int[] cargo) {
        int n = cargo.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - i; j++) {
                if (cargo[j] > cargo[j + 1]) {
                    int tmp = cargo[j];
                    cargo[j] = cargo[j + 1];
                    cargo[j + 1] = tmp;
                }
            }
        }
    }
}
`,
    kotlin: `fun sortCargo(cargo: IntArray) {
    val n = cargo.size
    for (i in 0 until n) {
        for (j in 0 until n - i) {
            if (cargo[j] > cargo[j + 1]) {
                val tmp = cargo[j]
                cargo[j] = cargo[j + 1]
                cargo[j + 1] = tmp
            }
        }
    }
}
`,
    swift: `func sortCargo(_ cargo: inout [Int]) {
    let n = cargo.count
    for i in 0..<n {
        for j in 0..<(n - i) {
            if cargo[j] > cargo[j + 1] {
                cargo.swapAt(j, j + 1)
            }
        }
    }
}
`,
    c: `void sortCargo(int cargo[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i; j++) {
            if (cargo[j] > cargo[j + 1]) {
                int tmp = cargo[j];
                cargo[j] = cargo[j + 1];
                cargo[j + 1] = tmp;
            }
        }
    }
}
`,
  },
  solution: {
    python: `def sort_cargo(cargo):
    n = len(cargo)
    for i in range(n):
        for j in range(n - 1 - i):
            if cargo[j] > cargo[j + 1]:
                cargo[j], cargo[j + 1] = cargo[j + 1], cargo[j]
`,
    java: `public class Main {
    static void sortCargo(int[] cargo) {
        int n = cargo.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - 1 - i; j++) {
                if (cargo[j] > cargo[j + 1]) {
                    int tmp = cargo[j];
                    cargo[j] = cargo[j + 1];
                    cargo[j + 1] = tmp;
                }
            }
        }
    }
}
`,
    kotlin: `fun sortCargo(cargo: IntArray) {
    val n = cargo.size
    for (i in 0 until n) {
        for (j in 0 until n - 1 - i) {
            if (cargo[j] > cargo[j + 1]) {
                val tmp = cargo[j]
                cargo[j] = cargo[j + 1]
                cargo[j + 1] = tmp
            }
        }
    }
}
`,
    swift: `func sortCargo(_ cargo: inout [Int]) {
    let n = cargo.count
    for i in 0..<n {
        for j in 0..<(n - 1 - i) {
            if cargo[j] > cargo[j + 1] {
                cargo.swapAt(j, j + 1)
            }
        }
    }
}
`,
    c: `void sortCargo(int cargo[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (cargo[j] > cargo[j + 1]) {
                int tmp = cargo[j];
                cargo[j] = cargo[j + 1];
                cargo[j + 1] = tmp;
            }
        }
    }
}
`,
  },
  polyglot: {
    python: 'Las listas son dinámicas y el intercambio es idiomático: a[j], a[j+1] = a[j+1], a[j] (desempaquetado de tuplas). Salirse lanza IndexError.',
    java: 'int[] tiene tamaño fijo (cargo.length). Salirse lanza ArrayIndexOutOfBoundsException: la JVM comprueba cada acceso.',
    kotlin: 'IntArray es el int[] de Java sin boxing. cargo.size, rangos con until y la misma excepción al salirse.',
    swift: 'Los arrays son value types: para modificar el del llamador hace falta inout y &. swapAt(i, j) intercambia sin variable temporal.',
    c: 'Un array en C no sabe su tamaño: por eso se pasa n aparte. Leer cargo[n] NO da error: lee memoria ajena (buffer overread). Origen de bugs como Heartbleed.',
  },
  invoke(ctx) {
    const fn = entry(ctx, 'sortCargo');
    const arr = ctx.track([...CARGO], 'cargo');
    const ret = fn(arr, CARGO.length);
    const final = Array.isArray(ret) && ret !== arr ? [...ret] : [...arr];
    return { final, returned: Array.isArray(ret) && ret !== arr };
  },
  evaluate({ result, code, lang }) {
    const out = (result && result.value) || { final: [] };
    const sorted = [...CARGO].sort((a, b) => a - b);
    const final = out.final || [];
    const isSorted = final.length === CARGO.length && final.every((x, i) => x === sorted[i]);
    const src = stripComments(code, lang);
    const builtin = /\.sort\(|sorted\(|Arrays\.sort|qsort\(|\.sorted\b|\.sortWith|\.sortBy/.test(src);
    const writes = result && result.state ? result.state.writes : 0;
    const checks = [
      check('sorted', 'La bodega queda ordenada de menor a mayor', isSorted, final.length ? `Resultado: [${final.join(', ')}]` : ''),
      check('inplace', 'Ordena en el sitio (modifica el array recibido)', isSorted && !out.returned && writes > 0),
      check('own', 'Algoritmo propio (sin sort de la librería)', !builtin, builtin ? 'Has usado la ordenación de la librería: aquí la gracia es construirla tú.' : ''),
    ];
    const events = result && result.state ? result.state.events.filter((e) => e.label === 'cargo') : [];
    return { checks, scene: { initial: CARGO, events, final } };
  },
  duck: {
    sorted: [
      'Cuando j vale el último índice del bucle interno, ¿a qué posición accede cargo[j + 1]?',
      'Si el array tiene 8 elementos, ¿cuál es el índice más alto válido?',
      'Tras la primera pasada, ¿dónde queda el elemento más grande? ¿Hace falta volver a compararlo?',
    ],
    inplace: ['¿Estás modificando el array que te pasan o creando uno nuevo?'],
    own: ['¿Qué hace exactamente la función de ordenación de la librería por dentro? Intenta reproducir esa idea con dos bucles.'],
  },
};

const PICKUPS = ['ore', 'fuel', 'ore', 'chip', 'ore', 'fuel', 'chip', 'ore'];
const CODES = { ore: 0, fuel: 1, chip: 2 };

const inventory = {
  id: 'm3-inventory',
  module: 3,
  title: 'Inventario Cuántico',
  codename: 'HASHMAP.LOOT',
  scene: 'inventory',
  xp: 200,
  mode: 'run',
  story: 'Tras la batalla, el rayo tractor recoge 8 objetos. El inventario debe contar cuántos hay de cada tipo, pero el código actual sobrescribe el contador en lugar de incrementarlo: todo marca 1.',
  objective: 'countItems(pickups) debe devolver un diccionario {objeto: cantidad}. En C no hay diccionarios: rellena counts[código] usando el código numérico de cada objeto.',
  concept: {
    title: 'Diccionarios (mapas hash)',
    text: 'Un diccionario asocia claves con valores y encuentra una clave en tiempo constante, O(1), gracias a una función hash. Patrón «contador»: si la clave no existe, empieza en 0; después suma 1.',
  },
  starter: {
    python: `def count_items(pickups):
    counts = {}
    for item in pickups:
        counts[item] = 1   # ⚠ sobrescribe en lugar de contar
    return counts
`,
    java: `import java.util.*;

public class Main {
    static Map<String, Integer> countItems(String[] pickups) {
        Map<String, Integer> counts = new HashMap<>();
        for (String item : pickups) {
            counts.put(item, 1); // ⚠ sobrescribe en lugar de contar
        }
        return counts;
    }
}
`,
    kotlin: `fun countItems(pickups: List<String>): Map<String, Int> {
    val counts = mutableMapOf<String, Int>()
    for (item in pickups) {
        counts[item] = 1 // ⚠ sobrescribe en lugar de contar
    }
    return counts
}
`,
    swift: `func countItems(_ pickups: [String]) -> [String: Int] {
    var counts: [String: Int] = [:]
    for item in pickups {
        counts[item] = 1 // ⚠ sobrescribe en lugar de contar
    }
    return counts
}
`,
    c: `// Códigos: 0 = ore, 1 = fuel, 2 = chip
// counts llega inicializado a cero y tiene 3 posiciones.
void countItems(const int *ids, int n, int counts[]) {
    for (int i = 0; i < n; i++) {
        counts[ids[i]] = 1; // ⚠ sobrescribe en lugar de contar
    }
}
`,
  },
  solution: {
    python: `def count_items(pickups):
    counts = {}
    for item in pickups:
        counts[item] = counts.get(item, 0) + 1
    return counts
`,
    java: `import java.util.*;

public class Main {
    static Map<String, Integer> countItems(String[] pickups) {
        Map<String, Integer> counts = new HashMap<>();
        for (String item : pickups) {
            counts.put(item, counts.getOrDefault(item, 0) + 1);
        }
        return counts;
    }
}
`,
    kotlin: `fun countItems(pickups: List<String>): Map<String, Int> {
    val counts = mutableMapOf<String, Int>()
    for (item in pickups) {
        counts[item] = (counts[item] ?: 0) + 1
    }
    return counts
}
`,
    swift: `func countItems(_ pickups: [String]) -> [String: Int] {
    var counts: [String: Int] = [:]
    for item in pickups {
        counts[item, default: 0] += 1
    }
    return counts
}
`,
    c: `void countItems(const int *ids, int n, int counts[]) {
    for (int i = 0; i < n; i++) {
        counts[ids[i]]++;
    }
}
`,
  },
  polyglot: {
    python: 'dict es nativo: counts.get(k, 0) evita el KeyError. Para producción existe collections.Counter, que hace exactamente esto.',
    java: 'HashMap<String, Integer> usa objetos (Integer, no int). getOrDefault o merge(item, 1, Integer::sum) resuelven el contador.',
    kotlin: 'mutableMapOf + operador Elvis (?:) para el valor por defecto. En una línea: pickups.groupingBy { it }.eachCount().',
    swift: 'Los diccionarios devuelven opcionales; el subíndice con default: hace el contador idiomático: counts[item, default: 0] += 1.',
    c: 'C no trae diccionarios. Si las claves son enteros pequeños, un array indexado por código ES una tabla hash perfecta: O(1) y sin colisiones.',
  },
  invoke(ctx) {
    const fn = entry(ctx, 'countItems');
    if (ctx.lang === 'c') {
      const ids = ctx.track(PICKUPS.map((p) => CODES[p]), 'ids');
      const counts = ctx.track([0, 0, 0], 'counts');
      fn(ids, ids.length, counts);
      return { ore: counts[0], fuel: counts[1], chip: counts[2] };
    }
    const res = fn(ctx.track([...PICKUPS], 'pickups'));
    return dictToObject(res);
  },
  evaluate({ result }) {
    const counts = (result && result.value) || {};
    const ok = counts.ore === 4 && counts.fuel === 2 && counts.chip === 2;
    const checks = [
      check('returns', 'countItems devuelve el inventario', result && result.value && Object.keys(counts).length > 0),
      check('ore', 'ore = 4', counts.ore === 4, `ore = ${counts.ore ?? '—'}`),
      check('fuel-chip', 'fuel = 2 y chip = 2', counts.fuel === 2 && counts.chip === 2, `fuel = ${counts.fuel ?? '—'}, chip = ${counts.chip ?? '—'}`),
    ];
    return { checks, scene: { pickups: PICKUPS, counts, ok } };
  },
  duck: {
    ore: [
      'Cuando aparece «ore» por segunda vez, ¿qué valor tenía su contador y qué valor le pones?',
      '¿Cómo podrías leer el valor actual de una clave antes de actualizarla?',
      'Si la clave todavía no existe, ¿qué valor debería tener al leerla?',
    ],
    'fuel-chip': ['¿Tu contador suma o reemplaza?'],
    returns: ['¿Tu función devuelve el diccionario al final?'],
  },
};

export default [sortCargo, inventory];
