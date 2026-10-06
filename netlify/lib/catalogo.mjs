/**
 * Ciclos y módulos de la plataforma.
 * El alumno elige ciclo → módulo → tema (examen).
 *
 * Para añadir un ciclo o un módulo, añádelo aquí. El `id` va en la URL:
 * usa minúsculas sin espacios y no lo cambies una vez haya exámenes subidos.
 */
export const CATALOGO = [
  {
    id: "asir",
    nombre: "ASIR",
    descripcion: "Administración de Sistemas Informáticos en Red",
    modulos: [
      { id: "sad", nombre: "Seguridad y Alta Disponibilidad" },
    ],
  },
  {
    id: "dam",
    nombre: "DAM",
    descripcion: "Desarrollo de Aplicaciones Multiplataforma",
    modulos: [
      { id: "ia", nombre: "Inteligencia Artificial" },
    ],
  },
];

export function buscarModulo(cicloId, moduloId) {
  const ciclo = CATALOGO.find((c) => c.id === cicloId);
  const modulo = ciclo?.modulos.find((m) => m.id === moduloId);
  return ciclo && modulo ? { ciclo, modulo } : null;
}

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Para exámenes antiguos o importados sin ids: busca el módulo por nombre. */
export function moduloPorNombre(cicloNombre, moduloNombre) {
  for (const c of CATALOGO) {
    if (cicloNombre && norm(c.nombre) !== norm(cicloNombre) && norm(c.id) !== norm(cicloNombre)) continue;
    const m = c.modulos.find((m) => norm(m.nombre) === norm(moduloNombre) || norm(m.id) === norm(moduloNombre));
    if (m) return { ciclo: c, modulo: m };
  }
  return null;
}

/** Cursos de cada ciclo. Los grupos del registro salen de aquí: «1.º ASIR», «2.º DAM»… */
export const CURSOS = ["1.º", "2.º"];

export const GRUPOS = () =>
  CATALOGO.flatMap((c) => CURSOS.map((k) => ({ grupo: `${k} ${c.nombre}`, cicloId: c.id })));

/** Ciclo al que pertenece un grupo escrito a mano («1º asir», «2 DAM»…), o null. */
export function cicloDeGrupo(grupo) {
  const palabras = norm(grupo).split(/[^a-z0-9]+/);
  return CATALOGO.find((c) => palabras.includes(norm(c.nombre)) || palabras.includes(c.id))?.id || null;
}

/** Ciclo de un alumno: el guardado o, en cuentas antiguas, el deducido de su grupo. */
export const cicloDe = (u) => u?.cicloId || cicloDeGrupo(u?.grupo);
