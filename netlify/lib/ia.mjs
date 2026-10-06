/**
 * Generación de preguntas con IA a partir del material de un tema.
 *
 * El navegador del profesor extrae el texto de las diapositivas/PDF y pide las
 * preguntas en lotes pequeños (cada petición dura poco y no choca con el límite
 * de tiempo de las funciones de Netlify).
 *
 * Proveedor, según las variables de entorno:
 *  · GEMINI_API_KEY    → Google Gemini (tiene plan gratuito). Modelo: GEMINI_MODEL
 *                        (por defecto gemini-2.5-flash).
 *  · ANTHROPIC_API_KEY → Claude (si no hay clave de Gemini).
 */
import Anthropic from "@anthropic-ai/sdk";
import { randomInt } from "node:crypto";
import { env, fallo } from "./http.mjs";

const MODELO_CLAUDE = "claude-opus-5-5";
const MODELO_GEMINI = () => env("GEMINI_MODEL", "gemini-2.5-flash");

let cliente;
const claude = () =>
  (cliente ||= new Anthropic({ apiKey: env("ANTHROPIC_API_KEY"), timeout: 55_000, maxRetries: 1 }));

export const proveedorIA = () => (env("GEMINI_API_KEY") ? "gemini" : env("ANTHROPIC_API_KEY") ? "claude" : null);
export const iaDisponible = () => !!proveedorIA();

/** Preguntas por petición: Gemini Flash es rápido y el plan gratuito limita peticiones/minuto. */
export const tamLote = () => (proveedorIA() === "gemini" ? { mc: 10, open: 5 } : { mc: 5, open: 3 });

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

/** Mismos esquemas en el formato de Gemini (subconjunto de OpenAPI). */
const gObj = (properties) => ({ type: "OBJECT", properties, required: Object.keys(properties), propertyOrdering: Object.keys(properties) });
const gArr = (items) => ({ type: "ARRAY", items });
const G = { s: { type: "STRING" }, i: { type: "INTEGER" } };
const ESQUEMAS_GEMINI = {
  mc: gObj({ preguntas: gArr(gObj({ enunciado: G.s, opciones: gArr(G.s), correcta: { ...G.i, description: "Índice (0-3) de la opción correcta" } })) }),
  open: gObj({ preguntas: gArr(gObj({
    act: G.s, enunciado: G.s, conceptos: gArr(gObj({ nombre: G.s, raices: gArr(G.s) })), full: G.i, partial: G.i, exp: G.s,
  })) }),
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
  if (!iaDisponible()) fallo(503, "Falta configurar GEMINI_API_KEY en Netlify para usar la IA.");
  const que = tipo === "mc" ? `${n} ${n === 1 ? "pregunta" : "preguntas"} tipo test` : `${n} ${n === 1 ? "pregunta abierta" : "preguntas abiertas"}`;
  const instruccion = [
    `Genera exactamente ${que} sobre el tema «${titulo}»${modulo ? ` del módulo «${modulo}»` : ""}.`,
    lotes > 1 ? `Es el lote ${lote} de ${lotes}: céntrate sobre todo en la parte ${lote} de ${lotes} del material (por orden de aparición), sin salirte del temario.` : "",
    ya.length ? `No repitas ni reformules estas preguntas ya hechas:\n${ya.map((t) => `- ${t}`).join("\n")}` : "",
    indicaciones ? `Indicaciones del profesor: ${indicaciones}` : "",
  ].filter(Boolean).join("\n\n");

  const datos = proveedorIA() === "gemini" ? await pedirGemini(tipo, material, instruccion) : await pedirClaude(tipo, material, instruccion);
  const preguntas = (datos.preguntas || []).map(tipo === "mc" ? normalizarMc : normalizarAbierta).filter(Boolean);
  console.log(JSON.stringify({ evento: "ia-lote", proveedor: proveedorIA(), tipo, pedidas: n, validas: preguntas.length, uso: datos._uso }));
  return preguntas;
}

function leerJSON(texto) {
  try { return JSON.parse(texto); } catch { fallo(502, "La IA ha devuelto una respuesta incompleta. Vuelve a intentarlo."); }
}

async function pedirClaude(tipo, material, instruccion) {
  let r;
  try {
    r = await claude().beta.messages.stream({
      model: MODELO_CLAUDE,
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
  const datos = leerJSON(texto);
  datos._uso = r.usage;
  return datos;
}

/** Gemini (API REST de Google AI Studio) con salida JSON según esquema. */
async function pedirGemini(tipo, material, instruccion) {
  const base = env("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta");
  let res;
  try {
    res = await fetch(`${base}/models/${encodeURIComponent(MODELO_GEMINI())}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env("GEMINI_API_KEY") },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEMA }] },
        contents: [{ role: "user", parts: [{ text: `<material>\n${material}\n</material>` }, { text: instruccion }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: ESQUEMAS_GEMINI[tipo], temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch (e) {
    console.error("[ia gemini]", e);
    fallo(504, e.name === "TimeoutError" ? "La IA ha tardado demasiado. Vuelve a intentarlo." : "No se ha podido conectar con Gemini.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[ia gemini]", res.status, JSON.stringify(data).slice(0, 500));
    const msg = data?.error?.message || "";
    if (res.status === 429) fallo(429, "Se ha alcanzado el límite gratuito de Gemini por minuto o por día. Espera un poco y vuelve a intentarlo.");
    if (res.status === 400 && /api key/i.test(msg)) fallo(502, "La clave GEMINI_API_KEY no es válida.");
    if (res.status === 403) fallo(502, "La clave GEMINI_API_KEY no tiene permiso para usar Gemini.");
    if (res.status === 404) fallo(502, `El modelo «${MODELO_GEMINI()}» no existe o no está disponible. Revisa GEMINI_MODEL.`);
    fallo(502, `Error de Gemini (${res.status}). Vuelve a intentarlo.`);
  }
  if (data.promptFeedback?.blockReason) fallo(422, "Gemini no ha querido generar preguntas con este material.");
  const cand = data.candidates?.[0];
  if (!cand || ["SAFETY", "PROHIBITED_CONTENT", "RECITATION", "BLOCKLIST"].includes(cand.finishReason))
    fallo(422, "Gemini no ha querido generar preguntas con este material.");
  const texto = (cand.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
  const datos = leerJSON(texto);
  datos._uso = data.usageMetadata;
  return datos;
}
