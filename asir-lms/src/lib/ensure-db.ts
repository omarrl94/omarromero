import { PrismaClient } from "@prisma/client";

import { normalizeRegion } from "@/lib/db-url";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

// DDL idempotente equivalente al esquema Prisma. Crea las tablas si faltan y
// migra la base de datos existente (nuevos roles y columna `approved`).
const DDL = [
  `DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN','PROF_MEDIO','PROF_SUPERIOR','STUDENT_MEDIO','STUDENT_SUPERIOR'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PROF_MEDIO';`,
  `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PROF_SUPERIOR';`,
  `DO $$ BEGIN CREATE TYPE "Level" AS ENUM ('MEDIO','SUPERIOR','BOTH'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS "User" (
     "id" TEXT PRIMARY KEY,
     "name" TEXT NOT NULL,
     "email" TEXT NOT NULL,
     "password" TEXT NOT NULL,
     "role" "Role" NOT NULL DEFAULT 'STUDENT_MEDIO',
     "approved" BOOLEAN NOT NULL DEFAULT false,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approved" BOOLEAN NOT NULL DEFAULT true;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
  `CREATE TABLE IF NOT EXISTS "Topic" (
     "id" TEXT PRIMARY KEY,
     "number" INTEGER NOT NULL,
     "title" TEXT NOT NULL,
     "description" TEXT NOT NULL,
     "level" "Level" NOT NULL DEFAULT 'BOTH',
     "block" INTEGER NOT NULL,
     "blockTitle" TEXT NOT NULL,
     "aiFocus" TEXT NOT NULL,
     "contentMedio" TEXT,
     "contentSuperior" TEXT
   );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Topic_number_key" ON "Topic"("number");`,
  `CREATE TABLE IF NOT EXISTS "Progress" (
     "id" TEXT PRIMARY KEY,
     "userId" TEXT NOT NULL,
     "topicId" TEXT NOT NULL,
     "completed" BOOLEAN NOT NULL DEFAULT false,
     "score" INTEGER NOT NULL DEFAULT 0,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Progress_userId_topicId_key" ON "Progress"("userId","topicId");`,
];

function directClient() {
  const url = normalizeRegion(process.env.DIRECT_URL || process.env.DATABASE_URL);
  return new PrismaClient({ datasources: { db: { url } } });
}

let ready: Promise<void> | null = null;

async function initialize() {
  // Camino rápido: si la BD ya está migrada (Omar es profesor y existe `approved`),
  // no hacer nada más.
  try {
    const omar = await prisma.user.findUnique({
      where: { email: "omar.romero@jrotero.es" },
      select: { role: true, approved: true },
    });
    if (omar && omar.role === "PROF_SUPERIOR") return;
  } catch {
    // Falta alguna columna/rol: se migra a continuación.
  }

  // Camino lento (primera vez / migración): esquema + datos con conexión directa.
  const db = directClient();
  try {
    for (const stmt of DDL) {
      try {
        await db.$executeRawUnsafe(stmt);
      } catch (e) {
        // Un statement idempotente puede fallar de forma inocua (p. ej. valor de
        // enum ya presente); se registra y se continúa.
        console.error("[ensure-db] DDL:", (e as Error).message);
      }
    }
    await seedDatabase(db); // idempotente: temario + cuentas de personal con sus roles
  } finally {
    await db.$disconnect();
  }
}

/**
 * Garantiza que la base de datos existe, está migrada y poblada. Se ejecuta una
 * vez por instancia; si falla, se reintenta en la siguiente llamada.
 */
export function ensureDb(): Promise<void> {
  if (!ready) {
    ready = initialize().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}
