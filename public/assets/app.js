/* Utilidades comunes de la web de exámenes. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LETRAS = ["a", "b", "c", "d", "e"];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => Number(n).toLocaleString("es-ES");

const LOGO = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="24" fill="#E6A57F"/><path d="M26 52 L43 68 L75 34" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
  const iniciales = `${usuario.nombre?.[0] || ""}${usuario.apellidos?.[0] || ""}`.toUpperCase();
  const rol = usuario.admin ? "Administración" : usuario.rol === "profesor" ? "Profesorado" : usuario.grupo || "Alumno/a";
  const enProfe = location.pathname.startsWith("/profesor");
  $("#head").innerHTML = `
    <a class="brand" href="${usuario.rol === "profesor" && enProfe ? "/profesor/" : "/panel/"}">${LOGO}<div><div class="ey">Plataforma de exámenes</div>
      <div class="nm">evalua-T <span class="tag">${esc(ciclo)}</span></div></div></a>
    <div class="who">
      <div class="user"><span class="avatar" aria-hidden="true">${esc(iniciales)}</span>
        <span><b>${esc(usuario.nombre)} ${esc(usuario.apellidos)}</b><small>${esc(rol)}</small></span></div>
      <span class="sep"></span>
      ${usuario.rol !== "profesor" ? "" : enProfe
        ? `<a class="btn ghost sm" href="/panel/" title="Ver la plataforma como un alumno">Vista alumno</a>` : `<a class="btn ghost sm" href="/profesor/">Panel profesor</a>`}
      <button class="btn ghost sm" id="salir" title="Cerrar sesión">Salir</button></div>`;
  $("#salir").onclick = async () => { await api("/api/cuenta/logout", {}).catch(() => {}); location.href = "/"; };
  return usuario;
}

/** Valores muy grandes o pequeños en notación científica (1,872·10²¹). */
function fmtV(v) {
  const x = Number(v);
  if (x !== 0 && (Math.abs(x) >= 1e6 || Math.abs(x) < 1e-3)) {
    const [m, e] = x.toExponential(3).split("e");
    const sup = String(Number(e)).replace(/[-0-9]/g, (c) => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]);
    return `${Number(m).toLocaleString("es-ES")}·10${sup}`;
  }
  return x.toLocaleString("es-ES", { maximumFractionDigits: 4 });
}
const fmtP = (p) => `<span class="pts">(${fmt(p)} p)</span>`;
const titulosPartes = (ex) => ({ mc: ex.partes?.mc || "Test", open: ex.partes?.open || "Preguntas abiertas", num: ex.partes?.num || "Ejercicios" });

/** Enunciado común de un ejercicio (título, texto y figura). */
function htmlBloque(b) {
  if (!b) return "";
  return `<div class="bloque">${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ""}${b.texto ? `<p>${esc(b.texto)}</p>` : ""}
    ${b.imagen ? `<div class="fig"><img src="${esc(b.imagen)}" alt="${esc(b.titulo || "Figura")}"></div>` : ""}</div>`;
}
/** Devuelve una función que pinta el bloque solo la primera vez que aparece. */
function cabeceraBloques(ex) {
  let ultimo = "";
  return (q) => {
    if (!q.bloque || q.bloque === ultimo) return "";
    ultimo = q.bloque;
    return htmlBloque((ex.bloques || []).find((b) => b.id === q.bloque));
  };
}

function vchip(v) {
  if (v === "full" || v === true) return `<span class="verdict v-ok">✓ Bien</span>`;
  if (v === "partial") return `<span class="verdict v-warn">~ Casi</span>`;
  return `<span class="verdict v-bad">✗ Revisar</span>`;
}

/** Puntos por parte (entregas antiguas: se reconstruyen). */
const partesVista = (d) => d.partes || { mc: { pts: d.mcOk, max: d.examen.mc.length }, open: { pts: d.openPts, max: d.examen.open.length }, num: { pts: 0, max: 0 } };

