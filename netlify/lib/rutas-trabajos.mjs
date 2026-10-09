/**
 * Trabajos: el profesor publica un trabajo en un módulo, el alumnado entrega
 * sus archivos y el profesor lo califica. Para comprobar que el trabajo es
 * suyo, la IA prepara una «defensa»: preguntas personalizadas sobre ESE
 * trabajo que el alumno contesta en la plataforma (un examen privado, con
 * modo seguro). Nota final = trabajo y defensa, con el peso que elija el profesor.
 *
 * Almacenes:
 *   trabajos          id → trabajo
 *   entregasTrabajo   «trabajo/email» → entrega (archivos, texto, notas, defensa)
 *   archivos          «trabajo/email/archivo» → { nombre, tipo, datos (base64) }
 */
import { createHash, randomBytes } from "node:crypto";
import { almacen, leerTodas } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto } from "./http.mjs";
import { requiereUsuario, requiereProfesor, esStaff, gestionaCiclo, gestionaExamen } from "./auth.mjs";
import { buscarModulo, cicloDe, moduloVisible } from "./catalogo.mjs";
import { validarExamen } from "./examenes.mjs";
import { generarDefensa } from "./ia.mjs";
import { enviarCorreo, proveedorConfigurado } from "./correo.mjs";
import { correoAviso } from "./plantillas.mjs";

const trabajos = () => almacen("trabajos");
const entregasT = () => almacen("entregasTrabajo");
const archivos = () => almacen("archivos");
const examenes = () => almacen("examenes");
const entregasEx = () => almacen("entregas");

const MAX_ARCHIVO = 4 * 1024 * 1024; // 4 MB por archivo (límite de las funciones de Netlify)
const MAX_ARCHIVOS = 6;
const TIPOS = /\.(pdf|docx?|pptx?|xlsx?|odt|odp|ods|txt|md|zip|rar|7z|png|jpe?g|gif|webp|c|cpp|h|java|py|js|ts|html|css|sql|json|xml|csv|ino|sh|ps1)$/i;
const r2 = (x) => Math.round(x * 100) / 100;
const clave = (id, email) => `${id}/${email}`;
const idDefensa = (id, email) => `defensa-${id}-${createHash("sha256").update(email).digest("hex").slice(0, 10)}`.slice(0, 62);

/* ── Utilidades ─────────────────────────────────────────────── */
function validarTrabajo(b, previo) {
  const titulo = texto(b.titulo, 200);
  if (titulo.length < 3) fallo(400, "Escribe el título del trabajo");
  const ubic = buscarModulo(b.cicloId, b.moduloId);
  if (!ubic) fallo(400, "Elige el ciclo y el módulo");
  const fecha = String(b.fechaLimite || "").trim();
  if (fecha && Number.isNaN(Date.parse(fecha))) fallo(400, "La fecha límite no es válida");
  const peso = Number(b.pesoTrabajo ?? 60);
  if (!Number.isFinite(peso) || peso < 0 || peso > 100) fallo(400, "El peso del trabajo debe estar entre 0 y 100");
  const nTest = Math.max(0, Math.min(15, Number(b.nTest ?? 5) || 0)), nAbiertas = Math.max(0, Math.min(6, Number(b.nAbiertas ?? 2) || 0));
  if (nTest + nAbiertas === 0) fallo(400, "La defensa necesita al menos una pregunta");
  return {
    id: previo?.id || `${ubic.modulo.id}-${Date.now().toString(36)}${randomBytes(2).toString("hex")}`.slice(0, 60),
    titulo, descripcion: String(b.descripcion ?? "").slice(0, 6000),
    cicloId: ubic.ciclo.id, moduloId: ubic.modulo.id, ciclo: ubic.ciclo.nombre, modulo: ubic.modulo.nombre,
    fechaLimite: fecha ? new Date(fecha).toISOString() : "", admiteTarde: b.admiteTarde !== false,
    pesoTrabajo: peso, nTest, nAbiertas, publicado: b.publicado === true,
  };
}

/** El alumno ve los trabajos publicados de su ciclo y de los módulos de su curso. */
const puedeVerTrabajo = (u, t) => (esStaff(u) ? gestionaExamen(u, t) : t.publicado && t.cicloId === cicloDe(u) && moduloVisible(t.cicloId, t.moduloId, u));

