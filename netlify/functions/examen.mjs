/** GET /api/examen?id=…  → enunciado sin soluciones · sin id → listado */
import { EXAMENES, enunciadoPublico, listado } from "../lib/examenes/index.mjs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return json({ examenes: listado() });
  const ex = EXAMENES[id];
  return ex ? json(enunciadoPublico(ex)) : json({ error: "Examen no encontrado" }, 404);
};

export const config = { path: "/api/examen" };
