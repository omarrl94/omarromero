// Paquete de lenguaje: Rust 🦀
// Añade a cada misión su versión en Rust (código inicial con bug didáctico,
// solución de referencia, nota políglota) y a cada lección sus ejemplos.
// Rust no tiene herencia (traits) ni recolector de basura (ownership + borrow checker):
// las misiones de POO y sistemas lo aprovechan para enseñar esas ideas.

export const RUST_MISSIONS = {
  'm1-world-laws': {
    starter: `fn main() {
    // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
    let gravity: i32 = 9.81;
    let ship_mass: i32 = 1200;
    let shields_on: bool = true;
    // TODO: declara pilot_name (&str) con tu nombre de piloto
}
`,
    solution: `fn main() {
    let gravity: f64 = 9.81;
    let ship_mass: i32 = 1200;
    let shields_on: bool = true;
    let pilot_name: &str = "Nova";
}
`,
    polyglot: 'Tipos con nombre que dicen su tamaño: i32 (entero de 32 bits), f64 (decimal de 64), bool y &str (texto). Nada de conversiones implícitas: 9.81 en un i32 no compila. Y let crea variables INMUTABLES: para cambiarlas hace falta let mut.',
  },
  'm1-reactor': {
    starter: `fn main() {
    let engines: i32 = 4;
    let thrust_per_engine: i32 = 750_000_000;
    let total_thrust = engines * thrust_per_engine;
    println!("Empuje total: {}", total_thrust);
}
`,
    solution: `fn main() {
    let engines: i32 = 4;
    let thrust_per_engine: i32 = 750_000_000;
    let total_thrust: i64 = engines as i64 * thrust_per_engine as i64;
    println!("Empuje total: {}", total_thrust);
}
`,
    polyglot: 'En modo debug, Rust detiene el programa (panic) al desbordar; en release da la vuelta. Para elegir a propósito existen checked_mul, wrapping_mul y saturating_mul. Convertir es siempre explícito: x as i64.',
  },
  'm2-patrol': {
    starter: `fn main() {
    // waypoint(x, y) añade una baliza a la ruta del dron.
    for i in 0..=6 {
        waypoint(80 + i * 100, 120);
    }
}
`,
    solution: `fn main() {
    for i in 0..6 {
        waypoint(80 + i * 100, 120);
    }
}
`,
    polyglot: 'Rangos como en matemáticas: 0..6 excluye el final (6 vueltas) y 0..=6 lo incluye (7). El = te avisa a la vista de que el último cuenta.',
  },
  'm2-zigzag': {
    starter: `fn main() {
    for i in 0..8 {
        let x = 40 + i * 80;
        let y = 80; // TODO: alterna arriba (pares) y abajo (impares)
        waypoint(x, y);
    }
}
`,
    solution: `fn main() {
    for i in 0..8 {
        let x = 40 + i * 80;
        let mut y = 80;
        if i % 2 == 1 {
            y = 280;
        }
        waypoint(x, y);
    }
}
`,
    polyglot: 'if es una expresión que devuelve valor: let y = if i % 2 == 0 { 80 } else { 280 }; Para reasignar una variable hay que declararla con let mut.',
  },
  'm3-sort-cargo': {
    starter: `fn sort_cargo(cargo: &mut Vec<i32>) {
    let n = cargo.len();
    for i in 0..n {
        for j in 0..n - i {
            if cargo[j] > cargo[j + 1] {
                cargo.swap(j, j + 1);
            }
        }
    }
}
`,
    solution: `fn sort_cargo(cargo: &mut Vec<i32>) {
    let n = cargo.len();
    for i in 0..n {
        for j in 0..n - 1 - i {
            if cargo[j] > cargo[j + 1] {
                cargo.swap(j, j + 1);
            }
        }
    }
}
`,
    polyglot: '&mut Vec<i32> es un préstamo mutable: la función puede modificar el vector sin quedárselo. Salirse del índice provoca un panic controlado («index out of bounds»), nunca una lectura de memoria ajena como en C.',
  },
  'm3-inventory': {
    starter: `use std::collections::HashMap;

fn count_items(pickups: &[&str]) -> HashMap<String, i32> {
    let mut counts = HashMap::new();
    for item in pickups {
        counts.insert(item.to_string(), 1); // ⚠ sobrescribe en lugar de contar
    }
    counts
}
`,
    solution: `use std::collections::HashMap;

fn count_items(pickups: &[&str]) -> HashMap<String, i32> {
    let mut counts = HashMap::new();
    for item in pickups {
        *counts.entry(item.to_string()).or_insert(0) += 1;
    }
    counts
}
`,
    polyglot: 'La Entry API es el contador idiomático: entry(k).or_insert(0) devuelve una referencia al valor (creándolo a 0 si no existe) y * la desreferencia para sumar. La función devuelve counts sin return: la última expresión es el resultado.',
  },
  'm4-entities': {
    starter: `// Rust no tiene herencia: un trait define lo que toda entidad sabe hacer.
trait Entity {
    fn update(&mut self);
}

struct Player {
    x: f64,
    y: f64,
}

impl Entity for Player {
    fn update(&mut self) {
        self.x += 2.0;
    }
}

// TODO: struct Enemy que patrulle en vertical (self.y += ...)
// TODO: struct Obstacle que no se mueva
`,
    solution: `trait Entity {
    fn update(&mut self) {}
}

struct Player {
    x: f64,
    y: f64,
}

impl Entity for Player {
    fn update(&mut self) {
        self.x += 2.0;
    }
}

struct Enemy {
    x: f64,
    y: f64,
}

impl Entity for Enemy {
    fn update(&mut self) {
        self.y += 3.0;
    }
}

struct Obstacle {
    x: f64,
    y: f64,
}

impl Entity for Obstacle {}
`,
    polyglot: 'Composición en lugar de herencia: los datos van en structs y el comportamiento compartido en traits. Un método con cuerpo en el trait es la implementación por defecto. El motor guarda Vec<Box<dyn Entity>> y llama a update() en todos: polimorfismo sin clases.',
  },
  'm5-systems': {
    starter: `use std::thread;
use std::time::Duration;

fn scan(sector: i32) -> i32 {
    thread::sleep(Duration::from_secs(1)); // el sensor tarda 1 s
    sector * 10
}

fn main() {
    let mut total = 0;
    for sector in 0..3 {
        let handle = thread::spawn(move || {
            total += scan(sector); // ⚠ ¿compartir una variable mutable entre hilos?
        });
        handle.join().unwrap(); // ⚠ espera a cada hilo antes de lanzar el siguiente
    }
    println!("Minerales: {}", total);
}
`,
    solution: `use std::thread;
use std::time::Duration;

fn scan(sector: i32) -> i32 {
    thread::sleep(Duration::from_secs(1));
    sector * 10
}

fn main() {
    let handles: Vec<_> = (0..3)
        .map(|sector| thread::spawn(move || scan(sector)))
        .collect();
    let total: i32 = handles.into_iter().map(|h| h.join().unwrap()).sum();
    println!("Minerales: {}", total);
}
`,
    polyglot: '«Fearless concurrency»: el compilador NO deja compilar una carrera de datos. Para compartir estado mutable entre hilos hace falta Arc<Mutex<T>>; lo más limpio es que cada hilo devuelva su valor y recogerlo con join().',
  },
  'boss-swarm': {
    starter: `fn has_duplicate(ids: &[i32]) -> bool {
    let n = ids.len();
    for i in 0..n {
        for j in i + 1..n {
            if ids[i] == ids[j] {
                return true;
            }
        }
    }
    false
}
`,
    solution: `use std::collections::HashSet;

fn has_duplicate(ids: &[i32]) -> bool {
    let mut seen = HashSet::new();
    for &x in ids {
        if !seen.insert(x) {
            return true;
        }
    }
    false
}
`,
    polyglot: 'HashSet::insert devuelve false si el valor ya estaba: detección de clones en una llamada. En una línea: ids.iter().collect::<HashSet<_>>().len() != ids.len().',
  },
};