async function trabajoDe(id, u) {
  const t = await trabajos().get(String(id || ""));
  if (!t || !puedeVerTrabajo(u, t)) fallo(404, "Trabajo no encontrado");
  return t;
}

/** Nota de la defensa (examen privado) si ya la ha hecho. */
async function notaDefensa(e) {
  if (!e?.defensa?.examen) return null;
  const ent = await entregasEx().get(`${e.defensa.examen}/${e.email}`);
  return ent ? { nota: ent.notaProfesor ?? ent.resultado.nota, fecha: ent.fechaTexto, revisada: ent.notaProfesor != null } : null;
}

/** Nota final: la que ponga el profesor o la media ponderada de trabajo y defensa. */
function notaFinal(t, e, def) {
  if (e?.notaFinalManual != null) return e.notaFinalManual;
  if (e?.notaTrabajo == null) return null;
  if (!e.defensa) return null; // sin defensa todavía
  if (!def) return null;
  return r2((e.notaTrabajo * t.pesoTrabajo + def.nota * (100 - t.pesoTrabajo)) / 100);
}

async function estadoAlumno(t, e) {
  const def = await notaDefensa(e);
  const final = notaFinal(t, e, def);
  let estado = !e || e.estado === "borrador" ? "pendiente" : e.estado === "devuelto" ? "devuelto" : "entregado";
  if (e?.defensa && !def) estado = "defensa";
  if (final != null) estado = "calificado";
  return { estado, def, final };
}

function resumenTrabajo(t) {
  const { id, titulo, descripcion, cicloId, moduloId, ciclo, modulo, fechaLimite, admiteTarde, pesoTrabajo, nTest, nAbiertas, publicado, creado } = t;
  return { id, titulo, descripcion, cicloId, moduloId, ciclo, modulo, fechaLimite, admiteTarde, pesoTrabajo, nTest, nAbiertas, publicado, creado, autor: t.autor?.nombre || "" };
}
const archivosPublicos = (e) => (e?.archivos || []).map(({ id, nombre, tipo, tamano, fecha }) => ({ id, nombre, tipo, tamano, fecha }));

function avisar(email, nombre, titulo, mensaje) {
  if (!proveedorConfigurado()) return;
  const c = correoAviso(nombre, titulo, mensaje);
  enviarCorreo({ to: email, subject: c.asunto, html: c.html, text: c.text }).catch((err) => console.error("Aviso de trabajo:", err));
}

/* ── Alumnado ───────────────────────────────────────────────── */
async function listarAlumno(req) {
  const u = await requiereUsuario(req);
  const lista = (await leerTodas(trabajos(), await trabajos().list())).filter((t) => puedeVerTrabajo(u, t));
  const filas = await Promise.all(lista.map(async (t) => {
    const e = await entregasT().get(clave(t.id, u.email));
    const s = await estadoAlumno(t, e);
    return { ...resumenTrabajo(t), estado: s.estado, notaFinal: s.final, notaTrabajo: e?.notaTrabajo ?? null, defensa: e?.defensa ? { examen: e.defensa.examen, hecha: !!s.def } : null };
  }));
  filas.sort((a, b) => (a.fechaLimite || "9").localeCompare(b.fechaLimite || "9") || a.titulo.localeCompare(b.titulo, "es"));
  return json({ trabajos: filas });
}

async function verAlumno(req, url) {
  const u = await requiereUsuario(req);
  const t = await trabajoDe(url.searchParams.get("id"), u);
  const e = await entregasT().get(clave(t.id, u.email));
  const s = await estadoAlumno(t, e);
  return json({
    trabajo: resumenTrabajo(t),
    entrega: e ? {
      estado: s.estado, archivos: archivosPublicos(e), comentario: e.comentario || "", fecha: e.fecha || null, tarde: !!e.tarde,
      notaTrabajo: s.final != null || e.publicarNota ? e.notaTrabajo ?? null : null, comentarioProfesor: e.comentarioProfesor || "",
      defensa: e.defensa ? { examen: e.defensa.examen, hecha: !!s.def, nota: s.def?.nota ?? null } : null, notaFinal: s.final,
    } : { estado: "pendiente", archivos: [] },
  });
}

const fueraDePlazo = (t) => t.fechaLimite && Date.now() > Date.parse(t.fechaLimite);
const editable = (e) => !e || e.estado === "borrador" || e.estado === "devuelto";

