/**
 * /api/profesor/* — gestión de exámenes, entregas y alumnos.
 * Admin: todo. Profesor aprobado: solo lo de sus ciclos (lo comprueba cada ruta).
 */
import { almacen, leerTodas } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto } from "./http.mjs";
import { requiereProfesor, esAdmin, rolDe, ciclosDe, gestionaCiclo } from "./auth.mjs";
import { todosLosExamenes, obtenerExamen, validarExamen, resumen } from "./examenes.mjs";
import { claveEntrega, vistaEntrega } from "./entregas.mjs";
import { proveedorConfigurado } from "./correo.mjs";
import { CATALOGO, GRUPOS, cicloDe, buscarModulo } from "./catalogo.mjs";
import { iaDisponible, generarLote, proveedorIA, tamLote, comprobarIA } from "./ia.mjs";

const examenes = () => almacen("examenes");
const entregas = () => almacen("entregas");
const progreso = () => almacen("progreso");
const usuarios = () => almacen("usuarios");

/** Examen existente de uno de los ciclos del profesor. */
async function existente(id, u) {
  const ex = await obtenerExamen(id);
  if (!ex || !gestionaCiclo(u, ex.cicloId)) fallo(404, "Examen no encontrado");
  return ex;
}

/** Entrega de un examen de los ciclos del profesor. */
async function entregaPermitida(id, email, u) {
  const k = claveEntrega(String(id || ""), String(email || "").toLowerCase());
  const e = await entregas().get(k);
  if (!e || !gestionaCiclo(u, e.examen.cicloId)) fallo(404, "Entrega no encontrada");
  return { k, e };
}

const catalogoDe = (u) => CATALOGO.filter((c) => ciclosDe(u).includes(c.id));
const gruposDe = (u) => GRUPOS().filter((g) => ciclosDe(u).includes(g.cicloId));

async function listar(req) {
  const u = await requiereProfesor(req);
  const lista = (await todosLosExamenes()).filter((ex) => gestionaCiclo(u, ex.cicloId));
  const filas = await Promise.all(lista.map(async (ex) => ({
    ...resumen(ex), entregas: (await entregas().list(ex.id + "/")).length,
  })));
  return json({ catalogo: catalogoDe(u), examenes: filas, correo: !!proveedorConfigurado() });
}

async function verExamen(req, url) {
  const u = await requiereProfesor(req);
  const { publicado, mostrarSoluciones, ...ex } = await existente(url.searchParams.get("id"), u);
  return json({ ...ex, publicado, mostrarSoluciones });
}

async function guardar(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req, 2_000_000);
  const ex = validarExamen(b);
  if (!gestionaCiclo(u, ex.cicloId)) fallo(403, "Solo puedes crear exámenes de tus ciclos");
  const previo = await examenes().get(ex.id);
  if (previo && !gestionaCiclo(u, previo.cicloId)) fallo(409, `El identificador «${ex.id}» ya lo usa otro examen. Elige otro.`);
  if (previo && !b.sobrescribir) fallo(409, `Ya existe un examen con el identificador «${ex.id}». Marca «Reemplazar» o cambia el identificador.`);
  const ahora = new Date().toISOString();
  await examenes().set(ex.id, {
    ...ex, creado: previo?.creado || ahora, actualizado: ahora,
    autor: previo?.autor || { email: u.email, nombre: `${u.nombre} ${u.apellidos}`.trim() },
  });
  return json({ ok: true, id: ex.id });
}

async function ajustes(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id, u);
  if (typeof b.publicado === "boolean") ex.publicado = b.publicado;
  if (typeof b.mostrarSoluciones === "boolean") ex.mostrarSoluciones = b.mostrarSoluciones;
  if (Number.isFinite(b.orden)) ex.orden = b.orden;
  ex.actualizado = new Date().toISOString();
  await examenes().set(ex.id, ex);
  return json({ ok: true });
}

async function borrar(req) {
  const u = await requiereProfesor(req);
  const { id } = await leerCuerpo(req);
  const ex = await existente(id, u);
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
  const u = await requiereProfesor(req);
  const ex = await existente(url.searchParams.get("id"), u);
  return json({ examen: resumen(ex), filas: await filasEntregas(ex.id) });
}

