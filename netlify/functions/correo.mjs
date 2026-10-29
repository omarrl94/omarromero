/**
 * Curso de Claude · Correo del centro (cuenta y avisos).
 *
 * Mismo sistema que ColaboraFP y la web de exámenes: el correo del centro bloquea los mensajes
 * externos (incluidos los de Firebase), así que los enlaces los genera Firebase Admin y el mensaje
 * sale desde un buzón del propio centro.
 *
 * Proveedor de envío (el primero configurado):
 *   · SMTP: SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, MAIL_FROM   ← Microsoft 365 del centro
 *   · Resend: RESEND_API_KEY, MAIL_FROM
 *   · Microsoft Graph: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MAIL_FROM
 *   · MAIL_MODE=log: no envía nada, solo lo escribe en el registro (pruebas)
 *
 * Variables de entorno (Netlify → Project configuration → Environment variables, ámbito «Functions»):
 *   FIREBASE_SERVICE_ACCOUNT          JSON completo de la cuenta de servicio
 *     (o FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
 *   ADMIN_EMAILS                      profesorado que recibe los avisos (por defecto omar.romero@jrotero.es)
 *   APP_URL                           https://… (opcional: por defecto, la dirección de la petición)
 *
 * GET  → { configured, from, provider, problems? }
 * POST { action: 'verify' }                    + Bearer <ID token>  → correo de verificación
 * POST { action: 'reset', email }                                   → enlace para nueva contraseña
 * POST { action: 'registro' }                  + Bearer (alumno)    → aviso al profesorado de un alta
 * POST { action: 'entrega', sesion, bloque }   + Bearer (alumno)    → acuse al alumno, copia al profesor
 * POST { action: 'evaluacion', id }            + Bearer (profesor)  → nota y comentarios al alumno
 * POST { action: 'titulo', userId }            + Bearer (profesor)  → aviso de Título Propio emitido
 *
 * Primer acceso del profesor (como ADMIN_PASSWORD en la web de exámenes):
 *   ADMIN_PASSWORD   contraseña inicial (márcala como secreta). Solo vale UNA vez: al entrar con
 *                    ella, la web obliga a elegir otra y la inicial deja de funcionar.
 * POST { action: 'acceso-inicial', email, password }                → crea o prepara la cuenta
 * POST { action: 'cambiar-password', nueva }   + Bearer (profesor)  → fija la contraseña definitiva
 *
 * Los avisos se construyen con los datos de Firestore (no con lo que envía el navegador), así que
 * nadie puede usar esta función para mandar correos con contenido propio.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createHash, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import webConfig from "../../firebase.web.json" with { type: "json" };

// Lee una variable quitando espacios y comillas envolventes (MAIL_FROM="Nombre <correo>")
const env = new Proxy(process.env, {
  get(target, k) {
    let v = String(target[k] ?? "").trim();
    if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.at(-1) === v[0]) v = v.slice(1, -1).trim();
    return v || undefined;
  },
});

const CURSO = "Especialización en Ingeniería de IA, Skills, MCP y Automatización con Claude";
const CENTRO = () => env.NOMBRE_CENTRO || "FP José Ramón Otero";
// El profesor responsable siempre está (es el que reconocen las reglas de Firestore)
const ADMINS = () => [...new Set(["omar.romero@jrotero.es", ...String(env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)])];
const LOGIN = env.MS_LOGIN_BASE || "https://login.microsoftonline.com";
const GRAPH = env.MS_GRAPH_BASE || "https://graph.microsoft.com";
const MIN_GAP = 60 * 1000;   // un correo por minuto
const MAX_PER_DAY = 10;      // y diez al día, por destinatario y tipo

const provider = () => {
  if (env.MAIL_MODE === "log") return "log";
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return "smtp";
  if (env.RESEND_API_KEY && env.MAIL_FROM) return "resend";
  if (env.MS_TENANT_ID && env.MS_CLIENT_ID && env.MS_CLIENT_SECRET && env.MAIL_FROM) return "graph";
  return null;
};
const fromHeader = () => env.MAIL_FROM || env.SMTP_USER;
/** Solo la dirección (sin el nombre) para mostrarla en la web. */
const fromAddress = () => (fromHeader()?.match(/<([^>]+)>/)?.[1] || fromHeader() || "").trim();
const projectId = () => env.FIREBASE_PROJECT_ID || webConfig.projectId;
const emulador = () => !!env.FIREBASE_AUTH_EMULATOR_HOST;
const configured = () => !!(cuentaValida() || emulador()) && !!provider();
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/** Credenciales de la cuenta de servicio: el JSON completo o dos variables sueltas. */
function serviceAccount() {
  if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL)
    return { projectId: projectId(), clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") };
  if (env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      if (sa.client_email && sa.private_key) return { projectId: sa.project_id || projectId(), clientEmail: sa.client_email, privateKey: sa.private_key };
    } catch {
      return null; // diagnose() explica el problema
    }
  }
  return null;
}

