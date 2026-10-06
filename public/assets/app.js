/* Utilidades comunes de la web de exámenes. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LETRAS = ["a", "b", "c", "d", "e"];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => Number(n).toLocaleString("es-ES");

const LOGO = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="#E6A57F"/><path d="M14 15 C 28 28, 30 38, 34 49 L 43 71 A 21 21 0 1 0 70 43 L 53 36 C 40 31, 28 25, 16 13 Z" fill="#fff"/></svg>`;

/** Llamada a la API. Lanza Error con el mensaje del servidor. 401 → al inicio. */
async function api(ruta, cuerpo, { redirigir401 = true } = {}) {
  const opts = cuerpo === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) };
  let r;
  try { r = await fetch(ruta, { credentials: "same-origin", ...opts }); }
  catch { throw new Error("Sin conexión con el servidor. Comprueba tu conexión a Internet."); }
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && redirigir401) {
    location.href = "/?volver=" + encodeURIComponent(location.pathname + location.search);
    throw new Error("Sesión caducada");
  }
  if (!r.ok) { const e = new Error(data.error || `Error ${r.status}`); e.status = r.status; throw e; }
  return data;
}

/** Cabecera con logo y usuario. Devuelve el usuario (o redirige si no hay sesión). */
async function cabecera({ ciclo = "Exámenes" } = {}) {
  const { usuario } = await api("/api/cuenta/yo");
  $("#head").innerHTML = `
    <a class="brand" href="/panel/">${LOGO}<div><div class="ey">Formación Profesional</div>
      <div class="nm">José Ramón Otero <span class="tag">${esc(ciclo)}</span></div></div></a>
    <div class="who"><span><b>${esc(usuario.nombre)} ${esc(usuario.apellidos)}</b>${usuario.grupo ? " · " + esc(usuario.grupo) : ""}</span>
      ${usuario.rol !== "profesor" ? "" : location.pathname.startsWith("/profesor")
        ? `<a class="btn ghost sm" href="/panel/">Vista del alumno</a>` : `<a class="btn ghost sm" href="/profesor/">Panel del profesor</a>`}
      <button class="btn ghost sm" id="salir">Salir</button></div>`;
  $("#salir").onclick = async () => { await api("/api/cuenta/logout", {}).catch(() => {}); location.href = "/"; };
  return usuario;
}

function vchip(v) {
  if (v === "full" || v === true) return `<span class="verdict v-ok">✓ Bien</span>`;
  if (v === "partial") return `<span class="verdict v-warn">~ Casi</span>`;
  return `<span class="verdict v-bad">✗ Revisar</span>`;
}

/** Tarjeta de nota + revisión detallada de una entrega (vista devuelta por la API). */
function htmlNota(d, extra = "") {
  const ex = d.examen;
  const openOver = Math.round(d.openPts * 2) / 2;
  const final = d.notaProfesor ?? d.nota;
  return `<div class="card">
    <div class="score"><div class="bigscore">${fmt(final)}<small> /10</small></div>
      <div class="bars">
        ${d.notaProfesor != null ? `<div class="bar"><span>Nota revisada por el profesor</span><span>${fmt(d.notaProfesor)}</span></div><div class="bar"><span>Nota automática</span><span>${fmt(d.nota)}</span></div>` : ""}
        ${ex.mc.length ? `<div class="bar"><span>Test (Parte A)</span><span>${d.mcOk} / ${ex.mc.length}</span></div>` : ""}
        ${ex.open.length ? `<div class="bar"><span>Abiertas (Parte B, estimación)</span><span>${fmt(openOver)} / ${ex.open.length}</span></div>` : ""}
        <div class="bar"><span>Entregado</span><span>${esc(d.fechaTexto)}</span></div>
      </div></div>
    ${d.comentario ? `<div class="msg info"><b>Comentario del profesor:</b> ${esc(d.comentario)}</div>` : ""}
    ${d.finalizadoPorSalida && !extra ? `<div class="msg bad">🔒 Examen finalizado automáticamente al salir de la ventana (${esc(d.finalizadoPorSalida)}).</div>` : ""}
    ${extra}
    ${ex.open.length && d.notaProfesor == null ? `<div class="disc">La nota de las preguntas abiertas es una <b>estimación automática</b> por conceptos clave; la revisa el profesor.</div>` : ""}
    <div class="actions" id="notaActions">
      <button class="btn" data-pdf>⬇ Descargar PDF</button>
      <button class="btn ghost" data-toggle-rev>${d.soluciones ? "Ver corrección" : "Ver mis respuestas"}</button>
    </div></div>`;
}

