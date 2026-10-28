/* =====================================================================
   Plataforma LMS · Formación Profesional JOSÉ RAMÓN OTERO
   Curso: Especialización en Ingeniería de IA, Skills, MCP y Automatización con Claude
   ===================================================================== */
import {
  LOGO_IMG_SRC, CENTRO, CURSO, ADMIN_EMAIL, ADMIN_NOMBRE, DOMINIO, HORAS_CURSO,
  FIREBASE, DEMO_MODE, CICLOS
} from "./constantes.js";
import { TABS, BLOQUES, SESIONES } from "./datos.js";
import { DB, notaMediaDe } from "./estado.js";
import { crearBackendLocal } from "./backend-local.js";

/* =====================================================================
   LOGOTIPO
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

// Imagen oficial; si no carga, el listener de errores la cambia por el SVG
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
const nid = () => Math.random().toString(36).slice(2, 10);
const fecha = (iso) => iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—";
const fechaHora = (iso) => iso ? new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "—";
const esURL = (s) => /^https?:\/\/[^\s]+$/i.test(String(s || "").trim());
const INPUT = "mt-1 w-full rounded-lg border border-jro-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jro-gold";

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 3200);
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
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

const urlVerificacion = (codigo) => `${location.origin}${location.pathname}#/verificar/${encodeURIComponent(codigo)}`;

/* =====================================================================
   ESTADO DE LA INTERFAZ Y RUTAS (#/curso/3/taller, #/perfil, #/admin/entregas…)
   ===================================================================== */
let backend;
let AUTH = { estado: "cargando" };
const UI = {
  vista: "curso",           // curso | perfil | admin | diploma | verificar
  sesion: 1,
  tab: "teoria",
  authTab: "login",
  adminTab: "seguimiento",
  filtroCiclo: "todos",
  filtroEstado: "pendiente",
  diplomaId: null,
  codigoVerificar: "",
  resultadoVerificar: undefined
};

function aplicarRuta() {
  if (/\/accion\/?$/.test(location.pathname)) { UI.vista = "accion"; return; }
  const [vista, a, b] = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  if (vista === "perfil") UI.vista = "perfil";
  else if (vista === "admin") { UI.vista = "admin"; if (["seguimiento", "entregas", "titulos", "usuarios"].includes(a)) UI.adminTab = a; }
  else if (vista === "titulo") { UI.vista = "diploma"; UI.diplomaId = a; }
  else if (vista === "verificar") {
    UI.vista = "verificar";
    if ((a || "") !== UI.codigoVerificar) { UI.codigoVerificar = a || ""; UI.resultadoVerificar = undefined; if (a) comprobarTitulo(a); }
  } else {
    UI.vista = "curso";
    const n = Number(a);
    if (n >= 1 && n <= SESIONES.length) UI.sesion = n;
    UI.tab = TABS.some(t => t.id === b) ? b : "teoria";
  }
}

function ir(hash) {
  if (location.hash === hash) { aplicarRuta(); render(); }
  else location.hash = hash;
}
const rutaSesion = (n, tab = "teoria") => `#/curso/${n}/${tab}`;

window.addEventListener("hashchange", () => { aplicarRuta(); render(); window.scrollTo(0, 0); });

const usuario = () => AUTH.estado === "dentro" ? DB.users.find(u => u.id === AUTH.userId) || null : null;
const esAdmin = () => usuario()?.role === "admin";
const alumnos = () => DB.users.filter(u => u.role === "alumno");
const entrega = (userId, n) => DB.submissions.find(s => s.userId === userId && s.sesion === n);
const completadas = (userId) => Object.keys(DB.progress[userId] || {}).length;
const diplomaDe = (userId) => DB.diplomas.find(d => d.userId === userId);
const aprobadas = (userId) => DB.submissions.filter(s => s.userId === userId && s.estado === "aprobada");
const apto = (userId) => entrega(userId, 12)?.estado === "aprobada";
const verificado = () => AUTH.verificado !== false;

/* =====================================================================
   COMPONENTES COMUNES
   ===================================================================== */
function badgeCiclo(ciclo) {
  if (ciclo === "DAM") return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold dam-head text-jro-ink">DAM</span>`;
  if (ciclo === "ASIR") return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold asir-head text-jro-ink">ASIR</span>`;
  return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-jro-gold text-jro-ink">Docente</span>`;
}

function badgeEstado(estado) {
  const m = {
    pendiente: ["Pendiente de revisión", "bg-white border border-jro-gold text-jro-ink"],
    aprobada: ["Aprobada", "bg-jro-gold text-jro-ink"],
    revision: ["Requiere cambios", "bg-jro-terra text-jro-ink"]
  }[estado] || ["Sin entregar", "bg-gray-100 text-jro-mute"];
  return `<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${m[1]}">${m[0]}</span>`;
}

function codeBlock(lang, code) {
  const id = "c" + nid();
  return `<div class="mt-3">
    <div class="code-head flex items-center justify-between px-3 py-1.5 text-xs">
      <span class="mono">${esc(lang)}</span>
      <button class="rounded bg-jro-gold text-jro-ink font-semibold px-2 py-0.5" data-action="copiar" data-target="${id}">Copiar</button>
    </div>
    <pre class="code" id="${id}">${esc(code)}</pre>
  </div>`;
}

function cabeceraSimple() {
  return `<div class="bg-white border-b border-jro-line">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="#/" aria-label="Inicio">${logo(36)}</a>
      ${DEMO_MODE ? `<span class="rounded-full border border-jro-gold px-2.5 py-0.5 text-xs font-semibold">Modo demostración</span>` : ""}
    </div>
  </div>`;
}

function header() {
  const u = usuario();
  const nav = (vista, hash, texto, corto) => `<button data-action="ir" data-hash="${hash}" class="px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap ${UI.vista === vista ? "bg-jro-cream font-semibold text-jro-ink" : "text-jro-mute hover:text-jro-ink"}"><span class="sm:hidden">${corto || texto}</span><span class="hidden sm:inline">${texto}</span></button>`;
  return `<header class="bg-white border-b border-jro-line sticky top-0 z-30 no-print">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
      <button data-action="ir" data-hash="${rutaSesion(UI.sesion)}" class="shrink-0" aria-label="Inicio"><span class="sm:hidden">${isotipoSVG(34)}</span><span class="hidden sm:inline">${logo(36)}</span></button>
      <div class="hidden xl:block text-sm font-semibold text-jro-ink truncate">${CURSO}</div>
      <nav class="flex items-center gap-0.5 sm:gap-1">
        ${nav("curso", rutaSesion(UI.sesion, UI.tab), "Curso")}
        ${esAdmin() ? nav("admin", "#/admin/" + UI.adminTab, "Panel docente", "Panel") : ""}
        ${nav("perfil", "#/perfil", "Mi perfil", "Perfil")}
        <span class="hidden sm:inline-flex ml-2">${badgeCiclo(u.role === "admin" ? null : u.ciclo)}</span>
        <button data-action="salir" class="ml-1 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm text-jro-mute hover:text-jro-ink">Salir</button>
      </nav>
    </div>
  </header>
  ${!verificado() ? `<div class="bg-jro-gold/30 border-b border-jro-gold no-print">
    <div class="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2 text-sm">
      <span><b>Verifica tu correo.</b> Te hemos enviado un enlace a ${esc(AUTH.email)} (mira también en correo no deseado). Hasta entonces no podrás entregar actividades. Si no te llega, el profesor puede activar tu cuenta.</span>
      <button data-action="reenviarverif" class="rounded-lg bg-white border border-jro-line px-3 py-1 text-xs font-semibold">Reenviar correo</button>
      <button data-action="comprobarverif" class="rounded-lg btn-cta px-3 py-1 text-xs">Ya lo he verificado</button>
    </div>
  </div>` : ""}`;
}

/* =====================================================================
   VISTAS DE ACCESO
   ===================================================================== */
function vistaCargando() {
  return `<div class="min-h-screen flex flex-col items-center justify-center gap-4">${logoSVG(56)}<p class="text-sm text-jro-mute">Cargando…</p></div>`;
}

function vistaError() {
  return `<div class="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">${logoSVG(56)}
    <p class="text-sm">${esc(AUTH.mensaje || "No se ha podido conectar.")}</p>
    <button data-action="recargar" class="btn-cta rounded-lg px-4 py-2 text-sm">Reintentar</button></div>`;
}

function vistaAuth() {
  const t = UI.authTab;
  return `<div class="min-h-screen flex flex-col">
    ${cabeceraSimple()}
    <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8 items-start">
      <section class="pt-2">
        <div class="mb-6">${logoSVG(56)}</div>
        <span class="inline-flex rounded-full bg-jro-gold px-3 py-1 text-xs font-bold text-jro-ink">Título Propio del Centro</span>
        <h1 class="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight">${CURSO}</h1>
        <p class="mt-4 text-jro-mute leading-relaxed">12 sesiones de principiante a avanzado para alumnado de Grado Superior de DAM y ASIR: API de Claude, Claude Code, Skills, servidores MCP, automatización y ciberseguridad.</p>
        <div class="mt-6 grid sm:grid-cols-2 gap-3">
          <div class="rounded-xl bg-white border-2 border-jro-sage p-4"><div class="font-bold">DAM</div><div class="text-sm text-jro-mute">Java 21, Python, APIs, BBDD y servidores MCP de datos</div></div>
          <div class="rounded-xl bg-white border-2 border-jro-terra p-4"><div class="font-bold">ASIR</div><div class="text-sm text-jro-mute">Linux, Windows Server, Docker, redes y hardening</div></div>
        </div>
        <div class="mt-6 flex items-center gap-3 text-sm text-jro-mute">
          <span class="h-4 w-4 rounded-full bg-jro-gold"></span><span class="h-4 w-4 rounded-full bg-jro-sage"></span><span class="h-4 w-4 rounded-full bg-jro-terra"></span>
          <span>${HORAS_CURSO} horas · 12 sesiones · Proyecto final en parejas</span>
        </div>
      </section>

      <section class="bg-white rounded-2xl border border-jro-line shadow-sm">
        <div class="tabbar rounded-t-2xl flex justify-center gap-8 px-4" role="tablist">
          <button class="tab" role="tab" aria-selected="${t === "login"}" data-action="authtab" data-tab="login">Iniciar sesión</button>
          <button class="tab" role="tab" aria-selected="${t === "registro"}" data-action="authtab" data-tab="registro">Registro de alumnado</button>
        </div>
        <div class="p-6">${t === "login" ? formLogin() : formRegistro()}</div>
      </section>
    </main>
    ${pie()}
  </div>`;
}

