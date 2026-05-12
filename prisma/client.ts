import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ override: true });

// Sanitize database URLs to remove potential quotes from environment settings
const sanitizeUrl = (url?: string) => {
  if (!url) return undefined;
  // Remove quotes, whitespace and common noise
  return url.replace(/['"]/g, '').trim();
};

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = sanitizeUrl(process.env.DATABASE_URL);
}
if (process.env.DIRECT_URL) {
  process.env.DIRECT_URL = sanitizeUrl(process.env.DIRECT_URL);
}

const prismaClientSingleton = () => {
  try {
    const dbUrl = sanitizeUrl(process.env.DATABASE_URL);
    const directUrl = sanitizeUrl(process.env.DIRECT_URL);

    const clientConfig: any = {
      log: ['error'], // Minimize noise but keep errors
    };

    if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
      if (dbUrl.includes("[YOUR-PASSWORD]")) {
        console.warn("OS SENSEI! ALERTA: Senha placeholder [YOUR-PASSWORD] detectada.");
      }
      clientConfig.datasources = {
        db: { url: dbUrl }
      };
    } else {
      // Specific detection for HTTPS (Supabase dashboard URL mistake)
      if (dbUrl && dbUrl.startsWith('https://')) {
        console.error("OS SENSEI! ERRO: DATABASE_URL configurada com HTTPS. Isso está errado.");
        process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/db?ERR_HTTPS_URL_PROVIDED";
      } else {
        console.error("OS SENSEI! DATABASE_URL INVÁLIDA OU AUSENTE.");
        process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/db?ERR_INVALID_OR_EMPTY_URL";
      }
    }

    console.log("OS SENSEI! Instanciando PrismaClient...");
    return new PrismaClient(clientConfig);
  } catch (e) {
    console.error("OS SENSEI! Erro crítico ao criar PrismaClient:", e);
    // Return a dummy client that will fail on queries but not on boot
    return new PrismaClient() as any;
  }
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
