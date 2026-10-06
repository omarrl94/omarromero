/** /api/admin/* — solo el administrador (ADMIN_EMAILS): aprobar profesores y asignarles ciclos. */
import { almacen, leerTodas } from "./almacen.mjs";
import { json, fallo, leerCuerpo } from "./http.mjs";
import { requiereAdmin, esAdmin, rolDe } from "./auth.mjs";
import { CATALOGO } from "./catalogo.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { correoAviso } from "./plantillas.mjs";

const usuarios = () => almacen("usuarios");

async function profesores(req) {
  await requiereAdmin(req);
  const lista = (await leerTodas(usuarios(), await usuarios().list())).filter((u) => u.rol === "profesor" && !esAdmin(u.email));
  return json({
    ciclos: CATALOGO.map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion })),
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

export default {
  "GET /api/admin/profesores": profesores,
  "POST /api/admin/profesor": editarProfesor,
  "POST /api/admin/profesor/borrar": borrarProfesor,
};
