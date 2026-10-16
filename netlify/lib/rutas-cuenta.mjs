/** /api/cuenta/* — registro, verificación por correo, acceso y recuperación. */
import { almacen } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto, cookie, env, leerCookie } from "./http.mjs";
import {
  EMAIL_RE, emailPermitido, dominiosPermitidos, esAdmin, admins, rolDe, hashPassword, comprobarPassword, validarPassword,
  nuevoCodigo, comprobarCodigo, crearToken, usuarioSesion, perfilPublico, NOMBRE_COOKIE, DURACION_SESION,
  esStaff, secreto, PRIVACIDAD_VERSION,
} from "./auth.mjs";
import { comprobarIP, falloIP } from "./registro.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { timingSafeEqual, createHash, createHmac } from "node:crypto";
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
/**
 * Contraseña individual: con el correo configurado, ADMIN_PASSWORD solo vale para el
 * PRIMER acceso; después cada administrador entra con su propia contraseña (y la
 * recupera por correo). Se desactiva con ADMIN_PASSWORD_UNICA=no.
 */
const passIndividual = () => !!proveedorConfigurado() && env("ADMIN_PASSWORD_UNICA").toLowerCase() !== "no";
function esPasswordAdmin(email, pw, u) {
  const ref = env("ADMIN_PASSWORD");
  if (!ref || !esAdmin(email)) return false;
  if (u?.passPropia && passIndividual()) return false;
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

async function iniciarSesion(req, u, extra = {}, cookiesExtra = []) {
  const r = json({ ok: true, usuario: perfilPublico(u), ...extra }, 200,
    { "Set-Cookie": cookie(req, NOMBRE_COOKIE, await crearToken(u), DURACION_SESION) });
  for (const c of cookiesExtra) r.headers.append("Set-Cookie", c);
  return r;
}

/* ── Verificación en dos pasos del profesorado ──────────────────
 * Tras la contraseña, un código por correo. Se puede marcar el navegador como de
 * confianza 30 días (cookie firmada; deja de valer si cambia la contraseña).
 * Se apaga con DOBLE_FACTOR=no (y no funciona sin correo configurado).
 */
const COOKIE_CONFIANZA = "jro_conf", DIAS_CONFIANZA = 30;
export const dobleFactorActivo = () => !!proveedorConfigurado() && env("DOBLE_FACTOR").toLowerCase() !== "no";
const requiereDobleFactor = (u) => dobleFactorActivo() && (esStaff(u) || esAdmin(u.email));
const firmaConfianza = async (u, exp) => createHmac("sha256", await secreto()).update(`confianza:${u.email}:${u.ver || 0}:${exp}`).digest("base64url");
async function cookieConfianza(req, u) {
  const exp = Date.now() + DIAS_CONFIANZA * 86_400_000;
  return cookie(req, COOKIE_CONFIANZA, `${Buffer.from(u.email).toString("base64url")}.${exp}.${await firmaConfianza(u, exp)}`, DIAS_CONFIANZA * 86_400);
}
async function dispositivoDeConfianza(req, u) {
  const [e, exp, firma] = String(leerCookie(req, COOKIE_CONFIANZA) || "").split(".");
  if (!firma || Buffer.from(e, "base64url").toString() !== u.email || Number(exp) < Date.now()) return false;
  const ok = await firmaConfianza(u, exp);
  return ok.length === firma.length && timingSafeEqual(Buffer.from(ok), Buffer.from(firma));
}
/** Contraseña correcta: entra, o pide el código si es profesorado. */
async function trasPassword(req, u) {
  if (requiereDobleFactor(u) && !(await dispositivoDeConfianza(req, u))) {
    await mandarCodigo(u, "acceso");
    return json({ ok: true, verificar: true, dosPasos: true, email: u.email });
  }
  return iniciarSesion(req, u);
}

async function accesoCodigo(req) {
  await comprobarIP(req, "codigo", 60);
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  const u = await usuarios().get(email);
  if (!u?.verificado || !(await comprobarCodigo(u, "acceso", b.codigo))) {
    if (u) await usuarios().set(email, u);
    await falloIP(req, "codigo");
    fallo(400, "Código incorrecto o caducado");
  }
  delete u.codigo;
  await usuarios().set(email, u);
  return iniciarSesion(req, u, {}, b.confiar === true ? [await cookieConfianza(req, u)] : []);
}

/** Aviso de privacidad y uso de la IA: lo acepta al registrarse y cada vez que cambia. */
async function aceptarPrivacidad(req) {
  const u = await usuarioSesion(req);
  if (!u) fallo(401, "Inicia sesión para continuar");
  const b = await leerCuerpo(req);
  if (b.acepto !== true) fallo(400, "Marca la casilla para aceptar");
  // Profesorado: deja constancia de que ha leído las pautas de uso responsable de la IA
  // (alfabetización en IA, Reglamento (UE) 2024/1689, art. 4).
  if (esStaff(u) && b.pautasIA !== true) fallo(400, "Marca también la casilla de las pautas de uso de la IA");
  u.privacidad = { version: PRIVACIDAD_VERSION, fecha: new Date().toISOString() };
  if (esStaff(u)) u.formacionIA = { version: PRIVACIDAD_VERSION, fecha: new Date().toISOString() };
  await usuarios().set(u.email, u);
  return json({ ok: true, usuario: perfilPublico(u) });
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
  await comprobarIP(req, "registro", 80);
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  if (b.acepto !== true) fallo(400, "Para crear la cuenta tienes que leer y aceptar el aviso de privacidad y de uso de la IA");
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
    privacidad: { version: PRIVACIDAD_VERSION, fecha: new Date().toISOString() },
  };
  await falloIP(req, "registro"); // cuenta los registros desde la misma conexión
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
  await comprobarIP(req, "codigo", 60);
  const ok = await comprobarCodigo(u, "registro", b.codigo);
  if (!ok) { await usuarios().set(email, u); await falloIP(req, "codigo"); fallo(400, "Código incorrecto o caducado"); }
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
  // Código de la verificación en dos pasos (solo si hay uno pendiente).
  if (u?.verificado && u.codigo?.tipo === "acceso" && Date.now() < u.codigo.exp) { await mandarCodigo(u, "acceso"); return json({ ok: true }); }
  if (!u || u.verificado) fallo(400, "No hay ningún registro pendiente con ese correo");
  await mandarCodigo(u, "registro");
  return json({ ok: true });
}

