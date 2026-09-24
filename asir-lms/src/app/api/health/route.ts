import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { ensureDb } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Cuentas y sus contraseñas previstas. Si la contraseña guardada no coincide,
// se restablece a este valor (auto-reparación del login para el demo).
const KNOWN: [string, string][] = [
  ["admin.ia@jrotero.es", "admin123"],
  ["omar.romero@jrotero.es", "omrolo.94"],
  ["unai.elorrieta@jrotero.es", "alumno123"],
];

export async function GET() {
  const info: Record<string, unknown> = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    hasNextauthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    nextauthUrl: process.env.NEXTAUTH_URL ?? null,
  };
  try {
    await ensureDb();
    const [users, topics] = await Promise.all([prisma.user.count(), prisma.topic.count()]);

    // Verifica y repara las contraseñas de las cuentas conocidas.
    const passwordChecks: Record<string, string> = {};
    for (const [email, pw] of KNOWN) {
      const u = await prisma.user.findUnique({ where: { email } });
      if (!u) {
        passwordChecks[email] = "NO EXISTE";
        continue;
      }
      const ok = await bcrypt.compare(pw, u.password);
      if (ok) {
        passwordChecks[email] = "OK";
      } else {
        await prisma.user.update({ where: { email }, data: { password: await bcrypt.hash(pw, 10) } });
        passwordChecks[email] = "REPARADA";
      }
    }

    return NextResponse.json({ ok: true, ...info, users, topics, passwordChecks });
  } catch (e) {
    return NextResponse.json(
      { ok: false, ...info, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
