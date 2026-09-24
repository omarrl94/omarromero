import { PrismaClient } from "@prisma/client";

import { seedDatabase } from "../src/lib/seed-data";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then(() => console.log("Seed completado."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