/** Ejemplos de Rust para las lecciones, indexados por el título del paso. */
export const RUST_LESSON_CODE = {
  'Una variable es una caja con nombre': 'let gravity = 9.81;\nprintln!("{}", gravity); // 9.81',
  'Cada caja tiene un tipo': 'let ship_mass: i32 = 1200;       // entero\nlet gravity: f64 = 9.81;         // decimal\nlet shields_on: bool = true;     // sí / no\nlet pilot_name: &str = "Nova";   // texto',
  'Cajas más grandes para números más grandes': 'let pequeno: i32 = 2_147_483_647;   // máximo de i32\nlet grande: i64 = 3_000_000_000;    // i64: 64 bits',
  'La trampa: convierte ANTES de multiplicar': 'let a: i32 = 4;\nlet b: i32 = 750_000_000;\n// let mal: i64 = a * b;          ❌ no compila: tipos distintos\nlet bien: i64 = a as i64 * b as i64; // ✅ 3000000000',
  'Un bucle repite un trozo de código': 'for i in 0..3 {\n    println!("{}", i);\n}\n// 0, 1, 2',
  '¿El último número entra o no?': '0..6     // 0..5  → 6 vueltas ✅\n0..=6    // 0..6  → 7 vueltas (el = incluye el 6)',
  'if: el programa toma decisiones': 'if fuel > 50 {\n    println!("Vamos");\n} else {\n    println!("Repostar");\n}',
  'El operador % (resto) distingue pares e impares': 'println!("{}", 6 % 2); // 0 → par\nprintln!("{}", 7 % 2); // 1 → impar',
  'Un array es una fila de cajas numeradas': 'let cargo = vec![42, 7, 93];\ncargo[0]      // 42 (el primero)\ncargo[2]      // 93 (el último)\ncargo.len()   // 3',
  'Intercambiar dos cajas': 'cargo.swap(0, 1);   // Rust trae un atajo',
  'Un diccionario relaciona etiquetas con valores': 'use std::collections::HashMap;\nlet mut counts = HashMap::new();\ncounts.insert("ore", 3);\ncounts["ore"]   // 3',
  'El patrón «contador»': 'for color in colores {\n    *votos.entry(color).or_insert(0) += 1;\n}',
  'Una clase es un molde': '// En Rust los datos van en un struct\nstruct Nave {\n    x: f64,\n    y: f64,\n}\nlet nave = Nave { x: 10.0, y: 20.0 };',
  'Herencia: «es un tipo de»': '// Rust no tiene herencia: usa traits (contratos)\ntrait Entity {\n    fn update(&mut self) {}   // comportamiento por defecto\n}\nstruct Enemy { x: f64, y: f64 }\nimpl Entity for Enemy {}     // Enemy cumple el contrato',
  'Sobrescribir: cada uno a su manera': 'impl Entity for Enemy {\n    fn update(&mut self) {\n        self.y += 3.0;   // su propia versión\n    }\n}',
  'Cómo se lanzan tareas en tu lenguaje': 'let hilos: Vec<_> = (0..3)\n    .map(|i| thread::spawn(move || tarea(i)))   // lanzar\n    .collect();\nlet total: i32 = hilos.into_iter().map(|h| h.join().unwrap()).sum(); // esperar',
  'Cuidado con compartir una variable': '// Rust ni siquiera compila una carrera de datos.\n// Devuelve valores desde cada hilo, o comparte con:\nlet total = Arc::new(Mutex::new(0));',
  'Contar el trabajo que hace tu código': null,
  'Un conjunto recuerda lo que ya viste': 'use std::collections::HashSet;\nlet mut vistos = HashSet::new();\nvistos.insert(5);\nvistos.contains(&5)   // true, al instante',
};

