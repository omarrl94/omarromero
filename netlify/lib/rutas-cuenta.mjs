/** /api/cuenta/* — registro, verificación por correo, acceso y recuperación. */
import { almacen } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto, cookie, env } from "./http.mjs";
import {
  EMAIL_RE, emailPermitido, dominiosPermitidos, esAdmin, admins, rolDe, hashPassword, comprobarPassword, validarPassword,
  nuevoCodigo, comprobarCodigo, crearToken, usuarioSesion, perfilPublico, NOMBRE_COOKIE, DURACION_SESION,
} from "./auth.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { timingSafeEqual, createHash } from "node:crypto";
import { correoCodigo, correoAviso } from "./plantillas.mjs";
import { GRUPOS, cicloDe, CATALOGO } from "./catalogo.mjs";

/** Avisa al administrador de que un profesor espera aprobación. */
function avisarAdmin(u) {
  if (!proveedorConfigurado() || u.rol !== "profesor" || u.aprobado) return;
  const nombres = CATALOGO.filter((c) => (u.ciclos || []).includes(c.id)).map((c) => c.nombre).join(", ");
  for (const a of admins()) {
    const c = correoAviso("administrador", "Nuevo profesor pendiente de aprobar",
      `${u.nombre} ${u.apellidos} (${u.email}) se ha registrado como profesor de ${nombres}. Apruébalo en el panel del profesor, pestaña «Profesores».`);
    enviarCorreo({ to: a, subject: c.asunto, html: c.html, text: c.text }).catch((e) => console.error("Aviso al admin:", e));
  }
}

/** El grupo debe ser uno de la lista (así sabemos el ciclo del alumno). */
function leerGrupo(v) {
  const g = GRUPOS().find((x) => x.grupo === texto(v, 60));
  if (!g) fallo(400, "Elige tu grupo de la lista");
  return g;
}

/**
 * Cuenta del profesor sin registro: si ADMIN_PASSWORD está definida en Netlify,
 * los correos de ADMIN_EMAILS pueden entrar con esa contraseña (la cuenta se
 * crea sola la primera vez). Así la contraseña no está nunca en el código.
 */
function esPasswordAdmin(email, pw) {
  const ref = env("ADMIN_PASSWORD");
  if (!ref || !esAdmin(email)) return false;
  const h = (s) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(pw), h(ref));
}
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Nombre y apellidos completos y bien escritos: solo letras (con tildes),
 * espacios, guiones y apóstrofos. «MARÍA  josé» → «María José»,
 * «garcía de la fuente» → «García de la Fuente».
 */
