// Paquete de lenguaje: C#
// El lenguaje de .NET y de Unity: tipado estático, todo es un objeto, propiedades,
// colecciones genéricas (List, Dictionary, HashSet) y async/await de serie.
// Las misiones de historia usan «top-level statements» (el estilo de las plantillas
// modernas de .NET) o una clase Program cuando la misión pide funciones.

const missions = {
  'm1-world-laws': {
    starter: `using System;

// Las constantes físicas de tu mundo. ¡Ojo con los tipos!
int gravity = 9.81;
int shipMass = 1200;
bool shieldsOn = true;
// TODO: declara pilotName (string) con tu nombre de piloto
Console.WriteLine($"g = {gravity}");
`,
    solution: `using System;

double gravity = 9.81;
int shipMass = 1200;
bool shieldsOn = true;
string pilotName = "Nova";
Console.WriteLine($"g = {gravity}, piloto {pilotName}");
`,
    polyglot: 'C# es estricto como Java: int gravity = 9.81 ni siquiera compila (CS0266), porque perdería los decimales. Si de verdad quieres recortarlos, lo dices tú con un cast: (int)9.81. Y en C# string es un tipo de verdad, con mayúsculas o minúsculas (string y String son lo mismo).',
  },
  'm1-reactor': {
    starter: `using System;

int engines = 4;
int thrustPerEngine = 750_000_000;
long totalThrust = engines * thrustPerEngine;
Console.WriteLine($"Empuje total: {totalThrust}");
`,
    solution: `using System;

int engines = 4;
int thrustPerEngine = 750_000_000;
long totalThrust = (long)engines * thrustPerEngine;
Console.WriteLine($"Empuje total: {totalThrust}");
`,
    polyglot: 'Por defecto C# no comprueba el overflow: int * int se calcula en 32 bits y da la vuelta SIN avisar, aunque luego lo guardes en un long. Convierte un operando con (long) antes de multiplicar. Si quieres que el programa se pare al desbordar, envuelve la cuenta en checked( … ).',
  },
  'm2-patrol': {
    starter: `// Waypoint(x, y) añade una baliza a la ruta del dron.
for (int i = 0; i <= 6; i++)
{
    Waypoint(80 + i * 100, 120);
}
`,
    solution: `for (int i = 0; i < 6; i++)
{
    Waypoint(80 + i * 100, 120);
}
`,
    polyglot: 'El for de C# es el clásico de la familia C: inicio; condición; incremento. Para recorrer una colección entera existe foreach (var x in lista), que no puede salirse de los límites.',
  },
  'm2-zigzag': {
    starter: `for (int i = 0; i < 8; i++)
{
    int x = 40 + i * 80;
    int y = 80; // TODO: alterna arriba (pares) y abajo (impares)
    Waypoint(x, y);
}
`,
    solution: `for (int i = 0; i < 8; i++)
{
    int x = 40 + i * 80;
    int y = 80;
    if (i % 2 == 1)
    {
        y = 280;
    }
    Waypoint(x, y);
}
`,
    polyglot: 'En C# la condición de un if tiene que ser un bool de verdad: if (i % 2) no compila (en C sí). Con el operador ternario se escribe en una línea: int y = i % 2 == 0 ? 80 : 280;',
  },
  'm3-sort-cargo': {
    starter: `class Program
{
    static void SortCargo(int[] cargo)
    {
        int n = cargo.Length;
        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n - i; j++)
            {
                if (cargo[j] > cargo[j + 1])
                {
                    int tmp = cargo[j];
                    cargo[j] = cargo[j + 1];
                    cargo[j + 1] = tmp;
                }
            }
        }
    }
}
`,
    solution: `class Program
{
    static void SortCargo(int[] cargo)
    {
        int n = cargo.Length;
        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n - 1 - i; j++)
            {
                if (cargo[j] > cargo[j + 1])
                {
                    (cargo[j], cargo[j + 1]) = (cargo[j + 1], cargo[j]);
                }
            }
        }
    }
}
`,
    polyglot: 'Los arrays de C# comprueban los límites: cargo[n] lanza IndexOutOfRangeException en lugar de leer memoria ajena. Para intercambiar, C# moderno usa tuplas: (a, b) = (b, a). Y en la vida real: Array.Sort(cargo).',
  },
  'm3-inventory': {
    starter: `using System.Collections.Generic;

class Program
{
    static Dictionary<string, int> CountItems(string[] pickups)
    {
        var counts = new Dictionary<string, int>();
        foreach (string item in pickups)
        {
            counts[item]++; // ⚠ la primera vez, la clave aún no existe
        }
        return counts;
    }
}
`,
    solution: `using System.Collections.Generic;

class Program
{
    static Dictionary<string, int> CountItems(string[] pickups)
    {
        var counts = new Dictionary<string, int>();
        foreach (string item in pickups)
        {
            counts[item] = counts.GetValueOrDefault(item) + 1;
        }
        return counts;
    }
}
`,
    polyglot: 'Un Dictionary de C# NO inventa valores: leer una clave que no existe lanza KeyNotFoundException. GetValueOrDefault(clave) devuelve 0 si no está, y TryGetValue te dice a la vez si existe y cuánto vale. Con LINQ: pickups.GroupBy(p => p).ToDictionary(g => g.Key, g => g.Count()).',
  },
  'm4-entities': {
    starter: `class Entity
{
    protected double x, y;

    public Entity(double x, double y)
    {
        this.x = x;
        this.y = y;
    }

    public void Update() { }
}

class Player : Entity
{
    public Player(double x, double y) : base(x, y) { }

    public override void Update()
    {
        x += 2;
    }
}

// TODO: class Enemy : Entity que patrulle en vertical (y += ...)
// TODO: class Obstacle : Entity que no se mueva
`,
    solution: `class Entity
{
    protected double x, y;

    public Entity(double x, double y)
    {
        this.x = x;
        this.y = y;
    }

    public virtual void Update() { }
}

class Player : Entity
{
    public Player(double x, double y) : base(x, y) { }

    public override void Update()
    {
        x += 2;
    }
}

class Enemy : Entity
{
    public Enemy(double x, double y) : base(x, y) { }

    public override void Update()
    {
        y += 3;
    }
}

class Obstacle : Entity
{
    public Obstacle(double x, double y) : base(x, y) { }
}
`,
    polyglot: 'En C# los métodos NO son virtuales por defecto (como en C++): la base debe marcar virtual y cada hija escribir override. Sin virtual, override no compila (CS0506); sin override, la hija solo esconde el método y el motor sigue llamando al de Entity. Es la misma decisión que hace Unity con sus MonoBehaviour.',
  },
  'm5-systems': {
    starter: `using System;
using System.Threading.Tasks;

int total = 0;
for (int s = 0; s < 3; s++)
{
    total += await Scan(s); // ⚠ espera a cada sonda antes de lanzar la siguiente
}
Console.WriteLine($"Minerales: {total}");

static async Task<int> Scan(int sector)
{
    await Task.Delay(1000); // el sensor tarda 1 s
    return sector * 10;
}
`,
    solution: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

var sondas = new List<Task<int>>();
for (int s = 0; s < 3; s++)
{
    sondas.Add(Scan(s)); // la tarea arranca ya; no esperamos aquí
}
int[] resultados = await Task.WhenAll(sondas);
int total = resultados.Sum();
Console.WriteLine($"Minerales: {total}");

static async Task<int> Scan(int sector)
{
    await Task.Delay(1000);
    return sector * 10;
}
`,
    polyglot: 'En C#, llamar a un método async ya pone la tarea en marcha: lo que decide si van en paralelo es CUÁNDO haces await. Lanza todas, guárdalas en una lista y espera con await Task.WhenAll. Devolver valores evita compartir total entre hilos; si tienes que compartir, usa lock o Interlocked.Add.',
  },
  'boss-swarm': {
    starter: `class Program
{
    static bool HasDuplicate(int[] ids)
    {
        int n = ids.Length;
        for (int i = 0; i < n; i++)
        {
            for (int j = i + 1; j < n; j++)
            {
                if (ids[i] == ids[j])
                {
                    return true;
                }
            }
        }
        return false;
    }
}
`,
    solution: `using System.Collections.Generic;

class Program
{
    static bool HasDuplicate(int[] ids)
    {
        var seen = new HashSet<int>();
        foreach (int id in ids)
        {
            if (!seen.Add(id))
            {
                return true;
            }
        }
        return false;
    }
}
`,
    polyglot: 'HashSet<int>.Add devuelve false si el elemento ya estaba: comprobar y añadir en un solo paso, O(1) de media. Con LINQ sería ids.Distinct().Count() != ids.Length (también O(n), pero recorre todo aunque el repetido esté al principio).',
  },
};

const lessonCode = {
  'Una variable es una caja con nombre': 'double gravity = 9.81;\nConsole.WriteLine(gravity); // 9.81',
  'Cada caja tiene un tipo': 'int shipMass = 1200;         // entero\ndouble gravity = 9.81;       // decimal\nbool shieldsOn = true;       // sí / no\nstring pilotName = "Nova";   // texto',
  'Cajas más grandes para números más grandes': 'int pequeno = 2_147_483_647;   // máximo de int (int.MaxValue)\nlong grande = 3_000_000_000;   // 64 bits',
  'La trampa: convierte ANTES de multiplicar': 'int a = 4, b = 750_000_000;\nlong mal = a * b;           // ❌ -1294967296: se multiplicó en 32 bits\nlong bien = (long)a * b;    // ✅ 3000000000',
  'Un bucle repite un trozo de código': 'for (int i = 0; i < 3; i++)\n{\n    Console.WriteLine(i);\n}\n// 0, 1, 2',
  '¿El último número entra o no?': 'i < 6     // 0..5  → 6 vueltas ✅\ni <= 6    // 0..6  → 7 vueltas',
  'if: el programa toma decisiones': 'if (fuel > 50)\n{\n    Console.WriteLine("Vamos");\n}\nelse\n{\n    Console.WriteLine("Repostar");\n}',
  'El operador % (resto) distingue pares e impares': 'Console.WriteLine(6 % 2); // 0 → par\nConsole.WriteLine(7 % 2); // 1 → impar',
  'Un array es una fila de cajas numeradas': 'int[] cargo = { 42, 7, 93 };\ncargo[0]        // 42 (el primero)\ncargo[2]        // 93 (el último)\ncargo.Length    // 3',
  'Intercambiar dos cajas': '// C# intercambia con tuplas en una línea\n(cargo[0], cargo[1]) = (cargo[1], cargo[0]);',
  'Un diccionario relaciona etiquetas con valores': 'var counts = new Dictionary<string, int>();\ncounts["ore"] = 3;\ncounts["ore"]                        // 3\ncounts.GetValueOrDefault("chip")     // 0\ncounts["chip"]                       // ❌ KeyNotFoundException',
  'El patrón «contador»': 'foreach (string item in pickups)\n{\n    counts[item] = counts.GetValueOrDefault(item) + 1;\n}',
  'Una clase es un molde': 'class Ship\n{\n    public double X, Y;\n\n    public Ship(double x, double y)\n    {\n        X = x;\n        Y = y;\n    }\n}\n\nvar nave = new Ship(10, 20);',
  'Herencia: «es un tipo de»': 'class Enemy : Entity   // Enemy ES una Entity\n{\n    public Enemy(double x, double y) : base(x, y) { }\n}',
  'Sobrescribir: cada uno a su manera': '// En Entity:  public virtual void Update() { }\nclass Enemy : Entity\n{\n    public override void Update()\n    {\n        y += 3;   // su propia versión\n    }\n}',
  'Esperar uno a uno o todos a la vez': null,
  'Cómo se lanzan tareas en tu lenguaje': 'var tareas = new List<Task<int>>();\nfor (int s = 0; s < 3; s++)\n{\n    tareas.Add(Scan(s));                    // lanzar (sin await)\n}\nint[] r = await Task.WhenAll(tareas);       // esperar a todas',
  'Cuidado con compartir una variable': '// Mejor que cada tarea DEVUELVA su valor.\n// Si hay que compartir, protégelo:\nlock (candado)\n{\n    total += 5;\n}\n// o en una línea: Interlocked.Add(ref total, 5);',
  'Un conjunto recuerda lo que ya viste': 'var vistos = new HashSet<int>();\nvistos.Add(5);         // true: era nuevo\nvistos.Add(5);         // false: ya estaba\nvistos.Contains(5);    // true, al instante',
};

const lessonText = {
  'Una clase es un molde': 'Una clase es un molde para crear objetos: dice qué datos tienen (campos) y qué saben hacer (métodos). En C# todo vive dentro de clases; con new creas un objeto a partir del molde. Por convención, los campos públicos y los métodos van en PascalCase.',
};

const extraSteps = {
  'm1-world-laws': [{
    after: 1,
    step: {
      title: 'C# no recorta en silencio, y var deduce el tipo',
      text: 'Si intentas meter un decimal en un int, C# no compila: te obliga a decidir. Puedes escribir el tipo (double gravity) o dejar que el compilador lo deduzca con var: var gravity = 9.81 ya es double. Ojo: var no es «cualquier cosa», el tipo queda fijado para siempre.',
      visual: 'boxes',
      code: { csharp: 'var gravity = 9.81;      // double deducido\nvar shipMass = 1200;     // int deducido\n\nint g = 9.81;            // ❌ CS0266: no se puede convertir double en int\nint g2 = (int)9.81;      // ✅ 9: el recorte lo pides tú' },
    },
  }],
  'm3-inventory': [{
    after: 1,
    step: {
      title: 'Leer una clave que no existe es un error',
      text: 'En Python o Java, buscar una clave ausente te da un valor vacío. En C# un Dictionary lanza KeyNotFoundException: el programa se para. Por eso counts[item]++ falla la primera vez que aparece cada objeto. Antes de leer, comprueba con ContainsKey o usa GetValueOrDefault, que devuelve 0 si la clave no está.',
      visual: 'dict',
      code: { csharp: 'counts["ore"]++;                                   // ❌ KeyNotFoundException\n\nif (counts.ContainsKey("ore")) counts["ore"]++;    // ✅ comprobar antes\nelse counts["ore"] = 1;\n\ncounts["ore"] = counts.GetValueOrDefault("ore") + 1;  // ✅ en una línea' },
    },
  }],
  'm4-entities': [{
    after: 2,
    step: {
      title: 'virtual y override: C# te obliga a decidir',
      text: 'En C# un método NO se puede sobrescribir salvo que la clase base lo permita con virtual. Y la hija tiene que decir override para reemplazarlo. Si la base no es virtual, override no compila; si la hija olvida override, su método solo «esconde» al de la base y el motor seguirá llamando al de Entity.',
      visual: 'poly',
      code: { csharp: 'class Entity\n{\n    public virtual void Update() { }   // ✅ se puede sobrescribir\n}\n\nclass Enemy : Entity\n{\n    public override void Update()      // ✅ reemplaza al de Entity\n    {\n        y += 3;\n    }\n}' },
    },
  }],
};

const missionText = {
  'm1-world-laws': 'int gravity = 9.81 no compila (CS0266): un int no guarda decimales. Cambia int por double. Luego, donde está el TODO, declara string pilotName = "tu nombre"; y si quieres, muéstralo en el Console.WriteLine.',
  'm1-reactor': 'int × int se calcula en 32 bits y 3.000 millones no cabe: da la vuelta en negativo aunque lo guardes en un long. Convierte un operando antes de multiplicar: long totalThrust = (long)engines * thrustPerEngine;',
  'm2-patrol': 'i <= 6 da 7 vueltas. Cámbialo por i < 6.',
  'm2-zigzag': 'Después de int y = 80; añade: if (i % 2 == 1) { y = 280; } (en sus propias líneas, con las llaves).',
  'm3-sort-cargo': 'j < n - i deja que cargo[j + 1] se salga del array (IndexOutOfRangeException). Cámbialo por j < n - 1 - i.',
  'm3-inventory': 'counts[item]++ lanza KeyNotFoundException la primera vez que aparece cada objeto. Cámbialo por counts[item] = counts.GetValueOrDefault(item) + 1;',
  'm4-entities': 'Player usa override, pero Update() no es virtual en Entity: añade virtual (public virtual void Update() { }). Después crea class Enemy : Entity con su constructor y public override void Update() { y += 3; }, y class Obstacle : Entity solo con el constructor.',
  'm5-systems': 'El await dentro del bucle espera a cada sonda antes de lanzar la siguiente. Crea var sondas = new List<Task<int>>(); y en el bucle haz sondas.Add(Scan(s)); (sin await). Después del bucle: int[] resultados = await Task.WhenAll(sondas); y suma con resultados.Sum().',
  'boss-swarm': 'Crea var seen = new HashSet<int>(); recorre una sola vez con foreach (int id in ids) y, si seen.Add(id) devuelve false, el ID ya estaba: return true. Al final, return false.',
};

export default {
  lang: 'csharp',
  missions,
  lessonCode,
  lessonText,
  extraLangs: ['Los números enteros tienen un límite', 'Cajas más grandes para números más grandes', 'La trampa: convierte ANTES de multiplicar', 'Un diccionario relaciona etiquetas con valores', 'Esperar uno a uno o todos a la vez', 'Cómo se lanzan tareas en tu lenguaje', 'Cuidado con compartir una variable'],
  extraSteps,
  missionText,
  objective: {
    'm3-inventory': 'CountItems(pickups) debe devolver un Dictionary<string, int> {objeto: cantidad} con cuántos hay de cada tipo.',
    'm4-entities': 'Entity tiene un Update() virtual; Player, Enemy y Obstacle heredan de ella (class X : Entity). Player y Enemy lo sobrescriben con override y se mueven distinto.',
    'm5-systems': 'Lanza las 3 sondas con Scan(s) a la vez y espéralas juntas con await Task.WhenAll; después suma los resultados.',
    'boss-swarm': 'HasDuplicate(ids) devuelve true si hay algún ID repetido. Debe ser correcto y escalar como O(n) u O(n log n): el motor mide las operaciones reales con 200, 400, 800 y 1600 drones.',
  },
  story: {},
};
