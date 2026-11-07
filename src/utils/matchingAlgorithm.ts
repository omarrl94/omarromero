/**
 * =============================================================================
 * PawsMatch — Algoritmo de compatibilidad Adoptante ↔ Animal
 * =============================================================================
 *
 * Objetivo: estimar (0-100 %) la probabilidad de que una adopción salga bien y
 * NO termine en devolución, comparando el estilo de vida del adoptante con las
 * necesidades del animal.
 *
 * Cómo funciona
 * -------------
 * 1. Se evalúan 5 criterios. Cada uno produce una puntuación parcial entre
 *    0 (incompatible) y 1 (encaje perfecto).
 * 2. Cada criterio tiene un PESO. Los pesos suman 100, así que la nota final es
 *    directamente un porcentaje:  total = Σ (peso_i × puntuación_i).
 * 3. Algunas combinaciones son "dealbreakers" (incompatibilidades graves que
 *    ponen en riesgo a personas o animales). Si aparece alguna, el resultado se
 *    limita a un máximo (DEALBREAKER_CAP) sin importar lo bien que encaje el
 *    resto: un animal que no tolera niños nunca debería salir como "90 %
 *    compatible" con una familia con niños.
 *
 * Pesos (suman 100) y por qué
 * ---------------------------
 *  - 25  Ansiedad ↔ horas fuera de casa. La ansiedad por separación es una de
 *        las causas más citadas de devolución (destrozos, ladridos, quejas de
 *        vecinos). Es el criterio de más peso.
 *  - 20  Energía del animal ↔ actividad del adoptante. Un animal muy enérgico
 *        con un adoptante sedentario acumula frustración y problemas de
 *        conducta; es la segunda causa más habitual.
 *  - 15  Niños en casa ↔ sociabilidad con niños. Afecta a la seguridad; por eso
 *        además es dealbreaker si el animal NO es apto con niños.
 *  - 15  Otros animales ↔ sociabilidad con animales. También dealbreaker si el
 *        animal no tolera a otros animales.
 *  - 10  Experiencia. Animales con miedos o reactividad necesitan a alguien que
 *        sepa manejarlos; un primerizo con un caso difícil es devolución segura.
 *  - 10  Preferencias del test (especie, tamaño, edad y necesidades especiales).
 *        Pesan poco a propósito: lo que la persona "quiere" importa menos que lo
 *        que el animal "necesita", pero una adopción contra los gustos del
 *        adoptante tampoco suele durar.
 *  -  5  Jardín. Importa, pero un adoptante muy activo puede compensarlo con
 *        paseos; por eso pesa menos y admite puntuación parcial.
 *
 * Valores desconocidos (Boolean null = "no evaluado por la protectora") puntúan
 * 0.5: ni premian ni hunden la nota, y se marcan en el desglose como aviso.
 *
 * Los pesos son una primera hipótesis de producto. Al registrar en Match el %
 * calculado y el estado final (ADOPTADO / DEVUELTO), podremos recalibrarlos
 * con datos reales más adelante.
 * =============================================================================
 */

import type { Adopter, Animal, EdadRango, Nivel } from "../generated/prisma/client";

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

/** Solo los campos que el algoritmo necesita (permite testear sin BD). */
export type AdopterProfile = Pick<
  Adopter,
  | "horasFuera"
  | "tieneJardin"
  | "otrosAnimales"
  | "tieneNinos"
  | "nivelActividad"
  | "experiencia"
  | "especiePreferida"
  | "tamanosPreferidos"
  | "edadesPreferidas"
  | "aceptaNecesidadesEspeciales"
>;

export type AnimalProfile = Pick<
  Animal,
  | "requiereJardin"
  | "nivelEnergia"
  | "sociableAnimales"
  | "sociableNinos"
  | "nivelAnsiedad"
  | "horasMaxSolo"
  | "requiereExperiencia"
  | "necesidadesEspeciales"
  | "especie"
  | "tamano"
  | "edadMeses"
>;

export type CriterionKey = "ansiedad" | "energia" | "ninos" | "animales" | "experiencia" | "preferencias" | "jardin";

