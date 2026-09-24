"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PwState = { ok: boolean; message: string } | null;

/** Cualquier usuario cambia su propia contraseña. */
export async function changeOwnPassword(_: PwState, form: FormData): Promise<PwState> {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, message: "Sesión no válida." };

  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const repeat = String(form.get("repeat") ?? "");

  if (next.length < 6) return { ok: false, message: "La nueva contraseña debe tener al menos 6 caracteres." };
  if (next !== repeat) return { ok: false, message: "La nueva contraseña y su repetición no coinciden." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, message: "Usuario no encontrado." };
  if (!(await bcrypt.compare(current, user.password))) {
    return { ok: false, message: "La contraseña actual no es correcta." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(next, 10) } });
  return { ok: true, message: "Contraseña actualizada correctamente." };
}