function pie() {
  return `<footer class="text-center text-xs text-jro-mute py-6 px-4">${CENTRO} · Contacto: ${ADMIN_EMAIL} ·
    <button class="underline" data-action="privacidad">Política de privacidad</button> ·
    <a class="underline" href="#/verificar">Verificar un título</a></footer>`;
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
      <button data-action="demo" data-id="admin" class="rounded-lg border-2 border-jro-gold bg-white px-3 py-2 text-sm font-semibold">SuperAdmin<br><span class="text-xs font-normal text-jro-mute break-all">${ADMIN_EMAIL}</span></button>
      <button data-action="demo" data-id="demo-dam" class="rounded-lg border-2 border-jro-sage bg-white px-3 py-2 text-sm font-semibold">Alumno DAM<br><span class="text-xs font-normal text-jro-mute">2º DAM</span></button>
      <button data-action="demo" data-id="demo-asir" class="rounded-lg border-2 border-jro-terra bg-white px-3 py-2 text-sm font-semibold">Alumna ASIR<br><span class="text-xs font-normal text-jro-mute">2º ASIR</span></button>
    </div>
  </div>` : ""}`;
}

function camposPerfil() {
  return `
    <label class="block"><span class="text-sm font-medium">Código de acceso de aula <span class="text-jro-mute font-normal">(solo si no tienes correo ${DOMINIO})</span></span>
      <input name="codigo" maxlength="40" class="${INPUT}" placeholder="Te lo facilita el profesor"></label>
    <div class="grid grid-cols-2 gap-3">
      <label class="block"><span class="text-sm font-medium">Ciclo</span>
        <select name="ciclo" class="${INPUT}">
          <option value="">Selecciona…</option>
          <option value="DAM">Grado Superior DAM</option>
          <option value="ASIR">Grado Superior ASIR</option>
        </select></label>
      <label class="block"><span class="text-sm font-medium">Curso</span>
        <select name="curso" class="${INPUT}">
          <option value="">Selecciona…</option>
          <option value="1º">1º</option>
          <option value="2º">2º</option>
        </select></label>
    </div>`;
}

function bloqueLegal() {
  return `<div class="rounded-lg border border-jro-line overflow-hidden text-xs">
      <div class="bg-jro-cream px-3 py-2 font-semibold">Información básica sobre protección de datos</div>
      <table class="w-full">
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5 w-28">Responsable</th><td class="px-3 py-1.5">Centro de Formación Profesional José Ramón Otero. Contacto docente/admin: ${ADMIN_EMAIL}</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Finalidad</th><td class="px-3 py-1.5">Gestión académica, evaluación de laboratorios prácticos y expedición del Título Propio del Centro.</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Legitimación</th><td class="px-3 py-1.5">Relación educativa y consentimiento expreso (art. 6.1.a y 6.1.b RGPD). Alumnado de Grado Superior con capacidad para consentir (art. 7 LOPDGDD).</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Destinatarios</th><td class="px-3 py-1.5">No se ceden datos a terceros salvo obligación legal. Encargados del tratamiento: Google (Firebase, servidores en la UE), Netlify (alojamiento) y el correo del centro (Microsoft 365) para los avisos.</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Derechos</th><td class="px-3 py-1.5">Acceso, rectificación, supresión, oposición, limitación y portabilidad (ARSOPOL). Desde "Mi perfil" puedes exportar tus datos (JSON) y eliminar tu cuenta.</td></tr>
        <tr class="border-t border-jro-line"><th class="text-left align-top px-3 py-1.5">Más información</th><td class="px-3 py-1.5"><button type="button" class="underline font-medium" data-action="privacidad">Política de privacidad completa</button></td></tr>
      </table>
    </div>
    <label class="flex gap-2 items-start text-sm"><input type="checkbox" name="privacidad" class="mt-1 h-4 w-4 accent-[#efcd2f]">
      <span>He leído y acepto la Política de Privacidad y el tratamiento de mis datos académicos por el CFP José Ramón Otero.</span></label>
    <label class="flex gap-2 items-start text-sm"><input type="checkbox" name="iaAct" class="mt-1 h-4 w-4 accent-[#efcd2f]">
      <span><b>Compromiso de Seguridad y Normativa IA (EU AI Act):</b> Me comprometo a NO introducir datos personales (PII), contraseñas reales ni código/logs confidenciales sin anonimizar en los prompts o conexiones MCP con Claude.</span></label>`;
}

function formRegistro() {
  return `<form data-form="registro" class="space-y-4" novalidate>
    <label class="block"><span class="text-sm font-medium">Nombre y apellidos</span>
      <input name="nombre" required maxlength="80" autocomplete="name" class="${INPUT}"></label>
    <label class="block"><span class="text-sm font-medium">Correo institucional</span>
      <input name="email" type="email" required autocomplete="email" class="${INPUT}" placeholder="nombre${DOMINIO}"></label>
    ${camposPerfil()}
    <div class="grid grid-cols-2 gap-3">
      <label class="block"><span class="text-sm font-medium">Contraseña</span>
        <input name="password" type="password" required minlength="8" autocomplete="new-password" class="${INPUT}"></label>
      <label class="block"><span class="text-sm font-medium">Repetir contraseña</span>
        <input name="password2" type="password" required minlength="8" autocomplete="new-password" class="${INPUT}"></label>
    </div>
    ${bloqueLegal()}
    <div data-error class="hidden rounded-lg bg-jro-terra/30 border border-jro-terra px-3 py-2 text-sm"></div>
    <button class="btn-cta w-full rounded-lg py-2.5">Crear mi cuenta</button>
    ${DEMO_MODE ? "" : `<p class="text-xs text-jro-mute">Recibirás un correo para verificar tu dirección. El profesor responsable se registra aquí con su correo; ciclo y curso no se aplican a su cuenta.</p>`}
  </form>`;
}

function vistaCompletar() {
  return `<div class="min-h-screen flex flex-col">${cabeceraSimple()}
    <main class="flex-1 max-w-xl w-full mx-auto px-4 py-8">
      <section class="bg-white rounded-2xl border border-jro-line p-6">
        <h1 class="text-xl font-extrabold">Completa tu registro</h1>
        <p class="mt-1 text-sm text-jro-mute">Tu cuenta ${esc(AUTH.email)} no tiene perfil en el curso. Rellena estos datos para continuar.</p>
        ${AUTH.error ? `<div class="mt-3 rounded-lg bg-jro-terra/30 border border-jro-terra px-3 py-2 text-sm">${esc(AUTH.error)}</div>` : ""}
        <form data-form="completar" class="mt-4 space-y-4" novalidate>
          <label class="block"><span class="text-sm font-medium">Nombre y apellidos</span>
            <input name="nombre" required maxlength="80" class="${INPUT}"></label>
          ${camposPerfil()}
          ${bloqueLegal()}
          <div data-error class="hidden rounded-lg bg-jro-terra/30 border border-jro-terra px-3 py-2 text-sm"></div>
          <div class="flex flex-wrap gap-2">
            <button class="btn-cta rounded-lg px-5 py-2.5">Guardar y entrar</button>
            <button type="button" data-action="salir" class="rounded-lg px-4 py-2.5 text-sm border border-jro-line bg-white">Salir</button>
          </div>
        </form>
      </section>
    </main>${pie()}</div>`;
}

function vistaCambiarPassword() {
  return `<div class="min-h-screen flex flex-col">${cabeceraSimple()}
    <main class="flex-1 max-w-xl w-full mx-auto px-4 py-8">
      <section class="bg-white rounded-2xl border-2 border-jro-gold p-6">
        <h1 class="text-xl font-extrabold">Elige tu contraseña</h1>
        <p class="mt-2 text-sm">Has entrado con la contraseña inicial de <b>${esc(AUTH.email)}</b>. Por seguridad, cámbiala ahora: la inicial dejará de funcionar.</p>
        <form data-form="cambiopw" class="mt-4 space-y-3" novalidate>
          <label class="block text-sm"><span class="font-medium">Contraseña nueva</span>
            <input name="password" type="password" minlength="8" autocomplete="new-password" class="${INPUT}"></label>
          <label class="block text-sm"><span class="font-medium">Repetir contraseña</span>
            <input name="password2" type="password" minlength="8" autocomplete="new-password" class="${INPUT}"></label>
          <p class="text-xs text-jro-mute">Mínimo 8 caracteres, con letras y números.</p>
          <div data-error class="hidden rounded-lg bg-jro-terra/30 border border-jro-terra px-3 py-2 text-sm"></div>
          <div class="flex flex-wrap gap-2">
            <button class="btn-cta rounded-lg px-5 py-2.5 text-sm">Guardar contraseña</button>
            <button type="button" data-action="salir" class="rounded-lg px-4 py-2.5 text-sm border border-jro-line bg-white">Salir</button>
          </div>
        </form>
      </section>
    </main>${pie()}</div>`;
}

function vistaVerificarCorreo() {
  return `<div class="min-h-screen flex flex-col">${cabeceraSimple()}
    <main class="flex-1 max-w-xl w-full mx-auto px-4 py-8">
      <section class="bg-white rounded-2xl border-2 border-jro-gold p-6">
        <h1 class="text-xl font-extrabold">Verifica tu correo</h1>
        <p class="mt-2 text-sm">Hemos enviado un enlace de verificación a <b>${esc(AUTH.email)}</b>. La cuenta del profesor responsable se activa cuando el correo está verificado.</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button data-action="comprobarverif" class="btn-cta rounded-lg px-4 py-2 text-sm">Ya lo he verificado</button>
          <button data-action="reenviarverif" class="rounded-lg px-4 py-2 text-sm border border-jro-line bg-white">Reenviar correo</button>
          <button data-action="salir" class="rounded-lg px-4 py-2 text-sm border border-jro-line bg-white">Salir</button>
        </div>
      </section>
    </main>${pie()}</div>`;
}

