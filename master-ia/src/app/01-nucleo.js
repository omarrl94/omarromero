'use strict';

/* =====================================================================
 *  Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma
 *  Centro de Formación Profesional JOSÉ RAMÓN OTERO · Plataforma LMS
 *  Archivo único. Datos en Firebase (producción) o en el navegador (demostración).
 *  Ver master-ia/README.md y master-ia/DESPLIEGUE.md.
 * ===================================================================== */

const ADMIN_EMAIL = 'omar.romero@jrotero.es';
const ADMIN_NAME = 'Omar Romero';
const CENTRO = 'Centro de Formación Profesional José Ramón Otero';
const CENTRO_MAYUS = 'CENTRO DE FORMACIÓN PROFESIONAL JOSÉ RAMÓN OTERO';
const TITULO_MASTER = 'Máster en Inteligencia Artificial Aplicada al Desarrollo de Aplicaciones Multiplataforma';
const TITULO_CORTO = 'Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma';
const MENCION_LEGAL = 'Título propio del centro · sin carácter oficial · 300 horas';
const DB_KEY = 'jro-master-ia-v3';
const SESSION_KEY = 'jro-master-ia-sesion';

const TABS = [
  ['teoria', 'Teoría'],
  ['taller', 'Taller paso a paso'],
  ['prompts', 'Biblioteca de Prompts'],
  ['actividad', 'Actividad práctica'],
  ['faq', 'Preguntas frecuentes']
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
  const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  if (conHora) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleDateString('es-ES', opts);
}
function fmtFechaCorta(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
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
function hoyIso() { return new Date().toISOString().slice(0, 10); }
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
/** Normaliza y valida un DNI o NIE español (letra de control). Devuelve el documento normalizado o null. */
function normalizarDni(valor) {
  const v = String(valor || '').toUpperCase().replace(/[\s.-]/g, '');
  const m = v.match(/^([XYZ]\d{7}|\d{8})([A-Z])$/);
  if (!m) return null;
  const num = m[1].replace('X', '0').replace('Y', '1').replace('Z', '2');
  return 'TRWAGMYFPDXBNJZSQVHLCKE'[parseInt(num, 10) % 23] === m[2] ? v : null;
}
function enmascararDni(dni) { return dni ? '•••••' + String(dni).slice(-4) : '—'; }
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
  // En las fuentes String.raw, "\${" representa un "${" literal (YAML, bash, Kotlin, Spring).
  return String(code).replace(/\\\$\{/g, '${').replace(/^\n+/, '').replace(/\s+$/, '');
}

/* ---------------------------------------------------------------------
 *  Programa: consultas sobre módulos y sesiones
 * ------------------------------------------------------------------- */
const ULTIMA_SESION = Math.max(...SESIONES.map(s => s.n));
const TOTAL_SESIONES = SESIONES.length;
const MODULOS_EVALUABLES = MODULOS.filter(m => m.computa);
function sesion(n) { return SESIONES.find(s => s.n === n); }
function moduloDe(n) { return MODULOS.find(m => n >= m.sesiones[0] && n <= m.sesiones[1]); }
function modulo(id) { return MODULOS.find(m => m.id === id); }
function sesionesDe(m) { return SESIONES.filter(s => s.n >= m.sesiones[0] && s.n <= m.sesiones[1]); }
function colorMod(m) { return { sage: '#a9cabb', terra: '#e39f7d', gold: '#efcd2f' }[m.color]; }
function chipMod(m) { return { sage: 'chip-sage', terra: 'chip-terra', gold: 'chip-gold' }[m.color]; }
function etiquetaMod(m) { return m.cod === m.corto ? m.cod : m.cod + ' · ' + m.corto; }
function rangoMod(m) { return m.sesiones[0] === m.sesiones[1] ? 'Sesión ' + m.sesiones[0] : 'Sesiones ' + m.sesiones[0] + '–' + m.sesiones[1]; }
/** Actividades que computan como «entregas semanales» (semanas 1-14, incluida la acogida). */
const ACTIVIDADES_SEMANALES = SESIONES.filter(s => s.actividad.tipo !== 'pfm').map(s => s.n);

/* ---------------------------------------------------------------------
 *  Persistencia
 * ------------------------------------------------------------------- */
function normalizarDB(d) {
  d = d && typeof d === 'object' ? d : {};
  d.version = 3;
  d.users = d.users || {};
  d.codigos = d.codigos || [];
  d.entregas = d.entregas || [];
  d.titulos = d.titulos || [];
  d.certificados = d.certificados || [];
  d.audit = d.audit || [];
  if (!d.users[ADMIN_EMAIL]) {
    d.users[ADMIN_EMAIL] = {
      email: ADMIN_EMAIL, nombre: ADMIN_NAME, rol: 'director', estado: 'admitido',
      creado: new Date().toISOString(), progreso: {}, salt: null, hash: null
    };
  }
  d.users[ADMIN_EMAIL].rol = 'director';
  d.users[ADMIN_EMAIL].estado = 'admitido';
  Object.values(d.users).forEach(u => { u.progreso = u.progreso || {}; u.evaluacion = u.evaluacion || {}; });
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
  const e = Almacen.emailSesion();
  return e && db.users[e] ? db.users[e] : null;
}
function esDirector(u) { return !!u && u.rol === 'director'; }
function alumnos() { return Object.values(db.users).filter(u => u.rol !== 'director'); }
/** Con admisión pendiente se accede a la acogida y a M1. */
function puedeAcceder(u, n) { return esDirector(u) || u.estado === 'admitido' || n <= modulo('M1').sesiones[1]; }
function progresoDe(u) { return Object.keys(u.progreso || {}).filter(k => u.progreso[k]).length; }

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
 *  Estado de interfaz y rutas
 * ------------------------------------------------------------------- */
const ui = { authVista: 'login', modsCerrados: new Set(), sideAbierta: false, filtroEntregas: 'pendientes' };

function ruta() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}
function ir(path) { location.hash = '#/' + path; }

function abrirModal(html) {
  $('#modal-root').innerHTML = '<div class="modal-back" data-act="cerrar-modal-fondo"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
  const primero = $('#modal-root input, #modal-root button');
  if (primero) primero.focus();
}
function cerrarModal() { $('#modal-root').innerHTML = ''; }
