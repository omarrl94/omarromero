/**
 * Ciclos y módulos de la plataforma.
 * El alumno elige ciclo → módulo → tema (examen).
 *
 * Los CICLOS se definen aquí (el `id` va en la URL y en los datos guardados:
 * no lo cambies una vez haya alumnos o exámenes). Los MÓDULOS de cada ciclo
 * los crean el administrador y los profesores desde el panel (se guardan en
 * el almacén «sistema»); los que hay aquí abajo vienen de serie.
 *
 * Cada módulo es de uno o varios cursos (`grupos`: «1.º ASIR», «2.º ASIR»…).
 * El alumno solo ve los módulos de su curso. Sin `grupos` = todos los cursos.
 */
import { almacen } from "./almacen.mjs";

const CICLOS = [
  { id: "sea", nombre: "SEA", grado: "GS", descripcion: "Sistemas Electrotécnicos y Automatizados",
    modulos: [{ id: "fundamentos-electricidad", nombre: "Fundamentos de la Electricidad", grupos: ["1.º SEA"] }] },
  { id: "dam", nombre: "DAM", grado: "GS", descripcion: "Desarrollo de Aplicaciones Multiplataforma",
    modulos: [{ id: "ia", nombre: "Inteligencia Artificial" }] },
  { id: "asir", nombre: "ASIR", grado: "GS", descripcion: "Administración de Sistemas Informáticos en Red",
    modulos: [{ id: "sad", nombre: "Seguridad y Alta Disponibilidad", grupos: ["2.º ASIR"] }] },
  { id: "daw", nombre: "DAW", grado: "GS", descripcion: "Desarrollo de Aplicaciones Web", modulos: [] },
  { id: "iea", nombre: "IEA", grado: "GM", descripcion: "Instalaciones Eléctricas y Automáticas", modulos: [] },
  { id: "comercio", nombre: "Comercio", grado: "GM", descripcion: "Actividades Comerciales", modulos: [] },
  { id: "gestionadm", nombre: "Gestión Adm.", grado: "GM", descripcion: "Gestión Administrativa", modulos: [] },
  { id: "ayf", nombre: "AYF", grado: "GS", descripcion: "Administración y Finanzas", modulos: [] },
  // Automoción: agrupa todos los ciclos de automoción de grado medio y superior.
  { id: "aut", nombre: "AUT", grado: "GM y GS", descripcion: "Automoción", modulos: [],
    grupos: ["1.º AUT (GM)", "2.º AUT (GM)", "1.º AUT (GS)", "2.º AUT (GS)"] },
];

/**
 * Catálogo vivo: ciclos + módulos (los de serie y los creados desde el panel).
 * La API llama a `cargarModulos()` al empezar cada petición.
 */
export const CATALOGO = CICLOS.map((c) => ({ ...c, modulos: [...c.modulos] }));

const MODULOS = "modulos"; // clave en «sistema»: { [cicloId]: [{ id, nombre, grupos }] }
const CURSOS_MODULOS = "modulos-cursos"; // cursos cambiados en los módulos de serie: { "ciclo/modulo": [grupos] }
const NOMBRES_MODULOS = "modulos-nombres"; // nombres cambiados desde el panel: { "ciclo/modulo": nombre }

export async function cargarModulos() {
  const sis = almacen("sistema");
  const [extra, cursos, nombres] = await Promise.all([sis.get(MODULOS), sis.get(CURSOS_MODULOS), sis.get(NOMBRES_MODULOS)]);
  for (const c of CATALOGO) {
    const base = CICLOS.find((x) => x.id === c.id).modulos;
    c.modulos = [...base, ...((extra || {})[c.id] || []).filter((m) => !base.some((b) => b.id === m.id)).map((m) => ({ ...m, propio: true }))]
      .map((m) => ({ ...m, nombre: (nombres || {})[`${c.id}/${m.id}`] || m.nombre, grupos: (cursos || {})[`${c.id}/${m.id}`] ?? m.grupos ?? [] }));
  }
}

/**
 * Cambia el nombre de un módulo (de serie o creado desde el panel).
 * El identificador no cambia, así que exámenes y entregas siguen asociados.
 */
