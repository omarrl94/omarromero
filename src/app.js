/* =====================================================================
   Campus Virtual · Formación Profesional JOSÉ RAMÓN OTERO
   Puerta de entrada a todas las formaciones del centro: catálogo de cursos,
   másteres y módulos, matrícula (compra, código, solicitud o acceso del centro)
   y acceso a la plataforma de cada formación.
   ===================================================================== */
import {
  LOGO_IMG_SRC, CENTRO, CAMPUS, ADMIN_EMAIL, DOMINIO, FIREBASE, DEMO_MODE, TIPOS, ESTADOS, ORIGENES
} from "./constantes.js";
import { CATALOGO_INICIAL } from "./catalogo.js";
import { DB, motivoAcceso, esDelCentro, generarCodigoAcceso } from "./estado.js";
import { crearBackendLocal } from "./backend-local.js";

/* =====================================================================
   LOGOTIPO E ISOTIPO
   ===================================================================== */
const GOTA_PATH = "M117 113 C230 205 360 280 548 340 A161 161 0 1 1 340 548 C290 410 230 240 117 113 Z";

function isotipoSVG(px) {
  return `<svg width="${px}" height="${px}" viewBox="0 0 60 60" role="img" aria-label="Isotipo JRO">
    <rect x="0" y="0" width="60" height="60" rx="8" fill="#000000"/>
    <g transform="scale(0.0763)"><path d="${GOTA_PATH}" fill="#FFFFFF"/></g>
  </svg>`;
}

function logoSVG(alto) {
  const ancho = Math.round(alto * 300 / 60);
  return `<svg width="${ancho}" height="${alto}" viewBox="0 0 300 60" role="img" aria-label="${CENTRO}">
    <rect x="0" y="0" width="60" height="60" rx="8" fill="#000000"/>
    <g transform="scale(0.0763)"><path d="${GOTA_PATH}" fill="#FFFFFF"/></g>
    <text x="72" y="25" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="400" fill="#111111">Formación Profesional</text>
    <text x="72" y="49" font-family="Inter, Arial, sans-serif" font-size="19" font-weight="700" fill="#111111" letter-spacing="0.3">JOSÉ RAMÓN OTERO</text>
  </svg>`;
}

// Círculo de color con la gota del isotipo recortada (elemento gráfico de la identidad)
const CIRCULO_PATH = "M0 393 A393 393 0 1 0 786 393 A393 393 0 1 0 0 393 Z";
function gota(color, clase = "") {
  return `<svg class="${clase}" viewBox="0 0 786 786" aria-hidden="true"><path fill-rule="evenodd" d="${CIRCULO_PATH} ${GOTA_PATH}" fill="${color}"/></svg>`;
}

function logo(alto) {
  return `<img src="${LOGO_IMG_SRC}" alt="${CENTRO}" data-logo="${alto}" style="height:${alto}px;width:auto">`;
}
document.addEventListener("error", (ev) => {
  const img = ev.target;
  if (img instanceof HTMLImageElement && img.dataset.logo) img.outerHTML = logoSVG(Number(img.dataset.logo));
}, true);

/* =====================================================================
   UTILIDADES
   ===================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fecha = (iso) => iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—";
const fechaCorta = (iso) => iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const esURL = (s) => /^https:\/\/[^\s]+$/i.test(String(s || "").trim());
// En es-ES Intl no separa los miles de 4 cifras (1290 €): se fuerza el punto como en el resto del centro
const euros = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: Number(n) % 1 ? 2 : 0 })
  .format(Number(n) || 0).replace(/^(\d)(\d{3})(?=\D)/, "$1.$2");
const precioTexto = (f) => Number(f.precio) > 0 ? euros(f.precio) : "Gratuita";
const INPUT = "mt-1 w-full rounded-lg border border-jro-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jro-gold";
const lineas = (s) => String(s || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 3600);
}

async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = texto; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch {}
    ta.remove();
  }
  toast("Copiado al portapapeles");
}

function descargar(nombre, contenido, tipo = "application/json") {
  const blob = new Blob([contenido], { type: tipo });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const csv = (filas) => "﻿" + filas.map(f => f.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");

/* =====================================================================
   ESTADO DE LA INTERFAZ Y RUTAS
   #/  #/catalogo/master  #/formacion/curso-claude  #/mi-campus  #/acceso/registro
   #/perfil  #/admin/catalogo  #/admin/formacion/nueva  #/pago/ok/curso-claude
   ===================================================================== */
let backend;
let AUTH = { estado: "cargando" };

const UI = {
  vista: "inicio",
  tipo: "todos",            // filtro del catálogo
  buscar: "",
  formacionId: null,
  authTab: "login",
  despues: null,            // a dónde volver tras iniciar sesión
  adminTab: "resumen",
  editarId: null,           // formación en edición (o "nueva")
  filtroFormacion: "todas",
  buscarAlumno: "",
  pagoFormacion: null
};

const TABS_ADMIN = [
  ["resumen", "Resumen"], ["catalogo", "Catálogo"], ["matriculas", "Matrículas"], ["solicitudes", "Solicitudes"],
  ["alumnado", "Alumnado"], ["codigos", "Códigos"], ["avisos", "Avisos"], ["pedidos", "Pedidos"]
];

function aplicarRuta() {
  const [vista, a, b] = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  UI.vista = "inicio";
  if (!vista) return;
  if (vista === "catalogo") { UI.tipo = TIPOS[a] ? a : "todos"; return; }
  if (vista === "formacion" && a) { UI.vista = "formacion"; UI.formacionId = a; return; }
  if (vista === "mi-campus") { UI.vista = "micampus"; return; }
  if (vista === "acceso") { UI.vista = "acceso"; UI.authTab = a === "registro" ? "registro" : "login"; return; }
  if (vista === "perfil") { UI.vista = "perfil"; return; }
  if (vista === "pago") { UI.vista = "pago"; UI.pagoFormacion = b || null; UI.pagoEstado = a === "ok" ? "ok" : "cancelado"; return; }
  if (vista === "admin") {
    UI.vista = "admin";
    if (a === "formacion") { UI.adminTab = "catalogo"; UI.editarId = b || "nueva"; }
    else { UI.editarId = null; if (TABS_ADMIN.some(([id]) => id === a)) UI.adminTab = a; }
  }
}

function ir(hash) {
  if (location.hash === hash) { aplicarRuta(); render(); }
  else location.hash = hash;
}
window.addEventListener("hashchange", () => { aplicarRuta(); render(); window.scrollTo(0, 0); });

const dentro = () => AUTH.estado === "dentro";
const usuario = () => dentro() ? DB.usuarios.find(u => u.id === AUTH.userId) || null : null;
const esAdmin = () => usuario()?.role === "admin";
const verificado = () => AUTH.verificado !== false;
const formacion = (id) => DB.formaciones.find(f => f.id === id);
const ordenadas = () => [...DB.formaciones].sort((a, b) => (Number(a.orden) || 99) - (Number(b.orden) || 99) || a.titulo.localeCompare(b.titulo));
const acceso = (f) => motivoAcceso(usuario(), f, verificado());
const misFormaciones = () => ordenadas().filter(f => { const m = acceso(f); return m && m !== "admin"; });
const solicitudPendiente = (f) => DB.solicitudes.find(s => s.uid === AUTH.userId && s.formacionId === f.id && s.estado === "pendiente");
const pendientes = () => DB.solicitudes.filter(s => s.estado === "pendiente");

/* =====================================================================
   COMPONENTES COMUNES
   ===================================================================== */
function badgeTipo(tipo, extra = "") {
  const t = TIPOS[tipo] || TIPOS.curso;
  return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.fondo} ${extra}">${t.nombre}</span>`;
}

function badgeEstado(estado) {
  const clase = { abierta: "bg-white text-jro-ink", proximamente: "bg-jro-ink text-white", cerrada: "bg-gray-200 text-jro-mute" }[estado] || "bg-gray-100";
  return `<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${clase}">${ESTADOS[estado] || estado}</span>`;
}

function badgeAcceso(motivo) {
  if (!motivo) return "";
  const texto = motivo === "admin" ? "Administración" : "Tienes acceso";
  return `<span class="inline-flex items-center gap-1 rounded-full bg-jro-ink text-white px-2.5 py-0.5 text-xs font-semibold"><span aria-hidden="true">✓</span> ${texto}</span>`;
}

function header() {
  const u = usuario();
  const nav = (vistas, hash, texto) => `<a href="${hash}" class="px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap ${vistas.includes(UI.vista) ? "bg-jro-cream font-semibold text-jro-ink" : "text-jro-mute hover:text-jro-ink"}">${texto}</a>`;
  const nPend = esAdmin() ? pendientes().length : 0;
  return `<header class="bg-white border-b border-jro-line sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
      <a href="#/" class="shrink-0 flex items-center gap-3" aria-label="${CAMPUS} · Inicio">
        <span class="sm:hidden">${isotipoSVG(34)}</span><span class="hidden sm:inline">${logo(36)}</span>
        <span class="hidden md:inline border-l border-jro-line pl-3 text-sm font-semibold">${CAMPUS}</span>
      </a>
      <nav class="flex items-center gap-0.5 sm:gap-1">
        ${nav(["inicio", "formacion"], "#/", "Catálogo")}
        ${u ? nav(["micampus", "pago"], "#/mi-campus", "Mi campus") : ""}
        ${esAdmin() ? `<a href="#/admin/${UI.adminTab}" class="relative px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap ${UI.vista === "admin" ? "bg-jro-cream font-semibold text-jro-ink" : "text-jro-mute hover:text-jro-ink"}">Panel${nPend ? `<span class="absolute -top-0.5 -right-0.5 rounded-full bg-jro-terra text-[10px] font-bold px-1.5">${nPend}</span>` : ""}</a>` : ""}
        ${u ? nav(["perfil"], "#/perfil", "Perfil") : ""}
        ${u ? `<button data-action="salir" class="ml-1 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm text-jro-mute hover:text-jro-ink">Salir</button>`
            : `<a href="#/acceso" class="ml-1 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold border border-jro-ink">Entrar</a>
               <a href="#/acceso/registro" class="hidden sm:inline-block btn-cta px-3 py-2 rounded-md text-sm">Crear cuenta</a>`}
      </nav>
    </div>
  </header>
  ${DEMO_MODE ? `<div class="bg-jro-ink text-white text-xs text-center px-4 py-1.5">Modo demostración: los datos se guardan solo en este navegador y los pagos son simulados.</div>` : ""}
  ${u && !verificado() ? `<div class="bg-jro-gold/30 border-b border-jro-gold">
    <div class="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2 text-sm">
      <span><b>Verifica tu correo.</b> Te hemos enviado un enlace a ${esc(AUTH.email)} (mira también en correo no deseado). Hasta entonces no podrás matricularte.</span>
      <button data-action="reenviarverif" class="rounded-lg bg-white border border-jro-line px-3 py-1 text-xs font-semibold">Reenviar correo</button>
      <button data-action="comprobarverif" class="rounded-lg btn-cta px-3 py-1 text-xs">Ya lo he verificado</button>
    </div>
  </div>` : ""}`;
}

function pie() {
  return `<footer class="mt-16 border-t border-jro-line bg-white">
    <div class="max-w-7xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-3 text-sm">
      <div>${logo(32)}<p class="mt-3 text-jro-mute">${CAMPUS}: tus cursos, másteres y módulos con una sola cuenta.</p></div>
      <div><div class="font-semibold">Formación</div>
        <ul class="mt-2 space-y-1 text-jro-mute">${Object.entries(TIPOS).map(([id, t]) => `<li><a class="hover:text-jro-ink" href="#/catalogo/${id}">${t.plural}</a></li>`).join("")}</ul></div>
      <div><div class="font-semibold">Centro</div>
        <ul class="mt-2 space-y-1 text-jro-mute">
          <li>Contacto: <a class="underline" href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a></li>
          <li><button class="underline" data-action="privacidad">Política de privacidad</button></li>
          <li><button class="underline" data-action="condiciones">Condiciones de contratación</button></li>
        </ul></div>
    </div>
    <div class="text-center text-xs text-jro-mute pb-6 px-4">${CENTRO}</div>
  </footer>`;
}

function marco(contenido) {
  return `${header()}<main class="min-h-[70vh]">${contenido}</main>${pie()}`;
}

/* =====================================================================
   CATÁLOGO (página de inicio)
   ===================================================================== */