function htmlRevision(d) {
  const ex = d.examen;
  let h = "";
  if (ex.mc.length) {
    h += `<div class="sec"><span class="n" style="background:var(--amarillo-soft);color:var(--amarillo-ink)">Parte A</span><h2>${d.soluciones ? "Corrección del test" : "Tus respuestas"}</h2></div>`;
    ex.mc.forEach((q, i) => {
      const val = d.respuestas.mc[i];
      const tu = val >= 0 ? `${LETRAS[val]}) ${q.o[val]}` : "—";
      const s = d.soluciones ? d.mc[i] : null;
      h += `<div class="rev ${s ? (s.ok ? "ok" : "bad") : ""}"><p class="rq">${i + 1}. ${esc(q.t)} ${s ? vchip(s.ok) : ""}</p>
        <p class="rd">Respuesta: <b>${esc(tu)}</b></p>
        ${s && !s.ok ? `<p class="rd">Correcta: <b>${LETRAS[s.correcta]}) ${esc(q.o[s.correcta])}</b></p>` : ""}</div>`;
    });
  }
  if (ex.open.length) {
    h += `<div class="sec"><span class="n" style="background:var(--salmon-soft);color:var(--salmon-ink)">Parte B</span><h2>${d.soluciones ? "Corrección de las abiertas" : "Preguntas abiertas"}</h2></div>`;
    ex.open.forEach((q, i) => {
      const ans = (d.respuestas.open[i] || "").trim();
      const s = d.soluciones ? d.open[i] : null;
      const cls = s ? (s.v === "full" ? "ok" : s.v === "partial" ? "warn" : "bad") : "";
      h += `<div class="rev ${cls}"><p class="rq">${ex.mc.length + i + 1}. ${esc(q.t)} ${s ? vchip(s.v) : ""}</p>
        <p class="rd">Respuesta: <b>${ans ? esc(ans) : "—"}</b></p>
        ${s ? `<p class="rd">${s.v === "full" ? "Se mencionan los conceptos esperados." : s.exp ? "Qué se esperaba: " + esc(s.exp) : ""}</p>` : ""}</div>`;
    });
  }
  return h;
}

/** Pinta nota + revisión en `cont` y conecta los botones. */
function pintarEntrega(cont, d, extra = "") {
  cont.innerHTML = htmlNota(d, extra) + `<div data-rev hidden>${htmlRevision(d)}</div>`;
  $("[data-toggle-rev]", cont).onclick = () => { const b = $("[data-rev]", cont); b.hidden = !b.hidden; if (!b.hidden) b.scrollIntoView({ behavior: "smooth" }); };
  $("[data-pdf]", cont).onclick = (ev) => descargarPDF(d, ev.currentTarget);
}