/** Tarjeta de nota + revisión detallada de una entrega (vista devuelta por la API). */
function htmlNota(d, extra = "") {
  const ex = d.examen, P = partesVista(d), T = titulosPartes(ex);
  const final = d.notaProfesor ?? d.nota;
  const fila = (k) => P[k]?.max ? `<div class="bar"><span>${esc(T[k])}</span><span>${fmt(P[k].pts)} / ${fmt(P[k].max)}</span>
    <span class="meter"><i style="width:${Math.max(0, Math.min(100, (100 * P[k].pts) / P[k].max))}%"></i></span></div>` : "";
  const color = final >= 5 ? "var(--ok)" : "var(--bad)";
  return `<div class="card">
    <div class="score"><div class="ring" style="--p:${Math.max(0, Math.min(100, final * 10))};--c:${color}"><div><div class="bigscore">${fmt(final)}</div><small class="muted">sobre 10</small></div></div>
      <div class="bars">
        ${d.notaProfesor != null ? `<div class="bar"><span>Nota revisada por el profesor</span><span>${fmt(d.notaProfesor)}</span></div><div class="bar"><span class="muted">Nota automática</span><span class="muted">${fmt(d.nota)}</span></div>` : ""}
        ${fila("mc")}${fila("open")}${fila("num")}
        <div class="bar"><span class="muted">Entregado</span><span class="muted">${esc(d.fechaTexto)}</span></div>
      </div></div>
    ${d.comentario ? `<div class="msg info"><b>Comentario del profesor:</b> ${esc(d.comentario)}</div>` : ""}
    ${d.finalizadoPorSalida && !extra.includes("finalizado automáticamente") ? `<div class="msg bad">🔒 Examen finalizado automáticamente al salir de la ventana (${esc(d.finalizadoPorSalida)}).</div>` : ""}
    ${extra}
    ${(ex.open.length || (ex.num || []).length) && d.notaProfesor == null ? `<div class="disc">La corrección automática de las preguntas abiertas y de los ejercicios es una <b>estimación</b> (conceptos clave y resultados finales); la revisa el profesor.</div>` : ""}
    <div class="actions" id="notaActions">
      <button class="btn" data-pdf>⬇ Descargar PDF</button>
      <button class="btn ghost" data-toggle-rev>${d.soluciones ? "Ver corrección" : "Ver mis respuestas"}</button>
    </div></div>`;
}

