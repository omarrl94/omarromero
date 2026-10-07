/** /api/admin/* — solo el administrador (ADMIN_EMAILS): datos del centro, ciclos y aprobación de profesores. */
import { almacen, leerTodas } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto } from "./http.mjs";
import { requiereAdmin, esAdmin, rolDe } from "./auth.mjs";
import { CATALOGO, GRUPOS, cicloDe, gruposDeCiclo, crearCiclo, editarCiclo, borrarCiclo, nombreCentro, guardarCentro } from "./catalogo.mjs";
import { todosLosExamenes } from "./examenes.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { correoAviso } from "./plantillas.mjs";

const usuarios = () => almacen("usuarios");

async function profesores(req) {
  await requiereAdmin(req);
  const lista = (await leerTodas(usuarios(), await usuarios().list())).filter((u) => u.rol === "profesor" && !esAdmin(u.email));
  return json({
    ciclos: CATALOGO.map(({ id, nombre, grado, descripcion }) => ({ id, nombre, grado, descripcion })),
    profesores: lista
      .map((u) => ({ email: u.email, nombre: u.nombre, apellidos: u.apellidos, ciclos: u.ciclos || [], aprobado: !!u.aprobado, verificado: !!u.verificado, creado: u.creado }))
      .sort((a, b) => Number(a.aprobado) - Number(b.aprobado) || `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, "es")),
  });
}

async function editarProfesor(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  const u = await usuarios().get(String(b.email || "").toLowerCase());
  if (!u || u.rol !== "profesor") fallo(404, "Profesor no encontrado");
  if (Array.isArray(b.ciclos)) {
    const ids = CATALOGO.map((c) => c.id);
    u.ciclos = [...new Set(b.ciclos.filter((c) => ids.includes(c)))];
  }
  const recienAprobado = b.aprobado === true && !u.aprobado;
  if (typeof b.aprobado === "boolean") {
    if (b.aprobado && !(u.ciclos || []).length) fallo(400, "Asígnale al menos un ciclo antes de aprobarlo");
    u.aprobado = b.aprobado;
    if (b.aprobado) { u.verificado = true; delete u.codigo; }
  }
  await usuarios().set(u.email, u);

  if (recienAprobado && proveedorConfigurado()) {
    const nombres = CATALOGO.filter((c) => u.ciclos.includes(c.id)).map((c) => c.nombre).join(", ");
    const c = correoAviso(u.nombre, "Ya tienes acceso de profesor",
      `El administrador ha aprobado tu cuenta de profesor para: ${nombres}. Ya puedes entrar en la plataforma y crear exámenes desde el panel del profesor.`);
    enviarCorreo({ to: u.email, subject: c.asunto, html: c.html, text: c.text }).catch((e) => console.error("Aviso de aprobación:", e));
  }
  return json({ ok: true });
}

async function borrarProfesor(req) {
  await requiereAdmin(req);
  const email = String((await leerCuerpo(req)).email || "").toLowerCase();
  const u = await usuarios().get(email);
  if (!u || rolDe(u) === "admin" || u.rol !== "profesor") fallo(404, "Profesor no encontrado");
  await usuarios().del(email);
  return json({ ok: true });
}

/* ── Centro y ciclos ──────────────────────────────────────── */
const cicloPublico = (c) => ({ id: c.id, nombre: c.nombre, grado: c.grado || "", descripcion: c.descripcion || "",
  grupos: gruposDeCiclo(c), gruposPropios: !!c.grupos?.length, modulos: c.modulos });

async function centro(req) {
  await requiereAdmin(req);
  return json({ nombre: nombreCentro(), ciclos: CATALOGO.map(cicloPublico) });
}

async function guardarNombreCentro(req) {
  await requiereAdmin(req);
  const nombre = texto((await leerCuerpo(req)).nombre, 120);
  if (!nombre) fallo(400, "Escribe el nombre del centro");
  await guardarCentro({ nombre });
  return json({ ok: true, nombre });
}

/** Lee y valida los datos de un ciclo. `id` es el del ciclo que se edita (o null al crearlo). */
function leerCiclo(b, id) {
  const nombre = texto(b.nombre, 40);
  if (!nombre) fallo(400, "Escribe el nombre corto del ciclo (p. ej. DAM)");
  const grupos = [...new Set((Array.isArray(b.grupos) ? b.grupos : String(b.grupos || "").split(","))
    .map((g) => texto(g, 60)).filter(Boolean))].slice(0, 30);
  const ajenos = GRUPOS().filter((g) => g.cicloId !== id).map((g) => g.grupo.toLowerCase());
  const repetido = gruposDeCiclo({ nombre, grupos }).find((g) => ajenos.includes(g.toLowerCase()));
  if (repetido) fallo(400, `El grupo «${repetido}» ya existe en otro ciclo`);
  return { nombre, descripcion: texto(b.descripcion, 120), grado: texto(b.grado, 20), grupos };
}

async function guardarCiclo(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  if (!b.id) {
    const c = await crearCiclo(leerCiclo(b, null));
    if (!c) fallo(409, "Ya hay un ciclo con ese nombre");
    return json({ ok: true, ciclo: cicloPublico(c) });
  }
  const c = CATALOGO.find((x) => x.id === b.id);
  if (!c) fallo(404, "Ciclo no encontrado");
  const datos = leerCiclo(b, c.id);
  if (CATALOGO.some((x) => x.id !== c.id && x.nombre.toLowerCase() === datos.nombre.toLowerCase())) fallo(409, "Ya hay un ciclo con ese nombre");
  // Los alumnos guardan su ciclo (u.cicloId): si cambian los grupos, siguen en el mismo ciclo.
  await editarCiclo(c.id, datos);
  return json({ ok: true });
}

async function quitarCiclo(req) {
  await requiereAdmin(req);
  const id = String((await leerCuerpo(req)).id || "");
  if (!CATALOGO.some((c) => c.id === id)) fallo(404, "Ciclo no encontrado");
  const examenes = (await todosLosExamenes()).filter((e) => e.cicloId === id).length;
  if (examenes) fallo(409, `El ciclo tiene ${examenes} examen(es). Bórralos antes de borrar el ciclo.`);
  const alumnos = (await leerTodas(usuarios(), await usuarios().list())).filter((u) => rolDe(u) === "alumno" && cicloDe(u) === id).length;
  if (alumnos) fallo(409, `El ciclo tiene ${alumnos} alumno(s). Cámbialos de grupo o bórralos antes de borrar el ciclo.`);
  await borrarCiclo(id);
  return json({ ok: true });
}

export default {
  "GET /api/admin/centro": centro,
  "POST /api/admin/centro": guardarNombreCentro,
  "POST /api/admin/ciclo": guardarCiclo,
  "POST /api/admin/ciclo/borrar": quitarCiclo,
  "GET /api/admin/profesores": profesores,
  "POST /api/admin/profesor": editarProfesor,
  "POST /api/admin/profesor/borrar": borrarProfesor,
};