function vistaVerificacion() {
  const r = UI.resultadoVerificar;
  let res = "";
  if (UI.codigoVerificar && r === undefined) res = `<p class="mt-4 text-sm text-jro-mute">Comprobando…</p>`;
  else if (r === null) res = `<div class="mt-4 rounded-lg border-2 border-jro-terra bg-white p-4 text-sm"><b>No válido.</b> No existe ningún título vigente con el código ${esc(UI.codigoVerificar)}.</div>`;
  else if (r) res = `<div class="mt-4 rounded-lg border-2 border-jro-gold bg-white p-4 text-sm space-y-1">
      <div class="font-bold text-base">Título válido</div>
      <div><b>${esc(r.nombre)}</b> · ${esc(r.curso)} Grado Superior ${esc(r.ciclo)} (${esc(CICLOS[r.ciclo] || "")})</div>
      <div>${esc(CURSO)}</div>
      <div>Expedido el ${fecha(r.emitidoEn)} · Código <span class="mono">${esc(r.codigo)}</span></div></div>`;
  return `<div class="min-h-screen flex flex-col">${cabeceraSimple()}
    <main class="flex-1 max-w-xl w-full mx-auto px-4 py-8">
      <section class="bg-white rounded-2xl border border-jro-line p-6">
        <h1 class="text-xl font-extrabold">Verificar un Título Propio</h1>
        <p class="mt-1 text-sm text-jro-mute">Introduce el código de verificación que aparece en el título.</p>
        <form data-form="verificar" class="mt-4 flex gap-2" novalidate>
          <input name="codigo" value="${esc(UI.codigoVerificar)}" placeholder="JRO-IA-2026-XXXXXX" class="${INPUT} mt-0 mono uppercase">
          <button class="btn-cta rounded-lg px-4 text-sm shrink-0">Verificar</button>
        </form>
        ${res}
      </section>
      <p class="mt-4 text-center text-sm"><a class="underline" href="${usuario() ? rutaSesion(UI.sesion) : "#/"}">Volver</a></p>
    </main>${pie()}</div>`;
}

/* Destino de los enlaces de los correos: confirmar el correo o elegir una contraseña nueva */
function vistaAccion() {
  const a = UI.accion || { estado: "comprobando" };
  const reset = a.modo === "resetPassword";
  let cuerpo;
  if (a.estado === "comprobando") cuerpo = `<p class="text-sm text-jro-mute">Comprobando el enlace…</p>`;
  else if (a.estado === "error") cuerpo = `<p class="text-sm">${esc(a.mensaje)}</p>
    <p class="mt-2 text-sm text-jro-mute">Los enlaces caducan y solo se pueden usar una vez. Si ya lo habías usado, inicia sesión con normalidad.</p>`;
  else if (a.estado === "form") cuerpo = `<p class="text-sm">Cuenta: <b>${esc(a.email)}</b></p>
    <form data-form="nuevapw" class="mt-4 space-y-3" novalidate>
      <label class="block text-sm"><span class="font-medium">Contraseña nueva</span>
        <input name="password" type="password" minlength="8" autocomplete="new-password" class="${INPUT}"></label>
      <label class="block text-sm"><span class="font-medium">Repetir contraseña</span>
        <input name="password2" type="password" minlength="8" autocomplete="new-password" class="${INPUT}"></label>
      <button class="btn-cta rounded-lg px-5 py-2.5 text-sm">Guardar contraseña</button>
    </form>`;
  else cuerpo = `<div class="rounded-lg bg-jro-gold/25 border border-jro-gold px-4 py-3 text-sm" role="status">${reset
    ? "Contraseña cambiada. Ya puedes entrar con la nueva."
    : "Correo confirmado. Tu cuenta está activada."}</div>`;
  const titulo = a.estado === "error" ? "Enlace no válido" : reset ? (a.estado === "hecho" ? "Contraseña cambiada" : "Nueva contraseña") : (a.estado === "hecho" ? "Correo confirmado" : "Confirmar correo");
  return `<div class="min-h-screen flex flex-col">${cabeceraSimple()}
    <main class="flex-1 max-w-xl w-full mx-auto px-4 py-8">
      <section class="bg-white rounded-2xl border border-jro-line p-6">
        <h1 class="text-xl font-extrabold mb-3">${titulo}</h1>
        ${cuerpo}
        ${a.estado === "hecho" || a.estado === "error" ? `<button data-action="irinicio" class="mt-5 btn-cta rounded-lg px-4 py-2 text-sm">Ir a la plataforma</button>` : ""}
      </section>
    </main>${pie()}</div>`;
}

let accionProcesada = false;
async function procesarAccion() {
  if (accionProcesada) return;
  accionProcesada = true;
  const p = new URLSearchParams(location.search);
  const modo = p.get("mode"), codigo = p.get("oobCode") || "";
  UI.accion = { estado: "comprobando", modo, codigo };
  render();
  try {
    if (modo === "resetPassword") UI.accion = { ...UI.accion, estado: "form", email: await backend.comprobarCodigoReset(codigo) };
    else if (modo === "verifyEmail") { await backend.aplicarVerificacion(codigo); UI.accion = { ...UI.accion, estado: "hecho" }; }
    else throw new Error("Este enlace no es válido.");
  } catch (e) {
    UI.accion = { ...UI.accion, estado: "error", mensaje: e.message };
  }
  render();
}

async function comprobarTitulo(codigo) {
  const espera = () => new Promise(r => { const t = setInterval(() => { if (backend) { clearInterval(t); r(); } }, 50); });
  await espera();
  try { UI.resultadoVerificar = await backend.verificarTitulo(codigo.trim().toUpperCase()); }
  catch (e) { UI.resultadoVerificar = null; toast(e.message); }
  render();
}

function modalPrivacidad() {
  abrirModal("Política de privacidad", `<div class="prose-jro text-sm">
    <p><b>Responsable del tratamiento:</b> Centro de Formación Profesional José Ramón Otero. Contacto para protección de datos y docencia: ${ADMIN_EMAIL}.</p>
    <p><b>Datos tratados:</b> nombre y apellidos, correo institucional, ciclo y curso, progreso en las sesiones, entregas de actividades (enlaces y comentarios), calificaciones y, en su caso, el Título Propio emitido.</p>
    <p><b>Finalidades:</b> (1) gestión académica del curso; (2) evaluación de las actividades prácticas y del proyecto final; (3) expedición y verificación del Título Propio del Centro.</p>
    <p><b>Legitimación:</b> ejecución de la relación educativa (art. 6.1.b RGPD) y consentimiento expreso (art. 6.1.a RGPD). El alumnado de Grado Superior tiene la edad necesaria para consentir por sí mismo (art. 7 LOPDGDD).</p>
    <p><b>Conservación:</b> durante el curso académico y el tiempo necesario para atender reclamaciones sobre la evaluación o verificar los títulos emitidos.</p>
    <p><b>Destinatarios y encargados:</b> no se ceden datos a terceros salvo obligación legal. Encargados del tratamiento: Google (Firebase Authentication y Cloud Firestore, datos en la Unión Europea), Netlify (alojamiento de la web y de la función que envía los correos) y el proveedor de correo del centro (Microsoft 365), desde cuyo buzón salen los correos de la cuenta y los avisos de entregas, notas y títulos. La web no carga fuentes ni scripts de terceros.</p>
    <p><b>Verificación de títulos:</b> quien disponga del código de verificación de un título puede comprobar su validez, viendo el nombre, el ciclo y la fecha de expedición.</p>
    <p><b>Uso de IA:</b> esta plataforma no envía tus datos a Claude ni a ningún proveedor de IA. El uso de Claude en las prácticas lo haces tú, con tu cuenta, y te comprometes a no incluir datos personales ni secretos (compromiso EU AI Act).</p>
    <p><b>Derechos:</b> acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad. Puedes ejercerlos escribiendo a ${ADMIN_EMAIL}, y los de acceso/portabilidad y supresión directamente desde "Mi perfil". Si consideras que no se han atendido, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
    ${DEMO_MODE ? `<p><b>Modo demostración:</b> en esta versión los datos se guardan únicamente en el almacenamiento local de este navegador.</p>` : ""}
  </div>`);
}

/* =====================================================================
   VISTA: CURSO
   ===================================================================== */
function vistaCurso() {
  const u = usuario();
  const s = SESIONES.find(x => x.n === UI.sesion);
  return `${header()}
  <div class="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[290px_1fr] gap-6">
    <aside class="no-print">${sidebar(u)}</aside>
    <main class="min-w-0">${cabeceraSesion(s, u)}${barraTabs()}<div class="pt-6" role="tabpanel">${contenidoTab(s, u)}</div>
      ${navegacionSesiones(s)}</main>
  </div>`;
}

function navegacionSesiones(s) {
  const ant = SESIONES.find(x => x.n === s.n - 1), sig = SESIONES.find(x => x.n === s.n + 1);
  return `<div class="mt-8 flex justify-between gap-3 text-sm">
    ${ant ? `<button data-action="ir" data-hash="${rutaSesion(ant.n)}" class="rounded-lg bg-white border border-jro-line px-4 py-2">← Sesión ${ant.n}</button>` : "<span></span>"}
    ${sig ? `<button data-action="ir" data-hash="${rutaSesion(sig.n)}" class="rounded-lg bg-white border border-jro-line px-4 py-2">Sesión ${sig.n} →</button>` : ""}
  </div>`;
}