/** La cuenta de servicio solo vale si es del mismo proyecto que la web (nunca la de otra app del centro). */
const cuentaValida = () => { const sa = serviceAccount(); return sa && sa.projectId === projectId() ? sa : null; };
function problemaProyecto() {
  const sa = serviceAccount();
  return sa && sa.projectId !== projectId()
    ? `FIREBASE_SERVICE_ACCOUNT es del proyecto «${sa.projectId}», pero esta web usa «${projectId()}». Genera la clave en Firebase → Configuración del proyecto → Cuentas de servicio con el proyecto ${projectId()} seleccionado (no reutilices la de ColaboraFP ni la de exámenes).`
    : null;
}

/** Traduce los errores de Google a qué hay que hacer. */
function explicar(e, servicio = "") {
  const m = String(e?.message || e);
  const sa = serviceAccount();
  const rol = servicio === "Authentication" ? "«Administrador de Firebase Authentication»" : servicio === "Firestore" ? "«Usuario de Cloud Datastore»" : "«Usuario de Cloud Datastore» y «Administrador de Firebase Authentication»";
  if (/PERMISSION_DENIED|insufficient permission|permission-denied|does not have|caller does not have/i.test(m) && !/has not been used|is disabled/i.test(m))
    return `${servicio ? servicio + ": " : ""}la cuenta de servicio${sa ? ` ${sa.clientEmail}` : ""} no tiene permiso en el proyecto «${projectId()}». Dale el rol ${rol} en console.cloud.google.com → IAM y administración → IAM (proyecto ${projectId()}) → lápiz junto a esa cuenta → Añadir otro rol → Guardar. Tarda 1-2 minutos; no hace falta volver a desplegar.`;
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(m))
    return `Una API de Google está desactivada en el proyecto «${projectId()}» (${m.slice(0, 160)}). Actívala en console.cloud.google.com → APIs y servicios.`;
  if (/invalid_grant|invalid JWT|Invalid JWT Signature|private key/i.test(m))
    return "La clave de FIREBASE_SERVICE_ACCOUNT no es válida o se ha revocado. Genera una nueva en Firebase → Cuentas de servicio y pégala entera.";
  return m;
}

/** Qué falta para poder enviar (solo nombres de variables, nunca valores). */
function diagnose() {
  const problems = [];
  const proyecto = problemaProyecto();
  if (proyecto) problems.push(proyecto);
  if (!serviceAccount() && !emulador()) {
    if (!env.FIREBASE_SERVICE_ACCOUNT && !env.FIREBASE_PRIVATE_KEY) problems.push("Falta FIREBASE_SERVICE_ACCOUNT");
    else if (env.FIREBASE_SERVICE_ACCOUNT) {
      let parsed = null;
      try { parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT); }
      catch { problems.push(`FIREBASE_SERVICE_ACCOUNT no es un JSON completo (tiene ${env.FIREBASE_SERVICE_ACCOUNT.length} caracteres; debe empezar por { y acabar en })`); }
      if (parsed && !(parsed.client_email && parsed.private_key)) problems.push("FIREBASE_SERVICE_ACCOUNT no contiene client_email y private_key: usa el .json de «Cuentas de servicio»");
    } else problems.push("Falta FIREBASE_CLIENT_EMAIL");
  }
  if (!provider()) {
    const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((k) => !env[k]);
    problems.push(`Falta configurar el envío: ${missing.join(", ")}`);
  }
  return problems;
}

