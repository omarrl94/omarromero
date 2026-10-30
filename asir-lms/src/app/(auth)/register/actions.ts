"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { Role } from "@/lib/roles";

import { verificarTokenCampus } from "@/lib/campus";
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

  // Entrada desde el Campus Virtual: si el enlace firmado es bueno y es de este correo, la cuenta
  // queda aprobada sin esperar al profesor (el acceso ya lo concedió el campus).
  const tokenCampus = form.get("campus");
  const campus = tokenCampus ? verificarTokenCampus(String(tokenCampus)) : null;
  if (tokenCampus && !campus) return { ok: false, message: "El enlace del Campus Virtual no es válido o ha caducado. Vuelve a entrar desde el campus." };
  if (campus && campus.e !== email) return { ok: false, message: `El enlace del Campus Virtual es para ${campus.e}.` };

  if (campus) {
    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      if (!existente.approved) await prisma.user.update({ where: { email }, data: { approved: true } });
      return { ok: true, message: "Ya tenías cuenta: el Campus Virtual la ha activado. Entra con tu contraseña de siempre." };
    }
  }

  try {
    await prisma.user.create({
      data: { name, email, role, approved: !!campus, password: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe una cuenta con ese email." };
    }
    throw e;
  }

  if (campus) return { ok: true, message: "¡Cuenta creada y activada! Tu acceso viene del Campus Virtual: ya puedes iniciar sesión." };

  return {
    ok: true,
    message: "¡Registro recibido! Un profesor de tu grado revisará tu solicitud. Podrás entrar cuando la apruebe.",
  };
}