async function login(req) {
  await comprobarIP(req, "acceso", 60);
  const b = await leerCuerpo(req);
  const email = leerEmail(b.email);
  const pw = String(b.password || "");
  const u = await usuarios().get(email);
  if (u?.fallos && u.fallos.n >= 8 && Date.now() - u.fallos.desde < 15 * 60_000)
    fallo(429, "Demasiados intentos. Espera 15 minutos o recupera la contraseña.");
  const admin = esPasswordAdmin(email, pw, u);
  if (admin && (!u || !u.verificado)) {
    const [nom = "", ...ape] = email.split("@")[0].split(/[._-]+/);
    const nuevo = {
      email, nombre: u?.nombre || capital(nom), apellidos: u?.apellidos || ape.map(capital).join(" "), grupo: u?.grupo || "Profesorado",
      pass: await hashPassword(pw), verificado: true, ver: u?.ver || 0, creado: u?.creado || new Date().toISOString(),
      ...(passIndividual() ? { passTemporal: true } : {}),
    };
    await usuarios().set(email, nuevo);
    return trasPassword(req, nuevo);
  }
  const propia = await comprobarPassword(pw, u?.pass); // se ejecuta aunque no exista (tiempo constante)
  const ok = admin || propia;
  if (!u || !ok) {
    // Pista en los logs de Netlify (Logs → Functions → api) para el acceso del profesor.
    if (esAdmin(email) && !env("ADMIN_PASSWORD"))
      console.warn(`[acceso profesor] ${email}: ADMIN_PASSWORD no está definida en esta versión desplegada (¿falta la variable, el scope «Functions» o volver a desplegar?).`);
    else if (esAdmin(email))
      console.warn(`[acceso profesor] ${email}: la contraseña no coincide con ADMIN_PASSWORD (${env("ADMIN_PASSWORD").length} caracteres configurados, ${pw.length} escritos).`);
    else if (!u && email.endsWith("@" + (dominiosPermitidos()[0] || "")))
      console.warn(`[acceso] ${email}: no existe la cuenta${env("ADMIN_EMAILS") ? "" : " (ADMIN_EMAILS no está definida)"}.`);
    await falloIP(req, "acceso");
    if (u) {
      const f = u.fallos && Date.now() - u.fallos.desde < 15 * 60_000 ? u.fallos : { n: 0, desde: Date.now() };
      u.fallos = { ...f, n: f.n + 1 };
      await usuarios().set(email, u);
    }
    fallo(401, "Correo o contraseña incorrectos");
  }
  if (u.fallos) { delete u.fallos; await usuarios().set(email, u); }
  // Entró con la contraseña común ADMIN_PASSWORD: tiene que elegir la suya.
  if (admin && !u.passPropia && passIndividual() && !u.passTemporal) {
    u.passTemporal = true; u.pass = await hashPassword(pw);
    await usuarios().set(email, u);
  }
  if (!u.verificado) {
    await mandarCodigo(u, "registro");
    return json({ ok: true, verificar: true, email });
  }
  return trasPassword(req, u);
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
  await comprobarIP(req, "codigo", 60);
  if (!u || !(await comprobarCodigo(u, "recuperar", b.codigo))) {
    if (u) await usuarios().set(email, u);
    await falloIP(req, "codigo");
    fallo(400, "Código incorrecto o caducado");
  }
  u.pass = await hashPassword(b.password);
  if (esAdmin(u.email)) u.passPropia = true;
  u.ver = (u.ver || 0) + 1; // cierra las sesiones abiertas
  delete u.passTemporal;
  delete u.codigo;
  delete u.fallos;
  await usuarios().set(email, u);
  return iniciarSesion(req, u);
}

