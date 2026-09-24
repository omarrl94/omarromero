// Ejecuta el seed solo si la base de datos está vacía (primer despliegue).
// Con SEED_ON_BUILD=force lo re-ejecuta siempre (recarga temario y cuentas base).
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const prisma = new PrismaClient();
try {
  const count = await prisma.user.count();
  if (count === 0 || process.env.SEED_ON_BUILD === "force") {
    console.log(count === 0 ? "Base de datos vacía: cargando temario y usuarios…" : "SEED_ON_BUILD=force: recargando datos…");
    execSync("npx prisma db seed", { stdio: "inherit" });
  } else {
    console.log(`Ya hay ${count} usuarios en la base de datos: se omite el seed.`);
  }
} catch (e) {
  console.error("Error preparando la base de datos:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
