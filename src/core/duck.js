// The Rubber Duck AI Companion: motor socrático local.
// Nunca da la solución: analiza el código, el error y los checks que fallan y
// devuelve una escalera de preguntas, de la más abierta a la más concreta.
import { loopNesting } from './analyzer.js';
import { LANGUAGES } from './languages.js';

const quote = (s) => `«${s.trim().slice(0, 70)}»`;

const BY_ERROR = {
  syntax: (e, src) => [
    `El compilador se queja en la línea ${e.line}: ${quote(src || '')}. Léela despacio: ¿qué esperaría ver justo ahí?`,
    `El mensaje dice: ${quote(e.message)}. ¿Con qué palabras de tu código relacionas ese mensaje?`,
    e.hint ? `Pista del compilador: ${e.hint}` : '¿Están equilibrados todos tus paréntesis y llaves hasta esa línea?',
  ],
  compile: (e, src) => [
    `Tu programa ni siquiera arranca: el compilador rechaza la línea ${e.line}: ${quote(src || '')}. ¿Qué tipo tiene el valor de la derecha y qué tipo espera la variable?`,
    `Traduce el mensaje a tus palabras: ${quote(e.message)}. ¿Qué crees que está protegiendo el compilador?`,
    e.hint || '¿Qué otro tipo podría guardar exactamente ese valor?',
  ],
  index: (e, src) => [
    `El programa cae en la línea ${e.line}: ${quote(src || '')}. ¿Qué índice se está usando justo cuando falla?`,
    'Si un array tiene n elementos, ¿cuál es el índice más alto válido?',
    'Recorre a mano la última vuelta de tu bucle: ¿hasta qué valor llega la variable y a qué posición accedes con ella?',
  ],
  name: (e, src) => [
    `En la línea ${e.line} usas un nombre que el programa no conoce. ¿Dónde lo declaraste?`,
    '¿Está escrito exactamente igual (mayúsculas, guiones bajos) en la declaración y en el uso?',
    '¿Existe ese nombre en el ámbito (función, bloque) donde lo estás usando?',
  ],
  null: (e) => [`En la línea ${e.line} algo vale null/None/nil. ¿Qué variable podría no tener valor todavía?`, '¿En qué momento asignas un valor real a esa variable?'],
  timeout: () => [
    'Tu programa no termina. ¿Qué condición debería hacer que el bucle se detenga?',
    '¿Qué variable cambia en cada vuelta? ¿Se acerca de verdad a la condición de salida?',
  ],
  overflow: (e) => [`Swift ha detenido el programa en la línea ${e.line}. ¿Cuál es el mayor número que cabe en ese tipo?`, '¿Cabría el resultado en un tipo con más bits?'],
  heapoverflow: (e) => [`Escribes fuera del bloque en la línea ${e.line}. ¿Cuántos BYTES pediste y cuántos ocupan tus datos?`, '¿Cuánto ocupa un int en memoria? ¿Qué operador de C te lo dice?'],
  uaf: (e) => [`Usas un bloque que ya devolviste (línea ${e.line}). ¿En qué orden ocurren tu free y tu último uso?`],
  doublefree: () => ['Liberas dos veces el mismo bloque. ¿Cuántas veces aparece free(...) para ese puntero?'],
  recursion: () => ['La pila de llamadas se ha desbordado. ¿Cuál es el caso base de tu recursión?'],
  call: (e) => [`En la línea ${e.line} llamas a algo que no es una función. ¿Existe esa función con ese nombre exacto?`],
  type: (e, src) => [`Hay un problema de tipos en la línea ${e.line}: ${quote(src || '')}. ¿Qué tipo tiene cada parte de la expresión?`, e.hint || '¿Qué conversión necesitarías?'],
};

/**
 * @returns {{ mood: 'think'|'alert'|'happy'|'zen', title: string, questions: string[], focus?: string }}
 */
