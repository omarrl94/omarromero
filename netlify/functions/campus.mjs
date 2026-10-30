/**
 * Función del Campus Virtual (Netlify). Hace lo que un navegador no puede hacer solo:
 *
 *   GET                         → { pagos, configurado }: qué está activo (sin datos sensibles)
 *   GET ?email=…&formacion=…    → { acceso, motivo }: consulta de acceso para las plataformas
 *                                 de cada formación. Cabecera obligatoria  X-Campus-Key: CAMPUS_API_KEY
 *   POST {action:"checkout"}    → crea el pago en Stripe Checkout y devuelve su URL
 *   POST {action:"canjear"}     → canjea un código de acceso (transacción: usos + matrícula)
 *   POST {action:"enlace"}      → dirección de la plataforma con ?campus=<token firmado> (1 h): la
 *                                 plataforma comprueba la firma y da acceso a ese correo (INTEGRACION.md)
 *
 * Variables (Netlify → Environment variables, ámbito «Functions»):
 *   FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT   cuenta de servicio del proyecto del campus
 *   STRIPE_SECRET_KEY                                sk_live_… o sk_test_… (sin ella: «Solicitar matrícula»)
 *   CAMPUS_API_KEY                                   clave compartida con las plataformas de las formaciones
 *   PLATAFORMAS_CODIGO                               formaciones que se matriculan con código de admisión propio,
 *                                                    p. ej. {"master-ia-dam":{"proyecto":"master-ia-jrotero","prefijo":"MIA"}}
 *   APP_URL                                          dirección pública del campus (por defecto, la de Netlify)
 */
import { randomInt, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { firebase, firestoreDe, problemaFirebase, json, motivoAcceso } from "../lib/firebase-admin.mjs";
import { firmarTokenCampus } from "../lib/token-campus.mjs";

const env = process.env;
const pagosActivos = () => !!env.STRIPE_SECRET_KEY && !problemaFirebase();
const iguales = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const baseURL = (req) => (env.APP_URL || env.URL || new URL(req.url).origin).replace(/\/+$/, "");

async function sesion(auth, req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return token ? auth.verifyIdToken(token).catch(() => null) : null;
}

/* ── Consulta de acceso desde otra plataforma ───────────────────────────────── */
async function consultaAcceso(req, url) {
  const clave = req.headers.get("x-campus-key") || "";
  if (!env.CAMPUS_API_KEY || !iguales(clave, env.CAMPUS_API_KEY)) return json(401, { error: "Clave del campus no válida." });
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
  const formacionId = String(url.searchParams.get("formacion") || "");
  if (!email || !/^[\w-]{1,60}$/.test(formacionId)) return json(400, { error: "Indica email y formacion." });
  const { auth, db } = firebase();
  const user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) return json(200, { acceso: false, motivo: null });
  const motivo = await motivoAcceso(db, { uid: user.uid, email, verificado: user.emailVerified }, formacionId);
  return json(200, { acceso: !!motivo, motivo, nombre: motivo ? user.displayName || null : null });
}

