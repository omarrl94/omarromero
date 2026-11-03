// Paquete de lenguaje: Go
// Sencillez deliberada: pocas palabras clave, := para declarar, sin clases
// (structs + métodos + interfaces implícitas) y concurrencia con goroutines y canales.

const missions = {
  'm1-world-laws': {
    starter: `package main

import "fmt"

func main() {
    // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
    var gravity int = 9.81
    var shipMass int = 1200
    var shieldsOn bool = true
    // TODO: declara pilotName (string) con tu nombre de piloto y úsala en el Println
    fmt.Println(gravity, shipMass, shieldsOn)
}
`,
    solution: `package main

import "fmt"

func main() {
    var gravity float64 = 9.81
    var shipMass int = 1200
    var shieldsOn bool = true
    var pilotName string = "Nova"
    fmt.Println(gravity, shipMass, shieldsOn, pilotName)
}
`,
    polyglot: 'Go es estricto y explícito: un int no acepta 9.81 y no hay conversiones automáticas. Además, declarar una variable y no usarla es un error de compilación, no un aviso: Go no quiere código muerto.',
  },
  'm1-reactor': {
    starter: `package main

import "fmt"

func main() {
    var engines int32 = 4
    var thrustPerEngine int32 = 750_000_000
    totalThrust := engines * thrustPerEngine
    fmt.Println("Empuje total:", totalThrust)
}
`,
    solution: `package main

import "fmt"

func main() {
    var engines int32 = 4
    var thrustPerEngine int32 = 750_000_000
    totalThrust := int64(engines) * int64(thrustPerEngine)
    fmt.Println("Empuje total:", totalThrust)
}
`,
    polyglot: 'En Go, int ocupa 64 bits en los ordenadores actuales, pero int32 sigue existiendo para ahorrar memoria. El desbordamiento da la vuelta sin avisar. Mezclar int32 con int64 no compila: siempre conviertes tú, con int64(x).',
  },
  'm2-patrol': {
    starter: `package main

func main() {
    // waypoint(x, y) añade una baliza a la ruta del dron.
    for i := 0; i <= 6; i++ {
        waypoint(80+i*100, 120)
    }
}
`,
    solution: `package main

func main() {
    for i := 0; i < 6; i++ {
        waypoint(80+i*100, 120)
    }
}
`,
    polyglot: 'Go solo tiene un bucle: for. Con tres partes es el for clásico, con una condición es un while y sin nada es un bucle infinito. Desde Go 1.22 también vale for i := range 6.',
  },
  'm2-zigzag': {
    starter: `package main

func main() {
    for i := 0; i < 8; i++ {
        x := 40 + i*80
        y := 80 // TODO: alterna arriba (pares) y abajo (impares)
        waypoint(x, y)
    }
}
`,
    solution: `package main

func main() {
    for i := 0; i < 8; i++ {
        x := 40 + i*80
        y := 80
        if i%2 == 1 {
            y = 280
        }
        waypoint(x, y)
    }
}
`,
    polyglot: 'if va sin paréntesis y con llaves obligatorias. Go no tiene operador ternario a propósito: prefiere un if de tres líneas que se lee sin pensar.',
  },
  'm3-sort-cargo': {
    starter: `package main

func sortCargo(cargo []int) {
    n := len(cargo)
    for i := 0; i < n; i++ {
        for j := 0; j < n-i; j++ {
            if cargo[j] > cargo[j+1] {
                cargo[j], cargo[j+1] = cargo[j+1], cargo[j]
            }
        }
    }
}
`,
    solution: `package main

func sortCargo(cargo []int) {
    n := len(cargo)
    for i := 0; i < n; i++ {
        for j := 0; j < n-1-i; j++ {
            if cargo[j] > cargo[j+1] {
                cargo[j], cargo[j+1] = cargo[j+1], cargo[j]
            }
        }
    }
}
`,
    polyglot: '[]int es un slice: una ventana sobre un array. Al pasarlo a una función no se copian los datos, así que sortCargo ordena el original. Salirse del índice provoca un panic: el programa se detiene en vez de leer memoria ajena.',
  },
  'm3-inventory': {
    starter: `package main

func countItems(pickups []string) map[string]int {
    counts := make(map[string]int)
    for _, item := range pickups {
        counts[item] = 1 // ⚠ sobrescribe en lugar de contar
    }
    return counts
}
`,
    solution: `package main

func countItems(pickups []string) map[string]int {
    counts := make(map[string]int)
    for _, item := range pickups {
        counts[item]++
    }
    return counts
}
`,
    polyglot: 'Leer una clave que no existe en un map de Go devuelve el «valor cero» del tipo (0 para int), así que counts[item]++ funciona sin comprobar nada. range devuelve índice y valor; _ descarta el que no necesitas.',
  },
  'm4-entities': {
    starter: `package main

// Go no tiene clases ni herencia: structs con métodos e interfaces.
type Entity interface {
    Update()
}

type Player struct {
    x, y float64
}

// ⚠ receptor por valor (p Player): ¿se guarda el cambio de x?
func (p Player) Update() {
    p.x += 2
}

// TODO: type Enemy struct con un Update() que patrulle en vertical (e.y += ...)
// TODO: type Obstacle struct con un Update() vacío
`,
    solution: `package main

type Entity interface {
    Update()
}

type Player struct {
    x, y float64
}

func (p *Player) Update() {
    p.x += 2
}

type Enemy struct {
    x, y float64
}

func (e *Enemy) Update() {
    e.y += 3
}

type Obstacle struct {
    x, y float64
}

func (o *Obstacle) Update() {}
`,
    polyglot: 'Las interfaces de Go se cumplen solas: si un tipo tiene un método Update(), ya es una Entity, sin escribir «implements». Y un método que cambia el struct necesita receptor puntero (*Player); con receptor por valor trabaja sobre una copia.',
  },
  'm5-systems': {
    starter: `package main

import (
    "fmt"
    "time"
)

func scan(sector int) int {
    time.Sleep(time.Second) // el sensor tarda 1 s
    return sector * 10
}

func main() {
    total := 0
    for sector := 0; sector < 3; sector++ {
        total += scan(sector) // ⚠ una detrás de otra
    }
    fmt.Println("Minerales:", total)
}
`,
    solution: `package main

import (
    "fmt"
    "time"
)

func scan(sector int) int {
    time.Sleep(time.Second)
    return sector * 10
}

func main() {
    results := make(chan int)
    for sector := 0; sector < 3; sector++ {
        go func(s int) {
            results <- scan(s)
        }(sector)
    }
    total := 0
    for i := 0; i < 3; i++ {
        total += <-results
    }
    fmt.Println("Minerales:", total)
}
`,
    polyglot: 'go f() lanza una goroutine: un hilo ligerísimo (puedes tener millones). El lema de Go: «no comuniques compartiendo memoria; comparte memoria comunicando». Cada goroutine envía su resultado por un canal (chan) y main los recoge con <-.',
  },
  'boss-swarm': {
    starter: `package main

func hasDuplicate(ids []int) bool {
    n := len(ids)
    for i := 0; i < n; i++ {
        for j := i + 1; j < n; j++ {
            if ids[i] == ids[j] {
                return true
            }
        }
    }
    return false
}
`,
    solution: `package main

func hasDuplicate(ids []int) bool {
    seen := make(map[int]bool)
    for _, id := range ids {
        if seen[id] {
            return true
        }
        seen[id] = true
    }
    return false
}
`,
    polyglot: 'Go no trae un tipo «set»: se usa map[int]bool (o map[int]struct{} para no gastar memoria en el valor). Una clave ausente devuelve false, así que seen[id] responde directamente.',
  },
};

