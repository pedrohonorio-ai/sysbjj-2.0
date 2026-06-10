import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// evita criar múltiplas instâncias no Vercel (CRÍTICO)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