function sidebar(u) {
  const total = SESIONES.length;
  const hechas = u.role === "alumno" ? completadas(u.id) : null;
  const pct = hechas !== null ? Math.round(hechas / total * 100) : 0;
  let html = "";
  if (hechas !== null) {
    const d = diplomaDe(u.id);
    html += `<div class="bg-white rounded-xl border border-jro-line p-4 mb-4">
      <div class="flex justify-between text-sm"><span class="font-semibold">Tu progreso</span><span>${hechas}/${total}</span></div>
      <div class="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden"><div class="h-full bg-jro-gold" style="width:${pct}%"></div></div>
      ${d ? `<button data-action="ir" data-hash="#/titulo/${esc(d.id)}" class="mt-3 w-full btn-cta rounded-lg py-1.5 text-sm">Ver mi Título Propio</button>` : ""}
    </div>`;
  }
  html += `<label class="lg:hidden block mb-2"><span class="sr-only">Sesión</span>
    <select data-action="selsesion" class="w-full rounded-lg border border-jro-line bg-white px-3 py-2 font-medium">
      ${SESIONES.map(x => `<option value="${x.n}" ${x.n === UI.sesion ? "selected" : ""}>Sesión ${x.n} · ${esc(x.titulo)}</option>`).join("")}
    </select></label>`;
  html += `<nav class="hidden lg:block bg-white rounded-xl border border-jro-line overflow-hidden" aria-label="Sesiones">`;
  for (const b of [1, 2, 3, 4]) {
    html += `<div class="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-jro-mute">Bloque ${b} · ${esc(BLOQUES[b])}</div>`;
    for (const x of SESIONES.filter(y => y.bloque === b)) {
      const activa = x.n === UI.sesion;
      let estado = "";
      if (u.role === "alumno") {
        const e = entrega(u.id, x.n);
        if (e?.estado === "aprobada") estado = `<span title="Actividad aprobada" class="block h-2.5 w-2.5 rounded-full bg-jro-gold"></span>`;
        else if (DB.progress[u.id]?.[x.n]) estado = `<span title="Completada" class="text-xs font-bold text-[#5f8f7a]">✓</span>`;
        else if (e) estado = `<span title="Entregada" class="block h-2.5 w-2.5 rounded-full border-2 border-jro-gold"></span>`;
      }
      html += `<button data-action="ir" data-hash="${rutaSesion(x.n)}" ${activa ? 'aria-current="page"' : ""} class="w-full text-left px-4 py-2.5 flex items-start gap-3 border-l-4 ${activa ? "border-jro-gold bg-jro-cream" : "border-transparent hover:bg-jro-cream"}">
        <span class="shrink-0 mt-0.5 text-xs font-bold ${activa ? "text-jro-ink" : "text-jro-mute"}">S${x.n}</span>
        <span class="flex-1 text-sm ${activa ? "font-semibold" : ""}">Sesión ${x.n}<span class="block text-xs text-jro-mute font-normal leading-snug">${esc(x.titulo)}</span></span>
        <span class="shrink-0 mt-1">${estado}</span>
      </button>`;
    }
  }
  html += `<div class="h-3"></div></nav>`;
  return html;
}

function cabeceraSesion(s, u) {
  const hecha = u.role === "alumno" && DB.progress[u.id]?.[s.n];
  return `<div class="bg-white rounded-t-2xl border border-jro-line border-b-0 p-5 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <span class="rounded-full bg-jro-ink text-white px-2.5 py-0.5 font-semibold">Sesión ${s.n}</span>
      <span class="text-jro-mute">Bloque ${s.bloque} · ${esc(BLOQUES[s.bloque])}</span>
    </div>
    <h1 class="mt-2 text-2xl sm:text-3xl font-extrabold leading-tight">${esc(s.titulo)}</h1>
    <p class="mt-2 text-jro-mute">${esc(s.resumen)}</p>
    <div class="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
      <div class="rounded-lg bg-jro-cream px-3 py-2"><span class="font-semibold">Skill / entregable:</span> ${esc(s.skill)}</div>
      <div class="rounded-lg bg-jro-cream px-3 py-2"><span class="font-semibold">Conexión MCP:</span> ${esc(s.mcp)}</div>
    </div>
    ${u.role === "alumno" ? `<div class="mt-4 flex flex-wrap gap-2">
      <button data-action="completar" data-n="${s.n}" class="${hecha ? "bg-white border-2 border-jro-sage" : "btn-cta"} rounded-lg px-4 py-2 text-sm font-semibold">${hecha ? "✓ Sesión completada (desmarcar)" : "Marcar sesión como completada"}</button>
    </div>` : ""}
  </div>`;
}

function barraTabs() {
  return `<div class="tabbar sticky top-16 z-20 border-x border-jro-line no-print">
    <div class="flex justify-start md:justify-center gap-6 sm:gap-8 px-4 overflow-x-auto no-scrollbar" role="tablist" aria-label="Secciones de la sesión">
      ${TABS.map(t => `<button class="tab" role="tab" aria-selected="${UI.tab === t.id}" tabindex="${UI.tab === t.id ? 0 : -1}" data-action="ir" data-hash="${rutaSesion(UI.sesion, t.id)}" data-tab="${t.id}">${t.label}</button>`).join("")}
    </div>
  </div>`;
}

function contenidoTab(s, u) {
  switch (UI.tab) {
    case "teoria": return tabTeoria(s);
    case "taller": return tabTaller(s);
    case "prompts": return tabPrompts(s);
    case "actividad": return tabActividad(s, u);
    case "faq": return tabFaq(s);
  }
  return "";
}

function tabTeoria(s) {
  return `<div class="space-y-4">${s.teoria.map(t => `
    <article class="bg-white rounded-xl border border-jro-line p-5">
      <h2 class="text-lg font-bold">${esc(t.h)}</h2>
      <div class="prose-jro mt-1 text-[15px]">${t.html}</div>
    </article>`).join("")}</div>`;
}

function tabTaller(s) {
  return `<ol class="space-y-4">${s.taller.map(p => `
    <li class="bg-white rounded-xl border border-jro-line p-5">
      <h2 class="font-bold">${esc(p.t)}</h2>
      <p class="text-sm text-jro-mute mt-1">${esc(p.d)}</p>
      ${codeBlock(p.lang, p.code)}
    </li>`).join("")}</ol>`;
}

function tabPrompts(s) {
  return `<div class="grid md:grid-cols-2 gap-4">${s.prompts.map(p => {
    const id = "p" + nid();
    return `<article class="bg-white rounded-xl border border-jro-line p-5 flex flex-col">
      <div class="flex items-start justify-between gap-3">
        <div><span class="inline-flex rounded-full border border-jro-gold px-2 py-0.5 text-[11px] font-semibold">${esc(p.tipo)}</span>
        <h2 class="mt-2 font-bold">${esc(p.t)}</h2></div>
        <button class="btn-cta shrink-0 rounded-lg px-3 py-1.5 text-sm" data-action="copiar" data-target="${id}">Copiar</button>
      </div>
      <pre id="${id}" class="mt-3 flex-1 rounded-lg bg-jro-cream border border-jro-line p-3 text-[12.5px] leading-relaxed whitespace-pre-wrap mono">${esc(p.txt)}</pre>
    </article>`;
  }).join("")}</div>`;
}

function bloqueActividad(tipo, a, esMio) {
  const cls = { dam: "border-jro-sage", asir: "border-jro-terra" }[tipo];
  const head = { dam: "dam-head", asir: "asir-head" }[tipo];
  const titulo = { dam: "Bloque DAM · Desarrollo de Aplicaciones Multiplataforma", asir: "Bloque ASIR · Administración de Sistemas Informáticos en Red" }[tipo];
  return `<section class="bg-white rounded-xl border-2 ${cls} overflow-hidden">
    <div class="${head} px-5 py-2.5 flex items-center justify-between gap-2">
      <span class="text-sm font-bold text-jro-ink">${titulo}</span>
      ${esMio ? `<span class="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold shrink-0">Tu ciclo</span>` : ""}
    </div>
    <div class="p-5">
      <h3 class="font-bold text-lg">${esc(a.t)}</h3>
      <p class="mt-1 text-[15px] leading-relaxed">${esc(a.d)}</p>
      <div class="mt-3 text-sm font-semibold">Entregables</div>
      <ul class="mt-1 list-disc pl-5 text-sm space-y-1">${a.entregables.map(e => `<li>${esc(e)}</li>`).join("")}</ul>
    </div>
  </section>`;
}