function firebase() {
  if (!getApps().length) {
    const sa = cuentaValida();
    initializeApp(sa ? { credential: cert(sa), projectId: sa.projectId } : { projectId: projectId() });
  }
  return { auth: getAuth(), db: getFirestore() };
}

/** Límite de envíos por clave (colección mail_log, inaccesible para los clientes por las reglas). */
async function throttle(db, clave, { gap = MIN_GAP, max = MAX_PER_DAY } = {}) {
  const ref = db.collection("mail_log").doc(createHash("sha256").update(clave).digest("hex"));
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  return db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data() || {};
    const count = d.day === day ? d.count || 0 : 0;
    if (d.last && now - d.last < gap) return "Espera un minuto antes de pedir otro correo.";
    if (count >= max) return "Se han pedido demasiados correos hoy. Inténtalo mañana o pide al profesor que active tu cuenta.";
    tx.set(ref, { last: now, day, count: count + 1 });
    return null;
  });
}

async function graphToken() {
  const res = await fetch(`${LOGIN}/${env.MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(`Microsoft rechazó las credenciales de la aplicación (${data.error || res.status}).`);
  return data.access_token;
}

let transport;
function smtp() {
  if (!transport) {
    const port = Number(env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transport;
}

/** @param m { to, bcc?, replyTo?, subject, html, text } */
async function sendMail(m) {
  const p = provider();
  if (p === "log") return console.log(`[MAIL_MODE=log] Para: ${m.to}  CCO: ${m.bcc || "-"}\nAsunto: ${m.subject}\n\n${m.text}\n`);
  if (p === "smtp") {
    try {
      await smtp().sendMail({ from: fromHeader(), to: m.to, bcc: m.bcc || undefined, replyTo: m.replyTo || undefined, subject: m.subject, html: m.html, text: m.text });
    } catch (e) {
      throw new Error(`El servidor de correo rechazó el envío (${e.responseCode || e.code || e.message}).`);
    }
    return;
  }
  if (p === "resend") {
    const r = await fetch(env.RESEND_API_BASE || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromHeader(), to: [m.to], bcc: m.bcc ? [m.bcc] : undefined, reply_to: m.replyTo || undefined, subject: m.subject, html: m.html, text: m.text }),
    });
    if (!r.ok) throw new Error(`Resend rechazó el envío (${r.status}).`);
    return;
  }
  const token = await graphToken();
  const res = await fetch(`${GRAPH}/v1.0/users/${encodeURIComponent(fromAddress())}/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: m.subject, body: { contentType: "HTML", content: m.html },
        toRecipients: [{ emailAddress: { address: m.to } }],
        ...(m.bcc && { bccRecipients: [{ emailAddress: { address: m.bcc } }] }),
        ...(m.replyTo && { replyTo: [{ emailAddress: { address: m.replyTo } }] }),
      },
      saveToSentItems: false,
    }),
  });
  if (res.status !== 202) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Microsoft no pudo enviar el correo (${data.error?.code || res.status}).`);
  }
}

/* ── Plantillas (HTML con estilos en línea, compatibles con Outlook) + texto ── */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const GRIS = "#5F6673", TINTA = "#111111";

/**
 * @param o { titulo, nombre, parrafos: string[] (texto plano), destacado?, boton?, enlace?, nota?, color? }
 */
function plantilla({ titulo, nombre, parrafos, destacado, boton, enlace, nota, color = "#efcd2f" }) {
  const p = (t) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;white-space:pre-wrap">${esc(t)}</p>`;
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#FAF9F5;font-family:Segoe UI,Arial,sans-serif;color:${TINTA}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F5"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #E5E7EB;border-radius:14px;overflow:hidden">
  <tr><td style="height:8px;background:${color};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:24px 28px 4px">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${GRIS};font-weight:700">${esc(CENTRO())} · Curso de Claude</div>
  </td></tr>
  <tr><td style="padding:4px 28px 20px">
    <h1 style="font-size:22px;margin:6px 0 14px">${esc(titulo)}</h1>
    ${p(`Hola${nombre ? ", " + nombre : ""}:`)}
    ${parrafos.map(p).join("")}
    ${destacado ? `<div style="margin:8px 0 16px;background:#FBF1C2;color:#5E4D09;border-radius:12px;padding:14px 18px;font-size:15px;line-height:1.5;white-space:pre-wrap">${esc(destacado)}</div>` : ""}
    ${boton && enlace ? `<p style="margin:8px 0 18px"><a href="${esc(enlace)}" style="display:inline-block;background:#efcd2f;color:${TINTA};font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">${esc(boton)}</a></p>
    <p style="margin:0 0 8px;font-size:12px;color:${GRIS};line-height:1.5">Si el botón no funciona, copia este enlace en el navegador:<br><span style="word-break:break-all">${esc(enlace)}</span></p>` : ""}
    ${nota ? `<p style="margin:12px 0 0;font-size:12px;color:${GRIS};line-height:1.5">${esc(nota)}</p>` : ""}
  </td></tr>
  <tr><td style="padding:14px 28px 22px;font-size:12px;color:${GRIS};border-top:1px solid #E5E7EB">Centro de Formación Profesional José Ramón Otero · ${esc(CURSO)}<br>Mensaje automático de la plataforma del curso.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [`Hola${nombre ? ", " + nombre : ""}:`, ...parrafos, destacado, boton && enlace ? `${boton}: ${enlace}` : "", nota].filter(Boolean).join("\n\n");
  return { subject: titulo, html, text };
}

