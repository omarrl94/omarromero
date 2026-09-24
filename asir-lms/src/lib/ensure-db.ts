import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

// DDL idempotente equivalente al esquema Prisma. Crea las tablas si faltan y
// migra la base de datos existente (nuevos roles y columna `approved`).
// Se ejecuta por el pooler (misma conexión que el login), que sí es alcanzable
// desde las funciones de Netlify.
const DDL = [
  `DO $$ BEGIN CREATE TYPE "Level" AS ENUM ('MEDIO','SUPERIOR','BOTH'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS "User" (
     "id" TEXT PRIMARY KEY,
     "name" TEXT NOT NULL,
     "email" TEXT NOT NULL,
     "password" TEXT NOT NULL,
     "role" TEXT NOT NULL DEFAULT 'STUDENT_MEDIO',
     "approved" BOOLEAN NOT NULL DEFAULT false,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  // Convierte la columna `role` de enum a texto si aún fuese enum (sin perder datos).
  `ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;`,
  `ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;`,
  `ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT_MEDIO';`,
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

let ready: Promise<void> | null = null;

async function initialize() {
  // Camino rápido: si la BD ya está migrada (Omar es profesor), no hacer nada.
  try {
    const omar = await prisma.user.findUnique({
      where: { email: "omar.romero@jrotero.es" },
      select: { role: true },
    });
    if (omar?.role === "PROF_SUPERIOR") return;
  } catch {
    // Falta alguna columna/rol: se migra a continuación.
  }

  // Migración por el pooler (alcanzable desde Netlify). Cada paso es tolerante
  // para no bloquear nunca el inicio de sesión.
  for (const stmt of DDL) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (e) {
      console.error("[ensure-db] DDL:", (e as Error).message);
    }
  }
  try {
    await seedDatabase(prisma);
  } catch (e) {
    console.error("[ensure-db] seed:", (e as Error).message);
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
