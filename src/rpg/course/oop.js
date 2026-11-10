// Programación orientada a objetos en Bitlandia: todo lo que hay en el mapa es una Pieza,
// con su posición (x, y) y un método update() que el juego llama en cada turno.
// Cada clase hija (Pygota, Topin, Roca...) hereda de Pieza y se mueve a su manera.
// Las plantillas generan código idiomático en los 10 lenguajes (clases, traits, interfaces o
// structs con punteros a función).
import { check } from '../../curriculum/helpers.js';
import { analyzeClasses, motionOf } from '../../core/analyzer.js';
import { LANG_ORDER } from '../../core/languages.js';

const lower = (s) => s[0].toLowerCase() + s.slice(1);
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/** Sentencia de movimiento (x += 2, y -= 3…) en cada lenguaje. */
function move(lang, c) {
  const o = c.delta < 0 ? '-=' : '+=';
  const d = Math.abs(c.delta);
  return {
    python: `self.${c.axis} ${o} ${d}`, java: `${c.axis} ${o} ${d};`, csharp: `${c.axis} ${o} ${d};`, kotlin: `${c.axis} ${o} ${d}`, swift: `${c.axis} ${o} ${d}`,
    c: `self->${c.axis} ${o} ${d};`, cpp: `${c.axis} ${o} ${d};`, go: `${lower(c.name)[0]}.${c.axis} ${o} ${d}`, rust: `self.${c.axis} ${o} ${d}.0;`, js: `this.${c.axis} ${o} ${d};`,
  }[lang];
}

function classCode(lang, c) {
  const m = c.axis ? move(lang, c) : null;
  switch (lang) {
    case 'python': return m ? `class ${c.name}(Pieza):\n    def update(self):\n        ${m}\n` : `class ${c.name}(Pieza):\n    pass\n`;
    case 'java': return `class ${c.name} extends Pieza {\n    ${c.name}(double x, double y) { super(x, y); }\n${m ? `\n    @Override\n    void update() {\n        ${m}\n    }\n` : ''}}\n`;
    case 'csharp': return `class ${c.name} : Pieza\n{\n    public ${c.name}(double x, double y) : base(x, y) { }\n${m ? `\n    public override void Update()\n    {\n        ${m}\n    }\n` : ''}}\n`;
    case 'kotlin': return m ? `class ${c.name}(x: Double, y: Double) : Pieza(x, y) {\n    override fun update() {\n        ${m}\n    }\n}\n` : `class ${c.name}(x: Double, y: Double) : Pieza(x, y)\n`;
    case 'swift': return m ? `class ${c.name}: Pieza {\n    override func update() {\n        ${m}\n    }\n}\n` : `class ${c.name}: Pieza { }\n`;
    case 'cpp': return m ? `class ${c.name} : public Pieza {\npublic:\n    void update() override {\n        ${m}\n    }\n};\n` : `class ${c.name} : public Pieza {\n};\n`;
    case 'js': return m ? `class ${c.name} extends Pieza {\n  update() {\n    ${m}\n  }\n}\n` : `class ${c.name} extends Pieza {}\n`;
    case 'go': {
      const r = lower(c.name)[0];
      return `type ${c.name} struct {\n    x, y float64\n}\n\nfunc (${r} *${c.name}) Update() {${m ? `\n    ${m}\n` : ''}}\n`;
    }
    case 'rust': return `struct ${c.name} {\n    x: f64,\n    y: f64,\n}\n\nimpl Pieza for ${c.name} {${m ? `\n    fn update(&mut self) {\n        ${m}\n    }\n` : ''}}\n`;
    case 'c': {
      const fnDef = m ? `\nvoid ${snake(c.name)}_update(Pieza *self) {\n    ${m}\n}\n` : '';
      return `typedef struct {\n    Pieza base;\n} ${c.name};\n${fnDef}`;
    }
    default: return '';
  }
}