function tarjeta(f) {
  const t = TIPOS[f.tipo] || TIPOS.curso;
  const m = dentro() ? acceso(f) : null;
  const marca = f.tipo === "taller" ? "#FFFFFF" : "#111111";
  return `<a href="#/formacion/${encodeURIComponent(f.id)}" class="group bg-white rounded-2xl border border-jro-line overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition">
    <div class="relative h-28 ${t.fondo} overflow-hidden">
      <div class="absolute -right-6 -bottom-10 w-36 opacity-20">${gota(marca, "w-full h-full")}</div>
      <div class="absolute left-4 top-4 flex flex-wrap gap-1.5">
        <span class="inline-flex rounded-full bg-white text-jro-ink px-2.5 py-0.5 text-xs font-bold">${t.nombre}</span>
        ${f.estado !== "abierta" ? badgeEstado(f.estado) : ""}
      </div>
      <div class="absolute left-4 bottom-3 text-sm font-semibold">${esc(f.horas)} h · ${esc(f.duracion || f.modalidad || "")}</div>
    </div>
    <div class="p-5 flex-1 flex flex-col">
      <h3 class="font-extrabold leading-snug group-hover:underline decoration-jro-gold decoration-2 underline-offset-4">${esc(f.titulo)}</h3>
      <p class="mt-2 text-sm text-jro-mute line-clamp-3">${esc(f.resumen)}</p>
      <div class="mt-auto pt-4 flex items-center justify-between gap-2">
        ${m ? badgeAcceso(m) : `<span class="font-extrabold">${precioTexto(f)}</span>`}
        <span class="text-sm font-semibold">Ver ficha →</span>
      </div>
      ${!m && f.incluidaCentro ? `<div class="mt-2 text-xs text-jro-mute">Incluida para alumnado del centro (${DOMINIO})</div>` : ""}
    </div>
  </a>`;
}

function vistaInicio() {
  const todas = ordenadas();
  const q = UI.buscar.trim().toLowerCase();
  const lista = todas.filter(f => (UI.tipo === "todos" || f.tipo === UI.tipo)
    && (!q || [f.titulo, f.corto, f.resumen, f.nivel].join(" ").toLowerCase().includes(q)));
  const chip = (id, texto, n) => `<a href="${id === "todos" ? "#/" : "#/catalogo/" + id}" class="inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-semibold whitespace-nowrap ${UI.tipo === id ? "border-jro-ink bg-jro-ink text-white" : "border-jro-line bg-white hover:border-jro-ink"}">
      ${id !== "todos" ? `<span class="h-3 w-3 rounded-full" style="background:${TIPOS[id].hex}"></span>` : ""}${texto}<span class="text-xs opacity-70">${n}</span></a>`;
  const mias = dentro() ? misFormaciones() : [];

  return marco(`
    <section class="relative overflow-hidden border-b border-jro-line bg-white">
      <div class="max-w-7xl mx-auto px-4 py-12 lg:py-16 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
        <div>
          <span class="inline-flex rounded-full bg-jro-gold px-3 py-1 text-xs font-bold">Formación Profesional José Ramón Otero</span>
          <h1 class="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">${CAMPUS}</h1>
          <p class="mt-4 text-lg text-jro-mute max-w-xl leading-relaxed">Tu puerta de entrada a toda la formación del centro. Cursos, másteres y módulos con una sola cuenta: entra en los que tienes y matricúlate en los que quieras.</p>
          <form data-form="buscar" class="mt-6 flex max-w-xl gap-2" role="search">
            <label class="sr-only" for="buscar">Buscar formación</label>
            <input id="buscar" name="q" value="${esc(UI.buscar)}" placeholder="Buscar: IA, ciberseguridad, Claude…" class="flex-1 rounded-xl border-2 border-jro-line bg-white px-4 py-3 focus:outline-none focus:border-jro-ink">
            <button class="btn-cta rounded-xl px-5">Buscar</button>
          </form>
          <div class="mt-5 flex flex-wrap gap-4 text-sm text-jro-mute">
            ${Object.entries(TIPOS).filter(([id]) => todas.some(f => f.tipo === id)).map(([id, t]) => `<span class="inline-flex items-center gap-2"><span class="h-3 w-3 rounded-full" style="background:${t.hex}"></span>${(n => `${n} ${(n === 1 ? t.nombre : t.plural).toLowerCase()}`)(todas.filter(f => f.tipo === id).length)}</span>`).join("")}
          </div>
        </div>
        <div class="relative hidden sm:block h-72 lg:h-80" aria-hidden="true">
          <div class="absolute right-6 top-0 w-64 lg:w-72">${gota("#e39f7d", "w-full h-full")}</div>
          <div class="absolute left-4 lg:left-0 bottom-0 w-32 h-32 rounded-full bg-jro-gold"></div>
          <div class="absolute left-36 lg:left-28 top-6 w-20 h-20 rounded-full bg-jro-sage"></div>
        </div>
      </div>
    </section>

    ${mias.length ? `<section class="max-w-7xl mx-auto px-4 pt-10">
      <div class="flex items-end justify-between gap-3">
        <h2 class="text-xl font-extrabold">Continúa con tu formación</h2>
        <a href="#/mi-campus" class="text-sm font-semibold underline">Ir a Mi campus</a>
      </div>
      <div class="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
        ${mias.map(f => `<div class="min-w-[260px] max-w-xs bg-white rounded-xl border-l-8 ${(TIPOS[f.tipo] || TIPOS.curso).borde} border-y border-r border-jro-line p-4 flex flex-col">
          <div>${badgeTipo(f.tipo)}</div>
          <div class="mt-2 font-bold leading-snug line-clamp-2">${esc(f.corto || f.titulo)}</div>
          <div class="mt-3 pt-1 mt-auto">${botonEntrar(f, "text-sm px-3 py-1.5")}</div>
        </div>`).join("")}
      </div>
    </section>` : ""}

    <section class="max-w-7xl mx-auto px-4 pt-10" id="catalogo">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-2xl font-extrabold">Catálogo de formación</h2>
          <p class="text-sm text-jro-mute">${lista.length} de ${todas.length} formaciones${q ? ` para «${esc(UI.buscar)}» <button data-action="limpiarbusqueda" class="underline">quitar búsqueda</button>` : ""}</p>
        </div>
      </div>
      <div class="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        ${chip("todos", "Todas", todas.length)}
        ${Object.entries(TIPOS).filter(([id]) => todas.some(f => f.tipo === id)).map(([id, t]) => chip(id, t.plural, todas.filter(f => f.tipo === id).length)).join("")}
      </div>
      ${lista.length ? `<div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${lista.map(tarjeta).join("")}</div>`
        : `<div class="mt-6 rounded-2xl border-2 border-dashed border-jro-line bg-white p-10 text-center text-jro-mute">
            ${todas.length ? "No hay formaciones con ese filtro." : (esAdmin() ? `El catálogo está vacío. <a class="underline font-semibold text-jro-ink" href="#/admin/catalogo">Cárgalo desde el panel</a>.` : "Estamos preparando el catálogo. Vuelve pronto.")}
          </div>`}
    </section>

    <section class="max-w-7xl mx-auto px-4 pt-14">
      <h2 class="text-2xl font-extrabold">Cómo funciona</h2>
      <ol class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        ${[
          ["Crea tu cuenta", `Con tu correo ${DOMINIO} si eres del centro, o con cualquier correo si vienes de fuera.`, "#efcd2f"],
          ["Elige tu formación", "Cursos cortos, másteres y módulos completos. Cada ficha te dice horas, requisitos y titulación.", "#a9cabb"],
          ["Consigue el acceso", "Cómpralo online, canjea un código del centro o solicita la matrícula. Algunas formaciones ya están incluidas para el alumnado.", "#e39f7d"],
          ["Entra desde Mi campus", "Todas tus formaciones en un mismo sitio, con los avisos del centro y tus compras.", "#111111"]
        ].map(([t, d, c], i) => `<li class="bg-white rounded-2xl border border-jro-line p-5">
          <div class="flex h-9 w-9 items-center justify-center rounded-full font-extrabold ${i === 3 ? "text-white" : ""}" style="background:${c}">${i + 1}</div>
          <div class="mt-3 font-bold">${t}</div><p class="mt-1 text-sm text-jro-mute">${d}</p></li>`).join("")}
      </ol>
    </section>`);
}

/* =====================================================================
   FICHA DE UNA FORMACIÓN
   ===================================================================== */
function botonEntrar(f, clase = "px-5 py-3") {
  return esURL(f.url)
    ? `<a href="${esc(f.url)}" target="_blank" rel="noopener" data-action="entrar" data-id="${esc(f.id)}" class="inline-flex justify-center btn-cta rounded-lg ${clase}">Entrar a la plataforma →</a>`
    : `<span class="inline-flex rounded-lg bg-gray-100 text-jro-mute ${clase} text-sm">Plataforma disponible en breve</span>`;
}

function cajaAcceso(f) {
  const u = usuario();
  const m = u ? acceso(f) : null;
  const pagoNoDisponible = !backend?.pagosOnline;
  let cuerpo;

  if (!u) {
    cuerpo = `<a href="#/acceso/registro" data-action="despues" data-hash="#/formacion/${esc(f.id)}" class="block text-center btn-cta rounded-lg py-3">Crear cuenta y matricularme</a>
      <a href="#/acceso" data-action="despues" data-hash="#/formacion/${esc(f.id)}" class="mt-2 block text-center rounded-lg border-2 border-jro-ink py-2.5 font-semibold">Ya tengo cuenta</a>`;
  } else if (m) {
    cuerpo = `<div class="rounded-xl bg-jro-cream p-3 text-sm"><b>Tienes acceso.</b> ${m === "admin" ? "Como administración ves todas las formaciones." : esc(ORIGENES[m] || "")}</div>
      <div class="mt-3">${botonEntrar(f, "w-full py-3")}</div>
      ${m !== "admin" ? `<p class="mt-2 text-xs text-jro-mute">Entra en la plataforma con el mismo correo (${esc(u.email)}).</p>` : ""}`;
  } else if (f.estado !== "abierta") {
    const sp = solicitudPendiente(f);
    cuerpo = `<div class="rounded-xl bg-jro-cream p-3 text-sm"><b>${ESTADOS[f.estado]}.</b> Déjanos tu interés y te avisaremos cuando abra la matrícula.</div>
      ${sp ? `<div class="mt-3 text-sm">Solicitud enviada el ${fechaCorta(sp.fecha)}. <span class="text-jro-mute">Pendiente de respuesta.</span></div>`
           : `<button data-action="solicitar" data-id="${esc(f.id)}" class="mt-3 w-full rounded-lg border-2 border-jro-ink py-2.5 font-semibold">Avisadme</button>`}`;
  } else {
    const sp = solicitudPendiente(f);
    const gratis = !(Number(f.precio) > 0);
    cuerpo = `${gratis
        ? `<button data-action="gratis" data-id="${esc(f.id)}" class="w-full btn-cta rounded-lg py-3" ${verificado() ? "" : "disabled"}>Matricularme gratis</button>`
        : pagoNoDisponible
          ? `<button data-action="solicitar" data-id="${esc(f.id)}" class="w-full btn-cta rounded-lg py-3" ${sp ? "disabled" : ""}>${sp ? "Solicitud enviada" : `Solicitar matrícula · ${euros(f.precio)}`}</button>
             <p class="mt-2 text-xs text-jro-mute">El pago online aún no está activo: el centro te contactará para formalizar la matrícula.</p>`
          : `<button data-action="comprar" data-id="${esc(f.id)}" class="w-full btn-cta rounded-lg py-3" ${verificado() ? "" : "disabled"}>Comprar · ${euros(f.precio)}</button>
             <p class="mt-2 text-xs text-jro-mute">Pago seguro con tarjeta. El acceso se activa al momento.</p>`}
      ${!verificado() ? `<p class="mt-2 text-xs">Verifica tu correo para poder matricularte.</p>` : ""}
      ${f.incluidaCentro && !esDelCentro(u) ? `<p class="mt-3 rounded-lg bg-jro-cream p-2 text-xs">Incluida gratis para el alumnado del centro: entra con tu correo ${DOMINIO}.</p>` : ""}
      <form data-form="canjear" class="mt-4 border-t border-jro-line pt-4">
        <label class="text-sm font-medium" for="codigo-${esc(f.id)}">¿Tienes un código de acceso?</label>
        <div class="mt-1 flex gap-2">
          <input id="codigo-${esc(f.id)}" name="codigo" maxlength="40" class="flex-1 rounded-lg border border-jro-line px-3 py-2 uppercase mono text-sm" placeholder="JRO-XXXX-XXXX">
          <button class="rounded-lg border-2 border-jro-ink px-3 text-sm font-semibold" ${verificado() ? "" : "disabled"}>Canjear</button>
        </div>
      </form>
      ${!gratis && !pagoNoDisponible ? (sp ? `<p class="mt-3 text-xs text-jro-mute">Tienes una solicitud de información pendiente.</p>`
        : `<button data-action="solicitar" data-id="${esc(f.id)}" class="mt-3 w-full text-sm underline text-jro-mute">Prefiero que me contacten (beca, factura a empresa, pago por transferencia…)</button>`) : ""}`;
  }

  return `<div class="bg-white rounded-2xl border-2 ${(TIPOS[f.tipo] || TIPOS.curso).borde} p-5 shadow-sm">
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-3xl font-extrabold">${precioTexto(f)}</span>
      ${Number(f.precio) > 0 ? `<span class="text-xs text-jro-mute">IVA incluido · pago único</span>` : ""}
    </div>
    <div class="mt-4">${cuerpo}</div>
  </div>`;
}

