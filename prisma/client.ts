import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ override: true });

const getRawSecret = (keys: string[]) => {
  for (const key of keys) {
    const val = process.env[key];
    // 🥋 OSS SENSEI: Ignoramos valores que não pareçam uma string de conexão válida (precisa ter postgres ou ://)
    if (val && val.trim().length > 10 && (val.toLowerCase().includes("postgres") || val.includes("://"))) {
        return { key, value: val };
    }
  }
  return { key: "NOT_FOUND", value: "" };
};

const cleanUrl = (url: string) => {
  if (!url) return "";

  let cleaned = url.trim();

  // 🥋 OSS SENSEI: Extreme Cleaning (Invisible chars, prefix junk)
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Repeat cleaning a few times for nested junk
  for (let i = 0; i < 5; i++) {
    cleaned = cleaned
      .replace(
        /^(export\s+)?(DATABASE_URL|URL|DIRECT_URL|DATABASE|DATABASE_URI|SUPABASE_DATABASE_URL|SUPABASE_DB_URL)\s*[:=]\s*/i,
        ""
      )
      .replace(/^export\s+/i, "")
      .trim();

    cleaned = cleaned.replace(/^['"`]|['"`]$/g, "").trim();
  }

  while (cleaned.startsWith("=") || cleaned.startsWith(":") || cleaned.startsWith(" ")) {
    cleaned = cleaned.substring(1).trim();
  }

  // 🥋 OSS SENSEI: Protocol Enforcement
  if (!cleaned.includes("://") && cleaned.includes("@")) {
    cleaned = `postgresql://${cleaned}`;
  }

  if ((cleaned.startsWith("postgresql:") || cleaned.startsWith("postgres:")) && !cleaned.includes("://")) {
    cleaned = cleaned.replace(/^(postgresql|postgres):/i, "$1://");
  }

  return cleaned;
};

// 🥋 OSS SENSEI: Determinar origem da configuração
const getSource = () => {
    if (process.env.VERCEL) return "VERCEL_ENV";
    if (process.env.RAILWAY_STATIC_URL) return "RAILWAY_ENV";
    if (process.env.RENDER_SERVICE_ID) return "RENDER_ENV";
    return "PROCESS_ENV_OR_SECRETS";
};

const source = getSource();
export const { key: detectedKey, value: rawDbUrl } = getRawSecret([
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "SUPABASE_DATABASE_URL",
  "SUPABASE_DB_URL",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL"
]);

const rawDirectUrl = process.env.DIRECT_URL || "";

let finalUrl = cleanUrl(rawDbUrl);
let finalDirectUrl = cleanUrl(rawDirectUrl) || finalUrl;

// 🚨 FINAL SENSEI VALIDATION (Zero tolerance for placeholders!)
const isInvalidHost = (url: string) => {
    if (!url) return false;
    const low = url.toLowerCase();
    // Rejeita explicitamente host genérico 'supabase.com' sem o pooler ou host direto
    return low.includes("supabase.com") && !low.includes("pooler.supabase.com") && !low.includes("db.");
};

if (isInvalidHost(finalUrl)) {
  const errorMsg = `❌ ERRO CRÍTICO [ORIGEM: ${source} | KEY: ${detectedKey}]: Host 'supabase.com' detectado. Este é um placeholder inválido! Substitua pelo host correto (ex: [PROJECT-REF].pooler.supabase.com:6543) nos Secrets.`;
  console.error(errorMsg);
  if (source === "VERCEL_ENV") {
      console.error("⚠️ ENV CONTROLRED BY VERCEL - MUST FIX IN DASHBOARD (Integration or Project Settings)");
  }
  // No Enterprise Mode, não deixamos o sistema rodar com configuração podre
  process.env.DATABASE_URL = "INVALID_PLACEHOLDER_ERROR"; 
}

if (finalUrl.includes("YOUR-PASSWORD") || finalUrl.includes("[PASSWORD]")) {
  const errorMsg = `❌ ERRO CRÍTICO [ORIGEM: ${source}]: '[PASSWORD]' ou 'YOUR-PASSWORD' detectado na DATABASE_URL! Atualize seus Secrets.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// 🔥 Performance & Stability Tuning
const isPooler = finalUrl.includes("pooler.supabase.com") || finalUrl.includes(":6543");

if (isPooler) {
    if (!finalUrl.includes("pgbouncer=")) {
        const sep = finalUrl.includes("?") ? "&" : "?";
        finalUrl = `${finalUrl}${sep}pgbouncer=true`;
    }
    if (!finalUrl.includes("connection_limit=")) {
        const sep = finalUrl.includes("?") ? "&" : "?";
        finalUrl = `${finalUrl}${sep}connection_limit=1`;
    }
}

// Apply back to environment for standard Prisma usage and migration tools
process.env.DATABASE_URL = finalUrl;
process.env.DIRECT_URL = finalDirectUrl;

const globalForPrisma = globalThis as any;

export const prisma =
  new PrismaClient({
    datasources: {
      db: {
        url: finalUrl
      }
    },
    log: ["error", "warn"]
  });

// 🥋 Global persistence ONLY in dev
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 🥋 Informação de inicialização
(async () => {
  const masked = finalUrl.replace(/:([^@]+)@/, ':****@');
  console.log(`🥋 [DB INIT] Origem Detectada: ${source}`);
  console.log(`📡 [DB INIT] Variável Utilizada: ${detectedKey}`);
  
  if (!finalUrl || finalUrl === "INVALID_PLACEHOLDER_ERROR") {
      console.error("❌ [DB INIT] DATABASE_URL não configurada ou inválida. O Dojo está em modo degradado.");
      return;
  }

  console.log(`📡 [DB INIT] Configurando conexão para: ${masked.substring(0, 70)}...`);
  
  try {
    await prisma.$connect();
    console.log("✅ [DB INIT] Conexão estabelecida com sucesso.");
  } catch (e: any) {
    console.error("❌ [DB INIT] FALHA NA CONEXÃO:", e.message);
    if (e.message.includes("Can't reach database server")) {
        console.error("💡 SENSEI TIP: O host parece estar offline ou bloqueado pelo Firewall do Supabase.");
    }
  }
})();

export default prisma;
