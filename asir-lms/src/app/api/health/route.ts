import { NextResponse } from "next/server";

import { ensureDb } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";
import { ALL_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

// Marcador de versión: cámbialo en cada despliegue para confirmar que Netlify
// sirve el build nuevo.
const VERSION = "roles-text-2026-09-25-a";

export async function GET() {
  try {
    await ensureDb();

    // Fuerza los roles de profesor (y confirma que la BD acepta texto en `role`).
    const fixes: Record<string, string> = {};
    const set = async (email: string, role: string) => {
      try {
        await prisma.user.update({ where: { email }, data: { role, approved: true } });
        fixes[email] = `OK -> ${role}`;
      } catch (e) {
        fixes[email] = "ERROR: " + (e instanceof Error ? e.message : String(e));
      }
    };
    await set("omar.romero@jrotero.es", "PROF_SUPERIOR");
    await set("unai.elorrieta@jrotero.es", "PROF_MEDIO");

    const users = await prisma.user.findMany({ select: { email: true, role: true, approved: true } });

    return NextResponse.json({
      ok: true,
      version: VERSION,
      roleOptions: ALL_ROLES,
      fixes,
      users,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
