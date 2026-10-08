/** /api/admin/* — solo el administrador (ADMIN_EMAILS): aprobar profesores y asignarles ciclos. */
import { almacen, leerTodas } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto } from "./http.mjs";
import { requiereAdmin, esAdmin, rolDe, EMAIL_RE, emailPermitido, hashPassword, validarPassword, nuevoCodigo } from "./auth.mjs";
import { randomInt } from "node:crypto";
import { CATALOGO } from "./catalogo.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { correoAviso, correoCodigo } from "./plantillas.mjs";

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

/* ── Cuentas del alumnado (solo administración) ── */
async function alumnoAdmin(email) {
  const u = await usuarios().get(String(email || "").toLowerCase());
  if (!u || esAdmin(u.email) || rolDe(u) !== "alumno") fallo(404, "Alumno no encontrado");
  return u;
}

/**
 * Cambiar el correo de un alumno que se equivocó al registrarse.
 * Se mueven con él su cuenta, sus entregas y sus exámenes en curso.
 */
async function cambiarEmail(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  const u = await alumnoAdmin(b.email);
  const nuevo = texto(b.nuevo, 160).toLowerCase();
  if (!EMAIL_RE.test(nuevo)) fallo(400, "El correo nuevo no es válido");
  if (nuevo === u.email) fallo(400, "Es el mismo correo");
  if (await usuarios().get(nuevo)) fallo(409, "Ya existe una cuenta con ese correo");
  const viejo = u.email, sufijo = "/" + viejo;
  let movidas = 0;
  for (const nombre of ["entregas", "progreso"]) {
    const st = almacen(nombre);
    for (const k of (await st.list()).filter((k) => k.endsWith(sufijo))) {
      const v = await st.get(k);
      if (v) { await st.set(k.slice(0, -viejo.length) + nuevo, { ...v, email: nuevo }); movidas += nombre === "entregas" ? 1 : 0; }
      await st.del(k);
    }
  }
  const n = { ...u, email: nuevo, ver: (u.ver || 0) + 1, verificado: true, emailAnterior: viejo };
  if (emailPermitido(nuevo)) delete n.externo; else n.externo = true;
  delete n.codigo;
  await usuarios().set(nuevo, n);
  await usuarios().del(viejo);
  let avisado = false;
  if (proveedorConfigurado()) {
    try {
      const c = correoAviso(n.nombre, "Tu correo de acceso ha cambiado",
        `La administración del centro ha cambiado el correo de tu cuenta de exámenes de ${viejo} a ${nuevo}. A partir de ahora entra con este correo y tu contraseña de siempre.`);
      await enviarCorreo({ to: nuevo, subject: c.asunto, html: c.html, text: c.text }); avisado = true;
    } catch (e) { console.error("Aviso de cambio de correo:", e); }
  }
  return json({ ok: true, email: nuevo, entregas: movidas, avisado });
}

/** Contraseña temporal: la pone la administración y el alumno debe cambiarla al entrar. */
async function passwordTemporal(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  const u = await alumnoAdmin(b.email);
  const letras = "abcdefghjkmnpqrstuvwxyz";
  const pw = String(b.password || "").trim()
    || `Otero-${letras[randomInt(0, letras.length)]}${letras[randomInt(0, letras.length)]}${randomInt(1000, 10000)}`;
  validarPassword(pw);
  u.pass = await hashPassword(pw);
  u.passTemporal = true;
  u.verificado = true;
  u.ver = (u.ver || 0) + 1; // cierra las sesiones que tuviera abiertas
  delete u.codigo; delete u.fallos;
  await usuarios().set(u.email, u);
  return json({ ok: true, password: pw });
}

/** Le manda un correo con un código (válido 24 h) y un enlace para poner contraseña nueva. */
async function enviarRestablecer(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  const u = await alumnoAdmin(b.email);
  if (!proveedorConfigurado()) fallo(503, "El envío de correo no está configurado. Usa una contraseña temporal.");
  const { codigo, registro } = await nuevoCodigo("recuperar", 24 * 60);
  u.codigo = { ...registro, creado: Date.now() };
  u.verificado = true;
  await usuarios().set(u.email, u);
  const enlace = `${new URL(req.url).origin}/?recuperar=${encodeURIComponent(u.email)}`;
  const c = correoCodigo("recuperar", u.nombre, codigo, { enlace, caduca: "24 horas", porAdmin: true });
  try { await enviarCorreo({ to: u.email, subject: c.asunto, html: c.html, text: c.text }); }
  catch (e) { console.error("Correo de restablecer:", e); fallo(502, "No se ha podido enviar el correo. Prueba con una contraseña temporal."); }
  return json({ ok: true });
}

export default {
  "POST /api/admin/alumno/email": cambiarEmail,
  "POST /api/admin/alumno/password": passwordTemporal,
  "POST /api/admin/alumno/restablecer": enviarRestablecer,
  "GET /api/admin/profesores": profesores,
  "POST /api/admin/profesor": editarProfesor,
  "POST /api/admin/profesor/borrar": borrarProfesor,
};
