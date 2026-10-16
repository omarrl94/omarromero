/** /api/examenes, /api/examen/*, /api/entrega — lo que hace el alumno. */
import { almacen } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto, env } from "./http.mjs";
import { requiereUsuario, esStaff, ciclosDe, gestionaExamen } from "./auth.mjs";
import { todosLosExamenes, obtenerExamen, enunciado, resumen } from "./examenes.mjs";
import { corregir, limpiarRespuestas } from "./correccion.mjs";
import { versionExamen, semillaDe, aOriginal, aMostrado, esAleatorio } from "./variantes.mjs";
import { secreto } from "./auth.mjs";
import { plazo, seguridadPara, horaTexto, MARGEN_ENTREGA_MS, codigoPersonal } from "./plazos.mjs";
import { registrar } from "./registro.mjs";
import { claveEntrega, vistaEntrega, historialDe, intentosHechos, intentosPermitidos, consolidar, conIntento } from "./entregas.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { CATALOGO, cicloDe, moduloVisible } from "./catalogo.mjs";

/**
 * El alumno ve los exámenes de su ciclo y de los módulos de su curso (1.º o 2.º);
 * el profesor, los suyos (para probarlos); el admin, todos.
 */
const puedeVer = (u, ex) => (esStaff(u) ? gestionaExamen(u, ex)
  // La defensa de un trabajo es un examen privado: solo la ve su alumno.
  : ex.privado ? ex.privado === u.email : ex.cicloId === cicloDe(u) && moduloVisible(ex.cicloId, ex.moduloId, u));
import { correoResultado, correoAviso } from "./plantillas.mjs";

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
/**
 * Versión del examen para este alumno y este intento (exámenes aleatorios):
 * siempre la misma para el mismo intento, distinta en cada intento y entre alumnos.
 */
async function versionDe(ex, email, intento) {
  if (!esAleatorio(ex)) return versionExamen(ex, null);
  return versionExamen(ex, semillaDe(await secreto(), "examen", ex.id, email, intento));
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
    const { codigo, ...res } = resumen(ex); // el código de acceso no se manda nunca al alumno
    return {
      ...res,
      intentosAlumno: intentosJSON(c), puedeRepetir: !!e && c.quedan > 0,
      enCurso: !!borradorVigente(c),
      estado: e ? "entregado" : "pendiente",
      nota: e ? e.notaProfesor ?? e.resultado.nota : null,
      revisada: e ? e.notaProfesor != null : false,
      validada: !!e?.validada,
      fecha: e?.fechaTexto || null,
    };
  }));
  const catalogo = CATALOGO.filter((c) => ciclosDe(u).includes(c.id))
    .map((c) => (esStaff(u) ? c : { ...c, modulos: c.modulos.filter((m) => moduloVisible(c.id, m.id, u)) }));
  // Quien ya terminó el ciclo solo ve lo que entregó (no puede empezar exámenes nuevos).
  return json({ catalogo, examenes: u.egresado ? filas.filter((f) => f.estado === "entregado").map((f) => ({ ...f, puedeRepetir: false })) : filas });
}

async function ver(req, url) {
  const u = await requiereUsuario(req);
  const ex = await examenPublicado(url.searchParams.get("id"), u);
  if (u.egresado && !esStaff(u)) fallo(403, `Terminaste el ciclo en el curso ${u.egresado}: ya no puedes hacer exámenes nuevos.`);
  const c = await cuentaIntentos(ex, u.email);
  if (c.quedan <= 0 && !esStaff(u)) sinIntentos(c);
  const b = borradorVigente(c);
  // Modo seguro ya empezado y sin permiso del profesor para reanudarlo.
  const seg = seguridadPara(ex, u);
  const pl = plazo(ex, u, c.p, c.hechos + 1);
  const agotado = pl.agotado && !c.p?.reanudar;
  const bloqueado = seg && (c.p?.inicios?.length || 0) >= c.permitidos && !c.p?.reanudar && !esStaff(u) && !agotado;
  const v = await versionDe(ex, u.email, c.hechos + 1);
  return json({
    ...enunciado(v.mostrado), seguridad: seg, variante: v.variante, intentosAlumno: intentosJSON(c), enCurso: b ? { t: b.t, n: b.n } : null, reanudar: !!c.p?.reanudar, bloqueado,
    horario: { ...pl, agotado, puedeEmpezar: pl.puedeEmpezar || esStaff(u), requiereCodigo: !!ex.codigo && !ex.identidad && !esStaff(u) && !pl.inicio, requiereIdentidad: !!ex.identidad && !esStaff(u) && !pl.inicio, sinModoSeguro: !!u.adaptacion?.sinModoSeguro && ex.seguridad !== false },
  });
}