const BASE = {
  python: 'class Pieza:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\n    def update(self):\n        pass\n',
  java: 'class Pieza {\n    protected double x, y;\n\n    Pieza(double x, double y) {\n        this.x = x;\n        this.y = y;\n    }\n\n    void update() { }\n}\n',
  kotlin: 'open class Pieza(var x: Double, var y: Double) {\n    open fun update() { }\n}\n',
  csharp: 'class Pieza\n{\n    protected double x, y;\n\n    public Pieza(double x, double y)\n    {\n        this.x = x;\n        this.y = y;\n    }\n\n    public virtual void Update() { }\n}\n',
  swift: 'class Pieza {\n    var x: Double\n    var y: Double\n\n    init(x: Double, y: Double) {\n        self.x = x\n        self.y = y\n    }\n\n    func update() { }\n}\n',
  cpp: 'class Pieza {\npublic:\n    float x = 0, y = 0;\n    virtual void update() {}\n    virtual ~Pieza() = default;\n};\n',
  js: 'class Pieza {\n  constructor(x, y) {\n    this.x = x;\n    this.y = y;\n  }\n\n  update() {}\n}\n',
  go: 'package main\n\n// Go no tiene clases: structs con métodos e interfaces implícitas.\ntype Pieza interface {\n    Update()\n}\n',
  rust: '// Rust no tiene herencia: un trait con comportamiento por defecto.\ntrait Pieza {\n    fn update(&mut self) {}\n}\n',
  c: '// En C: struct base + punteros a función.\ntypedef struct Pieza {\n    float x, y;\n    void (*update)(struct Pieza *self);\n} Pieza;\n\nvoid pieza_update(Pieza *self) { }\n',
};

export function cMain(classes) {
  const lines = classes.map((c) => `    ${c.name} ${lower(c.name)};`);
  classes.forEach((c) => lines.push(`    ${lower(c.name)}.base.update = ${c.axis ? `${snake(c.name)}_update` : 'pieza_update'};`));
  return `int main(void) {\n${lines.join('\n')}\n    return 0;\n}\n`;
}

const todoLine = (lang, c) => {
  const what = c.axis ? `que se mueva en ${c.axis} (${c.axis} ${c.delta < 0 ? '-=' : '+='} ${Math.abs(c.delta)})` : 'que no se mueva';
  return `${lang === 'python' ? '#' : '//'} TODO: ${c.name}, una pieza ${what}`;
};

export function oopProgram(lang, classes, todo = []) {
  const parts = [BASE[lang], ...classes.map((c) => classCode(lang, c))];
  if (todo.length) parts.push(todo.map((c) => todoLine(lang, c)).join('\n') + '\n');
  if (lang === 'c') parts.push(cMain(classes));
  return parts.join('\n');
}


const MOVE_TEXT = (c) => (c.axis ? `se mueve: ${c.axis} ${c.delta < 0 ? '-=' : '+='} ${Math.abs(c.delta)}` : 'no se mueve');