function vistaFormacion() {
  const f = formacion(UI.formacionId);
  if (!f) {
    return marco(`<div class="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 class="text-2xl font-extrabold">${DB.formaciones.length ? "No encontramos esa formación" : "Cargando…"}</h1>
      <a href="#/" class="mt-4 inline-block underline">Volver al catálogo</a></div>`);
  }
  const t = TIPOS[f.tipo] || TIPOS.curso;
  const datos = [
    ["Tipo", t.nombre], ["Duración", `${f.horas} horas${f.duracion ? " · " + f.duracion : ""}`], ["Modalidad", f.modalidad],
    ["Dirigido a", f.nivel], ["Titulación", f.titulacion], ["Edición", f.edicion]
  ].filter(([, v]) => v);

  return marco(`
    <section class="${t.fondo} relative overflow-hidden">
      <div class="absolute -right-16 -top-10 w-80 opacity-15 hidden md:block" aria-hidden="true">${gota(f.tipo === "taller" ? "#FFFFFF" : "#111111", "w-full h-full")}</div>
      <div class="relative max-w-7xl mx-auto px-4 py-10">
        <nav class="text-sm opacity-80"><a href="#/" class="underline">Catálogo</a> › <a href="#/catalogo/${esc(f.tipo)}" class="underline">${t.plural}</a></nav>
        <div class="mt-4 flex flex-wrap gap-2">
          <span class="inline-flex rounded-full bg-white text-jro-ink px-2.5 py-0.5 text-xs font-bold">${t.nombre}</span>${badgeEstado(f.estado)}
          ${dentro() && acceso(f) ? badgeAcceso(acceso(f)) : ""}
        </div>
        <h1 class="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight max-w-4xl">${esc(f.titulo)}</h1>
        <p class="mt-3 text-lg max-w-3xl">${esc(f.resumen)}</p>
      </div>
    </section>
    <div class="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <div class="space-y-8 min-w-0">
        <section class="bg-white rounded-2xl border border-jro-line p-6">
          <h2 class="text-xl font-extrabold">Sobre esta formación</h2>
          <p class="mt-3 leading-relaxed">${esc(f.descripcion)}</p>
          <dl class="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            ${datos.map(([k, v]) => `<div class="border-t border-jro-line pt-2"><dt class="text-jro-mute">${k}</dt><dd class="font-semibold">${esc(v)}</dd></div>`).join("")}
          </dl>
        </section>
        ${f.aprenderas?.length ? `<section class="bg-white rounded-2xl border border-jro-line p-6">
          <h2 class="text-xl font-extrabold">Qué aprenderás</h2>
          <ul class="mt-4 grid sm:grid-cols-2 gap-3">${f.aprenderas.map(a => `<li class="flex gap-2 text-sm"><span class="mt-0.5 h-5 w-5 shrink-0 rounded-full ${t.fondo} flex items-center justify-center text-xs font-bold">✓</span><span>${esc(a)}</span></li>`).join("")}</ul>
        </section>` : ""}
        ${f.temario?.length ? `<section class="bg-white rounded-2xl border border-jro-line p-6">
          <h2 class="text-xl font-extrabold">Temario</h2>
          <div class="mt-4 divide-y divide-jro-line border-y border-jro-line">
            ${f.temario.map((b, i) => `<details class="group py-3" ${i === 0 ? "open" : ""}>
              <summary class="flex cursor-pointer items-center justify-between gap-3 font-semibold list-none">
                <span>${esc(b.titulo)}</span><span class="text-jro-mute group-open:rotate-45 transition text-xl leading-none">+</span></summary>
              ${b.items?.length ? `<ul class="mt-2 ml-1 space-y-1 text-sm text-jro-mute">${b.items.map(x => `<li class="flex gap-2"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style="background:${t.hex}"></span>${esc(x)}</li>`).join("")}</ul>` : ""}
            </details>`).join("")}
          </div>
        </section>` : ""}
        ${f.requisitos?.length ? `<section class="bg-white rounded-2xl border border-jro-line p-6">
          <h2 class="text-xl font-extrabold">Requisitos</h2>
          <ul class="mt-3 list-disc pl-5 space-y-1 text-sm">${f.requisitos.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
        </section>` : ""}
      </div>
      <aside class="lg:sticky lg:top-24 space-y-4">
        ${cajaAcceso(f)}
        <p class="text-xs text-jro-mute px-1">¿Dudas? Escribe a <a class="underline" href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>. Consulta las <button class="underline" data-action="condiciones">condiciones de contratación</button>.</p>
      </aside>
    </div>`);
}

/* =====================================================================
   MI CAMPUS (área personal)
   ===================================================================== */
function vistaMiCampus() {
  const u = usuario();
  const mias = misFormaciones();
  const resto = ordenadas().filter(f => !acceso(f) && f.estado !== "cerrada");
  const misIds = new Set(mias.map(f => f.id));
  const avisos = [...DB.avisos].filter(a => !a.formacionId || misIds.has(a.formacionId) || esAdmin())
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 6);
  const sols = DB.solicitudes.filter(s => s.uid === u.id).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const pedidos = DB.pedidos.filter(p => p.uid === u.id).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const matricula = (f) => DB.matriculas.find(m => m.uid === u.id && m.formacionId === f.id && m.estado === "activa");

  return marco(`<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm text-jro-mute">${esDelCentro(u) ? "Alumnado del centro" : "Alumnado externo"}</p>
        <h1 class="text-3xl font-extrabold">Hola, ${esc((u.nombre || "").split(" ")[0])}</h1>
      </div>
      <div class="flex gap-3">
        <div class="rounded-xl bg-white border border-jro-line px-4 py-2 text-center"><div class="text-2xl font-extrabold">${mias.length}</div><div class="text-xs text-jro-mute">formaciones</div></div>
        <div class="rounded-xl bg-white border border-jro-line px-4 py-2 text-center"><div class="text-2xl font-extrabold">${sols.filter(s => s.estado === "pendiente").length}</div><div class="text-xs text-jro-mute">solicitudes</div></div>
      </div>
    </div>

    <div class="mt-8 grid lg:grid-cols-[1fr_340px] gap-8 items-start">
      <div class="space-y-8 min-w-0">
        <section>
          <h2 class="text-xl font-extrabold">Mis formaciones</h2>
          ${mias.length ? `<div class="mt-4 grid sm:grid-cols-2 gap-4">${mias.map(f => {
            const t = TIPOS[f.tipo] || TIPOS.curso; const m = matricula(f);
            return `<article class="bg-white rounded-2xl border border-jro-line overflow-hidden flex flex-col">
              <div class="h-2 ${t.fondo}"></div>
              <div class="p-5 flex-1 flex flex-col">
                <div class="flex flex-wrap gap-1.5">${badgeTipo(f.tipo)}</div>
                <h3 class="mt-2 font-extrabold leading-snug">${esc(f.titulo)}</h3>
                <p class="mt-1 text-xs text-jro-mute">${esc(ORIGENES[acceso(f)] || "")}${m?.fecha ? ` · desde el ${fechaCorta(m.fecha)}` : ""}</p>
                <div class="mt-auto pt-4 flex flex-wrap items-center gap-2">${botonEntrar(f, "px-4 py-2 text-sm")}
                  <a href="#/formacion/${esc(f.id)}" class="text-sm underline">Ficha</a></div>
              </div>
            </article>`; }).join("")}</div>`
          : `<div class="mt-4 rounded-2xl border-2 border-dashed border-jro-line bg-white p-8 text-center">
              <p class="text-jro-mute">Todavía no tienes ninguna formación.</p>
              <a href="#/" class="mt-3 inline-block btn-cta rounded-lg px-5 py-2.5">Ver el catálogo</a></div>`}
        </section>

        ${resto.length ? `<section>
          <h2 class="text-xl font-extrabold">Te puede interesar</h2>
          <div class="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${resto.slice(0, 3).map(tarjeta).join("")}</div>
        </section>` : ""}

        ${pedidos.length ? `<section class="bg-white rounded-2xl border border-jro-line p-5">
          <h2 class="text-lg font-extrabold">Mis compras</h2>
          <div class="mt-3 overflow-x-auto"><table class="w-full text-sm">
            <thead><tr class="text-left text-jro-mute"><th class="py-2 pr-3">Fecha</th><th class="py-2 pr-3">Formación</th><th class="py-2 pr-3">Importe</th><th class="py-2">Estado</th></tr></thead>
            <tbody>${pedidos.map(p => `<tr class="border-t border-jro-line"><td class="py-2 pr-3 whitespace-nowrap">${fechaCorta(p.fecha)}</td><td class="py-2 pr-3">${esc(formacion(p.formacionId)?.corto || p.formacionId)}</td><td class="py-2 pr-3 whitespace-nowrap">${euros(p.importe)}</td><td class="py-2">${p.estado === "pagado" ? "Pagado" : esc(p.estado)}</td></tr>`).join("")}</tbody>
          </table></div>
          <p class="mt-2 text-xs text-jro-mute">Si necesitas factura, escríbenos a ${ADMIN_EMAIL} indicando la fecha del pedido.</p>
        </section>` : ""}
      </div>

      <aside class="space-y-6">
        <section class="bg-white rounded-2xl border border-jro-line p-5">
          <h2 class="font-extrabold">Avisos del campus</h2>
          ${avisos.length ? `<ul class="mt-3 space-y-4">${avisos.map(a => `<li class="border-l-4 border-jro-gold pl-3">
            <div class="text-xs text-jro-mute">${fecha(a.fecha)}${a.formacionId ? ` · ${esc(formacion(a.formacionId)?.corto || "")}` : ""}</div>
            <div class="font-semibold">${esc(a.titulo)}</div>
            <p class="text-sm text-jro-mute whitespace-pre-line">${esc(a.texto)}</p></li>`).join("")}</ul>`
          : `<p class="mt-2 text-sm text-jro-mute">No hay avisos.</p>`}
        </section>

        <section class="bg-white rounded-2xl border border-jro-line p-5">
          <h2 class="font-extrabold">Canjear un código</h2>
          <p class="mt-1 text-sm text-jro-mute">Si el centro te ha dado un código (beca, convenio, grupo), canjéalo aquí.</p>
          <form data-form="canjear" class="mt-3 flex gap-2">
            <label class="sr-only" for="codigo-campus">Código</label>
            <input id="codigo-campus" name="codigo" maxlength="40" class="flex-1 min-w-0 rounded-lg border border-jro-line px-3 py-2 uppercase mono text-sm" placeholder="JRO-XXXX-XXXX">
            <button class="btn-cta rounded-lg px-3 text-sm" ${verificado() ? "" : "disabled"}>Canjear</button>
          </form>
          ${DEMO_MODE ? `<p class="mt-2 text-xs text-jro-mute">Demostración: prueba <span class="mono">JRO-DEMO-2026</span> (da acceso al máster).</p>` : ""}
        </section>

        ${sols.length ? `<section class="bg-white rounded-2xl border border-jro-line p-5">
          <h2 class="font-extrabold">Mis solicitudes</h2>
          <ul class="mt-3 space-y-3 text-sm">${sols.map(s => `<li class="border-t border-jro-line pt-2">
            <div class="font-semibold">${esc(formacion(s.formacionId)?.corto || s.formacionId)}</div>
            <div class="text-xs text-jro-mute">${fechaCorta(s.fecha)} · ${{ pendiente: "Pendiente", aceptada: "Aceptada: ya tienes acceso", rechazada: "No aceptada" }[s.estado]}</div>
            ${s.respuesta ? `<div class="mt-1 text-xs">«${esc(s.respuesta)}»</div>` : ""}
            ${s.estado === "pendiente" ? `<button data-action="cancelarsolicitud" data-id="${esc(s.id)}" class="mt-1 text-xs underline text-jro-mute">Cancelar</button>` : ""}
          </li>`).join("")}</ul>
        </section>` : ""}
      </aside>
    </div>
  </div>`);
}

