/** /api/examenes, /api/examen/*, /api/entrega — lo que hace el alumno. */
import { almacen } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto } from "./http.mjs";
import { requiereUsuario } from "./auth.mjs";
import { todosLosExamenes, obtenerExamen, enunciado, resumen } from "./examenes.mjs";
import { corregir, limpiarRespuestas } from "./correccion.mjs";
import { claveEntrega, vistaEntrega } from "./entregas.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { correoResultado } from "./plantillas.mjs";

const entregas = () => almacen("entregas");
const progreso = () => almacen("progreso");

async function examenPublicado(id) {
  const ex = await obtenerExamen(id);
  if (!ex || !ex.publicado) fallo(404, "Este examen no existe o no está disponible");
  return ex;
}

/** Exámenes publicados + estado del alumno en cada uno. */
async function listar(req) {
  const u = await requiereUsuario(req);
  const lista = (await todosLosExamenes()).filter((e) => e.publicado);
  const filas = await Promise.all(lista.map(async (ex) => {
    const e = await entregas().get(claveEntrega(ex.id, u.email));
    return {
      ...resumen(ex),
      estado: e ? "entregado" : "pendiente",
      nota: e ? e.notaProfesor ?? e.resultado.nota : null,
      revisada: e ? e.notaProfesor != null : false,
      fecha: e?.fechaTexto || null,
    };
  }));
  return json({ examenes: filas });
}

async function ver(req, url) {
  const u = await requiereUsuario(req);
  const ex = await examenPublicado(url.searchParams.get("id"));
  if (await entregas().get(claveEntrega(ex.id, u.email))) fallo(409, "Ya has entregado este examen");
  return json(enunciado(ex));
}

async function iniciar(req) {
  const u = await requiereUsuario(req);
  const { id } = await leerCuerpo(req);
  const ex = await examenPublicado(id);
  if (await entregas().get(claveEntrega(ex.id, u.email))) fallo(409, "Ya has entregado este examen");
  const k = claveEntrega(ex.id, u.email);
  const p = (await progreso().get(k)) || { email: u.email, examen: ex.id, salidas: [] };
  p.inicios = [...(p.inicios || []), new Date().toISOString()].slice(-20);
  await progreso().set(k, p);
  return json({ ok: true });
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
  const ex = await examenPublicado(b.id);
  const k = claveEntrega(ex.id, u.email);
  if (await entregas().get(k)) fallo(409, "Ya has entregado este examen");

  const respuestas = limpiarRespuestas(ex, b);
  const resultado = corregir(ex, respuestas);
  const ahora = new Date();
  const p = await progreso().get(k);
  const { publicado, mostrarSoluciones, creado, actualizado, ...copia } = ex;
  const e = {
    email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo,
    examen: copia, respuestas, resultado,
    fecha: ahora.toISOString(),
    fechaTexto: ahora.toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    salidas: p?.salidas?.length || 0,
  };
  await entregas().set(k, e);

  const correo = { enviado: false, destino: u.email };
  if (!proveedorConfigurado()) {
    correo.error = "El envío de correo no está configurado.";
  } else {
    try {
      const c = correoResultado(ex, e);
      const profesor = (process.env.PROFESOR_EMAIL || "").trim();
      await enviarCorreo({ to: u.email, bcc: profesor || undefined, replyTo: profesor || undefined, subject: c.asunto, html: c.html, text: c.text });
      correo.enviado = true;
    } catch (err) {
      console.error("Fallo al enviar resultado:", err);
      correo.error = "No se ha podido enviar el correo, pero tu entrega está guardada.";
    }
  }
  console.log(JSON.stringify({ evento: "entrega", examen: ex.id, email: u.email, nota: resultado.nota, correo: correo.enviado }));
  return json({ ...vistaEntrega(e, { soluciones: ex.mostrarSoluciones }), correo });
}

async function miEntrega(req, url) {
  const u = await requiereUsuario(req);
  const id = url.searchParams.get("id") || "";
  const e = await entregas().get(claveEntrega(id, u.email));
  if (!e) fallo(404, "No has entregado este examen");
  const ex = await obtenerExamen(id);
  return json(vistaEntrega(e, { soluciones: ex ? ex.mostrarSoluciones : true }));
}

export default {
  "GET /api/examenes": listar,
  "GET /api/examen": ver,
  "POST /api/examen/iniciar": iniciar,
  "POST /api/examen/incidencia": incidencia,
  "POST /api/examen/entregar": entregar,
  "GET /api/entrega": miEntrega,
};