const MENORES = new Set(["de", "del", "la", "las", "los", "y", "e", "da", "do", "dos", "van", "von"]);
const LETRAS = /^[\p{L}][\p{L}\p{M}' .-]*$/u;
function arreglarNombre(v) {
  return texto(v, 120).replace(/\s+/g, " ").trim().toLowerCase()
    .split(" ").map((w, i) => (i > 0 && MENORES.has(w) ? w : w.replace(/(^|[-'])(\p{L})/gu, (m, a, c) => a + c.toUpperCase()))).join(" ");
}
export function nombreCompleto(n, a) {
  const nombre = arreglarNombre(n), apellidos = arreglarNombre(a);
  const letras = (s) => (s.match(/\p{L}/gu) || []).length;
  if (!nombre || !apellidos) fallo(400, "Escribe tu nombre y tus apellidos completos");
  if (!LETRAS.test(nombre) || !LETRAS.test(apellidos)) fallo(400, "El nombre y los apellidos solo pueden llevar letras (sin números ni símbolos)");
  if (letras(nombre) < 2) fallo(400, "Escribe tu nombre completo, no solo la inicial");
  if (letras(apellidos) < 2) fallo(400, "Escribe tus apellidos completos, no solo la inicial");
  if (nombre.split(" ").every((w) => w.replace(/\./g, "").length < 2)) fallo(400, "Escribe tu nombre completo, no solo la inicial");
  return { nombre, apellidos };
}

const usuarios = () => almacen("usuarios");
const leerEmail = (v) => {
  const email = texto(v, 160).toLowerCase();
  if (!EMAIL_RE.test(email)) fallo(400, "El correo no es válido");
  return email;
};

async function iniciarSesion(req, u, extra = {}) {
  return json({ ok: true, usuario: perfilPublico(u), ...extra }, 200,
    { "Set-Cookie": cookie(req, NOMBRE_COOKIE, await crearToken(u), DURACION_SESION) });
}

async function mandarCodigo(u, tipo) {
  if (u.codigo?.creado && Date.now() - u.codigo.creado < 45_000)
    fallo(429, "Espera unos segundos antes de pedir otro código");
  const { codigo, registro } = await nuevoCodigo(tipo);
  u.codigo = { ...registro, creado: Date.now() };
  await usuarios().set(u.email, u);
  const c = correoCodigo(tipo, u.nombre, codigo);
  try {
    await enviarCorreo({ to: u.email, subject: c.asunto, html: c.html, text: c.text });
  } catch (e) {
    console.error("Fallo al enviar código:", e);
    fallo(502, "No se ha podido enviar el correo con el código. Inténtalo más tarde o avisa al profesor.");
  }
}

async function registro(req) {
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  // Profesor: elige los ciclos que imparte y espera a que el admin lo apruebe.
  const esProfesor = b.tipo === "profesor";
  // Los alumnos pueden usar cualquier correo (del centro o personal); el profesorado, solo el del centro.
  if (esProfesor && !emailPermitido(email)) fallo(400, `El profesorado se registra con el correo del centro (@${dominiosPermitidos()[0]})`);
  const { nombre, apellidos } = nombreCompleto(b.nombre, b.apellidos);
  let grupo = "Profesorado", cicloId = null, ciclos;
  if (esProfesor) {
    ciclos = [...new Set((Array.isArray(b.ciclos) ? b.ciclos : []).filter((c) => CATALOGO.some((x) => x.id === c)))];
    if (!ciclos.length) fallo(400, "Marca al menos un ciclo en el que des clase");
  } else {
    ({ grupo, cicloId } = leerGrupo(b.grupo));
  }
  validarPassword(b.password);

  const previo = await usuarios().get(email);
  if (previo?.verificado) fallo(409, "Ya existe una cuenta con ese correo. Inicia sesión o recupera la contraseña.");

  const u = {
    email, nombre, apellidos, grupo, cicloId,
    ...(emailPermitido(email) ? {} : { externo: true }), // correo personal (no del centro)
    ...(esProfesor ? { rol: "profesor", aprobado: false, ciclos } : {}),
    pass: await hashPassword(b.password),
    verificado: false, ver: 0, creado: new Date().toISOString(),
    codigo: previo?.codigo,
  };
  if (!proveedorConfigurado()) {
    // Sin correo configurado no se puede verificar: la cuenta queda activa.
    u.verificado = true;
    delete u.codigo;
    await usuarios().set(email, u);
    return iniciarSesion(req, u);
  }
  await mandarCodigo(u, "registro");
  return json({ ok: true, verificar: true, email });
}

async function verificar(req) {
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  const u = await usuarios().get(email);
  if (!u) fallo(404, "No hay ningún registro pendiente con ese correo");
  if (u.verificado) return iniciarSesion(req, u);
  const ok = await comprobarCodigo(u, "registro", b.codigo);
  if (!ok) { await usuarios().set(email, u); fallo(400, "Código incorrecto o caducado"); }
  u.verificado = true;
  delete u.codigo;
  await usuarios().set(email, u);
  avisarAdmin(u);
  return iniciarSesion(req, u);
}

async function reenviar(req) {
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  const u = await usuarios().get(email);
  if (!u || u.verificado) fallo(400, "No hay ningún registro pendiente con ese correo");
  await mandarCodigo(u, "registro");
  return json({ ok: true });
}

async function login(req) {
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  const pw = String(b.password || "");
  const u = await usuarios().get(email);
  if (u?.fallos && u.fallos.n >= 8 && Date.now() - u.fallos.desde < 15 * 60_000)
    fallo(429, "Demasiados intentos. Espera 15 minutos o recupera la contraseña.");
  const admin = esPasswordAdmin(email, pw);
  if (admin && (!u || !u.verificado)) {
    const [nom = "", ...ape] = email.split("@")[0].split(/[._-]+/);
    const nuevo = {
      email, nombre: u?.nombre || capital(nom), apellidos: u?.apellidos || ape.map(capital).join(" "), grupo: u?.grupo || "Profesorado",
      pass: await hashPassword(pw), verificado: true, ver: u?.ver || 0, creado: u?.creado || new Date().toISOString(),
    };
    await usuarios().set(email, nuevo);
    return iniciarSesion(req, nuevo);
  }
  const ok = admin || (await comprobarPassword(pw, u?.pass)); // se ejecuta aunque no exista (tiempo constante)
  if (!u || !ok) {
    // Pista en los logs de Netlify (Logs → Functions → api) para el acceso del profesor.
    if (esAdmin(email) && !env("ADMIN_PASSWORD"))
      console.warn(`[acceso profesor] ${email}: ADMIN_PASSWORD no está definida en esta versión desplegada (¿falta la variable, el scope «Functions» o volver a desplegar?).`);
    else if (esAdmin(email))
      console.warn(`[acceso profesor] ${email}: la contraseña no coincide con ADMIN_PASSWORD (${env("ADMIN_PASSWORD").length} caracteres configurados, ${pw.length} escritos).`);
    else if (!u && email.endsWith("@" + (dominiosPermitidos()[0] || "")))
      console.warn(`[acceso] ${email}: no existe la cuenta${env("ADMIN_EMAILS") ? "" : " (ADMIN_EMAILS no está definida)"}.`);
    if (u) {
      const f = u.fallos && Date.now() - u.fallos.desde < 15 * 60_000 ? u.fallos : { n: 0, desde: Date.now() };
      u.fallos = { ...f, n: f.n + 1 };
      await usuarios().set(email, u);
    }
    fallo(401, "Correo o contraseña incorrectos");
  }
  if (u.fallos) { delete u.fallos; await usuarios().set(email, u); }
  if (!u.verificado) {
    await mandarCodigo(u, "registro");
    return json({ ok: true, verificar: true, email });
  }
  return iniciarSesion(req, u);
}

async function logout(req) {
  return json({ ok: true }, 200, { "Set-Cookie": cookie(req, NOMBRE_COOKIE, "", 0) });
}

async function recuperar(req) {
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  if (!proveedorConfigurado()) fallo(503, "La recuperación por correo no está disponible. Pide al profesor que te restablezca la cuenta.");
  const u = await usuarios().get(email);
  // Misma respuesta exista o no la cuenta.
  if (u?.verificado) await mandarCodigo(u, "recuperar");
  return json({ ok: true });
}

async function restablecer(req) {
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  validarPassword(b.password);
  const u = await usuarios().get(email);
  if (!u || !(await comprobarCodigo(u, "recuperar", b.codigo))) {
    if (u) await usuarios().set(email, u);
    fallo(400, "Código incorrecto o caducado");
  }
  u.pass = await hashPassword(b.password);
  u.ver = (u.ver || 0) + 1; // cierra las sesiones abiertas
  delete u.codigo;
  delete u.fallos;
  await usuarios().set(email, u);
  return iniciarSesion(req, u);
}

/** Cuentas antiguas sin ciclo: el alumno lo elige una vez. Después solo lo cambia el profesor. */
async function elegirGrupo(req) {
  const u = await usuarioSesion(req);
  if (!u) fallo(401, "Inicia sesión para continuar");
  if (rolDe(u) !== "alumno") fallo(400, "Solo para alumnos");
  if (cicloDe(u)) fallo(409, "Tu ciclo ya está asignado. Si es incorrecto, avisa al profesor.");
  const { grupo, cicloId } = leerGrupo((await leerCuerpo(req)).grupo);
  Object.assign(u, { grupo, cicloId });
  await usuarios().set(u.email, u);
  return json({ ok: true, usuario: perfilPublico(u) });
}

/**
 * El alumno puede corregir su grupo si se equivocó al registrarse, mientras no
 * haya entregado ningún examen. Después, solo lo cambia el profesor.
 */
async function cambiarMiGrupo(req) {
  const u = await usuarioSesion(req);
  if (!u) fallo(401, "Inicia sesión para continuar");
  if (rolDe(u) !== "alumno") fallo(400, "Solo para alumnos");
  const g = leerGrupo((await leerCuerpo(req)).grupo);
  if (g.grupo === u.grupo) return json({ ok: true, usuario: perfilPublico(u) });
  const sufijo = "/" + u.email;
  const entregadas = (await almacen("entregas").list()).filter((k) => k.endsWith(sufijo)).length;
  if (entregadas) fallo(409, "Ya has entregado algún examen en tu grupo actual, así que el cambio lo tiene que hacer tu profesor. Avísale.");
  Object.assign(u, { grupo: g.grupo, cicloId: g.cicloId, grupoCambiado: new Date().toISOString() });
  await usuarios().set(u.email, u);
  return json({ ok: true, usuario: perfilPublico(u) });
}

/** Ciclos y grupos para el formulario de registro (público). */
async function catalogoPublico() {
  return json({ grupos: GRUPOS(), dominio: dominiosPermitidos()[0] || "", ciclos: CATALOGO.map(({ id, nombre, grado, descripcion }) => ({ id, nombre, grado, descripcion })) });
}

async function yo(req) {
  const u = await usuarioSesion(req);
  if (!u) fallo(401, "Sin sesión");
  return json({ usuario: perfilPublico(u) });
}

export default {
  "POST /api/cuenta/registro": registro,
  "POST /api/cuenta/verificar": verificar,
  "POST /api/cuenta/reenviar": reenviar,
  "POST /api/cuenta/login": login,
  "POST /api/cuenta/logout": logout,
  "POST /api/cuenta/recuperar": recuperar,
  "POST /api/cuenta/restablecer": restablecer,
  "GET /api/cuenta/yo": yo,
  "POST /api/cuenta/grupo": elegirGrupo,
  "POST /api/cuenta/mi-grupo": cambiarMiGrupo,
  "GET /api/cuenta/grupos": catalogoPublico,
};