/** Pasos que se muestran también en Rust aunque estuvieran limitados a otros lenguajes. */
export const RUST_EXTRA_LANGS = ['La trampa: convierte ANTES de multiplicar', 'Un diccionario relaciona etiquetas con valores', 'Esperar uno a uno o todos a la vez', 'Cómo se lanzan tareas en tu lenguaje', 'Cuidado con compartir una variable'];

/** Pasos exclusivos de Rust (se insertan tras el índice indicado). */
export const RUST_EXTRA_STEPS = {
  'm1-world-laws': {
    after: 1,
    step: {
      title: 'En Rust, las cajas vienen cerradas',
      text: 'Rust tiene una regla que sorprende: las variables son inmutables por defecto. Si quieres poder cambiar su valor después, tienes que decirlo con let mut. Así el compilador sabe qué puede cambiar y qué no, y evita errores.',
      visual: 'boxes',
      code: { rust: 'let vidas = 3;\n// vidas = 2;        ❌ error E0384: es inmutable\nlet mut escudo = 100;\nescudo = 80;        // ✅ con mut sí se puede' },
    },
  },
  'm5-systems': {
    after: 1,
    step: {
      title: 'El borrow checker: Rust vigila la memoria por ti',
      text: 'Rust no usa malloc/free ni recolector de basura. Cada valor tiene un único dueño; cuando el dueño desaparece, la memoria se libera sola. Puedes prestar el valor (&), pero el compilador comprueba que nadie lo use mal. Así evita, antes de ejecutar, los errores que en C solo descubres cuando ya ha explotado.',
      visual: 'borrow',
      code: { rust: 'let a = vec![1, 2, 3];\nlet b = a;          // el vector se MUEVE a b\n// println!("{:?}", a);  ❌ a ya no es dueño\nlet c = &b;         // préstamo: b sigue siendo el dueño\nprintln!("{:?}", c); // ✅' },
    },
  },
};

