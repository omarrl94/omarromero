// Niveles extra de POO generados por plantillas idiomáticas de cada lenguaje:
// clases (Python, Java, Kotlin, Swift, C++, JS), traits (Rust), interfaces (Go)
// y structs con punteros a función (C).
import { check } from './helpers.js';
import { analyzeClasses, motionOf } from '../core/analyzer.js';
import { LANG_ORDER } from '../core/languages.js';

const lower = (s) => s[0].toLowerCase() + s.slice(1);
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/** Sentencia de movimiento (x += 2, y -= 3…) en cada lenguaje. */
function move(lang, c) {
  const o = c.delta < 0 ? '-=' : '+=';
  const d = Math.abs(c.delta);
  return {
    python: `self.${c.axis} ${o} ${d}`, java: `${c.axis} ${o} ${d};`, kotlin: `${c.axis} ${o} ${d}`, swift: `${c.axis} ${o} ${d}`,
    c: `self->${c.axis} ${o} ${d};`, cpp: `${c.axis} ${o} ${d};`, go: `${lower(c.name)[0]}.${c.axis} ${o} ${d}`, rust: `self.${c.axis} ${o} ${d}.0;`, js: `this.${c.axis} ${o} ${d};`,
  }[lang];
}

function classCode(lang, c) {
  const m = c.axis ? move(lang, c) : null;
  switch (lang) {
    case 'python': return m ? `class ${c.name}(Entity):\n    def update(self):\n        ${m}\n` : `class ${c.name}(Entity):\n    pass\n`;
    case 'java': return `class ${c.name} extends Entity {\n    ${c.name}(double x, double y) { super(x, y); }\n${m ? `\n    @Override\n    void update() {\n        ${m}\n    }\n` : ''}}\n`;
    case 'kotlin': return m ? `class ${c.name}(x: Double, y: Double) : Entity(x, y) {\n    override fun update() {\n        ${m}\n    }\n}\n` : `class ${c.name}(x: Double, y: Double) : Entity(x, y)\n`;
    case 'swift': return m ? `class ${c.name}: Entity {\n    override func update() {\n        ${m}\n    }\n}\n` : `class ${c.name}: Entity { }\n`;
    case 'cpp': return m ? `class ${c.name} : public Entity {\npublic:\n    void update() override {\n        ${m}\n    }\n};\n` : `class ${c.name} : public Entity {\n};\n`;
    case 'js': return m ? `class ${c.name} extends Entity {\n  update() {\n    ${m}\n  }\n}\n` : `class ${c.name} extends Entity {}\n`;
    case 'go': {
      const r = lower(c.name)[0];
      return `type ${c.name} struct {\n    x, y float64\n}\n\nfunc (${r} *${c.name}) Update() {${m ? `\n    ${m}\n` : ''}}\n`;
    }
    case 'rust': return `struct ${c.name} {\n    x: f64,\n    y: f64,\n}\n\nimpl Entity for ${c.name} {${m ? `\n    fn update(&mut self) {\n        ${m}\n    }\n` : ''}}\n`;
    case 'c': {
      const fnDef = m ? `\nvoid ${snake(c.name)}_update(Entity *self) {\n    ${m}\n}\n` : '';
      return `typedef struct {\n    Entity base;\n} ${c.name};\n${fnDef}`;
    }
    default: return '';
  }
}

const BASE = {
  python: 'class Entity:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\n    def update(self):\n        pass\n',
  java: 'class Entity {\n    protected double x, y;\n\n    Entity(double x, double y) {\n        this.x = x;\n        this.y = y;\n    }\n\n    void update() { }\n}\n',
  kotlin: 'open class Entity(var x: Double, var y: Double) {\n    open fun update() { }\n}\n',
  swift: 'class Entity {\n    var x: Double\n    var y: Double\n\n    init(x: Double, y: Double) {\n        self.x = x\n        self.y = y\n    }\n\n    func update() { }\n}\n',
  cpp: 'class Entity {\npublic:\n    float x = 0, y = 0;\n    virtual void update() {}\n    virtual ~Entity() = default;\n};\n',
  js: 'class Entity {\n  constructor(x, y) {\n    this.x = x;\n    this.y = y;\n  }\n\n  update() {}\n}\n',
  go: 'package main\n\n// Go no tiene clases: structs con métodos e interfaces implícitas.\ntype Entity interface {\n    Update()\n}\n',
  rust: '// Rust no tiene herencia: un trait con comportamiento por defecto.\ntrait Entity {\n    fn update(&mut self) {}\n}\n',
  c: '// En C: struct base + punteros a función.\ntypedef struct Entity {\n    float x, y;\n    void (*update)(struct Entity *self);\n} Entity;\n\nvoid entity_update(Entity *self) { }\n',
};

