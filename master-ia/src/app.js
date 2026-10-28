'use strict';

/* =====================================================================
 *  Máster IA · FP JOSÉ RAMÓN OTERO — Plataforma LMS (archivo único)
 *  Estado 100 % en el navegador (localStorage). Ver README de master-ia
 *  para las limitaciones de un prototipo sin backend.
 * ===================================================================== */

const ADMIN_EMAIL = 'omar.romero@jrotero.es';
const ADMIN_NAME = 'Omar Romero';
const CENTRO = 'Formación Profesional JOSÉ RAMÓN OTERO';
const TITULO_MASTER = 'Máster (Título Propio) en Ingeniería de Inteligencia Artificial, LLMs y Arquitecturas Cognitivas para Desarrolladores';
const DB_KEY = 'jro-master-ia-v2';
const SESSION_KEY = 'jro-master-ia-sesion';
const ULTIMA_SESION = 28;                          // sesiones numeradas 1-28 del temario oficial
const TOTAL_SESIONES = ULTIMA_SESION + 1;          // + Sesión 0 del Módulo Introductorio

const TABS = [
  ['teoria', 'Teoría'],
  ['taller', 'Taller paso a paso'],
  ['prompts', 'Biblioteca de Prompts'],
  ['actividad', 'Actividad práctica'],
  ['faq', 'Preguntas frecuentes']
];

const RUBRICA_TFM = [
  ['memoria', 'Memoria técnica y documentación', 0.20],
  ['implementacion', 'Implementación, arquitectura y calidad de código', 0.40],
  ['defensa', 'Defensa oral ante el Tribunal', 0.25],
  ['legal', 'Gobernanza IA, RGPD/LOPDGDD y EU AI Act', 0.15]
];

const HLJS_LANGS = new Set(['python', 'java', 'powershell', 'json', 'yaml', 'bash', 'sql', 'kotlin', 'dockerfile',
  'markdown', 'typescript', 'javascript', 'dart', 'xml', 'ini', 'plaintext', 'http', 'shell']);

/* ---------------------------------------------------------------------
 *  Utilidades
 * ------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function isHttpsUrl(u) {
  try { return new URL(u).protocol === 'https:'; } catch (e) { return false; }
}
function fmtFecha(iso, conHora) {
  if (!iso) return '—';
  const d = new Date(iso);
  const opts = { day: '2-digit', month: 'long', year: 'numeric' };
  if (conHora) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleDateString('es-ES', opts);
}
function fmtNota(n) {
  return (n == null || isNaN(n)) ? '—' : Number(n).toFixed(2).replace('.', ',');
}
function calificacionTexto(n) {
  if (n == null || isNaN(n)) return '';
  if (n < 5) return 'Suspenso';
  if (n < 7) return 'Aprobado';
  if (n < 9) return 'Notable';
  return 'Sobresaliente';
}
function edad(fechaIso) {
  const n = new Date(fechaIso);
  if (isNaN(n)) return -1;
  const h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  const m = h.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--;
  return e;
}
function uid() {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}
function bytesToB64(bytes) { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s); }
function b64ToBytes(b64) { return Uint8Array.from(atob(b64), ch => ch.charCodeAt(0)); }
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}
async function derivarHash(password, saltB64) {
  if (!(window.crypto && crypto.subtle)) {
    throw new Error('Este navegador no permite Web Crypto en este contexto. Abre la plataforma desde https:// o localhost.');
  }
  const salt = saltB64 ? b64ToBytes(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256);
  return { salt: bytesToB64(salt), hash: bytesToB64(new Uint8Array(bits)) };
}
function passwordValida(pw) {
  return pw.length >= 10 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw);
}
function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function toast(msg, tipo) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show ' + (tipo || 'ok');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = ''; }, 3400);
}
function limpiarCodigo(code) {
  // En las fuentes String.raw, "\${" representa un "${" literal (YAML, bash, Spring).
  return String(code).replace(/\\\$\{/g, '${').replace(/^\n+/, '').replace(/\s+$/, '');
}

/* ---------------------------------------------------------------------
 *  Persistencia
 * ------------------------------------------------------------------- */
function normalizarDB(d) {
  d = d && typeof d === 'object' ? d : {};
  d.version = 2;
  d.users = d.users || {};
  d.codigos = d.codigos || [];
  d.entregas = d.entregas || [];
  d.titulos = d.titulos || [];
  d.audit = d.audit || [];
  if (!d.users[ADMIN_EMAIL]) {
    d.users[ADMIN_EMAIL] = {
      email: ADMIN_EMAIL, nombre: ADMIN_NAME, rol: 'director', estado: 'admitido',
      creado: new Date().toISOString(), progreso: {}, salt: null, hash: null
    };
  }
  d.users[ADMIN_EMAIL].rol = 'director';
  d.users[ADMIN_EMAIL].estado = 'admitido';
  return d;
}
function cargarDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return normalizarDB(JSON.parse(raw));
  } catch (e) { /* almacenamiento bloqueado o JSON corrupto: se arranca vacío */ }
  return normalizarDB(null);
}
let db = cargarDB();
let memoriaSesion = null;

function guardar() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  catch (e) { toast('Este navegador no permite guardar datos: los cambios se perderán al cerrar.', 'bad'); }
}
function registrarAuditoria(accion, email) {
  db.audit.unshift({ fecha: new Date().toISOString(), accion, email: email || null });
  db.audit = db.audit.slice(0, 400);
}
function getSesionEmail() {
  try { return sessionStorage.getItem(SESSION_KEY) || memoriaSesion; } catch (e) { return memoriaSesion; }
}
function setSesionEmail(email) {
  memoriaSesion = email;
  try {
    if (email) sessionStorage.setItem(SESSION_KEY, email); else sessionStorage.removeItem(SESSION_KEY);
  } catch (e) { /* se mantiene en memoria */ }
}
function usuarioActual() {
  const e = getSesionEmail();
  return e && db.users[e] ? db.users[e] : null;
}
function esDirector(u) { return !!u && u.rol === 'director'; }
function alumnos() { return Object.values(db.users).filter(u => u.rol !== 'director'); }
function puedeAcceder(u, n) { return esDirector(u) || u.estado === 'admitido' || n <= 4; }   // Introducción + Módulo 0
function progresoDe(u) { return Object.keys(u.progreso || {}).filter(k => u.progreso[k]).length; }
function sesion(n) { return SESIONES.find(s => s.n === n); }
function moduloDe(n) { return MODULOS.find(m => n >= m.sesiones[0] && n <= m.sesiones[1]); }
function colorMod(m) { return { sage: '#a9cabb', terra: '#e39f7d', gold: '#efcd2f' }[m.color]; }
function chipMod(m) { return { sage: 'chip-sage', terra: 'chip-terra', gold: 'chip-gold' }[m.color]; }
function etiquetaMod(m) { return m.id < 0 ? 'Módulo Introductorio' : 'Módulo ' + m.id; }
function siglaMod(m) { return m.id < 0 ? 'Intro' : 'M' + m.id; }
function rangoMod(m) { return m.sesiones[0] === m.sesiones[1] ? 'Sesión ' + m.sesiones[0] : 'Sesiones ' + m.sesiones[0] + '–' + m.sesiones[1]; }

/* ---------------------------------------------------------------------
 *  Logotipo oficial (SVG vectorial + soporte logo-jrotero.png)
 * ------------------------------------------------------------------- */
let LOGO_PNG = false;
function isotipo(size, fondo, gota) {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" role="img" aria-label="Isotipo FP José Ramón Otero">' +
    '<rect width="100" height="100" rx="18" fill="' + (fondo || '#000000') + '"/>' +
    '<path d="M14 14C32 28 50 38 71 44A21 21 0 1 1 44 71C37 50 28 32 14 14Z" fill="' + (gota || '#FFFFFF') + '"/></svg>';
}
function logoCompleto(tam, invertido) {
  tam = tam || 40;
  if (LOGO_PNG) {
    return '<img src="logo-jrotero.png" alt="' + esc(CENTRO) + '" style="height:' + tam + 'px;width:auto;display:block">';
  }
  const color = invertido ? '#FFFFFF' : '#111111';
  return '<span style="display:inline-flex;align-items:center;gap:' + Math.round(tam * 0.25) + 'px">' +
    isotipo(tam, invertido ? '#FFFFFF' : '#000000', invertido ? '#000000' : '#FFFFFF') +
    '<span style="display:flex;flex-direction:column;line-height:1.05;color:' + color + '">' +
    '<span style="font-size:' + Math.round(tam * 0.3) + 'px;font-weight:600;letter-spacing:-.01em">Formación Profesional</span>' +
    '<span style="font-size:' + Math.round(tam * 0.36) + 'px;font-weight:800;letter-spacing:.01em">JOSÉ RAMÓN OTERO</span>' +
    '</span></span>';
}

/* ---------------------------------------------------------------------
 *  Bloques de contenido
 * ------------------------------------------------------------------- */
