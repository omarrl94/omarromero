// Los tres programas «de sistema» del temario, en clave de Bitlandia:
//  · La ficha de tu daemon (variables y tipos de datos)
//  · La hucha de bits (rangos numéricos y desbordamiento)
//  · El Centro Daemon (memoria manual en C/C++ y concurrencia en el resto)
// Reutilizan el código de partida del motor en los 10 lenguajes, reescrito con rewrite.js.
import { byId as baseById } from '../../curriculum/index.js';
import { LESSONS as BASE_LESSONS } from '../../curriculum/lessons.js';
import { check, v } from '../../curriculum/helpers.js';
import { analyzeConcurrency } from '../../core/analyzer.js';
import { LANG_ORDER } from '../../core/languages.js';
import { rewrite } from './rewrite.js';

const mapLangs = (obj, kind) => (obj && typeof obj === 'object' ? Object.fromEntries(Object.entries(obj).map(([k, t]) => [k, rewrite(t, kind)])) : obj);
const help = (c, h) => Object.assign(c, { help: h });

function base(id, kind) {
  const ch = baseById(id);
  return { starter: mapLangs(ch.starter, kind), solution: mapLangs(ch.solution, kind), polyglot: mapLangs(ch.polyglot, kind), mode: ch.mode };
}

// Frases de las lecciones originales que hablaban de la nave espacial.
const PROSE = {
  ficha: [
    [/Cuando escribes velocidad = 7\.5, el ordenador crea una caja llamada velocidad y mete dentro 7\.5\./g, 'Cuando escribes velocidad = 7.5, el ordenador crea una caja llamada velocidad y mete dentro 7.5.'],
    [/El motor físico necesita multiplicar la gravedad por el tiempo, así que necesita el número\./g, 'Para calcular cuánto avanza tu daemon hay que multiplicar su velocidad por el tiempo, así que hace falta el número.'],
    [/la gravedad/g, 'la velocidad'],
    [/gravedad/g, 'velocidad'],
    [/la nave se estrella/g, 'tu daemon se queda quieto'],
    [/el motor físico/g, 'el juego'],
    [/El motor físico/g, 'El juego'],
    [/el motor/g, 'el juego'],
  ],
  hucha: [
    [/Los motores/g, 'Los cofres'],
    [/los motores/g, 'los cofres'],
    [/cada motor/g, 'cada cofre'],
    [/el empuje/g, 'los bits'],
    [/El empuje/g, 'Los bits'],
    [/empuje/g, 'bits'],
    [/combustible/g, 'bits'],
    [/celdas/g, 'bits'],
    [/la nave/g, 'tu hucha'],
  ],
  centro: [
    [/tres sondas/g, 'tres curas'],
    [/Tres sondas/g, 'Tres curas'],
    [/las sondas/g, 'las curas'],
    [/sondas/g, 'curas'],
    [/sonda/g, 'cura'],
    [/escanea/g, 'cura'],
    [/escaneos/g, 'curas'],
    [/escaneo/g, 'cura'],
    [/los escudos/g, 'las vidas del equipo'],
    [/escudos/g, 'vidas'],
    [/minerales/g, 'puntos de vida'],
  ],
};
const prose = (t, kind) => PROSE[kind].reduce((x, [a, b]) => x.replace(a, b), rewrite(t, kind));

function lessonFrom(id, kind, mission) {
  const L = BASE_LESSONS[id];
  return {
    steps: L.steps.map((s) => ({
      ...s,
      title: prose(s.title, kind),
      text: s.text ? prose(s.text, kind) : s.text,
      textByLang: s.textByLang ? Object.fromEntries(Object.entries(s.textByLang).map(([k, t]) => [k, prose(t, kind)])) : undefined,
      code: s.code ? mapLangs(s.code, kind) : s.code,
    })),
    mission: Object.fromEntries(LANG_ORDER.map((l) => [l, prose(mission[l] || mission.default || L.mission[l] || '', kind)])),
  };
}

