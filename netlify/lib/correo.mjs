/**
 * Envío de correo. Admite dos proveedores, según las variables de entorno:
 *
 *  · SMTP (Microsoft 365, Gmail, el servidor del centro…)
 *      SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, MAIL_FROM
 *  · Resend (https://resend.com, API HTTP; no necesita SMTP)
 *      RESEND_API_KEY, MAIL_FROM
 *
 * Si no hay ninguno configurado, `enviarCorreo` lanza un error controlado
 * y el examen sigue funcionando (el alumno ve su nota y descarga el PDF).
 */
import nodemailer from "nodemailer";
import { env } from "./http.mjs";


export function proveedorConfigurado() {
  if (env("MAIL_MODE") === "log") return "log";
  if (env("RESEND_API_KEY") && env("MAIL_FROM")) return "resend";
  if (env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS")) return "smtp";
  return null;
}

let transporte;
function smtp() {
  if (!transporte) {
    const port = Number(env("SMTP_PORT") || 587);
    transporte = nodemailer.createTransport({
      host: env("SMTP_HOST"),
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
    });
  }
  return transporte;
}

/** @param m { to, bcc?, replyTo?, subject, html, text } */
export async function enviarCorreo(m) {
  const proveedor = proveedorConfigurado();
  const from = env("MAIL_FROM") || env("SMTP_USER");
  if (proveedor === "log") {
    // Solo para pruebas locales: no envía nada.
    console.log(`\n[MAIL_MODE=log] Para: ${m.to}  CCO: ${m.bcc || "-"}\nAsunto: ${m.subject}\n\n${m.text}\n`);
    return;
  }
  if (proveedor === "resend") {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [m.to], bcc: m.bcc ? [m.bcc] : undefined, reply_to: m.replyTo || undefined,
        subject: m.subject, html: m.html, text: m.text,
      }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return;
  }
  if (proveedor === "smtp") {
    await smtp().sendMail({ from, to: m.to, bcc: m.bcc || undefined, replyTo: m.replyTo || undefined,
      subject: m.subject, html: m.html, text: m.text });
    return;
  }
  throw new Error("No hay proveedor de correo configurado");
}
