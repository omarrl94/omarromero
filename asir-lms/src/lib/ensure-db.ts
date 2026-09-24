import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

// DDL idempotente equivalente al esquema Prisma (para crear las tablas en runtime
// si el despliegue no pudo ejecutar `prisma db push`).
const DDL = [
  `DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN','STUDENT_MEDIO','STUDENT_SUPERIOR'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "Level" AS ENUM ('MEDIO','SUPERIOR','BOTH'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS "User" (
     "id" TEXT PRIMARY KEY,
     "name" TEXT NOT NULL,
     "email" TEXT NOT NULL,
     "password" TEXT NOT NULL,
     "role" "Role" NOT NULL DEFAULT 'STUDENT_MEDIO',
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
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
  for (const stmt of DDL) await prisma.$executeRawUnsafe(stmt);
  // Siembra el temario y las cuentas si aún no hay datos (idempotente).
  const users = await prisma.user.count();
  const topics = await prisma.topic.count();
  if (users === 0 || topics === 0) await seedDatabase(prisma);
}

/**
 * Garantiza que la base de datos existe y está poblada. Se ejecuta una sola vez
 * por instancia; si falla, se reintenta en la siguiente llamada.
 */
export function ensureDb(): Promise<void> {
  if (!ready) {
    ready = initialize().catch((e) => {
      ready = null; // permite reintentar
      throw e;
    });
  }
  return ready;
}