/** Cambiar la contraseña con la sesión iniciada (obligatorio si es una contraseña temporal). */
async function cambiarPassword(req) {
  const u = await usuarioSesion(req);
  if (!u) fallo(401, "Inicia sesión para continuar");
  const b = await leerCuerpo(req);
  validarPassword(b.password);
  if (!u.passTemporal && !(await comprobarPassword(String(b.actual || ""), u.pass))) fallo(400, "La contraseña actual no es correcta");
  if (u.passTemporal && (await comprobarPassword(String(b.password), u.pass))) fallo(400, "Elige una contraseña distinta de la temporal");
  if (esAdmin(u.email) && u.passTemporal && env("ADMIN_PASSWORD") && createHash("sha256").update(String(b.password)).digest("hex") === createHash("sha256").update(env("ADMIN_PASSWORD")).digest("hex"))
    fallo(400, "Elige una contraseña tuya, distinta de la común del centro");
  u.pass = await hashPassword(b.password);
  delete u.passTemporal;
  if (esAdmin(u.email)) u.passPropia = true;
  u.ver = (u.ver || 0) + 1;
  await usuarios().set(u.email, u);
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
  return json({ grupos: GRUPOS(), dominio: dominiosPermitidos()[0] || "", centro: env("NOMBRE_CENTRO", "C.F.P. José Ramón Otero"), contacto: env("PRIVACIDAD_CONTACTO"), dobleFactor: dobleFactorActivo(),
    // Aviso legal (Ley 34/2002, art. 10): titular de la plataforma.
    legal: { titular: env("TITULAR_NOMBRE", env("NOMBRE_CENTRO", "C.F.P. José Ramón Otero")), nif: env("TITULAR_NIF"), domicilio: env("TITULAR_DOMICILIO"), email: env("TITULAR_EMAIL") },
    ciclos: CATALOGO.map(({ id, nombre, grado, descripcion, familia }) => ({ id, nombre, grado, descripcion, familia: familia || "" })) });
}

/**
 * Derecho de acceso y portabilidad (RGPD, arts. 15 y 20): todo lo que la plataforma
 * guarda sobre el alumno, en un archivo JSON.
 */