async function csv(req, url) {
  const u = await requiereProfesor(req);
  const ex = await existente(url.searchParams.get("id"), u);
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
  const u = await requiereProfesor(req);
  const { e } = await entregaPermitida(url.searchParams.get("id"), url.searchParams.get("email"), u);
  const p = await progreso().get(claveEntrega(e.examen.id, e.email));
  return json({ ...vistaEntrega(e, { soluciones: true }), registroSalidas: p?.salidas || [] });
}

async function revisar(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const { k, e } = await entregaPermitida(b.id, b.email, u);
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
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id, u);
  const k = claveEntrega(ex.id, String(b.email || "").toLowerCase());
  await Promise.all([entregas().del(k), progreso().del(k)]);
  return json({ ok: true });
}

/** Alumno al que este profesor puede gestionar (de sus ciclos; el admin, cualquiera). */
async function alumnoPermitido(email, yo) {
  const u = await usuarios().get(String(email || "").toLowerCase());
  const esAlumno = u && rolDe(u) === "alumno";
  if (!u || (!esAdmin(yo.email) && !(esAlumno && gestionaCiclo(yo, cicloDe(u))))) fallo(404, "Alumno no encontrado");
  return u;
}

async function alumnos(req) {
  const yo = await requiereProfesor(req);
  const admin = esAdmin(yo.email);
  // El profesor ve los alumnos de sus ciclos; el admin, todas las cuentas de alumno
  // (los profesores se gestionan en la pestaña «Profesores»).
  const lista = (await leerTodas(usuarios(), await usuarios().list()))
    .filter((u) => rolDe(u) === "alumno" && (admin || gestionaCiclo(yo, cicloDe(u))));
  return json({
    grupos: gruposDe(yo),
    alumnos: lista
      .map((u) => ({ email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo, cicloId: cicloDe(u), verificado: !!u.verificado, creado: u.creado, profesor: false }))
      .sort((a, b) => `${a.grupo} ${a.apellidos}`.localeCompare(`${b.grupo} ${b.apellidos}`, "es")),
  });
}

async function editarAlumno(req) {
  const yo = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const u = await alumnoPermitido(b.email, yo);
  if (b.grupo !== undefined) {
    const g = gruposDe(yo).find((x) => x.grupo === texto(b.grupo, 60));
    if (!g) fallo(400, "Grupo no válido");
    u.grupo = g.grupo;
    u.cicloId = g.cicloId;
  }
  if (b.verificado === true) { u.verificado = true; delete u.codigo; }
  await usuarios().set(u.email, u);
  return json({ ok: true });
}

async function borrarAlumno(req) {
  const yo = await requiereProfesor(req);
  const email = String((await leerCuerpo(req)).email || "").toLowerCase();
  if (email === yo.email) fallo(400, "No puedes borrar tu propia cuenta");
  const u = await alumnoPermitido(email, yo);
  if (esAdmin(u.email)) fallo(400, "No se puede borrar la cuenta del administrador");
  await usuarios().del(u.email);
  return json({ ok: true });
}

/* ── IA: generar preguntas a partir del material de un tema ── */
async function iaEstado(req) {
  await requiereProfesor(req);
  return json({ disponible: iaDisponible(), proveedor: proveedorIA(), lote: tamLote(), ...(await comprobarIA()) });
}

async function iaPreguntas(req) {
  const yo = await requiereProfesor(req);
  const b = await leerCuerpo(req, 1_500_000);
  if (!gestionaCiclo(yo, b.cicloId)) fallo(403, "Solo puedes generar exámenes de tus ciclos");
  const tipo = b.tipo === "open" ? "open" : "mc";
  const material = String(b.material || "").trim();
  if (material.length < 200) fallo(400, "El material tiene muy poco texto. ¿Son diapositivas con solo imágenes?");
  if (material.length > 400_000) fallo(413, "El material es demasiado largo. Súbelo por partes (por ejemplo, un tema cada vez).");
  const n = Math.min(Math.max(Number(b.n) || 5, 1), 12);
  const ubic = buscarModulo(b.cicloId, b.moduloId);
  const preguntas = await generarLote({
    tipo, material, n,
    ya: (Array.isArray(b.ya) ? b.ya : []).slice(0, 100).map((t) => texto(t, 300)),
    lote: Number(b.lote) || 1, lotes: Number(b.lotes) || 1,
    titulo: texto(b.titulo, 200), modulo: ubic?.modulo.nombre || "",
    indicaciones: texto(b.indicaciones, 1000),
  });
  return json({ preguntas });
}

export default {
  "GET /api/profesor/ia": iaEstado,
  "POST /api/profesor/ia/preguntas": iaPreguntas,
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