function cMain(classes) {
  const lines = classes.map((c) => `    ${c.name} ${lower(c.name)};`);
  classes.forEach((c) => lines.push(`    ${lower(c.name)}.base.update = ${c.axis ? `${snake(c.name)}_update` : 'entity_update'};`));
  return `int main(void) {\n${lines.join('\n')}\n    return 0;\n}\n`;
}

const todoLine = (lang, c) => {
  const what = c.axis ? `que se mueva en ${c.axis} (${c.axis} ${c.delta < 0 ? '-=' : '+='} ${Math.abs(c.delta)})` : 'que no se mueva';
  return `${lang === 'python' ? '#' : '//'} TODO: ${c.name}, una entidad ${what}`;
};

export function oopProgram(lang, classes, todo = []) {
  const parts = [BASE[lang], ...classes.map((c) => classCode(lang, c))];
  if (todo.length) parts.push(todo.map((c) => todoLine(lang, c)).join('\n') + '\n');
  if (lang === 'c') parts.push(cMain(classes));
  return parts.join('\n');
}

const LEVELS = [
  {
    id: 'o4-turrets', title: 'Torretas de Defensa', codename: 'CLASS.TURRET', xp: 200,
    story: 'La base necesita defensas: torretas fijas en el suelo y drones que patrullen subiendo.',
    have: [{ name: 'Player', axis: 'x', delta: 2 }],
    add: [{ name: 'Turret', axis: null }, { name: 'Drone', axis: 'y', delta: -2 }],
    teach: 'Cada tipo nuevo de entidad hereda de Entity y solo escribe lo que le hace distinto. Una torreta no se mueve: le basta con el update() heredado. Un dron necesita su propio update().',
  },
  {
    id: 'o4-asteroids', title: 'Lluvia de Asteroides', codename: 'CLASS.ASTEROID', xp: 220,
    story: 'Un campo de asteroides cae sobre la ruta y, entre ellos, flotan power-ups que se acercan despacio.',
    have: [{ name: 'Player', axis: 'x', delta: 2 }],
    add: [{ name: 'Asteroid', axis: 'y', delta: 4 }, { name: 'PowerUp', axis: 'x', delta: -1 }],
    teach: 'El polimorfismo permite que el motor trate a todos por igual (todos son Entity y todos tienen update()) aunque cada uno se mueva a su manera: los asteroides caen y los power-ups se acercan.',
  },
  {
    id: 'o4-squadron', title: 'Escuadrón Completo', codename: 'CLASS.SQUAD', xp: 240,
    story: 'Batalla final del módulo: el jefe enemigo avanza, los misiles vuelan rápido y los escudos aguantan quietos.',
    have: [{ name: 'Player', axis: 'x', delta: 2 }, { name: 'Enemy', axis: 'y', delta: 3 }],
    add: [{ name: 'Boss', axis: 'x', delta: 1 }, { name: 'Missile', axis: 'x', delta: 6 }, { name: 'Shield', axis: null }],
    teach: 'Con una buena clase base, añadir tres tipos nuevos es trabajo de minutos: cada clase hija declara de quién hereda y sobrescribe update() solo si necesita moverse.',
  },
];

