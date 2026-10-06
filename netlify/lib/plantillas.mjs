/** Correos (HTML con estilos en línea, compatibles con Outlook) + versión en texto. */
import { LETRAS } from "./correccion.mjs";
import { env } from "./http.mjs";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => Number(n).toLocaleString("es-ES");
const VERDE = "#2E7D53", ROJO = "#C0392B", AMBAR = "#B9820B", GRIS = "#5F6673", TINTA = "#232833";
const CENTRO = () => env("NOMBRE_CENTRO", "FP José Ramón Otero");

function marco(cabecera, cuerpo, pie) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#F3F5F6;font-family:Segoe UI,Arial,sans-serif;color:${TINTA}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F5F6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border:1px solid #E3E6E4;border-radius:14px;overflow:hidden">
  <tr><td style="height:8px;background:#EFCD2F;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:24px 28px 8px">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${GRIS};font-weight:700">${esc(cabecera)}</div>
  </td></tr>
  ${cuerpo}
  <tr><td style="padding:14px 28px 24px;font-size:12px;color:${GRIS};border-top:1px solid #E3E6E4">${pie}</td></tr>
</table></td></tr></table></body></html>`;
}

/* ── Código de verificación / recuperación ───────────────── */
export function correoCodigo(tipo, nombre, codigo) {
  const registro = tipo === "registro";
  const asunto = registro ? `Tu código de acceso: ${codigo}` : `Código para cambiar tu contraseña: ${codigo}`;
  const intro = registro
    ? "Para activar tu cuenta de exámenes, escribe este código en la página de registro:"
    : "Has pedido cambiar la contraseña de tu cuenta de exámenes. Escribe este código en la página:";
  const cuerpo = `<tr><td style="padding:4px 28px 20px">
    <h1 style="font-size:22px;margin:6px 0 12px">Hola, ${esc(nombre)}</h1>
    <p style="font-size:15px;color:${GRIS}">${intro}</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:.3em;background:#FBF1C2;color:#5E4D09;border-radius:12px;padding:16px 20px;text-align:center">${codigo}</div>
    <p style="font-size:13px;color:${GRIS}">Caduca en 15 minutos. Si no has sido tú, ignora este correo.</p></td></tr>`;
  return {
    asunto,
    html: marco(`${CENTRO()} · Exámenes`, cuerpo, "Correo automático, no respondas a este mensaje."),
    text: `Hola, ${nombre}\n\n${intro}\n\n    ${codigo}\n\nCaduca en 15 minutos. Si no has sido tú, ignora este correo.`,
  };
}

/* ── Aviso genérico (aprobación de profesores, solicitudes…) ── */
export function correoAviso(nombre, titulo, mensaje) {
  const cuerpo = `<tr><td style="padding:4px 28px 20px">
    <h1 style="font-size:22px;margin:6px 0 12px">${esc(titulo)}</h1>
    <p style="font-size:15px;color:${GRIS}">Hola, ${esc(nombre)}:</p>
    <p style="font-size:15px">${esc(mensaje)}</p></td></tr>`;
  return {
    asunto: titulo,
    html: marco(`${CENTRO()} · Exámenes`, cuerpo, "Correo automático de la plataforma de exámenes."),
    text: `Hola, ${nombre}:\n\n${mensaje}`,
  };
}

/* ── Resultado de un examen ───────────────────────────────── */
export function correoResultado(ex, e) {
  const res = e.resultado;
  const sol = ex.mostrarSoluciones;
  const openOver = Math.round(res.openPts * 2) / 2;
  const nombre = `${e.nombre} ${e.apellidos}`.trim();
  const asunto = `${ex.titulo} — ${nombre} (${fmt(res.nota)}/10)`;

  const filaMc = (q, i) => {
    const val = e.respuestas.mc[i], ok = res.mcRev[i].ok;
    const tu = val >= 0 ? `${LETRAS[val]}) ${q.o[val]}` : "— (en blanco)";
    const col = sol ? (ok ? VERDE : ROJO) : TINTA;
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #E3E6E4">
      <div style="font-weight:700">${i + 1}. ${esc(q.t)}</div>
      <div style="color:${col};font-size:14px;margin-top:4px">Tu respuesta: <b>${esc(tu)}</b> ${sol ? (ok ? "✓" : "✗") : ""}</div>
      ${sol && !ok ? `<div style="color:${VERDE};font-size:14px">Correcta: <b>${LETRAS[q.c]}) ${esc(q.o[q.c])}</b></div>` : ""}
    </td></tr>`;
  };
  const filaOpen = (q, i) => {
    const v = res.opRev[i].v;
    const [txt, col] = v === "full" ? ["Bien", VERDE] : v === "partial" ? ["Casi", AMBAR] : ["Revisar", ROJO];
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #E3E6E4">
      <div style="font-weight:700">${ex.mc.length + i + 1}. ${esc(q.t)}
        ${sol ? `<span style="color:${col};font-size:12px;text-transform:uppercase">[${txt}]</span>` : ""}</div>
      <div style="color:${GRIS};font-size:14px;margin-top:4px;white-space:pre-wrap">Tu respuesta: <b style="color:${TINTA}">${esc(e.respuestas.open[i].trim() || "—")}</b></div>
      ${sol && v !== "full" && q.exp ? `<div style="color:${GRIS};font-size:14px;margin-top:4px">Qué se esperaba: ${esc(q.exp)}</div>` : ""}
    </td></tr>`;
  };

  const cuerpo = `<tr><td style="padding:0 28px 8px">
    <h1 style="font-size:24px;margin:4px 0">${esc(ex.titulo)}</h1>
    <div style="color:${GRIS};font-size:14px">${esc(nombre)}${e.grupo ? " · " + esc(e.grupo) : ""} · ${esc(e.fechaTexto)}</div>
  </td></tr>
  <tr><td style="padding:12px 28px">
    <table role="presentation" width="100%" style="background:#FBF1C2;border-radius:12px"><tr>
      <td style="padding:16px 20px;font-size:40px;font-weight:800">${fmt(res.nota)}<span style="font-size:18px;color:${GRIS}"> /10</span></td>
      <td style="padding:16px 20px;font-size:14px;color:#5E4D09;text-align:right">
        ${ex.mc.length ? `Test: <b>${res.mcOk} / ${ex.mc.length}</b><br>` : ""}${ex.open.length ? `Abiertas (estimación): <b>${fmt(openOver)} / ${ex.open.length}</b>` : ""}</td>
    </tr></table>
    ${ex.open.length ? `<p style="font-size:13px;color:#643925;background:#F8E2D6;border-radius:10px;padding:10px 14px">La nota de las preguntas abiertas es una <b>estimación automática</b> por conceptos clave; la revisa el profesor.</p>` : ""}
  </td></tr>
  ${ex.mc.length ? `<tr><td style="padding:4px 28px"><h2 style="font-size:17px;margin:12px 0 0;color:#8E750D">Parte A · Test</h2>
    <table role="presentation" width="100%">${ex.mc.map(filaMc).join("")}</table></td></tr>` : ""}
  ${ex.open.length ? `<tr><td style="padding:4px 28px 20px"><h2 style="font-size:17px;margin:18px 0 0;color:#955638">Parte B · Preguntas abiertas</h2>
    <table role="presentation" width="100%">${ex.open.map(filaOpen).join("")}</table></td></tr>` : ""}`;

  const L = [
    `${ex.titulo}${ex.modulo ? ` — ${ex.modulo}` : ""}${ex.ciclo ? ` (${ex.ciclo})` : ""}`,
    `Alumno/a: ${nombre}   Grupo: ${e.grupo || "-"}   Entregado: ${e.fechaTexto}`,
    `NOTA: ${fmt(res.nota)}/10  (Test ${res.mcOk}/${ex.mc.length}, Abiertas est. ${fmt(openOver)}/${ex.open.length})`,
    "",
    ...ex.mc.map((q, i) => {
      const val = e.respuestas.mc[i];
      return `${i + 1}) Tu respuesta: ${val >= 0 ? LETRAS[val] : "-"}${sol ? ` · Correcta: ${LETRAS[q.c]}) ${q.o[q.c]} ${res.mcRev[i].ok ? "[OK]" : "[X]"}` : ""}`;
    }),
    ...ex.open.map((q, i) => {
      const v = res.opRev[i].v;
      return `${ex.mc.length + i + 1}) ${sol ? (v === "full" ? "Bien" : v === "partial" ? "Casi" : "Revisar") + (q.exp ? " — Esperado: " + q.exp : "") : "Respuesta registrada"}`;
    }),
  ];

  return {
    asunto,
    html: marco(`${CENTRO()}${ex.modulo ? " · " + ex.modulo : ""}${ex.ciclo ? " (" + ex.ciclo + ")" : ""}`, cuerpo,
      "Correo generado automáticamente al entregar el examen. Puedes volver a consultar la corrección en tu panel de exámenes."),
    text: L.join("\n"),
  };
}