export const RUST_MISSION_TEXT = {
  'm1-world-laws': 'gravity está declarada como i32 (entero) y no puede guardar 9.81. Cambia i32 por f64. Luego, donde está el TODO, añade let pilot_name: &str = "tu nombre";',
  'm1-reactor': 'Multiplicar dos i32 da un i32 y 3.000 millones no cabe: Rust se detiene con un panic. Declara let total_thrust: i64 y convierte cada operando: engines as i64 * thrust_per_engine as i64.',
  'm2-patrol': '0..=6 incluye el 6 (7 vueltas) y la séptima baliza se sale de la zona. Usa 0..6.',
  'm2-zigzag': 'Cambia let y = 80; por let mut y = 80; (mut permite cambiarla) y añade: if i % 2 == 1 { y = 280; }',
  'm3-sort-cargo': '0..n - i deja que cargo[j + 1] se salga del vector. Usa 0..n - 1 - i.',
  'm3-inventory': 'counts.insert(item, 1) reemplaza el valor. Usa la Entry API para sumar: *counts.entry(item.to_string()).or_insert(0) += 1;',
  'm4-entities': 'Da a update() del trait un cuerpo vacío por defecto: fn update(&mut self) {}. Después crea struct Enemy y struct Obstacle (con x e y). Implementa el trait: impl Entity for Enemy con update que haga self.y += 3.0, e impl Entity for Obstacle {} vacío.',
  'm5-systems': 'El join dentro del bucle espera a cada hilo, y compartir total entre hilos no compila. Lanza los hilos con (0..3).map(|sector| thread::spawn(move || scan(sector))).collect() y suma los resultados de join() al final.',
  'boss-swarm': 'Crea let mut seen = HashSet::new(); recorre una sola vez con for &x in ids y, si seen.insert(x) devuelve false, return true. Al final, false.',
};