function makeLevel(L) {
  const starter = {};
  const solution = {};
  const polyglot = {};
  const all = [...L.have, ...L.add];
  for (const lang of LANG_ORDER) {
    starter[lang] = oopProgram(lang, L.have, L.add);
    solution[lang] = oopProgram(lang, all);
    polyglot[lang] = {
      python: 'class Hija(Entity): hereda; redefinir update() lo sobrescribe y pass deja el cuerpo vacío.',
      java: 'extends para heredar y @Override para que el compilador compruebe que de verdad sobrescribes.',
      kotlin: 'La base es open y su update() es open fun; las hijas escriben override fun update().',
      swift: 'class Hija: Entity y override func update() en las que se mueven.',
      c: 'Cada «clase» es una struct con Entity base; como primer campo; el polimorfismo es asignar a base.update la función de cada tipo.',
      cpp: 'class Hija : public Entity; update() es virtual en la base y las hijas usan override.',
      go: 'Cada struct cumple la interface Entity solo con tener Update(). Si cambia campos, receptor puntero (*T).',
      rust: 'struct + impl Entity for T. Las que no se mueven usan la implementación por defecto del trait.',
      js: 'class Hija extends Entity; redefinir update() lo sobrescribe.',
    }[lang];
  }
  const names = all.map((c) => c.name);
  return {
    id: L.id,
    module: 4,
    title: L.title,
    codename: L.codename,
    xp: L.xp,
    mode: 'static',
    scene: 'entities',
    story: L.story,
    objective: `Añade ${L.add.map((c) => `${c.name} (${c.axis ? `se mueve: ${c.axis} ${c.delta < 0 ? '-=' : '+='} ${Math.abs(c.delta)}` : 'no se mueve'})`).join(', ')}. Todas heredan de Entity.`,
    concept: { title: 'Ampliar una jerarquía', text: L.teach },
    starter,
    solution,
    polyglot,
    evaluate({ code, lang }) {
      const { classes } = analyzeClasses(code, lang);
      const inherits = (n) => classes[n] && classes[n].parent === 'Entity';
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
        check('inherit', `${L.add.map((c) => c.name).join(', ')} heredan de Entity`, L.add.every((c) => inherits(c.name)), `Heredan: ${L.add.filter((c) => inherits(c.name)).map((c) => c.name).join(', ') || 'ninguna'}`),
        check('motion', 'Cada una se mueve como pide la misión', movers.every(movesOk),
          movers.filter((c) => !movesOk(c)).map((c) => { const mv = motion(c.name); return `${c.name}: (${mv.vx}, ${mv.vy})`; }).join(' · ')),
      ];
      if (statics.length) checks.push(check('static', `${statics.map((c) => c.name).join(', ')} no se mueve${statics.length > 1 ? 'n' : ''}`, statics.every((c) => inherits(c.name) && !motion(c.name).vx && !motion(c.name).vy)));
      if (lang === 'go') {
        const bad = movers.filter((c) => classes[c.name] && classes[c.name].methods.update && !classes[c.name].methods.update.pointer);
        checks.push(check('go-pointer', 'Los Update() que mueven usan receptor puntero', bad.length === 0, bad.length ? `${bad.map((c) => c.name).join(', ')}: usa (x *${bad[0].name}).` : ''));
      }
      const tree = Object.values(classes).filter((c) => c.name === 'Entity' || names.includes(c.name)).map((c) => ({
        name: c.name, parent: c.parent, line: c.line, overrides: !!(c.methods.update && c.methods.update.override && (motion(c.name).vx || motion(c.name).vy)), motion: motion(c.name),
      }));
      return { checks, scene: { tree } };
    },
    duck: {
      inherit: ['¿Cómo declara Player que es un tipo de Entity? Repite ese patrón para cada clase nueva.'],
      motion: ['¿Qué variable cambia cada clase en su update(): x o y? ¿Y en qué sentido, suma o resta?'],
      static: ['Si una entidad no se mueve, ¿necesita escribir su propio update() o le vale el heredado?'],
      'go-pointer': ['Con receptor por valor el método recibe una copia. ¿Qué le pasa al original?'],
    },
  };
}

export const OOP_LEVELS = LEVELS.map(makeLevel);

export const OOP_LESSONS = Object.fromEntries(LEVELS.map((L) => {
  const code = {};
  const mission = {};
  for (const lang of LANG_ORDER) {
    code[lang] = classCode(lang, L.have[0]).trim();
    mission[lang] = `Añade ${L.add.map((c) => c.name).join(', ')} siguiendo el patrón de ${L.have[0].name}. ${L.add.map((c) => (c.axis ? `${c.name}: ${c.axis} ${c.delta < 0 ? '-=' : '+='} ${Math.abs(c.delta)}` : `${c.name}: sin movimiento`)).join(' · ')}.`;
  }
  return [L.id, { steps: [{ title: 'Ampliar una jerarquía', text: L.teach, visual: 'tree', code }], mission }];
}));
