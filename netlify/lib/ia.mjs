/**
 * Generación de preguntas con IA (Claude) a partir del material de un tema.
 *
 * El navegador del profesor extrae el texto de las diapositivas/PDF y pide las
 * preguntas en lotes pequeños (cada petición dura poco y no choca con el límite
 * de tiempo de las funciones de Netlify). El material va en un bloque cacheado,
 * así los lotes siguientes del mismo tema salen más baratos y rápidos.
 *
 * Requiere la variable de entorno ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import { randomInt } from "node:crypto";
import { env, fallo } from "./http.mjs";

const MODELO = "claude-opus-5-5";

let cliente;
const claude = () =>
  (cliente ||= new Anthropic({ apiKey: env("ANTHROPIC_API_KEY"), timeout: 55_000, maxRetries: 1 }));

export const iaDisponible = () => !!env("ANTHROPIC_API_KEY");

const SISTEMA = `Eres profesor de Formación Profesional (ciclos de grado superior de informática) en un centro de España y redactas preguntas de examen a partir del material de un tema.

Criterios:
- Pregunta solo por contenido teórico que aparezca en el material. No inventes datos, fechas ni nombres que no estén en él.
- Ignora la portada, el índice, las actividades prácticas, los debates, las rúbricas, los porcentajes de evaluación y las instrucciones de entrega.
- Escribe en español de España, con enunciados claros y autocontenidos: el alumno no ve el material, así que nunca digas «según la diapositiva…» ni «como se vio en clase».
- Reparte las preguntas por todo el temario en lugar de concentrarlas en una parte.
- Preguntas tipo test: exactamente 4 opciones, una sola correcta sin discusión posible. Los distractores deben ser plausibles, del mismo tipo y de longitud parecida a la correcta. Evita «todas las anteriores», «ninguna de las anteriores» y las dobles negaciones.
- Preguntas abiertas: piden explicar, comparar, razonar o poner ejemplos. Se corrigen automáticamente buscando conceptos clave en la respuesta del alumno, así que para cada una da entre 3 y 6 conceptos; cada concepto lleva varias raíces cortas en minúsculas y sin tildes (por ejemplo «supervis», «etiquet», «sin etiquet») que cubran sinónimos y formas habituales de expresarlo. «full» es el número de conceptos que debe mencionar una respuesta completa y «partial» el mínimo para una respuesta a medias (partial < full ≤ número de conceptos). «exp» es la respuesta modelo en 1–3 frases. «act» es el nombre corto del bloque del temario al que pertenece la pregunta.`;

const objeto = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const lista = (items) => ({ type: "array", items });

const ESQUEMAS = {
  mc: objeto({
    preguntas: lista(objeto({
      enunciado: { type: "string" },
      opciones: lista({ type: "string" }),
      correcta: { type: "integer", description: "Índice (0-3) de la opción correcta" },
    })),
  }),
  open: objeto({
    preguntas: lista(objeto({
      act: { type: "string" },
      enunciado: { type: "string" },
      conceptos: lista(objeto({ nombre: { type: "string" }, raices: lista({ type: "string" }) })),
      full: { type: "integer" },
      partial: { type: "integer" },
      exp: { type: "string" },
    })),
  }),
};

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

function barajar(opciones, correcta) {
  const idx = opciones.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = randomInt(i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return { o: idx.map((i) => opciones[i]), c: idx.indexOf(correcta) };
}

/** Limpia y valida lo que devuelve el modelo; descarta lo que no encaje. */
function normalizarMc(p) {
  const opciones = (p.opciones || []).map((o) => String(o).trim()).filter(Boolean);
  if (!p.enunciado?.trim() || opciones.length < 2 || opciones.length > 5) return null;
  if (!Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta >= opciones.length) return null;
  if (new Set(opciones.map(norm)).size !== opciones.length) return null;
  // Barajamos aquí: así la respuesta correcta queda repartida entre a, b, c y d.
  return { t: p.enunciado.trim(), ...barajar(opciones, p.correcta) };
}

function normalizarAbierta(p) {
  const groups = (p.conceptos || [])
    .map((c) => [...new Set((c.raices || []).map(norm).filter((r) => r.length >= 3))])
    .filter((g) => g.length);
  if (!p.enunciado?.trim() || groups.length < 2) return null;
  const full = Math.min(Math.max(Number(p.full) || 2, 2), groups.length);
  const partial = Math.min(Math.max(Number(p.partial) || 1, 1), full - 1);
  return { act: String(p.act || "").trim().slice(0, 300), t: p.enunciado.trim(), groups, full, partial, exp: String(p.exp || "").trim() };
}

/**
 * Pide un lote de preguntas.
 * @param tipo "mc" | "open"
 * @param material texto del tema
 * @param n cuántas preguntas
 * @param ya enunciados ya generados (para no repetir)
 * @param lote/lotes posición del lote, para repartir el temario
 */
export async function generarLote({ tipo, material, n, ya = [], lote = 1, lotes = 1, titulo = "", modulo = "", indicaciones = "" }) {
  if (!iaDisponible()) fallo(503, "Falta configurar ANTHROPIC_API_KEY en Netlify para usar la IA.");
  const que = tipo === "mc" ? `${n} preguntas tipo test` : `${n} preguntas abiertas`;
  const instruccion = [
    `Genera exactamente ${que} sobre el tema «${titulo}»${modulo ? ` del módulo «${modulo}»` : ""}.`,
    lotes > 1 ? `Es el lote ${lote} de ${lotes}: céntrate sobre todo en la parte ${lote} de ${lotes} del material (por orden de aparición), sin salirte del temario.` : "",
    ya.length ? `No repitas ni reformules estas preguntas ya hechas:\n${ya.map((t) => `- ${t}`).join("\n")}` : "",
    indicaciones ? `Indicaciones del profesor: ${indicaciones}` : "",
  ].filter(Boolean).join("\n\n");

  let r;
  try {
    r = await claude().beta.messages.stream({
      model: MODELO,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: ESQUEMAS[tipo] } },
      system: SISTEMA,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `<material>\n${material}\n</material>`, cache_control: { type: "ephemeral" } },
          { type: "text", text: instruccion },
        ],
      }],
    }).finalMessage();
  } catch (e) {
    console.error("[ia]", e);
    if (e instanceof Anthropic.AuthenticationError) fallo(502, "La clave ANTHROPIC_API_KEY no es válida.");
    if (e instanceof Anthropic.RateLimitError) fallo(429, "La IA está saturada en este momento. Espera un minuto y vuelve a intentarlo.");
    if (e instanceof Anthropic.APIConnectionTimeoutError) fallo(504, "La IA ha tardado demasiado. Vuelve a intentarlo.");
    if (e instanceof Anthropic.APIError) fallo(502, `Error de la IA (${e.status ?? "conexión"}). Vuelve a intentarlo.`);
    throw e;
  }
  if (r.stop_reason === "refusal") fallo(422, "La IA no ha querido generar preguntas con este material.");
  const texto = r.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let datos;
  try { datos = JSON.parse(texto); } catch { fallo(502, "La IA ha devuelto una respuesta incompleta. Vuelve a intentarlo."); }
  const preguntas = (datos.preguntas || []).map(tipo === "mc" ? normalizarMc : normalizarAbierta).filter(Boolean);
  console.log(JSON.stringify({ evento: "ia-lote", tipo, pedidas: n, validas: preguntas.length, uso: r.usage }));
  return preguntas;
}
