import { PrismaClient } from "@prisma/client";

import { fixSupabaseEnv } from "@/lib/db-url";

// Corrige la región del pooler de Supabase antes de crear el cliente.
fixSupabaseEnv();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
