// Roles como texto (evita los problemas de migrar un enum de Postgres en Supabase).
// Se comporta como un enum: `Role.ADMIN` (valor) y `Role` (tipo).
export const Role = {
  ADMIN: "ADMIN",
  PROF_MEDIO: "PROF_MEDIO",
  PROF_SUPERIOR: "PROF_SUPERIOR",
  STUDENT_MEDIO: "STUDENT_MEDIO",
  STUDENT_SUPERIOR: "STUDENT_SUPERIOR",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ALL_ROLES: Role[] = Object.values(Role);