async function iniciar(req) {
  const u = await requiereUsuario(req);
  const { id, codigo } = await leerCuerpo(req);
  const ex = await examenPublicado(id, u);
  const c = await cuentaIntentos(ex, u.email), k = c.k;
  if (c.quedan <= 0 && !esStaff(u)) sinIntentos(c);
  const p = c.p || { email: u.email, examen: ex.id, salidas: [] };
  const intento = c.hechos + 1;
  const staff = esStaff(u);
  // En modo seguro cada intento solo se puede empezar una vez (salir de la página lo entrega o lo cierra),
  // salvo que el profesor le haya dejado reanudarlo.
  const reanuda = !!p.reanudar;
  let pl = plazo(ex, u, p, intento);
  if (!staff && !pl.inicio) {
    // Horario: solo se empieza dentro de la ventana y con el código que da el profesor en clase.
    if (!pl.puedeEmpezar) fallo(409, pl.abre && Date.now() < Date.parse(pl.abre)
      ? `Este examen se abre el ${horaTexto(pl.abre)}.` : `El plazo para empezar este examen terminó el ${horaTexto(pl.cierra)}.`);
    const cod = String(codigo || "").trim().toUpperCase();
    if (ex.identidad) {
      // Examen a distancia: código personal, que el profesor da tras comprobar la identidad del alumno.
      if (cod !== codigoPersonal(await secreto(), ex.id, u.email)) {
        await registrar({ por: u, accion: "código personal incorrecto", alumno: u.email, sobre: { tipo: "examen", id: ex.id, titulo: ex.titulo, cicloId: ex.cicloId } });
        fallo(403, cod ? "El código personal no es correcto. Tu profesor te lo da después de comprobar tu identidad." : "Escribe tu código personal: te lo da tu profesor después de comprobar tu identidad (con tu DNI, en la videollamada).");
      }
    } else if (ex.codigo && cod !== ex.codigo) fallo(403, codigo ? "El código no es correcto. Pídeselo a tu profesor." : "Escribe el código que te ha dado tu profesor.");
  }
  if (!staff && !pl.agotado && seguridadPara(ex, u) && (p.inicios?.length || 0) >= c.permitidos && !reanuda)
    fallo(409, "Ya empezaste este examen en modo seguro y no se puede repetir. Si ha sido un error, pide a tu profesor que te deje reanudarlo.");
  if (!reanuda && !pl.inicio) p.inicios = [...(p.inicios || []), new Date().toISOString()].slice(-20);
  // El reloj empieza la primera vez; al continuar o reanudar, sigue contando desde entonces.
  if (!pl.inicio) { p.inicioIntento = { intento, t: new Date().toISOString() }; pl = plazo(ex, u, p, intento); }
  delete p.reanudar;
  await progreso().set(k, p);
  // Si había respuestas guardadas de este intento, sigue donde lo dejó.
  const b = borradorVigente({ ...c, p });
  const v = b ? await versionDe(ex, u.email, intento) : null;
  return json({ ok: true, respuestas: b ? aMostrado(b.respuestas, v.orden) : null, reanudado: reanuda, limite: staff ? null : pl.limite, agotado: !staff && pl.agotado, ahora: new Date().toISOString() });
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
  // Tiempo agotado: ya no se guardan cambios (el examen se entrega con lo que había).
  const pl = plazo(ex, u, c.p, c.hechos + 1);
  if (!esStaff(u) && pl.limite && Date.now() > Date.parse(pl.limite) + MARGEN_ENTREGA_MS) return json({ ok: false, agotado: true });
  const v = await versionDe(ex, u.email, c.hechos + 1);
  const respuestas = limpiarRespuestas(v.canon, aOriginal(b, v.orden));
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

  // Examen aleatorio: se corrige con la versión de este alumno y en el orden original.
  const v = await versionDe(ex, u.email, c.hechos + 1);
  const respuestas = limpiarRespuestas(v.canon, aOriginal(b, v.orden));
  const resultado = corregir(v.canon, respuestas);
  const ahora = new Date();
  const p = c.p || { email: u.email, examen: ex.id, salidas: [] };
  // Entrega automática al cambiar de pantalla (modo seguro): se registra la salida.
  const salida = seguridadPara(ex, u) && b.salida ? texto(b.salida, 120) : "";
  // Horario: tiempo usado y entrega fuera de tiempo (se acepta, pero queda marcada para el profesor).
  const pl = plazo(ex, u, p, c.hechos + 1, ahora.getTime());
  const tiempoUsado = pl.inicio ? Math.round((ahora - Date.parse(pl.inicio)) / 1000) : null;
  const tarde = !esStaff(u) && pl.limite ? Math.round((ahora - Date.parse(pl.limite)) / 60_000) : 0;
  const fueraDeTiempo = !esStaff(u) && pl.limite && ahora - Date.parse(pl.limite) > MARGEN_ENTREGA_MS ? tarde : 0;
  const porTiempo = !!b.tiempoAgotado;
  if (salida) p.salidas = [...(p.salidas || []), { t: ahora.toISOString(), motivo: `${salida} (examen finalizado)` }].slice(-50);
  // Entregado: ya no hay nada que reanudar.
  const habiaBorrador = !!(p.borrador || p.reanudar || p.inicioIntento);
  delete p.borrador; delete p.reanudar; delete p.inicioIntento;
  if (salida || habiaBorrador) await progreso().set(k, p);
  const { publicado, mostrarSoluciones, creado, actualizado, ...copia } = v.canon;
  if (v.variante) { copia.version = true; delete copia.variables; }
  const intento = {
    examen: copia, respuestas, resultado,
    fecha: ahora.toISOString(),
    fechaTexto: ahora.toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    // Salidas de la ventana durante este intento.
    salidas: Math.max(0, (p?.salidas?.length || 0) - historialDe(c.e).reduce((s, x) => s + (x.salidas || 0), 0)),
    ...(salida ? { finalizadoPorSalida: salida } : {}),
    ...(tiempoUsado != null ? { tiempoUsado } : {}),
    ...(porTiempo ? { finalizadoPorTiempo: true } : {}),
    ...(fueraDeTiempo ? { fueraDeTiempo } : {}),
  };
  const e = consolidar(
    { ...(c.e || {}), email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo },
    [...historialDe(c.e), intento], ex.calificacion,
  );
  delete e.validada; // nota nueva: provisional hasta que la valide el profesor
  await entregas().set(k, e);
  const hecho = conIntento(e, e.historial.length - 1); // el intento que acaba de entregar
  if (!esStaff(u)) await registrar({ por: u, accion: "entrega", alumno: u.email, sobre: { tipo: "examen", id: ex.id, titulo: ex.titulo, cicloId: ex.cicloId },
    despues: { intento: e.historial.length, nota: resultado.nota, notaFinal: e.notaProfesor ?? e.resultado.nota }, detalle: [salida && `entregado al salir: ${salida}`, porTiempo && "se acabó el tiempo", fueraDeTiempo && `fuera de tiempo (${fueraDeTiempo} min)`].filter(Boolean).join(" · ") });

  const correo = { enviado: false, destino: u.email };
  if (!proveedorConfigurado()) {
    correo.error = "El envío de correo no está configurado.";
  } else {
    try {
      const c = correoResultado({ ...v.canon, mostrarSoluciones: ex.mostrarSoluciones }, hecho);
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

/** El alumno pide al profesor que revise la nota de un examen (queda registrado). */
async function pedirRevision(req) {
  const u = await requiereUsuario(req);
  const b = await leerCuerpo(req);
  const ex = await obtenerExamen(String(b.id || ""));
  const k = claveEntrega(String(b.id || ""), u.email);
  const e = await entregas().get(k);
  if (!e) fallo(404, "No has entregado este examen");
  if (e.revision?.estado === "pendiente") fallo(409, "Ya has pedido la revisión: tu profesor te responderá por aquí.");
  const motivo = String(b.motivo ?? "").trim().slice(0, 2000);
  if (motivo.length < 10) fallo(400, "Explica qué quieres que revise el profesor (pregunta y motivo)");
  e.revision = { estado: "pendiente", motivo, fecha: new Date().toISOString(), notaEntonces: e.notaProfesor ?? e.resultado.nota };
  await entregas().set(k, e);
  await registrar({ por: u, accion: "solicitud de revisión", alumno: u.email, sobre: { tipo: "examen", id: e.examen.id, titulo: e.examen.titulo, cicloId: e.examen.cicloId }, antes: e.revision.notaEntonces, detalle: motivo.slice(0, 300) });
  const prof = ex?.autor?.email;
  if (prof && proveedorConfigurado()) {
    const c = correoAviso("profesor/a", `Solicitud de revisión: ${e.examen.titulo}`, `${u.nombre} ${u.apellidos} (${u.grupo}) pide que revises su nota del examen «${e.examen.titulo}»: «${motivo}». Respóndele desde Entregas en el panel del profesor.`);
    enviarCorreo({ to: prof, subject: c.asunto, html: c.html, text: c.text }).catch((x) => console.error("Aviso revisión:", x));
  }
  return json({ ok: true, revision: e.revision });
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
  "POST /api/entrega/revision": pedirRevision,
};
