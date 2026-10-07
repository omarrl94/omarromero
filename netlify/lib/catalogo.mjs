/**
 * Centro, ciclos y módulos de la plataforma.
 * El alumno elige ciclo → módulo → tema (examen).
 *
 * Todo se configura desde el panel: el administrador pone el nombre del
 * centro y crea sus ciclos (pestaña «Centro»); el administrador y los
 * profesores crean los módulos de sus ciclos. Se guarda en el almacén
 * «sistema». El `id` de cada ciclo y módulo se genera al crearlo y no cambia.
 */
import { almacen } from "./almacen.mjs";
import { env } from "./http.mjs";

const CICLOS = "ciclos";   // clave en «sistema»: [{ id, nombre, grado, descripcion, grupos? }]
const MODULOS = "modulos"; // clave en «sistema»: { [cicloId]: [{ id, nombre }] }
const CENTRO = "centro";   // clave en «sistema»: { nombre }

/**
 * Catálogo vivo: ciclos + módulos. La API llama a `cargarCatalogo()` al
 * empezar cada petición; el array se actualiza en el sitio.
 */
export const CATALOGO = [];
let centro = {};

export async function cargarCatalogo() {
  const sis = almacen("sistema");
  const [ciclos, modulos, c] = await Promise.all([sis.get(CICLOS), sis.get(MODULOS), sis.get(CENTRO)]);
  centro = c || {};
  CATALOGO.splice(0, CATALOGO.length, ...(ciclos || []).map((x) => ({ ...x, modulos: (modulos || {})[x.id] || [] })));
}

/** Nombre del centro: el del panel, NOMBRE_CENTRO o «evalua-T». */
export const nombreCentro = () => centro.nombre || env("NOMBRE_CENTRO") || "evalua-T";

export async function guardarCentro(datos) {
  centro = { ...centro, ...datos };
  await almacen("sistema").set(CENTRO, centro);
}

const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const idLibre = (base, usados) => { let id = base, n = 2; while (usados.includes(id)) id = `${base}-${n++}`; return id; };
const datosCiclo = ({ id, nombre, grado, descripcion, grupos }) => ({ id, nombre, grado, descripcion, ...(grupos?.length ? { grupos } : {}) });

/* ── Ciclos (solo el administrador) ───────────────────────── */
export async function crearCiclo(datos) {
  if (CATALOGO.some((c) => norm(c.nombre) === norm(datos.nombre))) return null;
  const id = idLibre(slug(datos.nombre) || "ciclo", CATALOGO.map((c) => c.id));
  await almacen("sistema").set(CICLOS, [...CATALOGO.map(datosCiclo), datosCiclo({ ...datos, id })]);
  await cargarCatalogo();
  return CATALOGO.find((c) => c.id === id);
}

export async function editarCiclo(id, datos) {
  await almacen("sistema").set(CICLOS, CATALOGO.map((c) => datosCiclo(c.id === id ? { ...datos, id } : c)));
  await cargarCatalogo();
}

export async function borrarCiclo(id) {
  const sis = almacen("sistema");
  const modulos = (await sis.get(MODULOS)) || {};
  delete modulos[id];
  await sis.set(MODULOS, modulos);
  await sis.set(CICLOS, CATALOGO.filter((c) => c.id !== id).map(datosCiclo));
  await cargarCatalogo();
}

/* ── Módulos (administrador y profesores de ese ciclo) ────── */
/** Crea un módulo en un ciclo. Devuelve el módulo (o el existente con ese nombre). */
export async function crearModulo(cicloId, nombre) {
  const sis = almacen("sistema");
  const extra = (await sis.get(MODULOS)) || {};
  const ciclo = CATALOGO.find((c) => c.id === cicloId);
  const existente = ciclo.modulos.find((m) => norm(m.nombre) === norm(nombre));
  if (existente) return existente;
  const m = { id: idLibre(slug(nombre) || "modulo", ciclo.modulos.map((x) => x.id)), nombre };
  extra[cicloId] = [...(extra[cicloId] || []), m];
  await sis.set(MODULOS, extra);
  await cargarCatalogo();
  return m;
}

export async function borrarModulo(cicloId, moduloId) {
  const sis = almacen("sistema");
  const extra = (await sis.get(MODULOS)) || {};
  extra[cicloId] = (extra[cicloId] || []).filter((m) => m.id !== moduloId);
  await sis.set(MODULOS, extra);
  await cargarCatalogo();
}

export function buscarModulo(cicloId, moduloId) {
  const ciclo = CATALOGO.find((c) => c.id === cicloId);
  const modulo = ciclo?.modulos.find((m) => m.id === moduloId);
  return ciclo && modulo ? { ciclo, modulo } : null;
}

/** Para exámenes importados sin ids: busca el módulo por nombre. */
export function moduloPorNombre(cicloNombre, moduloNombre) {
  for (const c of CATALOGO) {
    if (cicloNombre && norm(c.nombre) !== norm(cicloNombre) && norm(c.id) !== norm(cicloNombre)) continue;
    const m = c.modulos.find((m) => norm(m.nombre) === norm(moduloNombre) || norm(m.id) === norm(moduloNombre));
    if (m) return { ciclo: c, modulo: m };
  }
  return null;
}

/** Cursos por defecto de cada ciclo: «1.º DAM», «2.º DAM»… (un ciclo puede definir sus `grupos`). */
export const CURSOS = ["1.º", "2.º"];

export const gruposDeCiclo = (c) => (c.grupos?.length ? c.grupos : CURSOS.map((k) => `${k} ${c.nombre}`));

export const GRUPOS = () => CATALOGO.flatMap((c) => gruposDeCiclo(c).map((grupo) => ({ grupo, cicloId: c.id })));

/** Ciclo al que pertenece un grupo escrito a mano («1º daw», «2 DAM»…), o null. */
export function cicloDeGrupo(grupo) {
  const g = GRUPOS().find((x) => norm(x.grupo) === norm(grupo));
  if (g) return g.cicloId;
  const palabras = norm(grupo).split(/[^a-z0-9]+/);
  return CATALOGO.find((c) => palabras.includes(norm(c.nombre)) || palabras.includes(c.id))?.id || null;
}

/** Ciclo de un alumno: el guardado o, en cuentas antiguas, el deducido de su grupo. */
export const cicloDe = (u) => u?.cicloId || cicloDeGrupo(u?.grupo);