function htmlRevision(d) {
  const ex = d.examen, T = titulosPartes(ex), cab = cabeceraBloques(ex);
  const pts = d.pts || { mc: [], open: [], num: [] };
  const sec = (letra, titulo, color) => `<div class="sec"><span class="n" style="background:var(--${color}-soft);color:var(--${color}-ink)">Parte ${letra}</span><h2>${esc(titulo)}</h2></div>`;
  const pp = (x) => (x == null ? "" : fmtP(x));
  let h = "", parte = 0, n = 0;
  if (ex.mc.length) {
    h += sec("ABC"[parte++], T.mc, "amarillo");
    ex.mc.forEach((q, i) => {
      const val = d.respuestas.mc[i];
      const tu = val >= 0 ? `${LETRAS[val]}) ${q.o[val]}` : "—";
      const conf = ex.confianza ? ` · confianza: ${d.respuestas.conf?.[i] >= 0 ? esc(ex.confianzaTabla[d.respuestas.conf[i]].nombre) : "sin marcar"}` : "";
      const s = d.soluciones ? d.mc[i] : null;
      h += cab(q) + `<div class="rev ${s ? (s.ok ? "ok" : "bad") : ""}"><p class="rq">${++n}. ${esc(q.t)} ${s ? vchip(s.ok) : ""} ${pp(pts.mc[i])}</p>
        <p class="rd">Respuesta: <b>${esc(tu)}</b>${conf}</p>
        ${s && !s.ok ? `<p class="rd">Correcta: <b>${LETRAS[s.correcta]}) ${esc(q.o[s.correcta])}</b></p>` : ""}
        ${s && s.exp ? `<p class="rd">${esc(s.exp)}</p>` : ""}</div>`;
    });
  }
  if (ex.open.length) {
    h += sec("ABC"[parte++], T.open, "salmon");
    ex.open.forEach((q, i) => {
      const ans = (d.respuestas.open[i] || "").trim();
      const s = d.soluciones ? d.open[i] : null;
      const cls = s ? (s.v === "full" ? "ok" : s.v === "partial" ? "warn" : "bad") : "";
      const prof = s?.profesor ? ` <span class="chip ok" style="font-size:11px">Revisada por el profesor</span>` : "";
      h += cab(q) + `<div class="rev ${cls}"><p class="rq">${++n}. ${esc(q.t)} ${s ? vchip(s.v) : ""}${prof} ${pp(pts.open[i])}</p>
        <p class="rd">Respuesta: <b>${ans ? esc(ans) : "—"}</b></p>
        ${s ? `<p class="rd">${s.v === "full" ? "Se mencionan los conceptos esperados." : s.exp ? "Qué se esperaba: " + esc(s.exp) : ""}</p>` : ""}</div>`;
    });
  }
  if ((ex.num || []).length) {
    h += sec("ABC"[parte++], T.num, "verde");
    ex.num.forEach((q, i) => {
      const s = d.soluciones ? d.num[i] : null;
      const todos = s && s.campos.every((c) => c.ok), alguno = s && s.campos.some((c) => c.ok);
      const campos = q.campos.map((c, j) => {
        const r = d.respuestas.num?.[i]?.[j];
        const tu = c.tipo === "opcion" ? (r >= 0 ? c.opciones[r] : "—") : (String(r ?? "").trim() || "—");
        const sc = s?.campos[j];
        const correcto = sc ? (c.tipo === "opcion" ? sc.valor : `${fmtV(sc.valor)} ${sc.unidad}`) : "";
        const unidad = c.tipo !== "opcion" && c.unidad && tu !== "—" && !/[a-zA-Zµ€Ω%]/.test(tu) ? " " + esc(c.unidad) : "";
        const marca = sc ? (sc.ok ? ` <span class="verdict v-ok">✓</span>` : ` <span class="verdict v-bad">✗</span> correcto: <b>${esc(correcto)}</b>`) : "";
        return `<p class="rd">${esc(c.etiqueta)}: <b>${esc(tu)}</b>${unidad}${marca}</p>`;
      }).join("");
      h += cab(q) + `<div class="rev ${s ? (todos ? "ok" : alguno ? "warn" : "bad") : ""}"><p class="rq">${esc(q.t)} ${pp(pts.num?.[i])}</p>${campos}
        ${s && s.exp ? `<p class="rd" style="white-space:pre-wrap">Resolución: ${esc(s.exp)}</p>` : ""}</div>`;
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
  const ex = d.examen, P = partesVista(d), T = titulosPartes(ex);
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 48; let y = 40;
  doc.setFillColor(239, 205, 47); doc.rect(0, 0, W / 3, 8, "F");
  doc.setFillColor(169, 202, 187); doc.rect(W / 3, 0, W / 3, 8, "F");
  doc.setFillColor(227, 159, 125); doc.rect(2 * W / 3, 0, W / 3, 8, "F");
  // Helvetica de jsPDF no tiene subíndices/superíndices: se pasan a texto normal.
  const plano = (t) => String(t).replace(/[₀-₉]/g, (c) => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(c)])
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => "^" + [...m].map((c) => "0123456789-"["⁰¹²³⁴⁵⁶⁷⁸⁹⁻".indexOf(c)]).join(""))
    .replace(/[Ω]/g, "ohm").replace(/[µμ]/g, "u").replace(/∥/g, "||").replace(/[→]/g, "->");
  const line = (txt, { size = 10, bold = false, color = [35, 40, 51], gap = 3, indent = 0 } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...color);
    for (const ln of doc.splitTextToSize(plano(txt), W - 2 * M - indent)) { if (y > H - 40) { doc.addPage(); y = 40; } doc.text(ln, M + indent, y); y += size * 1.28; }
    y += gap;
  };
  const VERDE = [46, 125, 83], ROJO = [192, 57, 43], AMBAR = [185, 130, 11], GRIS = [80, 85, 95];
  const cab = ["EVALUA-T", ex.modulo && ex.modulo.toUpperCase()].filter(Boolean).join(" · ") + (ex.ciclo ? ` (${ex.ciclo})` : "");
  line(cab, { size: 9, bold: true, color: [95, 102, 115], gap: 6 });
  line(`${ex.titulo} — Resultados`, { size: 17, bold: true, gap: 8 });
  line(`Alumno/a: ${d.alumno.nombre} ${d.alumno.apellidos}     Grupo: ${d.alumno.grupo || "—"}`, { size: 10, color: GRIS, gap: 2 });
  line(`Correo: ${d.alumno.email}     Entregado: ${d.fechaTexto}`, { size: 10, color: GRIS, gap: 8 });
  const desg = ["mc", "open", "num"].filter((k) => P[k]?.max).map((k) => `${T[k]} ${fmt(P[k].pts)}/${fmt(P[k].max)}`).join("  ·  ");
  line(`NOTA: ${fmt(d.notaProfesor ?? d.nota)} / 10    (${desg})${d.notaProfesor != null ? "  · revisada" : ""}`, { size: 14, bold: true, gap: 10 });
  if (d.finalizadoPorSalida) line(`Examen finalizado automáticamente al salir de la ventana (${d.finalizadoPorSalida}).`, { size: 10, color: ROJO, gap: 6 });
  if (d.comentario) line(`Comentario del profesor: ${d.comentario}`, { size: 10, color: [45, 68, 57], gap: 8 });
  doc.setDrawColor(227, 230, 228); doc.line(M, y, W - M, y); y += 14;
  const bloques = ex.bloques || [];
  let ultimo = "";
  const bloque = (q) => {
    if (!q.bloque || q.bloque === ultimo) return; ultimo = q.bloque;
    const b = bloques.find((x) => x.id === q.bloque); if (!b) return;
    if (b.titulo) line(b.titulo, { size: 11, bold: true, color: [45, 68, 57], gap: 1 });
    if (b.texto) line(b.texto, { size: 9.5, color: GRIS, gap: 4 });
    if (b.imagen) {
      try {
        const p = doc.getImageProperties(b.imagen), w = Math.min(W - 2 * M, 360), h = (w * p.height) / p.width;
        if (y + h > H - 40) { doc.addPage(); y = 40; }
        doc.addImage(b.imagen, M, y, w, h); y += h + 8;
      } catch { /* imagen no compatible: se omite */ }
    }
  };
  let parte = 0, n = 0;
  if (ex.mc.length) {
    line(`PARTE ${"ABC"[parte++]} · ${T.mc}`, { size: 12, bold: true, color: [142, 117, 13], gap: 4 });
    ex.mc.forEach((q, i) => {
      bloque(q);
      const val = d.respuestas.mc[i], s = d.soluciones ? d.mc[i] : null;
      const conf = ex.confianza ? ` · confianza: ${d.respuestas.conf?.[i] >= 0 ? ex.confianzaTabla[d.respuestas.conf[i]].nombre : "sin marcar"}` : "";
      line(`${++n}. ${q.t}${d.pts ? `  (${fmt(d.pts.mc[i])} p)` : ""}`, { size: 10, bold: true, gap: 1 });
      line(`Respuesta: ${val >= 0 ? LETRAS[val] + ") " + q.o[val] : "—"}${conf}${s ? (s.ok ? "  [CORRECTA]" : "  [INCORRECTA]") : ""}`, { size: 9.5, color: s ? (s.ok ? VERDE : ROJO) : GRIS, indent: 10, gap: s && !s.ok ? 1 : 3 });
      if (s && !s.ok) line(`Correcta: ${LETRAS[s.correcta]}) ${q.o[s.correcta]}`, { size: 9.5, color: VERDE, indent: 10, gap: 3 });
    });
  }
  if (ex.open.length) {
    if (y > H - 60) { doc.addPage(); y = 40; }
    line(`PARTE ${"ABC"[parte++]} · ${T.open}`, { size: 12, bold: true, color: [149, 86, 56], gap: 4 });
    ex.open.forEach((q, i) => {
      bloque(q);
      const s = d.soluciones ? d.open[i] : null;
      const vt = s ? (s.v === "full" ? "  [BIEN]" : s.v === "partial" ? "  [CASI]" : "  [REVISAR]") : "";
      line(`${++n}. ${q.t}${vt}${d.pts ? `  (${fmt(d.pts.open[i])} p)` : ""}`, { size: 10, bold: true, color: s ? (s.v === "full" ? VERDE : s.v === "partial" ? AMBAR : ROJO) : [35, 40, 51], gap: 1 });
      line(`Respuesta: ${(d.respuestas.open[i] || "").trim() || "—"}`, { size: 9.5, color: GRIS, indent: 10, gap: 1 });
      if (s && s.v !== "full" && s.exp) line(`Qué se esperaba: ${s.exp}`, { size: 9.5, color: GRIS, indent: 10, gap: 3 }); else y += 2;
    });
  }
  if ((ex.num || []).length) {
    if (y > H - 60) { doc.addPage(); y = 40; }
    line(`PARTE ${"ABC"[parte++]} · ${T.num}`, { size: 12, bold: true, color: [45, 68, 57], gap: 4 });
    ex.num.forEach((q, i) => {
      bloque(q);
      const s = d.soluciones ? d.num[i] : null;
      line(`${q.t}${d.pts?.num ? `  (${fmt(d.pts.num[i])} p)` : ""}`, { size: 10, bold: true, gap: 1 });
      q.campos.forEach((c, j) => {
        const r = d.respuestas.num?.[i]?.[j], sc = s?.campos[j];
        const tu = c.tipo === "opcion" ? (r >= 0 ? c.opciones[r] : "—") : (String(r ?? "").trim() || "—");
        const corr = sc ? (sc.ok ? "  [OK]" : `  [X] correcto: ${c.tipo === "opcion" ? sc.valor : fmtV(sc.valor) + " " + sc.unidad}`) : "";
        line(`${c.etiqueta}: ${tu}${corr}`, { size: 9.5, color: sc ? (sc.ok ? VERDE : ROJO) : GRIS, indent: 10, gap: 1 });
      });
      if (s && s.exp) line(`Resolución: ${s.exp}`, { size: 9, color: GRIS, indent: 10, gap: 4 }); else y += 3;
    });
  }
  const safe = `${d.alumno.apellidos}_${d.alumno.nombre}`.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "alumno";
  doc.save(`${ex.id}_${safe}.pdf`);
}