export const OOP_LEVELS_SPEC = [
  {
    id: 'c-clase', title: 'Tu primera clase hija', xp: 220,
    story: 'En Villa Objeto, todo lo que hay en el mapa es una Pieza: tiene una posición (x, y) y un método update() que el juego llama en cada turno. Pygota ya está programada y avanza hacia la derecha. Falta Topín, que cava hacia abajo.',
    have: [{ name: 'Pygota', axis: 'x', delta: 1 }],
    add: [{ name: 'Topin', axis: 'y', delta: 1 }],
    lesson: [
      { title: 'Una clase es un molde', visual: 'mold', base: true, text: 'Una clase describe cómo es un tipo de cosa: qué datos guarda (x, y) y qué sabe hacer (update). Con ese molde se crean objetos: cada daemon del mapa es un objeto con sus propios valores de x e y.' },
      { title: 'Herencia: «es un tipo de»', visual: 'tree', example: 0, text: 'Pygota es un tipo de Pieza: hereda sus datos y sus métodos sin volver a escribirlos. Solo escribe lo que la hace distinta. En el ejemplo, su update() suma 1 a x en cada turno: avanza hacia la derecha.' },
      { title: 'Sobrescribir: cada uno a su manera', visual: 'poly', text: 'Si una clase hija escribe su propio update(), sustituye al de Pieza: eso es sobrescribir. El juego llama a update() en todas las piezas sin saber de qué tipo es cada una, y cada una hace lo suyo. Eso es el polimorfismo.' },
      { title: 'virtual y override', visual: 'poly', langs: ['csharp'], text: 'En C#, el método de la clase base tiene que ser virtual para poder sobrescribirlo, y la hija debe escribir override. Sin override, el método de la hija solo ESCONDE al de la base y el juego seguiría llamando al de Pieza.' },
      { title: 'virtual: el interruptor del polimorfismo', visual: 'poly', langs: ['cpp'], text: 'En C++ el update() de Pieza es virtual: así, aunque el juego guarde punteros a Pieza, se llama al update() de cada clase hija. Escribe override en la hija para que el compilador compruebe que de verdad sobrescribes.' },
      { title: 'Receptor puntero: cambiar el original', visual: 'swap', langs: ['go'], text: 'Go no tiene clases ni herencia: cada struct cumple la interfaz Pieza con solo tener un método Update(). Si Update() cambia x o y, el receptor tiene que ser un puntero (*Topin); con una copia, el original no se movería.' },
    ],
  },
  {
    id: 'c-quietos', title: 'No todos se mueven', xp: 230,
    story: 'Al mapa llegan dos piezas nuevas: una Roca, que nunca se mueve, y un Murciélago, que vuela hacia arriba dos casillas por turno.',
    have: [{ name: 'Pygota', axis: 'x', delta: 1 }, { name: 'Topin', axis: 'y', delta: 1 }],
    add: [{ name: 'Roca', axis: null }, { name: 'Murcielago', axis: 'y', delta: -2 }],
    lesson: [{ title: 'Lo heredado ya funciona', visual: 'tree', text: 'Una clase hija no tiene por qué sobrescribir nada. La Roca hereda el update() de Pieza, que no hace nada: perfecto para algo que no se mueve. El Murciélago sí escribe su update(): resta 2 a y (en la pantalla, la y crece hacia abajo).' }],
  },
  {
    id: 'c-poli', title: 'El mismo método, distinto movimiento', xp: 240,
    story: 'En el pantano viven una Serpiente, que repta hacia la izquierda, y un Cofre que no se mueve. El juego las trata a todas igual: les dice update() y cada una hace lo suyo.',
    have: [{ name: 'Pygota', axis: 'x', delta: 1 }],
    add: [{ name: 'Serpiente', axis: 'x', delta: -1 }, { name: 'Cofre', axis: null }],
    lesson: [{ title: 'Polimorfismo', visual: 'poly', text: 'Polimorfismo significa «muchas formas»: el mismo mensaje (update) produce comportamientos distintos según la clase. Gracias a eso, el bucle del juego no necesita un if por cada tipo de pieza: recorre todas y llama a update().' }],
  },
  {
    id: 'c-escuadron', title: 'El escuadrón completo', xp: 300,
    story: 'Examen de Clara: un mapa con un Dragón que vuela rápido hacia la derecha, un Fantasma que sube despacio y una Estatua que no se mueve, junto a Pygota y Topín.',
    have: [{ name: 'Pygota', axis: 'x', delta: 1 }, { name: 'Topin', axis: 'y', delta: 1 }],
    add: [{ name: 'Dragon', axis: 'x', delta: 3 }, { name: 'Fantasma', axis: 'y', delta: -1 }, { name: 'Estatua', axis: null }],
    lesson: [{ title: 'Una jerarquía bien diseñada', visual: 'tree', text: 'Con una buena clase base, añadir tipos nuevos es rápido: cada clase hija declara de quién hereda y sobrescribe update() solo si necesita moverse. Repasa el patrón de Pygota y repítelo.' }],
  },
];

const POLYGLOT = {
  python: 'class Hija(Pieza): hereda. Escribir def update(self) en la hija sobrescribe el de Pieza; pass deja el cuerpo vacío.',
  java: 'extends para heredar y @Override para que el compilador compruebe que de verdad sobrescribes.',
  csharp: 'class Hija : Pieza. Update() es virtual en la base y las hijas que se mueven escriben public override void Update().',
  kotlin: 'La base es open y su update() es open fun; las hijas escriben override fun update().',
  swift: 'class Hija: Pieza y override func update() en las que se mueven.',
  c: 'Cada «clase» es una struct con Pieza base; como primer campo. El polimorfismo es asignar a base.update la función de cada tipo.',
  cpp: 'class Hija : public Pieza; update() es virtual en la base y las hijas usan override.',
  go: 'Cada struct cumple la interface Pieza con solo tener Update(). Si cambia x o y, usa receptor puntero (*T).',
  rust: 'struct + impl Pieza for T. Las que no se mueven usan la implementación por defecto del trait.',
  js: 'class Hija extends Pieza; escribir update() en la hija lo sobrescribe.',
};

