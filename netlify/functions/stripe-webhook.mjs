/**
 * Webhook de Stripe: cuando un pago se completa, crea el pedido y la matrícula.
 * Es la única vía por la que una compra da acceso (el navegador nunca puede matricularse
 * en una formación de pago: lo impiden las reglas de Firestore).
 *
 * Stripe → Developers → Webhooks → Add endpoint:
 *   https://<tu-campus>/.netlify/functions/stripe-webhook
 *   eventos: checkout.session.completed y checkout.session.async_payment_succeeded
 * Copia el «Signing secret» (whsec_…) en STRIPE_WEBHOOK_SECRET.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { firebase, problemaFirebase, json } from "../lib/firebase-admin.mjs";

const TOLERANCIA_S = 300;

/** Comprueba la firma Stripe-Signature (t=…,v1=…) sin depender del SDK de Stripe. */
export function firmaValida(cuerpo, cabecera, secreto, ahora = Date.now() / 1000) {
  if (!cabecera || !secreto) return false;
  const partes = cabecera.split(",").map(p => p.split("="));
  const t = partes.find(([k]) => k === "t")?.[1];
  const firmas = partes.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !firmas.length || Math.abs(ahora - Number(t)) > TOLERANCIA_S) return false;
  const esperada = Buffer.from(createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest("hex"));
  return firmas.some(f => { const b = Buffer.from(f); return b.length === esperada.length && timingSafeEqual(b, esperada); });
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Método no permitido." });
  const cuerpo = await req.text();
  if (!firmaValida(cuerpo, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET)) return json(400, { error: "Firma no válida." });
  if (problemaFirebase()) return json(500, { error: problemaFirebase() });   // Stripe reintentará

  const ev = JSON.parse(cuerpo);
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(ev.type)) return json(200, { ignorado: ev.type });
  const s = ev.data.object;
  if (s.payment_status !== "paid") return json(200, { pendiente: true });   // llegará async_payment_succeeded

  const uid = s.metadata?.uid, formacionId = s.metadata?.formacionId;
  if (!uid || !formacionId) return json(200, { ignorado: "sin metadatos del campus" });

  const { db } = firebase();
  const usuario = await db.doc(`usuarios/${uid}`).get();
  const nombre = usuario.exists ? usuario.data().nombre : (s.customer_details?.name || "");
  const email = s.customer_details?.email || s.customer_email || (usuario.exists ? usuario.data().email : "");
  const importe = (s.amount_total || 0) / 100;

  // Idempotente: el pedido usa el id de la sesión de Stripe, así que un reintento no duplica nada
  await db.runTransaction(async (tx) => {
    const pRef = db.doc(`pedidos/${s.id}`);
    if ((await tx.get(pRef)).exists) return;
    tx.set(pRef, {
      uid, formacionId, importe, moneda: s.currency || "eur", estado: "pagado", metodo: "Stripe",
      pagoId: s.payment_intent || null, fecha: FieldValue.serverTimestamp(), nombre, email
    });
    tx.set(db.doc(`matriculas/${uid}_${formacionId}`), {
      uid, formacionId, origen: "compra", estado: "activa", importe, pedido: s.id,
      fecha: FieldValue.serverTimestamp(), nombre, email
    });
  });
  return json(200, { ok: true });
};
