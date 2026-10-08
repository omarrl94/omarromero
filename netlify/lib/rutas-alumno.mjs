/** /api/examenes, /api/examen/*, /api/entrega — lo que hace el alumno. */
import { almacen } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto, env } from "./http.mjs";
import { requiereUsuario, esStaff, ciclosDe, gestionaExamen } from "./auth.mjs";
import { todosLosExamenes, obtenerExamen, enunciado, resumen } from "./examenes.mjs";
import { corregir, limpiarRespuestas } from "./correccion.mjs";
import { claveEntrega, vistaEntrega, historialDe, intentosHechos, intentosPermitidos, consolidar, conIntento } from "./entregas.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { CATALOGO, cicloDe, moduloVisible } from "./catalogo.mjs";

/**
 * El alumno ve los exámenes de su ciclo y de los módulos de su curso (1.º o 2.º);
 * el profesor, los suyos (para probarlos); el admin, todos.
 */
const puedeVer = (u, ex) => (esStaff(u) ? gestionaExamen(u, ex) : ex.cicloId === cicloDe(u) && moduloVisible(ex.cicloId, ex.moduloId, u));
import { correoResultado } from "./plantillas.mjs";

const entregas = () => almacen("entregas");
const progreso = () => almacen("progreso");

async function examenPublicado(id, u) {
  const ex = await obtenerExamen(id);
  // El profesor puede abrir también los no publicados, para probarlos antes.
  if (!ex || (!ex.publicado && !esStaff(u)) || !puedeVer(u, ex)) fallo(404, "Este examen no existe o no está disponible para tu curso");
  return ex;
}

/** Intentos hechos y permitidos de un alumno en un examen. */
async function cuentaIntentos(ex, email) {
  const k = claveEntrega(ex.id, email);
  const [e, p] = await Promise.all([entregas().get(k), progreso().get(k)]);
  const hechos = intentosHechos(e), permitidos = intentosPermitidos(ex, p);
  return { k, e, p, hechos, permitidos, quedan: Math.max(0, permitidos - hechos) };
}
/** Respuestas guardadas solas del intento en curso (si las hay). */
const borradorVigente = (c) => (c.p?.borrador && c.p.borrador.intento === c.hechos + 1 ? c.p.borrador : null);

const intentosJSON = (c) => ({ hechos: c.hechos, permitidos: Number.isFinite(c.permitidos) ? c.permitidos : null, quedan: Number.isFinite(c.quedan) ? c.quedan : null });
const sinIntentos = (c) => fallo(409, c.hechos ? "Ya has entregado este examen y no te quedan más intentos" : "No te quedan intentos en este examen");

/** Exámenes publicados + estado del alumno en cada uno. */
async function listar(req) {
  const u = await requiereUsuario(req);
  const lista = (await todosLosExamenes()).filter((e) => e.publicado && puedeVer(u, e));
  const filas = await Promise.all(lista.map(async (ex) => {
    const c = await cuentaIntentos(ex, u.email), e = c.e;
    return {
      ...resumen(ex),
      intentosAlumno: intentosJSON(c), puedeRepetir: !!e && c.quedan > 0,
      enCurso: !!borradorVigente(c),
      estado: e ? "entregado" : "pendiente",
      nota: e ? e.notaProfesor ?? e.resultado.nota : null,
      revisada: e ? e.notaProfesor != null : false,
      fecha: e?.fechaTexto || null,
    };
  }));
  const catalogo = CATALOGO.filter((c) => ciclosDe(u).includes(c.id))
    .map((c) => (esStaff(u) ? c : { ...c, modulos: c.modulos.filter((m) => moduloVisible(c.id, m.id, u)) }));
  return json({ catalogo, examenes: filas });
}

async function ver(req, url) {
  const u = await requiereUsuario(req);
  const ex = await examenPublicado(url.searchParams.get("id"), u);
  const c = await cuentaIntentos(ex, u.email);
  if (c.quedan <= 0 && !esStaff(u)) sinIntentos(c);
  const b = borradorVigente(c);
  // Modo seguro ya empezado y sin permiso del profesor para reanudarlo.
  const bloqueado = ex.seguridad !== false && (c.p?.inicios?.length || 0) >= c.permitidos && !c.p?.reanudar && !esStaff(u);
  return json({ ...enunciado(ex), intentosAlumno: intentosJSON(c), enCurso: b ? { t: b.t, n: b.n } : null, reanudar: !!c.p?.reanudar, bloqueado });
}

async function iniciar(req) {
  const u = await requiereUsuario(req);
  const { id } = await leerCuerpo(req);
  const ex = await examenPublicado(id, u);
  const c = await cuentaIntentos(ex, u.email), k = c.k;
  if (c.quedan <= 0 && !esStaff(u)) sinIntentos(c);
  const p = c.p || { email: u.email, examen: ex.id, salidas: [] };
  // En modo seguro cada intento solo se puede empezar una vez (salir de la página lo entrega o lo cierra),
  // salvo que el profesor le haya dejado reanudarlo.
  const reanuda = !!p.reanudar;
  if (ex.seguridad !== false && (p.inicios?.length || 0) >= c.permitidos && !esStaff(u) && !reanuda)
    fallo(409, "Ya empezaste este examen en modo seguro y no se puede repetir. Si ha sido un error, pide a tu profesor que te deje reanudarlo.");
  if (!reanuda) p.inicios = [...(p.inicios || []), new Date().toISOString()].slice(-20);
  delete p.reanudar;
  await progreso().set(k, p);
  // Si había respuestas guardadas de este intento, sigue donde lo dejó.
  const b = borradorVigente({ ...c, p });
  return json({ ok: true, respuestas: b ? b.respuestas : null, reanudado: reanuda });
}

