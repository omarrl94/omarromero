/** /api/profesor/* — gestión de exámenes, entregas y alumnos (solo ADMIN_EMAILS). */
import { almacen, leerTodas } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto } from "./http.mjs";
import { requiereAdmin, esAdmin } from "./auth.mjs";
import { todosLosExamenes, obtenerExamen, validarExamen, resumen } from "./examenes.mjs";
import { claveEntrega, vistaEntrega } from "./entregas.mjs";
import { proveedorConfigurado } from "./correo.mjs";
import { CATALOGO } from "./catalogo.mjs";

const examenes = () => almacen("examenes");
const entregas = () => almacen("entregas");
const progreso = () => almacen("progreso");
const usuarios = () => almacen("usuarios");

async function existente(id) {
  const ex = await obtenerExamen(id);
  if (!ex) fallo(404, "Examen no encontrado");
  return ex;
}

async function listar(req) {
  await requiereAdmin(req);
  const lista = await todosLosExamenes();
  const filas = await Promise.all(lista.map(async (ex) => ({
    ...resumen(ex), entregas: (await entregas().list(ex.id + "/")).length,
  })));
  return json({ catalogo: CATALOGO, examenes: filas, correo: !!proveedorConfigurado() });
}

async function verExamen(req, url) {
  await requiereAdmin(req);
  const { publicado, mostrarSoluciones, ...ex } = await existente(url.searchParams.get("id"));
  return json({ ...ex, publicado, mostrarSoluciones });
}

async function guardar(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req, 2_000_000);
  const ex = validarExamen(b);
  const previo = await examenes().get(ex.id);
  if (previo && !b.sobrescribir) fallo(409, `Ya existe un examen con el identificador «${ex.id}». Marca «Reemplazar» o cambia el identificador.`);
  const ahora = new Date().toISOString();
  await examenes().set(ex.id, { ...ex, creado: previo?.creado || ahora, actualizado: ahora });
  return json({ ok: true, id: ex.id });
}

async function ajustes(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id);
  if (typeof b.publicado === "boolean") ex.publicado = b.publicado;
  if (typeof b.mostrarSoluciones === "boolean") ex.mostrarSoluciones = b.mostrarSoluciones;
  if (Number.isFinite(b.orden)) ex.orden = b.orden;
  ex.actualizado = new Date().toISOString();
  await examenes().set(ex.id, ex);
  return json({ ok: true });
}

async function borrar(req) {
  await requiereAdmin(req);
  const { id } = await leerCuerpo(req);
  const ex = await existente(id);
  const [ke, kp] = await Promise.all([entregas().list(ex.id + "/"), progreso().list(ex.id + "/")]);
  await Promise.all([...ke.map((k) => entregas().del(k)), ...kp.map((k) => progreso().del(k))]);
  await examenes().del(ex.id);
  return json({ ok: true });
}

/** Una fila por alumno que ha empezado o entregado el examen. */
async function filasEntregas(id) {
  const [es, ps] = await Promise.all([
    entregas().list(id + "/").then((k) => leerTodas(entregas(), k)),
    progreso().list(id + "/").then((k) => leerTodas(progreso(), k)),
  ]);
  const prog = Object.fromEntries(ps.map((p) => [p.email, p]));
  const filas = es.map((e) => ({
    email: e.email, nombre: e.nombre, apellidos: e.apellidos, grupo: e.grupo,
    estado: "entregado", nota: e.resultado.nota, notaProfesor: e.notaProfesor ?? null,
    mcOk: e.resultado.mcOk, openPts: e.resultado.openPts, fecha: e.fecha, fechaTexto: e.fechaTexto,
    salidas: prog[e.email]?.salidas?.length ?? e.salidas ?? 0,
  }));
  const entregados = new Set(es.map((e) => e.email));
  const sinEntregar = ps.filter((p) => !entregados.has(p.email));
  const perfiles = await leerTodas(usuarios(), sinEntregar.map((p) => p.email));
  const porEmail = Object.fromEntries(perfiles.map((u) => [u.email, u]));
  for (const p of sinEntregar) {
    const u = porEmail[p.email] || {};
    filas.push({
      email: p.email, nombre: u.nombre || "", apellidos: u.apellidos || "", grupo: u.grupo || "",
      estado: "sin entregar", nota: null, notaProfesor: null, fecha: p.inicios?.at(-1) || null, fechaTexto: "",
      salidas: p.salidas?.length || 0,
    });
  }
  return filas.sort((a, b) => `${a.grupo} ${a.apellidos} ${a.nombre}`.localeCompare(`${b.grupo} ${b.apellidos} ${b.nombre}`, "es"));
}