export interface CriterionResult {
  key: CriterionKey;
  label: string;
  weight: number;
  /** Puntuación parcial 0-1. */
  score: number;
  /** Puntos aportados al total (weight × score). */
  points: number;
  /** Explicación legible para mostrar al adoptante / protectora. */
  reason: string;
}

export interface CompatibilityResult {
  /** Porcentaje final 0-100 (entero). */
  percentage: number;
  breakdown: CriterionResult[];
  /** Incompatibilidades graves detectadas (si hay alguna, percentage ≤ DEALBREAKER_CAP). */
  dealbreakers: string[];
  /** Datos desconocidos que conviene confirmar con la protectora. */
  warnings: string[];
}

// -----------------------------------------------------------------------------
// Configuración
// -----------------------------------------------------------------------------

export const WEIGHTS: Record<CriterionKey, number> = {
  ansiedad: 25,
  energia: 20,
  ninos: 15,
  animales: 15,
  experiencia: 10,
  preferencias: 10,
  jardin: 5,
};

/** Nota máxima posible cuando existe al menos un dealbreaker. */
export const DEALBREAKER_CAP = 25;

/** Puntuación para datos no evaluados (Boolean null). */
const UNKNOWN_SCORE = 0.5;

/**
 * Horas máximas que un animal tolera solo según su ansiedad, cuando la
 * protectora no ha indicado `horasMaxSolo` explícitamente.
 */
const HORAS_TOLERADAS_POR_ANSIEDAD: Record<Nivel, number> = {
  BAJO: 8,
  MEDIO: 6,
  ALTO: 3,
};

/** A partir de la tolerancia, cada hora extra resta 1/4 → con 4 h de exceso, 0. */
const HORAS_EXCESO_HASTA_CERO = 4;

const NIVEL_NUM: Record<Nivel, number> = { BAJO: 1, MEDIO: 2, ALTO: 3 };

// -----------------------------------------------------------------------------
// Criterios individuales (funciones puras, 0-1)
// -----------------------------------------------------------------------------

/** 25 % — ¿Puede el animal quedarse solo las horas que el adoptante está fuera? */
function scoreAnsiedad(ad: AdopterProfile, an: AnimalProfile): [number, string] {
  const tolerancia = an.horasMaxSolo ?? HORAS_TOLERADAS_POR_ANSIEDAD[an.nivelAnsiedad];
  if (ad.horasFuera <= tolerancia) {
    return [1, `Estaría solo ${ad.horasFuera} h y tolera hasta ${tolerancia} h.`];
  }
  const exceso = ad.horasFuera - tolerancia;
  // Caída lineal: 1 h de exceso → 0.75, 2 h → 0.5, ... 4 h o más → 0.
  const score = Math.max(0, 1 - exceso / HORAS_EXCESO_HASTA_CERO);
  return [score, `Estaría solo ${ad.horasFuera} h, ${exceso} h más de las ${tolerancia} h que tolera.`];
}

/**
 * 20 % — Energía del animal vs. actividad del adoptante.
 * Es ASIMÉTRICO: que el animal tenga MÁS energía que el adoptante es peor que
 * lo contrario (un perro tranquilo con un dueño deportista se adapta; un perro
 * hiperactivo con un dueño sedentario, no).
 */
function scoreEnergia(ad: AdopterProfile, an: AnimalProfile): [number, string] {
  const diff = NIVEL_NUM[an.nivelEnergia] - NIVEL_NUM[ad.nivelActividad];
  const nivelTxt = `energía ${an.nivelEnergia.toLowerCase()} vs. actividad ${ad.nivelActividad.toLowerCase()}`;
  if (diff === 0) return [1, `Ritmos iguales (${nivelTxt}).`];
  if (diff > 0) {
    // El animal necesita más de lo que el adoptante ofrece.
    return diff === 1
      ? [0.4, `El animal necesita algo más de actividad (${nivelTxt}).`]
      : [0, `El animal necesita mucha más actividad (${nivelTxt}).`];
  }
  // El adoptante es más activo que el animal: menos grave.
  return diff === -1
    ? [0.7, `El adoptante es algo más activo que el animal (${nivelTxt}).`]
    : [0.3, `El animal es mucho más tranquilo que el ritmo del adoptante (${nivelTxt}).`];
}

