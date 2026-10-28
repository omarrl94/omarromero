/* Contenido del curso: 12 sesiones (una por fichero en contenido/) con sus cinco pestañas y su test. */
import s01 from "./contenido/s01.js";
import s02 from "./contenido/s02.js";
import s03 from "./contenido/s03.js";
import s04 from "./contenido/s04.js";
import s05 from "./contenido/s05.js";
import s06 from "./contenido/s06.js";
import s07 from "./contenido/s07.js";
import s08 from "./contenido/s08.js";
import s09 from "./contenido/s09.js";
import s10 from "./contenido/s10.js";
import s11 from "./contenido/s11.js";
import s12 from "./contenido/s12.js";

export const TABS = [
  { id: "teoria", label: "Teoría" },
  { id: "taller", label: "Taller paso a paso" },
  { id: "prompts", label: "Biblioteca de Prompts" },
  { id: "actividad", label: "Actividad práctica" },
  { id: "faq", label: "Preguntas frecuentes" }
];

export const BLOQUES = {
  1: "Fundamentos, Context Engineering y Pensamiento Extendido",
  2: "Claude Code (CLI), Skills y Automatización",
  3: "Conexiones en tiempo real con MCP",
  4: "API en producción, Tool Use, Computer Use, Ciberseguridad y Título"
};

export const SESIONES = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12];