function formularioEntrega(s, u) {
  const e = entrega(u.id, s.n);
  const bloqueada = e?.estado === "aprobada";
  return `<div class="mt-5 rounded-lg bg-white/85 border border-jro-line p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h4 class="font-bold">Formulario de entrega para evaluación docente</h4>
      ${badgeEstado(e?.estado)}
    </div>
    ${e ? `<p class="text-xs text-jro-mute mt-1">Última entrega: ${fechaHora(e.ts)}</p>` : ""}
    ${e?.revisadoEn ? `<div class="mt-3 rounded-lg ${e.estado === "aprobada" ? "bg-jro-gold/25 border border-jro-gold" : "bg-jro-terra/25 border border-jro-terra"} px-3 py-2 text-sm">
      <div class="font-semibold">Evaluación del profesor${typeof e.nota === "number" ? ` · Nota: ${e.nota}/10` : ""}</div>
      <div class="mt-1 whitespace-pre-wrap">${esc(e.feedback || "Sin comentarios.")}</div></div>` : ""}
    ${bloqueada ? `<p class="mt-3 text-sm">Actividad aprobada. ¡Buen trabajo!</p>`
    : !verificado() ? `<p class="mt-3 text-sm">Verifica tu correo para poder entregar (aviso en la parte superior).</p>` : `
    <form data-form="entrega" data-n="${s.n}" class="mt-3 grid gap-3" novalidate>
      <label class="block text-sm"><span class="font-medium">Enlace al repositorio o documento (https://…)</span>
        <input name="enlace" maxlength="500" class="${INPUT}" value="${esc(e?.enlace || "")}" placeholder="https://github.com/usuario/repositorio"></label>
      <label class="block text-sm"><span class="font-medium">Compañero/a del otro ciclo (bloque de sincronización)</span>
        <input name="pareja" maxlength="80" class="${INPUT}" value="${esc(e?.pareja || "")}" placeholder="Nombre y ciclo"></label>
      <label class="block text-sm"><span class="font-medium">Resumen de lo realizado</span>
        <textarea name="comentario" rows="4" maxlength="3000" class="${INPUT}">${esc(e?.comentario || "")}</textarea></label>
      <label class="flex gap-2 items-start text-sm"><input type="checkbox" name="limpio" class="mt-1 h-4 w-4 accent-[#efcd2f]">
        <span>Confirmo que la entrega no contiene datos personales, contraseñas reales ni logs sin anonimizar.</span></label>
      <div><button class="btn-cta rounded-lg px-5 py-2 text-sm">${e ? "Actualizar entrega" : "Enviar entrega"}</button></div>
    </form>`}
  </div>`;
}

function tabActividad(s, u) {
  const a = s.actividad;
  let form;
  if (u.role === "alumno") form = formularioEntrega(s, u);
  else {
    const lista = DB.submissions.filter(x => x.sesion === s.n);
    form = `<div class="mt-5 rounded-lg bg-white/85 border border-jro-line p-4">
      <h4 class="font-bold">Entregas de esta sesión</h4>
      <p class="text-sm mt-1">${lista.length} entregas · ${lista.filter(x => x.estado === "pendiente").length} pendientes de revisión.</p>
      <button data-action="ir" data-hash="#/admin/entregas" class="mt-3 btn-cta rounded-lg px-4 py-2 text-sm">Corregir en el Panel docente</button>
    </div>`;
  }
  return `<div class="space-y-5">
    <div class="grid xl:grid-cols-2 gap-5">
      ${bloqueActividad("dam", a.dam, u.ciclo === "DAM")}
      ${bloqueActividad("asir", a.asir, u.ciclo === "ASIR")}
    </div>
    <section class="sync-card rounded-xl overflow-hidden">
      <div class="sync-head px-5 py-2.5 text-sm font-bold text-jro-ink">Bloque Sincronización DAM + ASIR</div>
      <div class="p-5">
        <h3 class="font-bold text-lg">${esc(a.sync.t)}</h3>
        <p class="mt-1 text-[15px] leading-relaxed">${esc(a.sync.d)}</p>
        <div class="mt-3 text-sm font-semibold">Entregables</div>
        <ul class="mt-1 list-disc pl-5 text-sm space-y-1">${a.sync.entregables.map(e => `<li>${esc(e)}</li>`).join("")}</ul>
        ${form}
      </div>
    </section>
  </div>`;
}

function tabFaq(s) {
  return `<div class="space-y-3">${s.faq.map(f => `
    <details class="group bg-white rounded-xl border border-jro-line">
      <summary class="cursor-pointer list-none px-5 py-4 font-semibold flex items-center justify-between gap-3">
        <span>${esc(f.q)}</span><span class="text-jro-mute group-open:rotate-45 transition text-xl leading-none">+</span>
      </summary>
      <div class="px-5 pb-4 prose-jro text-[15px]">${f.a}</div>
    </details>`).join("")}</div>`;
}

/* =====================================================================
   VISTA: PERFIL (derechos ARSOPOL)
   ===================================================================== */
function vistaPerfil() {
  const u = usuario();
  const d = diplomaDe(u.id);
  const media = notaMediaDe(u.id);
  const fila = (k, v) => `<tr class="border-t border-jro-line first:border-t-0"><th class="text-left px-4 py-2 w-44 font-medium text-jro-mute align-top">${k}</th><td class="px-4 py-2">${v}</td></tr>`;
  return `${header()}
  <main class="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <h1 class="text-2xl font-extrabold">Mi perfil</h1>
    <section class="bg-white rounded-xl border border-jro-line overflow-x-auto">
      <table class="w-full text-sm">
        ${fila("Nombre", esc(u.nombre))}
        ${fila("Correo", `${esc(u.email)}${verificado() ? "" : ` <span class="text-xs">(sin verificar)</span>`}`)}
        ${fila("Rol", u.role === "admin" ? "Superadministrador · Profesor responsable" : "Alumno/a")}
        ${u.role === "alumno" ? fila("Ciclo y curso", `${badgeCiclo(u.ciclo)} ${esc(u.curso)} · ${esc(CICLOS[u.ciclo])}`) : fila("Cargo", "Docente y Tutor en FP José Ramón Otero")}
        ${fila("Alta", fecha(u.createdAt))}
        ${fila("Consentimientos", `Privacidad: ${fechaHora(u.consents?.privacidad)}<br>Compromiso EU AI Act: ${fechaHora(u.consents?.iaAct)}`)}
        ${u.role === "alumno" ? fila("Progreso", `${completadas(u.id)}/12 sesiones · ${aprobadas(u.id).length} actividades aprobadas${media !== null ? ` · nota media ${media}` : ""}`) : ""}
      </table>
    </section>

    ${u.role === "alumno" ? `<section class="bg-white rounded-xl border-2 ${d ? "border-jro-gold" : "border-jro-line"} p-5">
      <h2 class="font-bold text-lg">Título Propio del Centro</h2>
      ${d ? `<p class="mt-1 text-sm">Emitido el ${fecha(d.emitidoEn)} · Código de verificación <span class="mono font-semibold">${esc(d.codigo)}</span></p>
        <button data-action="ir" data-hash="#/titulo/${esc(d.id)}" class="mt-3 btn-cta rounded-lg px-4 py-2 text-sm">Ver, imprimir o guardar en PDF</button>`
      : `<p class="mt-1 text-sm text-jro-mute">Se emite cuando el profesor valida tu Proyecto Final Integrador (Sesión 12). Estado actual de la Sesión 12: ${badgeEstado(entrega(u.id, 12)?.estado)}</p>`}
    </section>` : ""}

    <section class="bg-white rounded-xl border border-jro-line p-5">
      <h2 class="font-bold text-lg">Mis derechos sobre mis datos (RGPD / LOPDGDD)</h2>
      <p class="mt-1 text-sm text-jro-mute">Acceso y portabilidad: descarga todos tus datos en JSON. Supresión: elimina tu cuenta y todo lo asociado. Para rectificación, oposición o limitación escribe a ${ADMIN_EMAIL}.</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button data-action="exportar" class="btn-cta rounded-lg px-4 py-2 text-sm">Exportar datos personales (JSON)</button>
        ${u.role === "alumno" ? `<button data-action="eliminar" class="rounded-lg px-4 py-2 text-sm font-semibold border-2 border-jro-terra bg-white">Eliminar cuenta (derecho de supresión)</button>` : `<span class="text-xs text-jro-mute self-center">La cuenta de superadministración no puede eliminarse desde aquí.</span>`}
        <button data-action="privacidad" class="rounded-lg px-4 py-2 text-sm border border-jro-line bg-white">Política de privacidad</button>
      </div>
    </section>
  </main>`;
}

function exportarDatos() {
  const u = usuario();
  const { pwHash, salt, progreso, ...perfil } = u;
  const datos = {
    exportadoEn: new Date().toISOString(),
    responsable: "Centro de Formación Profesional José Ramón Otero (" + ADMIN_EMAIL + ")",
    perfil,
    progreso: DB.progress[u.id] || {},
    entregas: DB.submissions.filter(s => s.userId === u.id),
    titulos: DB.diplomas.filter(d => d.userId === u.id)
  };
  descargar(`mis-datos-${u.email}.json`, JSON.stringify(datos, null, 2));
}

/* =====================================================================
   VISTA: PANEL DOCENTE
   ===================================================================== */
function vistaAdmin() {
  const tabs = [["seguimiento", "Seguimiento"], ["entregas", "Entregas"], ["titulos", "Títulos"], ["usuarios", "Usuarios y acceso"]];
  const pend = DB.submissions.filter(s => s.estado === "pendiente").length;
  return `${header()}
  <main class="max-w-7xl mx-auto px-4 py-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div><h1 class="text-2xl font-extrabold">Panel docente</h1>
      <p class="text-sm text-jro-mute">${esc(ADMIN_NOMBRE)} · Docente y Tutor en FP José Ramón Otero</p></div>
      <div class="flex gap-2 text-sm">
        <span class="rounded-lg bg-white border border-jro-line px-3 py-1.5">${alumnos().length} alumnos</span>
        <span class="rounded-lg bg-white border border-jro-gold px-3 py-1.5">${pend} entregas pendientes</span>
      </div>
    </div>
    <div class="tabbar mt-5 rounded-t-xl border border-jro-line">
      <div class="flex justify-start md:justify-center gap-8 px-4 overflow-x-auto no-scrollbar" role="tablist">
        ${tabs.map(([id, l]) => `<button class="tab" role="tab" aria-selected="${UI.adminTab === id}" data-action="ir" data-hash="#/admin/${id}">${l}${id === "entregas" && pend ? ` (${pend})` : ""}</button>`).join("")}
      </div>
    </div>
    <div class="bg-white border border-t-0 border-jro-line rounded-b-xl p-4 sm:p-5">
      ${{ seguimiento: adminSeguimiento, entregas: adminEntregas, titulos: adminTitulos, usuarios: adminUsuarios }[UI.adminTab]()}
    </div>
  </main>`;
}

function filtroCicloHTML() {
  return `<div class="flex flex-wrap gap-2 mb-4">${["todos", "DAM", "ASIR"].map(c =>
    `<button data-action="filtrociclo" data-c="${c}" class="rounded-full px-3 py-1 text-sm border ${UI.filtroCiclo === c ? "bg-jro-ink text-white border-jro-ink" : "bg-white border-jro-line"}">${c === "todos" ? "Todos" : c}</button>`).join("")}</div>`;
}

const alumnosFiltrados = () => alumnos()
  .filter(a => UI.filtroCiclo === "todos" || a.ciclo === UI.filtroCiclo)
  .sort((x, y) => x.nombre.localeCompare(y.nombre, "es"));

function adminSeguimiento() {
  const lista = alumnosFiltrados();
  const csv = lista.length ? `<button data-action="csv" class="mb-4 rounded-lg border border-jro-line bg-white px-3 py-1.5 text-sm">Descargar CSV de seguimiento</button>` : "";
  if (!lista.length) return filtroCicloHTML() + `<p class="text-sm text-jro-mute">No hay alumnos registrados en este filtro.</p>`;
  return filtroCicloHTML() + csv + `<div class="overflow-x-auto"><table class="w-full text-sm">
    <thead><tr class="text-left text-jro-mute"><th class="py-2 pr-3">Alumno/a</th><th class="py-2 pr-3">Ciclo</th><th class="py-2 pr-3">Progreso</th><th class="py-2 pr-3">Entregas</th><th class="py-2 pr-3">Media</th><th class="py-2">Título</th></tr></thead>
    <tbody>${lista.map(a => {
      const pct = Math.round(completadas(a.id) / 12 * 100);
      const ent = DB.submissions.filter(s => s.userId === a.id);
      return `<tr class="border-t border-jro-line align-top">
        <td class="py-2 pr-3"><div class="font-semibold">${esc(a.nombre)}</div><div class="text-xs text-jro-mute">${esc(a.email)}</div></td>
        <td class="py-2 pr-3 whitespace-nowrap">${badgeCiclo(a.ciclo)} <span class="text-xs">${esc(a.curso)}</span></td>
        <td class="py-2 pr-3 min-w-[140px]"><div class="text-xs">${completadas(a.id)}/12</div><div class="h-1.5 rounded-full bg-gray-100 mt-1"><div class="h-full rounded-full bg-jro-gold" style="width:${pct}%"></div></div></td>
        <td class="py-2 pr-3 text-xs">${ent.length} enviadas<br>${aprobadas(a.id).length} aprobadas</td>
        <td class="py-2 pr-3">${notaMediaDe(a.id) ?? "—"}</td>
        <td class="py-2">${diplomaDe(a.id) ? `<span class="rounded-full bg-jro-gold px-2 py-0.5 text-xs font-semibold">Emitido</span>` : apto(a.id) ? `<span class="text-xs font-semibold">Apto para emitir</span>` : `<span class="text-xs text-jro-mute">—</span>`}</td>
      </tr>`;
    }).join("")}</tbody></table></div>`;
}

function exportarCSV() {
  const celda = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const filas = [["Nombre", "Correo", "Ciclo", "Curso", "Sesiones completadas", "Entregas aprobadas", "Nota media", "Título"]];
  for (const a of alumnosFiltrados()) filas.push([a.nombre, a.email, a.ciclo, a.curso, completadas(a.id), aprobadas(a.id).length, notaMediaDe(a.id) ?? "", diplomaDe(a.id)?.codigo || ""]);
  descargar("seguimiento-curso-claude.csv", "﻿" + filas.map(f => f.map(celda).join(";")).join("\n"), "text/csv;charset=utf-8");
}

function adminEntregas() {
  const estados = [["pendiente", "Pendientes"], ["revision", "Con cambios solicitados"], ["aprobada", "Aprobadas"], ["todas", "Todas"]];
  const lista = DB.submissions
    .filter(s => UI.filtroEstado === "todas" || s.estado === UI.filtroEstado)
    .filter(s => UI.filtroCiclo === "todos" || s.ciclo === UI.filtroCiclo)
    .sort((x, y) => String(y.ts).localeCompare(String(x.ts)));
  return `<div class="flex flex-wrap gap-2 mb-3">${estados.map(([e, l]) =>
      `<button data-action="filtroestado" data-e="${e}" class="rounded-full px-3 py-1 text-sm border ${UI.filtroEstado === e ? "bg-jro-gold border-jro-gold font-semibold" : "bg-white border-jro-line"}">${l}</button>`).join("")}</div>
    ${filtroCicloHTML()}
    ${!lista.length ? `<p class="text-sm text-jro-mute">No hay entregas en este filtro.</p>` : `<div class="grid gap-4">${lista.map(s => {
      const ses = SESIONES.find(x => x.n === s.sesion);
      const dam = s.ciclo === "DAM";
      return `<article class="rounded-xl border-2 ${dam ? "border-jro-sage" : "border-jro-terra"} overflow-hidden">
        <div class="${dam ? "dam-head" : "asir-head"} px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span class="font-bold">${esc(s.nombre)} · ${esc(s.ciclo)} ${esc(s.curso)}</span>
          <span>Sesión ${s.sesion} · ${fechaHora(s.ts)}</span>
        </div>
        <div class="p-4 grid md:grid-cols-2 gap-4">
          <div class="text-sm space-y-2 min-w-0">
            <div class="font-semibold">${esc(ses?.actividad.sync.t || "")}</div>
            <div><span class="text-jro-mute">Enlace:</span> ${esURL(s.enlace) ? `<a class="underline break-all" href="${esc(s.enlace)}" target="_blank" rel="noopener noreferrer">${esc(s.enlace)}</a>` : esc(s.enlace || "—")}</div>
            <div><span class="text-jro-mute">Pareja:</span> ${esc(s.pareja || "—")}</div>
            <div class="whitespace-pre-wrap break-words rounded-lg bg-jro-cream p-3">${esc(s.comentario || "Sin comentario.")}</div>
            <div>${badgeEstado(s.estado)}</div>
          </div>
          <form data-form="evaluar" data-id="${esc(s.id)}" class="text-sm grid gap-2" novalidate>
            <label><span class="font-medium">Nota (0-10)</span>
              <input name="nota" type="number" min="0" max="10" step="0.1" value="${typeof s.nota === "number" ? s.nota : ""}" class="${INPUT}"></label>
            <label><span class="font-medium">Comentarios para el alumno</span>
              <textarea name="feedback" rows="4" maxlength="3000" class="${INPUT}">${esc(s.feedback || "")}</textarea></label>
            <div class="flex flex-wrap gap-2">
              <button name="decision" value="aprobada" class="btn-cta rounded-lg px-4 py-2">Aprobar</button>
              <button name="decision" value="revision" class="rounded-lg px-4 py-2 font-semibold border-2 border-jro-terra bg-white">Solicitar cambios</button>
            </div>
          </form>
        </div>
      </article>`;
    }).join("")}</div>`}`;
}

function adminTitulos() {
  const lista = alumnosFiltrados();
  return filtroCicloHTML() + `<p class="text-sm text-jro-mute mb-4">Requisito: Proyecto Final Integrador (Sesión 12) aprobado. La emisión queda firmada por ${esc(ADMIN_NOMBRE)} con fecha y código de verificación público.</p>
  ${!lista.length ? `<p class="text-sm text-jro-mute">No hay alumnos.</p>` : `<div class="grid md:grid-cols-2 gap-3">${lista.map(a => {
    const d = diplomaDe(a.id);
    return `<div class="rounded-xl border ${d ? "border-jro-gold border-2" : "border-jro-line"} p-4 flex items-center justify-between gap-3">
      <div class="min-w-0"><div class="font-semibold truncate">${esc(a.nombre)}</div>
        <div class="text-xs text-jro-mute">${esc(a.ciclo)} ${esc(a.curso)} · media ${notaMediaDe(a.id) ?? "—"} · S12: ${esc(entrega(a.id, 12)?.estado || "sin entregar")}</div>
        ${d ? `<div class="text-xs mono mt-1">${esc(d.codigo)}</div>` : ""}</div>
      <div class="flex flex-col gap-1 shrink-0">
        ${d ? `<button data-action="ir" data-hash="#/titulo/${esc(d.id)}" class="btn-cta rounded-lg px-3 py-1.5 text-sm">Ver título</button>
               <button data-action="revocar" data-id="${esc(d.id)}" class="rounded-lg px-3 py-1 text-xs border border-jro-terra bg-white">Revocar</button>`
           : `<button data-action="emitir" data-id="${esc(a.id)}" class="btn-cta rounded-lg px-3 py-1.5 text-sm" ${apto(a.id) ? "" : "disabled title='Falta aprobar la Sesión 12'"}>Emitir y firmar título</button>`}
      </div>
    </div>`;
  }).join("")}</div>`}`;
}

function estadoCuenta(u) {
  if (u.role === "admin") return "";
  if (DEMO_MODE || u.correoVerificado) return `<span class="text-xs">Correo verificado</span>`;
  if (DB.aprobaciones?.[u.id]?.aprobado) return `<span class="text-xs">Activada por el profesor</span>`;
  return `<span class="text-xs font-semibold text-[#9a4a26]">Pendiente de verificar</span>`;
}

function seccionCorreo() {
  if (UI.estadoCorreo === undefined) {
    UI.estadoCorreo = null;
    backend.estadoCorreo().then((r) => { UI.estadoCorreo = r; render(); }).catch(() => { UI.estadoCorreo = { configured: false, problems: ["No se ha podido consultar."] }; render(); });
  }
  const c = UI.estadoCorreo;
  return `<section class="rounded-xl border ${c?.configured ? "border-jro-sage" : "border-jro-terra"} p-4 mb-6">
    <h2 class="font-bold">Correo del centro</h2>
    ${!c ? `<p class="text-sm text-jro-mute mt-1">Comprobando…</p>`
      : c.configured ? `<p class="text-sm mt-1">Activo: los correos de la cuenta y los avisos (entregas, notas, títulos y altas) salen desde <b>${esc(c.from)}</b>${c.provider ? ` (${esc(c.provider)})` : ""}.</p>`
      : `<p class="text-sm mt-1">No configurado: la verificación y el cambio de contraseña los envía Firebase (noreply@…firebaseapp.com, que el correo del centro puede bloquear) y no se envían avisos.</p>
        ${c.problems?.length ? `<ul class="mt-2 list-disc pl-5 text-sm">${c.problems.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        ${c.hint ? `<p class="mt-2 text-xs text-jro-mute">${esc(c.hint)}</p>` : ""}`}
  </section>`;
}

function seccionAltas() {
  if (DEMO_MODE) return "";
  const pendientes = alumnos().filter(u => !u.correoVerificado && !DB.aprobaciones?.[u.id]?.aprobado);
  return `<section class="rounded-xl border-2 ${pendientes.length ? "border-jro-terra" : "border-jro-line"} p-4 mb-6">
    <h2 class="font-bold">Altas pendientes de verificar (${pendientes.length})</h2>
    <p class="text-sm text-jro-mute mt-1">Si a un alumno no le llega el correo de verificación, actívale la cuenta aquí. Activa solo a personas que conozcas: la activación sustituye a la verificación por correo.</p>
    ${pendientes.length ? `<ul class="mt-3 divide-y divide-jro-line">${pendientes.map(u => `<li class="py-2 flex flex-wrap items-center justify-between gap-2">
      <span><b>${esc(u.nombre)}</b> · ${esc(u.email)} · ${esc(u.ciclo)} ${esc(u.curso)} · alta ${fecha(u.createdAt)}</span>
      <button data-action="aprobar" data-id="${esc(u.id)}" class="btn-cta rounded-lg px-3 py-1.5 text-sm">Activar cuenta</button></li>`).join("")}</ul>` : ""}
  </section>`;
}

function adminUsuarios() {
  const codigo = DB.config?.codigoAula || "";
  return `${seccionCorreo()}${seccionAltas()}<section class="rounded-xl border-2 border-jro-gold p-4 mb-6">
      <h2 class="font-bold">Código de acceso de aula</h2>
      <p class="text-sm text-jro-mute mt-1">Permite registrarse a quien no tenga correo ${DOMINIO}. ${codigo ? "" : "Ahora mismo no hay código: solo pueden registrarse correos institucionales."}</p>
      <form data-form="codigoaula" class="mt-3 flex flex-wrap gap-2" novalidate>
        <input name="codigo" value="${esc(codigo)}" minlength="6" maxlength="40" placeholder="p. ej. JRO-IA-2026-B" class="${INPUT} mt-0 max-w-xs mono">
        <button class="btn-cta rounded-lg px-4 py-2 text-sm">Guardar código</button>
      </form>
    </section>
    <div class="overflow-x-auto"><table class="w-full text-sm">
    <thead><tr class="text-left text-jro-mute"><th class="py-2 pr-3">Usuario</th><th class="py-2 pr-3">Rol</th><th class="py-2 pr-3">Alta</th><th class="py-2 pr-3">Cuenta</th><th class="py-2">Acciones</th></tr></thead>
    <tbody>${DB.users.map(u => `<tr class="border-t border-jro-line">
      <td class="py-2 pr-3"><div class="font-semibold">${esc(u.nombre)}</div><div class="text-xs text-jro-mute">${esc(u.email)}</div></td>
      <td class="py-2 pr-3 whitespace-nowrap">${u.role === "admin" ? "Superadmin" : `${badgeCiclo(u.ciclo)} ${esc(u.curso)}`}</td>
      <td class="py-2 pr-3 text-xs">${fecha(u.createdAt)}</td>
      <td class="py-2 pr-3 whitespace-nowrap">${estadoCuenta(u)}</td>
      <td class="py-2">${u.role === "admin" ? "—" : `<div class="flex flex-wrap gap-1">
        ${!DEMO_MODE && DB.aprobaciones?.[u.id]?.aprobado && !u.correoVerificado ? `<button data-action="desaprobar" data-id="${esc(u.id)}" class="rounded-lg px-2.5 py-1 text-xs border border-jro-line bg-white">Retirar activación</button>` : ""}
        <button data-action="resetpw" data-id="${esc(u.id)}" class="rounded-lg px-2.5 py-1 text-xs border border-jro-line bg-white">Restablecer contraseña</button>
        <button data-action="borrarusuario" data-id="${esc(u.id)}" class="rounded-lg px-2.5 py-1 text-xs border border-jro-terra bg-white">Eliminar datos</button></div>`}</td>
    </tr>`).join("")}</tbody></table></div>
    <p class="mt-4 text-xs text-jro-mute">${DEMO_MODE
      ? "Restablecer contraseña deja la cuenta sin clave: el alumno establece una nueva en su siguiente acceso."
      : "Restablecer contraseña envía al alumno un enlace por correo. Eliminar datos borra su perfil, entregas y título; la cuenta de acceso se borra desde la consola de Firebase (Authentication)."}</p>`;
}

/* =====================================================================
   VISTA: DIPLOMA (imprimible en A4 apaisado)
   ===================================================================== */
function vistaDiploma() {
  const d = DB.diplomas.find(x => x.id === UI.diplomaId);
  if (!d) return `${header()}<main class="max-w-xl mx-auto px-4 py-10 text-center"><p>Este título no existe o ha sido revocado.</p>
    <button data-action="ir" data-hash="${rutaSesion(UI.sesion)}" class="mt-4 btn-cta rounded-lg px-4 py-2 text-sm">Volver al curso</button></main>`;
  const a = DB.users.find(u => u.id === d.userId) || d;
  const volver = esAdmin() ? "#/admin/titulos" : "#/perfil";
  return `${header()}
  <main class="max-w-6xl mx-auto px-4 py-6">
    <div class="no-print flex flex-wrap gap-2 mb-4">
      <button data-action="imprimir" class="btn-cta rounded-lg px-4 py-2 text-sm">Imprimir / Guardar como PDF</button>
      <button data-action="ir" data-hash="${volver}" class="rounded-lg px-4 py-2 text-sm border border-jro-line bg-white">Volver</button>
      <span class="text-xs text-jro-mute self-center">En el diálogo de impresión elige "Guardar como PDF", orientación horizontal y activa "Gráficos de fondo".</span>
    </div>
    <div class="overflow-x-auto">
    <div id="diploma-print" class="relative mx-auto bg-white shadow-xl rounded-md w-[1123px] h-[794px] min-w-[1123px]">
      <div class="absolute inset-0 bg-jro-cream"></div>
      <div class="absolute inset-[22px] border-[3px] border-jro-gold"></div>
      <div class="absolute inset-[32px] border border-jro-ink"></div>
      <div class="absolute left-0 top-0 bottom-0 w-[14px] diploma-franja"></div>
      <div class="absolute right-0 top-0 bottom-0 w-[14px] diploma-franja-inv"></div>

      <div class="relative h-full flex flex-col items-center text-center px-[90px] pt-[62px] pb-[50px]">
        <div>${logoSVG(64)}</div>
        <div class="mt-6 text-[13px] font-bold tracking-[0.35em] text-jro-ink">TÍTULO PROPIO DEL CENTRO</div>
        <div class="mt-1 h-[3px] w-24 bg-jro-gold"></div>
        <p class="mt-6 text-[17px]">Formación Profesional José Ramón Otero certifica que</p>
        <div class="mt-3 text-[44px] font-extrabold leading-tight">${esc(a.nombre)}</div>
        <p class="mt-3 text-[16px] max-w-[820px] leading-relaxed">alumno/a de ${esc(a.curso)} curso del Ciclo Formativo de Grado Superior en <b>${esc(CICLOS[a.ciclo])}</b> (${esc(a.ciclo)}), ha superado con aprovechamiento el curso</p>
        <div class="mt-3 text-[24px] font-bold leading-snug max-w-[860px]">${esc(CURSO)}</div>
        <p class="mt-3 text-[15px]">con una duración de ${HORAS_CURSO} horas lectivas (12 sesiones) y la superación del Proyecto Final Integrador DAM + ASIR${typeof d.nota === "number" ? `, con una calificación media de <b>${d.nota}</b>` : ""}.</p>
        <div class="mt-4 flex gap-2 text-[11px] font-semibold">
          <span class="rounded-full px-3 py-1 bg-jro-sage">Skills y Claude Code</span>
          <span class="rounded-full px-3 py-1 bg-jro-gold">Servidores MCP</span>
          <span class="rounded-full px-3 py-1 bg-jro-terra">Ciberseguridad en LLMs</span>
        </div>

        <div class="mt-auto w-full flex items-end justify-between">
          <div class="text-left text-[12px] leading-relaxed max-w-[360px]">
            <div>Expedido el ${fecha(d.emitidoEn)}</div>
            <div>Código de verificación: <span class="mono font-semibold">${esc(d.codigo)}</span></div>
            <div class="text-[10.5px] text-jro-mute break-all">Verificación: ${esc(urlVerificacion(d.codigo))}</div>
          </div>
          <div class="flex items-center justify-center rounded-full text-center w-[112px] h-[112px] bg-jro-gold border-4 border-double border-jro-ink">
            <div class="leading-tight"><div class="text-[11px] font-bold">CFP</div><div class="text-[15px] font-extrabold">JRO</div><div class="text-[10px] font-bold">IA · CLAUDE</div><div class="text-[10px]">${new Date(d.emitidoEn || Date.now()).getFullYear()}</div></div>
          </div>
          <div class="text-center text-[12px]">
            <div class="mb-1 text-[22px] firma">${esc(ADMIN_NOMBRE)}</div>
            <div class="border-t border-jro-ink pt-1 w-56">${esc(ADMIN_NOMBRE)}<br>Docente y Tutor responsable del curso</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </main>`;
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

/* =====================================================================
   RENDER Y EVENTOS
   ===================================================================== */
let renderPendiente = false;

function render() {
  const app = $("#app");
  if (UI.vista === "verificar") { app.innerHTML = vistaVerificacion(); return; }
  if (UI.vista === "accion") { app.innerHTML = vistaAccion(); return; }
  const vistasAuth = { cargando: vistaCargando, error: vistaError, fuera: vistaAuth, completar: vistaCompletar, verificar: vistaVerificarCorreo, cambiarpw: vistaCambiarPassword };
  if (vistasAuth[AUTH.estado]) { app.innerHTML = vistasAuth[AUTH.estado](); return; }
  if (!usuario()) { app.innerHTML = vistaCargando(); return; }
  if (UI.vista === "admin" && !esAdmin()) UI.vista = "curso";
  app.innerHTML = { curso: vistaCurso, perfil: vistaPerfil, admin: vistaAdmin, diploma: vistaDiploma }[UI.vista]();
}

// Los cambios que llegan de la base de datos no borran lo que se está escribiendo
function renderDatos() {
  const activo = document.activeElement;
  if (activo && activo.closest("#app form") && activo.matches("input:not([type=checkbox]), textarea")) { renderPendiente = true; return; }
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

// Evita repetir la misma acción mientras está en curso (cada acción tiene su propio cerrojo)
const enCurso = new Set();
async function tarea(clave, fn, okMsg) {
  if (enCurso.has(clave)) return;
  enCurso.add(clave);
  document.body.classList.add("cursor-progress");
  try {
    const r = await fn();
    if (okMsg || typeof r === "string") toast(typeof r === "string" ? r : okMsg);
    return r;
  } catch (e) {
    toast(e.message || String(e));
  } finally {
    enCurso.delete(clave);
    if (!enCurso.size) document.body.classList.remove("cursor-progress");
  }
}

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  if (a === "cerrarmodal-fondo" && ev.target !== el) return;
  switch (a) {
    case "authtab": UI.authTab = el.dataset.tab; render(); break;
    case "demo": tarea("demo", () => backend.accesoDemo(el.dataset.id), "Sesión de demostración iniciada"); break;
    case "salir": tarea("salir", () => backend.salir()).then(() => { UI.authTab = "login"; ir("#/"); }); break;
    case "recargar": location.reload(); break;
    case "privacidad": modalPrivacidad(); break;
    case "cerrarmodal": case "cerrarmodal-fondo": cerrarModal(); break;
    case "ir": ir(el.dataset.hash); break;
    case "copiar": copiar($("#" + el.dataset.target).textContent); break;
    case "recuperar": {
      const email = ($("form[data-form=login] input[name=email]")?.value || "").trim().toLowerCase();
      if (!email) { toast("Escribe tu correo y vuelve a pulsar"); break; }
      tarea("recuperar", () => backend.recuperarPassword(email));
      break;
    }
    case "reenviarverif": tarea("reenviar", () => backend.reenviarVerificacion(), "Correo de verificación enviado"); break;
    case "comprobarverif":
      tarea("comprobar", async () => {
        const ok = await backend.comprobarVerificacion();
        return ok ? "Correo verificado" : "Aún no consta como verificado. Abre el enlace del correo y vuelve a probar.";
      });
      break;
    case "completar": tarea("progreso-" + el.dataset.n, () => backend.alternarProgreso(el.dataset.n)); break;
    case "filtrociclo": UI.filtroCiclo = el.dataset.c; render(); break;
    case "filtroestado": UI.filtroEstado = el.dataset.e; render(); break;
    case "emitir": tarea("emitir-" + el.dataset.id, () => backend.emitirTitulo(el.dataset.id), "Título emitido y firmado"); break;
    case "revocar":
      confirmar("Revocar título", "El título dejará de ser válido, su código dejará de verificarse y el alumno no podrá descargarlo.", "REVOCAR",
        async () => { await backend.revocarTitulo(el.dataset.id); toast("Título revocado"); });
      break;
    case "imprimir": window.print(); break;
    case "exportar": exportarDatos(); toast("Datos exportados"); break;
    case "csv": exportarCSV(); break;
    case "eliminar":
      confirmar("Eliminar mi cuenta", "Se borrarán de forma permanente tu perfil, tu progreso, tus entregas y tu título. Descarga antes tus datos si los necesitas.", "ELIMINAR",
        async (pw) => {
          if (backend.modo === "firebase" && !pw) throw new Error("Escribe tu contraseña.");
          await backend.eliminarMiCuenta(pw); toast("Cuenta eliminada"); ir("#/");
        }, { pedirPassword: backend.modo === "firebase" });
      break;
    case "borrarusuario": {
      const u = DB.users.find(x => x.id === el.dataset.id);
      confirmar("Eliminar datos del alumno", `Se eliminarán el perfil, el progreso, las entregas y el título de ${esc(u.nombre)}.`, "ELIMINAR",
        async () => { await backend.eliminarUsuario(u.id); toast("Datos eliminados"); });
      break;
    }
    case "resetpw": tarea("resetpw-" + el.dataset.id, () => backend.restablecerPassword(el.dataset.id)); break;
    case "aprobar": tarea("aprobar-" + el.dataset.id, () => backend.aprobarCuenta(el.dataset.id, true)); break;
    case "desaprobar": tarea("aprobar-" + el.dataset.id, () => backend.aprobarCuenta(el.dataset.id, false)); break;
    case "irinicio": location.href = location.pathname.replace(/accion\/?$/, ""); break;
  }
});

// Flechas izquierda/derecha entre pestañas (patrón ARIA tabs)
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") { cerrarModal(); return; }
  const tab = ev.target.closest?.("[role=tab]");
  if (!tab || !["ArrowLeft", "ArrowRight"].includes(ev.key)) return;
  const tabs = [...tab.closest("[role=tablist]").querySelectorAll("[role=tab]")];
  const sig = tabs[(tabs.indexOf(tab) + (ev.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
  ev.preventDefault();
  sig.click();
  requestAnimationFrame(() => document.querySelector(`[role=tab][aria-selected=true]`)?.focus());
});

document.addEventListener("change", (ev) => {
  if (ev.target.matches("[data-action='selsesion']")) ir(rutaSesion(Number(ev.target.value)));
});

function validarPerfil(datos, { esProfesor = false } = {}) {
  const nombre = (datos.nombre || "").trim();
  if (nombre.length < 3) return "Escribe tu nombre y apellidos.";
  if (!esProfesor) {
    if (!["DAM", "ASIR"].includes(datos.ciclo)) return "Selecciona tu ciclo.";
    if (!["1º", "2º"].includes(datos.curso)) return "Selecciona tu curso.";
  }
  if (!datos.privacidad) return "Debes aceptar la Política de Privacidad.";
  if (!datos.iaAct) return "Debes aceptar el Compromiso de Seguridad y Normativa IA.";
  return null;
}

document.addEventListener("submit", async (ev) => {
  const f = ev.target.closest("form[data-form]");
  if (!f) return;
  ev.preventDefault();
  const datos = Object.fromEntries(new FormData(f).entries());
  const err = (m) => { const e = f.querySelector("[data-error]"); if (e) { e.textContent = m; e.classList.remove("hidden"); } else toast(m); };

  switch (f.dataset.form) {
    case "login": {
      const email = (datos.email || "").trim().toLowerCase();
      if (!email || !datos.password) { toast("Escribe tu correo y tu contraseña"); return; }
      await tarea("login", () => backend.entrar(email, datos.password));
      break;
    }
    case "registro": {
      const email = (datos.email || "").trim().toLowerCase();
      const esProfesor = email === ADMIN_EMAIL;
      const fallo = validarPerfil(datos, { esProfesor });
      if (fallo) return err(fallo);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("El correo no es válido.");
      if (!esProfesor && !email.endsWith(DOMINIO) && !(datos.codigo || "").trim()) return err(`Usa tu correo ${DOMINIO} o el código de acceso de aula que te ha dado el profesor.`);
      if ((datos.password || "").length < 8) return err("La contraseña debe tener al menos 8 caracteres.");
      if (datos.password !== datos.password2) return err("Las contraseñas no coinciden.");
      await tarea("registro", () => backend.registrar({
        nombre: datos.nombre.trim(), email, codigo: (datos.codigo || "").trim(),
        ciclo: datos.ciclo, curso: datos.curso, password: datos.password
      }), DEMO_MODE ? "Cuenta creada. ¡Bienvenido/a!" : "Cuenta creada. Revisa tu correo para verificarla.");
      break;
    }
    case "completar": {
      const fallo = validarPerfil(datos);
      if (fallo) return err(fallo);
      await tarea("completar", () => backend.completarPerfil({ nombre: datos.nombre.trim(), codigo: (datos.codigo || "").trim(), ciclo: datos.ciclo, curso: datos.curso }));
      break;
    }
    case "verificar": {
      const codigo = (datos.codigo || "").trim().toUpperCase();
      if (codigo) ir(`#/verificar/${encodeURIComponent(codigo)}`);
      break;
    }
    case "entrega": {
      const n = Number(f.dataset.n);
      const enlace = (datos.enlace || "").trim();
      if (!esURL(enlace)) { toast("Indica un enlace que empiece por https://"); return; }
      if (!datos.limpio) { toast("Confirma que la entrega no contiene datos personales ni secretos"); return; }
      await tarea("entrega-" + n, () => backend.guardarEntrega(n, { enlace, pareja: (datos.pareja || "").trim(), comentario: (datos.comentario || "").trim() }), "Entrega enviada al profesor");
      break;
    }
    case "evaluar": {
      const decision = ev.submitter?.value || "revision";
      const nota = datos.nota === "" ? null : Math.max(0, Math.min(10, Number(datos.nota)));
      if (decision === "aprobada" && (nota === null || nota < 5)) { toast("Para aprobar, pon una nota de 5 o más"); return; }
      await tarea("evaluar-" + f.dataset.id, () => backend.evaluarEntrega(f.dataset.id, { estado: decision, nota, feedback: (datos.feedback || "").trim() }),
        decision === "aprobada" ? "Entrega aprobada" : "Se han solicitado cambios");
      break;
    }
    case "cambiopw": {
      const pw = datos.password || "";
      if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return err("La contraseña debe tener al menos 8 caracteres e incluir letras y números.");
      if (pw !== datos.password2) return err("Las contraseñas no coinciden.");
      await tarea("cambiopw", () => backend.cambiarPasswordInicial(pw));
      break;
    }
    case "nuevapw": {
      if ((datos.password || "").length < 8) { toast("La contraseña debe tener al menos 8 caracteres"); return; }
      if (datos.password !== datos.password2) { toast("Las contraseñas no coinciden"); return; }
      await tarea("nuevapw", async () => {
        await backend.confirmarReset(UI.accion.codigo, datos.password);
        UI.accion = { ...UI.accion, estado: "hecho" };
        render();
      });
      break;
    }
    case "codigoaula": {
      const codigo = (datos.codigo || "").trim();
      if (codigo.length < 6) { toast("El código debe tener al menos 6 caracteres"); return; }
      await tarea("codigoaula", () => backend.cambiarCodigoAula(codigo), "Código de aula guardado");
      break;
    }
  }
});

/* =====================================================================
   ARRANQUE
   ===================================================================== */
async function arrancar() {
  aplicarRuta();
  render();
  try {
    if (FIREBASE) {
      const { crearBackendFirebase } = await import("./backend-firebase.js");
      backend = crearBackendFirebase();
    } else {
      backend = crearBackendLocal();
    }
  } catch (e) {
    console.error(e);
    AUTH = { estado: "error", mensaje: "No se ha podido iniciar la plataforma." };
    render();
    return;
  }
  backend.iniciar((estado) => { AUTH = estado; render(); }, renderDatos);
  if (UI.vista === "accion") procesarAccion();
}

arrancar();
