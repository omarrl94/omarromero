/**
 * Única función de la API: enruta /api/* a los manejadores.
 *   lib/rutas-cuenta.mjs    registro, acceso, recuperación
 *   lib/rutas-alumno.mjs    exámenes y entregas del alumno
 *   lib/rutas-profesor.mjs  panel del profesor (exámenes y alumnos de sus ciclos)
 *   lib/rutas-admin.mjs     aprobación de profesores (solo el administrador)
 */
import { json, HttpError } from "../lib/http.mjs";
import cuenta from "../lib/rutas-cuenta.mjs";
import alumno from "../lib/rutas-alumno.mjs";
import profesor from "../lib/rutas-profesor.mjs";
import admin from "../lib/rutas-admin.mjs";
import { cargarCatalogo } from "../lib/catalogo.mjs";

const RUTAS = { ...cuenta, ...alumno, ...profesor, ...admin };

export default async (req) => {
  const url = new URL(req.url);
  const ruta = RUTAS[`${req.method} ${url.pathname.replace(/\/+$/, "")}`];
  if (!ruta) return json({ error: "No encontrado" }, 404);
  // Las peticiones que modifican datos deben ser JSON: bloquea formularios de otras webs (CSRF).
  if (req.method !== "GET" && !(req.headers.get("content-type") || "").includes("application/json"))
    return json({ error: "Tipo de contenido no admitido" }, 415);
  try {
    await cargarCatalogo(); // centro, ciclos y módulos (se configuran desde el panel)
    return await ruta(req, url);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Error interno del servidor" }, 500);
  }
};

export const config = { path: "/api/*" };
