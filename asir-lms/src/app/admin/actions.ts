"use server";

import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { managedStudentRoles } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export type FormState = { ok: boolean; message: string } | null;

const STAFF: Role[] = ["ADMIN", "PROF_MEDIO", "PROF_SUPERIOR"];
const ROLES = Object.values(Role);

function readRole(value: FormDataEntryValue | null): Role | null {
  return ROLES.includes(value as Role) ? (value as Role) : null;
}

/** Comprueba que el usuario actual (personal) puede gestionar al usuario objetivo. */
async function loadManageable(actorRole: Role, targetId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { error: "Usuario no encontrado." as const };
  if (actorRole !== "ADMIN" && !managedStudentRoles(actorRole).includes(target.role)) {
    return { error: "No puedes gestionar a este usuario." as const };
  }
  return { target };
}

/** ADMIN: da de alta cualquier cuenta (alumnado o profesorado). */
export async function createUser(_: FormState, form: FormData): Promise<FormState> {
  await requireSession(["ADMIN"]);

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const role = readRole(form.get("role"));

  if (!name || !email || !role) return { ok: false, message: "Rellena nombre, email y rol." };
  if (password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };

  try {
    await prisma.user.create({
      data: { name, email, role, approved: true, password: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe un usuario con ese email." };
    }
    throw e;
  }

  revalidatePath("/admin");
  return { ok: true, message: `Cuenta de ${name} creada.` };
}

/** ADMIN: edita nombre, rol y (opcionalmente) contraseña de cualquier usuario. */
export async function updateUser(_: FormState, form: FormData): Promise<FormState> {
  const session = await requireSession(["ADMIN"]);

  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role = readRole(form.get("role"));

  if (!id || !name || !role) return { ok: false, message: "Datos incompletos." };
  if (password && password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
  if (id === session.user.id && role !== "ADMIN") {
    return { ok: false, message: "No puedes quitarte a ti mismo el rol de administrador." };
  }

  await prisma.user.update({
    where: { id },
    data: { name, role, ...(password ? { password: await bcrypt.hash(password, 10) } : {}) },
  });

  revalidatePath("/admin");
  return { ok: true, message: "Usuario actualizado." };
}

/** ADMIN: elimina una cuenta. */
export async function deleteUser(id: string): Promise<FormState> {
  const session = await requireSession(["ADMIN"]);
  if (id === session.user.id) return { ok: false, message: "No puedes eliminar tu propia cuenta." };

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true, message: "Usuario eliminado." };
}

/** Personal: da de alta directamente a un alumno de su nivel (queda aprobado). */
export async function createStudent(_: FormState, form: FormData): Promise<FormState> {
  const session = await requireSession(STAFF);

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const level = String(form.get("level") ?? "");
  const role = level === "SUPERIOR" ? Role.STUDENT_SUPERIOR : level === "MEDIO" ? Role.STUDENT_MEDIO : null;

  if (!name || !email || !role) return { ok: false, message: "Rellena nombre, email y grado." };
  if (password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
  if (!managedStudentRoles(session.user.role).includes(role)) {
    return { ok: false, message: "No puedes dar de alta alumnos de ese grado." };
  }

  try {
    await prisma.user.create({
      data: { name, email, role, approved: true, password: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe una cuenta con ese email." };
    }
    throw e;
  }

  revalidatePath("/admin");
  return { ok: true, message: `Alumno/a ${name} dado/a de alta.` };
}

/** Personal: aprueba a un alumno pendiente de su nivel (admin: cualquiera). */
export async function approveUser(id: string): Promise<FormState> {
  const session = await requireSession(STAFF);
  const { target, error } = await loadManageable(session.user.role, id);
  if (error) return { ok: false, message: error };

  await prisma.user.update({ where: { id: target!.id }, data: { approved: true } });
  revalidatePath("/admin");
  return { ok: true, message: `${target!.name} aprobado/a.` };
}

/** Personal: rechaza (elimina) una solicitud pendiente de su nivel. */
export async function rejectUser(id: string): Promise<FormState> {
  const session = await requireSession(STAFF);
  const { target, error } = await loadManageable(session.user.role, id);
  if (error) return { ok: false, message: error };
  if (target!.approved) return { ok: false, message: "Esa cuenta ya está aprobada; usa Eliminar." };

  await prisma.user.delete({ where: { id: target!.id } });
  revalidatePath("/admin");
  return { ok: true, message: "Solicitud rechazada." };
}

/** Personal: restablece la contraseña de un alumno de su nivel (admin: cualquiera). */
export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const session = await requireSession(STAFF);
  const id = String(form.get("id") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };

  const { target, error } = await loadManageable(session.user.role, id);
  if (error) return { ok: false, message: error };

  await prisma.user.update({ where: { id: target!.id }, data: { password: await bcrypt.hash(password, 10) } });
  revalidatePath("/admin");
  return { ok: true, message: `Contraseña de ${target!.name} restablecida.` };
}