/* =====================================================================
   PAGO (vuelta de la pasarela)
   ===================================================================== */
function vistaPago() {
  const f = formacion(UI.pagoFormacion);
  if (UI.pagoEstado !== "ok") {
    return marco(`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 class="text-2xl font-extrabold">Pago cancelado</h1>
      <p class="mt-2 text-jro-mute">No se ha cobrado nada. Puedes volver a intentarlo cuando quieras.</p>
      ${f ? `<a href="#/formacion/${esc(f.id)}" class="mt-6 inline-block btn-cta rounded-lg px-5 py-2.5">Volver a la ficha</a>` : ""}
    </div>`);
  }
  const listo = f && dentro() && acceso(f);
  return marco(`<div class="max-w-xl mx-auto px-4 py-16 text-center">
    <div class="mx-auto w-20">${gota(listo ? "#efcd2f" : "#a9cabb", "w-full h-full")}</div>
    <h1 class="mt-6 text-2xl font-extrabold">${listo ? "¡Ya tienes acceso!" : "Pago recibido"}</h1>
    <p class="mt-2 text-jro-mute">${listo ? `Bienvenido/a a <b>${esc(f.titulo)}</b>. Te hemos enviado el justificante por correo.`
      : "Estamos confirmando el pago con el banco. El acceso se activa solo en unos segundos; no cierres esta página."}</p>
    <div class="mt-6 flex flex-wrap justify-center gap-2">
      ${listo ? botonEntrar(f) : `<span class="inline-block h-6 w-6 rounded-full border-4 border-jro-gold border-t-transparent animate-spin" aria-label="Esperando"></span>`}
      <a href="#/mi-campus" class="rounded-lg border-2 border-jro-ink px-5 py-3 font-semibold">Ir a Mi campus</a>
    </div>
  </div>`);
}

/* =====================================================================
   ACCESO: INICIAR SESIÓN Y REGISTRO
   ===================================================================== */
function bloqueLegal() {
  return `<div class="rounded-lg border border-jro-line overflow-hidden text-xs">
      <div class="bg-jro-cream px-3 py-2 font-semibold">Información básica sobre protección de datos</div>
      <table class="w-full">
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5 w-28">Responsable</th><td class="px-3 py-1.5">Centro de Formación Profesional José Ramón Otero. Contacto: ${ADMIN_EMAIL}</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Finalidad</th><td class="px-3 py-1.5">Gestionar tu cuenta del campus, tus matrículas y compras, y darte acceso a las plataformas de cada formación.</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Legitimación</th><td class="px-3 py-1.5">Ejecución del contrato de formación y consentimiento (art. 6.1.a y 6.1.b RGPD).</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Destinatarios</th><td class="px-3 py-1.5">Encargados del tratamiento: Google (Firebase), Netlify (alojamiento) y Stripe (pagos). No se ceden datos a terceros salvo obligación legal.</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Derechos</th><td class="px-3 py-1.5">Acceso, rectificación, supresión, oposición, limitación y portabilidad. Desde «Perfil» puedes exportar tus datos y eliminar tu cuenta.</td></tr>
      </table>
    </div>
    <label class="flex gap-2 items-start text-sm"><input type="checkbox" name="privacidad" class="mt-1 h-4 w-4 accent-[#efcd2f]">
      <span>He leído y acepto la <button type="button" class="underline" data-action="privacidad">Política de Privacidad</button> y las <button type="button" class="underline" data-action="condiciones">condiciones de contratación</button>.</span></label>`;
}

function vistaAcceso() {
  const t = UI.authTab;
  return marco(`<div class="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10 items-start">
    <section class="pt-2">
      <span class="inline-flex rounded-full bg-jro-gold px-3 py-1 text-xs font-bold">${CAMPUS}</span>
      <h1 class="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight">Una cuenta para toda tu formación en el centro</h1>
      <p class="mt-4 text-jro-mute leading-relaxed">Con tu cuenta del campus ves de un vistazo los cursos, másteres y módulos a los que tienes acceso, te matriculas en otros y recibes los avisos del centro.</p>
      <div class="mt-6 grid sm:grid-cols-3 gap-3">
        ${["curso", "master", "modulo"].map(id => `<div class="rounded-xl bg-white border-2 ${TIPOS[id].borde} p-4"><div class="font-bold">${TIPOS[id].plural}</div><div class="text-xs text-jro-mute">${{ curso: "Especializaciones cortas y prácticas", master: "Programas largos con título propio", modulo: "Módulos de ciclo con plataforma propia" }[id]}</div></div>`).join("")}
      </div>
      <div class="mt-6 rounded-xl bg-white border border-jro-line p-4 text-sm">
        <b>¿Eres alumno/a del centro?</b> Regístrate con tu correo <b>${DOMINIO}</b>: las formaciones incluidas para el alumnado aparecerán solas en Mi campus.
      </div>
    </section>
    <section class="bg-white rounded-2xl border border-jro-line shadow-sm">
      <div class="tabbar rounded-t-2xl flex justify-center gap-8 px-4" role="tablist">
        <button class="tab" role="tab" aria-selected="${t === "login"}" data-action="authtab" data-tab="login">Iniciar sesión</button>
        <button class="tab" role="tab" aria-selected="${t === "registro"}" data-action="authtab" data-tab="registro">Crear cuenta</button>
      </div>
      <div class="p-6">${t === "login" ? formLogin() : formRegistro()}</div>
    </section>
  </div>`);
}

function formLogin() {
  return `<form data-form="login" class="space-y-4" novalidate>
    <label class="block"><span class="text-sm font-medium">Correo</span>
      <input name="email" type="email" required autocomplete="username" class="${INPUT}" placeholder="nombre${DOMINIO}"></label>
    <label class="block"><span class="text-sm font-medium">Contraseña</span>
      <input name="password" type="password" required autocomplete="current-password" class="${INPUT}"></label>
    ${DEMO_MODE ? `<p class="text-xs text-jro-mute">Primer acceso de una cuenta preconfigurada: la contraseña que escribas quedará establecida (mínimo 8 caracteres).</p>` : ""}
    <button class="btn-cta w-full rounded-lg py-2.5">Entrar</button>
    <button type="button" data-action="recuperar" class="w-full text-sm underline text-jro-mute">¿Has olvidado tu contraseña?</button>
  </form>
  ${DEMO_MODE ? `<div class="mt-6 border-t border-jro-line pt-5">
    <div class="text-xs font-semibold uppercase tracking-wide text-jro-mute mb-3">Acceso rápido de demostración</div>
    <div class="grid sm:grid-cols-3 gap-2">
      <button data-action="demo" data-id="admin" class="rounded-lg border-2 border-jro-gold bg-white px-3 py-2 text-sm font-semibold">Administración<br><span class="text-xs font-normal text-jro-mute break-all">${ADMIN_EMAIL}</span></button>
      <button data-action="demo" data-id="demo-centro" class="rounded-lg border-2 border-jro-sage bg-white px-3 py-2 text-sm font-semibold">Alumna del centro<br><span class="text-xs font-normal text-jro-mute">${DOMINIO}</span></button>
      <button data-action="demo" data-id="demo-externo" class="rounded-lg border-2 border-jro-terra bg-white px-3 py-2 text-sm font-semibold">Alumno externo<br><span class="text-xs font-normal text-jro-mute">sin matrículas</span></button>
    </div>
  </div>` : ""}`;
}

function formRegistro() {
  return `<form data-form="registro" class="space-y-4" novalidate>
    <label class="block"><span class="text-sm font-medium">Nombre y apellidos</span>
      <input name="nombre" required maxlength="80" autocomplete="name" class="${INPUT}"></label>
    <label class="block"><span class="text-sm font-medium">Correo</span>
      <input name="email" type="email" required autocomplete="email" class="${INPUT}" placeholder="tu@correo.es">
      <span class="text-xs text-jro-mute">Si eres del centro, usa tu correo ${DOMINIO}.</span></label>
    <div class="grid grid-cols-2 gap-3">
      <label class="block"><span class="text-sm font-medium">Contraseña</span>
        <input name="password" type="password" required minlength="8" autocomplete="new-password" class="${INPUT}"></label>
      <label class="block"><span class="text-sm font-medium">Repetir contraseña</span>
        <input name="password2" type="password" required minlength="8" autocomplete="new-password" class="${INPUT}"></label>
    </div>
    ${bloqueLegal()}
    <div data-error class="hidden rounded-lg bg-jro-terra/30 border border-jro-terra px-3 py-2 text-sm"></div>
    <button class="btn-cta w-full rounded-lg py-2.5">Crear mi cuenta</button>
  </form>`;
}

function vistaCompletar() {
  return marco(`<div class="max-w-xl mx-auto px-4 py-10">
    <section class="bg-white rounded-2xl border border-jro-line p-6">
      <h1 class="text-xl font-extrabold">Completa tu registro</h1>
      <p class="mt-1 text-sm text-jro-mute">Tu cuenta ${esc(AUTH.email)} todavía no tiene perfil en el campus.</p>
      <form data-form="completar" class="mt-4 space-y-4" novalidate>
        <label class="block"><span class="text-sm font-medium">Nombre y apellidos</span>
          <input name="nombre" required maxlength="80" class="${INPUT}"></label>
        ${bloqueLegal()}
        <div data-error class="hidden rounded-lg bg-jro-terra/30 border border-jro-terra px-3 py-2 text-sm"></div>
        <div class="flex flex-wrap gap-2">
          <button class="btn-cta rounded-lg px-5 py-2.5">Guardar y entrar</button>
          <button type="button" data-action="salir" class="rounded-lg px-4 py-2.5 text-sm border border-jro-line bg-white">Salir</button>
        </div>
      </form>
    </section>
  </div>`);
}

/* =====================================================================
   PERFIL
   ===================================================================== */
function vistaPerfil() {
  const u = usuario();
  return marco(`<div class="max-w-3xl mx-auto px-4 py-8 space-y-6">
    <h1 class="text-2xl font-extrabold">Mi perfil</h1>
    <section class="bg-white rounded-2xl border border-jro-line p-6">
      <form data-form="perfil" class="space-y-4">
        <label class="block"><span class="text-sm font-medium">Nombre y apellidos</span>
          <input name="nombre" maxlength="80" value="${esc(u.nombre)}" class="${INPUT}"></label>
        <dl class="grid sm:grid-cols-2 gap-3 text-sm">
          <div><dt class="text-jro-mute">Correo</dt><dd class="font-semibold break-all">${esc(u.email)}</dd></div>
          <div><dt class="text-jro-mute">Tipo de cuenta</dt><dd class="font-semibold">${u.role === "admin" ? "Administración del campus" : esDelCentro(u) ? "Alumnado del centro" : "Alumnado externo"}</dd></div>
          <div><dt class="text-jro-mute">Alta</dt><dd class="font-semibold">${fecha(u.createdAt)}</dd></div>
          <div><dt class="text-jro-mute">Privacidad aceptada</dt><dd class="font-semibold">${fecha(u.consents?.privacidad)}</dd></div>
        </dl>
        <button class="btn-cta rounded-lg px-5 py-2.5 text-sm">Guardar</button>
      </form>
    </section>
    <section class="bg-white rounded-2xl border border-jro-line p-6">
      <h2 class="font-extrabold">Tus datos</h2>
      <p class="mt-1 text-sm text-jro-mute">Descarga una copia de tus datos (perfil, matrículas, solicitudes y compras) o elimina tu cuenta. Los justificantes de pago se conservan el tiempo que exige la normativa fiscal.</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button data-action="exportar" class="rounded-lg border-2 border-jro-ink px-4 py-2 text-sm font-semibold">Descargar mis datos (JSON)</button>
        ${u.role !== "admin" ? `<button data-action="eliminar" class="rounded-lg border-2 border-jro-terra px-4 py-2 text-sm font-semibold">Eliminar mi cuenta</button>` : ""}
      </div>
    </section>
  </div>`);
}

function exportarDatos() {
  const u = usuario();
  const { pwHash, salt, ...perfil } = u;
  descargar(`campus-jrotero-${u.email}.json`, JSON.stringify({
    exportadoEn: new Date().toISOString(), perfil,
    matriculas: DB.matriculas.filter(m => m.uid === u.id),
    solicitudes: DB.solicitudes.filter(s => s.uid === u.id),
    pedidos: DB.pedidos.filter(p => p.uid === u.id)
  }, null, 2));
}

