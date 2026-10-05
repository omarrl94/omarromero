/** Correo de resultados (HTML con estilos en línea, compatible con Outlook). */
import { LETRAS } from "./correccion.mjs";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => n.toLocaleString("es-ES");
const VERDE = "#2E7D53", ROJO = "#C0392B", AMBAR = "#B9820B", GRIS = "#5F6673", TINTA = "#232833";

export function construirCorreo(ex, alumno, res, centro) {
  const openOver = Math.round(res.openPts * 2) / 2;
  const asunto = `${ex.titulo} — ${alumno.nombre} (${fmt(res.nota)}/10)`;

  const filaMc = (q, r, i) => {
    const tu = r.val >= 0 ? `${LETRAS[r.val]}) ${q.o[r.val]}` : "— (en blanco)";
    const col = r.ok ? VERDE : ROJO;
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #E3E6E4">
      <div style="font-weight:700;color:${TINTA}">${i + 1}. ${esc(q.t)}</div>
      <div style="color:${col};font-size:14px;margin-top:4px">Tu respuesta: <b>${esc(tu)}</b> ${r.ok ? "✓" : "✗"}</div>
      ${r.ok ? "" : `<div style="color:${VERDE};font-size:14px">Correcta: <b>${LETRAS[q.c]}) ${esc(q.o[q.c])}</b></div>`}
    </td></tr>`;
  };
  const filaOpen = (q, r, i) => {
    const [txt, col] = r.v === "full" ? ["Bien", VERDE] : r.v === "partial" ? ["Casi", AMBAR] : ["Revisar", ROJO];
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #E3E6E4">
      <div style="font-weight:700;color:${TINTA}">${ex.mc.length + i + 1}. ${esc(q.t)}
        <span style="color:${col};font-size:12px;text-transform:uppercase">[${txt}]</span></div>
      <div style="color:${GRIS};font-size:14px;margin-top:4px;white-space:pre-wrap">Tu respuesta: <b style="color:${TINTA}">${esc(r.ans.trim() || "—")}</b></div>
      <div style="color:${GRIS};font-size:14px;margin-top:4px">Qué se esperaba: ${esc(q.exp)}</div>
    </td></tr>`;
  };

  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#F3F5F6;font-family:Segoe UI,Arial,sans-serif;color:${TINTA}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F5F6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border:1px solid #E3E6E4;border-radius:14px;overflow:hidden">
  <tr><td style="height:8px;background:#EFCD2F;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:24px 28px 8px">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${GRIS};font-weight:700">${esc(centro)} · ${esc(ex.modulo)} (${esc(ex.ciclo)})</div>
    <h1 style="font-size:24px;margin:8px 0 4px">${esc(ex.titulo)}</h1>
    <div style="color:${GRIS};font-size:14px">${esc(alumno.nombre)}${alumno.grupo ? " · " + esc(alumno.grupo) : ""} · ${esc(alumno.fecha)}</div>
  </td></tr>
  <tr><td style="padding:12px 28px">
    <table role="presentation" width="100%" style="background:#FBF1C2;border-radius:12px"><tr>
      <td style="padding:16px 20px;font-size:40px;font-weight:800">${fmt(res.nota)}<span style="font-size:18px;color:${GRIS}"> /10</span></td>
      <td style="padding:16px 20px;font-size:14px;color:#5E4D09;text-align:right">
        Test: <b>${res.mcOk} / ${ex.mc.length}</b><br>Abiertas (estimación): <b>${fmt(openOver)} / ${ex.open.length}</b></td>
    </tr></table>
    <p style="font-size:13px;color:#643925;background:#F8E2D6;border-radius:10px;padding:10px 14px">La nota de las preguntas abiertas es una <b>estimación automática</b> por conceptos clave; la revisa el profesor.</p>
  </td></tr>
  <tr><td style="padding:4px 28px"><h2 style="font-size:17px;margin:12px 0 0;color:#8E750D">Parte A · Test</h2>
    <table role="presentation" width="100%">${ex.mc.map((q, i) => filaMc(q, res.mcRev[i], i)).join("")}</table></td></tr>
  <tr><td style="padding:4px 28px 20px"><h2 style="font-size:17px;margin:18px 0 0;color:#955638">Parte B · Preguntas abiertas</h2>
    <table role="presentation" width="100%">${ex.open.map((q, i) => filaOpen(q, res.opRev[i], i)).join("")}</table></td></tr>
  <tr><td style="padding:14px 28px 24px;font-size:12px;color:${GRIS};border-top:1px solid #E3E6E4">
    Correo generado automáticamente al entregar el cuestionario. Recuerda subir el PDF a la tarea de Teams si el profesor lo ha pedido.</td></tr>
</table></td></tr></table></body></html>`;

  const L = [
    `${ex.titulo} — ${ex.modulo} (${ex.ciclo})`,
    `Alumno/a: ${alumno.nombre}   Grupo: ${alumno.grupo || "-"}   Fecha: ${alumno.fecha}`,
    `NOTA: ${fmt(res.nota)}/10  (Test ${res.mcOk}/${ex.mc.length}, Abiertas est. ${fmt(openOver)}/${ex.open.length})`,
    "",
    "PARTE A · TEST",
    ...ex.mc.map((q, i) => {
      const r = res.mcRev[i];
      return `${i + 1}) Tu respuesta: ${r.val >= 0 ? LETRAS[r.val] : "-"} · Correcta: ${LETRAS[q.c]}) ${q.o[q.c]} ${r.ok ? "[OK]" : "[X]"}`;
    }),
    "",
    "PARTE B · ABIERTAS",
    ...ex.open.map((q, i) => {
      const r = res.opRev[i];
      return `${ex.mc.length + i + 1}) ${r.v === "full" ? "Bien" : r.v === "partial" ? "Casi" : "Revisar"} — Esperado: ${q.exp}`;
    }),
  ];
  return { asunto, html, text: L.join("\n") };
}
