import type { Level, Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Profesor/a",
  STUDENT_MEDIO: "Grado Medio",
  STUDENT_SUPERIOR: "Grado Superior",
};

/** Niveles de temario visibles para cada rol de alumno. */
export function levelsForRole(role: Role): Level[] {
  if (role === "STUDENT_MEDIO") return ["MEDIO", "BOTH"];
  if (role === "STUDENT_SUPERIOR") return ["SUPERIOR", "BOTH"];
  return ["MEDIO", "SUPERIOR", "BOTH"];
}
