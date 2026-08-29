import type { Resultado, TestProgreso } from '../types';

/**
 * Persistencia local. Todo pasa por aqui para que ningun componente toque
 * localStorage directamente y para que un fallo de almacenamiento (modo
 * incognito, cuota llena, cookies bloqueadas) nunca tumbe la aplicacion.
 */

const CLAVE_PROGRESO = 'orientafp.progreso';
const CLAVE_RESULTADO = 'orientafp.resultado';
const CLAVE_VERSION = 'orientafp.version';
export const CLAVE_TEMA = 'orientafp.theme';

/**
 * Se incrementa cuando cambia la forma de los datos guardados (nuevas
 * preguntas, nuevos campos del resultado). Si no coincide, se descarta lo
 * guardado en lugar de intentar pintar un objeto incompleto.
 */
const SCHEMA_VERSION = 1;

function almacenamientoDisponible(): boolean {
  try {
    const prueba = '__orientafp_test__';
    window.localStorage.setItem(prueba, '1');
    window.localStorage.removeItem(prueba);
    return true;
  } catch {
    return false;
  }
}

const DISPONIBLE = typeof window !== 'undefined' && almacenamientoDisponible();

function versionValida(): boolean {
  try {
    const guardada = parseInt(window.localStorage.getItem(CLAVE_VERSION) ?? '0', 10);
    if (guardada === SCHEMA_VERSION) return true;

    // Version distinta o primera visita: limpiamos y sellamos la actual.
    window.localStorage.removeItem(CLAVE_PROGRESO);
    window.localStorage.removeItem(CLAVE_RESULTADO);
    window.localStorage.setItem(CLAVE_VERSION, String(SCHEMA_VERSION));
    return false;
  } catch {
    return false;
  }
}

function leer<T>(clave: string): T | null {
  if (!DISPONIBLE || !versionValida()) return null;

  try {
    const crudo = window.localStorage.getItem(clave);
    if (!crudo) return null;
    return JSON.parse(crudo) as T;
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: unknown): void {
  if (!DISPONIBLE) return;

  try {
    window.localStorage.setItem(CLAVE_VERSION, String(SCHEMA_VERSION));
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Cuota agotada o almacenamiento bloqueado: la sesion sigue en memoria.
  }
}

function borrar(clave: string): void {
  if (!DISPONIBLE) return;
  try {
    window.localStorage.removeItem(clave);
  } catch {
    /* nada que hacer */
  }
}

/* ---------- Progreso del test en curso ---------- */

/** Valida la forma minima antes de devolver algo que la UI dara por bueno. */
function esProgresoValido(valor: unknown): valor is TestProgreso {
  if (typeof valor !== 'object' || valor === null) return false;
  const p = valor as Partial<TestProgreso>;
  return typeof p.paso === 'number' && typeof p.respuestas === 'object' && p.respuestas !== null;
}

export function cargarProgreso(): TestProgreso | null {
  const valor = leer<unknown>(CLAVE_PROGRESO);
  return esProgresoValido(valor) ? valor : null;
}

export function guardarProgreso(progreso: TestProgreso): void {
  escribir(CLAVE_PROGRESO, progreso);
}

export function borrarProgreso(): void {
  borrar(CLAVE_PROGRESO);
}

/* ---------- Ultimo resultado calculado ---------- */

function esResultadoValido(valor: unknown): valor is Resultado {
  if (typeof valor !== 'object' || valor === null) return false;
  const r = valor as Partial<Resultado>;
  return (
    Array.isArray(r.familias) &&
    Array.isArray(r.ciclos) &&
    typeof r.dimensiones === 'object' &&
    r.dimensiones !== null &&
    typeof r.fecha === 'string'
  );
}

export function cargarResultado(): Resultado | null {
  const valor = leer<unknown>(CLAVE_RESULTADO);
  return esResultadoValido(valor) ? valor : null;
}

export function guardarResultado(resultado: Resultado): void {
  escribir(CLAVE_RESULTADO, resultado);
}

export function borrarResultado(): void {
  borrar(CLAVE_RESULTADO);
}

/* ---------- Tema ---------- */

export function cargarTema(): 'light' | 'dark' | null {
  if (!DISPONIBLE) return null;
  try {
    const valor = window.localStorage.getItem(CLAVE_TEMA);
    return valor === 'light' || valor === 'dark' ? valor : null;
  } catch {
    return null;
  }
}

export function guardarTema(tema: 'light' | 'dark'): void {
  if (!DISPONIBLE) return;
  try {
    window.localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    /* el tema se queda solo en esta sesion */
  }
}