/* =====================================================================
   PANEL DE ADMINISTRACIÓN
   ===================================================================== */
const alumnos = () => DB.usuarios.filter(u => u.role !== "admin");
const nombreFormacion = (id) => formacion(id)?.corto || formacion(id)?.titulo || id;
const selectFormacion = (name, valor = "", todas = false) => `<select name="${name}" class="${INPUT}">
  ${todas ? `<option value="todas">Todas las formaciones</option>` : `<option value="">Selecciona…</option>`}
  ${ordenadas().map(f => `<option value="${esc(f.id)}" ${valor === f.id ? "selected" : ""}>${esc(TIPOS[f.tipo]?.nombre || "")} · ${esc(f.corto || f.titulo)}</option>`).join("")}
</select>`;

function vistaAdmin() {
  const n = pendientes().length;
  const cuerpo = UI.editarId ? adminEditarFormacion() : {
    resumen: adminResumen, catalogo: adminCatalogo, matriculas: adminMatriculas, solicitudes: adminSolicitudes,
    alumnado: adminAlumnado, codigos: adminCodigos, avisos: adminAvisos, pedidos: adminPedidos
  }[UI.adminTab]();
  return marco(`<div class="bg-white border-b border-jro-line">
      <div class="max-w-7xl mx-auto px-4 pt-6">
        <h1 class="text-2xl font-extrabold">Panel del campus</h1>
        <nav class="mt-3 flex gap-6 overflow-x-auto no-scrollbar" role="tablist">
          ${TABS_ADMIN.map(([id, txt]) => `<a href="#/admin/${id}" class="tab" role="tab" aria-selected="${UI.adminTab === id}">${txt}${id === "solicitudes" && n ? ` <span class="ml-1 rounded-full bg-jro-terra px-1.5 text-xs font-bold text-jro-ink">${n}</span>` : ""}</a>`).join("")}
        </nav>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-4 py-6">${cuerpo}</div>`);
}

function kpi(valor, texto, color = "#efcd2f") {
  return `<div class="bg-white rounded-2xl border border-jro-line p-5 border-t-8" style="border-top-color:${color}"><div class="text-3xl font-extrabold">${valor}</div><div class="text-sm text-jro-mute">${texto}</div></div>`;
}

