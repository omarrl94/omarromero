// Módulo 4 · POO: la jerarquía de entidades del motor (herencia y polimorfismo).
import { check } from './helpers.js';
import { analyzeClasses, motionOf } from '../core/analyzer.js';

const entities = {
  id: 'm4-entities',
  module: 4,
  title: 'La Jerarquía Viva',
  codename: 'CLASS.SPAWN',
  scene: 'entities',
  xp: 260,
  mode: 'static',
  story: 'El motor necesita un sistema de entidades. Todas comparten posición (x, y) y un método update() que se llama en cada frame. Pero cada una se comporta distinto: el jugador avanza, el enemigo patrulla y el obstáculo no se mueve. Diseña la jerarquía y el motor la instanciará en la arena en tiempo real.',
  objective: 'Crea la clase base Entity con update(); las hijas Player, Enemy y Obstacle heredan de ella; Player y Enemy sobrescriben update() con movimientos distintos (x += …, y += …).',
  concept: {
    title: 'Herencia y polimorfismo',
    text: 'La herencia permite que una clase hija reutilice lo que define la padre. El polimorfismo hace que el motor llame a entity.update() sin saber qué tipo concreto es: cada clase responde a su manera. Un solo bucle actualiza a todo el mundo.',
  },
  starter: {
    python: `class Entity:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def update(self):
        pass


class Player(Entity):
    def update(self):
        self.x += 2


# TODO: class Enemy(Entity) que patrulle en vertical (self.y += ...)
# TODO: class Obstacle(Entity) que no se mueva
`,
    java: `class Entity {
    protected double x, y;

    Entity(double x, double y) {
        this.x = x;
        this.y = y;
    }

    void update() { }
}

class Player extends Entity {
    Player(double x, double y) { super(x, y); }

    @Override
    void update() {
        x += 2;
    }
}

// TODO: class Enemy extends Entity que patrulle en vertical (y += ...)
// TODO: class Obstacle extends Entity que no se mueva
`,
    kotlin: `class Entity(var x: Double, var y: Double) {
    fun update() { }
}

class Player(x: Double, y: Double) : Entity(x, y) {
    override fun update() {
        x += 2
    }
}

// TODO: class Enemy que patrulle en vertical (y += ...)
// TODO: class Obstacle que no se mueva
`,
    swift: `class Entity {
    var x: Double
    var y: Double

    init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }

    func update() { }
}

class Player: Entity {
    override func update() {
        x += 2
    }
}

// TODO: class Enemy: Entity que patrulle en vertical (y += ...)
// TODO: class Obstacle: Entity que no se mueva
`,
    c: `#include <stdio.h>

// En C no hay clases: struct + punteros a función = polimorfismo a mano.
typedef struct Entity {
    float x, y;
    void (*update)(struct Entity *self);
} Entity;

typedef struct {
    Entity base;   // "herencia": la base va primero en memoria
    int lives;
} Player;

void entity_update(Entity *self) { }

void player_update(Entity *self) {
    self->x += 2;
}

// TODO: struct Enemy { Entity base; ... } con enemy_update (self->y += ...)
// TODO: struct Obstacle { Entity base; } que use entity_update

int main(void) {
    Player p;
    p.base.update = player_update;
    // TODO: crea un Enemy y un Obstacle y asigna su update
    return 0;
}
`,
  },
  solution: {
    python: `class Entity:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def update(self):
        pass


class Player(Entity):
    def update(self):
        self.x += 2


class Enemy(Entity):
    def update(self):
        self.y += 3


class Obstacle(Entity):
    pass
`,
    java: `class Entity {
    protected double x, y;

    Entity(double x, double y) {
        this.x = x;
        this.y = y;
    }

    void update() { }
}

class Player extends Entity {
    Player(double x, double y) { super(x, y); }

    @Override
    void update() {
        x += 2;
    }
}

class Enemy extends Entity {
    Enemy(double x, double y) { super(x, y); }

    @Override
    void update() {
        y += 3;
    }
}

class Obstacle extends Entity {
    Obstacle(double x, double y) { super(x, y); }
}
`,
    kotlin: `open class Entity(var x: Double, var y: Double) {
    open fun update() { }
}

class Player(x: Double, y: Double) : Entity(x, y) {
    override fun update() {
        x += 2
    }
}

class Enemy(x: Double, y: Double) : Entity(x, y) {
    override fun update() {
        y += 3
    }
}

class Obstacle(x: Double, y: Double) : Entity(x, y)
`,
    swift: `class Entity {
    var x: Double
    var y: Double

    init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }

    func update() { }
}

class Player: Entity {
    override func update() {
        x += 2
    }
}

class Enemy: Entity {
    override func update() {
        y += 3
    }
}

class Obstacle: Entity { }
`,
    c: `#include <stdio.h>

typedef struct Entity {
    float x, y;
    void (*update)(struct Entity *self);
} Entity;

typedef struct {
    Entity base;
    int lives;
} Player;

typedef struct {
    Entity base;
    int damage;
} Enemy;

typedef struct {
    Entity base;
} Obstacle;

void entity_update(Entity *self) { }

void player_update(Entity *self) {
    self->x += 2;
}

void enemy_update(Entity *self) {
    self->y += 3;
}

int main(void) {
    Player p;
    Enemy e;
    Obstacle o;
    p.base.update = player_update;
    e.base.update = enemy_update;
    o.base.update = entity_update;
    return 0;
}
`,
  },
  polyglot: {
    python: 'class Hija(Padre): y listo. Todos los métodos son «virtuales»: sobrescribir es redefinir con el mismo nombre. pass marca un cuerpo vacío.',
    java: 'extends para heredar; @Override no es obligatorio pero hace que el compilador verifique que de verdad sobrescribes algo.',
    kotlin: 'Las clases y funciones son FINALES por defecto: la base necesita open class y open fun. override es obligatorio.',
    swift: 'Herencia simple con Hija: Padre y override obligatorio. Swift prefiere protocolos y structs; las clases son para identidad compartida.',
    c: 'Sin clases: la «herencia» es poner la struct base como primer campo (mismo layout en memoria) y el polimorfismo, punteros a función. Así funcionan GObject o el kernel de Linux.',
  },
  evaluate({ code, lang }) {
    const { classes } = analyzeClasses(code, lang);
    const base = classes.Entity;
    const kids = ['Player', 'Enemy', 'Obstacle'];
    const inherits = (n) => classes[n] && classes[n].parent === 'Entity';
    const baseHasUpdate = base && (lang === 'c' ? (base.fnPtrs || []).includes('update') : !!base.methods.update);
    const ov = (n) => classes[n] && classes[n].methods.update && classes[n].methods.update.override;
    const mP = ov('Player') ? motionOf(classes.Player.methods.update.body) : null;
    const mE = ov('Enemy') ? motionOf(classes.Enemy.methods.update.body) : null;
    const distinct = mP && mE && (mP.vx !== mE.vx || mP.vy !== mE.vy) && (mE.vx || mE.vy);
    const checks = [
      check('base', 'Clase base Entity con update()', base && baseHasUpdate, !base ? 'No encuentro Entity.' : baseHasUpdate ? '' : 'Entity necesita update() (en C, un puntero a función update).'),
      check('inherit', 'Player, Enemy y Obstacle heredan de Entity', kids.every(inherits), `Heredan: ${kids.filter(inherits).join(', ') || 'ninguna'}`),
      check('override', 'Player y Enemy sobrescriben update()', ov('Player') && ov('Enemy'),
        `Sobrescriben: ${kids.filter(ov).join(', ') || 'ninguna'}${lang === 'c' ? ' (asigna enemy_update al campo update)' : ''}`),
      check('polymorph', 'Comportamientos distintos (polimorfismo real)', distinct, mE ? `Player (${mP?.vx ?? 0}, ${mP?.vy ?? 0}) · Enemy (${mE.vx}, ${mE.vy})` : 'Enemy debe moverse: y += …'),
    ];
    if (lang === 'kotlin') {
      const ok = base && base.open && base.methods.update && base.methods.update.open;
      checks.push(check('kotlin-open', 'Entity y update() son open', ok,
        ok ? '' : "error: This type is final, so it cannot be inherited from — en Kotlin todo es final por defecto."));
    }
    if (lang === 'swift') {
      const missing = kids.filter((n) => classes[n] && classes[n].methods.update && !classes[n].methods.update.override);
      checks.push(check('swift-override', 'Cada update() hija lleva override', missing.length === 0,
        missing.length ? `error: overriding declaration requires an 'override' keyword (${missing.join(', ')})` : ''));
    }
    const tree = Object.values(classes).map((c) => ({
      name: c.name,
      parent: c.parent,
      line: c.line,
      overrides: !!(c.methods.update && c.methods.update.override),
      motion: c.methods.update ? motionOf(c.methods.update.body) : { vx: 0, vy: 0 },
    }));
    return { checks, scene: { tree } };
  },
  duck: {
    base: ['¿Qué tienen en común todas las entidades del juego? ¿Dónde debería vivir ese código compartido?'],
    inherit: [
      '¿Cómo indica tu lenguaje que una clase «es un tipo de» otra?',
      'Mira cómo Player hereda de Entity. ¿Puedes repetir el patrón para Enemy?',
    ],
    override: [
      'Si Enemy no define update(), ¿qué versión de update() se ejecutará cuando el motor lo llame?',
      '¿Qué palabra usa tu lenguaje para indicar que reemplazas un método del padre?',
    ],
    polymorph: ['Si el jugador avanza en x, ¿qué debería cambiar en update() para que el enemigo patrulle en vertical?'],
    'kotlin-open': ['En Kotlin, ¿se puede heredar de cualquier clase? ¿Qué palabra «abre» una clase a la herencia?'],
    'swift-override': ['¿Qué palabra exige Swift delante de un método que reemplaza al del padre?'],
  },
};

export default [entities];
