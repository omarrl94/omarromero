/**
 * POST /api/entregar
 * Body: { id, nombre, email, grupo, mc: number[], open: string[] }
 *
 * Corrige en el servidor, envía la corrección al correo del alumno
 * (con copia oculta al profesor) y devuelve el resultado al navegador.
 */
import { EXAMENES, dominiosPermitidos } from "../lib/examenes/index.mjs";
import { corregir } from "../lib/correccion.mjs";
import { construirCorreo } from "../lib/plantilla-correo.mjs";
import { enviarCorreo, proveedorConfigurado } from "../lib/correo.mjs";

const env = (k, def = "") => (process.env[k] || def).trim();
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const EMAIL_RE = /^[^@\s<>"',;]+@[^@\s<>"',;]+\.[a-z]{2,}$/i;

/** Solo se envía a dominios del centro: evita que el formulario se use para spam. */
function dominioPermitido(email) {
  const lista = dominiosPermitidos();
  if (lista.includes("*")) return true;
  const dom = email.split("@")[1].toLowerCase();
  return lista.some((d) => dom === d || dom.endsWith("." + d));
}

const limpiar = (s, max) => String(s ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  let body;
  try {
    const raw = await req.text();
    if (raw.length > 100_000) return json({ error: "Entrega demasiado grande" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Petición no válida" }, 400);
  }

  const ex = EXAMENES[body?.id];
  if (!ex) return json({ error: "Examen no encontrado" }, 404);

  const nombre = limpiar(body.nombre, 120);
  const email = limpiar(body.email, 160).toLowerCase();
  const grupo = limpiar(body.grupo, 60);
  if (!nombre) return json({ error: "Falta el nombre" }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: "El correo no es válido" }, 400);
  if (!dominioPermitido(email))
    return json({ error: `Usa tu correo del centro (@${dominiosPermitidos()[0]})` }, 400);

  const mc = Array.isArray(body.mc) ? body.mc.slice(0, ex.mc.length).map((v) => (Number.isInteger(v) ? v : -1)) : [];
  const open = Array.isArray(body.open) ? body.open.slice(0, ex.open.length).map((s) => String(s ?? "").slice(0, 4000)) : [];

  const res = corregir(ex, { mc, open });
  const fecha = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Madrid", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const alumno = { nombre, email, grupo, fecha };

  const correo = { enviado: false, destino: email };
  if (!proveedorConfigurado()) {
    correo.error = "El envío de correo no está configurado en el servidor.";
  } else {
    try {
      const { asunto, html, text } = construirCorreo(ex, alumno, res, env("NOMBRE_CENTRO", "FP José Ramón Otero"));
      const profesor = env("PROFESOR_EMAIL");
      await enviarCorreo({ to: email, bcc: profesor || undefined, replyTo: profesor || undefined, subject: asunto, html, text });
      correo.enviado = true;
    } catch (e) {
      console.error("Fallo al enviar correo:", e);
      correo.error = "No se ha podido enviar el correo. Descarga el PDF y avisa al profesor.";
    }
  }

  console.log(JSON.stringify({ evento: "entrega", examen: ex.id, email, grupo, nota: res.nota, correo: correo.enviado }));

  return json({
    alumno,
    nota: res.nota,
    mcOk: res.mcOk,
    openPts: res.openPts,
    // Soluciones: solo se revelan después de entregar.
    mc: res.mcRev.map((r) => ({ val: r.val, correcta: r.correcta, ok: r.ok })),
    open: res.opRev.map((r) => ({ v: r.v, exp: r.exp })),
    correo,
  });
};

export const config = { path: "/api/entregar" };