/* ── Pago con Stripe Checkout ───────────────────────────────────────────────── */
async function checkout(req, t, body, db) {
  if (!env.STRIPE_SECRET_KEY) return json(501, { error: "El pago online no está activado. Usa «Solicitar matrícula»." });
  const formacionId = String(body.formacionId || "");
  const snap = /^[\w-]{1,60}$/.test(formacionId) ? await db.doc(`formaciones/${formacionId}`).get() : null;
  if (!snap?.exists) return json(404, { error: "Esa formación no existe." });
  const f = snap.data();
  const precio = Math.round(Number(f.precio) * 100);
  if (f.estado !== "abierta") return json(409, { error: "La matrícula de esta formación no está abierta." });
  if (!(precio > 0)) return json(409, { error: "Esta formación es gratuita: matricúlate desde su ficha." });
  if (await motivoAcceso(db, { uid: t.uid, email: t.email, verificado: t.email_verified }, formacionId)) return json(409, { error: "Ya tienes acceso a esta formación." });

  const base = baseURL(req);
  const p = new URLSearchParams({
    mode: "payment",
    locale: "es",
    customer_email: t.email,
    client_reference_id: t.uid,
    "metadata[uid]": t.uid,
    "metadata[formacionId]": formacionId,
    "payment_intent_data[metadata][uid]": t.uid,
    "payment_intent_data[metadata][formacionId]": formacionId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(precio),
    "line_items[0][price_data][product_data][name]": String(f.titulo).slice(0, 250),
    "line_items[0][price_data][product_data][description]": `${f.horas} h · Campus Virtual FP José Ramón Otero`,
    success_url: `${base}/#/pago/ok/${encodeURIComponent(formacionId)}`,
    cancel_url: `${base}/#/pago/cancelado/${encodeURIComponent(formacionId)}`
  });
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `${t.uid}-${formacionId}-${Math.floor(Date.now() / 60000)}` },
    body: p
  });
  const s = await r.json().catch(() => ({}));
  if (!r.ok) { console.error("[campus] Stripe:", s.error?.message || r.status); return json(502, { error: "No se ha podido abrir la pasarela de pago. Inténtalo de nuevo en unos minutos." }); }
  return json(200, { url: s.url });
}

/* ── Canje de un código de acceso ───────────────────────────────────────────── */
async function canjear(t, body, db) {
  const codigo = String(body.codigo || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,40}$/.test(codigo)) return json(400, { error: "El código no es válido." });
  const usuario = await db.doc(`usuarios/${t.uid}`).get();
  if (!usuario.exists) return json(403, { error: "Completa tu perfil antes de canjear un código." });
  try {
    const formacionId = await db.runTransaction(async (tx) => {
      const ref = db.doc(`codigos/${codigo}`);
      const c = await tx.get(ref);
      if (!c.exists) throw new Error("El código no existe.");
      const d = c.data();
      if (d.caduca && new Date(d.caduca) < new Date()) throw new Error("El código ha caducado.");
      if ((d.usos || 0) >= (d.usosMax || 1)) throw new Error("El código ya se ha usado todas las veces permitidas.");
      const mRef = db.doc(`matriculas/${t.uid}_${d.formacionId}`);
      const m = await tx.get(mRef);
      if (m.exists && m.data().estado === "activa") throw new Error("Ya tienes acceso a esta formación.");
      tx.update(ref, { usos: FieldValue.increment(1), ultimoUso: FieldValue.serverTimestamp() });
      tx.set(mRef, {
        uid: t.uid, formacionId: d.formacionId, origen: "codigo", codigo, estado: "activa", importe: 0,
        fecha: FieldValue.serverTimestamp(), nombre: usuario.data().nombre, email: t.email
      });
      return d.formacionId;
    });
    return json(200, { ok: true, formacionId });
  } catch (e) {
    return json(409, { error: e.message });
  }
}

/* ── Código de admisión en la plataforma (máster) ───────────────────────────────
   El máster matricula con códigos de admisión de un solo uso. Para quien tiene acceso en el
   campus, el campus crea uno en el Firestore del máster (o reutiliza el suyo si aún no lo ha
   usado) y lo lleva ya puesto en el formulario de matrícula. Si ya lo usó, está matriculado. */
function plataformaConCodigo(formacionId) {
  let mapa = {};
  try { mapa = JSON.parse(env.PLATAFORMAS_CODIGO || "{}"); } catch { console.error("[campus] PLATAFORMAS_CODIGO no es JSON"); }
  const c = mapa[formacionId];
  if (!c) return null;
  return typeof c === "string" ? { proyecto: c, prefijo: "MIA" } : { prefijo: "MIA", ...c };
}

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const parte = () => Array.from({ length: 4 }, () => LETRAS[randomInt(LETRAS.length)]).join("");

