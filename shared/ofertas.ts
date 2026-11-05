import { config } from '../config/ffe.config';
import type { Oferta } from './schemas';
import { contieneTermino, normalizar } from './texto';

/** Oferta tal y como sale de un adaptador de fuente, antes de clasificar. */
export interface OfertaBruta {
  fuente: string;
  idFuente: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  url: string;
  fechaPublicacion: string;
  fechaCaducidad?: string;
  descripcion?: string;
  /** Pista de jornada en texto libre (p. ej. "full_time", "Jornada completa"). */
  jornada?: string;
  /** Pista de tipo de contrato en texto libre (p. ej. "Prácticas", "internship"). */
  contrato?: string;
  /** Pista de experiencia mínima (p. ej. "Al menos 3 años"). */
  experiencia?: string;
}

const TERMINOS_PRACTICAS = ['practicas', 'practica', 'becario', 'becaria', 'intern', 'internship', 'interns', 'trainee', 'fct', 'ffe', 'formacion en empresa', 'formacion dual', 'fp dual', 'estudiante', 'estudiantes', 'stage', 'prácticas'];
const TERMINOS_BECA = ['beca', 'becas', 'scholarship', 'graduate program', 'programa graduados'];
const TERMINOS_JUNIOR = ['junior', 'jr', 'jr.', 'entry level', 'entry-level', 'graduate', 'recien titulado', 'recien graduado', 'sin experiencia', 'primer empleo', 'early career'];
const TERMINOS_SENIOR = ['senior', 'sr', 'sr.', 'lead', 'principal', 'head', 'manager', 'director', 'directora', 'jefe', 'jefa', 'arquitecto', 'arquitecta', 'architect', 'staff', 'expert', 'experto', 'experta', 'mid', 'semi senior', 'semisenior', 'ssr', 'tech lead', 'responsable', 'coordinador', 'coordinadora', 'vp', 'cto', 'ciso'];
/** Términos que indican que la oferta NO es del sector informático. */
const TERMINOS_TIC = ['informatica', 'informatico', 'desarrollador', 'desarrolladora', 'developer', 'programador', 'programadora', 'software', 'sistemas', 'redes', 'it', 'tic', 'ciberseguridad', 'cloud', 'devops', 'datos', 'data', 'soporte', 'helpdesk', 'web', 'backend', 'frontend', 'full stack', 'fullstack', 'sql', 'python', 'java', 'javascript', 'android', 'unity', 'sap', 'erp', 'qa', 'tester', 'dam', 'asir', 'daw', 'smr'];

/** Años mínimos de experiencia pedidos (0 si no se detectan). */
export function aniosExperiencia(texto: string): number {
  const t = normalizar(texto);
  const m = t.match(/(?:al menos|minimo|mas de|\+)\s*(\d{1,2})\s*anos?/) ?? t.match(/(\d{1,2})\+?\s*anos? de experiencia/) ?? t.match(/(\d{1,2})\+?\s*years?/);
  return m ? Number(m[1]) : 0;
}

export function esSenior(titulo: string, extra = ''): boolean {
  const t = normalizar(titulo);
  if (TERMINOS_SENIOR.some((s) => contieneTermino(t, s))) return true;
  return aniosExperiencia(`${titulo} ${extra}`) >= 3;
}

export function esDelSectorTic(texto: string): boolean {
  const t = normalizar(texto);
  return TERMINOS_TIC.some((s) => contieneTermino(t, s));
}

/** Clasifica el tipo de oferta. `null` si no es de prácticas, beca, junior ni primer empleo. */
export function clasificarTipo(o: Pick<OfertaBruta, 'titulo' | 'descripcion' | 'contrato' | 'experiencia'>): Oferta['tipo'] | null {
  const titulo = normalizar(o.titulo);
  const todo = normalizar(`${o.titulo} ${o.contrato ?? ''} ${o.descripcion ?? ''}`);
  const cabecera = normalizar(`${o.titulo} ${o.contrato ?? ''}`);
  if (TERMINOS_PRACTICAS.some((s) => contieneTermino(cabecera, s))) return 'practicas';
  if (TERMINOS_BECA.some((s) => contieneTermino(cabecera, s))) return 'beca';
  if (TERMINOS_JUNIOR.some((s) => contieneTermino(titulo, s))) return 'junior';
  const exp = normalizar(o.experiencia ?? '');
  if (/sin experiencia|no requerida/.test(exp) || contieneTermino(todo, 'sin experiencia') || contieneTermino(todo, 'primer empleo')) {
    return 'primer-empleo';
  }
  if (contieneTermino(todo, 'practicas') || contieneTermino(todo, 'internship')) return 'practicas';
  return null;
}

