/**
 * Test de estilo de vida que hace el adoptante justo después de registrarse.
 * Cada pregunta alimenta una variable de Adopter que usa matchingAlgorithm.ts.
 *
 * Este archivo lo importan tanto el formulario (cliente) como la server action,
 * así que no debe importar nada de servidor.
 */
import { z } from "zod";

export type Option = { value: string; label: string; hint?: string; icon: string };

export type Question =
  | { id: keyof TestAnswers; kind: "single"; title: string; subtitle?: string; options: Option[] }
  | { id: keyof TestAnswers; kind: "multi"; title: string; subtitle?: string; options: Option[] }
  | { id: keyof TestAnswers; kind: "hours"; title: string; subtitle?: string };

export const QUESTIONS: Question[] = [
  {
    id: "especiePreferida",
    kind: "single",
    title: "¿A quién buscas?",
    options: [
      { value: "PERRO", label: "Un perro", icon: "🐶" },
      { value: "GATO", label: "Un gato", icon: "🐱" },
      { value: "INDIFERENTE", label: "Me da igual", hint: "Que me enamore", icon: "💞" },
    ],
  },
  {
    id: "tipoVivienda",
    kind: "single",
    title: "¿Dónde vives?",
    options: [
      { value: "PISO", label: "Piso", icon: "🏢" },
      { value: "CASA", label: "Casa", icon: "🏡" },
    ],
  },
  {
    id: "tieneJardin",
    kind: "single",
    title: "¿Tienes jardín o patio?",
    options: [
      { value: "true", label: "Sí", icon: "🌳" },
      { value: "false", label: "No", icon: "🚪" },
    ],
  },
  {
    id: "horasFuera",
    kind: "hours",
    title: "¿Cuántas horas al día se quedaría solo en casa?",
    subtitle: "Piensa en un día normal de trabajo. Sé sincero: es lo que más devoluciones evita.",
  },
  {
    id: "nivelActividad",
    kind: "single",
    title: "¿Cómo es tu ritmo de vida?",
    options: [
      { value: "BAJO", label: "Tranquilo", hint: "Sofá, series y paseos cortos", icon: "🛋️" },
      { value: "MEDIO", label: "Activo", hint: "Paseos largos a diario", icon: "🚶" },
      { value: "ALTO", label: "Muy activo", hint: "Deporte, monte, correr", icon: "🏃" },
    ],
  },
  {
    id: "tieneNinos",
    kind: "single",
    title: "¿Hay niños en casa?",
    subtitle: "Cuenta también a los que vienen a menudo (sobrinos, nietos…).",
    options: [
      { value: "true", label: "Sí", icon: "🧒" },
      { value: "false", label: "No", icon: "🙅" },
    ],
  },
  {
    id: "otrosAnimales",
    kind: "single",
    title: "¿Convives con otros animales?",
    options: [
      { value: "true", label: "Sí", icon: "🐾" },
      { value: "false", label: "No", icon: "✨" },
    ],
  },
  {
    id: "experiencia",
    kind: "single",
    title: "¿Qué experiencia tienes con animales?",
    options: [
      { value: "NINGUNA", label: "Sería mi primera vez", icon: "🌱" },
      { value: "ALGUNA", label: "He tenido alguno", icon: "👍" },
      { value: "MUCHA", label: "Mucha", hint: "He educado o acogido animales", icon: "🏅" },
    ],
  },
  {
    id: "tamanosPreferidos",
    kind: "multi",
    title: "¿Qué tamaño encaja en tu casa?",
    subtitle: "Puedes elegir varios. Si no marcas ninguno, te enseñamos todos.",
    options: [
      { value: "PEQUENO", label: "Pequeño", hint: "Menos de 10 kg", icon: "🐁" },
      { value: "MEDIANO", label: "Mediano", hint: "10-25 kg", icon: "🐕" },
      { value: "GRANDE", label: "Grande", hint: "Más de 25 kg", icon: "🐻" },
    ],
  },
  {
    id: "edadesPreferidas",
    kind: "multi",
    title: "¿Qué edad te gustaría?",
    subtitle: "Los adultos y seniors son los que más tardan en encontrar casa.",
    options: [
      { value: "CACHORRO", label: "Cachorro", hint: "Menos de 1 año", icon: "🍼" },
      { value: "JOVEN", label: "Joven", hint: "1-3 años", icon: "⚡" },
      { value: "ADULTO", label: "Adulto", hint: "3-8 años", icon: "😌" },
      { value: "SENIOR", label: "Senior", hint: "Más de 8 años", icon: "👴" },
    ],
  },
  {
    id: "aceptaNecesidadesEspeciales",
    kind: "single",
    title: "¿Te abrirías a un animal con necesidades especiales?",
    subtitle: "Tratamientos, una patita menos, ceguera… Suelen ser los más agradecidos.",
    options: [
      { value: "true", label: "Sí, cuéntame", icon: "💪" },
      { value: "false", label: "Prefiero que no", icon: "🙏" },
    ],
  },
];

const bool = z.enum(["true", "false"]).transform((v) => v === "true");

/** Validación de las respuestas (llegan como strings desde el formulario). */
export const testSchema = z.object({
  especiePreferida: z.enum(["PERRO", "GATO", "INDIFERENTE"]),
  tipoVivienda: z.enum(["PISO", "CASA"]),
  tieneJardin: bool,
  horasFuera: z.coerce.number().int().min(0).max(24),
  nivelActividad: z.enum(["BAJO", "MEDIO", "ALTO"]),
  tieneNinos: bool,
  otrosAnimales: bool,
  experiencia: z.enum(["NINGUNA", "ALGUNA", "MUCHA"]),
  tamanosPreferidos: z.array(z.enum(["PEQUENO", "MEDIANO", "GRANDE"])).default([]),
  edadesPreferidas: z.array(z.enum(["CACHORRO", "JOVEN", "ADULTO", "SENIOR"])).default([]),
  aceptaNecesidadesEspeciales: bool,
});

export type TestAnswers = z.input<typeof testSchema>;
export type TestResult = z.output<typeof testSchema>;

export const registerSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre."),
  email: z.string().trim().toLowerCase().email("Ese email no parece válido."),
  ciudad: z.string().trim().min(2, "¿En qué ciudad vives?"),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ese email no parece válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});