function adminResumen() {
  const activas = DB.matriculas.filter(m => m.estado === "activa");
  const ingresos = DB.pedidos.filter(p => p.estado === "pagado").reduce((t, p) => t + (Number(p.importe) || 0), 0);
  return `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      ${kpi(alumnos().length, "cuentas de alumnado", "#efcd2f")}
      ${kpi(activas.length, "matrículas activas", "#a9cabb")}
      ${kpi(euros(ingresos), "ingresos online", "#e39f7d")}
      ${kpi(pendientes().length, "solicitudes pendientes", "#111111")}
    </div>
    <section class="mt-6 bg-white rounded-2xl border border-jro-line p-5">
      <h2 class="font-extrabold">Matrículas por formación</h2>
      <div class="mt-3 overflow-x-auto"><table class="w-full text-sm">
        <thead><tr class="text-left text-jro-mute"><th class="py-2 pr-3">Formación</th><th class="py-2 pr-3">Tipo</th><th class="py-2 pr-3">Estado</th><th class="py-2 pr-3 text-right">Compras</th><th class="py-2 pr-3 text-right">Códigos</th><th class="py-2 pr-3 text-right">Asignadas</th><th class="py-2 text-right">Total</th></tr></thead>
        <tbody>${ordenadas().map(f => {
          const ms = activas.filter(m => m.formacionId === f.id);
          const c = (o) => ms.filter(m => m.origen === o).length;
          return `<tr class="border-t border-jro-line"><td class="py-2 pr-3"><a class="font-semibold underline" href="#/formacion/${esc(f.id)}">${esc(f.corto || f.titulo)}</a>${f.incluidaCentro ? ` <span class="text-xs text-jro-mute">· incluida centro</span>` : ""}</td>
            <td class="py-2 pr-3">${badgeTipo(f.tipo)}</td><td class="py-2 pr-3">${ESTADOS[f.estado] || ""}</td>
            <td class="py-2 pr-3 text-right">${c("compra")}</td><td class="py-2 pr-3 text-right">${c("codigo")}</td><td class="py-2 pr-3 text-right">${c("asignada") + c("gratuita")}</td><td class="py-2 text-right font-bold">${ms.length}</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </section>
    ${!backend.pagosOnline ? `<p class="mt-4 rounded-xl bg-jro-gold/30 border border-jro-gold p-3 text-sm"><b>Pago online desactivado.</b> Las formaciones de pago muestran «Solicitar matrícula». Para cobrar con tarjeta configura Stripe en Netlify (ver DESPLIEGUE.md).</p>` : ""}`;
}

function adminCatalogo() {
  const faltan = CATALOGO_INICIAL.filter(f => !formacion(f.id));
  return `<div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-jro-mute">${DB.formaciones.length} formaciones. El orden y los datos se ven tal cual en el catálogo público.</p>
      <div class="flex flex-wrap gap-2">
        ${faltan.length ? `<button data-action="cargarcatalogo" class="rounded-lg border-2 border-jro-ink px-4 py-2 text-sm font-semibold">Cargar catálogo inicial (${faltan.length})</button>` : ""}
        <a href="#/admin/formacion/nueva" class="btn-cta rounded-lg px-4 py-2 text-sm">+ Nueva formación</a>
      </div>
    </div>
    <div class="mt-4 grid gap-3">${ordenadas().map(f => `<div class="bg-white rounded-xl border border-jro-line p-4 flex flex-wrap items-center gap-3">
      <div class="h-10 w-2 rounded-full ${(TIPOS[f.tipo] || TIPOS.curso).fondo}"></div>
      <div class="flex-1 min-w-[220px]">
        <div class="flex flex-wrap items-center gap-2">${badgeTipo(f.tipo)}<span class="text-xs text-jro-mute">${ESTADOS[f.estado] || ""} · ${precioTexto(f)} · ${esc(f.horas)} h</span></div>
        <div class="mt-1 font-bold">${esc(f.titulo)}</div>
        <div class="text-xs ${esURL(f.url) ? "text-jro-mute" : "text-jro-ink font-semibold"} break-all">${esURL(f.url) ? esc(f.url) : "⚠ Sin dirección de la plataforma"}</div>
      </div>
      <a href="#/formacion/${esc(f.id)}" class="text-sm underline">Ver</a>
      <a href="#/admin/formacion/${esc(f.id)}" class="rounded-lg border border-jro-ink px-3 py-1.5 text-sm font-semibold">Editar</a>
      <button data-action="borrarformacion" data-id="${esc(f.id)}" class="rounded-lg border border-jro-terra px-3 py-1.5 text-sm">Borrar</button>
    </div>`).join("")}</div>`;
}

function adminEditarFormacion() {
  const nueva = UI.editarId === "nueva";
  const f = nueva ? { tipo: "curso", estado: "proximamente", precio: 0, horas: 20, orden: DB.formaciones.length + 1, aprenderas: [], requisitos: [], temario: [] } : formacion(UI.editarId);
  if (!f) return `<p>No existe esa formación. <a class="underline" href="#/admin/catalogo">Volver</a></p>`;
  const temario = (f.temario || []).map(b => [`# ${b.titulo}`, ...(b.items || []).map(i => `- ${i}`)].join("\n")).join("\n");
  const campo = (name, label, valor, extra = "") => `<label class="block"><span class="text-sm font-medium">${label}</span><input name="${name}" value="${esc(valor ?? "")}" class="${INPUT}" ${extra}></label>`;
  const area = (name, label, valor, filas, ayuda = "") => `<label class="block"><span class="text-sm font-medium">${label}</span>${ayuda ? `<span class="block text-xs text-jro-mute">${ayuda}</span>` : ""}<textarea name="${name}" rows="${filas}" class="${INPUT} text-sm">${esc(valor ?? "")}</textarea></label>`;
  return `<a href="#/admin/catalogo" class="text-sm underline">← Catálogo</a>
    <h2 class="mt-2 text-xl font-extrabold">${nueva ? "Nueva formación" : `Editar: ${esc(f.corto || f.titulo)}`}</h2>
    <form data-form="formacion" data-nueva="${nueva}" class="mt-4 grid lg:grid-cols-2 gap-6">
      <section class="bg-white rounded-2xl border border-jro-line p-5 space-y-4">
        <h3 class="font-bold">Datos principales</h3>
        <div class="grid grid-cols-2 gap-3">
          <label class="block"><span class="text-sm font-medium">Tipo</span><select name="tipo" class="${INPUT}">${Object.entries(TIPOS).map(([id, t]) => `<option value="${id}" ${f.tipo === id ? "selected" : ""}>${t.nombre}</option>`).join("")}</select></label>
          <label class="block"><span class="text-sm font-medium">Estado</span><select name="estado" class="${INPUT}">${Object.entries(ESTADOS).map(([id, t]) => `<option value="${id}" ${f.estado === id ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        </div>
        ${campo("titulo", "Título completo", f.titulo, "required maxlength=\"160\"")}
        <div class="grid grid-cols-2 gap-3">
          ${campo("corto", "Nombre corto", f.corto, "maxlength=\"60\"")}
          ${nueva ? campo("id", "Identificador (URL)", "", "maxlength=\"60\" placeholder=\"se genera del título\"") : `<div><span class="text-sm font-medium">Identificador</span><div class="mt-2 mono text-sm">${esc(f.id)}</div></div>`}
        </div>
        ${area("resumen", "Resumen (tarjeta del catálogo)", f.resumen, 2)}
        ${area("descripcion", "Descripción", f.descripcion, 5)}
        <div class="grid grid-cols-3 gap-3">
          ${campo("precio", "Precio (€)", f.precio, "type=\"number\" min=\"0\" step=\"0.01\"")}
          ${campo("horas", "Horas", f.horas, "type=\"number\" min=\"1\" step=\"1\"")}
          ${campo("orden", "Orden", f.orden, "type=\"number\" min=\"0\" step=\"1\"")}
        </div>
        ${campo("url", "Dirección de la plataforma (https://…)", f.url, "type=\"url\" placeholder=\"https://\"")}
        <label class="flex gap-2 items-start text-sm"><input type="checkbox" name="incluidaCentro" ${f.incluidaCentro ? "checked" : ""} class="mt-1 h-4 w-4 accent-[#efcd2f]"><span><b>Incluida para el alumnado del centro</b>: cualquier cuenta ${DOMINIO} verificada tiene acceso sin pagar.</span></label>
        <label class="flex gap-2 items-start text-sm"><input type="checkbox" name="destacada" ${f.destacada ? "checked" : ""} class="mt-1 h-4 w-4 accent-[#efcd2f]"><span>Destacada</span></label>
      </section>
      <section class="bg-white rounded-2xl border border-jro-line p-5 space-y-4">
        <h3 class="font-bold">Ficha</h3>
        <div class="grid grid-cols-2 gap-3">
          ${campo("duracion", "Duración", f.duracion, "maxlength=\"80\" placeholder=\"12 sesiones\"")}
          ${campo("edicion", "Edición", f.edicion, "maxlength=\"80\"")}
        </div>
        ${campo("modalidad", "Modalidad", f.modalidad, "maxlength=\"120\"")}
        ${campo("nivel", "Dirigido a", f.nivel, "maxlength=\"120\"")}
        ${campo("titulacion", "Titulación", f.titulacion, "maxlength=\"120\"")}
        ${area("aprenderas", "Qué aprenderás", (f.aprenderas || []).join("\n"), 5, "Una idea por línea.")}
        ${area("temario", "Temario", temario, 8, "«# Título del bloque» y debajo «- tema», una línea cada uno.")}
        ${area("requisitos", "Requisitos", (f.requisitos || []).join("\n"), 3, "Uno por línea.")}
      </section>
      <div class="lg:col-span-2 flex flex-wrap gap-2">
        <button class="btn-cta rounded-lg px-6 py-2.5">Guardar formación</button>
        <a href="#/admin/catalogo" class="rounded-lg border border-jro-line bg-white px-4 py-2.5 text-sm">Cancelar</a>
      </div>
    </form>`;
}

function leerTemario(texto) {
  const bloques = [];
  for (const l of lineas(texto)) {
    if (l.startsWith("#")) bloques.push({ titulo: l.replace(/^#+\s*/, ""), items: [] });
    else {
      if (!bloques.length) bloques.push({ titulo: "Contenidos", items: [] });
      bloques[bloques.length - 1].items.push(l.replace(/^[-*•]\s*/, ""));
    }
  }
  return bloques;
}

function adminMatriculas() {
  const ms = DB.matriculas.filter(m => UI.filtroFormacion === "todas" || m.formacionId === UI.filtroFormacion)
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  return `<section class="bg-white rounded-2xl border border-jro-line p-5">
      <h2 class="font-extrabold">Dar acceso a mano</h2>
      <form data-form="asignar" class="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label class="block"><span class="text-sm font-medium">Alumno/a</span><select name="uid" class="${INPUT}"><option value="">Selecciona…</option>
          ${alumnos().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(u => `<option value="${esc(u.id)}">${esc(u.nombre)} · ${esc(u.email)}</option>`).join("")}</select></label>
        <label class="block"><span class="text-sm font-medium">Formación</span>${selectFormacion("formacionId")}</label>
        <button class="btn-cta rounded-lg px-5 py-2.5">Dar acceso</button>
      </form>
    </section>
    <div class="mt-6 flex flex-wrap items-end justify-between gap-3">
      <label class="block w-full sm:w-80"><span class="text-sm font-medium">Filtrar</span>
        <select data-action="filtroformacion" class="${INPUT}"><option value="todas">Todas las formaciones</option>
          ${ordenadas().map(f => `<option value="${esc(f.id)}" ${UI.filtroFormacion === f.id ? "selected" : ""}>${esc(f.corto || f.titulo)}</option>`).join("")}</select></label>
      <button data-action="csvmatriculas" class="rounded-lg border-2 border-jro-ink px-4 py-2 text-sm font-semibold">Descargar CSV</button>
    </div>
    <div class="mt-3 bg-white rounded-2xl border border-jro-line overflow-x-auto">
      <table class="w-full text-sm">
        <thead><tr class="text-left text-jro-mute"><th class="p-3">Alumno/a</th><th class="p-3">Formación</th><th class="p-3">Origen</th><th class="p-3">Fecha</th><th class="p-3">Estado</th><th class="p-3"></th></tr></thead>
        <tbody>${ms.length ? ms.map(m => `<tr class="border-t border-jro-line ${m.estado !== "activa" ? "opacity-60" : ""}">
          <td class="p-3"><div class="font-semibold">${esc(m.nombre)}</div><div class="text-xs text-jro-mute break-all">${esc(m.email)}</div></td>
          <td class="p-3">${esc(nombreFormacion(m.formacionId))}</td>
          <td class="p-3">${esc(ORIGENES[m.origen] || m.origen)}${m.importe ? ` · ${euros(m.importe)}` : ""}</td>
          <td class="p-3 whitespace-nowrap">${fechaCorta(m.fecha)}</td>
          <td class="p-3">${m.estado === "activa" ? "Activa" : "Revocada"}</td>
          <td class="p-3 text-right">${m.estado === "activa"
            ? `<button data-action="revocar" data-id="${esc(m.id)}" class="rounded-lg border border-jro-terra px-3 py-1 text-xs">Revocar</button>`
            : `<button data-action="reactivar" data-id="${esc(m.id)}" class="rounded-lg border border-jro-ink px-3 py-1 text-xs">Reactivar</button>`}</td>
        </tr>`).join("") : `<tr><td colspan="6" class="p-6 text-center text-jro-mute">Sin matrículas.</td></tr>`}</tbody>
      </table>
    </div>
    <p class="mt-2 text-xs text-jro-mute">Las formaciones «incluidas para el alumnado del centro» no necesitan matrícula: cualquier cuenta ${DOMINIO} verificada entra.</p>`;
}

function adminSolicitudes() {
  const lista = [...DB.solicitudes].sort((a, b) => (a.estado === "pendiente" ? 0 : 1) - (b.estado === "pendiente" ? 0 : 1) || String(b.fecha).localeCompare(String(a.fecha)));
  if (!lista.length) return `<p class="rounded-2xl border-2 border-dashed border-jro-line bg-white p-8 text-center text-jro-mute">No hay solicitudes.</p>`;
  return `<div class="grid gap-3">${lista.map(s => `<article class="bg-white rounded-xl border ${s.estado === "pendiente" ? "border-jro-gold border-2" : "border-jro-line"} p-4">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div><div class="font-bold">${esc(s.nombre)} <span class="font-normal text-sm text-jro-mute break-all">${esc(s.email)}</span></div>
        <div class="text-sm">${esc(nombreFormacion(s.formacionId))} · ${precioTexto(formacion(s.formacionId) || {})} · ${fechaCorta(s.fecha)}</div></div>
      <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.estado === "pendiente" ? "bg-jro-gold" : s.estado === "aceptada" ? "bg-jro-sage" : "bg-gray-200"}">${{ pendiente: "Pendiente", aceptada: "Aceptada", rechazada: "Rechazada" }[s.estado]}</span>
    </div>
    ${s.mensaje ? `<p class="mt-2 text-sm whitespace-pre-line bg-jro-cream rounded-lg p-3">${esc(s.mensaje)}</p>` : ""}
    ${s.estado === "pendiente" ? `<form data-form="resolver" data-id="${esc(s.id)}" class="mt-3 flex flex-wrap gap-2">
      <input name="respuesta" maxlength="300" placeholder="Respuesta para el alumno (opcional)" class="flex-1 min-w-[200px] rounded-lg border border-jro-line px-3 py-2 text-sm">
      <button name="decision" value="aceptar" class="btn-cta rounded-lg px-4 py-2 text-sm">Aceptar y dar acceso</button>
      <button name="decision" value="rechazar" class="rounded-lg border border-jro-terra px-4 py-2 text-sm">Rechazar</button>
    </form>` : s.respuesta ? `<p class="mt-2 text-xs text-jro-mute">Respuesta: ${esc(s.respuesta)}</p>` : ""}
  </article>`).join("")}</div>`;
}

function adminAlumnado() {
  const q = UI.buscarAlumno.toLowerCase();
  const lista = alumnos().filter(u => !q || (u.nombre + " " + u.email).toLowerCase().includes(q)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  return `<div class="flex flex-wrap items-end justify-between gap-3">
      <form data-form="buscaralumno" class="flex gap-2 w-full sm:w-96"><input name="q" value="${esc(UI.buscarAlumno)}" placeholder="Buscar por nombre o correo" class="flex-1 rounded-lg border border-jro-line px-3 py-2 text-sm"><button class="rounded-lg border-2 border-jro-ink px-3 text-sm font-semibold">Buscar</button></form>
      <span class="text-sm text-jro-mute">${lista.length} cuentas · ${lista.filter(esDelCentro).length} del centro</span>
    </div>
    <div class="mt-3 bg-white rounded-2xl border border-jro-line overflow-x-auto">
      <table class="w-full text-sm">
        <thead><tr class="text-left text-jro-mute"><th class="p-3">Nombre</th><th class="p-3">Tipo</th><th class="p-3">Formaciones</th><th class="p-3">Alta</th><th class="p-3"></th></tr></thead>
        <tbody>${lista.map(u => {
          const fs = ordenadas().filter(f => motivoAcceso(u, f));
          return `<tr class="border-t border-jro-line align-top">
            <td class="p-3"><div class="font-semibold">${esc(u.nombre)}</div><div class="text-xs text-jro-mute break-all">${esc(u.email)}</div></td>
            <td class="p-3">${esDelCentro(u) ? "Centro" : "Externo"}</td>
            <td class="p-3"><div class="flex flex-wrap gap-1">${fs.map(f => `<span class="rounded-full px-2 py-0.5 text-xs ${(TIPOS[f.tipo] || TIPOS.curso).fondo}">${esc(f.corto || f.titulo)}</span>`).join("") || `<span class="text-jro-mute">—</span>`}</div></td>
            <td class="p-3 whitespace-nowrap">${fechaCorta(u.createdAt)}</td>
            <td class="p-3 text-right whitespace-nowrap">
              <button data-action="resetpw" data-id="${esc(u.id)}" class="rounded-lg border border-jro-line px-2 py-1 text-xs">Contraseña</button>
              <button data-action="borrarusuario" data-id="${esc(u.id)}" class="rounded-lg border border-jro-terra px-2 py-1 text-xs">Eliminar</button></td>
          </tr>`; }).join("") || `<tr><td colspan="5" class="p-6 text-center text-jro-mute">Sin resultados.</td></tr>`}</tbody>
      </table>
    </div>`;
}

function adminCodigos() {
  return `<section class="bg-white rounded-2xl border border-jro-line p-5">
      <h2 class="font-extrabold">Nuevo código de acceso</h2>
      <p class="text-sm text-jro-mute">Para becas, convenios con empresas, grupos de clase o pagos por transferencia: quien lo canjee obtiene acceso a la formación.</p>
      <form data-form="codigo" class="mt-3 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <label class="block lg:col-span-1"><span class="text-sm font-medium">Código</span><input name="id" value="${generarCodigoAcceso()}" maxlength="40" class="${INPUT} mono uppercase"></label>
        <label class="block lg:col-span-1"><span class="text-sm font-medium">Formación</span>${selectFormacion("formacionId")}</label>
        <label class="block"><span class="text-sm font-medium">Usos</span><input name="usosMax" type="number" min="1" max="1000" value="1" class="${INPUT}"></label>
        <label class="block"><span class="text-sm font-medium">Caduca</span><input name="caduca" type="date" class="${INPUT}"></label>
        <label class="block"><span class="text-sm font-medium">Nota interna</span><input name="nota" maxlength="120" class="${INPUT}" placeholder="Beca, empresa…"></label>
        <button class="btn-cta rounded-lg px-5 py-2.5 sm:col-span-2 lg:col-span-5 justify-self-start">Crear código</button>
      </form>
    </section>
    <div class="mt-6 bg-white rounded-2xl border border-jro-line overflow-x-auto">
      <table class="w-full text-sm">
        <thead><tr class="text-left text-jro-mute"><th class="p-3">Código</th><th class="p-3">Formación</th><th class="p-3">Usos</th><th class="p-3">Caduca</th><th class="p-3">Nota</th><th class="p-3"></th></tr></thead>
        <tbody>${DB.codigos.length ? [...DB.codigos].sort((a, b) => String(b.creadoEn).localeCompare(String(a.creadoEn))).map(c => {
          const agotado = c.usos >= c.usosMax || (c.caduca && new Date(c.caduca) < new Date());
          return `<tr class="border-t border-jro-line ${agotado ? "opacity-60" : ""}">
            <td class="p-3 mono font-semibold whitespace-nowrap">${esc(c.id)}</td><td class="p-3">${esc(nombreFormacion(c.formacionId))}</td>
            <td class="p-3">${c.usos} / ${c.usosMax}</td><td class="p-3 whitespace-nowrap">${c.caduca ? fechaCorta(c.caduca) : "—"}</td><td class="p-3">${esc(c.nota || "")}</td>
            <td class="p-3 text-right whitespace-nowrap"><button data-action="copiartexto" data-texto="${esc(c.id)}" class="rounded-lg border border-jro-line px-2 py-1 text-xs">Copiar</button>
              <button data-action="borrarcodigo" data-id="${esc(c.id)}" class="rounded-lg border border-jro-terra px-2 py-1 text-xs">Borrar</button></td></tr>`;
        }).join("") : `<tr><td colspan="6" class="p-6 text-center text-jro-mute">No hay códigos.</td></tr>`}</tbody>
      </table>
    </div>`;
}

function adminAvisos() {
  return `<section class="bg-white rounded-2xl border border-jro-line p-5">
      <h2 class="font-extrabold">Publicar un aviso</h2>
      <form data-form="aviso" class="mt-3 space-y-3">
        <div class="grid sm:grid-cols-2 gap-3">
          <label class="block"><span class="text-sm font-medium">Título</span><input name="titulo" maxlength="120" required class="${INPUT}"></label>
          <label class="block"><span class="text-sm font-medium">Para</span><select name="formacionId" class="${INPUT}"><option value="">Todo el campus</option>
            ${ordenadas().map(f => `<option value="${esc(f.id)}">Solo ${esc(f.corto || f.titulo)}</option>`).join("")}</select></label>
        </div>
        <label class="block"><span class="text-sm font-medium">Texto</span><textarea name="texto" rows="3" maxlength="2000" class="${INPUT}"></textarea></label>
        <button class="btn-cta rounded-lg px-5 py-2.5">Publicar</button>
      </form>
    </section>
    <div class="mt-6 grid gap-3">${[...DB.avisos].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).map(a => `<article class="bg-white rounded-xl border border-jro-line p-4 flex gap-3">
      <div class="flex-1"><div class="text-xs text-jro-mute">${fecha(a.fecha)} · ${a.formacionId ? esc(nombreFormacion(a.formacionId)) : "Todo el campus"}</div>
        <div class="font-bold">${esc(a.titulo)}</div><p class="text-sm whitespace-pre-line">${esc(a.texto)}</p></div>
      <button data-action="borraraviso" data-id="${esc(a.id)}" class="self-start rounded-lg border border-jro-terra px-2 py-1 text-xs">Borrar</button>
    </article>`).join("") || `<p class="text-sm text-jro-mute">No hay avisos publicados.</p>`}</div>`;
}

function adminPedidos() {
  const lista = [...DB.pedidos].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const total = lista.filter(p => p.estado === "pagado").reduce((t, p) => t + (Number(p.importe) || 0), 0);
  return `<div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm"><b>${lista.length}</b> pedidos · <b>${euros(total)}</b> cobrados</p>
      <button data-action="csvpedidos" class="rounded-lg border-2 border-jro-ink px-4 py-2 text-sm font-semibold">Descargar CSV</button>
    </div>
    <div class="mt-3 bg-white rounded-2xl border border-jro-line overflow-x-auto">
      <table class="w-full text-sm">
        <thead><tr class="text-left text-jro-mute"><th class="p-3">Fecha</th><th class="p-3">Alumno/a</th><th class="p-3">Formación</th><th class="p-3">Importe</th><th class="p-3">Estado</th><th class="p-3">Referencia</th></tr></thead>
        <tbody>${lista.map(p => `<tr class="border-t border-jro-line">
          <td class="p-3 whitespace-nowrap">${fechaCorta(p.fecha)}</td><td class="p-3"><div class="font-semibold">${esc(p.nombre)}</div><div class="text-xs text-jro-mute break-all">${esc(p.email)}</div></td>
          <td class="p-3">${esc(nombreFormacion(p.formacionId))}</td><td class="p-3 whitespace-nowrap">${euros(p.importe)}</td><td class="p-3">${esc(p.estado)}</td>
          <td class="p-3 mono text-xs break-all">${esc(p.id)}</td></tr>`).join("") || `<tr><td colspan="6" class="p-6 text-center text-jro-mute">Todavía no hay pedidos.</td></tr>`}</tbody>
      </table>
    </div>`;
}

/* =====================================================================
   MODALES
   ===================================================================== */
function abrirModal(titulo, cuerpo, acciones = "") {
  $("#modal-root").innerHTML = `<div class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" data-action="cerrarmodal-fondo">
    <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <div class="flex items-center justify-between px-5 py-3 border-b border-jro-line sticky top-0 bg-white">
        <h2 class="font-bold">${titulo}</h2>
        <button data-action="cerrarmodal" class="text-2xl leading-none text-jro-mute" aria-label="Cerrar">×</button>
      </div>
      <div class="p-5">${cuerpo}</div>
      ${acciones ? `<div class="px-5 pb-5 flex flex-wrap justify-end gap-2">${acciones}</div>` : ""}
    </div>
  </div>`;
  $("#modal-root button[data-action='cerrarmodal']")?.focus();
}
function cerrarModal() { $("#modal-root").innerHTML = ""; }

function confirmar(titulo, texto, palabra, onOk, { pedirPassword = false } = {}) {
  abrirModal(titulo, `<p class="text-sm">${texto}</p>
    ${pedirPassword ? `<label class="block mt-4 text-sm">Tu contraseña
      <input id="confirm-pw" type="password" autocomplete="current-password" class="${INPUT}"></label>` : ""}
    <label class="block mt-4 text-sm">Escribe <b>${palabra}</b> para confirmar
      <input id="confirm-input" class="${INPUT}"></label>`,
    `<button data-action="cerrarmodal" class="rounded-lg px-4 py-2 text-sm border border-jro-line">Cancelar</button>
     <button id="confirm-ok" class="rounded-lg px-4 py-2 text-sm font-semibold border-2 border-jro-terra bg-jro-terra">Confirmar</button>`);
  $("#confirm-ok").addEventListener("click", async () => {
    if ($("#confirm-input").value.trim() !== palabra) { toast(`Escribe ${palabra} para confirmar`); return; }
    const pw = $("#confirm-pw")?.value || "";
    try { await onOk(pw); cerrarModal(); } catch (e) { toast(e.message); }
  });
}

function modalSolicitud(f) {
  abrirModal(`Solicitar: ${esc(f.corto || f.titulo)}`, `<form data-form="solicitud" data-id="${esc(f.id)}" class="space-y-3">
      <p class="text-sm">El centro recibirá tu solicitud y te contestará por correo (${esc(usuario().email)}). Si la acepta, la formación aparecerá en Mi campus.</p>
      <label class="block text-sm"><span class="font-medium">Mensaje (opcional)</span>
        <textarea name="mensaje" rows="4" maxlength="1000" class="${INPUT}" placeholder="Cómo prefieres pagar, si necesitas factura, si solicitas beca, tu formación previa…"></textarea></label>
      <div class="flex justify-end gap-2"><button type="button" data-action="cerrarmodal" class="rounded-lg px-4 py-2 text-sm border border-jro-line">Cancelar</button>
        <button class="btn-cta rounded-lg px-4 py-2 text-sm">Enviar solicitud</button></div>
    </form>`);
}

// Solo en modo demostración: imita la pantalla de pago sin cobrar nada
function modalPagoDemo(f) {
  abrirModal("Pago de demostración", `<div class="space-y-4">
      <div class="rounded-xl bg-jro-cream p-4">
        <div class="text-sm text-jro-mute">${esc(TIPOS[f.tipo]?.nombre || "")}</div>
        <div class="font-bold">${esc(f.titulo)}</div>
        <div class="mt-2 text-2xl font-extrabold">${euros(f.precio)}</div>
      </div>
      <p class="text-sm">En producción aquí se abre la pasarela segura de <b>Stripe</b> (tarjeta, Apple Pay, Google Pay). En esta demostración no se cobra nada: el pedido y la matrícula se crean igual que en un pago real.</p>
    </div>`,
    `<button data-action="cerrarmodal" class="rounded-lg px-4 py-2 text-sm border border-jro-line">Cancelar</button>
     <button data-action="pagodemo" data-id="${esc(f.id)}" class="btn-cta rounded-lg px-4 py-2 text-sm">Pagar ${euros(f.precio)} (simulado)</button>`);
}

function modalPrivacidad() {
  abrirModal("Política de privacidad", `<div class="prose-jro text-sm">
    <p><b>Responsable:</b> Centro de Formación Profesional José Ramón Otero. Contacto: ${ADMIN_EMAIL}.</p>
    <p><b>Datos que tratamos:</b> nombre, correo, matrículas, solicitudes y compras (importe, fecha y referencia del pago; nunca los datos de tu tarjeta, que gestiona Stripe).</p>
    <p><b>Finalidades:</b> gestionar tu cuenta, tus matrículas y el acceso a las plataformas de cada formación; enviarte avisos del campus; cumplir las obligaciones contables y fiscales.</p>
    <p><b>Base jurídica:</b> ejecución del contrato de formación (art. 6.1.b RGPD), consentimiento (art. 6.1.a) y obligación legal para los justificantes de cobro (art. 6.1.c).</p>
    <p><b>Plataformas de cada formación:</b> cuando entras en un curso, máster o módulo, su plataforma puede consultar al campus si tienes acceso (solo tu correo y la formación). Cada plataforma tiene su propia política de privacidad.</p>
    <p><b>Encargados del tratamiento:</b> Google (Firebase), Netlify (alojamiento) y Stripe (pagos). No se ceden datos a terceros salvo obligación legal.</p>
    <p><b>Conservación:</b> mientras mantengas la cuenta. Los justificantes de pago, el plazo que marque la normativa fiscal.</p>
    <p><b>Derechos:</b> acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${ADMIN_EMAIL}, o desde «Perfil» (exportar y eliminar). Puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
  </div>`);
}

function modalCondiciones() {
  abrirModal("Condiciones de contratación", `<div class="prose-jro text-sm">
    <p><b>Precio:</b> el indicado en la ficha de cada formación, IVA incluido si procede. Pago único salvo que la ficha indique otra cosa.</p>
    <p><b>Acceso:</b> al confirmarse el pago, la formación aparece en «Mi campus» y puedes entrar en su plataforma con el mismo correo. El acceso es personal e intransferible.</p>
    <p><b>Desistimiento:</b> dispones de 14 días naturales desde la compra para desistir escribiendo a ${ADMIN_EMAIL}. Si ya has empezado a usar el contenido digital, al comprar aceptas expresamente que el derecho de desistimiento se pierde una vez iniciado el acceso (art. 103.m del TRLGDCU).</p>
    <p><b>Titulaciones:</b> los títulos propios del centro no tienen carácter oficial, salvo que la ficha diga lo contrario.</p>
    <p><b>Facturas:</b> solicítalas a ${ADMIN_EMAIL} indicando la fecha del pedido.</p>
    <p class="text-xs text-jro-mute">Texto orientativo: revísalo con la asesoría del centro antes de activar los pagos.</p>
  </div>`);
}

/* =====================================================================
   RENDER Y EVENTOS
   ===================================================================== */
let renderPendiente = false;
const PRIVADAS = ["micampus", "perfil", "admin", "pago"];

function render() {
  const app = $("#app");
  if (AUTH.estado === "completar") { app.innerHTML = vistaCompletar(); return; }
  if (AUTH.estado === "error") {
    app.innerHTML = `<div class="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">${logoSVG(56)}
      <p class="text-sm">${esc(AUTH.mensaje || "No se ha podido conectar.")}</p>
      <button data-action="recargar" class="btn-cta rounded-lg px-4 py-2 text-sm">Reintentar</button></div>`;
    return;
  }
  if (PRIVADAS.includes(UI.vista) && AUTH.estado === "cargando") {
    app.innerHTML = `<div class="min-h-screen flex flex-col items-center justify-center gap-4">${logoSVG(56)}<p class="text-sm text-jro-mute">Cargando…</p></div>`;
    return;
  }
  if (PRIVADAS.includes(UI.vista) && !usuario()) {
    if (AUTH.estado === "fuera") { UI.despues = location.hash; UI.vista = "acceso"; }
    else { app.innerHTML = marco(`<p class="p-10 text-center text-jro-mute">Cargando…</p>`); return; }
  }
  if (UI.vista === "admin" && !esAdmin()) UI.vista = "micampus";
  if (UI.vista === "acceso" && usuario()) { UI.vista = "micampus"; history.replaceState(null, "", "#/mi-campus"); }
  app.innerHTML = {
    inicio: vistaInicio, formacion: vistaFormacion, micampus: vistaMiCampus, acceso: vistaAcceso,
    perfil: vistaPerfil, admin: vistaAdmin, pago: vistaPago
  }[UI.vista]();
}

// Los cambios que llegan de la base de datos no borran lo que se está escribiendo
function renderDatos() {
  const activo = document.activeElement;
  if (activo && activo.closest("#app form") && activo.matches("input:not([type=checkbox]), textarea, select")) { renderPendiente = true; return; }
  render();
}
document.addEventListener("focusout", () => {
  if (!renderPendiente) return;
  setTimeout(() => {
    const activo = document.activeElement;
    if (activo && activo.closest("#app form") && activo.matches("input, textarea, select, button")) return;
    renderPendiente = false; render();
  }, 0);
});

// Evita repetir la misma acción mientras está en curso
const enCurso = new Set();
async function tarea(clave, fn, okMsg) {
  if (enCurso.has(clave)) return;
  enCurso.add(clave);
  document.body.classList.add("cursor-progress");
  try {
    const r = await fn();
    if (okMsg || typeof r === "string") toast(typeof r === "string" ? r : okMsg);
    return r ?? true;
  } catch (e) {
    toast(e.message || String(e));
    return false;
  } finally {
    enCurso.delete(clave);
    if (!enCurso.size) document.body.classList.remove("cursor-progress");
  }
}

function alAutenticar(estado) {
  const antes = AUTH.estado;
  AUTH = estado;
  // Tras iniciar sesión, vuelve a la ficha desde la que se pidió entrar
  if (antes !== "dentro" && estado.estado === "dentro" && UI.despues) {
    const h = UI.despues; UI.despues = null; ir(h); return;
  }
  render();
}

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  if (a === "cerrarmodal-fondo" && ev.target !== el) return;
  const id = el.dataset.id;
  switch (a) {
    case "authtab": UI.authTab = el.dataset.tab; render(); break;
    case "despues": UI.despues = el.dataset.hash; break;   // el enlace sigue su curso
    case "demo": tarea("demo", () => backend.accesoDemo(id), "Sesión de demostración iniciada"); break;
    case "salir": tarea("salir", () => backend.salir()).then(() => ir("#/")); break;
    case "recargar": location.reload(); break;
    case "privacidad": modalPrivacidad(); break;
    case "condiciones": modalCondiciones(); break;
    case "cerrarmodal": case "cerrarmodal-fondo": cerrarModal(); break;
    case "copiartexto": copiar(el.dataset.texto); break;
    case "limpiarbusqueda": UI.buscar = ""; render(); break;
    case "recuperar": {
      const email = ($("form[data-form=login] input[name=email]")?.value || "").trim().toLowerCase();
      if (!email) { toast("Escribe tu correo y vuelve a pulsar"); break; }
      tarea("recuperar", () => backend.recuperarPassword(email));
      break;
    }
    case "reenviarverif": tarea("reenviar", () => backend.reenviarVerificacion(), "Correo de verificación enviado"); break;
    case "comprobarverif":
      tarea("comprobar", async () => (await backend.comprobarVerificacion()) ? "Correo verificado" : "Aún no consta como verificado. Abre el enlace del correo y vuelve a probar.");
      break;

    /* Alumnado */
    case "entrar": {
      // Con Firebase se pide el enlace firmado: la plataforma reconoce al alumno sin pedirle códigos.
      // La pestaña se abre ya (antes de esperar) para que el navegador no la bloquee.
      if (backend.modo !== "firebase" || !usuario()) break;
      ev.preventDefault();
      const ventana = window.open("", "_blank");
      tarea("entrar-" + id, async () => {
        let url = el.href;
        try { url = await backend.enlacePlataforma(id); } catch (e) { toast(e.message); }
        if (ventana) { ventana.opener = null; ventana.location.href = url; } else location.href = url;
      });
      break;
    }
    case "gratis":
      tarea("gratis-" + id, () => backend.matricularGratis(id), "¡Matrícula hecha! Ya la tienes en Mi campus");
      break;
    case "comprar": {
      const f = formacion(id);
      if (backend.modo === "demo") { modalPagoDemo(f); break; }
      tarea("comprar-" + id, () => backend.comprar(id));
      break;
    }
    case "pagodemo":
      tarea("pagodemo", async () => { await backend.comprar(id); cerrarModal(); ir(`#/pago/ok/${encodeURIComponent(id)}`); });
      break;
    case "solicitar": modalSolicitud(formacion(id)); break;
    case "cancelarsolicitud": tarea("cancelar-" + id, () => backend.cancelarSolicitud(id), "Solicitud cancelada"); break;
    case "exportar": exportarDatos(); toast("Datos exportados"); break;
    case "eliminar":
      confirmar("Eliminar mi cuenta", "Se borrarán tu perfil, tus matrículas y tus solicitudes y perderás el acceso a tus formaciones. Descarga antes tus datos si los necesitas.", "ELIMINAR",
        async (pw) => {
          if (backend.modo === "firebase" && !pw) throw new Error("Escribe tu contraseña.");
          await backend.eliminarMiCuenta(pw); toast("Cuenta eliminada"); ir("#/");
        }, { pedirPassword: backend.modo === "firebase" });
      break;

    /* Administración */
    case "cargarcatalogo": tarea("cargarcatalogo", () => backend.cargarCatalogoInicial(), "Catálogo inicial cargado"); break;
    case "borrarformacion": {
      const f = formacion(id);
      confirmar("Borrar formación", `Se quitará «${esc(f.titulo)}» del catálogo. Las matrículas existentes se conservan, pero el alumnado dejará de verla.`, "BORRAR",
        async () => { await backend.borrarFormacion(id); toast("Formación borrada"); });
      break;
    }
    case "revocar": tarea("matricula-" + id, () => backend.revocarMatricula(id), "Acceso revocado"); break;
    case "reactivar": tarea("matricula-" + id, () => backend.reactivarMatricula(id), "Acceso reactivado"); break;
    case "borrarcodigo": tarea("codigo-" + id, () => backend.borrarCodigo(id), "Código borrado"); break;
    case "borraraviso": tarea("aviso-" + id, () => backend.borrarAviso(id), "Aviso borrado"); break;
    case "resetpw": tarea("resetpw-" + id, () => backend.restablecerPassword(id)); break;
    case "borrarusuario": {
      const u = DB.usuarios.find(x => x.id === id);
      confirmar("Eliminar datos del alumno", `Se eliminarán el perfil, las matrículas y las solicitudes de ${esc(u.nombre)}. Los pedidos se conservan.`, "ELIMINAR",
        async () => { const r = await backend.eliminarUsuario(id); toast(r || "Datos eliminados"); });
      break;
    }
    case "csvmatriculas":
      descargar("matriculas-campus.csv", csv([["Nombre", "Correo", "Formación", "Origen", "Importe", "Fecha", "Estado"],
        ...DB.matriculas.filter(m => UI.filtroFormacion === "todas" || m.formacionId === UI.filtroFormacion)
          .map(m => [m.nombre, m.email, nombreFormacion(m.formacionId), ORIGENES[m.origen] || m.origen, m.importe || 0, fechaCorta(m.fecha), m.estado])]), "text/csv;charset=utf-8");
      break;
    case "csvpedidos":
      descargar("pedidos-campus.csv", csv([["Fecha", "Nombre", "Correo", "Formación", "Importe", "Estado", "Referencia"],
        ...DB.pedidos.map(p => [fechaCorta(p.fecha), p.nombre, p.email, nombreFormacion(p.formacionId), p.importe, p.estado, p.id])]), "text/csv;charset=utf-8");
      break;
  }
});

