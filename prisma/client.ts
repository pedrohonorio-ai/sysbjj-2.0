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
  // Remove zero-width spaces and other non-printable characters that often come from copy-paste
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u202F\u205F\u3000]/g, "");

  // Repeat cleaning a few times for nested junk
  for (let i = 0; i < 5; i++) {
    // Remove "export " prefix
    cleaned = cleaned.replace(/^export\s+/i, "").trim();

    // Remove common variable name assignments if pasted accidentally
    cleaned = cleaned
      .replace(
        /^(DATABASE_URL|URL|DIRECT_URL|DATABASE|DATABASE_URI|POSTGRES_URL|POSTGRES_PRISMA_URL)\s*[:=]\s*/i,
        ""
      )
      .trim();

    // Remove surrounding quotes (single, double, or backticks)
    cleaned = cleaned.replace(/^['"`]|['"`]$/g, "").trim();
    
    // Remove trailing semicolon if present
    cleaned = cleaned.replace(/;$/, "").trim();
  }

  // Handle accidental double prefixing (e.g. "DATABASE_URL=DATABASE_URL=...")
  while (cleaned.startsWith("=") || cleaned.startsWith(":") || cleaned.startsWith(" ")) {
    cleaned = cleaned.substring(1).trim();
  }

  // 🥋 OSS SENSEI: Protocol Enforcement
  // Handle case where user might have "postgresql://DATABASE_URL=..."
  if (cleaned.includes("DATABASE_URL=")) {
      cleaned = cleaned.replace(/DATABASE_URL=/g, "");
  }

  // If no protocol is present, but we have @ (indicates user:pass@host), assume postgresql
  if (!cleaned.includes("://") && cleaned.includes("@")) {
    cleaned = `postgresql://${cleaned}`;
  }

  // Fix common typo: postgresql: instead of postgresql://
  if ((cleaned.toLowerCase().startsWith("postgresql:") || cleaned.toLowerCase().startsWith("postgres:")) && !cleaned.includes("://")) {
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
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL"
]);

const rawDirectUrl = process.env.DIRECT_URL || "";

let finalUrl = cleanUrl(rawDbUrl);
let finalDirectUrl = cleanUrl(rawDirectUrl) || finalUrl;

// 🚨 FINAL SENSEI VALIDATION (Zero tolerance for placeholders!)
const isInvalidHost = (url: string) => {
    if (!url || url.length < 15) return true; 
    const low = url.toLowerCase();
    
    // Neon URLs start with postgresql:// or postgres:// and contain neon.tech
    const isNeon = low.includes("neon.tech");

    if (!isNeon) {
        // If it doesn't look like Neon, we check if it has a generic protocol
        if (!low.startsWith("postgresql://") && !low.startsWith("postgres://")) return true;
    }
    
    // Check for obvious placeholders
    if (
        low.includes("your-password") || 
        low.includes("[your-password]") || 
        low.includes("[password]") || 
        low.includes("your_password") ||
        low.includes("sua_senha") ||
        low.includes("sua-senha") ||
        low.includes("ep-xxx") // Neon placeholder
    ) {
        return true;
    }

    try {
        const u = new URL(url);
        return false;
    } catch (e) {
        // If not a valid URL yet, check broad patterns
        return low.includes("neon.tech") && low.length < 40;
    }
};

const dummyUrl = "postgresql://invalid_user:invalid_pass@invalid_host:5432/invalid_db?connect_timeout=1";
const isConfigValid = !isInvalidHost(finalUrl);
const finalUrlToUse = isConfigValid ? finalUrl : dummyUrl;

if (!isConfigValid) {
  let reason = "DATABASE_URL ausente ou inválida";
  const low = (finalUrl || "").toLowerCase();
  
  if (low.includes("ep-xxx")) {
      reason = "🚨 PLACEHOLDER DETECTADO Neon: Substitua 'ep-xxx...' pela sua URL real do Neon.";
  }
  
  console.error(`❌ ERRO CRÍTICO [ORIGEM: ${source}]: ${reason}`);
}

// Apply back to environment
process.env.DATABASE_URL = finalUrlToUse;
process.env.DIRECT_URL = finalDirectUrl || finalUrlToUse;

const globalForPrisma = globalThis as any;

const prismaInstance = globalForPrisma.prisma || new PrismaClient({
    datasources: {
      db: {
        url: finalUrlToUse
      }
    },
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
export default prisma;
