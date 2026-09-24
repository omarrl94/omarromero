import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
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

    // Diagnóstico detallado de authorize (paso a paso).
    const dbg: Record<string, unknown> = {};
    try {
      const email = "admin.ia@jrotero.es";
      const u = await prisma.user.findUnique({ where: { email } });
      dbg.manualFound = Boolean(u);
      dbg.manualCompare = u ? await bcrypt.compare("admin123", u.password) : null;
      const provider = authOptions.providers[0] as unknown as {
        id?: string;
        authorize?: (c: Record<string, string>, r: unknown) => Promise<{ email: string } | null>;
      };
      dbg.providerId = provider?.id ?? null;
      dbg.hasAuthorize = typeof provider?.authorize;
      if (typeof provider?.authorize === "function") {
        const res = await provider.authorize({ email, password: "admin123" }, {});
        dbg.authorize = res ? `OK (${res.email})` : "NULL";
      }
    } catch (e) {
      dbg.error = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      ok: true,
      ...info,
      nextauthUrlResolved: process.env.NEXTAUTH_URL ?? null,
      users,
      topics,
      passwordChecks,
      authorizeDebug: dbg,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, ...info, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