/** PDF con nota, respuestas y (si procede) corrección. Usa jsPDF desde CDN. */
async function descargarPDF(d, boton) {
  if (!window.jspdf) {
    boton.disabled = true;
    await new Promise((ok) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = s.onerror = ok; document.head.appendChild(s);
    });
    boton.disabled = false;
    if (!window.jspdf) { boton.insertAdjacentHTML("afterend", `<span class="muted">No se ha podido cargar el generador de PDF.</span>`); return; }
  }
  const ex = d.examen;
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 48; let y = 40;
  doc.setFillColor(239, 205, 47); doc.rect(0, 0, W / 3, 8, "F");
  doc.setFillColor(169, 202, 187); doc.rect(W / 3, 0, W / 3, 8, "F");
  doc.setFillColor(227, 159, 125); doc.rect(2 * W / 3, 0, W / 3, 8, "F");
  const line = (txt, { size = 10, bold = false, color = [35, 40, 51], gap = 3, indent = 0 } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...color);
    for (const ln of doc.splitTextToSize(String(txt), W - 2 * M - indent)) { if (y > H - 40) { doc.addPage(); y = 40; } doc.text(ln, M + indent, y); y += size * 1.28; }
    y += gap;
  };
  const cab = ["FP JOSÉ RAMÓN OTERO", ex.modulo && ex.modulo.toUpperCase()].filter(Boolean).join(" · ") + (ex.ciclo ? ` (${ex.ciclo})` : "");
  line(cab, { size: 9, bold: true, color: [95, 102, 115], gap: 6 });
  line(`${ex.titulo} — Resultados`, { size: 17, bold: true, gap: 8 });
  line(`Alumno/a: ${d.alumno.nombre} ${d.alumno.apellidos}     Grupo: ${d.alumno.grupo || "—"}`, { size: 10, color: [80, 85, 95], gap: 2 });
  line(`Correo: ${d.alumno.email}     Entregado: ${d.fechaTexto}`, { size: 10, color: [80, 85, 95], gap: 8 });
  const openOver = Math.round(d.openPts * 2) / 2;
  line(`NOTA: ${fmt(d.notaProfesor ?? d.nota)} / 10    (Test ${d.mcOk}/${ex.mc.length}  ·  Abiertas est. ${fmt(openOver)}/${ex.open.length})${d.notaProfesor != null ? "  · revisada" : ""}`, { size: 14, bold: true, gap: 10 });
  if (d.comentario) line(`Comentario del profesor: ${d.comentario}`, { size: 10, color: [45, 68, 57], gap: 8 });
  doc.setDrawColor(227, 230, 228); doc.line(M, y, W - M, y); y += 14;
  const VERDE = [46, 125, 83], ROJO = [192, 57, 43], AMBAR = [185, 130, 11], GRIS = [80, 85, 95];
  if (ex.mc.length) {
    line("PARTE A · Test", { size: 12, bold: true, color: [142, 117, 13], gap: 4 });
    ex.mc.forEach((q, i) => {
      const val = d.respuestas.mc[i], s = d.soluciones ? d.mc[i] : null;
      line(`${i + 1}. ${q.t}`, { size: 10, bold: true, gap: 1 });
      line(`Respuesta: ${val >= 0 ? LETRAS[val] + ") " + q.o[val] : "—"}${s ? (s.ok ? "  [CORRECTA]" : "  [INCORRECTA]") : ""}`, { size: 9.5, color: s ? (s.ok ? VERDE : ROJO) : GRIS, indent: 10, gap: s && !s.ok ? 1 : 3 });
      if (s && !s.ok) line(`Correcta: ${LETRAS[s.correcta]}) ${q.o[s.correcta]}`, { size: 9.5, color: VERDE, indent: 10, gap: 3 });
    });
  }
  if (ex.open.length) {
    if (y > H - 60) { doc.addPage(); y = 40; }
    line("PARTE B · Preguntas abiertas", { size: 12, bold: true, color: [149, 86, 56], gap: 4 });
    ex.open.forEach((q, i) => {
      const s = d.soluciones ? d.open[i] : null;
      const vt = s ? (s.v === "full" ? "  [BIEN]" : s.v === "partial" ? "  [CASI]" : "  [REVISAR]") : "";
      line(`${ex.mc.length + i + 1}. ${q.t}${vt}`, { size: 10, bold: true, color: s ? (s.v === "full" ? VERDE : s.v === "partial" ? AMBAR : ROJO) : [35, 40, 51], gap: 1 });
      line(`Respuesta: ${(d.respuestas.open[i] || "").trim() || "—"}`, { size: 9.5, color: GRIS, indent: 10, gap: 1 });
      if (s && s.v !== "full" && s.exp) line(`Qué se esperaba: ${s.exp}`, { size: 9.5, color: GRIS, indent: 10, gap: 3 }); else y += 2;
    });
  }
  const safe = `${d.alumno.apellidos}_${d.alumno.nombre}`.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "alumno";
  doc.save(`${ex.id}_${safe}.pdf`);
}