let codeSeq = 0;
const codigoPorId = {};
function bloqueCodigo(code, lang, etiqueta) {
  const limpio = limpiarCodigo(code);
  const id = 'cb' + (++codeSeq);
  codigoPorId[id] = limpio;
  const cls = HLJS_LANGS.has(lang) ? lang : 'plaintext';
  return '<div class="code"><div class="code-h"><span><span class="dots"><i style="background:#e39f7d"></i><i style="background:#efcd2f"></i><i style="background:#a9cabb"></i></span>' +
    esc(etiqueta || lang || 'texto') + '</span><button class="copy-btn" data-act="copiar" data-id="' + id + '">Copiar</button></div>' +
    '<pre><code class="language-' + cls + '">' + esc(limpio) + '</code></pre></div>';
}
function tablaHTML(t) {
  if (!t) return '';
  return (t.cap ? '<h3 class="font-bold text-base mt-6 mb-2">' + t.cap + '</h3>' : '') +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + t.head.map(h => '<th>' + h + '</th>').join('') +
    '</tr></thead><tbody>' + t.rows.map(r => '<tr>' + r.map(cel => '<td>' + cel + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
}
function flujoHTML(pasos, titulo) {
  if (!pasos) return '';
  return '<div class="card p-4 mt-5"><div class="text-xs font-bold uppercase tracking-wide text-jro-gold-deep mb-3">' + esc(titulo || 'Diagrama de flujo') + '</div><div class="flow">' +
    pasos.map((p, i) => (i ? '<span class="arrow">→</span>' : '') + '<span class="node">' + esc(p) + '</span>').join('') + '</div></div>';
}
function resaltar() {
  if (!window.hljs) return;
  try { hljs.configure({ ignoreUnescapedHTML: true }); } catch (e) { /* versión sin configure */ }
  $$('pre code:not(.hljs)').forEach(el => { try { hljs.highlightElement(el); } catch (e) { /* lenguaje no cargado */ } });
}

/* ---------------------------------------------------------------------
 *  Estado de interfaz
 * ------------------------------------------------------------------- */
const ui = { authVista: 'login', modsCerrados: new Set(), sideAbierta: false, filtroEntregas: 'pendientes' };

function ruta() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}
function ir(path) { location.hash = '#/' + path; }

/* ---------------------------------------------------------------------
 *  Autenticación y registro (RGPD / LOPDGDD / EU AI Act)
 * ------------------------------------------------------------------- */
function tablaPrimeraCapa() {
  const filas = [
    ['Responsable', 'CFP José Ramón Otero (' + CENTRO + ')'],
    ['Contacto', '<a class="underline" href="mailto:' + ADMIN_EMAIL + '">' + ADMIN_EMAIL + '</a> (Dirección Académica del Máster)'],
    ['Finalidad', 'Gestión académica del posgrado (admisión, seguimiento, evaluación y Tribunal de TFM) y expedición del Título Propio de Máster.'],
    ['Legitimación', 'Art. 6.1.a RGPD (consentimiento) y art. 6.1.b RGPD (ejecución de la relación de matrícula).'],
    ['Destinatarios', 'No se ceden datos a terceros salvo obligación legal. Sin transferencias internacionales.'],
    ['Derechos', 'Acceso, Rectificación, Supresión, Oposición, Portabilidad y Limitación (ARSOPOL) desde tu perfil o por correo al responsable. Reclamación ante la AEPD (aepd.es).'],
    ['Información adicional', '<button type="button" class="underline font-semibold" data-act="segunda-capa">Ver segunda capa informativa</button>']
  ];
  return '<div class="tbl-wrap"><table class="tbl"><caption class="text-left text-xs font-bold uppercase tracking-wide px-3 pt-3 pb-1">Información básica sobre protección de datos (1.ª capa)</caption><tbody>' +
    filas.map(f => '<tr><th style="width:30%">' + f[0] + '</th><td>' + f[1] + '</td></tr>').join('') + '</tbody></table></div>';
}

function modalSegundaCapa() {
  abrirModal('<h2 class="text-xl font-extrabold mb-3">Información adicional sobre protección de datos</h2>' +
    '<div class="prose-jro text-sm">' +
    '<p><strong>Responsable:</strong> CFP José Ramón Otero. Contacto de la Dirección Académica y canal de ejercicio de derechos: <a class="underline" href="mailto:' + ADMIN_EMAIL + '">' + ADMIN_EMAIL + '</a>.</p>' +
    '<p><strong>Datos tratados:</strong> identificativos (nombre, correo), académicos (promoción DAM, progreso, entregas, calificaciones, TFM), fecha de nacimiento (exclusivamente para verificar la mayoría de edad) y registros técnicos de consentimiento.</p>' +
    '<p><strong>Finalidades:</strong> (1) gestionar la admisión de titulados en DAM; (2) impartir y evaluar las 28 sesiones; (3) constituir el Tribunal de TFM; (4) expedir y registrar el Título Propio de Máster.</p>' +
    '<p><strong>Base jurídica:</strong> consentimiento (art. 6.1.a RGPD) para el alta en la plataforma y ejecución de la relación de matrícula (art. 6.1.b RGPD). La conservación del registro de títulos expedidos se ampara en el cumplimiento de obligaciones legales (art. 6.1.c RGPD).</p>' +
    '<p><strong>Conservación:</strong> durante la matrícula y, tras ella, bloqueados durante los plazos legales de prescripción (art. 32 LOPDGDD). El registro de títulos se conserva de forma permanente con los datos mínimos (nombre, número de título, fecha y calificación).</p>' +
    '<p><strong>Derechos ARSOPOL:</strong> puedes ejercerlos desde «Mi expediente» (exportación JSON, rectificación, supresión, oposición y limitación) o por correo electrónico. Si consideras que el tratamiento no es conforme, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>' +
    '<p><strong>Decisiones automatizadas:</strong> no se adoptan decisiones basadas únicamente en tratamiento automatizado (art. 22 RGPD). Toda calificación y la emisión del título las realiza una persona: el Director del Máster y el Tribunal.</p>' +
    '<p><strong>Gobernanza de IA (Reglamento UE 2024/1689, EU AI Act):</strong> el alumnado se compromete a no entrenar ni inferir con datos personales sin anonimizar, a respetar las licencias de los pesos abiertos (Llama, Qwen, DeepSeek, Gemma…) y de los datasets, a documentar los riesgos y sesgos de sus sistemas y a cumplir las obligaciones de transparencia (art. 50) cuando un sistema interactúe con personas o genere contenido sintético.</p>' +
    '<p class="text-xs text-gray-500"><strong>Nota técnica:</strong> este prototipo guarda la información en el almacenamiento local del navegador en el que se usa; en producción debe desplegarse con backend, cifrado en tránsito y en reposo y registro de actividades de tratamiento.</p>' +
    '</div><div class="mt-4 text-right"><button class="btn btn-primary" data-act="cerrar-modal">Entendido</button></div>');
}

function vistaAuth() {
  const v = ui.authVista;
  const pestañas = v === 'setup' ? '' :
    '<div class="tabs mb-5" role="tablist">' +
    '<button class="tab" role="tab" aria-selected="' + (v === 'login') + '" data-act="auth-vista" data-v="login">Acceso</button>' +
    '<button class="tab" role="tab" aria-selected="' + (v === 'registro') + '" data-act="auth-vista" data-v="registro">Registro (titulados DAM)</button></div>';

  let form = '';
  if (v === 'login') {
    form = '<form data-form="login" class="space-y-4" novalidate>' +
      '<div class="field"><label for="l-email">Correo electrónico</label><input id="l-email" name="email" type="email" autocomplete="username" required placeholder="nombre.apellido@jrotero.es"></div>' +
      '<div class="field"><label for="l-pw">Contraseña</label><input id="l-pw" name="password" type="password" autocomplete="current-password"><div class="hint">Primer acceso del Director (' + ADMIN_EMAIL + '): deja la contraseña vacía para configurarla.</div></div>' +
      '<div class="err text-sm" style="color:#9b2c13" id="login-err"></div>' +
      '<button class="btn btn-primary w-full" type="submit">Entrar en el Máster</button></form>';
  } else if (v === 'registro') {
    const año = new Date().getFullYear();
    let promos = '';
    for (let y = año; y >= 2000; y--) promos += '<option value="' + y + '">' + y + '</option>';
    form = '<form data-form="registro" class="space-y-4" novalidate>' +
      '<div class="grid sm:grid-cols-2 gap-4">' +
      '<div class="field sm:col-span-2"><label for="r-nombre">Nombre y apellidos</label><input id="r-nombre" name="nombre" required maxlength="90" autocomplete="name"></div>' +
      '<div class="field"><label for="r-email">Correo electrónico</label><input id="r-email" name="email" type="email" required autocomplete="email" placeholder="usuario@jrotero.es"><div class="hint">Debe ser <strong>@jrotero.es</strong>, o bien introduce un código de admisión.</div></div>' +
      '<div class="field"><label for="r-codigo">Código de admisión de posgrado</label><input id="r-codigo" name="codigo" placeholder="MIA-XXXX-XXXX" autocomplete="off" style="text-transform:uppercase"><div class="hint">Solo si tu correo no es del dominio del centro.</div></div>' +
      '<div class="field"><label for="r-promo">Promoción de graduación DAM</label><select id="r-promo" name="promocion" required><option value="">Selecciona año…</option>' + promos + '</select></div>' +
      '<div class="field"><label for="r-centro">Centro donde cursaste DAM</label><input id="r-centro" name="centro" maxlength="90" placeholder="CFP José Ramón Otero"></div>' +
      '<div class="field"><label for="r-nac">Fecha de nacimiento</label><input id="r-nac" name="nacimiento" type="date" required><div class="hint">Solo para verificar la mayoría de edad.</div></div>' +
      '<div></div>' +
      '<div class="field"><label for="r-pw">Contraseña</label><input id="r-pw" name="password" type="password" autocomplete="new-password" required><div class="hint">Mín. 10 caracteres, con mayúscula, minúscula y número.</div></div>' +
      '<div class="field"><label for="r-pw2">Repite la contraseña</label><input id="r-pw2" name="password2" type="password" autocomplete="new-password" required></div>' +
      '</div>' +
      tablaPrimeraCapa() +
      '<div class="space-y-3 pt-1">' +
      '<label class="check"><input type="checkbox" name="mayor"> <span>Declaro ser <strong>mayor de 18 años</strong> y estar en posesión del título de Técnico Superior en Desarrollo de Aplicaciones Multiplataforma (o en condiciones de acreditarlo).</span></label>' +
      '<label class="check"><input type="checkbox" name="consentDatos"> <span>He leído la información de protección de datos y <strong>consiento el tratamiento de mis datos académicos</strong> para la gestión del posgrado y la expedición del título (art. 6.1.a y 6.1.b RGPD).</span></label>' +
      '<label class="check"><input type="checkbox" name="consentEtica"> <span>Acepto el <strong>compromiso ético de Gobernanza de IA y EU AI Act</strong>: no entrenaré ni inferiré con datos personales (PII) sin anonimizar, respetaré las licencias de los pesos abiertos y de los datasets y aplicaré medidas de prevención de sesgos y de transparencia.</span></label>' +
      '</div>' +
      '<div class="text-sm" style="color:#9b2c13" id="reg-err" role="alert"></div>' +
      '<button class="btn btn-primary w-full" type="submit">Solicitar admisión al Máster</button></form>';
  } else {
    form = '<form data-form="setup" class="space-y-4" novalidate>' +
      '<div class="rounded-lg p-3 text-sm" style="background:#fdf6d3">Primer acceso de <strong>' + ADMIN_NAME + '</strong> (' + ADMIN_EMAIL + '), Director Académico. Define la contraseña del Panel de Dirección.</div>' +
      '<div class="field"><label for="s-pw">Nueva contraseña</label><input id="s-pw" name="password" type="password" autocomplete="new-password"><div class="hint">Mín. 10 caracteres, con mayúscula, minúscula y número.</div></div>' +
      '<div class="field"><label for="s-pw2">Repite la contraseña</label><input id="s-pw2" name="password2" type="password" autocomplete="new-password"></div>' +
      '<div class="text-sm" style="color:#9b2c13" id="setup-err"></div>' +
      '<div class="flex gap-2"><button class="btn btn-ghost" type="button" data-act="auth-vista" data-v="login">Volver</button><button class="btn btn-primary flex-1" type="submit">Guardar y entrar</button></div></form>';
  }

  return '<div class="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">' +
    '<aside class="min-w-0 relative overflow-hidden text-white p-8 lg:p-12 flex flex-col justify-between" style="background:#111111">' +
    '<div>' + logoCompleto(46, true) + '</div>' +
    '<div class="my-10 relative z-10">' +
    '<span class="badge-master">★ Título Propio de Máster</span>' +
    '<h1 class="text-[1.65rem] sm:text-3xl lg:text-4xl font-extrabold leading-tight mt-4 break-words">Ingeniería de Inteligencia Artificial, LLMs y Arquitecturas Cognitivas para Desarrolladores</h1>' +
    '<p class="mt-4 text-white/75 max-w-xl">Posgrado diseñado exclusivamente para titulados en Grado Superior de DAM. 7 módulos y 28 sesiones numeradas: del cálculo tensorial al RAG industrial, el protocolo MCP, los agentes autónomos, el fine-tuning y el MLOps, con un Trabajo Fin de Máster defendido ante Tribunal.</p>' +
    '<div class="flex flex-wrap gap-2 mt-6">' +
    '<span class="chip" style="background:#a9cabb;color:#111">Python · PyTorch · FastAPI</span>' +
    '<span class="chip" style="background:#a9cabb;color:#111">Java 21 · Spring AI · LangChain4j</span>' +
    '<span class="chip" style="background:#e39f7d;color:#111">RAG · MCP · Agentes</span>' +
    '<span class="chip" style="background:#e39f7d;color:#111">LLMOps · EU AI Act</span></div></div>' +
    '<div class="text-xs text-white/55 relative z-10">Dirección Académica: ' + ADMIN_NAME + ' · ' + ADMIN_EMAIL + '</div>' +
    '<div style="position:absolute;right:-90px;bottom:-90px;opacity:.08">' + isotipo(380, '#FFFFFF', '#111111') + '</div>' +
    '</aside>' +
    '<main class="min-w-0 p-4 sm:p-10 flex items-start lg:items-center justify-center"><div class="w-full max-w-2xl">' +
    '<div class="card p-6 sm:p-8">' + pestañas + form + '</div>' +
    '<p class="text-xs text-gray-500 mt-4 text-center">Plataforma LMS · ' + CENTRO + '</p>' +
    '</div></main></div>';
}

async function onLogin(f) {
  const email = f.email.value.trim().toLowerCase();
  const pw = f.password.value;
  const err = $('#login-err');
  err.textContent = '';
  const u = db.users[email];
  if (!u) { err.textContent = 'No existe ninguna cuenta con ese correo. Si eres titulado DAM, regístrate.'; return; }
  if (esDirector(u) && !u.hash) { ui.authVista = 'setup'; render(); return; }
  if (!pw) { err.textContent = 'Introduce tu contraseña.'; return; }
  try {
    const { hash } = await derivarHash(pw, u.salt);
    if (hash !== u.hash) { err.textContent = 'Contraseña incorrecta.'; return; }
  } catch (e) { err.textContent = e.message; return; }
  if (u.estado === 'rechazado') { err.textContent = 'Tu solicitud de admisión no ha sido aceptada. Contacta con ' + ADMIN_EMAIL + '.'; return; }
  setSesionEmail(email);
  registrarAuditoria('Inicio de sesión', email);
  guardar();
  if (!location.hash || location.hash === '#/') ir('inicio'); else render();
}

async function onSetup(f) {
  const err = $('#setup-err');
  const pw = f.password.value, pw2 = f.password2.value;
  if (!passwordValida(pw)) { err.textContent = 'La contraseña no cumple la política de seguridad.'; return; }
  if (pw !== pw2) { err.textContent = 'Las contraseñas no coinciden.'; return; }
  const admin = db.users[ADMIN_EMAIL];
  if (admin.hash) { err.textContent = 'La contraseña del Director ya está configurada.'; return; }
  try { Object.assign(admin, await derivarHash(pw)); } catch (e) { err.textContent = e.message; return; }
  registrarAuditoria('Configuración inicial de la cuenta del Director', ADMIN_EMAIL);
  setSesionEmail(ADMIN_EMAIL);
  guardar();
  ui.authVista = 'login';
  toast('Bienvenido, ' + ADMIN_NAME + '. Panel de Dirección activado.');
  ir('direccion/admisiones');
}

async function onRegistro(f) {
  const err = $('#reg-err');
  const fallo = m => { err.textContent = m; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  const nombre = f.nombre.value.trim();
  const email = f.email.value.trim().toLowerCase();
  const codigo = f.codigo.value.trim().toUpperCase();
  const promocion = f.promocion.value;
  const nacimiento = f.nacimiento.value;
  const pw = f.password.value;

  if (nombre.length < 5 || nombre.split(/\s+/).length < 2) return fallo('Indica nombre y al menos un apellido.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fallo('El correo electrónico no es válido.');
  if (db.users[email]) return fallo('Ya existe una cuenta con ese correo.');
  const dominioCentro = email.endsWith('@jrotero.es');
  let codigoObj = null;
  if (!dominioCentro) {
    if (!codigo) return fallo('Tu correo no es @jrotero.es: necesitas un código de admisión de posgrado emitido por la Dirección.');
    codigoObj = db.codigos.find(x => x.codigo === codigo && !x.usadoPor && !x.revocado);
    if (!codigoObj) return fallo('El código de admisión no es válido, ya se ha usado o ha sido revocado.');
  }
  if (!promocion) return fallo('Selecciona tu promoción de graduación en DAM.');
  if (!nacimiento) return fallo('Indica tu fecha de nacimiento.');
  if (edad(nacimiento) < 18) return fallo('Debes ser mayor de edad para matricularte en el Máster.');
  if (!f.mayor.checked) return fallo('Debes declarar tu mayoría de edad y titulación DAM.');
  if (!passwordValida(pw)) return fallo('La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un número.');
  if (pw !== f.password2.value) return fallo('Las contraseñas no coinciden.');
  if (!f.consentDatos.checked) return fallo('Necesitamos tu consentimiento para tratar tus datos académicos.');
  if (!f.consentEtica.checked) return fallo('Debes aceptar el compromiso ético de Gobernanza de IA y EU AI Act.');

  let cred;
  try { cred = await derivarHash(pw); } catch (e) { return fallo(e.message); }
  const ahora = new Date().toISOString();
  db.users[email] = {
    email, nombre, rol: 'alumno', promocion, centro: f.centro.value.trim(), nacimiento,
    salt: cred.salt, hash: cred.hash, creado: ahora,
    estado: codigoObj ? 'admitido' : 'pendiente',
    via: codigoObj ? 'codigo:' + codigoObj.codigo : 'dominio',
    consentimientos: {
      datos: { aceptado: true, fecha: ahora, version: 'RGPD-1.0' },
      etica: { aceptado: true, fecha: ahora, version: 'IA-ETICA-1.0' }
    },
    oposicion: null, limitacion: null, progreso: {}, tfm: null, tribunal: null, titulo: null
  };
  if (codigoObj) { codigoObj.usadoPor = email; codigoObj.fechaUso = ahora; }
  registrarAuditoria('Alta de alumno (' + (codigoObj ? 'código de admisión' : 'dominio @jrotero.es') + ')', email);
  setSesionEmail(email);
  guardar();
  toast(codigoObj ? 'Admisión confirmada con código de posgrado. ¡Bienvenido/a!' : 'Solicitud registrada. Mientras la Dirección la valida, tienes acceso a la Introducción y al Módulo 0.');
  ir('inicio');
}

/* ---------------------------------------------------------------------
 *  Shell: cabecera + barra lateral
 * ------------------------------------------------------------------- */
function cabecera(u) {
  return '<header class="sticky top-0 z-40 bg-white border-b" style="border-color:var(--line);height:64px">' +
    '<div class="h-full px-4 flex items-center gap-3">' +
    '<button class="btn btn-ghost btn-sm lg:hidden" data-act="toggle-side" aria-label="Abrir menú de módulos">☰</button>' +
    '<a href="#/inicio" class="flex items-center gap-3 no-underline min-w-0" aria-label="Inicio">' + logoCompleto(34) + '</a>' +
    '<span class="hidden md:block w-px h-8 bg-gray-200 mx-1"></span>' +
    '<div class="hidden md:flex flex-col min-w-0"><span class="badge-master self-start" style="font-size:.6rem;padding:.15rem .45rem">Título Propio de Máster</span>' +
    '<span class="text-xs font-semibold truncate mt-0.5">Ingeniería de IA, LLMs y Arquitecturas Cognitivas</span></div>' +
    '<div class="ml-auto flex items-center gap-2">' +
    (esDirector(u) ? '<a class="btn btn-dark btn-sm hidden sm:inline-flex" href="#/direccion/admisiones">Panel de Dirección</a>' : '') +
    '<a class="btn btn-ghost btn-sm" href="#/perfil" title="Mi expediente">' +
    '<span class="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold" style="background:#efcd2f;color:#111">' + esc(u.nombre.charAt(0).toUpperCase()) + '</span>' +
    '<span class="hidden sm:inline max-w-[140px] truncate">' + esc(u.nombre.split(' ')[0]) + '</span></a>' +
    '<button class="btn btn-ghost btn-sm" data-act="logout">Salir</button>' +
    '</div></div></header>';
}

function barraLateral(u, actual) {
  let html = '<nav class="sidebar p-3' + (ui.sideAbierta ? ' open' : '') + '" aria-label="Módulos y sesiones">';
  html += '<a class="side-link' + (actual === 'inicio' ? ' active' : '') + '" href="#/inicio"><span class="snum">⌂</span>Panel del alumno</a>';
  html += '<a class="side-link' + (actual === 'programa' ? ' active' : '') + '" href="#/programa"><span class="snum">▦</span>Arquitectura del programa</a>';
  html += '<div class="mt-3 mb-1 px-2 text-[.68rem] font-bold uppercase tracking-widest text-gray-500">Introducción + 7 módulos · 28 sesiones</div>';
  MODULOS.forEach(m => {
    const cerrado = ui.modsCerrados.has(m.id);
    html += '<div class="mb-1"><button class="mod-btn" data-act="toggle-mod" data-m="' + m.id + '" aria-expanded="' + !cerrado + '">' +
      '<span class="mod-dot" style="background:' + colorMod(m) + '"></span><span class="flex-1">' + (m.id < 0 ? 'Introducción' : 'Módulo ' + m.id + ' · ' + esc(m.corto)) + '</span><span class="text-gray-400">' + (cerrado ? '+' : '–') + '</span></button>';
    if (!cerrado) {
      html += '<div class="pl-2 border-l-2 ml-3" style="border-color:' + colorMod(m) + '">';
      for (let n = m.sesiones[0]; n <= m.sesiones[1]; n++) {
        const s = sesion(n);
        const ok = puedeAcceder(u, n);
        const hecho = u.progreso && u.progreso[n];
        html += '<a class="side-link' + (actual === 's' + n ? ' active' : '') + (ok ? '' : ' locked') + '" href="#/sesion/' + n + '/teoria" title="' + esc(s ? s.titulo : '') + '">' +
          '<span class="snum">' + (hecho ? '✓' : n) + '</span><span class="truncate">Sesión ' + n + ' · ' + esc(s ? s.corto : '') + '</span>' + (ok ? '' : '<span class="ml-auto text-xs">🔒</span>') + '</a>';
      }
      html += '</div>';
    }
    html += '</div>';
  });
  html += '<div class="mt-4 pt-3 border-t" style="border-color:var(--line)">' +
    '<a class="side-link' + (actual === 'perfil' ? ' active' : '') + '" href="#/perfil"><span class="snum">◉</span>Mi expediente y derechos ARSOPOL</a>' +
    (esDirector(u) ? '<a class="side-link' + (actual === 'direccion' ? ' active' : '') + '" href="#/direccion/admisiones"><span class="snum" style="background:#efcd2f">★</span>Panel de Dirección</a>' : '') +
    '</div></nav>';
  return html;
}

/* ---------------------------------------------------------------------
 *  Panel del alumno (inicio)
 * ------------------------------------------------------------------- */
function vistaInicio(u) {
  const hechas = progresoDe(u);
  const pct = Math.round(hechas / TOTAL_SESIONES * 100);
  let siguiente = 1;
  for (let n = 0; n <= ULTIMA_SESION; n++) { if (!(u.progreso && u.progreso[n])) { siguiente = n; break; } }
  const sig = sesion(siguiente);
  let aviso = '';
  if (!esDirector(u) && u.estado === 'pendiente') {
    aviso = '<div class="card p-4 mb-5" style="border-left:5px solid #efcd2f"><strong>Admisión pendiente de validación.</strong> La Dirección del Máster revisará tu titulación DAM. Mientras tanto tienes acceso completo a la Introducción y al Módulo 0 (Sesiones 0 a 4).</div>';
  }
  if (u.titulo) {
    aviso += '<div class="card p-4 mb-5 flex flex-wrap items-center gap-3" style="border-left:5px solid #efcd2f"><span class="badge-master">Título expedido</span><span>Tu Título Propio de Máster nº <strong>' + esc(u.titulo.numero) + '</strong> está disponible.</span><a class="btn btn-primary btn-sm ml-auto" href="#/diploma/' + encodeURIComponent(u.email) + '">Ver diploma</a></div>';
  }
  const cards = MODULOS.map(m => {
    let h = 0;
    for (let n = m.sesiones[0]; n <= m.sesiones[1]; n++) if (u.progreso && u.progreso[n]) h++;
    const tot = m.sesiones[1] - m.sesiones[0] + 1;
    return '<a href="#/sesion/' + m.sesiones[0] + '/teoria" class="card p-5 block no-underline hover:shadow-md transition-shadow" style="border-top:6px solid ' + colorMod(m) + '">' +
      '<div class="flex items-center justify-between"><span class="chip ' + chipMod(m) + '">' + etiquetaMod(m) + '</span><span class="text-xs text-gray-500">' + rangoMod(m) + '</span></div>' +
      '<h3 class="font-bold mt-3 leading-snug">' + esc(m.nombre) + '</h3>' +
      '<div class="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden"><div class="h-full" style="width:' + Math.round(h / tot * 100) + '%;background:' + colorMod(m) + '"></div></div>' +
      '<div class="text-xs text-gray-500 mt-1">' + h + '/' + tot + ' sesiones completadas</div></a>';
  }).join('');
  return '<div class="max-w-6xl mx-auto p-4 sm:p-8">' + aviso +
    '<div class="card p-6 sm:p-8 relative overflow-hidden" style="background:#111;color:#fff;border-color:#111">' +
    '<div style="position:absolute;right:-50px;top:-50px;opacity:.07">' + isotipo(260, '#FFFFFF', '#111111') + '</div>' +
    '<span class="badge-master">★ Máster · Título Propio</span>' +
    '<h1 class="text-2xl sm:text-3xl font-extrabold mt-3">Hola, ' + esc(u.nombre.split(' ')[0]) + '</h1>' +
    '<p class="text-white/70 mt-1 max-w-2xl">' + esc(TITULO_MASTER) + '</p>' +
    '<div class="mt-6 grid sm:grid-cols-[1fr_auto] gap-4 items-end">' +
    '<div><div class="flex justify-between text-sm mb-1"><span>Progreso global</span><span class="font-bold">' + hechas + '/' + TOTAL_SESIONES + ' · ' + pct + ' %</span></div>' +
    '<div class="h-3 rounded-full bg-white/15 overflow-hidden"><div class="h-full" style="width:' + pct + '%;background:#efcd2f"></div></div></div>' +
    '<a class="btn btn-primary" href="#/sesion/' + siguiente + '/teoria">Continuar · Sesión ' + siguiente + '</a></div>' +
    (sig ? '<p class="text-sm text-white/60 mt-3">Siguiente: ' + esc(sig.titulo) + '</p>' : '') +
    '</div>' +
    '<h2 class="text-lg font-extrabold mt-8 mb-3">Itinerario progresivo: de la base al estado del arte</h2>' +
    '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">' + cards + '</div>' +
    '<div class="grid md:grid-cols-3 gap-4 mt-8">' +
    '<div class="card p-5"><div class="text-xs font-bold uppercase text-gray-500">Perfil de ingreso</div><p class="text-sm mt-2">Titulados en Técnico Superior DAM: Java 21+, Kotlin, Python, SQL/NoSQL, APIs REST, Git y arquitectura limpia.</p></div>' +
    '<div class="card p-5"><div class="text-xs font-bold uppercase text-gray-500">Evaluación</div><p class="text-sm mt-2">Una actividad práctica evaluable por sesión (entrega de repositorio Git) y un TFM defendido ante Tribunal.</p></div>' +
    '<div class="card p-5"><div class="text-xs font-bold uppercase text-gray-500">Dirección Académica</div><p class="text-sm mt-2">' + ADMIN_NAME + ' · <a class="underline" href="mailto:' + ADMIN_EMAIL + '">' + ADMIN_EMAIL + '</a></p></div>' +
    '</div></div>';
}

/* ---------------------------------------------------------------------
 *  Arquitectura del programa (tabla de 28 sesiones)
 * ------------------------------------------------------------------- */
function vistaPrograma() {
  const filas = SESIONES.map(s => {
    const m = moduloDe(s.n);
    return '<tr><td><span class="snum" style="background:' + colorMod(m) + '">' + s.n + '</span></td><td><span class="chip ' + chipMod(m) + '">' + siglaMod(m) + ' · ' + esc(m.corto) + '</span></td>' +
      '<td><a class="font-semibold underline-offset-2 hover:underline" href="#/sesion/' + s.n + '/teoria">' + esc(s.titulo) + '</a></td>' +
      '<td>' + s.stack.map(t => '<span class="chip mr-1 mb-1">' + esc(t) + '</span>').join('') + '</td></tr>';
  }).join('');
  return '<div class="max-w-6xl mx-auto p-4 sm:p-8"><span class="badge-master">Plan de estudios</span>' +
    '<h1 class="text-2xl font-extrabold mt-2">Arquitectura del programa: Introducción + 7 módulos · 28 sesiones</h1>' +
    '<p class="text-gray-600 mt-1 mb-5">Cada sesión se estructura en las mismas 5 pestañas: Teoría · Taller paso a paso · Biblioteca de Prompts · Actividad práctica · Preguntas frecuentes.</p>' +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Módulo</th><th>Sesión</th><th>Stack tecnológico</th></tr></thead><tbody>' + filas + '</tbody></table></div></div>';
}

/* ---------------------------------------------------------------------
 *  Vista de sesión con la barra de 5 pestañas
 * ------------------------------------------------------------------- */
function vistaSesion(u, n, tab) {
  const s = sesion(n);
  if (!s) return '<div class="p-8">Sesión no encontrada.</div>';
  const m = moduloDe(n);
  if (!puedeAcceder(u, n)) {
    return '<div class="max-w-3xl mx-auto p-8"><div class="card p-8 text-center"><div class="text-4xl">🔒</div><h1 class="text-xl font-extrabold mt-3">Sesión ' + n + ' bloqueada</h1><p class="text-gray-600 mt-2">Tu admisión está pendiente de validación por la Dirección del Máster. Mientras tanto puedes cursar la Introducción y el Módulo 0 (Sesiones 0 a 4).</p><a class="btn btn-primary mt-5" href="#/sesion/0/teoria">Ir a la Sesión 0</a></div></div>';
  }
  if (!TABS.some(t => t[0] === tab)) tab = 'teoria';
  const hecho = u.progreso && u.progreso[n];
  const prev = n > 0 ? '<a class="btn btn-ghost btn-sm" href="#/sesion/' + (n - 1) + '/' + tab + '">← Sesión ' + (n - 1) + '</a>' : '';
  const next = n < ULTIMA_SESION ? '<a class="btn btn-ghost btn-sm" href="#/sesion/' + (n + 1) + '/' + tab + '">Sesión ' + (n + 1) + ' →</a>' : '';

  let cuerpo = '';
  if (tab === 'teoria') cuerpo = tabTeoria(s);
  else if (tab === 'taller') cuerpo = tabTaller(s);
  else if (tab === 'prompts') cuerpo = tabPrompts(s);
  else if (tab === 'actividad') cuerpo = tabActividad(u, s);
  else cuerpo = tabFaq(s);

  return '<div class="max-w-5xl mx-auto p-4 sm:p-8">' +
    '<div class="card overflow-hidden"><div style="height:8px;background:' + colorMod(m) + '"></div><div class="p-5 sm:p-7">' +
    '<div class="flex flex-wrap items-center gap-2"><span class="chip ' + chipMod(m) + '">' + etiquetaMod(m) + (m.id < 0 ? '' : ' · ' + esc(m.corto)) + '</span><span class="chip chip-gold">' + (n === 0 ? 'Sesión introductoria' : 'Sesión ' + n + ' de 28') + '</span>' +
    (s.duracion ? '<span class="chip">' + esc(s.duracion) + '</span>' : '') + '</div>' +
    '<h1 class="text-2xl sm:text-[1.7rem] font-extrabold leading-tight mt-3">Sesión ' + n + ' | ' + esc(s.titulo) + '</h1>' +
    '<p class="text-gray-600 mt-2">' + s.resumen + '</p>' +
    '<div class="flex flex-wrap gap-1.5 mt-4">' + s.stack.map(t => '<span class="chip">' + esc(t) + '</span>').join('') + '</div>' +
    '<div class="flex flex-wrap items-center gap-2 mt-5">' +
    '<button class="btn ' + (hecho ? 'btn-ghost' : 'btn-primary') + ' btn-sm" data-act="toggle-hecho" data-n="' + n + '">' + (hecho ? '✓ Sesión completada (desmarcar)' : 'Marcar sesión como completada') + '</button>' +
    '<span class="ml-auto flex gap-2">' + prev + next + '</span></div>' +
    '</div>' +
    '<div class="px-3 sm:px-5"><div class="tabs" role="tablist" aria-label="Secciones de la sesión">' +
    TABS.map(t => '<a class="tab no-underline" role="tab" aria-selected="' + (t[0] === tab) + '" href="#/sesion/' + n + '/' + t[0] + '">' + t[1] + '</a>').join('') +
    '</div></div></div>' +
    '<section class="mt-5" role="tabpanel">' + cuerpo + '</section></div>';
}

function tabTeoria(s) {
  const t = s.teoria;
  return '<div class="card p-5 sm:p-7 prose-jro">' +
    '<p class="text-[1.02rem]">' + t.intro + '</p>' +
    t.bloques.map(b => '<h3 class="font-extrabold text-lg mt-6 mb-1">' + b[0] + '</h3><div>' + b[1] + '</div>').join('') +
    (t.formula ? '<div class="mt-5 p-4 rounded-xl font-mono text-sm" style="background:#FAF9F5;border:1px dashed #c9c4b4">' + t.formula + '</div>' : '') +
    flujoHTML(t.flujo, t.flujoTitulo) +
    tablaHTML(t.tabla) +
    (t.claves ? '<div class="mt-6 p-4 rounded-xl" style="background:#fdf6d3"><div class="font-bold text-sm mb-1">Ideas clave para un desarrollador DAM</div><ul>' + t.claves.map(k => '<li>' + k + '</li>').join('') + '</ul></div>' : '') +
    '</div>';
}

function tabTaller(s) {
  const t = s.taller;
  return '<div class="card p-5 sm:p-7"><div class="flex flex-wrap gap-2 mb-4"><span class="chip chip-gold">Entorno</span><span class="text-sm">' + t.entorno + '</span></div>' +
    t.pasos.map((p, i) => '<div class="mt-6"><div class="flex items-start gap-3"><span class="snum" style="background:#111;color:#efcd2f">' + (i + 1) + '</span><div class="min-w-0 flex-1"><h3 class="font-extrabold">' + p.t + '</h3>' +
      (p.d ? '<p class="text-sm text-gray-700 mt-1 prose-jro">' + p.d + '</p>' : '') +
      (p.code ? bloqueCodigo(p.code, p.lang, p.file || p.lang) : '') + '</div></div></div>').join('') +
    '</div>';
}

function tabPrompts(s) {
  return '<div class="grid gap-4">' + s.prompts.map(p =>
    '<div class="card p-5"><div class="flex flex-wrap items-center gap-2"><span class="chip chip-gold">' + esc(p.tipo) + '</span><h3 class="font-extrabold">' + p.t + '</h3></div>' +
    (p.d ? '<p class="text-sm text-gray-600 mt-1">' + p.d + '</p>' : '') + bloqueCodigo(p.code, p.lang || 'markdown', p.file || p.tipo) + '</div>').join('') + '</div>';
}

function tabActividad(u, s) {
  const a = s.actividad;
  const mias = db.entregas.filter(e => e.email === u.email && e.sesion === s.n);
  let entregaHTML = '';
  if (esDirector(u)) {
    const n = db.entregas.filter(e => e.sesion === s.n).length;
    entregaHTML = '<div class="card p-5 mt-4"><strong>Vista de Dirección.</strong> Esta actividad tiene ' + n + ' entrega(s). <a class="underline" href="#/direccion/calificaciones">Ir a calificaciones</a>.</div>';
  } else {
    entregaHTML = '<div class="card p-5 sm:p-6 mt-4"><h3 class="font-extrabold text-lg">Entregar repositorio Git</h3><p class="text-sm text-gray-600">La entrega queda registrada para su validación por el Director del Máster (' + ADMIN_EMAIL + ').</p>' +
      '<form data-form="entrega" data-n="' + s.n + '" class="grid sm:grid-cols-2 gap-4 mt-4" novalidate>' +
      '<div class="field sm:col-span-2"><label for="e-repo">URL del repositorio (https)</label><input id="e-repo" name="repo" type="url" required placeholder="https://github.com/usuario/mia-sesion-' + s.n + '"></div>' +
      '<div class="field"><label for="e-commit">Rama o commit a evaluar</label><input id="e-commit" name="commit" placeholder="main · a1b2c3d" maxlength="80"></div>' +
      '<div class="field"><label for="e-tiempo">Horas dedicadas</label><input id="e-tiempo" name="horas" type="number" min="0" max="200" step="0.5"></div>' +
      '<div class="field sm:col-span-2"><label for="e-notas">Notas para el evaluador</label><textarea id="e-notas" name="notas" rows="3" maxlength="2000" placeholder="Decisiones de arquitectura, cómo ejecutar, limitaciones conocidas…"></textarea></div>' +
      '<label class="check sm:col-span-2"><input type="checkbox" name="limpio"> <span>Declaro que el repositorio <strong>no contiene secretos</strong> (.env, API keys) ni <strong>datos personales sin anonimizar</strong>, y que respeta las licencias de modelos y datasets utilizados.</span></label>' +
      '<div class="sm:col-span-2 text-sm" style="color:#9b2c13" id="entrega-err"></div>' +
      '<div class="sm:col-span-2"><button class="btn btn-primary" type="submit">Registrar entrega</button></div></form>' +
      (mias.length ? '<h4 class="font-bold mt-6 mb-2">Mis entregas</h4>' + mias.map(e =>
        '<div class="rounded-lg border p-3 mb-2 text-sm" style="border-color:var(--line)"><div class="flex flex-wrap gap-2 items-center"><a class="underline font-semibold break-all" href="' + esc(e.repo) + '" target="_blank" rel="noopener noreferrer">' + esc(e.repo) + '</a><span class="text-gray-500">' + fmtFecha(e.fecha, true) + '</span>' +
        (e.estado === 'evaluada' ? '<span class="chip chip-gold ml-auto">Nota ' + fmtNota(e.nota) + '</span>' : '<span class="chip ml-auto">Pendiente de evaluación</span>') + '</div>' +
        (e.feedback ? '<div class="mt-2 p-2 rounded" style="background:#FAF9F5"><strong>Feedback del Director:</strong> ' + esc(e.feedback) + '</div>' : '') + '</div>').join('') : '') +
      '</div>';
  }
  return '<div class="card p-5 sm:p-7 prose-jro"><span class="chip chip-gold">Caso práctico evaluable</span>' +
    '<h2 class="text-xl font-extrabold mt-2">' + a.titulo + '</h2><p>' + a.contexto + '</p>' +
    '<div class="grid md:grid-cols-2 gap-5 mt-4"><div><h3 class="font-bold">Requisitos técnicos</h3><ul>' + a.requisitos.map(r => '<li>' + r + '</li>').join('') + '</ul></div>' +
    '<div><h3 class="font-bold">Entregables en el repositorio</h3><ul>' + a.entregables.map(r => '<li>' + r + '</li>').join('') + '</ul></div></div>' +
    tablaHTML({ cap: 'Rúbrica de evaluación', head: ['Criterio', 'Peso'], rows: a.rubrica.map(r => [r[0], r[1] + ' %']) }) +
    '</div>' + entregaHTML;
}

function tabFaq(s) {
  return '<div class="grid gap-3">' + s.faq.map((f, i) =>
    '<details class="card p-0 overflow-hidden"' + (i === 0 ? ' open' : '') + '><summary class="cursor-pointer p-4 font-bold flex gap-3"><span class="text-jro-gold-deep">P' + (i + 1) + '</span><span>' + f[0] + '</span></summary>' +
    '<div class="px-4 pb-4 prose-jro text-sm">' + f[1] + '</div></details>').join('') + '</div>';
}

function onEntrega(f) {
  const u = usuarioActual();
  const err = $('#entrega-err');
  const repo = f.repo.value.trim();
  if (!isHttpsUrl(repo)) { err.textContent = 'Introduce una URL https:// válida al repositorio.'; return; }
  if (!f.limpio.checked) { err.textContent = 'Debes confirmar que el repositorio no contiene secretos ni datos personales.'; return; }
  const n = Number(f.dataset.n);
  db.entregas.push({
    id: uid(), email: u.email, sesion: n, repo, commit: f.commit.value.trim(), horas: f.horas.value ? Number(f.horas.value) : null,
    notas: f.notas.value.trim(), fecha: new Date().toISOString(), estado: 'pendiente', nota: null, feedback: ''
  });
  registrarAuditoria('Entrega de la actividad de la Sesión ' + n, u.email);
  guardar();
  toast('Entrega registrada. El Director recibirá tu repositorio para validación.');
  render();
}

/* ---------------------------------------------------------------------
 *  Mi expediente + derechos ARSOPOL
 * ------------------------------------------------------------------- */
function vistaPerfil(u) {
  const mias = db.entregas.filter(e => e.email === u.email);
  const evaluadas = mias.filter(e => e.estado === 'evaluada');
  const media = evaluadas.length ? evaluadas.reduce((a, e) => a + e.nota, 0) / evaluadas.length : null;
  const año = new Date().getFullYear();
  let promos = '';
  for (let y = año; y >= 2000; y--) promos += '<option value="' + y + '"' + (String(u.promocion) === String(y) ? ' selected' : '') + '>' + y + '</option>';
  const tfm = u.tfm || {};
  const estadoTxt = { pendiente: 'Admisión pendiente', admitido: 'Admitido/a', rechazado: 'No admitido/a' }[u.estado] || u.estado;

  const bloqueTFM = esDirector(u) ? '' :
    '<div class="card p-5 sm:p-6"><h2 class="font-extrabold text-lg">Mi Trabajo Fin de Máster</h2>' +
    (u.estado !== 'admitido' ? '<p class="text-sm text-gray-600 mt-1">Disponible cuando la Dirección valide tu admisión.</p>' :
      '<form data-form="tfm" class="grid gap-4 mt-3" novalidate>' +
      '<div class="field"><label for="t-titulo">Título del TFM</label><input id="t-titulo" name="titulo" maxlength="160" value="' + esc(tfm.titulo || '') + '" required></div>' +
      '<div class="field"><label for="t-repo">Repositorio (https)</label><input id="t-repo" name="repo" type="url" value="' + esc(tfm.repo || '') + '" placeholder="https://github.com/usuario/tfm-mia"></div>' +
      '<div class="field"><label for="t-resumen">Resumen (arquitectura, modelos, evaluación y análisis de riesgos EU AI Act)</label><textarea id="t-resumen" name="resumen" rows="4" maxlength="3000">' + esc(tfm.resumen || '') + '</textarea></div>' +
      '<label class="check"><input type="checkbox" name="original"' + (tfm.original ? ' checked' : '') + '> <span>Declaro la autoría original del TFM y que he documentado el uso de asistentes de IA generativa durante su desarrollo.</span></label>' +
      '<div class="text-sm" style="color:#9b2c13" id="tfm-err"></div>' +
      '<div class="flex flex-wrap gap-2 items-center"><button class="btn btn-ghost" type="submit" name="accion" value="borrador">Guardar borrador</button><button class="btn btn-primary" type="submit" name="accion" value="depositar">Depositar TFM para Tribunal</button>' +
      (tfm.estado ? '<span class="chip ' + (tfm.estado === 'depositado' ? 'chip-gold' : '') + '">' + (tfm.estado === 'depositado' ? 'Depositado el ' + fmtFecha(tfm.fecha) : 'Borrador') + '</span>' : '') + '</div></form>') +
    (u.tribunal && u.tribunal.acta && u.tribunal.acta !== 'pendiente' ? '<div class="mt-4 p-3 rounded-lg" style="background:#FAF9F5"><strong>Acta del Tribunal:</strong> ' + (u.tribunal.acta === 'apto' ? 'APTO' : 'NO APTO') + ' · Calificación ' + fmtNota(u.tribunal.final) + '</div>' : '') +
    (u.titulo ? '<a class="btn btn-primary mt-4" href="#/diploma/' + encodeURIComponent(u.email) + '">Ver mi Título de Máster</a>' : '') +
    '</div>';

  const consent = u.consentimientos ? '<ul class="text-sm mt-2 space-y-1">' +
    '<li>Datos académicos (RGPD 6.1.a/b): aceptado el ' + fmtFecha(u.consentimientos.datos.fecha, true) + ' · ' + esc(u.consentimientos.datos.version) + '</li>' +
    '<li>Compromiso ético Gobernanza IA / EU AI Act: aceptado el ' + fmtFecha(u.consentimientos.etica.fecha, true) + ' · ' + esc(u.consentimientos.etica.version) + '</li></ul>' : '';

  return '<div class="max-w-5xl mx-auto p-4 sm:p-8 grid gap-5">' +
    '<div><span class="badge-master">Mi expediente</span><h1 class="text-2xl font-extrabold mt-2">' + esc(u.nombre) + '</h1>' +
    '<p class="text-gray-600 text-sm">' + esc(u.email) + ' · ' + (esDirector(u) ? 'Director Académico del Máster' : 'Titulado/a DAM · promoción ' + esc(u.promocion) + ' · ' + estadoTxt) + '</p></div>' +
    '<div class="grid sm:grid-cols-3 gap-4">' +
    '<div class="card p-4"><div class="text-xs text-gray-500 font-bold uppercase">Progreso</div><div class="text-2xl font-extrabold">' + progresoDe(u) + '/' + TOTAL_SESIONES + '</div></div>' +
    '<div class="card p-4"><div class="text-xs text-gray-500 font-bold uppercase">Entregas</div><div class="text-2xl font-extrabold">' + mias.length + ' <span class="text-sm font-semibold text-gray-500">(' + evaluadas.length + ' evaluadas)</span></div></div>' +
    '<div class="card p-4"><div class="text-xs text-gray-500 font-bold uppercase">Media de actividades</div><div class="text-2xl font-extrabold">' + fmtNota(media) + '</div></div></div>' +
    bloqueTFM +
    '<div class="card p-5 sm:p-6"><h2 class="font-extrabold text-lg">Derecho de rectificación</h2>' +
    '<form data-form="rectificar" class="grid sm:grid-cols-2 gap-4 mt-3" novalidate>' +
    '<div class="field"><label for="p-nombre">Nombre y apellidos</label><input id="p-nombre" name="nombre" value="' + esc(u.nombre) + '" maxlength="90"></div>' +
    (esDirector(u) ? '' : '<div class="field"><label for="p-promo">Promoción DAM</label><select id="p-promo" name="promocion">' + promos + '</select></div>') +
    '<div class="sm:col-span-2"><button class="btn btn-ghost" type="submit">Guardar cambios</button></div></form></div>' +
    '<div class="card p-5 sm:p-6"><h2 class="font-extrabold text-lg">Derechos ARSOPOL</h2>' +
    '<p class="text-sm text-gray-600">Acceso · Rectificación · Supresión · Oposición · Portabilidad · Limitación. Responsable: CFP José Ramón Otero (' + ADMIN_EMAIL + ').</p>' +
    '<div class="grid sm:grid-cols-2 gap-3 mt-4">' +
    '<button class="btn btn-primary" data-act="exportar-expediente">⬇ Acceso y portabilidad: exportar expediente JSON</button>' +
    (esDirector(u) ? '<button class="btn btn-danger" disabled title="La cuenta del Director no puede suprimirse desde la plataforma">Derecho de supresión (no disponible para Dirección)</button>' :
      '<button class="btn btn-danger" data-act="suprimir">Derecho de supresión: eliminar mi cuenta</button>') +
    '<button class="btn btn-ghost" data-act="toggle-derecho" data-d="oposicion">' + (u.oposicion ? '✓ Oposición ejercida el ' + fmtFecha(u.oposicion) + ' (retirar)' : 'Derecho de oposición a tratamientos no esenciales') + '</button>' +
    '<button class="btn btn-ghost" data-act="toggle-derecho" data-d="limitacion">' + (u.limitacion ? '✓ Limitación solicitada el ' + fmtFecha(u.limitacion) + ' (retirar)' : 'Solicitar limitación del tratamiento') + '</button>' +
    '</div>' +
    '<p class="text-xs text-gray-500 mt-3">También puedes ejercer tus derechos por correo a <a class="underline" href="mailto:' + ADMIN_EMAIL + '?subject=' + encodeURIComponent('Ejercicio de derechos ARSOPOL - Máster IA') + '">' + ADMIN_EMAIL + '</a> o reclamar ante la AEPD.</p>' +
    consent + '</div></div>';
}

function expedienteDe(email) {
  const u = db.users[email];
  const copia = Object.assign({}, u);
  delete copia.hash; delete copia.salt;
  return {
    responsable: 'CFP José Ramón Otero', contacto: ADMIN_EMAIL, exportado: new Date().toISOString(),
    formato: 'JSON (art. 20 RGPD - portabilidad)', titulacion: TITULO_MASTER,
    alumno: copia,
    entregas: db.entregas.filter(e => e.email === email),
    titulo: db.titulos.filter(t => t.email === email),
    auditoria: db.audit.filter(a => a.email === email)
  };
}

function onTFM(f, submitter) {
  const u = usuarioActual();
  const err = $('#tfm-err');
  const accion = submitter && submitter.value === 'depositar' ? 'depositar' : 'borrador';
  const titulo = f.titulo.value.trim();
  const repo = f.repo.value.trim();
  if (titulo.length < 8) { err.textContent = 'El título del TFM es demasiado corto.'; return; }
  if (repo && !isHttpsUrl(repo)) { err.textContent = 'El repositorio debe ser una URL https://.'; return; }
  if (accion === 'depositar') {
    if (!repo) { err.textContent = 'Para depositar necesitas indicar el repositorio.'; return; }
    if (f.resumen.value.trim().length < 80) { err.textContent = 'El resumen debe tener al menos 80 caracteres.'; return; }
    if (!f.original.checked) { err.textContent = 'Debes declarar la autoría original del TFM.'; return; }
  }
  const previo = u.tfm || {};
  u.tfm = {
    titulo, repo, resumen: f.resumen.value.trim(), original: f.original.checked,
    estado: accion === 'depositar' ? 'depositado' : (previo.estado === 'depositado' ? 'depositado' : 'borrador'),
    fecha: accion === 'depositar' ? new Date().toISOString() : previo.fecha || null
  };
  registrarAuditoria(accion === 'depositar' ? 'Depósito del TFM' : 'Borrador del TFM', u.email);
  guardar();
  toast(accion === 'depositar' ? 'TFM depositado. El Tribunal será notificado.' : 'Borrador guardado.');
  render();
}

function modalSupresion(u) {
  abrirModal('<h2 class="text-xl font-extrabold">Derecho de supresión (art. 17 RGPD)</h2>' +
    '<p class="text-sm mt-2">Se eliminarán tu cuenta, tu progreso, tus entregas y tu TFM de la plataforma. Esta acción no se puede deshacer.</p>' +
    (u.titulo ? '<p class="text-sm mt-2 p-3 rounded" style="background:#fdf6d3">Ya tienes un título expedido: por obligación legal, el <strong>registro de títulos</strong> conservará bloqueados los datos mínimos (nombre, nº de título, fecha y calificación).</p>' : '') +
    '<p class="text-sm mt-3">Te recomendamos <button class="underline font-semibold" data-act="exportar-expediente">exportar tu expediente</button> antes de continuar.</p>' +
    '<form data-form="suprimir" class="mt-4 grid gap-3"><div class="field"><label for="sup-email">Escribe tu correo para confirmar</label><input id="sup-email" name="email" autocomplete="off"></div>' +
    '<div class="text-sm" style="color:#9b2c13" id="sup-err"></div>' +
    '<div class="flex gap-2 justify-end"><button class="btn btn-ghost" type="button" data-act="cerrar-modal">Cancelar</button><button class="btn btn-danger" type="submit">Suprimir definitivamente</button></div></form>');
}

/* ---------------------------------------------------------------------
 *  Panel de Dirección
 * ------------------------------------------------------------------- */
const SUBDIR = [
  ['admisiones', 'Admisiones'], ['seguimiento', 'Seguimiento de sesiones'], ['calificaciones', 'Calificación de repositorios'],
  ['tribunal', 'Tribunal de TFM'], ['titulos', 'Títulos expedidos'], ['datos', 'Datos y auditoría']
];

function vistaDireccion(u, sub) {
  if (!esDirector(u)) return '<div class="p-8">Acceso restringido a la Dirección del Máster.</div>';
  if (!SUBDIR.some(s => s[0] === sub)) sub = 'admisiones';
  const pendientesAdm = alumnos().filter(a => a.estado === 'pendiente').length;
  const pendientesEnt = db.entregas.filter(e => e.estado === 'pendiente').length;
  const tfmDep = alumnos().filter(a => a.tfm && a.tfm.estado === 'depositado' && !a.titulo).length;
  const contador = { admisiones: pendientesAdm, calificaciones: pendientesEnt, tribunal: tfmDep };
  let cuerpo = '';
  if (sub === 'admisiones') cuerpo = dirAdmisiones();
  else if (sub === 'seguimiento') cuerpo = dirSeguimiento();
  else if (sub === 'calificaciones') cuerpo = dirCalificaciones();
  else if (sub === 'tribunal') cuerpo = dirTribunal();
  else if (sub === 'titulos') cuerpo = dirTitulos();
  else cuerpo = dirDatos();
  return '<div class="max-w-6xl mx-auto p-4 sm:p-8">' +
    '<div class="card p-5 sm:p-6" style="background:#111;color:#fff;border-color:#111"><div class="flex flex-wrap items-center gap-3">' +
    '<span class="badge-master">★ Panel de Dirección</span><span class="text-white/60 text-sm">' + ADMIN_NAME + ' · Director Académico · ' + ADMIN_EMAIL + '</span></div>' +
    '<h1 class="text-2xl font-extrabold mt-2">' + esc(TITULO_MASTER) + '</h1>' +
    '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">' +
    statDark('Alumnado', alumnos().length) + statDark('Admisiones pendientes', pendientesAdm) + statDark('Entregas por calificar', pendientesEnt) + statDark('Títulos expedidos', db.titulos.length) +
    '</div></div>' +
    '<div class="tabs mt-4 bg-white rounded-t-xl px-2 border" style="border-color:var(--line)">' +
    SUBDIR.map(s => '<a class="tab no-underline" aria-selected="' + (s[0] === sub) + '" href="#/direccion/' + s[0] + '">' + s[1] + (contador[s[0]] ? ' <span class="chip chip-gold" style="padding:.05rem .4rem">' + contador[s[0]] + '</span>' : '') + '</a>').join('') +
    '</div><div class="mt-4">' + cuerpo + '</div></div>';
}
function statDark(etq, v) {
  return '<div class="rounded-xl p-3" style="background:rgba(255,255,255,.07)"><div class="text-[.7rem] uppercase tracking-wide text-white/55 font-bold">' + etq + '</div><div class="text-2xl font-extrabold" style="color:#efcd2f">' + v + '</div></div>';
}

function dirAdmisiones() {
  const lista = alumnos().sort((a, b) => (a.estado === 'pendiente' ? -1 : 1) - (b.estado === 'pendiente' ? -1 : 1) || b.creado.localeCompare(a.creado));
  const filas = lista.map(a => '<tr><td><strong>' + esc(a.nombre) + '</strong><div class="text-xs text-gray-500">' + esc(a.email) + '</div></td>' +
    '<td>DAM ' + esc(a.promocion) + (a.centro ? '<div class="text-xs text-gray-500">' + esc(a.centro) + '</div>' : '') + '</td>' +
    '<td>' + (a.via && a.via.indexOf('codigo:') === 0 ? 'Código ' + esc(a.via.slice(7)) : 'Dominio @jrotero.es') + '<div class="text-xs text-gray-500">' + fmtFecha(a.creado) + '</div></td>' +
    '<td><span class="chip ' + (a.estado === 'admitido' ? 'chip-sage' : a.estado === 'pendiente' ? 'chip-gold' : 'chip-terra') + '">' + esc(a.estado) + '</span></td>' +
    '<td class="whitespace-nowrap">' + (a.estado !== 'admitido' ? '<button class="btn btn-primary btn-sm" data-act="admitir" data-email="' + esc(a.email) + '">Admitir</button> ' : '') +
    (a.estado !== 'rechazado' ? '<button class="btn btn-danger btn-sm" data-act="rechazar" data-email="' + esc(a.email) + '">Rechazar</button>' : '') + '</td></tr>').join('');
  const codigos = db.codigos.slice().reverse().map(x => '<tr><td class="font-mono font-bold">' + esc(x.codigo) + '</td><td>' + fmtFecha(x.creado) + '</td><td>' + (x.nota ? esc(x.nota) : '—') + '</td>' +
    '<td>' + (x.usadoPor ? 'Usado por ' + esc(x.usadoPor) : x.revocado ? 'Revocado' : '<span class="chip chip-sage">Disponible</span>') + '</td>' +
    '<td>' + (!x.usadoPor && !x.revocado ? '<button class="btn btn-ghost btn-sm" data-act="copiar-texto" data-texto="' + esc(x.codigo) + '">Copiar</button> <button class="btn btn-danger btn-sm" data-act="revocar-codigo" data-codigo="' + esc(x.codigo) + '">Revocar</button>' : '') + '</td></tr>').join('');
  return '<div class="grid gap-5"><div class="card p-5"><h2 class="font-extrabold text-lg mb-3">Solicitudes de admisión de titulados DAM</h2>' +
    (filas ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Alumno/a</th><th>Titulación</th><th>Vía</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + filas + '</tbody></table></div>' : '<p class="text-sm text-gray-500">Todavía no hay solicitudes.</p>') + '</div>' +
    '<div class="card p-5"><h2 class="font-extrabold text-lg">Códigos de admisión de posgrado</h2><p class="text-sm text-gray-600">Para titulados DAM con correo externo. Un código admite directamente al alumno y solo puede usarse una vez.</p>' +
    '<form data-form="codigo" class="flex flex-wrap gap-2 mt-3"><div class="field flex-1 min-w-[200px]"><input name="nota" placeholder="Referencia (opcional): p. ej. Promoción DAM 2025 · IES Externo" maxlength="80"></div><button class="btn btn-primary" type="submit">Generar código</button></form>' +
    (codigos ? '<div class="tbl-wrap mt-4"><table class="tbl"><thead><tr><th>Código</th><th>Emitido</th><th>Referencia</th><th>Estado</th><th></th></tr></thead><tbody>' + codigos + '</tbody></table></div>' : '') + '</div></div>';
}

function dirSeguimiento() {
  const lista = alumnos();
  if (!lista.length) return '<div class="card p-5 text-sm text-gray-500">No hay alumnado registrado.</div>';
  const filas = lista.map(a => {
    const p = progresoDe(a);
    const ent = db.entregas.filter(e => e.email === a.email);
    const ev = ent.filter(e => e.estado === 'evaluada');
    const media = ev.length ? ev.reduce((s, e) => s + e.nota, 0) / ev.length : null;
    let celdas = '';
    for (let n = 0; n <= ULTIMA_SESION; n++) {
      const m = moduloDe(n);
      const ok = a.progreso && a.progreso[n];
      celdas += '<span title="Sesión ' + n + '" style="display:inline-block;width:9px;height:14px;margin-right:1px;border-radius:2px;background:' + (ok ? colorMod(m) : '#ece9df') + '"></span>';
    }
    return '<tr><td><strong>' + esc(a.nombre) + '</strong><div class="text-xs text-gray-500">' + esc(a.email) + '</div></td><td><span class="chip">' + esc(a.estado) + '</span></td>' +
      '<td class="whitespace-nowrap">' + celdas + '<div class="text-xs text-gray-500 mt-1">' + p + '/' + TOTAL_SESIONES + '</div></td>' +
      '<td>' + ent.length + ' (' + ev.length + ' eval.)</td><td><strong>' + fmtNota(media) + '</strong></td>' +
      '<td>' + (a.tfm ? esc(a.tfm.estado) : '—') + '</td></tr>';
  }).join('');
  return '<div class="card p-5"><h2 class="font-extrabold text-lg mb-3">Seguimiento de las sesiones</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Alumno/a</th><th>Estado</th><th>Sesiones (S0 → S28)</th><th>Entregas</th><th>Media</th><th>TFM</th></tr></thead><tbody>' + filas + '</tbody></table></div></div>';
}

function dirCalificaciones() {
  const f = ui.filtroEntregas;
  const lista = db.entregas.filter(e => f === 'todas' || e.estado === 'pendiente').slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const items = lista.map(e => {
    const a = db.users[e.email];
    return '<form data-form="calificar" data-id="' + e.id + '" class="card p-4 grid md:grid-cols-[1fr_260px] gap-4">' +
      '<div class="min-w-0"><div class="flex flex-wrap gap-2 items-center"><span class="chip chip-gold">Sesión ' + e.sesion + '</span><strong>' + esc(a ? a.nombre : e.email) + '</strong><span class="text-xs text-gray-500">' + fmtFecha(e.fecha, true) + '</span></div>' +
      '<div class="mt-1 text-sm truncate">' + esc(sesion(e.sesion).actividad.titulo.replace(/<[^>]+>/g, '')) + '</div>' +
      '<a class="underline text-sm break-all font-semibold" href="' + esc(e.repo) + '" target="_blank" rel="noopener noreferrer">' + esc(e.repo) + '</a>' +
      (e.commit ? '<div class="text-xs text-gray-500">Rama/commit: ' + esc(e.commit) + '</div>' : '') +
      (e.notas ? '<div class="mt-2 text-sm p-2 rounded" style="background:#FAF9F5">' + esc(e.notas) + '</div>' : '') + '</div>' +
      '<div class="grid gap-2"><div class="field"><label>Nota (0–10)</label><input name="nota" type="number" min="0" max="10" step="0.25" value="' + (e.nota != null ? e.nota : '') + '" required></div>' +
      '<div class="field"><label>Feedback</label><textarea name="feedback" rows="2" maxlength="1500">' + esc(e.feedback || '') + '</textarea></div>' +
      '<button class="btn btn-primary btn-sm" type="submit">' + (e.estado === 'evaluada' ? 'Actualizar calificación' : 'Validar y calificar') + '</button></div></form>';
  }).join('');
  return '<div class="flex gap-2 mb-3"><button class="btn btn-sm ' + (f === 'pendientes' ? 'btn-dark' : 'btn-ghost') + '" data-act="filtro-entregas" data-f="pendientes">Pendientes</button><button class="btn btn-sm ' + (f === 'todas' ? 'btn-dark' : 'btn-ghost') + '" data-act="filtro-entregas" data-f="todas">Todas</button></div>' +
    (items ? '<div class="grid gap-3">' + items + '</div>' : '<div class="card p-5 text-sm text-gray-500">No hay entregas ' + (f === 'pendientes' ? 'pendientes de calificación' : 'registradas') + '.</div>');
}

function notaFinalTFM(t) {
  if (!t) return null;
  let total = 0;
  for (const r of RUBRICA_TFM) {
    const v = Number(t[r[0]]);
    if (t[r[0]] === '' || t[r[0]] == null || isNaN(v)) return null;
    total += v * r[2];
  }
  return Math.round(total * 100) / 100;
}

function dirTribunal() {
  const lista = alumnos().filter(a => a.estado === 'admitido');
  if (!lista.length) return '<div class="card p-5 text-sm text-gray-500">No hay alumnado admitido todavía.</div>';
  return '<div class="grid gap-4">' + lista.map(a => {
    const t = a.tribunal || {};
    const tfm = a.tfm;
    const final = notaFinalTFM(t);
    const puedeEmitir = tfm && tfm.estado === 'depositado' && t.acta === 'apto' && final != null && final >= 5 && !a.titulo;
    return '<div class="card p-5"><div class="flex flex-wrap items-center gap-2"><strong class="text-lg">' + esc(a.nombre) + '</strong><span class="text-sm text-gray-500">' + esc(a.email) + ' · DAM ' + esc(a.promocion) + ' · ' + progresoDe(a) + '/' + TOTAL_SESIONES + ' sesiones</span>' +
      (a.titulo ? '<span class="badge-master ml-auto">Título nº ' + esc(a.titulo.numero) + '</span>' : '<span class="chip ml-auto">' + (tfm ? 'TFM ' + esc(tfm.estado) : 'Sin TFM') + '</span>') + '</div>' +
      (tfm ? '<div class="mt-3 p-3 rounded-lg text-sm" style="background:#FAF9F5"><div class="font-bold">' + esc(tfm.titulo) + '</div>' +
        (tfm.repo ? '<a class="underline break-all" href="' + esc(tfm.repo) + '" target="_blank" rel="noopener noreferrer">' + esc(tfm.repo) + '</a>' : '') +
        (tfm.resumen ? '<p class="mt-1 text-gray-700">' + esc(tfm.resumen) + '</p>' : '') + '</div>' : '<p class="text-sm text-gray-500 mt-2">El alumno/a aún no ha registrado su TFM.</p>') +
      (tfm && tfm.estado === 'depositado' ? '<form data-form="tribunal" data-email="' + esc(a.email) + '" class="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">' +
        RUBRICA_TFM.map(r => '<div class="field"><label>' + r[1] + ' (' + Math.round(r[2] * 100) + ' %)</label><input name="' + r[0] + '" type="number" min="0" max="10" step="0.25" value="' + (t[r[0]] != null ? esc(t[r[0]]) : '') + '"' + (a.titulo ? ' disabled' : '') + '></div>').join('') +
        '<div class="field sm:col-span-2"><label>Observaciones del Tribunal</label><textarea name="observaciones" rows="2" maxlength="2000"' + (a.titulo ? ' disabled' : '') + '>' + esc(t.observaciones || '') + '</textarea></div>' +
        '<div class="field"><label>Acta</label><select name="acta"' + (a.titulo ? ' disabled' : '') + '>' + ['pendiente', 'apto', 'no apto'].map(o => '<option value="' + o + '"' + ((t.acta || 'pendiente') === o ? ' selected' : '') + '>' + o.toUpperCase() + '</option>').join('') + '</select></div>' +
        '<div class="flex flex-col justify-end"><div class="text-xs text-gray-500">Calificación ponderada</div><div class="text-2xl font-extrabold">' + fmtNota(final) + ' <span class="text-sm font-semibold text-gray-500">' + calificacionTexto(final) + '</span></div></div>' +
        '<div class="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-2">' +
        (a.titulo ? '<a class="btn btn-primary" href="#/diploma/' + encodeURIComponent(a.email) + '">Ver diploma</a>' :
          '<button class="btn btn-ghost" type="submit">Guardar acta</button>' +
          '<button class="btn btn-primary" type="button" data-act="emitir-titulo" data-email="' + esc(a.email) + '"' + (puedeEmitir ? '' : ' disabled title="Requiere TFM depositado, acta APTO y calificación ≥ 5 guardadas"') + '>★ Emitir Título Propio de Máster</button>') +
        '</div></form>' : '') + '</div>';
  }).join('') + '</div>';
}

function dirTitulos() {
  if (!db.titulos.length) return '<div class="card p-5 text-sm text-gray-500">Aún no se ha expedido ningún título.</div>';
  return '<div class="card p-5"><h2 class="font-extrabold text-lg mb-3">Registro de Títulos Propios de Máster expedidos</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº de título</th><th>Titular</th><th>Fecha</th><th>Calificación</th><th>Código de verificación</th><th></th></tr></thead><tbody>' +
    db.titulos.slice().reverse().map(t => '<tr><td class="font-mono font-bold">' + esc(t.numero) + '</td><td>' + esc(t.nombre) + (t.suprimido ? ' <span class="chip">bloqueado</span>' : '') + '</td><td>' + fmtFecha(t.fecha) + '</td><td>' + fmtNota(t.nota) + ' · ' + calificacionTexto(t.nota) + '</td><td class="font-mono text-xs">' + esc(t.verificacion) + '</td>' +
      '<td>' + (db.users[t.email] ? '<a class="btn btn-ghost btn-sm" href="#/diploma/' + encodeURIComponent(t.email) + '">Ver</a>' : '') + '</td></tr>').join('') +
    '</tbody></table></div></div>';
}

function dirDatos() {
  return '<div class="grid gap-4 md:grid-cols-2"><div class="card p-5"><h2 class="font-extrabold">Copia de seguridad</h2><p class="text-sm text-gray-600 mt-1">El prototipo guarda los datos en este navegador. Exporta la base de datos para trasladarla o archivarla (incluye hashes PBKDF2, nunca contraseñas en claro).</p>' +
    '<div class="flex flex-wrap gap-2 mt-3"><button class="btn btn-primary" data-act="exportar-db">Exportar base de datos</button>' +
    '<label class="btn btn-ghost cursor-pointer">Importar copia<input type="file" accept="application/json" data-act-change="importar-db" class="hidden"></label></div></div>' +
    '<div class="card p-5"><h2 class="font-extrabold">Restablecer prototipo</h2><p class="text-sm text-gray-600 mt-1">Borra todo el alumnado, entregas y títulos de este navegador. Mantiene la cuenta del Director.</p><button class="btn btn-danger mt-3" data-act="reset-db">Restablecer datos</button></div>' +
    '<div class="card p-5 md:col-span-2"><h2 class="font-extrabold mb-2">Registro de auditoría (últimos 60 eventos)</h2>' +
    (db.audit.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Acción</th><th>Usuario</th></tr></thead><tbody>' + db.audit.slice(0, 60).map(a => '<tr><td class="whitespace-nowrap">' + fmtFecha(a.fecha, true) + '</td><td>' + esc(a.accion) + '</td><td>' + esc(a.email || '—') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="text-sm text-gray-500">Sin eventos.</p>') +
    '</div></div>';
}

async function emitirTitulo(email) {
  const a = db.users[email];
  const t = a && a.tribunal;
  const final = notaFinalTFM(t);
  if (!a || a.titulo || !a.tfm || a.tfm.estado !== 'depositado' || !t || t.acta !== 'apto' || final == null || final < 5) {
    toast('No se cumplen los requisitos para emitir el título.', 'bad'); return;
  }
  const año = new Date().getFullYear();
  const secuencia = db.titulos.filter(x => x.numero.indexOf('MIA-JRO-' + año) === 0).length + 1;
  const numero = 'MIA-JRO-' + año + '-' + String(secuencia).padStart(4, '0');
  const fecha = new Date().toISOString();
  const verificacion = (await sha256Hex([numero, email, final, fecha].join('|'))).slice(0, 16).toUpperCase().match(/.{4}/g).join('-');
  a.titulo = { numero, fecha, nota: final, verificacion };
  db.titulos.push({ numero, email, nombre: a.nombre, promocion: a.promocion, fecha, nota: final, verificacion, tfm: a.tfm.titulo });
  registrarAuditoria('Emisión del Título Propio de Máster ' + numero, email);
  guardar();
  toast('Título ' + numero + ' expedido.');
  ir('diploma/' + encodeURIComponent(email));
}

/* ---------------------------------------------------------------------
 *  Diploma oficial del Máster
 * ------------------------------------------------------------------- */
function selloOro() {
  return '<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">' +
    '<defs><path id="sello-c" d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0"/></defs>' +
    '<g fill="#efcd2f">' + Array.from({ length: 24 }, (_, i) => '<rect x="56" y="2" width="8" height="14" rx="2" transform="rotate(' + (i * 15) + ' 60 60)"/>').join('') + '</g>' +
    '<circle cx="60" cy="60" r="52" fill="#efcd2f" stroke="#8a7408" stroke-width="2"/>' +
    '<circle cx="60" cy="60" r="34" fill="none" stroke="#111" stroke-width="1.2"/>' +
    '<text font-family="Inter, sans-serif" font-size="8.4" font-weight="800" letter-spacing="1.6" fill="#111"><textPath href="#sello-c">FP JOSÉ RAMÓN OTERO · MÁSTER IA ·</textPath></text>' +
    '<g transform="translate(44 44) scale(.32)"><rect width="100" height="100" rx="18" fill="#111"/><path d="M14 14C32 28 50 38 71 44A21 21 0 1 1 44 71C37 50 28 32 14 14Z" fill="#efcd2f"/></g></svg>';
}

function vistaDiploma(u, email) {
  const a = db.users[email];
  if (!a || (!esDirector(u) && u.email !== email)) return '<div class="p-8">No tienes acceso a este diploma.</div>';
  if (!a.titulo) return '<div class="max-w-3xl mx-auto p-8"><div class="card p-6">Este alumno/a todavía no tiene el título expedido.</div></div>';
  const t = a.titulo;
  return '<div class="max-w-6xl mx-auto p-4 sm:p-8">' +
    '<div class="flex flex-wrap gap-2 mb-4"><button class="btn btn-primary" data-act="imprimir">🖨 Imprimir / Guardar como PDF</button>' +
    '<a class="btn btn-ghost" href="' + (esDirector(u) ? '#/direccion/titulos' : '#/perfil') + '">Volver</a></div>' +
    '<div class="overflow-x-auto"><div class="diploma" style="min-width:760px">' +
    '<div class="watermark">' + isotipo(600, '#111', '#fffdf6') + '</div>' +
    '<div class="flex items-start justify-between relative">' + logoCompleto(52) +
    '<div class="text-right text-[11px] leading-tight text-gray-600">Registro de Títulos Propios<br><strong class="font-mono text-[13px] text-black">' + esc(t.numero) + '</strong></div></div>' +
    '<div class="text-center relative">' +
    '<div class="text-[12px] tracking-[.35em] uppercase font-bold" style="color:#8a7408">Formación Profesional José Ramón Otero</div>' +
    '<div class="text-[13px] mt-2 text-gray-700">en atención a que</div>' +
    '<h1 class="text-[40px] leading-tight mt-1" style="font-weight:700">' + esc(a.nombre) + '</h1>' +
    '<div class="text-[13px] text-gray-700 mt-1">Técnico Superior en Desarrollo de Aplicaciones Multiplataforma (promoción ' + esc(a.promocion) + ')</div>' +
    '<div class="text-[13px] text-gray-700 mt-3 max-w-[640px] mx-auto">ha superado las 28 sesiones de los 7 módulos del programa y ha defendido con la calificación de <strong>' + fmtNota(t.nota) + ' (' + calificacionTexto(t.nota) + ')</strong> ante el Tribunal Académico el Trabajo Fin de Máster «' + esc(a.tfm ? a.tfm.titulo : '') + '», expide el presente</div>' +
    '<div class="mt-4 inline-block px-5 py-1.5 font-extrabold tracking-[.18em] uppercase text-[13px]" style="background:#efcd2f;color:#111">Título Propio de Máster</div>' +
    '<h2 class="font-serif text-[23px] leading-snug mt-3 max-w-[760px] mx-auto" style="font-family:\'Playfair Display\',Georgia,serif;font-weight:600">en Ingeniería de Inteligencia Artificial, LLMs y Arquitecturas Cognitivas para Desarrolladores</h2>' +
    '</div>' +
    '<div class="flex items-end justify-between relative">' +
    '<div class="text-[11px] text-gray-700 leading-snug"><div>Expedido el ' + fmtFecha(t.fecha) + '</div><div>Código de verificación: <span class="font-mono font-bold">' + esc(t.verificacion) + '</span></div><div class="mt-1 max-w-[260px] text-gray-500">Título propio del centro; no es un título universitario oficial.</div></div>' +
    '<div class="flex flex-col items-center">' + selloOro() + '</div>' +
    '<div class="text-center text-[12px]"><div class="font-serif italic text-[22px]" style="font-family:\'Playfair Display\',Georgia,serif">Omar Romero</div><div class="border-t border-black pt-1 mt-1 w-[220px]">' + ADMIN_NAME + '<br>Director Académico del Máster · Presidente del Tribunal</div></div>' +
    '</div></div></div></div>';
}

/* ---------------------------------------------------------------------
 *  Modal
 * ------------------------------------------------------------------- */
function abrirModal(html) {
  $('#modal-root').innerHTML = '<div class="modal-back" data-act="cerrar-modal-fondo"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
  const primero = $('#modal-root input, #modal-root button');
  if (primero) primero.focus();
}
function cerrarModal() { $('#modal-root').innerHTML = ''; }

/* ---------------------------------------------------------------------
 *  Render principal
 * ------------------------------------------------------------------- */
function render() {
  const u = usuarioActual();
  const app = $('#app');
  if (!u) {
    if (ui.authVista === 'setup' && db.users[ADMIN_EMAIL].hash) ui.authVista = 'login';
    app.innerHTML = vistaAuth();
    return;
  }
  const r = ruta();
  let actual = r[0] || 'inicio';
  let contenido = '';
  if (actual === 'sesion') {
    const num = parseInt(r[1], 10);
    const n = Math.min(ULTIMA_SESION, Math.max(0, isNaN(num) ? 0 : num));
    contenido = vistaSesion(u, n, r[2] || 'teoria');
    actual = 's' + n;
  } else if (actual === 'perfil') contenido = vistaPerfil(u);
  else if (actual === 'programa') contenido = vistaPrograma();
  else if (actual === 'direccion') contenido = vistaDireccion(u, r[1]);
  else if (actual === 'diploma') contenido = vistaDiploma(u, r[1]);
  else { actual = 'inicio'; contenido = vistaInicio(u); }

  app.innerHTML = cabecera(u) + '<div class="layout">' + barraLateral(u, actual) + '<main id="main" class="min-w-0">' + contenido +
    '<footer class="max-w-5xl mx-auto px-4 sm:px-8 pb-10 pt-4 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1"><span>© ' + new Date().getFullYear() + ' ' + CENTRO + '</span>' +
    '<button class="underline" data-act="segunda-capa">Protección de datos</button><span>Contacto: ' + ADMIN_EMAIL + '</span></footer></main></div>';
  resaltar();
}

/* ---------------------------------------------------------------------
 *  Eventos (delegación)
 * ------------------------------------------------------------------- */
const acciones = {
  'auth-vista': el => { ui.authVista = el.dataset.v; render(); },
  'segunda-capa': () => modalSegundaCapa(),
  'cerrar-modal': () => cerrarModal(),
  'cerrar-modal-fondo': (el, e) => { if (e.target === el) cerrarModal(); },
  'logout': () => {
    const u = usuarioActual();
    if (u) { registrarAuditoria('Cierre de sesión', u.email); guardar(); }
    setSesionEmail(null); ui.authVista = 'login'; location.hash = ''; render();
  },
  'toggle-side': () => { ui.sideAbierta = !ui.sideAbierta; const s = $('.sidebar'); if (s) s.classList.toggle('open', ui.sideAbierta); },
  'toggle-mod': el => {
    const id = Number(el.dataset.m);
    if (ui.modsCerrados.has(id)) ui.modsCerrados.delete(id); else ui.modsCerrados.add(id);
    const scroll = $('.sidebar') ? $('.sidebar').scrollTop : 0;
    render();
    if ($('.sidebar')) $('.sidebar').scrollTop = scroll;
  },
  'copiar': el => copiarTexto(codigoPorId[el.dataset.id], el),
  'copiar-texto': el => copiarTexto(el.dataset.texto, el),
  'toggle-hecho': el => {
    const u = usuarioActual(); const n = Number(el.dataset.n);
    u.progreso = u.progreso || {};
    if (u.progreso[n]) delete u.progreso[n]; else u.progreso[n] = new Date().toISOString();
    guardar(); render();
    if (u.progreso[n]) toast('Sesión ' + n + ' completada. ' + progresoDe(u) + '/' + TOTAL_SESIONES);
  },
  'exportar-expediente': () => {
    const u = usuarioActual();
    registrarAuditoria('Derecho de acceso/portabilidad: exportación JSON', u.email); guardar();
    descargar('expediente-master-ia-' + u.email.replace(/[^a-z0-9]/gi, '_') + '.json', JSON.stringify(expedienteDe(u.email), null, 2));
    toast('Expediente exportado en formato JSON.');
  },
  'suprimir': () => modalSupresion(usuarioActual()),
  'toggle-derecho': el => {
    const u = usuarioActual(); const d = el.dataset.d;
    u[d] = u[d] ? null : new Date().toISOString();
    registrarAuditoria((d === 'oposicion' ? 'Derecho de oposición ' : 'Limitación del tratamiento ') + (u[d] ? 'ejercido' : 'retirado'), u.email);
    guardar(); render();
  },
  'admitir': el => cambiarEstado(el.dataset.email, 'admitido'),
  'rechazar': el => cambiarEstado(el.dataset.email, 'rechazado'),
  'revocar-codigo': el => {
    const x = db.codigos.find(k => k.codigo === el.dataset.codigo);
    if (x) { x.revocado = new Date().toISOString(); registrarAuditoria('Revocación del código ' + x.codigo, ADMIN_EMAIL); guardar(); render(); }
  },
  'filtro-entregas': el => { ui.filtroEntregas = el.dataset.f; render(); },
  'emitir-titulo': el => {
    const a = db.users[el.dataset.email];
    abrirModal('<h2 class="text-xl font-extrabold">Emitir Título Propio de Máster</h2><p class="text-sm mt-2">Se expedirá el título a <strong>' + esc(a.nombre) + '</strong> con calificación <strong>' + fmtNota(notaFinalTFM(a.tribunal)) + '</strong> y quedará inscrito en el Registro de Títulos. El acta quedará cerrada.</p>' +
      '<div class="flex justify-end gap-2 mt-5"><button class="btn btn-ghost" data-act="cerrar-modal">Cancelar</button><button class="btn btn-primary" data-act="confirmar-titulo" data-email="' + esc(a.email) + '">★ Emitir título</button></div>');
  },
  'confirmar-titulo': el => { cerrarModal(); emitirTitulo(el.dataset.email); },
  'imprimir': () => window.print(),
  'exportar-db': () => {
    registrarAuditoria('Exportación de la base de datos', ADMIN_EMAIL); guardar();
    descargar('master-ia-jro-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(db, null, 2));
  },
  'reset-db': () => abrirModal('<h2 class="text-xl font-extrabold">Restablecer datos</h2><p class="text-sm mt-2">Se eliminará todo el alumnado, las entregas, los códigos y el registro de títulos de este navegador.</p><div class="flex justify-end gap-2 mt-5"><button class="btn btn-ghost" data-act="cerrar-modal">Cancelar</button><button class="btn btn-danger" data-act="confirmar-reset">Restablecer</button></div>'),
  'confirmar-reset': () => {
    const admin = db.users[ADMIN_EMAIL];
    db = normalizarDB({ users: { [ADMIN_EMAIL]: admin } });
    registrarAuditoria('Restablecimiento del prototipo', ADMIN_EMAIL);
    guardar(); cerrarModal(); toast('Datos restablecidos.'); render();
  }
};

function cambiarEstado(email, estado) {
  const a = db.users[email];
  if (!a) return;
  a.estado = estado;
  a.fechaResolucion = new Date().toISOString();
  registrarAuditoria('Admisión: ' + estado, email);
  guardar(); render();
  toast(a.nombre + ': ' + (estado === 'admitido' ? 'admitido/a en el Máster' : 'solicitud rechazada'));
}

function copiarTexto(texto, el) {
  const ok = () => { const prev = el.textContent; el.textContent = '¡Copiado!'; setTimeout(() => { el.textContent = prev; }, 1400); };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(ok, () => copiarFallback(texto) && ok());
  } else if (copiarFallback(texto)) ok();
}
function copiarFallback(texto) {
  const ta = document.createElement('textarea');
  ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  if (!ok) toast('No se pudo copiar automáticamente.', 'bad');
  return ok;
}

const formularios = {
  login: f => onLogin(f),
  setup: f => onSetup(f),
  registro: f => onRegistro(f),
  entrega: f => onEntrega(f),
  tfm: (f, sub) => onTFM(f, sub),
  rectificar: f => {
    const u = usuarioActual();
    const nombre = f.nombre.value.trim();
    if (nombre.length < 5) { toast('El nombre es demasiado corto.', 'bad'); return; }
    u.nombre = nombre;
    if (f.promocion) u.promocion = f.promocion.value;
    registrarAuditoria('Derecho de rectificación', u.email);
    guardar(); toast('Datos rectificados.'); render();
  },
  suprimir: f => {
    const u = usuarioActual();
    if (f.email.value.trim().toLowerCase() !== u.email) { $('#sup-err').textContent = 'El correo no coincide.'; return; }
    db.titulos.forEach(t => { if (t.email === u.email) { t.suprimido = new Date().toISOString(); t.email = null; delete t.promocion; } });
    db.entregas = db.entregas.filter(e => e.email !== u.email);
    db.audit.forEach(a => { if (a.email === u.email) a.email = '[suprimido]'; });
    if (u.via && u.via.indexOf('codigo:') === 0) {
      const cod = db.codigos.find(x => x.usadoPor === u.email);
      if (cod) cod.usadoPor = '[suprimido]';
    }
    delete db.users[u.email];
    registrarAuditoria('Derecho de supresión ejercido por un alumno', null);
    guardar(); cerrarModal(); setSesionEmail(null); location.hash = '';
    toast('Tu cuenta y tus datos se han suprimido.'); render();
  },
  codigo: f => {
    const parte = () => uid().slice(0, 4).toUpperCase();
    let codigo;
    do { codigo = 'MIA-' + parte() + '-' + parte(); } while (db.codigos.some(x => x.codigo === codigo));
    db.codigos.push({ codigo, creado: new Date().toISOString(), nota: f.nota.value.trim(), usadoPor: null, revocado: null });
    registrarAuditoria('Emisión de código de admisión ' + codigo, ADMIN_EMAIL);
    guardar(); render(); toast('Código ' + codigo + ' generado.');
  },
  calificar: f => {
    const e = db.entregas.find(x => x.id === f.dataset.id);
    const nota = Number(f.nota.value);
    if (f.nota.value === '' || isNaN(nota) || nota < 0 || nota > 10) { toast('La nota debe estar entre 0 y 10.', 'bad'); return; }
    e.nota = nota; e.feedback = f.feedback.value.trim(); e.estado = 'evaluada'; e.fechaEvaluacion = new Date().toISOString();
    registrarAuditoria('Calificación de la entrega de la Sesión ' + e.sesion + ' (' + fmtNota(nota) + ')', e.email);
    guardar(); render(); toast('Entrega calificada con ' + fmtNota(nota) + '.');
  },
  tribunal: f => {
    const a = db.users[f.dataset.email];
    const t = a.tribunal || {};
    for (const r of RUBRICA_TFM) {
      const raw = f[r[0]].value;
      if (raw === '') { t[r[0]] = null; continue; }
      const v = Number(raw);
      if (isNaN(v) || v < 0 || v > 10) { toast('Las notas del Tribunal deben estar entre 0 y 10.', 'bad'); return; }
      t[r[0]] = v;
    }
    t.observaciones = f.observaciones.value.trim();
    t.acta = f.acta.value;
    t.final = notaFinalTFM(t);
    if (t.acta === 'apto' && (t.final == null || t.final < 5)) { toast('Un acta APTO requiere las 4 notas y una calificación ≥ 5.', 'bad'); return; }
    a.tribunal = t;
    registrarAuditoria('Acta del Tribunal de TFM: ' + t.acta.toUpperCase(), a.email);
    guardar(); render(); toast('Acta guardada.');
  }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = acciones[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('submit', e => {
  const f = e.target;
  const fn = formularios[f.dataset.form];
  if (!fn) return;
  e.preventDefault();
  fn(f, e.submitter);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.actChange === 'importar-db' && el.files && el.files[0]) {
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const datos = JSON.parse(lector.result);
        if (!datos || typeof datos !== 'object' || !datos.users) throw new Error('formato');
        const adminActual = db.users[ADMIN_EMAIL];
        db = normalizarDB(datos);
        if (!db.users[ADMIN_EMAIL].hash && adminActual.hash) db.users[ADMIN_EMAIL] = adminActual;
        registrarAuditoria('Importación de copia de seguridad', ADMIN_EMAIL);
        guardar(); toast('Copia importada.'); render();
      } catch (err) { toast('El archivo no es una copia válida de la plataforma.', 'bad'); }
    };
    lector.readAsText(el.files[0]);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal-root').innerHTML) cerrarModal(); });
window.addEventListener('hashchange', () => {
  ui.sideAbierta = false;
  const r = ruta();
  if (r[0] === 'sesion') {
    const num = parseInt(r[1], 10);
    const m = moduloDe(isNaN(num) ? 0 : num);
    if (m) ui.modsCerrados.delete(m.id);
  }
  render();
  const main = $('#main');
  if (main) window.scrollTo({ top: 0 });
});
window.addEventListener('storage', e => { if (e.key === DB_KEY) { db = cargarDB(); render(); } });

/* ---------------------------------------------------------------------
 *  Arranque
 * ------------------------------------------------------------------- */
(function arrancar() {
  render();
  window.addEventListener('load', resaltar);       // highlight.js llega con defer desde el CDN
  const img = new Image();
  img.onload = () => { LOGO_PNG = true; render(); };
  img.src = 'logo-jrotero.png';
})();
