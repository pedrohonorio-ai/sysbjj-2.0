import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ override: true });

// 🥋 OSS SENSEI: Validação e Sanetização da String de Conexão
const rawUrl = process.env.DATABASE_URL || "";
// 🥋 Limpeza Proativa Extra-Forte
const cleanUrl = (url: string) => {
  if (!url) return "";
  let cleaned = url.replace(/['"]/g, '').trim();
  
  // Remove prefixos como "DATABASE_URL =" ou "URL:"
  cleaned = cleaned.replace(/^(DATABASE_URL|URL|DIRECT_URL|DATABASE|DATABASE_URI)\s*[:=]\s*/i, "");
  
  // Remove '=' ou ':' iniciais orfãos ou espaços extras
  while (cleaned.startsWith('=') || cleaned.startsWith(':') || cleaned.startsWith(' ')) {
    cleaned = cleaned.substring(1).trim();
  }

  // Se a string começar com algo que parece um host do supabase sem protocolo (ex: aws-0-us-west-1.pooler.supabase.com)
  if (!cleaned.includes("://") && (cleaned.includes("supabase.com") || cleaned.includes("supabase.co") || cleaned.includes("@"))) {
    // Tenta detectar se é uma URI faltando o esquema
    console.warn("🥋 OSS SENSEI: Injetando esquema postgresql:// em URL detectada sem protocolo.");
    cleaned = `postgresql://${cleaned}`;
  }

  // 🥋 Autocorreção de protocolo: Se começa com protocolo de banco sem //
  if ((cleaned.startsWith('postgresql:') || cleaned.startsWith('postgres:')) && !cleaned.includes('://')) {
    console.warn("🥋 OSS SENSEI: Corrigindo protocolo malformado (faltando //)");
    cleaned = cleaned.replace(/^(postgresql|postgres):/i, "$1://");
  }

  return cleaned;
};

let finalUrl = cleanUrl(process.env.DATABASE_URL || "");
let finalDirectUrl = cleanUrl(process.env.DIRECT_URL || "");

// 🚨 VALIDATION GATE
if (!finalUrl) {
  console.error("❌ OSS SENSEI: DATABASE_URL Ausente!");
  finalUrl = "postgresql://unconfigured:check_secrets@supabase.com:6543/postgres?error=missing";
}

if (!finalUrl.startsWith('postgresql://') && !finalUrl.startsWith('postgres://')) {
  console.error(`❌ OSS SENSEI! DATABASE_URL inválida detectada. Valor atual começa com: ${finalUrl.substring(0, 20)}...`);
  console.error("👉 A URL deve começar com 'postgresql://'. Verifique se você não copiou o link do dashboard (HTTP) ou o nome da variável em vez do valor.");
  
  // 🛡️ EMERGENCY FALLBACK - Previne que o Prisma quebre o processo de boot totalmente
  finalUrl = "postgresql://unconfigured:check_secrets@supabase.com:6543/postgres?error=inv_prot";
}

if (finalUrl.includes("[YOUR-PASSWORD]")) {
  console.warn("🥋 OSS SENSEI! Aviso: A DATABASE_URL ainda contém o placeholder [YOUR-PASSWORD].");
}

// 🛡️ DIAGNOSTIC SIGNATURE (Mascara senha mas mostra host/porta)
try {
  const urlObj = new URL(finalUrl);
  console.log(`🔌 PRISMA CONFIG: Protocolo=${urlObj.protocol}, Host=${urlObj.host}, Path=${urlObj.pathname}`);
  if (urlObj.searchParams.has('pgbouncer')) {
    console.log(`🚀 POOLING ATIVADO: pgbouncer=${urlObj.searchParams.get('pgbouncer')}`);
  }
} catch (e) {
  console.error("❌ OSS SENSEI: Falha ao analisar string de conexão para diagnóstico.");
}

if (!finalDirectUrl.startsWith('postgresql://') && !finalDirectUrl.startsWith('postgres://')) {
  finalDirectUrl = finalUrl;
}

// 🥋 Autocorreção: Injeção de pgbouncer se estiver no Supabase
if (finalUrl.includes("supabase.com") || finalUrl.includes("supabase.co")) {
  if (finalUrl.includes(":6543") && !finalUrl.includes("pgbouncer=")) {
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${separator}pgbouncer=true&connection_limit=1`;
    console.log("🚀 OSS SENSEI: Auto-configurando pooler (pgbouncer=true, limit=1)");
  }
}

// 🔥 CRITICAL: Overwrite definitivo no process.env para que o Prisma não pegue valores errados
const dbUrlForLog = finalUrl || "";
console.log("------------------------------------------------------------------");
console.log("🥋 OSS SENSEI - DIAGNÓSTICO DE RUNTIME:");
console.log({
  hasDbUrl: !!dbUrlForLog,
  startsWith: dbUrlForLog.startsWith("postgresql://"),
  hasPooler: dbUrlForLog.includes("pooler"),
  has6543: dbUrlForLog.includes(":6543"),
  atCount: (dbUrlForLog.match(/@/g) || []).length,
  quoteCount: (dbUrlForLog.match(/"/g) || []).length,
  spaceAtEnd: dbUrlForLog.endsWith(" "),
  totalLength: dbUrlForLog.length
});
console.log("------------------------------------------------------------------");

process.env.DATABASE_URL = finalUrl;
process.env.DIRECT_URL = finalDirectUrl;

const isSupabaseDirect = (finalUrl.includes(".supabase.co") || finalUrl.includes(".supabase.com")) && finalUrl.includes(":5432");
const statusMsg = finalUrl.includes(":6543") ? "POOLER/6543" : (isSupabaseDirect ? "DIRETA/5432 ⚠️" : "CONFIGURADA");
console.log(`📡 Dojo Status: ${statusMsg}`);

if (isSupabaseDirect) {
  console.warn("🥋 OSS SENSEI: Você está usando a porta 5432.");
  console.warn("🥋 OSS SENSEI: Para sistemas em Nuvem, RECOMENDA-SE usar a porta 6543 com pgbouncer=true.");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 🥋 OSS SENSEI: Configurações do Cliente recomendadas para produção
const prismaOptions: any = {
  log: ["error", "warn"],
  datasources: {
    db: { url: finalUrl }
  },
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
