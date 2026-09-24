import { NextResponse } from "next/server";

import { ensureDb } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Diagnóstico: crea la BD si hace falta e informa del estado. No expone secretos.
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
    const emails = (await prisma.user.findMany({ select: { email: true, role: true } })).map(
      (u) => `${u.email} (${u.role})`
    );
    return NextResponse.json({ ok: true, ...info, users, topics, emails });
  } catch (e) {
    return NextResponse.json(
      { ok: false, ...info, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