// ───────────────────────── La ficha de tu daemon ─────────────────────────
const fichaBase = base('m1-world-laws', 'ficha');
export const FICHA = {
  id: 'p-ficha', title: 'La ficha de tu daemon', xp: 120, drill: false, ...fichaBase,
  story: 'Cada daemon tiene una ficha con sus datos: su apodo, su velocidad, su experiencia y si tiene el escudo activo. El bug ha guardado la velocidad con el tipo equivocado y ha borrado el apodo.',
  objective: 'Declara velocidad (decimal 7.5), experiencia (entero 1200), escudoActivo (booleano activo) y apodo (un texto con el apodo de tu daemon).',
  concept: { title: 'Variables y tipos de datos', text: 'Una variable es una caja con nombre; su tipo decide qué cabe dentro.' },
  evaluate({ result, lang }) {
    const vel = v(result, 'velocidad', lang);
    const xp = v(result, 'experiencia', lang);
    const esc = v(result, 'escudoActivo', lang);
    const apodo = v(result, 'apodo', lang);
    const velVal = vel ? Number(vel.value) : NaN;
    const velDecimal = vel && vel.kind === 'float';
    const xpOk = xp && (xp.kind === 'int' || (lang === 'js' && xp.kind === 'float' && Number.isInteger(xp.value))) && Number(xp.value) === 1200;
    const checks = [
      help(check('velocidad-tipo', 'velocidad es un número decimal', velDecimal,
        !vel ? 'No encuentro la variable velocidad.' : vel.kind === 'str' ? `velocidad es texto (${vel.type}): con un texto no se puede calcular.`
          : vel.flags.includes('truncated') ? `Se cortó 7.5 a ${vel.value}: un entero no guarda decimales.` : `velocidad es ${vel.type}: necesitas un tipo con decimales.`),
      { python: 'Quita las comillas: 7.5 sin comillas es un número decimal (float); con comillas es texto (str).', js: 'Quita las comillas: 7.5 sin comillas es un number; con comillas es un string.', go: 'Cambia int por float64: es el tipo de Go para números con decimales.', rust: 'Cambia i32 por f64: es el tipo de Rust para números con decimales.', kotlin: 'Cambia Int por Double.', swift: 'Cambia Int por Double.' }[lang] || 'Cambia int por double: es el tipo para números con decimales.'),
      help(check('velocidad-valor', 'velocidad vale 7.5', velDecimal && velVal > 7.4 && velVal < 7.6, velDecimal ? `Valor actual: ${velVal}` : ''), 'Escribe 7.5 (con punto, no con coma).'),
      help(check('experiencia', 'experiencia es un entero: 1200', xpOk, xp ? `${xp.type} = ${xp.value}` : 'Falta experiencia.'), 'experiencia ya está bien: 1200 es un número entero.'),
      help(check('escudo', 'escudoActivo es un booleano y vale verdadero', esc && esc.kind === 'bool' && esc.value === true, esc ? `${esc.type} = ${esc.value}` : 'Falta escudoActivo.'), 'Un booleano solo puede valer verdadero o falso (true / True).'),
      help(check('apodo', 'apodo es un texto', apodo && apodo.kind === 'str' && String(apodo.value).trim().length > 0, apodo ? '' : 'Declara la variable apodo.'),
        lang === 'c' ? 'En C no existe el tipo string: el texto es un array de char. Escribe char apodo[] = "Nova";' : 'Declara una variable apodo con un texto entre comillas, por ejemplo "Nova".'),
    ];
    return { checks, scene: {} };
  },
};
export const FICHA_LESSON = lessonFrom('m1-world-laws', 'ficha', {});