export function detectarPerfiles(texto: string): string[] {
  const t = normalizar(texto);
  return config.perfiles.filter((p) => p.palabrasClave.some((k) => contieneTermino(t, k))).map((p) => p.id);
}

export function detectarJornada(pista: string | undefined, texto = ''): Oferta['jornada'] {
  const t = normalizar(`${pista ?? ''} ${texto}`);
  if (/part[_ -]?time|parcial|media jornada/.test(t)) return 'parcial';
  if (/full[_ -]?time|completa|jornada completa/.test(t)) return 'completa';
  return 'desconocida';
}

export function esRemoto(texto: string): boolean {
  const t = normalizar(texto);
  return /\b(remoto|remote|teletrabajo|hibrido|hybrid)\b/.test(t);
}

function aIso(fecha: string): string | null {
  const d = new Date(fecha);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function estaCaducada(o: { fechaPublicacion: string; fechaCaducidad?: string }, ahora = new Date()): boolean {
  if (o.fechaCaducidad && new Date(o.fechaCaducidad) < ahora) return true;
  const limite = new Date(ahora.getTime() - config.diasMaximosOferta * 864e5);
  return new Date(o.fechaPublicacion) < limite;
}

/** Clave para detectar duplicados entre fuentes: empresa + título normalizados. */
export function claveDuplicado(o: { empresa: string; titulo: string }): string {
  const limpiar = (s: string) =>
    normalizar(s)
      .replace(/\b(s\.?l\.?u?|s\.?a\.?u?|sociedad limitada|sociedad anonima|spain|espana|group|grupo)\b/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  return `${limpiar(o.empresa)}|${limpiar(o.titulo)}`;
}

export interface ResultadoNormalizacion {
  ofertas: Oferta[];
  descartadas: { senior: number; caducadas: number; noTic: number; tipo: number; invalidas: number; duplicadas: number };
}

/**
 * Convierte ofertas brutas de cualquier fuente en ofertas normalizadas:
 * excluye senior, caducadas, fuera del sector TIC y las que no son prácticas/beca/junior/primer empleo,
 * y elimina duplicados (se queda con la publicada más recientemente).
 */
export function normalizarOfertas(brutas: OfertaBruta[], ahora = new Date()): ResultadoNormalizacion {
  const d = { senior: 0, caducadas: 0, noTic: 0, tipo: 0, invalidas: 0, duplicadas: 0 };
  const porClave = new Map<string, Oferta>();

  for (const b of brutas) {
    const fechaPublicacion = aIso(b.fechaPublicacion);
    const fechaCaducidad = b.fechaCaducidad ? aIso(b.fechaCaducidad) ?? undefined : undefined;
    if (!fechaPublicacion || !b.titulo?.trim() || !/^https?:\/\//.test(b.url)) {
      d.invalidas++;
      continue;
    }
    const textoCompleto = `${b.titulo} ${b.descripcion ?? ''}`;
    if (esSenior(b.titulo, `${b.experiencia ?? ''} ${b.descripcion ?? ''}`)) {
      d.senior++;
      continue;
    }
    if (estaCaducada({ fechaPublicacion, fechaCaducidad }, ahora)) {
      d.caducadas++;
      continue;
    }
    if (!esDelSectorTic(textoCompleto)) {
      d.noTic++;
      continue;
    }
    const tipo = clasificarTipo(b);
    if (!tipo) {
      d.tipo++;
      continue;
    }
    const oferta: Oferta = {
      id: `${b.fuente}:${b.idFuente}`,
      titulo: b.titulo.trim(),
      empresa: b.empresa.trim() || 'Empresa no indicada',
      ubicacion: b.ubicacion.trim() || 'No indicada',
      remoto: esRemoto(`${b.titulo} ${b.ubicacion}`),
      jornada: detectarJornada(b.jornada, b.titulo),
      tipo,
      perfiles: detectarPerfiles(textoCompleto),
      fuente: b.fuente,
      url: b.url,
      fechaPublicacion,
      ...(fechaCaducidad ? { fechaCaducidad } : {}),
      ...(b.descripcion ? { resumen: b.descripcion.slice(0, 400) } : {}),
    };
    const clave = claveDuplicado(oferta);
    const previa = porClave.get(clave);
    if (previa) {
      d.duplicadas++;
      if (new Date(oferta.fechaPublicacion) > new Date(previa.fechaPublicacion)) porClave.set(clave, oferta);
      continue;
    }
    porClave.set(clave, oferta);
  }

  const ofertas = [...porClave.values()].sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion));
  return { ofertas, descartadas: d };
}
