import { idiom } from '../core/languages.js';

export const check = (id, label, ok, detail = '') => ({ id, label, ok: !!ok, detail });

/** Busca la función de entrada respetando el estilo de nombres de cada lenguaje. */
export function entry(ctx, name) {
  const fn = ctx.fns[idiom(name, ctx.lang)] || ctx.fns[name];
  if (typeof fn !== 'function') {
    const n = idiom(name, ctx.lang);
    throw Object.assign(new ReferenceError(`${n} is not defined`), { hint: `La misión necesita una función llamada «${n}».` });
  }
  return fn;
}

/** Variable declarada por el usuario (acepta camelCase o snake_case). */
export const v = (result, name, lang) => (result && result.vars ? result.vars[idiom(name, lang)] || result.vars[name] : undefined);

export const names = (lang, ...ns) => ns.map((n) => idiom(n, lang));