// ───────────────────────── La hucha de bits ─────────────────────────
const huchaBase = base('m1-reactor', 'hucha');
export const HUCHA = {
  id: 'p-hucha', title: 'La hucha que se desborda', xp: 160, drill: false, ...huchaBase,
  story: {
    default: 'Has encontrado 4 cofres legendarios con 750 millones de bits cada uno. Al sumarlos en tu hucha, el total sale negativo: ¡el número no cabe en la caja que has elegido!',
    js: 'Tu hucha guarda una cantidad enorme de bits. Al sumarle 1 bit de premio, el total no cambia: JavaScript ha perdido la cuenta.',
    python: 'En Python los números enteros no se desbordan. Tu reto es otro: repartir 1000 bits entre 3 amigos en partes enteras y saber cuántos sobran.',
  },
  objective: {
    default: 'Calcula bitsTotales = cofres × bitsPorCofre sin desbordamiento: tiene que dar 3 000 000 000.',
    js: 'Haz que bitsTotales = bitsGuardados + premio dé exactamente 9007199254740993.',
    python: 'Reparte bits_ahorrados entre amigos en partes enteras (bits_por_amigo = 333) y guarda en sobran los bits que sobran (1).',
  },
  concept: { title: 'Rangos numéricos y desbordamiento', text: 'Cada tipo de número tiene un límite. Si te pasas, el valor se desborda.' },
  evaluate({ result, lang }) {
    const total = v(result, 'bitsTotales', lang);
    if (lang === 'js') {
      const exact = total && typeof total.value === 'bigint' && total.value === BigInt('9007199254740993');
      return {
        checks: [
          help(check('total-existe', 'bitsTotales está calculado', !!total, total ? '' : 'No encuentro bitsTotales.'), 'No cambies el nombre bitsTotales.'),
          help(check('precision', 'Suma exacta: 9007199254740993', exact,
            !total ? '' : typeof total.value === 'bigint' ? `Valor: ${total.value}` : `Valor: ${total.value} → el +1 se perdió (number no es exacto por encima de 2^53).`), 'Usa BigInt: escribe una n al final de los dos números (9007199254740992n y 1n).'),
        ],
        scene: {},
      };
    }
    const val = total ? Number(total.value) : NaN;
    const checks = [
      help(check('total-existe', 'bitsTotales está calculado', !!total, total ? '' : 'No encuentro bitsTotales.'), 'No cambies el nombre bitsTotales.'),
      help(check('sin-desbordar', 'Sin desbordamiento: bitsTotales = 3 000 000 000', total && !total.overflow && val === 3e9,
        !total ? '' : total.flags.includes('promotion') ? `Valor ${val}: la multiplicación se hizo en 32 bits antes de guardarse en ${total.type}.`
          : total.overflow ? `Valor ${val}: ¡se ha desbordado! El tipo ${total.type} no llega a 3 000 millones.` : `Valor actual: ${val}`),
      { swift: 'Convierte los dos números a Int64 antes de multiplicar: Int64(cofres) * Int64(bitsPorCofre).', go: 'Convierte antes de multiplicar: int64(cofres) * int64(bitsPorCofre).', rust: 'Usa i64 y convierte antes de multiplicar: cofres as i64 * bits_por_cofre as i64.', kotlin: 'Convierte antes de multiplicar: cofres.toLong() * bitsPorCofre.' }[lang] || 'Usa un tipo de 64 bits (long) y convierte uno de los números ANTES de multiplicar: (long) cofres * bitsPorCofre.'),
    ];
    if (lang === 'python') {
      const porAmigo = v(result, 'bitsPorAmigo', lang);
      const sobran = v(result, 'sobran', lang);
      checks.push(help(check('reparto-entero', 'bits_por_amigo son bits enteros (333)', porAmigo && Number.isInteger(porAmigo.value) && porAmigo.value === 333,
        porAmigo ? `bits_por_amigo = ${porAmigo.value}${Number.isInteger(porAmigo.value) ? '' : ' (float: bits partidos)'}` : 'Falta bits_por_amigo.'), 'En Python, / siempre da decimales. Para dividir en partes enteras usa //.'));
      checks.push(help(check('sobran', 'sobran guarda lo que sobra (1 bit)', sobran && sobran.value === 1, sobran ? `sobran = ${sobran.value}` : 'Falta sobran.'), 'El resto de una división se calcula con %: bits_ahorrados % amigos.'));
    }
    return { checks, scene: {} };
  },
};
export const HUCHA_LESSON = lessonFrom('m1-reactor', 'hucha', {});