const lessonCode = {
  'Una variable es una caja con nombre': 'gravity := 9.81\nfmt.Println(gravity) // 9.81',
  'Cada caja tiene un tipo': 'var shipMass int = 1200        // entero\nvar gravity float64 = 9.81     // decimal\nvar shieldsOn bool = true      // sí / no\nvar pilotName string = "Nova"  // texto',
  'Cajas más grandes para números más grandes': 'var pequeno int32 = 2_147_483_647   // máximo de int32\nvar grande int64 = 3_000_000_000    // 64 bits',
  'La trampa: convierte ANTES de multiplicar': 'var a, b int32 = 4, 750_000_000\n// var mal int64 = a * b    ❌ no compila: int32 no es int64\nbien := int64(a) * int64(b)   // ✅ 3000000000',
  'Un bucle repite un trozo de código': 'for i := 0; i < 3; i++ {\n    fmt.Println(i)\n}\n// 0, 1, 2',
  '¿El último número entra o no?': 'i < 6     // 0..5  → 6 vueltas ✅\ni <= 6    // 0..6  → 7 vueltas',
  'if: el programa toma decisiones': 'if fuel > 50 {\n    fmt.Println("Vamos")\n} else {\n    fmt.Println("Repostar")\n}',
  'El operador % (resto) distingue pares e impares': 'fmt.Println(6 % 2) // 0 → par\nfmt.Println(7 % 2) // 1 → impar',
  'Un array es una fila de cajas numeradas': 'cargo := []int{42, 7, 93}\ncargo[0]     // 42 (el primero)\ncargo[2]     // 93 (el último)\nlen(cargo)   // 3',
  'Intercambiar dos cajas': '// Go intercambia en una línea\ncargo[0], cargo[1] = cargo[1], cargo[0]',
  'Un diccionario relaciona etiquetas con valores': 'counts := make(map[string]int)\ncounts["ore"] = 3\ncounts["ore"]   // 3\ncounts["chip"]  // 0: valor cero',
  'El patrón «contador»': 'for _, color := range colores {\n    votos[color]++   // la clave ausente vale 0\n}',
  'Una clase es un molde': '// Go no tiene clases: usa struct\ntype Nave struct {\n    x, y float64\n}\nnave := Nave{x: 10, y: 20}',
  'Herencia: «es un tipo de»': '// Sin herencia: una interface dice qué sabe hacer un tipo\ntype Entity interface {\n    Update()\n}\n// Enemy es una Entity solo por tener Update()',
  'Sobrescribir: cada uno a su manera': 'type Enemy struct{ x, y float64 }\n\nfunc (e *Enemy) Update() {\n    e.y += 3   // su propia versión\n}',
  'Esperar uno a uno o todos a la vez': null,
  'Cómo se lanzan tareas en tu lenguaje': 'results := make(chan int)\nfor i := 0; i < 3; i++ {\n    go func(n int) { results <- tarea(n) }(i)   // lanzar\n}\ntotal := 0\nfor i := 0; i < 3; i++ {\n    total += <-results                           // esperar\n}',
  'Cuidado con compartir una variable': '// Mejor un canal que una variable compartida.\n// Si hace falta compartir, protégela:\nvar mu sync.Mutex\nmu.Lock()\ntotal += 5\nmu.Unlock()',
  'Un conjunto recuerda lo que ya viste': 'vistos := make(map[int]bool)\nvistos[5] = true\nvistos[5]   // true, al instante\nvistos[8]   // false: valor cero',
};