async function listarEntregas(req, url) {
  await requiereAdmin(req);
  const ex = await existente(url.searchParams.get("id"));
  return json({ examen: resumen(ex), filas: await filasEntregas(ex.id) });
}

async function csv(req, url) {
  await requiereAdmin(req);
  const ex = await existente(url.searchParams.get("id"));
  const filas = await filasEntregas(ex.id);
  const c = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const n = (v) => (v == null ? "" : String(v).replace(".", ","));
  const lineas = [
    ["Apellidos", "Nombre", "Correo", "Grupo", "Estado", "Nota automática", "Nota revisada", "Nota final", "Aciertos test", "Puntos abiertas", "Fecha de entrega", "Salidas de la ventana"].map(c).join(";"),
    ...filas.map((f) => [c(f.apellidos), c(f.nombre), c(f.email), c(f.grupo), c(f.estado), n(f.nota), n(f.notaProfesor),
      n(f.notaProfesor ?? f.nota), n(f.mcOk), n(f.openPts), c(f.fechaTexto), n(f.salidas)].join(";")),
  ];
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="notas_${ex.id}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

async function verEntrega(req, url) {
  await requiereAdmin(req);
  const e = await entregas().get(claveEntrega(url.searchParams.get("id") || "", (url.searchParams.get("email") || "").toLowerCase()));
  if (!e) fallo(404, "Entrega no encontrada");
  const p = await progreso().get(claveEntrega(e.examen.id, e.email));
  return json({ ...vistaEntrega(e, { soluciones: true }), registroSalidas: p?.salidas || [] });
}

async function revisar(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  const k = claveEntrega(String(b.id || ""), String(b.email || "").toLowerCase());
  const e = await entregas().get(k);
  if (!e) fallo(404, "Entrega no encontrada");
  if (b.notaProfesor === null || b.notaProfesor === "") delete e.notaProfesor;
  else {
    const n = Number(String(b.notaProfesor).replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 10) fallo(400, "La nota debe estar entre 0 y 10");
    e.notaProfesor = Math.round(n * 100) / 100;
  }
  e.comentario = String(b.comentario ?? "").slice(0, 2000);
  await entregas().set(k, e);
  return json({ ok: true });
}

async function reabrir(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  const k = claveEntrega(String(b.id || ""), String(b.email || "").toLowerCase());
  await Promise.all([entregas().del(k), progreso().del(k)]);
  return json({ ok: true });
}

async function alumnos(req) {
  await requiereAdmin(req);
  const lista = await leerTodas(usuarios(), await usuarios().list());
  return json({
    alumnos: lista
      .map((u) => ({ email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo, verificado: !!u.verificado, creado: u.creado, profesor: esAdmin(u.email) }))
      .sort((a, b) => `${a.grupo} ${a.apellidos}`.localeCompare(`${b.grupo} ${b.apellidos}`, "es")),
  });
}

async function editarAlumno(req) {
  await requiereAdmin(req);
  const b = await leerCuerpo(req);
  const u = await usuarios().get(String(b.email || "").toLowerCase());
  if (!u) fallo(404, "Alumno no encontrado");
  if (b.grupo !== undefined) u.grupo = texto(b.grupo, 60);
  if (b.verificado === true) { u.verificado = true; delete u.codigo; }
  await usuarios().set(u.email, u);
  return json({ ok: true });
}

async function borrarAlumno(req) {
  const yo = await requiereAdmin(req);
  const email = String((await leerCuerpo(req)).email || "").toLowerCase();
  if (email === yo.email) fallo(400, "No puedes borrar tu propia cuenta");
  await usuarios().del(email);
  return json({ ok: true });
}

export default {
  "GET /api/profesor/examenes": listar,
  "GET /api/profesor/examen": verExamen,
  "POST /api/profesor/examen": guardar,
  "POST /api/profesor/examen/ajustes": ajustes,
  "POST /api/profesor/examen/borrar": borrar,
  "GET /api/profesor/entregas": listarEntregas,
  "GET /api/profesor/entregas.csv": csv,
  "GET /api/profesor/entrega": verEntrega,
  "POST /api/profesor/entrega/revisar": revisar,
  "POST /api/profesor/entrega/reabrir": reabrir,
  "GET /api/profesor/alumnos": alumnos,
  "POST /api/profesor/alumno": editarAlumno,
  "POST /api/profesor/alumno/borrar": borrarAlumno,
};
