/** Correos (HTML con estilos en línea, compatibles con Outlook) + versión en texto. */
import { LETRAS } from "./correccion.mjs";
import { env } from "./http.mjs";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => Number(n).toLocaleString("es-ES");
/** Valor de un ejercicio: notación científica si es muy grande o muy pequeño. */
const fmtV = (v) => {
  const x = Number(v);
  if (x !== 0 && (Math.abs(x) >= 1e6 || Math.abs(x) < 1e-3)) {
    const [m, e] = x.toExponential(3).split("e");
    return `${Number(m).toLocaleString("es-ES")}·10^${Number(e)}`;
  }
  return x.toLocaleString("es-ES", { maximumFractionDigits: 4 });
};
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
export function correoCodigo(tipo, nombre, codigo, { enlace = "", caduca = "15 minutos", porAdmin = false } = {}) {
  const registro = tipo === "registro";
  const asunto = registro ? `Tu código de acceso: ${codigo}` : `Código para cambiar tu contraseña: ${codigo}`;
  const intro = registro
    ? "Para activar tu cuenta de exámenes, escribe este código en la página de registro:"
    : porAdmin
      ? "La administración del centro te ha enviado este código para que pongas una contraseña nueva en tu cuenta de exámenes:"
      : "Has pedido cambiar la contraseña de tu cuenta de exámenes. Escribe este código en la página:";
  const boton = enlace ? `<p style="text-align:center;margin:18px 0 6px"><a href="${esc(enlace)}" style="display:inline-block;background:#1F2430;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">Poner mi contraseña nueva</a></p>` : "";
  const cuerpo = `<tr><td style="padding:4px 28px 20px">
    <h1 style="font-size:22px;margin:6px 0 12px">Hola, ${esc(nombre)}</h1>
    <p style="font-size:15px;color:${GRIS}">${intro}</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:.3em;background:#FBF1C2;color:#5E4D09;border-radius:12px;padding:16px 20px;text-align:center">${codigo}</div>
    ${boton}
    <p style="font-size:13px;color:${GRIS}">Caduca en ${caduca}. Si no has sido tú, ignora este correo.</p></td></tr>`;
  return {
    asunto,
    html: marco(`${CENTRO()} · Exámenes`, cuerpo, "Correo automático, no respondas a este mensaje."),
    text: `Hola, ${nombre}\n\n${intro}\n\n    ${codigo}\n\n${enlace ? `Ponla aquí: ${enlace}\n\n` : ""}Caduca en ${caduca}. Si no has sido tú, ignora este correo.`,
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
  const partes = res.partes || { mc: { pts: res.mcOk, max: ex.mc.length }, open: { pts: res.openPts, max: ex.open.length }, num: { pts: 0, max: 0 } };
  const nombre = `${e.nombre} ${e.apellidos}`.trim();
  const asunto = `${ex.titulo} — ${nombre} (${fmt(res.nota)}/10)`;
  const tit = { mc: ex.partes?.mc || "Test", open: ex.partes?.open || "Preguntas abiertas", num: ex.partes?.num || "Ejercicios" };
  const bloque = (id) => (ex.bloques || []).find((b) => b.id === id);
  const p = (x) => `<span style="color:${GRIS};font-size:12px">(${fmt(x)} p)</span>`;
  let nMc = 0, nOpen = 0, nNum = 0, ultimo = "";
  // Encabezado del ejercicio la primera vez que aparece su bloque (sin la imagen: se ve en la web).
  const cab = (q) => {
    if (!q.bloque || q.bloque === ultimo) return "";
    ultimo = q.bloque; const b = bloque(q.bloque);
    return b ? `<tr><td style="padding:12px 0 0"><div style="font-weight:800;color:#955638">${esc(b.titulo)}</div><div style="font-size:13px;color:${GRIS};white-space:pre-wrap">${esc(b.texto)}</div></td></tr>` : "";
  };

  const filaMc = (q, i) => {
    const val = e.respuestas.mc[i], r = res.mcRev[i];
    const tu = val >= 0 ? `${LETRAS[val]}) ${q.o[val]}` : "— (en blanco)";
    const conf = ex.confianza && e.respuestas.conf?.[i] >= 0 ? ` · confianza: ${["Muy seguro", "Seguro", "Poco seguro"][e.respuestas.conf[i]]}` : "";
    const col = sol ? (r.ok ? VERDE : ROJO) : TINTA;
    return cab(q) + `<tr><td style="padding:10px 0;border-bottom:1px solid #E3E6E4">
      <div style="font-weight:700">${++nMc}. ${esc(q.t)} ${p(r.pts ?? (r.ok ? 1 : 0))}</div>
      <div style="color:${col};font-size:14px;margin-top:4px">Tu respuesta: <b>${esc(tu)}</b>${esc(conf)} ${sol ? (r.ok ? "✓" : "✗") : ""}</div>
      ${sol && !r.ok ? `<div style="color:${VERDE};font-size:14px">Correcta: <b>${LETRAS[q.c]}) ${esc(q.o[q.c])}</b></div>` : ""}
      ${sol && q.exp ? `<div style="color:${GRIS};font-size:13px;margin-top:2px">${esc(q.exp)}</div>` : ""}
    </td></tr>`;
  };
  const filaOpen = (q, i) => {
    const r = res.opRev[i], v = r.v;
    const [txt, col] = v === "full" ? ["Bien", VERDE] : v === "partial" ? ["Casi", AMBAR] : ["Revisar", ROJO];
    return cab(q) + `<tr><td style="padding:10px 0;border-bottom:1px solid #E3E6E4">
      <div style="font-weight:700">${++nOpen}. ${esc(q.t)} ${p(r.pts ?? 0)}
        ${sol ? `<span style="color:${col};font-size:12px;text-transform:uppercase">[${txt}]</span>` : ""}</div>
      <div style="color:${GRIS};font-size:14px;margin-top:4px;white-space:pre-wrap">Tu respuesta: <b style="color:${TINTA}">${esc(e.respuestas.open[i].trim() || "—")}</b></div>
      ${sol && v !== "full" && q.exp ? `<div style="color:${GRIS};font-size:14px;margin-top:4px">Qué se esperaba: ${esc(q.exp)}</div>` : ""}
    </td></tr>`;
  };
  const filaNum = (q, i) => {
    const r = res.numRev[i];
    const campos = q.campos.map((c, j) => {
      const resp = e.respuestas.num?.[i]?.[j];
      const tu = c.tipo === "opcion" ? (resp >= 0 ? c.opciones[resp] : "—") : (String(resp || "").trim() || "—");
      const ok = r.campos[j].ok;
      const correcto = c.tipo === "opcion" ? c.opciones[c.correcta] : `${fmtV(c.valor)} ${c.unidad || ""}`;
      return `<div style="font-size:14px;margin-top:3px;color:${sol ? (ok ? VERDE : ROJO) : TINTA}">${esc(c.etiqueta)}: <b>${esc(tu)}</b> ${sol ? (ok ? "✓" : `✗ · correcto: <b style="color:${VERDE}">${esc(correcto)}</b>`) : ""}</div>`;
    }).join("");
    return cab(q) + `<tr><td style="padding:10px 0;border-bottom:1px solid #E3E6E4">
      <div style="font-weight:700">${esc(q.t)} ${p(r.pts)}</div>${campos}
      ${sol && q.exp ? `<div style="color:${GRIS};font-size:13px;margin-top:4px;white-space:pre-wrap">Resolución: ${esc(q.exp)}</div>` : ""}
    </td></tr>`;
  };
  const seccion = (nombre, color, filas) => `<tr><td style="padding:4px 28px 12px"><h2 style="font-size:17px;margin:14px 0 0;color:${color}">${esc(nombre)}</h2>
    <table role="presentation" width="100%">${filas}</table></td></tr>`;
  const desglose = [["mc", tit.mc], ["open", tit.open], ["num", tit.num]].filter(([k]) => partes[k].max)
    .map(([k, t]) => `${esc(t)}: <b>${fmt(partes[k].pts)} / ${fmt(partes[k].max)}</b>`).join("<br>");

  const cuerpo = `<tr><td style="padding:0 28px 8px">
    <h1 style="font-size:24px;margin:4px 0">${esc(ex.titulo)}</h1>
    <div style="color:${GRIS};font-size:14px">${esc(nombre)}${e.grupo ? " · " + esc(e.grupo) : ""} · ${esc(e.fechaTexto)}</div>
  </td></tr>
  <tr><td style="padding:12px 28px">
    <table role="presentation" width="100%" style="background:#FBF1C2;border-radius:12px"><tr>
      <td style="padding:16px 20px;font-size:40px;font-weight:800">${fmt(res.nota)}<span style="font-size:18px;color:${GRIS}"> /10</span></td>
      <td style="padding:16px 20px;font-size:14px;color:#5E4D09;text-align:right">${desglose}</td>
    </tr></table>
    ${e.finalizadoPorSalida ? `<p style="font-size:13px;color:${ROJO};background:#FBE7E4;border-radius:10px;padding:10px 14px"><b>Examen finalizado automáticamente</b> al salir de la ventana (${esc(e.finalizadoPorSalida)}). Se entregaron las respuestas que había en ese momento.</p>` : ""}
    ${ex.open.length || (ex.num || []).length ? `<p style="font-size:13px;color:#643925;background:#F8E2D6;border-radius:10px;padding:10px 14px">La corrección automática de las preguntas abiertas y los ejercicios es una <b>estimación</b> (conceptos clave y resultados finales); la revisa el profesor.</p>` : ""}
  </td></tr>
  ${ex.mc.length ? seccion(tit.mc, "#8E750D", ex.mc.map(filaMc).join("")) : ""}
  ${ex.open.length ? seccion(tit.open, "#955638", ex.open.map(filaOpen).join("")) : ""}
  ${(ex.num || []).length ? seccion(tit.num, "#2D4439", ex.num.map(filaNum).join("")) : ""}`;

  const L = [
    `${ex.titulo}${ex.modulo ? ` — ${ex.modulo}` : ""}${ex.ciclo ? ` (${ex.ciclo})` : ""}`,
    `Alumno/a: ${nombre}   Grupo: ${e.grupo || "-"}   Entregado: ${e.fechaTexto}`,
    ...(e.finalizadoPorSalida ? [`EXAMEN FINALIZADO AUTOMÁTICAMENTE al salir de la ventana (${e.finalizadoPorSalida}).`] : []),
    `NOTA: ${fmt(res.nota)}/10`,
    ...[["mc", tit.mc], ["open", tit.open], ["num", tit.num]].filter(([k]) => partes[k].max).map(([k, t]) => `  ${t}: ${fmt(partes[k].pts)} / ${fmt(partes[k].max)}`),
    "",
    ...ex.mc.map((q, i) => {
      const val = e.respuestas.mc[i];
      return `Test ${i + 1}) Tu respuesta: ${val >= 0 ? LETRAS[val] : "-"}${sol ? ` · Correcta: ${LETRAS[q.c]}) ${q.o[q.c]} ${res.mcRev[i].ok ? "[OK]" : "[X]"}` : ""}`;
    }),
    ...ex.open.map((q, i) => {
      const v = res.opRev[i].v;
      return `Abierta ${i + 1}) ${sol ? (v === "full" ? "Bien" : v === "partial" ? "Casi" : "Revisar") + (q.exp ? " — Esperado: " + q.exp : "") : "Respuesta registrada"}`;
    }),
    ...(ex.num || []).map((q, i) => `${q.t} → ${fmt(res.numRev[i].pts)}/${fmt(q.puntos ?? 1)} p${sol ? " · " + q.campos.map((c) => `${c.etiqueta}: ${c.tipo === "opcion" ? c.opciones[c.correcta] : fmtV(c.valor) + " " + (c.unidad || "")}`).join(" · ") : ""}`),
  ];

  return {
    asunto,
    html: marco(`${CENTRO()}${ex.modulo ? " · " + ex.modulo : ""}${ex.ciclo ? " (" + ex.ciclo + ")" : ""}`, cuerpo,
      "Correo generado automáticamente al entregar el examen. Puedes volver a consultar la corrección en tu panel de exámenes."),
    text: L.join("\n"),
  };
}