const lessonText = {
  'Una clase es un molde': 'Go no tiene clases. Los datos se agrupan en un struct (un molde con campos) y las funciones que trabajan con él se le «enganchan» como métodos. Con un struct puedes crear tantos valores como quieras.',
  'Herencia: «es un tipo de»': 'Go tampoco tiene herencia. En su lugar usa interfaces: una lista de métodos. Cualquier tipo que tenga esos métodos cumple la interface automáticamente, sin declararlo. Si Enemy tiene Update(), Enemy ya es una Entity.',
};

const extraSteps = {
  'm1-world-laws': [{
    after: 1,
    step: {
      title: ':= declara e infiere, y Go no perdona lo que no usas',
      text: 'En Go hay una forma corta de crear variables: nombre := valor. El tipo se deduce del valor. Y una regla que sorprende: si declaras una variable y no la usas en ningún sitio, el programa no compila. Go te obliga a mantener el código limpio.',
      visual: 'boxes',
      code: { go: 'gravity := 9.81            // float64 deducido\nshipMass := 1200           // int deducido\nfmt.Println(gravity, shipMass)\n\nsobra := 5   // ❌ declared and not used: sobra' },
    },
  }],
  'm4-entities': [{
    after: 2,
    step: {
      title: 'Receptor puntero: cambiar el original',
      text: 'Un método con receptor por valor, func (p Player), recibe una COPIA del struct: si cambia p.x, cambia la copia y el original se queda igual. Para modificar el original, usa receptor puntero: func (p *Player).',
      visual: 'swap',
      code: { go: 'func (p Player) Update()  { p.x += 2 } // ❌ cambia una copia\nfunc (p *Player) Update() { p.x += 2 } // ✅ cambia el original' },
    },
  }],
};

const missionText = {
  'm1-world-laws': 'var gravity int = 9.81 no compila: un int no guarda decimales. Cambia int por float64. Luego declara var pilotName string = "tu nombre" y añádela al fmt.Println (si no la usas, Go no compila).',
  'm1-reactor': 'int32 × int32 da int32 y 3.000 millones no cabe: da la vuelta en negativo. Convierte ambos operandos: totalThrust := int64(engines) * int64(thrustPerEngine).',
  'm2-patrol': 'i <= 6 da 7 vueltas. Cámbialo por i < 6.',
  'm2-zigzag': 'Después de y := 80 añade: if i%2 == 1 { y = 280 }',
  'm3-sort-cargo': 'j < n-i deja que cargo[j+1] se salga del slice (panic). Cámbialo por j < n-1-i.',
  'm3-inventory': 'Cambia counts[item] = 1 por counts[item]++ (la clave ausente vale 0).',
  'm4-entities': 'Cambia el receptor de Player a puntero: func (p *Player) Update(). Después crea type Enemy struct { x, y float64 } con func (e *Enemy) Update() { e.y += 3 } y type Obstacle struct con un Update() vacío.',
  'm5-systems': 'Crea un canal results := make(chan int). En el bucle lanza go func(s int) { results <- scan(s) }(sector). Después, en otro bucle de 3 vueltas, suma total += <-results.',
  'boss-swarm': 'Crea seen := make(map[int]bool), recorre una vez con for _, id := range ids y, si seen[id] ya es true, return true; si no, seen[id] = true. Al final, return false.',
};

export default {
  lang: 'go',
  missions,
  lessonCode,
  lessonText,
  extraLangs: ['La trampa: convierte ANTES de multiplicar', 'Un diccionario relaciona etiquetas con valores', 'Esperar uno a uno o todos a la vez', 'Cómo se lanzan tareas en tu lenguaje', 'Cuidado con compartir una variable'],
  extraSteps,
  missionText,
  objective: {
    'm3-inventory': 'countItems(pickups) debe devolver un map[string]int {objeto: cantidad} con cuántos hay de cada tipo.',
    'm4-entities': 'Define la interface Entity con Update(); los structs Player, Enemy y Obstacle la cumplen con su propio Update(). Player y Enemy se mueven distinto y modifican el original (receptor puntero).',
  },
  story: {},
};