export async function renombrarModulo(cicloId, moduloId, nombre) {
  const ubic = buscarModulo(cicloId, moduloId);
  if (!ubic) return null;
  if (ubic.ciclo.modulos.some((m) => m.id !== moduloId && norm(m.nombre) === norm(nombre))) return { repetido: true };
  const sis = almacen("sistema");
  const nombres = (await sis.get(NOMBRES_MODULOS)) || {};
  nombres[`${cicloId}/${moduloId}`] = nombre;
  await sis.set(NOMBRES_MODULOS, nombres);
  await cargarModulos();
  return { nombre };
}

/** Grupos (cursos) de un ciclo: «1.º ASIR», «2.º ASIR»… */
export const gruposDeCiclo = (c) => c?.grupos || CURSOS.map((k) => `${k} ${c.nombre}`);

/** Solo grupos válidos de ese ciclo; todos marcados = lista vacía (todos los cursos). */
function limpiarGrupos(ciclo, grupos) {
  const validos = gruposDeCiclo(ciclo);
  const g = validos.filter((x) => (Array.isArray(grupos) ? grupos : []).includes(x));
  return g.length === validos.length ? [] : g;
}

/** Cambia los cursos de un módulo (de serie o creado desde el panel). */
export async function cursosModulo(cicloId, moduloId, grupos) {
  const ubic = buscarModulo(cicloId, moduloId);
  if (!ubic) return null;
  const g = limpiarGrupos(ubic.ciclo, grupos);
  const sis = almacen("sistema");
  const cursos = (await sis.get(CURSOS_MODULOS)) || {};
  cursos[`${cicloId}/${moduloId}`] = g;
  await sis.set(CURSOS_MODULOS, cursos);
  await cargarModulos();
  return g;
}

/**
 * ¿Ve el alumno este módulo? Sí si el módulo es de todos los cursos, si es
 * de su grupo, o si su grupo no es uno de la lista (cuentas antiguas).
 */
export function moduloVisible(cicloId, moduloId, u) {
  const ubic = buscarModulo(cicloId, moduloId);
  if (!ubic) return false;
  const g = ubic.modulo.grupos || [];
  return !g.length || g.includes(u?.grupo) || !gruposDeCiclo(ubic.ciclo).includes(u?.grupo);
}

const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** Crea un módulo en un ciclo. Devuelve el módulo (o el existente con ese nombre). */
export async function crearModulo(cicloId, nombre, grupos) {
  const sis = almacen("sistema");
  const extra = (await sis.get(MODULOS)) || {};
  const ciclo = CATALOGO.find((c) => c.id === cicloId);
  const existente = ciclo.modulos.find((m) => norm(m.nombre) === norm(nombre));
  if (existente) return existente;
  let id = slug(nombre) || "modulo", n = 2;
  while (ciclo.modulos.some((m) => m.id === id)) id = `${slug(nombre)}-${n++}`;
  const m = { id, nombre, grupos: limpiarGrupos(ciclo, grupos) };
  extra[cicloId] = [...(extra[cicloId] || []), m];
  await sis.set(MODULOS, extra);
  await cargarModulos();
  return m;
}

/** Borra un módulo creado desde el panel (los de serie no se pueden borrar). */
export async function borrarModulo(cicloId, moduloId) {
  const sis = almacen("sistema");
  const extra = (await sis.get(MODULOS)) || {};
  extra[cicloId] = (extra[cicloId] || []).filter((m) => m.id !== moduloId);
  await sis.set(MODULOS, extra);
  await cargarModulos();
}

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
  CATALOGO.flatMap((c) => gruposDeCiclo(c).map((grupo) => ({ grupo, cicloId: c.id })));

/** Ciclo al que pertenece un grupo escrito a mano («1º asir», «2 DAM»…), o null. */
export function cicloDeGrupo(grupo) {
  const palabras = norm(grupo).split(/[^a-z0-9]+/);
  return CATALOGO.find((c) => palabras.includes(norm(c.nombre)) || palabras.includes(c.id))?.id || null;
}

/** Ciclo de un alumno: el guardado o, en cuentas antiguas, el deducido de su grupo. */
export const cicloDe = (u) => u?.cicloId || cicloDeGrupo(u?.grupo);
