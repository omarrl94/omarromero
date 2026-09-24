import type { Role } from "@/lib/roles";

import { levelOf } from "@/lib/labels";
import { bloque1 } from "./bloque1";
import { bloque2 } from "./bloque2";
import { bloque3 } from "./bloque3";
import { bloque4 } from "./bloque4";
import { bloque5 } from "./bloque5";
import { bloque6 } from "./bloque6";
import type { Audience, TopicContent } from "./types";

// Contenido didáctico por número de tema. Solo debe importarse desde el servidor:
// incluye las soluciones del test.
const CONTENT: Record<number, TopicContent> = { ...bloque1, ...bloque2, ...bloque3, ...bloque4, ...bloque5, ...bloque6 };

export function audienceForRole(role: Role): Audience {
  return levelOf(role) === "MEDIO" ? "MEDIO" : "SUPERIOR";
}

const visible = (audience: Audience) => (item: { only?: Audience }) => !item.only || item.only === audience;

/** Contenido de un tema filtrado para un grado. Las preguntas conservan su índice original como id. */
export function contentFor(number: number, audience: Audience) {
  const c = CONTENT[number] ?? { theory: [], labs: [], activities: [], projects: [], quiz: [] };
  const show = visible(audience);
  return {
    theory: c.theory.filter(show),
    labs: c.labs.filter(show),
    activities: c.activities.filter(show),
    projects: c.projects.filter(show),
    quiz: c.quiz.map((q, id) => ({ ...q, id })).filter(show),
  };
}

export type FilteredContent = ReturnType<typeof contentFor>;

/** Indica si el tema ya tiene material didáctico redactado. */
export function hasContent(number: number) {
  return number in CONTENT;
}
export type { Audience } from "./types";