/** 15 % — Niños. Dealbreaker si hay niños y el animal NO es apto. */
function scoreNinos(ad: AdopterProfile, an: AnimalProfile): [number, string, "dealbreaker" | "unknown" | null] {
  if (!ad.tieneNinos) return [1, "No hay niños en casa.", null];
  if (an.sociableNinos === true) return [1, "Hay niños y el animal es sociable con ellos.", null];
  if (an.sociableNinos === null) return [UNKNOWN_SCORE, "Hay niños y no se ha evaluado al animal con niños.", "unknown"];
  return [0, "Hay niños y el animal NO es apto para convivir con niños.", "dealbreaker"];
}

/** 15 % — Otros animales. Dealbreaker si hay otros animales y NO los tolera. */
function scoreAnimales(ad: AdopterProfile, an: AnimalProfile): [number, string, "dealbreaker" | "unknown" | null] {
  if (!ad.otrosAnimales) return [1, "No hay otros animales en casa.", null];
  if (an.sociableAnimales === true) return [1, "Hay otros animales y es sociable con ellos.", null];
  if (an.sociableAnimales === null)
    return [UNKNOWN_SCORE, "Hay otros animales y no se ha evaluado su sociabilidad.", "unknown"];
  return [0, "Hay otros animales y NO los tolera.", "dealbreaker"];
}

/**
 * 10 % — Experiencia. Solo cuenta si la protectora marca que el animal la
 * requiere: un primerizo puntúa 0, "alguna" experiencia 0.6, "mucha" 1.
 */
function scoreExperiencia(ad: AdopterProfile, an: AnimalProfile): [number, string] {
  if (!an.requiereExperiencia) return [1, "No requiere experiencia previa."];
  if (ad.experiencia === "MUCHA") return [1, "Requiere experiencia y tienes mucha."];
  if (ad.experiencia === "ALGUNA") return [0.6, "Requiere experiencia; tienes algo, la protectora te orientará."];
  return [0, "Requiere un adoptante con experiencia y sería tu primera vez."];
}

/** Rango de edad a partir de los meses (mismos cortes que el enum EdadRango). */
export function edadRango(edadMeses: number): EdadRango {
  if (edadMeses < 12) return "CACHORRO";
  if (edadMeses < 36) return "JOVEN";
  if (edadMeses < 96) return "ADULTO";
  return "SENIOR";
}

/**
 * 10 % — Preferencias del test. Media de 4 comprobaciones de sí/no:
 * especie, tamaño, edad y necesidades especiales. Una lista vacía de
 * preferencias significa "me da igual" y cuenta como acierto.
 */
function scorePreferencias(ad: AdopterProfile, an: AnimalProfile): [number, string] {
  const fallos: string[] = [];
  if (ad.especiePreferida !== "INDIFERENTE" && ad.especiePreferida !== an.especie) fallos.push("especie");
  if (ad.tamanosPreferidos.length && !ad.tamanosPreferidos.includes(an.tamano)) fallos.push("tamaño");
  if (ad.edadesPreferidas.length && !ad.edadesPreferidas.includes(edadRango(an.edadMeses))) fallos.push("edad");
  if (an.necesidadesEspeciales && !ad.aceptaNecesidadesEspeciales) fallos.push("necesidades especiales");
  const score = (4 - fallos.length) / 4;
  return [score, fallos.length ? `No encaja con lo que buscas en: ${fallos.join(", ")}.` : "Encaja con lo que buscas."];
}

/**
 * 5 % — Jardín. Si el animal lo requiere y no hay jardín, un adoptante con
 * actividad ALTA puede compensarlo parcialmente con paseos largos (0.3).
 */
