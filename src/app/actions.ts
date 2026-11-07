"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { endSession, requireUser, startSession } from "@/lib/session";
import { loginSchema, registerSchema, testSchema } from "@/lib/lifestyleTest";

export type FormState = { error?: string; fields?: Record<string, string> } | undefined;

const firstError = (issues: { message: string }[]) => issues[0]?.message ?? "Revisa los datos.";

/** Registro: crea la cuenta, abre sesión y manda al test de estilo de vida. */
export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = registerSchema.safeParse(raw);
  const fields = { nombre: raw.nombre ?? "", email: raw.email ?? "", ciudad: raw.ciudad ?? "" };
  if (!parsed.success) return { error: firstError(parsed.error.issues), fields };

  const { nombre, email, ciudad, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Ya hay una cuenta con ese email. Inicia sesión.", fields };
  }
  const user = await prisma.user.create({
    data: { nombre, email, ciudad, passwordHash: await hashPassword(password) },
  });
  await startSession(user.id);
  redirect("/test");
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = loginSchema.safeParse(raw);
  const fields = { email: raw.email ?? "" };
  if (!parsed.success) return { error: firstError(parsed.error.issues), fields };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { adopter: true } });
  // Mismo mensaje para email inexistente y contraseña errónea: no revelamos qué cuentas existen.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Email o contraseña incorrectos.", fields };
  }
  await startSession(user.id);
  redirect(user.adopter ? "/descubrir" : "/test");
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

/**
 * Guarda el test: crea (o actualiza, si lo repite) el perfil Adopter enlazado
 * a la cuenta. Las respuestas llegan como JSON en el campo "answers".
 */
export async function saveTestAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  let json: unknown;
  try {
    json = JSON.parse(String(form.get("answers") ?? "{}"));
  } catch {
    return { error: "No hemos podido leer tus respuestas. Inténtalo de nuevo." };
  }
  const parsed = testSchema.safeParse(json);
  if (!parsed.success) return { error: "Falta alguna respuesta. Revisa el test." };

  const data = { ...parsed.data, nombre: user.nombre, email: user.email, ciudad: user.ciudad ?? "" };
  await prisma.adopter.upsert({
    where: { userId: user.id },
    create: { ...data, userId: user.id },
    update: data,
  });
  redirect("/descubrir");
}