const baseUrl = (origin) => (env.APP_URL || origin || "").replace(/\/$/, "");

/**
 * Genera el enlace y lo dirige a la página /accion de la propia web (confirmar el correo o elegir
 * contraseña, en español y con el diseño del curso) en vez de a la página genérica de Firebase.
 */
async function link(fn, email, origin) {
  const raw = await fn(email);
  const base = baseUrl(origin);
  if (!base) return raw;
  const src = new URL(raw).searchParams;
  const out = new URL(`${base}/accion`);
  for (const k of ["mode", "oobCode"]) out.searchParams.set(k, src.get(k));
  return out.toString();
}

const sesionDe = async (auth, req) => {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  return auth.verifyIdToken(token).catch(() => null);
};
/* ── Primer acceso del profesor con ADMIN_PASSWORD ─────────────────────────── */
const iguales = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};
const claveInicial = (email) => `sistema/acceso-inicial-${createHash("sha256").update(email).digest("hex").slice(0, 32)}`;
const passwordValida = (p) => typeof p === "string" && p.length >= 8 && p.length <= 128 && /[A-Za-z]/.test(p) && /\d/.test(p);

async function cuentaProfesor(body, req, auth, db) {
  if (!emulador()) {
    if (problemaProyecto()) return json(501, { error: problemaProyecto() });
    if (!cuentaValida()) return json(501, { error: "Falta FIREBASE_SERVICE_ACCOUNT en Netlify (ámbito «Functions»)." });
  }

  if (body.action === "acceso-inicial") {
    const email = String(body.email || "").trim().toLowerCase();
    const inicial = env.ADMIN_PASSWORD;
    const no = (motivo) => json(401, { error: "Correo o contraseña incorrectos.", ...(motivo && { motivo }) });
    if (!ADMINS().includes(email)) return no();
    if (!inicial) return no("sin-admin-password");
    // Límite de intentos (como el resto de correos), para que no se pueda probar a ciegas
    if (await throttle(db, `inicial:${email}`, { gap: 2000, max: 20 })) return json(429, { error: "Demasiados intentos. Espera un poco." });
    if (!iguales(body.password, inicial)) return no("no-coincide");
    if ((await db.doc(claveInicial(email)).get()).exists) return no("usada");   // ya se usó: solo vale una vez
    // Solo «no existe» significa crearla; cualquier otro error (p. ej. falta de permisos) se explica
    let user = await auth.getUserByEmail(email).catch((e) => { if (e?.code === "auth/user-not-found") return null; throw e; });
    if (user) await auth.updateUser(user.uid, { password: inicial, emailVerified: true });
    else user = await auth.createUser({ email, password: inicial, emailVerified: true, displayName: "Omar Romero" });
    await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), cambiarPassword: true });
    return json(200, { ok: true });
  }

  if (body.action === "cambiar-password") {
    const t = await sesionDe(auth, req);
    if (!t?.cambiarPassword || !ADMINS().includes(String(t.email || "").toLowerCase())) return json(403, { error: "No hay ningún cambio de contraseña pendiente." });
    const nueva = body.nueva;
    if (!passwordValida(nueva)) return json(400, { error: "La contraseña debe tener al menos 8 caracteres e incluir letras y números." });
    if (env.ADMIN_PASSWORD && iguales(nueva, env.ADMIN_PASSWORD)) return json(400, { error: "Elige una contraseña distinta de la inicial." });
    const user = await auth.getUser(t.uid);
    const { cambiarPassword, ...resto } = user.customClaims || {};
    await auth.updateUser(t.uid, { password: nueva, emailVerified: true });
    await auth.setCustomUserClaims(t.uid, Object.keys(resto).length ? resto : null);
    await db.doc(claveInicial(String(t.email).toLowerCase())).set({ usadaEn: new Date().toISOString() });
    return json(200, { ok: true });
  }
  return null;
}

