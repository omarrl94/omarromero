/**
 * Horario de los exámenes y adaptaciones del alumnado.
 *
 *  · ventana  { desde, hasta }  cuándo se puede EMPEZAR el examen (ISO; vacío = sin límite).
 *  · duracion minutos que tiene cada alumno desde que empieza (0 = sin límite).
 *  · codigo   código que da el profesor en clase para poder empezar (vacío = no hace falta).
 *  · adaptacion del alumno (en su cuenta): tiempoExtra (%) y sinModoSeguro.
 *
 * El tiempo cuenta desde que el alumno pulsa «Comenzar» y no se para aunque cierre la
 * página. Si el profesor le deja reanudar, recupera el tiempo que le quedaba.
 */
import { randomInt, createHmac } from "node:crypto";
import { fallo, texto } from "./http.mjs";

export const MARGEN_ENTREGA_MS = 2 * 60_000; // la red puede tardar: entregas hasta 2 min tarde no se marcan

const fecha = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const t = Date.parse(s);
  if (Number.isNaN(t)) fallo(400, "La fecha del horario no es válida");
  return new Date(t).toISOString();
};

export function ventanaValida(v) {
  const desde = fecha(v?.desde), hasta = fecha(v?.hasta);
  if (desde && hasta && Date.parse(hasta) <= Date.parse(desde)) fallo(400, "La hora de cierre debe ser posterior a la de apertura");
  return { desde, hasta };
}

export function duracionValida(v) {
  const n = Number(v ?? 0);
  if (!Number.isInteger(n) || n < 0 || n > 600) fallo(400, "La duración debe ser un número de minutos entre 0 (sin límite) y 600");
  return n;
}

/** Código de acceso: letras y números (sin los que se confunden). «nuevo» genera uno de 6 caracteres. */
export function codigoValido(v) {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return "";
  if (s === "NUEVO") return Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(32)]).join("");
  if (!/^[A-Z0-9]{4,12}$/.test(s)) fallo(400, "El código debe tener de 4 a 12 letras o números");
  return s;
}

/**
 * Código personal de un alumno para un examen a distancia (identidad): el profesor lo
 * dice a cada alumno tras verle con su DNI en la videollamada. Cambia de un examen a otro.
 */
export function codigoPersonal(secreto, exId, email) {
  const h = createHmac("sha256", secreto).update(`identidad:${exId}:${email}`).digest();
  return Array.from({ length: 6 }, (_, i) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[h[i] % 32]).join("");
}

export const TIEMPOS_EXTRA = [0, 25, 33, 50, 100];
export function adaptacionValida(a) {
  if (!a) return null;
  const extra = Number(a.tiempoExtra ?? 0);
  if (!TIEMPOS_EXTRA.includes(extra)) fallo(400, "Tiempo extra no válido");
  const r = { tiempoExtra: extra, sinModoSeguro: a.sinModoSeguro === true, nota: texto(a.nota, 200) };
  return r.tiempoExtra || r.sinModoSeguro || r.nota ? r : null;
}

/** ¿Está el modo seguro activo para este alumno? (una adaptación puede quitárselo) */
export const seguridadPara = (ex, u) => ex.seguridad !== false && !u?.adaptacion?.sinModoSeguro;

/**
 * Situación del horario para un alumno y un intento.
 * @returns { abre, cierra, duracion, tiempoExtra, inicio, limite, puedeEmpezar, motivo, agotado }
 */
export function plazo(ex, u, p, intento, ahora = Date.now()) {
  const extra = u?.adaptacion?.tiempoExtra || 0;
  const durMin = ex.duracion ? Math.round(ex.duracion * (1 + extra / 100)) : 0;
  const abre = ex.ventana?.desde ? Date.parse(ex.ventana.desde) : null;
  const cierra = ex.ventana?.hasta ? Date.parse(ex.ventana.hasta) : null;
  const inicio = p?.inicioIntento?.intento === intento ? Date.parse(p.inicioIntento.t) : null;
  // Límite para entregar: con duración, la duración desde que empezó (quien empieza a tiempo
  // tiene todos sus minutos); sin duración, la hora de cierre.
  const limite = !inicio ? null : durMin ? inicio + durMin * 60_000 : cierra || null;
  let puedeEmpezar = true, motivo = "";
  if (!inicio) {
    if (abre && ahora < abre) { puedeEmpezar = false; motivo = "todavía no ha empezado"; }
    else if (cierra && ahora >= cierra) { puedeEmpezar = false; motivo = "ya ha terminado el plazo para hacerlo"; }
  }
  return {
    abre: abre ? new Date(abre).toISOString() : null, cierra: cierra ? new Date(cierra).toISOString() : null,
    duracion: durMin, tiempoExtra: extra, inicio: inicio ? new Date(inicio).toISOString() : null,
    limite: limite ? new Date(limite).toISOString() : null, puedeEmpezar, motivo, agotado: !!limite && ahora > limite,
  };
}

/** Texto de una hora para los mensajes («lunes 20 de octubre, 9:00»). */
export const horaTexto = (iso) => new Date(iso).toLocaleString("es-ES", { timeZone: "Europe/Madrid", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
