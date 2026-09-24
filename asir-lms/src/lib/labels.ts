import type { Level, Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador/a",
  PROF_MEDIO: "Profesor/a · Grado Medio",
  PROF_SUPERIOR: "Profesor/a · Grado Superior",
  STUDENT_MEDIO: "Grado Medio",
  STUDENT_SUPERIOR: "Grado Superior",
};

/** Roles con acceso al panel de gestión (profesorado y administración). */
export const STAFF_ROLES: Role[] = ["ADMIN", "PROF_MEDIO", "PROF_SUPERIOR"];

/** Roles de alumnado. */
export const STUDENT_ROLES: Role[] = ["STUDENT_MEDIO", "STUDENT_SUPERIOR"];

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

/** Nivel que gestiona/estudia cada rol; el administrador no está limitado (null). */
export function levelOf(role: Role): "MEDIO" | "SUPERIOR" | null {
  if (role === "PROF_MEDIO" || role === "STUDENT_MEDIO") return "MEDIO";
  if (role === "PROF_SUPERIOR" || role === "STUDENT_SUPERIOR") return "SUPERIOR";
  return null; // ADMIN
}

/** Niveles de temario visibles para un rol. */
export function levelsForRole(role: Role): Level[] {
  const lvl = levelOf(role);
  if (lvl === "MEDIO") return ["MEDIO", "BOTH"];
  if (lvl === "SUPERIOR") return ["SUPERIOR", "BOTH"];
  return ["MEDIO", "SUPERIOR", "BOTH"];
}

/** Qué roles de alumnado puede gestionar cada miembro del personal. */
export function managedStudentRoles(role: Role): Role[] {
  if (role === "PROF_MEDIO") return ["STUDENT_MEDIO"];
  if (role === "PROF_SUPERIOR") return ["STUDENT_SUPERIOR"];
  return ["STUDENT_MEDIO", "STUDENT_SUPERIOR"]; // ADMIN
}