const esProfesor = (t) => !!t?.email_verified && ADMINS().includes(String(t.email || "").toLowerCase());
const ESTADOS = { aprobada: "Aprobada", revision: "Requiere cambios" };
const BLOQUES = { dam: "bloque DAM", asir: "bloque ASIR", comun: "bloque común DAM y ASIR" };

export default async (req) => {
  if (req.method === "GET") {
    const problems = diagnose();
    // ?comprobar=1 prueba de verdad la cuenta de servicio contra Firestore y Authentication
    let comprobacion;
    if (new URL(req.url, "http://x").searchParams.get("comprobar") && (cuentaValida() || emulador())) {
      const { auth, db } = firebase();
      const fallos = [];
      await db.collection("mail_log").limit(1).get().catch((e) => fallos.push(explicar(e, "Firestore")));
      await auth.listUsers(1).catch((e) => fallos.push(explicar(e, "Authentication")));
      comprobacion = fallos.length ? "error" : "ok";
      problems.unshift(...fallos);
    }
    return json(200, {
      configured: configured(),
      from: configured() ? fromAddress() : null,
      provider: provider(),
      proyecto: projectId(),
      cuentaServicio: !!(cuentaValida() || emulador()),
      ...(comprobacion && { comprobacion }),
      accesoInicial: !!env.ADMIN_PASSWORD,
      ...(problems.length && {
        problems,
        hint: "Netlify → Project configuration → Environment variables: comprueba el nombre exacto, que el ámbito (scope) incluya «Functions» y que valga para todos los contextos de despliegue; después vuelve a desplegar.",
      }),
    });
  }
  if (req.method !== "POST") return json(405, { error: "Método no permitido." });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Petición no válida." }); }

  // El primer acceso del profesor no necesita el envío de correo, solo la cuenta de servicio
  if (body.action === "acceso-inicial" || body.action === "cambiar-password") {
    try { return await cuentaProfesor(body, req, ...Object.values(firebase())); }
    catch (e) { console.error("[cuenta]", e); return json(502, { error: explicar(e) }); }
  }

  if (!configured()) return json(501, { error: "El envío de correo del centro no está configurado." });
  const { auth, db } = firebase();
  const origin = /^https?:\/\//.test(req.url) ? new URL(req.url).origin : null;
  const web = baseUrl(origin);

  try {
    switch (body.action) {
      case "verify": {
        const t = await sesionDe(auth, req);
        if (!t?.email) return json(401, { error: "Sesión no válida. Vuelve a iniciar sesión." });
        const user = await auth.getUser(t.uid);
        if (user.emailVerified) return json(200, { sent: false, alreadyVerified: true, from: fromAddress() });
        const wait = await throttle(db, `verify:${user.email.toLowerCase()}`);
        if (wait) return json(429, { error: wait });
        const perfil = (await db.doc(`usuarios/${t.uid}`).get()).data();
        const url = await link((e) => auth.generateEmailVerificationLink(e), user.email, origin);
        await sendMail({ to: user.email, ...plantilla({
          titulo: "Activa tu cuenta del curso de Claude",
          nombre: perfil?.nombre || user.displayName,
          parrafos: ["Te has registrado en la plataforma del curso de Claude. Pulsa el botón para confirmar que este correo es tuyo."],
          boton: "Confirmar mi correo", enlace: url,
          nota: "Si no has creado esta cuenta, ignora este mensaje.",
        }) });
        return json(200, { sent: true, from: fromAddress() });
      }

      case "reset": {
        const email = String(body.email || "").trim().toLowerCase();
        // Respuesta idéntica exista o no la cuenta (no revela qué correos están registrados)
        const ok = json(200, { sent: true, from: fromAddress() });
        const user = await auth.getUserByEmail(email).catch(() => null);
        if (!user) return ok;
        const wait = await throttle(db, `reset:${email}`);
        if (wait) return json(429, { error: wait });
        const perfil = (await db.doc(`usuarios/${user.uid}`).get()).data();
        const url = await link((e) => auth.generatePasswordResetLink(e), email, origin);
        await sendMail({ to: email, ...plantilla({
          titulo: "Elige una contraseña nueva",
          nombre: perfil?.nombre || user.displayName,
          parrafos: ["Hemos recibido una solicitud para cambiar la contraseña de tu cuenta del curso de Claude. Pulsa el botón para elegir una nueva."],
          boton: "Elegir nueva contraseña", enlace: url,
          nota: "El enlace caduca en una hora. Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambiará.",
        }) });
        return ok;
      }

      case "registro": {
        const t = await sesionDe(auth, req);
        if (!t) return json(401, { error: "Sesión no válida." });
        const perfil = (await db.doc(`usuarios/${t.uid}`).get()).data();
        if (!perfil || perfil.role !== "alumno") return json(200, { sent: false });
        if (await throttle(db, `registro:${t.uid}`, { max: 1 })) return json(200, { sent: false });
        const externo = !String(perfil.email).toLowerCase().endsWith("@jrotero.es");
        for (const a of ADMINS()) {
          await sendMail({ to: a, ...plantilla({
            titulo: `Nueva alta en el curso: ${perfil.nombre}`,
            nombre: "profesor/a",
            parrafos: [
              `${perfil.nombre} (${perfil.email}) se ha registrado en el curso como alumno/a de ${perfil.curso} ${perfil.ciclo}.`,
              externo ? "Se ha registrado con el código de acceso de aula, no con un correo del centro." : "",
              "Si su correo de verificación no le llega, puedes activar su cuenta en el Panel docente → Usuarios y acceso.",
            ].filter(Boolean),
            boton: "Abrir el Panel docente", enlace: web && `${web}/#/admin/usuarios`,
          }) });
        }
        return json(200, { sent: true });
      }

      case "entrega": {
        const t = await sesionDe(auth, req);
        if (!t) return json(401, { error: "Sesión no válida." });
        const n = Number(body.sesion);
        const bloque = String(body.bloque || "");
        if (!(n >= 1 && n <= 12) || !BLOQUES[bloque]) return json(400, { error: "Sesión o bloque no válidos." });
        const e = (await db.doc(`entregas/${t.uid}_${n}_${bloque}`).get()).data();
        if (!e || e.userId !== t.uid || e.estado !== "pendiente") return json(404, { error: "No hay ninguna entrega pendiente." });
        if (await throttle(db, `entrega:${t.uid}_${n}_${bloque}`)) return json(200, { sent: false });
        const user = await auth.getUser(t.uid);
        const profesor = ADMINS()[0];
        await sendMail({
          to: user.email, bcc: profesor, replyTo: profesor,
          ...plantilla({
            titulo: `Entrega recibida · Sesión ${n} · ${BLOQUES[bloque]}`,
            nombre: e.nombre,
            parrafos: [`Hemos recibido tu entrega del ${BLOQUES[bloque]} de la Sesión ${n}. El profesor la revisará y te llegará un aviso con la nota y sus comentarios.`],
            destacado: `Enlace: ${e.enlace}${e.comentario ? `\nResumen: ${e.comentario}` : ""}`,
            boton: "Ver la actividad", enlace: web && `${web}/#/curso/${n}/actividad`,
            nota: "Guarda este correo como justificante. Si respondes, la respuesta le llega al profesor.",
          }),
        });
        return json(200, { sent: true, from: fromAddress() });
      }

      case "evaluacion": {
        const t = await sesionDe(auth, req);
        if (!esProfesor(t)) return json(403, { error: "Solo el profesorado puede enviar evaluaciones." });
        const id = String(body.id || "");
        if (!/^[A-Za-z0-9]+_\d{1,2}_(dam|asir|comun)$/.test(id)) return json(400, { error: "Entrega no válida." });
        const e = (await db.doc(`entregas/${id}`).get()).data();
        if (!e || !ESTADOS[e.estado]) return json(404, { error: "La entrega no está evaluada." });
        if (await throttle(db, `evaluacion:${id}:${e.estado}:${e.nota}`, { gap: 10 * 1000 })) return json(200, { sent: false });
        const user = await auth.getUser(e.userId);
        await sendMail({
          to: user.email, replyTo: t.email,
          ...plantilla({
            titulo: `${e.estado === "aprobada" ? "Actividad aprobada" : "Tu actividad necesita cambios"} · Sesión ${e.sesion} · ${BLOQUES[e.bloque] || ""}`,
            nombre: e.nombre,
            color: e.estado === "aprobada" ? "#efcd2f" : "#e39f7d",
            parrafos: [e.estado === "aprobada"
              ? `El profesor ha aprobado tu entrega del ${BLOQUES[e.bloque] || "bloque"} de la Sesión ${e.sesion}.`
              : `El profesor ha revisado tu entrega del ${BLOQUES[e.bloque] || "bloque"} de la Sesión ${e.sesion} y te pide algunos cambios. Corrígela y vuelve a enviarla desde la plataforma.`],
            destacado: `Estado: ${ESTADOS[e.estado]}${typeof e.nota === "number" ? `\nNota: ${e.nota}/10` : ""}${e.feedback ? `\n\nComentarios del profesor:\n${e.feedback}` : ""}`,
            boton: "Ver mi entrega", enlace: web && `${web}/#/curso/${e.sesion}/actividad`,
            nota: "Si respondes a este correo, la respuesta le llega al profesor.",
          }),
        });
        return json(200, { sent: true });
      }

      case "titulo": {
        const t = await sesionDe(auth, req);
        if (!esProfesor(t)) return json(403, { error: "Solo el profesorado puede emitir títulos." });
        const uid = String(body.userId || "");
        const d = uid && (await db.doc(`titulos/${uid}`).get()).data();
        if (!d) return json(404, { error: "No hay ningún título emitido." });
        if (await throttle(db, `titulo:${uid}:${d.codigo}`, { max: 2 })) return json(200, { sent: false });
        const user = await auth.getUser(uid);
        await sendMail({
          to: user.email, replyTo: t.email,
          ...plantilla({
            titulo: "Tu Título Propio del curso de Claude",
            nombre: d.nombre,
            parrafos: [
              `¡Enhorabuena! Has superado el curso «${CURSO}» y el centro te ha expedido el Título Propio.`,
              "Puedes verlo, imprimirlo o guardarlo en PDF desde «Mi perfil» en la plataforma.",
            ],
            destacado: `Código de verificación: ${d.codigo}${typeof d.nota === "number" ? `\nCalificación media: ${d.nota}` : ""}${web ? `\nVerificación pública: ${web}/#/verificar/${d.codigo}` : ""}`,
            boton: "Ver mi título", enlace: web && `${web}/#/titulo/${uid}`,
          }),
        });
        return json(200, { sent: true });
      }
    }
    return json(400, { error: "Acción no válida." });
  } catch (e) {
    console.error("[correo]", e);
    return json(502, { error: explicar(e) || "No se pudo enviar el correo." });
  }
};