/** Guardado automático de las respuestas mientras se hace el examen (para poder reanudarlo). */
async function guardarBorrador(req) {
  const u = await requiereUsuario(req);
  const b = await leerCuerpo(req, 200_000);
  const ex = await examenPublicado(b.id, u);
  const c = await cuentaIntentos(ex, u.email);
  if (c.quedan <= 0 && !esStaff(u)) return json({ ok: false });
  // Un guardado que llega tarde (tras entregar) no debe pasar al intento siguiente.
  if (b.intento != null && Number(b.intento) !== c.hechos + 1) return json({ ok: false });
  const respuestas = limpiarRespuestas(ex, b);
  const n = respuestas.mc.filter((v) => v >= 0).length + respuestas.open.filter((t) => t.trim()).length
    + respuestas.num.filter((cs) => cs.some((v) => (typeof v === "number" ? v >= 0 : String(v).trim()))).length;
  const p = c.p || { email: u.email, examen: ex.id, salidas: [] };
  p.borrador = { respuestas, t: new Date().toISOString(), intento: c.hechos + 1, n };
  await progreso().set(c.k, p);
  return json({ ok: true, t: p.borrador.t });
}

/** El navegador avisa cuando el alumno sale de la ventana (el test se cierra). */
async function incidencia(req) {
  const u = await requiereUsuario(req);
  const b = await leerCuerpo(req, 2000);
  const ex = await obtenerExamen(b.id);
  if (!ex) return json({ ok: true });
  const k = claveEntrega(ex.id, u.email);
  const p = (await progreso().get(k)) || { email: u.email, examen: ex.id, salidas: [] };
  p.salidas = [...(p.salidas || []), { t: new Date().toISOString(), motivo: texto(b.motivo, 120) }].slice(-50);
  await progreso().set(k, p);
  return json({ ok: true });
}

async function entregar(req) {
  const u = await requiereUsuario(req);
  const b = await leerCuerpo(req);
  const ex = await examenPublicado(b.id, u);
  const c = await cuentaIntentos(ex, u.email), k = c.k;
  // El profesor que prueba su examen puede entregarlo las veces que quiera.
  if (c.quedan <= 0 && !esStaff(u)) sinIntentos(c);

  const respuestas = limpiarRespuestas(ex, b);
  const resultado = corregir(ex, respuestas);
  const ahora = new Date();
  const p = c.p || { email: u.email, examen: ex.id, salidas: [] };
  // Entrega automática al cambiar de pantalla (modo seguro): se registra la salida.
  const salida = ex.seguridad !== false && b.salida ? texto(b.salida, 120) : "";
  if (salida) p.salidas = [...(p.salidas || []), { t: ahora.toISOString(), motivo: `${salida} (examen finalizado)` }].slice(-50);
  // Entregado: ya no hay nada que reanudar.
  const habiaBorrador = !!(p.borrador || p.reanudar);
  delete p.borrador; delete p.reanudar;
  if (salida || habiaBorrador) await progreso().set(k, p);
  const { publicado, mostrarSoluciones, creado, actualizado, ...copia } = ex;
  const intento = {
    examen: copia, respuestas, resultado,
    fecha: ahora.toISOString(),
    fechaTexto: ahora.toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    // Salidas de la ventana durante este intento.
    salidas: Math.max(0, (p?.salidas?.length || 0) - historialDe(c.e).reduce((s, x) => s + (x.salidas || 0), 0)),
    ...(salida ? { finalizadoPorSalida: salida } : {}),
  };
  const e = consolidar(
    { ...(c.e || {}), email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo },
    [...historialDe(c.e), intento], ex.calificacion,
  );
  await entregas().set(k, e);
  const hecho = conIntento(e, e.historial.length - 1); // el intento que acaba de entregar

  const correo = { enviado: false, destino: u.email };
  if (!proveedorConfigurado()) {
    correo.error = "El envío de correo no está configurado.";
  } else {
    try {
      const c = correoResultado(ex, hecho);
      const profesor = env("PROFESOR_EMAIL");
      await enviarCorreo({ to: u.email, bcc: profesor || undefined, replyTo: profesor || undefined, subject: c.asunto, html: c.html, text: c.text });
      correo.enviado = true;
    } catch (err) {
      console.error("Fallo al enviar resultado:", err);
      correo.error = "No se ha podido enviar el correo, pero tu entrega está guardada.";
    }
  }
  console.log(JSON.stringify({ evento: "entrega", examen: ex.id, email: u.email, nota: resultado.nota, correo: correo.enviado }));
  const quedan = c.quedan - 1;
  return json({ ...vistaEntrega(hecho, { soluciones: ex.mostrarSoluciones }), calificacion: ex.calificacion || "mejor", quedan: Number.isFinite(quedan) ? quedan : null, correo });
}

async function miEntrega(req, url) {
  const u = await requiereUsuario(req);
  const id = url.searchParams.get("id") || "";
  const e = await entregas().get(claveEntrega(id, u.email));
  if (!e) fallo(404, "No has entregado este examen");
  const ex = await obtenerExamen(id);
  const c = ex ? await cuentaIntentos(ex, u.email) : null;
  const quedan = c && ex.publicado ? c.quedan : 0;
  return json({ ...vistaEntrega(e, { soluciones: ex ? ex.mostrarSoluciones : true }), quedan: Number.isFinite(quedan) ? quedan : null, calificacion: ex?.calificacion || "mejor" });
}

export default {
  "GET /api/examenes": listar,
  "GET /api/examen": ver,
  "POST /api/examen/iniciar": iniciar,
  "POST /api/examen/incidencia": incidencia,
  "POST /api/examen/guardar": guardarBorrador,
  "POST /api/examen/entregar": entregar,
  "GET /api/entrega": miEntrega,
};