function scoreJardin(ad: AdopterProfile, an: AnimalProfile): [number, string] {
  if (!an.requiereJardin) return [1, "No necesita jardín."];
  if (ad.tieneJardin) return [1, "Necesita jardín y lo hay."];
  if (ad.nivelActividad === "ALTO") return [0.3, "Necesita jardín; no hay, pero mucha actividad lo compensa en parte."];
  return [0, "Necesita jardín y no lo hay."];
}

// -----------------------------------------------------------------------------
// API pública
// -----------------------------------------------------------------------------

/**
 * Cálculo puro (sin base de datos). Útil para tests, para la UI y para
 * puntuar muchos animales en memoria.
 */
export function computeCompatibility(adopter: AdopterProfile, animal: AnimalProfile): CompatibilityResult {
  const dealbreakers: string[] = [];
  const warnings: string[] = [];

  const [ansS, ansR] = scoreAnsiedad(adopter, animal);
  const [eneS, eneR] = scoreEnergia(adopter, animal);
  const [ninS, ninR, ninFlag] = scoreNinos(adopter, animal);
  const [aniS, aniR, aniFlag] = scoreAnimales(adopter, animal);
  const [expS, expR] = scoreExperiencia(adopter, animal);
  const [prefS, prefR] = scorePreferencias(adopter, animal);
  const [jarS, jarR] = scoreJardin(adopter, animal);

  for (const [flag, reason] of [
    [ninFlag, ninR],
    [aniFlag, aniR],
  ] as const) {
    if (flag === "dealbreaker") dealbreakers.push(reason);
    if (flag === "unknown") warnings.push(reason);
  }

  const raw: Array<[CriterionKey, string, number, string]> = [
    ["ansiedad", "Ansiedad vs. horas solo", ansS, ansR],
    ["energia", "Energía vs. actividad", eneS, eneR],
    ["ninos", "Convivencia con niños", ninS, ninR],
    ["animales", "Convivencia con animales", aniS, aniR],
    ["experiencia", "Experiencia", expS, expR],
    ["preferencias", "Lo que buscas", prefS, prefR],
    ["jardin", "Jardín", jarS, jarR],
  ];

  const breakdown: CriterionResult[] = raw.map(([key, label, score, reason]) => ({
    key,
    label,
    weight: WEIGHTS[key],
    score,
    points: Math.round(WEIGHTS[key] * score * 10) / 10,
    reason,
  }));

  // Suma ponderada: como los pesos suman 100, el resultado ya es un porcentaje.
  let percentage = Math.round(breakdown.reduce((acc, c) => acc + c.weight * c.score, 0));

  // Un dealbreaker limita la nota, por bien que encaje todo lo demás.
  if (dealbreakers.length > 0) percentage = Math.min(percentage, DEALBREAKER_CAP);

  return { percentage, breakdown, dealbreakers, warnings };
}

/** Cliente mínimo que necesitamos (facilita inyectar un mock en tests). */
interface PrismaLike {
  adopter: { findUnique(args: { where: { id: string } }): Promise<AdopterProfile | null> };
  animal: { findUnique(args: { where: { id: string } }): Promise<AnimalProfile | null> };
}

/**
 * Recibe el ID de un Adopter y el ID de un Animal, los carga de la base de
 * datos y devuelve el resultado completo (porcentaje + desglose).
 */
export async function getCompatibility(
  adopterId: string,
  animalId: string,
  db?: PrismaLike,
): Promise<CompatibilityResult> {
  const client: PrismaLike = db ?? (await import("../lib/prisma")).prisma;
  const [adopter, animal] = await Promise.all([
    client.adopter.findUnique({ where: { id: adopterId } }),
    client.animal.findUnique({ where: { id: animalId } }),
  ]);
  if (!adopter) throw new Error(`Adopter no encontrado: ${adopterId}`);
  if (!animal) throw new Error(`Animal no encontrado: ${animalId}`);
  return computeCompatibility(adopter, animal);
}

/** Atajo: solo el porcentaje 0-100. */
export async function calculateCompatibility(adopterId: string, animalId: string, db?: PrismaLike): Promise<number> {
  return (await getCompatibility(adopterId, animalId, db)).percentage;
}