document.addEventListener("change", (ev) => {
  if (ev.target.matches("[data-action='filtroformacion']")) { UI.filtroFormacion = ev.target.value; render(); }
});

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") cerrarModal();
});

const validarCorreo = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

document.addEventListener("submit", async (ev) => {
  const f = ev.target.closest("form[data-form]");
  if (!f) return;
  ev.preventDefault();
  const datos = Object.fromEntries(new FormData(f).entries());
  const err = (m) => { const e = f.querySelector("[data-error]"); if (e) { e.textContent = m; e.classList.remove("hidden"); } else toast(m); };

  switch (f.dataset.form) {
    case "buscar":
      UI.buscar = (datos.q || "").trim(); render();
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    case "buscaralumno": UI.buscarAlumno = (datos.q || "").trim(); render(); break;
    case "login": {
      const email = (datos.email || "").trim().toLowerCase();
      if (!email || !datos.password) { toast("Escribe tu correo y tu contraseña"); return; }
      await tarea("login", () => backend.entrar(email, datos.password));
      break;
    }
    case "registro": {
      const email = (datos.email || "").trim().toLowerCase();
      if ((datos.nombre || "").trim().length < 3) return err("Escribe tu nombre y apellidos.");
      if (!validarCorreo(email)) return err("El correo no es válido.");
      if ((datos.password || "").length < 8) return err("La contraseña debe tener al menos 8 caracteres.");
      if (datos.password !== datos.password2) return err("Las contraseñas no coinciden.");
      if (!datos.privacidad) return err("Debes aceptar la Política de Privacidad y las condiciones.");
      await tarea("registro", () => backend.registrar({ nombre: datos.nombre.trim(), email, password: datos.password }),
        DEMO_MODE ? "Cuenta creada. ¡Bienvenido/a!" : "Cuenta creada. Revisa tu correo para verificarla.");
      break;
    }
    case "completar": {
      if ((datos.nombre || "").trim().length < 3) return err("Escribe tu nombre y apellidos.");
      if (!datos.privacidad) return err("Debes aceptar la Política de Privacidad y las condiciones.");
      await tarea("completar", () => backend.completarPerfil({ nombre: datos.nombre.trim() }));
      break;
    }
    case "perfil": {
      const nombre = (datos.nombre || "").trim();
      if (nombre.length < 3) { toast("Escribe tu nombre y apellidos"); return; }
      await tarea("perfil", () => backend.actualizarPerfil({ nombre }), "Perfil guardado");
      break;
    }
    case "canjear": {
      const codigo = (datos.codigo || "").trim().toUpperCase();
      if (codigo.length < 4) { toast("Escribe el código"); return; }
      const r = await tarea("canjear", () => backend.canjearCodigo(codigo));
      if (r) { toast(`¡Código canjeado! Ya tienes acceso a ${r.corto || r.titulo || "la formación"}`); ir("#/mi-campus"); }
      break;
    }
    case "solicitud": {
      const ok = await tarea("solicitud", () => backend.solicitar(f.dataset.id, (datos.mensaje || "").trim().slice(0, 1000)), "Solicitud enviada. Te contestaremos por correo.");
      if (ok) cerrarModal();
      break;
    }

    /* Administración */
    case "formacion": {
      const nueva = f.dataset.nueva === "true";
      const id = nueva ? slug(datos.id || datos.titulo) : UI.editarId;
      if (!datos.titulo?.trim()) { toast("Escribe el título"); return; }
      if (!id) { toast("El identificador no es válido"); return; }
      if (nueva && formacion(id)) { toast("Ya existe una formación con ese identificador"); return; }
      if (datos.url && !esURL(datos.url)) { toast("La dirección debe empezar por https://"); return; }
      const precio = Math.max(0, Math.round(Number(datos.precio || 0) * 100) / 100);
      const fm = {
        id, tipo: datos.tipo, estado: datos.estado, titulo: datos.titulo.trim(), corto: (datos.corto || "").trim(),
        resumen: (datos.resumen || "").trim(), descripcion: (datos.descripcion || "").trim(),
        precio, horas: Math.max(1, Math.round(Number(datos.horas) || 1)), orden: Math.round(Number(datos.orden) || 0),
        url: (datos.url || "").trim(), incluidaCentro: !!datos.incluidaCentro, destacada: !!datos.destacada,
        duracion: (datos.duracion || "").trim(), edicion: (datos.edicion || "").trim(), modalidad: (datos.modalidad || "").trim(),
        nivel: (datos.nivel || "").trim(), titulacion: (datos.titulacion || "").trim(),
        aprenderas: lineas(datos.aprenderas), requisitos: lineas(datos.requisitos), temario: leerTemario(datos.temario)
      };
      const ok = await tarea("formacion", () => backend.guardarFormacion(fm), "Formación guardada");
      if (ok) ir("#/admin/catalogo");
      break;
    }
    case "asignar":
      if (!datos.uid || !datos.formacionId) { toast("Elige alumno/a y formación"); return; }
      await tarea("asignar", () => backend.asignarMatricula(datos.uid, datos.formacionId), "Acceso concedido");
      break;
    case "resolver": {
      const aceptar = ev.submitter?.value === "aceptar";
      await tarea("resolver-" + f.dataset.id, () => backend.resolverSolicitud(f.dataset.id, aceptar, (datos.respuesta || "").trim()),
        aceptar ? "Solicitud aceptada: ya tiene acceso" : "Solicitud rechazada");
      break;
    }
    case "codigo": {
      const id = (datos.id || "").trim().toUpperCase();
      if (!/^[A-Z0-9-]{4,40}$/.test(id)) { toast("El código solo puede tener letras, números y guiones (4-40)"); return; }
      if (!datos.formacionId) { toast("Elige la formación"); return; }
      await tarea("codigo", () => backend.crearCodigo({
        id, formacionId: datos.formacionId, usosMax: Math.max(1, Math.min(1000, Math.round(Number(datos.usosMax) || 1))),
        caduca: datos.caduca ? new Date(datos.caduca + "T23:59:59").toISOString() : null, nota: (datos.nota || "").trim()
      }), "Código creado");
      break;
    }
    case "aviso": {
      if (!(datos.titulo || "").trim() || !(datos.texto || "").trim()) { toast("Escribe título y texto"); return; }
      const ok = await tarea("aviso", () => backend.publicarAviso({ titulo: datos.titulo.trim(), texto: datos.texto.trim(), formacionId: datos.formacionId || null }), "Aviso publicado");
      if (ok) f.reset();
      break;
    }
  }
});

/* =====================================================================
   ARRANQUE
   ===================================================================== */
async function arrancar() {
  aplicarRuta();
  try {
    if (FIREBASE) {
      const { crearBackendFirebase } = await import("./backend-firebase.js");
      backend = crearBackendFirebase();
    } else {
      backend = crearBackendLocal();
    }
  } catch (e) {
    console.error(e);
    AUTH = { estado: "error", mensaje: "No se ha podido iniciar el campus." };
    render();
    return;
  }
  render();
  backend.iniciar(alAutenticar, renderDatos);
}

arrancar();