async function codigoAdmision(db, plat, t, formacionId, motivo) {
  const otro = firestoreDe(plat.proyecto);
  const ref = db.doc(`codigosPlataforma/${t.uid}_${formacionId}`);
  const previo = await ref.get();
  if (previo.exists) {
    const c = await otro.doc(`codigos/${previo.data().codigo}`).get();
    if (c.exists && !c.data().revocado) return c.data().usadoPor ? null : previo.data().codigo;
  }
  let codigo;
  do { codigo = `${plat.prefijo}-${parte()}-${parte()}`; } while ((await otro.doc(`codigos/${codigo}`).get()).exists);
  // Mismos campos que los códigos que crea la Dirección desde su panel
  await otro.doc(`codigos/${codigo}`).set({
    creado: new Date().toISOString(), nota: `Campus Virtual · ${motivo} · ${String(t.email).toLowerCase()}`, usadoPor: null, revocado: null
  });
  await ref.set({ codigo, proyecto: plat.proyecto, motivo, creadoEn: FieldValue.serverTimestamp() });
  return codigo;
}

/* ── Enlace firmado para entrar en la plataforma de una formación ─────────────── */
async function enlace(t, body, db) {
  const formacionId = String(body.formacionId || "");
  const snap = /^[\w-]{1,60}$/.test(formacionId) ? await db.doc(`formaciones/${formacionId}`).get() : null;
  if (!snap?.exists) return json(404, { error: "Esa formación no existe." });
  const url = String(snap.data().url || "");
  if (!/^https:\/\//.test(url)) return json(409, { error: "La plataforma de esta formación aún no está publicada." });
  const motivo = await motivoAcceso(db, { uid: t.uid, email: t.email, verificado: t.email_verified }, formacionId);
  if (!motivo) return json(403, { error: "No tienes acceso a esta formación." });
  const perfil = await db.doc(`usuarios/${t.uid}`).get();
  const nombre = perfil.exists ? perfil.data().nombre : "";
  const destino = new URL(url);

  const plat = plataformaConCodigo(formacionId);
  if (plat) {
    let codigo = null;
    try { codigo = await codigoAdmision(db, plat, t, formacionId, motivo); }
    catch (e) { console.error(`[campus] código de admisión en ${plat.proyecto}:`, e.message); return json(200, { url }); }
    if (codigo) {
      destino.searchParams.set("campus_codigo", codigo);
      destino.searchParams.set("campus_email", String(t.email).toLowerCase());
      if (nombre) destino.searchParams.set("campus_nombre", nombre);
    }
    return json(200, { url: destino.toString() });
  }

  // Sin clave compartida la plataforma no podría comprobar nada: se entra con su registro de siempre
  if (!env.CAMPUS_API_KEY) return json(200, { url });
  destino.searchParams.set("campus", firmarTokenCampus({
    e: String(t.email).toLowerCase(), n: nombre, f: formacionId, m: motivo
  }, env.CAMPUS_API_KEY));
  return json(200, { url: destino.toString() });
}

export default async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    if (url.searchParams.has("email")) {
      if (problemaFirebase()) return json(501, { error: problemaFirebase() });
      return consultaAcceso(req, url);
    }
    return json(200, { pagos: pagosActivos(), configurado: !problemaFirebase() });
  }
  if (req.method !== "POST") return json(405, { error: "Método no permitido." });
  if (problemaFirebase()) return json(501, { error: `El servidor del campus no está configurado: ${problemaFirebase()}` });

  const body = await req.json().catch(() => ({}));
  const { auth, db } = firebase();
  const t = await sesion(auth, req);
  if (!t) return json(401, { error: "Inicia sesión de nuevo." });
  if (!t.email_verified) return json(403, { error: "Verifica tu correo antes de matricularte." });

  try {
    if (body.action === "checkout") return await checkout(req, t, body, db);
    if (body.action === "canjear") return await canjear(t, body, db);
    if (body.action === "enlace") return await enlace(t, body, db);
  } catch (e) {
    console.error("[campus]", e);
    return json(500, { error: "Error del servidor del campus." });
  }
  return json(400, { error: "Acción desconocida." });
};
