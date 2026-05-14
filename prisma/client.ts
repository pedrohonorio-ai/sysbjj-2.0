import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ override: true });

const getRawSecret = (keys: string[]) => {
  for (const key of keys) {
    const val = process.env[key];
    // Ignoramos valores que não pareçam uma string de conexão válida (precisa ter postgres ou ://)
    if (val && val.trim().length > 10 && (val.toLowerCase().includes("postgres") || val.includes("://"))) return val;
  }
  return "";
};

/**
 * 🥋 PRIORIDADE CORRETA:
 * 1º DIRECT_URL (seguro / produção Vercel)
 * 2º DATABASE_URL (fallback)
 */
const rawUrl = getRawSecret([
  "DIRECT_URL",
  "DATABASE_URL",
  "SUPABASE_DATABASE_URL",
  "SUPABASE_DB_URL"
]);

const cleanUrl = (url: string) => {
  if (!url) return "";

  let cleaned = url.trim();

  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, "");

  for (let i = 0; i < 3; i++) {
    cleaned = cleaned
      .replace(
        /^(DATABASE_URL|URL|DIRECT_URL|DATABASE|DATABASE_URI|SUPABASE_DATABASE_URL|SUPABASE_DB_URL)\s*[:=]\s*/i,
        ""
      )
      .trim();

    cleaned = cleaned.replace(/^['"`]|['"`]$/g, "").trim();
  }

  while (cleaned.startsWith("=") || cleaned.startsWith(":") || cleaned.startsWith(" ")) {
    cleaned = cleaned.substring(1).trim();
  }

  if (!cleaned.includes("://") && cleaned.includes("@")) {
    cleaned = `postgresql://${cleaned}`;
  }

  if ((cleaned.startsWith("postgresql:") || cleaned.startsWith("postgres:")) && !cleaned.includes("://")) {
    cleaned = cleaned.replace(/^(postgresql|postgres):/i, "$1://");
  }

  return cleaned;
};

let finalUrl = cleanUrl(rawUrl);
let finalDirectUrl = cleanUrl(process.env.DIRECT_URL || rawUrl);

// 🚨 VALIDATION CORRIGIDA (mais robusta)
if (finalUrl.includes("supabase") && !finalUrl.includes("pooler.supabase.com")) {
  console.error("❌ DATABASE_URL inválida: use Supabase Pooler (host *.pooler.supabase.com)");
  throw new Error("DATABASE_URL incorreta - use Supabase Transaction Pooler (porta 6543)");
}

if (!finalUrl.startsWith("postgresql://") && !finalUrl.startsWith("postgres://")) {
  throw new Error("DATABASE_URL inválida - protocolo ausente");
}

// 🔥 garante pgbouncer
if (!finalUrl.includes("pgbouncer=")) {
  const sep = finalUrl.includes("?") ? "&" : "?";
  finalUrl = `${finalUrl}${sep}pgbouncer=true`;
}

if (!finalUrl.includes("connection_limit=")) {
  const sep = finalUrl.includes("?") ? "&" : "?";
  finalUrl = `${finalUrl}${sep}connection_limit=1`;
}

process.env.DATABASE_URL = finalUrl;
process.env.DIRECT_URL = finalDirectUrl;

console.log("✅ Prisma ENV fix aplicado");
console.log("📡 Host:", finalUrl.split("@")[1]?.split(":")[0]);

const globalForPrisma = globalThis as any;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: finalUrl
      }
    },
    log: ["error", "warn"]
  });

(async () => {
  try {
    console.log("🥋 DB TEST: connecting...");
    await prisma.$connect();
    console.log("🥋 DB OK");
  } catch (e) {
    console.error("❌ DB FAIL", e);
  }
})();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