export function buildOopLevel(L, chapter) {
  const starter = {};
  const solution = {};
  const all = [...L.have, ...L.add];
  for (const lang of LANG_ORDER) {
    starter[lang] = oopProgram(lang, L.have, L.add);
    solution[lang] = oopProgram(lang, all);
  }
  const names = all.map((c) => c.name);
  return {
    id: L.id,
    module: chapter,
    title: L.title,
    xp: L.xp,
    drill: false,
    mode: 'static',
    story: L.story,
    objective: `Añade ${L.add.map((c) => `${c.name} (${MOVE_TEXT(c)})`).join(', ')}. Todas heredan de Pieza.`,
    concept: { title: L.lesson[0].title, text: L.lesson[0].text },
    starter,
    solution,
    polyglot: POLYGLOT,
    evaluate({ code, lang }) {
      const { classes } = analyzeClasses(code, lang);
      const inherits = (n) => classes[n] && classes[n].parent === 'Pieza';
      const motion = (n) => (classes[n] && classes[n].methods.update ? motionOf(classes[n].methods.update.body) : { vx: 0, vy: 0 });
      const movesOk = (c) => {
        const mv = motion(c.name);
        const v = c.axis === 'x' ? mv.vx : mv.vy;
        const other = c.axis === 'x' ? mv.vy : mv.vx;
        return Math.sign(v) === Math.sign(c.delta) && v !== 0 && other === 0;
      };
      const movers = L.add.filter((c) => c.axis);
      const statics = L.add.filter((c) => !c.axis);
      const checks = [
        Object.assign(check('inherit', `${L.add.map((c) => c.name).join(', ')} heredan de Pieza`, L.add.every((c) => inherits(c.name)), `Heredan: ${L.add.filter((c) => inherits(c.name)).map((c) => c.name).join(', ') || 'ninguna'}`),
          { help: `Fíjate en cómo declara ${L.have[0].name} que es una Pieza y repite ese patrón para cada clase nueva.` }),
      ];
      if (movers.length) {
        checks.push(Object.assign(check('motion', 'Cada una se mueve como pide la misión', movers.every(movesOk),
          movers.filter((c) => !movesOk(c)).map((c) => { const mv = motion(c.name); return `${c.name}: se mueve (${mv.vx}, ${mv.vy}) y debería ${MOVE_TEXT(c)}`; }).join(' · ')),
        { help: 'En el update() de cada clase que se mueve, suma o resta en x o en y lo que pide la misión.' }));
      }
      if (statics.length) {
        checks.push(Object.assign(check('static', `${statics.map((c) => c.name).join(', ')} no se mueve${statics.length > 1 ? 'n' : ''}`, statics.every((c) => inherits(c.name) && !motion(c.name).vx && !motion(c.name).vy)),
          { help: 'Una pieza que no se mueve no necesita escribir su propio update(): le basta con el heredado.' }));
      }
      if (lang === 'csharp') {
        const hidden = movers.filter((c) => classes[c.name] && classes[c.name].methods.update && !classes[c.name].methods.update.override);
        checks.push(Object.assign(check('csharp-override', 'Los Update() que mueven llevan override', hidden.length === 0,
          hidden.length ? `warning CS0114: '${hidden[0].name}.Update()' oculta el de Pieza: sin override, el juego no llama a tu versión.` : ''), { help: 'Escribe public override void Update().' }));
      }
      if (lang === 'go') {
        const bad = movers.filter((c) => classes[c.name] && classes[c.name].methods.update && !classes[c.name].methods.update.pointer);
        checks.push(Object.assign(check('go-pointer', 'Los Update() que mueven usan receptor puntero', bad.length === 0, bad.length ? `${bad.map((c) => c.name).join(', ')}: usa (x *${bad[0].name}).` : ''), { help: 'Con receptor por valor el método recibe una copia y el original no se mueve.' }));
      }
      return { checks, scene: { names } };
    },
  };
}

export function oopLesson(L) {
  const code = (c) => Object.fromEntries(LANG_ORDER.map((lang) => [lang, classCode(lang, c).trim()]));
  const base = Object.fromEntries(LANG_ORDER.map((lang) => [lang, BASE[lang].trim()]));
  const mission = {};
  for (const lang of LANG_ORDER) mission[lang] = `Añade ${L.add.map((c) => `${c.name} (${MOVE_TEXT(c)})`).join(', ')} siguiendo el patrón de ${L.have[0].name}.`;
  return {
    steps: L.lesson.map((st) => ({ title: st.title, text: st.text, visual: st.visual, langs: st.langs, code: st.base ? base : st.example !== undefined ? code(L.have[st.example]) : code(L.have[0]) })),
    mission,
  };
}
