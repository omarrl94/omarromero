"use server";

import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";

import { ensureDb } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";

export type RegisterState = { ok: boolean; message: string } | null;

export async function registerStudent(_: RegisterState, form: FormData): Promise<RegisterState> {
  await ensureDb();

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const level = String(form.get("level") ?? "");

  if (!name || !email) return { ok: false, message: "Indica tu nombre y tu email." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "El email no es válido." };
  if (password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
  const role = level === "SUPERIOR" ? Role.STUDENT_SUPERIOR : level === "MEDIO" ? Role.STUDENT_MEDIO : null;
  if (!role) return { ok: false, message: "Elige tu grado (Medio o Superior)." };

  try {
    await prisma.user.create({
      data: { name, email, role, approved: false, password: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe una cuenta con ese email." };
    }
    throw e;
  }

  return {
    ok: true,
    message: "¡Registro recibido! Un profesor de tu grado revisará tu solicitud. Podrás entrar cuando la apruebe.",
  };
}