async function misDatos(req) {
  const u = await usuarioSesion(req);
  if (!u) fallo(401, "Inicia sesión para continuar");
  const { pass, codigo, fallos, ver, ...cuenta } = u;
  const { vistaEntrega, conIntento, historialDe } = await import("./entregas.mjs");
  const { obtenerExamen } = await import("./examenes.mjs");
  const { leerRegistro } = await import("./registro.mjs");
  const ent = almacen("entregas"), sufijo = `/${u.email}`;
  const examenes = [];
  for (const k of (await ent.list()).filter((k) => k.endsWith(sufijo))) {
    const e = await ent.get(k);
    if (!e) continue;
    const ex = await obtenerExamen(e.examen.id);
    const sol = !!(ex?.mostrarSoluciones ?? e.examen.mostrarSoluciones);
    examenes.push({ examen: e.examen.titulo, modulo: e.examen.modulo, notaFinal: e.notaProfesor ?? e.resultado.nota, validada: !!e.validada, revision: e.revision || null,
      intentos: historialDe(e).map((_, i) => { const v = vistaEntrega(conIntento(e, i), { soluciones: sol }); delete v.examen; return { ...v, preguntas: conIntento(e, i).examen }; }) });
  }
  // Preguntas sin soluciones si el profesor no las muestra.
  for (const x of examenes) for (const it of x.intentos) {
    const q = it.preguntas;
    it.preguntas = { mc: q.mc.map((p) => ({ t: p.t, o: p.o })), open: q.open.map((p) => ({ t: p.t })), num: (q.num || []).map((p) => ({ t: p.t })) };
  }
  const et = almacen("entregasTrabajo"), trabajos = [];
  for (const k of (await et.list()).filter((k) => k.endsWith(sufijo))) {
    const e = await et.get(k);
    if (!e) continue;
    const t = await almacen("trabajos").get(e.trabajo);
    trabajos.push({ trabajo: t?.titulo || e.trabajo, estado: e.estado, fecha: e.fecha, comentario: e.comentario || "", archivos: (e.archivos || []).map((a) => ({ nombre: a.nombre, tamano: a.tamano, fecha: a.fecha })),
      notaTrabajo: e.notaTrabajo ?? null, notaFinalManual: e.notaFinalManual ?? null, comentarioProfesor: e.comentarioProfesor || "", defensa: e.defensa ? { enviada: e.defensa.fecha } : null });
  }
  const externas = (await Promise.all((await almacen("notasExternas").list()).map((k) => almacen("notasExternas").get(k))))
    .filter((x) => x?.notas?.[u.email] != null).map((x) => ({ columna: x.titulo, origen: x.origen || "", nota: x.notas[u.email] }));
  const registro = (await leerRegistro({ alumno: u.email })).map(({ por, ...r }) => ({ ...r, por: por?.nombre || "" }));
  const cuerpo = JSON.stringify({ generado: new Date().toISOString(), cuenta, examenes, trabajos, notasImportadas: externas, registroDeCambios: registro,
    nota: "Los archivos de tus trabajos los puedes descargar desde cada trabajo. Para cualquier otro derecho (rectificación, supresión, oposición), consulta /privacidad/." }, null, 1);
  return new Response(cuerpo, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="mis-datos-${new Date().toISOString().slice(0, 10)}.json"` } });
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
  "POST /api/cuenta/acceso": accesoCodigo,
  "POST /api/cuenta/privacidad": aceptarPrivacidad,
  "POST /api/cuenta/logout": logout,
  "POST /api/cuenta/recuperar": recuperar,
  "POST /api/cuenta/restablecer": restablecer,
  "GET /api/cuenta/yo": yo,
  "GET /api/cuenta/mis-datos": misDatos,
  "POST /api/cuenta/grupo": elegirGrupo,
  "POST /api/cuenta/mi-grupo": cambiarMiGrupo,
  "POST /api/cuenta/password": cambiarPassword,
  "GET /api/cuenta/grupos": catalogoPublico,
};
