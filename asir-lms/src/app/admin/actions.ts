"use server";

import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type FormState = { ok: boolean; message: string } | null;

const ROLES = Object.values(Role);

function readRole(value: FormDataEntryValue | null): Role | null {
  return ROLES.includes(value as Role) ? (value as Role) : null;
}

export async function createUser(_: FormState, form: FormData): Promise<FormState> {
  await requireSession(["ADMIN"]);

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const role = readRole(form.get("role"));

  if (!name || !email || !role) return { ok: false, message: "Rellena nombre, email y nivel." };
  if (password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };

  try {
    await prisma.user.create({
      data: { name, email, role, password: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe un usuario con ese email." };
    }
    throw e;
  }

  revalidatePath("/admin");
  return { ok: true, message: `Alumno ${name} dado de alta.` };
}

export async function updateUser(_: FormState, form: FormData): Promise<FormState> {
  const session = await requireSession(["ADMIN"]);

  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role = readRole(form.get("role"));

  if (!id || !name || !role) return { ok: false, message: "Datos incompletos." };
  if (password && password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
  if (id === session.user.id && role !== "ADMIN") {
    return { ok: false, message: "No puedes quitarte a ti mismo el rol de profesor." };
  }

  await prisma.user.update({
    where: { id },
    data: { name, role, ...(password ? { password: await bcrypt.hash(password, 10) } : {}) },
  });

  revalidatePath("/admin");
  return { ok: true, message: "Usuario actualizado." };
}

export async function deleteUser(id: string): Promise<FormState> {
  const session = await requireSession(["ADMIN"]);
  if (id === session.user.id) return { ok: false, message: "No puedes eliminar tu propia cuenta." };

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true, message: "Usuario eliminado." };
}