// ───────────────────────── El Centro Daemon ─────────────────────────
const centroBase = base('m5-systems', 'centro');
const isMem = (lang) => lang === 'c' || lang === 'cpp';
export const CENTRO = {
  id: 'p-centro', title: 'El Centro Daemon', xp: 320, drill: false, ...centroBase,
  story: {
    default: 'La enfermera del Centro Daemon tiene que curar a tres daemons y cada cura tarda 1 segundo. Si los cura uno detrás de otro tarda 3 s; si los cura a la vez, 1 s. Y al sumar la vida recuperada, nadie debe pisar el trabajo de otro.',
    c: 'Las máquinas del Centro Daemon guardan las vidas de tu equipo en memoria que se pide y se devuelve a mano: todo lo que reservas con malloc tienes que liberarlo con free, o la memoria se va perdiendo.',
    cpp: 'Las máquinas del Centro Daemon guardan las vidas de tu equipo en memoria que se pide y se devuelve a mano: todo lo que reservas con new[] tienes que liberarlo con delete[], y no puedes usarlo después.',
  },
  objective: {
    default: 'Haz las 3 curas a la vez (lánzalas todas antes de esperar a ninguna), espera a que terminen todas y suma la vida recuperada sin carreras de datos.',
    c: 'Reserva vidas para 8 enteros y copia para 4, rellena vidas[i] = i * 10 y libera TODO al final. Sin salirte de la memoria, sin usar memoria ya liberada y sin fugas.',
    cpp: 'Reserva vidas para 8 enteros y copia para 4, rellena vidas[i] = i * 10 y libera TODO al final. Sin salirte de la memoria, sin usar memoria ya liberada y sin fugas.',
  },
  concept: { title: 'Memoria manual y concurrencia', text: 'Los programas de sistemas controlan dos recursos: la memoria y el tiempo.' },
  evaluate({ result, code, lang }) {
    if (isMem(lang)) {
      const heap = result && result.state ? result.state.heap : { blocks: [], events: [] };
      const err = result && result.error;
      const blocks = heap.blocks;
      const first = blocks[0];
      const filled = first && first.len >= 8 && [0, 10, 20, 30, 40, 50, 60, 70].every((x, i) => first.data[i] === x);
      const leaks = blocks.filter((b) => !b.freed);
      const memErr = err && ['heapoverflow', 'uaf', 'doublefree', 'invalidfree'].includes(err.code);
      const checks = [
        help(check('reserva', 'Reserva dos bloques de memoria', blocks.length >= 2, `Bloques: ${blocks.length}`), '¿Cuántas veces pides memoria?'),
        help(check('tamano', 'vidas tiene sitio para 8 enteros', first && first.size >= 32, first ? `${first.size} bytes → ${first.len} enteros` : ''), lang === 'c' ? 'malloc cuenta BYTES. Para 8 enteros pide 8 * sizeof(int).' : 'Con new int[8] reservas 8 enteros.'),
        help(check('seguro', 'Sin salirte de la memoria ni usar memoria liberada', !memErr && !!result && result.ok, memErr ? err.message : ''), 'Lee el error: ¿en qué línea usas memoria que no es tuya o que ya devolviste?'),
        help(check('rellena', 'vidas = [0, 10, ..., 70]', filled), 'vidas[i] = i * 10 para i de 0 a 7.'),
        help(check('sin-fugas', 'Sin fugas: todo lo que pides lo devuelves', blocks.length > 0 && leaks.length === 0 && !memErr, leaks.length ? `${leaks.length} bloque(s) sin liberar` : ''), lang === 'c' ? 'Cada malloc necesita su free.' : 'Cada new[] necesita su delete[], después de usar la memoria por última vez.'),
      ];
      return { checks, scene: {} };
    }
    const a = analyzeConcurrency(code, lang);
    const declared = {
      python: /async\s+def\s+curar/, java: /static\s+\w+\s+curar\s*\(/, csharp: /async\s+Task<int>\s+Curar\s*\(/, kotlin: /suspend\s+fun\s+curar/, swift: /func\s+curar\s*\([^)]*\)\s*async/, rust: /fn\s+curar\s*\(/, go: /func\s+curar\s*\(/, js: /async\s+function\s+curar|curar\s*=\s*async/,
    }[lang].test(code);
    const raceFree = !a.sharedMutation || a.protectedMutation;
    const checks = [
      help(check('curar', 'La función curar existe', declared), 'No cambies el nombre ni la forma de la función curar.'),
      help(check('a-la-vez', 'Las 3 curas se hacen a la vez', a.concurrent, a.concurrent ? `${a.spawnCount} tareas a la vez` : a.interleaved ? 'Esperas a cada cura antes de empezar la siguiente: van una detrás de otra.' : 'Las curas van una detrás de otra.'),
        'Lanza las tres curas primero y espéralas todas después.'),
      help(check('espera', 'Espera a que terminen todas antes de sumar', a.waits), '¿Qué pasaría si sumas la vida antes de que acaben las curas?'),
      help(check('carreras', 'Sin carreras de datos en el total', raceFree,
        raceFree ? '' : lang === 'rust' ? 'Rust no compila una carrera de datos: varias tareas no pueden modificar total a la vez.' : 'total += ... desde varias tareas sin protección: se pueden perder sumas.'),
      'En vez de que cada tarea sume en una variable compartida, haz que cada una DEVUELVA su resultado y súmalos al final.'),
    ];
    return { checks, scene: {} };
  },
};
export const CENTRO_LESSON = lessonFrom('m5-systems', 'centro', {});
