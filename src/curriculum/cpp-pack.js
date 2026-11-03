// Paquete de lenguaje: C++
// Velocidad de C con abstracciones: clases con virtual, la STL (vector,
// unordered_map, unordered_set) y memoria con new/delete.

const missions = {
  'm1-world-laws': {
    starter: `#include <iostream>
#include <string>
using namespace std;

int main() {
    // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
    int gravity = 9.81;
    int shipMass = 1200;
    bool shieldsOn = true;
    // TODO: declara pilotName (string) con tu nombre de piloto
    cout << "g = " << gravity << endl;
    return 0;
}
`,
    solution: `#include <iostream>
#include <string>
using namespace std;

int main() {
    double gravity = 9.81;
    int shipMass = 1200;
    bool shieldsOn = true;
    string pilotName = "Nova";
    cout << "g = " << gravity << endl;
    return 0;
}
`,
    polyglot: 'C++ hereda de C la conversión silenciosa: int g = 9.81 compila (como mucho con un aviso) y guarda 9. Para que el compilador te proteja usa llaves: int g{9.81}; es un error. string es la clase de texto de la librería estándar.',
  },
  'm1-reactor': {
    starter: `#include <iostream>
using namespace std;

int main() {
    int engines = 4;
    int thrustPerEngine = 750000000;
    int totalThrust = engines * thrustPerEngine;
    cout << "Empuje total: " << totalThrust << endl;
    return 0;
}
`,
    solution: `#include <iostream>
using namespace std;

int main() {
    int engines = 4;
    int thrustPerEngine = 750000000;
    long long totalThrust = (long long) engines * thrustPerEngine;
    cout << "Empuje total: " << totalThrust << endl;
    return 0;
}
`,
    polyglot: 'El desbordamiento de enteros con signo es comportamiento indefinido: el compilador puede asumir que nunca pasa. long long garantiza al menos 64 bits; convierte un operando antes de multiplicar (static_cast<long long>(a) * b).',
  },
  'm2-patrol': {
    starter: `int main() {
    // waypoint(x, y) añade una baliza a la ruta del dron.
    for (int i = 0; i <= 6; i++) {
        waypoint(80 + i * 100, 120);
    }
    return 0;
}
`,
    solution: `int main() {
    for (int i = 0; i < 6; i++) {
        waypoint(80 + i * 100, 120);
    }
    return 0;
}
`,
    polyglot: 'El for clásico de C: inicio; condición; incremento. i < 6 da 6 vueltas; i <= 6 da 7. C++ añade el for de rango: for (int x : lista).',
  },
  'm2-zigzag': {
    starter: `int main() {
    for (int i = 0; i < 8; i++) {
        int x = 40 + i * 80;
        int y = 80; // TODO: alterna arriba (pares) y abajo (impares)
        waypoint(x, y);
    }
    return 0;
}
`,
    solution: `int main() {
    for (int i = 0; i < 8; i++) {
        int x = 40 + i * 80;
        int y = 80;
        if (i % 2 == 1) {
            y = 280;
        }
        waypoint(x, y);
    }
    return 0;
}
`,
    polyglot: 'if necesita paréntesis; las llaves son opcionales con una sola sentencia, pero ponerlas siempre evita bugs. El ternario resume un if/else: int y = (i % 2 == 0) ? 80 : 280;',
  },
  'm3-sort-cargo': {
    starter: `#include <vector>
using namespace std;

void sortCargo(vector<int>& cargo) {
    int n = cargo.size();
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i; j++) {
            if (cargo[j] > cargo[j + 1]) {
                swap(cargo[j], cargo[j + 1]);
            }
        }
    }
}
`,
    solution: `#include <vector>
using namespace std;

void sortCargo(vector<int>& cargo) {
    int n = cargo.size();
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (cargo[j] > cargo[j + 1]) {
                swap(cargo[j], cargo[j + 1]);
            }
        }
    }
}
`,
    polyglot: 'vector<int>& es una referencia: la función trabaja sobre el vector original, sin copiarlo. cargo[i] no comprueba límites (es rápido pero peligroso); cargo.at(i) sí, y lanza std::out_of_range.',
  },
  'm3-inventory': {
    starter: `#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

unordered_map<string, int> countItems(const vector<string>& pickups) {
    unordered_map<string, int> counts;
    for (const auto& item : pickups) {
        counts[item] = 1; // ⚠ sobrescribe en lugar de contar
    }
    return counts;
}
`,
    solution: `#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

unordered_map<string, int> countItems(const vector<string>& pickups) {
    unordered_map<string, int> counts;
    for (const auto& item : pickups) {
        counts[item]++;
    }
    return counts;
}
`,
    polyglot: 'unordered_map es una tabla hash. Su operator[] crea la clave con valor 0 si no existe, así que counts[item]++ ya es el contador completo. auto deja que el compilador deduzca el tipo.',
  },
  'm4-entities': {
    starter: `class Entity {
public:
    float x = 0, y = 0;
    void update() {}
};

class Player : public Entity {
public:
    void update() override {
        x += 2;
    }
};

// TODO: class Enemy : public Entity que patrulle en vertical (y += ...)
// TODO: class Obstacle : public Entity que no se mueva
`,
    solution: `class Entity {
public:
    float x = 0, y = 0;
    virtual void update() {}
    virtual ~Entity() = default;
};

class Player : public Entity {
public:
    void update() override {
        x += 2;
    }
};

class Enemy : public Entity {
public:
    void update() override {
        y += 3;
    }
};

class Obstacle : public Entity {
};
`,
    polyglot: 'En C++ el polimorfismo hay que pedirlo: solo los métodos virtual se resuelven según el tipo real del objeto. override hace que el compilador compruebe que de verdad sobrescribes. Una clase base con virtual necesita también un destructor virtual.',
  },
  'm5-systems': {
    starter: `#include <iostream>
using namespace std;

int main() {
    int* shields = new int[8];
    for (int i = 0; i < 8; i++) {
        shields[i] = i * 10;
    }

    int* buffer = new int[4];
    for (int i = 0; i < 4; i++) {
        buffer[i] = shields[i] + 1;
    }

    delete[] shields;
    cout << "Escudo máximo: " << shields[7] << endl; // ⚠ ¿sigue existiendo?
    // ⚠ ¿falta algo?
    return 0;
}
`,
    solution: `#include <iostream>
using namespace std;

int main() {
    int* shields = new int[8];
    for (int i = 0; i < 8; i++) {
        shields[i] = i * 10;
    }

    int* buffer = new int[4];
    for (int i = 0; i < 4; i++) {
        buffer[i] = shields[i] + 1;
    }

    cout << "Escudo máximo: " << shields[7] << endl;
    delete[] shields;
    delete[] buffer;
    return 0;
}
`,
    polyglot: 'new reserva memoria y delete la devuelve (delete[] si era un array). El C++ moderno casi nunca los escribe a mano: vector y los punteros inteligentes (unique_ptr) liberan solos al salir del bloque. Esa idea se llama RAII.',
  },
  'boss-swarm': {
    starter: `#include <vector>
using namespace std;

bool hasDuplicate(const vector<int>& ids) {
    int n = ids.size();
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
    solution: `#include <unordered_set>
#include <vector>
using namespace std;

bool hasDuplicate(const vector<int>& ids) {
    unordered_set<int> seen;
    for (int x : ids) {
        if (!seen.insert(x).second) {
            return true;
        }
    }
    return false;
}
`,
    polyglot: 'unordered_set::insert devuelve un par: .second es false si el valor ya estaba. Alternativa O(n log n) sin memoria extra: sort y comparar vecinos.',
  },
};

const lessonCode = {
  'Una variable es una caja con nombre': 'double gravity = 9.81;\ncout << gravity << endl; // 9.81',
  'Cada caja tiene un tipo': 'int shipMass = 1200;          // entero\ndouble gravity = 9.81;        // decimal\nbool shieldsOn = true;        // sí / no\nstring pilotName = "Nova";    // texto',
  'Cajas más grandes para números más grandes': 'int pequeno = 2147483647;           // máximo de int\nlong long grande = 3000000000LL;    // 64 bits',
  'La trampa: convierte ANTES de multiplicar': 'int a = 4, b = 750000000;\nlong long mal  = a * b;               // ❌ se calcula en int\nlong long bien = (long long) a * b;   // ✅ 3000000000',
  'Un bucle repite un trozo de código': 'for (int i = 0; i < 3; i++) {\n    cout << i << endl;\n}\n// 0, 1, 2',
  '¿El último número entra o no?': 'i < 6       // 0..5  → 6 vueltas ✅\ni <= 6      // 0..6  → 7 vueltas',
  'if: el programa toma decisiones': 'if (fuel > 50) {\n    cout << "Vamos" << endl;\n} else {\n    cout << "Repostar" << endl;\n}',
  'El operador % (resto) distingue pares e impares': 'cout << 6 % 2 << endl; // 0 → par\ncout << 7 % 2 << endl; // 1 → impar',
  'Un array es una fila de cajas numeradas': 'vector<int> cargo = {42, 7, 93};\ncargo[0]       // 42 (el primero)\ncargo[2]       // 93 (el último)\ncargo.size()   // 3',
  'Intercambiar dos cajas': 'swap(cargo[0], cargo[1]);   // la librería estándar lo trae hecho',
  'Un diccionario relaciona etiquetas con valores': 'unordered_map<string, int> counts;\ncounts["ore"] = 3;\ncounts["ore"]   // 3',
  'El patrón «contador»': 'for (const auto& color : colores) {\n    votos[color]++;   // si no existía, empieza en 0\n}',
  'Una clase es un molde': 'class Nave {\npublic:\n    double x, y;\n};\nNave nave;\nnave.x = 10;',
  'Herencia: «es un tipo de»': 'class Enemy : public Entity {\n    // ya tiene x, y y update()\n};',
  'Sobrescribir: cada uno a su manera': 'class Entity {\npublic:\n    virtual void update() {}   // virtual: se puede sobrescribir\n};\nclass Enemy : public Entity {\npublic:\n    void update() override { y += 3; }\n};',
  'Un conjunto recuerda lo que ya viste': 'unordered_set<int> vistos;\nvistos.insert(5);\nvistos.count(5)   // 1: ya estaba, al instante',
};

const extraSteps = {
  'm4-entities': [{
    after: 2,
    step: {
      title: 'virtual: el interruptor del polimorfismo',
      text: 'En C++, si el método de la clase base no es virtual, el motor llamará siempre a la versión de Entity aunque el objeto sea un Enemy. virtual activa el polimorfismo: el programa mira qué tipo de objeto es de verdad. Y si escribes override sobre un método que no es virtual, el compilador da error.',
      visual: 'poly',
      code: { cpp: 'class Entity {\npublic:\n    void update() {}           // ❌ sin virtual: siempre se usa este\n};\nclass Entity2 {\npublic:\n    virtual void update() {}   // ✅ cada hija usa el suyo\n};' },
    },
  }],
  'm5-systems': [
    {
      after: -1,
      step: {
        title: 'new: pedir memoria',
        text: 'new reserva memoria mientras el programa funciona y te da un puntero a ella. new int[8] reserva sitio para 8 enteros. A diferencia de malloc, cuenta elementos, no bytes.',
        visual: 'malloc',
        code: { cpp: 'int* datos = new int[8];   // 8 enteros\ndatos[0] = 10;\ndatos[7] = 70;             // la última posición válida' },
      },
    },
    {
      after: 0,
      step: {
        title: 'delete[]: devolverla, y no tocarla después',
        text: 'Lo que pides con new[] lo devuelves con delete[]. Si se te olvida, hay una fuga. Y después de delete[], el puntero apunta a memoria que ya no es tuya: usarlo es un «use-after-free». Por eso el C++ moderno prefiere vector, que libera solo.',
        visual: 'leak',
        code: { cpp: 'int* a = new int[4];\n// ... usar a ...\ndelete[] a;\n// a[0] = 5;   ❌ use-after-free\n\nvector<int> v(4);   // ✅ se libera solo al salir del bloque' },
      },
    },
  ],
};

const missionText = {
  'm1-world-laws': 'int gravity = 9.81 guarda solo 9 (C++ corta los decimales sin avisar). Cambia int por double. Luego, donde está el TODO, declara string pilotName = "tu nombre";',
  'm1-reactor': 'int no llega a 3.000 millones. Cambia el tipo de totalThrust a long long y convierte un operando antes de multiplicar: (long long) engines * thrustPerEngine.',
  'm2-patrol': 'i <= 6 da 7 vueltas. Cámbialo por i < 6.',
  'm2-zigzag': 'Después de int y = 80; añade: if (i % 2 == 1) { y = 280; }',
  'm3-sort-cargo': 'j < n - i deja que cargo[j + 1] lea fuera del vector. Cámbialo por j < n - 1 - i.',
  'm3-inventory': 'Cambia counts[item] = 1; por counts[item]++; (si la clave no existía, empieza en 0).',
  'm4-entities': 'Primero añade virtual delante de void update() en Entity (sin virtual, override da error). Después crea class Enemy : public Entity con void update() override { y += 3; } y class Obstacle : public Entity { };',
  'm5-systems': 'El cout lee shields[7] después de delete[]: mueve el cout antes del delete[]. Y añade delete[] buffer; al final para que no haya fugas.',
  'boss-swarm': 'Crea unordered_set<int> seen; recorre una sola vez con for (int x : ids) y, si seen.insert(x).second es false, return true. Al final, return false.',
};

export default {
  lang: 'cpp',
  missions,
  lessonCode,
  extraLangs: ['La trampa: convierte ANTES de multiplicar', 'Un diccionario relaciona etiquetas con valores'],
  extraSteps,
  missionText,
  objective: {
    'm3-inventory': 'countItems(pickups) debe devolver un unordered_map {objeto: cantidad} con cuántos hay de cada tipo.',
    'm4-entities': 'Crea la clase base Entity con un update() virtual; Player, Enemy y Obstacle heredan de ella; Player y Enemy sobrescriben update() (override) con movimientos distintos.',
    'm5-systems': 'Reserva shields (8 int) y buffer (4 int) con new[], rellena shields[i] = i * 10 y libera todo con delete[]. Sin usar memoria liberada y sin fugas.',
  },
  story: {
    'm5-systems': 'Último módulo antes del jefe final. Gestionas a mano la memoria de los escudos con new[] y delete[]: cada bloque que pides lo tienes que devolver, y nunca debes tocar un bloque después de devolverlo.',
  },
};
