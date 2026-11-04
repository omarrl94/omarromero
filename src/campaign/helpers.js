// Utilidades para describir los objetivos de los retos de terminal.
import { lookup, modeToOctal } from '../core/vfs.js';

export const read = (path) => (st) => st.log.some((e) => e.type === 'read' && e.path === path);
export const ran = (name, re) => (st) => st.log.some((e) => e.type === 'cmd' && e.name === name && (!re || re.test(e.raw)));
export const ev = (type, pred = () => true) => (st) => st.log.some((e) => e.type === type && pred(e));
export const blocked = (ip) => (st) => st.firewall.some((r) => r.ip === ip);
export const noProc = (re) => (st) => !st.procs.some((p) => re.test(p.cmd));
export const cronClean = (user, re) => (st) => !(st.cron[user] || []).some((l) => re.test(l));
export const modeIs = (path, oct) => (st) => {
  const n = lookup(st.fs, path);
  return !!n && modeToOctal(n.mode) === oct;
};
export const gone = (path) => (st) => !lookup(st.fs, path);
export const serviceOff = (name) => (st) => st.services.some((s) => s.name === name && !s.active && !s.enabled);
export const all = (...fns) => (st) => fns.every((f) => f(st));

export function normalizeAnswer(v) {
  return String(v ?? '').trim().toLowerCase().replace(/^["'«]+|["'»]+$/g, '').replace(/\s+/g, ' ');
}

export function answerOk(obj, value) {
  const v = normalizeAnswer(value);
  return obj.answer.some((a) => normalizeAnswer(a) === v);
}

/** ¿Está cumplido un objetivo de terminal? */
export function objectiveDone(obj, st) {
  if (obj.answer) return answerOk(obj, st.answers[obj.id]);
  return !!obj.check(st);
}

/** Genera líneas de log de autenticación SSH realistas (escenario ficticio). */
export function authLog(entries) {
  return entries.map(([t, msg]) => `Nov  4 ${t} srv-web01 sshd[${1000 + (t.charCodeAt(4) * 7) % 900}]: ${msg}`).join('\n');
}