export function askDuck({ ch, lang, code, evaluation }) {
  const lines = code.split('\n');
  if (!evaluation) {
    return { mood: 'zen', title: 'Cuack. Estoy escuchando.', questions: ['Antes de escribir nada: ¿qué debería pasar en el mundo cuando tu código funcione?', '¿Qué datos tienes y qué datos necesitas producir?'] };
  }
  const { error, checks, lint } = evaluation;
  if (error) {
    const gen = BY_ERROR[error.code] || BY_ERROR[error.kind] || BY_ERROR.syntax;
    const src = error.line ? lines[error.line - 1] : '';
    const qs = gen(error, src).filter(Boolean);
    const first = checks && checks.find((c) => !c.ok);
    if (first && ch.duck && ch.duck[first.id]) qs.push(...ch.duck[first.id].slice(0, 1));
    return { mood: 'alert', title: error.kind === 'runtime' ? 'Glitch en tiempo de ejecución' : 'El compilador no está contento', questions: qs, focus: error.line };
  }
  const failing = (checks || []).filter((c) => !c.ok);
  if (failing.length) {
    const f = failing[0];
    const qs = [...((ch.duck && ch.duck[f.id]) || [`El check ${quote(f.label)} no se cumple. ¿Qué parte de tu código es responsable de eso?`])];
    if (f.detail) qs.splice(1, 0, `El motor observa: ${f.detail}. ¿Es lo que esperabas?`);
    if (ch.boss && loopNesting(code, lang) >= 2) qs.unshift('Veo dos bucles anidados. Por cada elemento recorres otra vez todos los demás… ¿cuánto trabajo es eso si hay 1600?');
    return { mood: 'think', title: `Hmm… «${f.label}»`, questions: qs };
  }
  if (lint && lint.length) {
    const w = lint[0];
    return {
      mood: 'think',
      title: 'Funciona. ¿Pero lo entendería otra persona?',
      questions: [`Línea ${w.line}: ${w.msg} ¿Por qué crees que existe esa convención en ${LANGUAGES[lang].name}?`, 'El código se lee muchas más veces de las que se escribe. ¿Qué cambiarías para que se lea mejor?'],
      focus: w.line,
    };
  }
  return {
    mood: 'happy',
    title: '¡Cuack cuack! El mundo funciona.',
    questions: ['Explícamelo como si yo fuera un pato: ¿por qué funciona tu solución?', '¿Cómo lo resolverías en otro lenguaje? Mira la pestaña Polyglot.'],
  };
}

/** Respuesta reflexiva cuando el usuario «le explica» su código al pato. */
export function reflect(text, evaluation) {
  const t = text.trim();
  if (!t) return 'Cuéntame paso a paso qué hace tu código, línea a línea.';
  const words = t.toLowerCase();
  const failing = evaluation && evaluation.checks ? evaluation.checks.find((c) => !c.ok) : null;
  if (/no s[eé]|ni idea|perdid|no entiendo/.test(words)) {
    return 'Vale, vamos a lo pequeño: ¿qué hace la PRIMERA línea de tu código? Solo esa.';
  }
  if (/bucle|loop|for|while|vuelta/.test(words)) {
    return `Hablas del bucle. ¿Cuántas vueltas exactas da, y qué vale la variable en la primera y en la última?${failing ? ` ¿Cómo encaja eso con «${failing.label}»?` : ''}`;
  }
  if (/tipo|int|double|float|string|long/.test(words)) return '¿Y qué rango de valores admite ese tipo? ¿Cabe todo lo que le metes?';
  if (/índice|indice|posici|array|lista/.test(words)) return 'Si la lista tiene n elementos, ¿qué índices existen? Dime el primero y el último.';
  if (/memoria|malloc|free|puntero/.test(words)) return 'Dibuja los bloques en un papel: ¿cuántos pides, cuántos devuelves, y cuándo usas cada uno?';
  if (/clase|hereda|padre|hija|override/.test(words)) return '¿Qué método llama el motor en cada frame? ¿Qué versión de ese método ejecuta cada clase?';
  if (/hilo|thread|async|await|concurr|paralel/.test(words)) return '¿En qué momento exacto esperas? ¿Antes o después de lanzar todas las tareas?';
  const fragment = t.split(/[.,;]/)[0].slice(0, 60);
  return `Dices «${fragment}». ¿Y cómo lo comprobarías? ¿Qué valor concreto esperas ver en la consola?`;
}