async function subirArchivo(req) {
  const u = await requiereUsuario(req);
  if (esStaff(u)) fallo(400, "Solo el alumnado entrega trabajos");
  const b = await leerCuerpo(req, Math.ceil(MAX_ARCHIVO * 1.4) + 250_000);
  const t = await trabajoDe(b.id, u);
  if (fueraDePlazo(t) && !t.admiteTarde) fallo(409, "El plazo de entrega ha terminado");
  const k = clave(t.id, u.email);
  const e = (await entregasT().get(k)) || { email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo, trabajo: t.id, estado: "borrador", archivos: [], textos: {} };
  if (!editable(e)) fallo(409, "Ya has entregado este trabajo. Si necesitas cambiarlo, pide al profesor que te lo devuelva.");
  const nombre = texto(b.nombre, 160).replace(/[\\/]/g, "_");
  if (!nombre || !TIPOS.test(nombre)) fallo(400, "Tipo de archivo no admitido (PDF, Word, PowerPoint, Excel, imágenes, código, ZIP…)");
  const datos = String(b.datos || "");
  if (!/^[A-Za-z0-9+/=]+$/.test(datos)) fallo(400, "Archivo no válido");
  const tamano = Math.floor((datos.length * 3) / 4);
  if (tamano > MAX_ARCHIVO) fallo(413, "El archivo ocupa más de 4 MB. Comprímelo o divídelo en varios.");
  if (e.archivos.length >= MAX_ARCHIVOS) fallo(400, `Como máximo ${MAX_ARCHIVOS} archivos por trabajo`);
  const id = randomBytes(6).toString("hex");
  await archivos().set(`${k}/${id}`, { nombre, tipo: texto(b.tipo, 100) || "application/octet-stream", datos });
  e.archivos.push({ id, nombre, tipo: texto(b.tipo, 100), tamano, fecha: new Date().toISOString() });
  // Texto del archivo (lo extrae el navegador): lo usa la IA para las preguntas de la defensa.
  e.textos = { ...(e.textos || {}), [id]: String(b.texto || "").slice(0, 60_000) };
  await entregasT().set(k, e);
  return json({ ok: true, archivos: archivosPublicos(e) });
}

async function borrarArchivo(req) {
  const u = await requiereUsuario(req);
  const b = await leerCuerpo(req);
  const t = await trabajoDe(b.id, u);
  const k = clave(t.id, u.email);
  const e = await entregasT().get(k);
  if (!e || !editable(e)) fallo(409, "Este trabajo ya está entregado");
  e.archivos = e.archivos.filter((a) => a.id !== b.archivo);
  if (e.textos) delete e.textos[b.archivo];
  await archivos().del(`${k}/${b.archivo}`);
  await entregasT().set(k, e);
  return json({ ok: true, archivos: archivosPublicos(e) });
}

async function entregar(req) {
  const u = await requiereUsuario(req);
  const b = await leerCuerpo(req);
  const t = await trabajoDe(b.id, u);
  const k = clave(t.id, u.email);
  const e = await entregasT().get(k);
  if (!e?.archivos?.length) fallo(400, "Sube al menos un archivo antes de entregar");
  if (!editable(e)) fallo(409, "Ya has entregado este trabajo");
  const tarde = fueraDePlazo(t);
  if (tarde && !t.admiteTarde) fallo(409, "El plazo de entrega ha terminado");
  const ahora = new Date();
  Object.assign(e, {
    estado: "entregado", comentario: String(b.comentario ?? "").slice(0, 2000), tarde, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo,
    fecha: ahora.toISOString(), fechaTexto: ahora.toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
  });
  await entregasT().set(k, e);
  avisar(u.email, u.nombre, `Trabajo entregado: ${t.titulo}`, `Hemos recibido tu trabajo «${t.titulo}» (${e.archivos.length} ${e.archivos.length === 1 ? "archivo" : "archivos"}) el ${e.fechaTexto}${tarde ? ", fuera de plazo" : ""}. Te avisaremos cuando el profesor lo revise.`);
  return json({ ok: true });
}

/** Descarga de un archivo: su autor o el profesorado que gestiona el trabajo. */
async function descargar(req, url) {
  const u = await requiereUsuario(req);
  const t = await trabajos().get(url.searchParams.get("t") || "");
  const email = String(url.searchParams.get("e") || "").toLowerCase();
  if (!t || !(esStaff(u) ? gestionaExamen(u, t) : email === u.email)) fallo(404, "Archivo no encontrado");
  const a = await archivos().get(`${clave(t.id, email)}/${url.searchParams.get("f") || ""}`);
  if (!a) fallo(404, "Archivo no encontrado");
  return new Response(Buffer.from(a.datos, "base64"), {
    headers: {
      "Content-Type": a.tipo || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(a.nombre)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/* ── Profesorado ────────────────────────────────────────────── */
async function listarProfesor(req) {
  const u = await requiereProfesor(req);
  const lista = (await leerTodas(trabajos(), await trabajos().list())).filter((t) => gestionaExamen(u, t));
  const filas = await Promise.all(lista.map(async (t) => {
    const es = await leerTodas(entregasT(), await entregasT().list(t.id + "/"));
    const ent = es.filter((e) => e.estado !== "borrador");
    return { ...resumenTrabajo(t), entregas: ent.length, sinCalificar: ent.filter((e) => e.notaTrabajo == null).length };
  }));
  filas.sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
  return json({ trabajos: filas });
}

async function guardarTrabajo(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const previo = b.id ? await trabajos().get(String(b.id)) : null;
  if (b.id && !gestionaExamen(u, previo)) fallo(404, "Trabajo no encontrado");
  const t = validarTrabajo(b, previo);
  if (!gestionaCiclo(u, t.cicloId)) fallo(403, "Solo puedes crear trabajos de tus ciclos");
  const ahora = new Date().toISOString();
  await trabajos().set(t.id, { ...t, creado: previo?.creado || ahora, actualizado: ahora, autor: previo?.autor || { email: u.email, nombre: `${u.nombre} ${u.apellidos}`.trim() } });
  return json({ ok: true, id: t.id });
}

async function trabajoProfesor(id, u) {
  const t = await trabajos().get(String(id || ""));
  if (!gestionaExamen(u, t)) fallo(404, "Trabajo no encontrado");
  return t;
}

async function borrarTrabajo(req) {
  const u = await requiereProfesor(req);
  const t = await trabajoProfesor((await leerCuerpo(req)).id, u);
  for (const k of await entregasT().list(t.id + "/")) {
    const e = await entregasT().get(k);
    if (e?.defensa?.examen) { await examenes().del(e.defensa.examen); await entregasEx().del(`${e.defensa.examen}/${e.email}`); }
    await entregasT().del(k);
  }
  for (const k of await archivos().list(t.id + "/")) await archivos().del(k);
  await trabajos().del(t.id);
  return json({ ok: true });
}

async function entregasProfesor(req, url) {
  const u = await requiereProfesor(req);
  const t = await trabajoProfesor(url.searchParams.get("id"), u);
  const es = (await leerTodas(entregasT(), await entregasT().list(t.id + "/"))).filter((e) => e.estado !== "borrador");
  const filas = await Promise.all(es.map(async (e) => {
    const s = await estadoAlumno(t, e);
    return {
      email: e.email, nombre: e.nombre, apellidos: e.apellidos, grupo: e.grupo, estado: s.estado, fecha: e.fecha, fechaTexto: e.fechaTexto, tarde: !!e.tarde,
      archivos: archivosPublicos(e), notaTrabajo: e.notaTrabajo ?? null, defensa: e.defensa ? { examen: e.defensa.examen, enviada: e.defensa.fecha, nota: s.def?.nota ?? null } : null,
      notaFinal: s.final, notaFinalManual: e.notaFinalManual ?? null,
    };
  }));
  filas.sort((a, b) => `${a.grupo} ${a.apellidos} ${a.nombre}`.localeCompare(`${b.grupo} ${b.apellidos} ${b.nombre}`, "es"));
  return json({ trabajo: resumenTrabajo(t), filas });
}

async function entregaProfesor(req, url) {
  const u = await requiereProfesor(req);
  const t = await trabajoProfesor(url.searchParams.get("id"), u);
  const e = await entregasT().get(clave(t.id, String(url.searchParams.get("email") || "").toLowerCase()));
  if (!e || e.estado === "borrador") fallo(404, "Entrega no encontrada");
  const s = await estadoAlumno(t, e);
  const textoTotal = (e.archivos || []).map((a) => e.textos?.[a.id] ? `### ${a.nombre}\n${e.textos[a.id]}` : "").filter(Boolean).join("\n\n");
  return json({
    trabajo: resumenTrabajo(t),
    entrega: {
      email: e.email, nombre: e.nombre, apellidos: e.apellidos, grupo: e.grupo, estado: s.estado, fechaTexto: e.fechaTexto, tarde: !!e.tarde,
      comentario: e.comentario || "", archivos: archivosPublicos(e), texto: textoTotal.slice(0, 200_000), caracteres: textoTotal.length,
      notaTrabajo: e.notaTrabajo ?? null, comentarioProfesor: e.comentarioProfesor || "", notaFinalManual: e.notaFinalManual ?? null,
      defensa: e.defensa ? { ...e.defensa, nota: s.def?.nota ?? null, fechaHecha: s.def?.fecha || null } : null, notaFinal: s.final,
    },
  });
}

async function calificar(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const t = await trabajoProfesor(b.id, u);
  const k = clave(t.id, String(b.email || "").toLowerCase());
  const e = await entregasT().get(k);
  if (!e || e.estado === "borrador") fallo(404, "Entrega no encontrada");
  const nota = (v, que) => {
    if (v === null || v === "" || v === undefined) return null;
    const n = Number(String(v).replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 10) fallo(400, `${que} debe estar entre 0 y 10`);
    return r2(n);
  };
  if (b.notaTrabajo !== undefined) e.notaTrabajo = nota(b.notaTrabajo, "La nota del trabajo");
  if (b.notaFinalManual !== undefined) e.notaFinalManual = nota(b.notaFinalManual, "La nota final");
  if (b.comentario !== undefined) e.comentarioProfesor = String(b.comentario ?? "").slice(0, 3000);
  await entregasT().set(k, e);
  const s = await estadoAlumno(t, e);
  if (s.final != null && b.avisar) avisar(e.email, e.nombre, `Nota del trabajo: ${t.titulo}`, `Tu trabajo «${t.titulo}» ya está calificado: ${String(s.final).replace(".", ",")} sobre 10. Puedes verlo en la plataforma.`);
  return json({ ok: true, notaFinal: s.final });
}

/** Devuelve el trabajo al alumno para que lo corrija y lo vuelva a entregar. */
async function devolver(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const t = await trabajoProfesor(b.id, u);
  const k = clave(t.id, String(b.email || "").toLowerCase());
  const e = await entregasT().get(k);
  if (!e) fallo(404, "Entrega no encontrada");
  e.estado = "devuelto";
  e.comentarioProfesor = String(b.comentario ?? e.comentarioProfesor ?? "").slice(0, 3000);
  await entregasT().set(k, e);
  avisar(e.email, e.nombre, `Trabajo devuelto: ${t.titulo}`, `El profesor te ha devuelto el trabajo «${t.titulo}» para que lo corrijas y lo vuelvas a entregar.${e.comentarioProfesor ? ` Comentario: ${e.comentarioProfesor}` : ""}`);
  return json({ ok: true });
}

/* ── Defensa del trabajo ────────────────────────────────────── */
/** La IA prepara preguntas sobre el trabajo de ese alumno (no se guardan hasta enviarlas). */
async function generarDefensaRuta(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const t = await trabajoProfesor(b.id, u);
  const e = await entregasT().get(clave(t.id, String(b.email || "").toLowerCase()));
  if (!e || e.estado === "borrador") fallo(404, "Entrega no encontrada");
  const textoTrabajo = (e.archivos || []).map((a) => (e.textos?.[a.id] ? `### Archivo: ${a.nombre}\n${e.textos[a.id]}` : `### Archivo: ${a.nombre} (sin texto legible)`)).join("\n\n");
  if (textoTrabajo.replace(/###.*\n?/g, "").trim().length < 200) fallo(400, "No hay texto suficiente en los archivos del trabajo (¿son imágenes o un ZIP?). Escribe tú las preguntas o pide el trabajo en PDF o Word.");
  const nTest = Math.max(0, Math.min(15, Number(b.nTest ?? t.nTest) || 0)), nAbiertas = Math.max(0, Math.min(6, Number(b.nAbiertas ?? t.nAbiertas) || 0));
  const r = await generarDefensa({ titulo: t.titulo, enunciado: t.descripcion, trabajo: textoTrabajo.slice(0, 80_000), nTest, nAbiertas, indicaciones: texto(b.indicaciones, 800) });
  return json(r);
}

/** Crea la defensa como examen privado de ese alumno y le avisa. */
async function enviarDefensa(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req, 400_000);
  const t = await trabajoProfesor(b.id, u);
  const email = String(b.email || "").toLowerCase();
  const k = clave(t.id, email);
  const e = await entregasT().get(k);
  if (!e || e.estado === "borrador") fallo(404, "Entrega no encontrada");
  const idEx = idDefensa(t.id, email);
  if (e.defensa && (await entregasEx().get(`${idEx}/${email}`))) fallo(409, "El alumno ya ha hecho la defensa. Si quieres repetirla, bórrala primero.");
  const ex = validarExamen({
    id: idEx, titulo: `Defensa del trabajo: ${t.titulo}`.slice(0, 200), subtitulo: "Preguntas personalizadas sobre tu trabajo",
    cicloId: t.cicloId, moduloId: t.moduloId, mc: b.mc || [], open: b.open || [], publicado: true, mostrarSoluciones: b.mostrarSoluciones !== false,
    seguridad: b.seguridad !== false, intentos: 1, aleatorio: { preguntas: true, opciones: true }, herramientas: { notas: false, calculadora: true },
    partes: { mc: "Test sobre tu trabajo", open: "Explica tu trabajo" },
  });
  const ahora = new Date().toISOString();
  await examenes().set(idEx, { ...ex, privado: email, defensaDe: { trabajo: t.id, email }, autor: t.autor, creado: ahora, actualizado: ahora });
  e.defensa = { examen: idEx, fecha: ahora, nTest: ex.mc.length, nAbiertas: ex.open.length };
  await entregasT().set(k, e);
  avisar(email, e.nombre, `Defensa de tu trabajo: ${t.titulo}`, `Tu profesor ha preparado unas preguntas sobre tu trabajo «${t.titulo}». Entra en la plataforma, abre el trabajo y pulsa «Hacer la defensa». Solo tienes un intento.`);
  return json({ ok: true, examen: idEx });
}

async function borrarDefensa(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const t = await trabajoProfesor(b.id, u);
  const email = String(b.email || "").toLowerCase();
  const k = clave(t.id, email);
  const e = await entregasT().get(k);
  if (!e?.defensa) fallo(404, "No hay defensa");
  await examenes().del(e.defensa.examen);
  await entregasEx().del(`${e.defensa.examen}/${email}`);
  await almacen("progreso").del(`${e.defensa.examen}/${email}`);
  delete e.defensa;
  await entregasT().set(k, e);
  return json({ ok: true });
}

/** Notas de los trabajos de un ciclo para la pestaña Grupos: { trabajoId: { email: nota } }. */
export async function notasTrabajos(u, cicloId, emails) {
  const lista = (await leerTodas(trabajos(), await trabajos().list())).filter((t) => t.cicloId === cicloId && gestionaExamen(u, t));
  const out = [];
  for (const t of lista) {
    const notas = {};
    for (const e of await leerTodas(entregasT(), (await entregasT().list(t.id + "/")).filter((k) => emails.has(k.slice(t.id.length + 1))))) {
      const s = await estadoAlumno(t, e);
      if (e.estado !== "borrador") notas[e.email] = { nota: s.final, estado: s.estado };
    }
    out.push({ ...resumenTrabajo(t), notas });
  }
  return out;
}

export default {
  "GET /api/trabajos": listarAlumno,
  "GET /api/trabajo": verAlumno,
  "POST /api/trabajo/archivo": subirArchivo,
  "POST /api/trabajo/archivo/borrar": borrarArchivo,
  "POST /api/trabajo/entregar": entregar,
  "GET /api/trabajo/descargar": descargar,
  "GET /api/profesor/trabajos": listarProfesor,
  "POST /api/profesor/trabajo": guardarTrabajo,
  "POST /api/profesor/trabajo/borrar": borrarTrabajo,
  "GET /api/profesor/trabajo/entregas": entregasProfesor,
  "GET /api/profesor/trabajo/entrega": entregaProfesor,
  "POST /api/profesor/trabajo/calificar": calificar,
  "POST /api/profesor/trabajo/devolver": devolver,
  "POST /api/profesor/trabajo/defensa/generar": generarDefensaRuta,
  "POST /api/profesor/trabajo/defensa/enviar": enviarDefensa,
  "POST /api/profesor/trabajo/defensa/borrar": borrarDefensa,
};
