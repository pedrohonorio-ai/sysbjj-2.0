import * as dotenv from "dotenv";

// 🥋 OSS SENSEI: Inicialização Master de Ambiente
dotenv.config({ override: true });

const cleanupEnv = (key: string) => {
  const val = process.env[key];
  if (val) {
    // 🥋 OSS SENSEI: Extra-safe cleaning
    let cleaned = val.trim();
    
    // Remove invisible characters and non-printable chars from copy-paste
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u202F\u205F\u3000]/g, "");
    
    for (let i = 0; i < 5; i++) {
        // Remove common variable name assignments if pasted accidentally
        cleaned = cleaned.replace(/^(DATABASE_URL|URL|DIRECT_URL|DATABASE|DATABASE_URI|POSTGRES_URL|POSTGRES_PRISMA_URL)\s*[:=]\s*/i, "").trim();
        // Handle cases like "postgresql://DATABASE_URL=..."
        cleaned = cleaned.replace(/DATABASE_URL=/g, "");
        // Remove "export " prefix
        cleaned = cleaned.replace(/^export\s+/i, "").trim();
        // Remove surrounding quotes
        cleaned = cleaned.replace(/^['"`]|['"`]$/g, '').trim();
        // Remove trailing semicolon
        cleaned = cleaned.replace(/;$/, "").trim();
    }
    
    while (cleaned.startsWith('=') || cleaned.startsWith(':') || cleaned.startsWith(' ')) {
      cleaned = cleaned.substring(1).trim();
    }
    
    // 🥋 NEON SENSEI: Automatic Pooler-to-Direct Correction
    // PgBouncer explicitly fails in some environments with "Authentication failed for (not available)"
    if (cleaned.includes("neon.tech") && cleaned.includes("-pooler")) {
        console.warn("🥋 OSS SENSEI: Detectado Pooler do Neon. Convertendo para conexão direta para maior estabilidade.");
        cleaned = cleaned.replace("-pooler", "");
        // Neon direct connections on port 5432 usually don't want the pooler port if it was 6543
        cleaned = cleaned.replace(":6543", ":5432");
    }
    
    process.env[key] = cleaned;
    return cleaned;
  }
  return "";
};

const dbUrl = cleanupEnv('DATABASE_URL') || cleanupEnv('POSTGRES_URL') || cleanupEnv('POSTGRES_PRISMA_URL');
const directUrl = cleanupEnv('DIRECT_URL') || dbUrl;

const ensureProtocol = (url: string) => {
  if (!url) return "";
  
  let result = url;

  // 🥋 OSS SENSEI: Protocol Enforcement
  // Se não tem protocolo mas tem @, assume postgresql
  if (!result.includes("://") && result.includes("@")) {
    result = `postgresql://${result}`;
  }

  // Se tem protocolo mas sem :// (ex: postgresql:host)
  if ((result.toLowerCase().startsWith('postgresql:') || result.toLowerCase().startsWith('postgres:')) && !result.includes("://")) {
    result = result.replace(/^(postgresql|postgres):/i, "$1://");
  }
  
  return result;
};

const finalDbUrl = ensureProtocol(dbUrl);
const finalDirectUrl = ensureProtocol(directUrl);

if (finalDbUrl !== dbUrl) process.env.DATABASE_URL = finalDbUrl;
if (finalDirectUrl !== directUrl) process.env.DIRECT_URL = finalDirectUrl;

if (finalDbUrl) {
  if (!finalDbUrl.startsWith('postgresql://') && !finalDbUrl.startsWith('postgres://')) {
    console.error("❌ OS SENSEI: DATABASE_URL inválida! Deve começar com postgresql://");
  } else {
    // Masked log for safety
    const masked = finalDbUrl.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Dojo Status [INIT]: ${masked.substring(0, 45)}...`);
    
    // 🥋 Detect placeholders
    const lowUrl = finalDbUrl.toLowerCase();
    if (lowUrl.includes("[your-password]") || lowUrl.includes("your-password") || lowUrl.includes("[password]")) {
        console.error("🚨 ERRO CRÍTICO: '[YOUR-PASSWORD]' detectado na DATABASE_URL!");
        console.error("👉 Sensei, você precisa substituir '[YOUR-PASSWORD]' pela sua senha real lá no menu Settings > Secrets.");
    }

    // 🥋 NEON SENSEI CHECK
    try {
        const u = new URL(finalDbUrl);
        const host = u.hostname.toLowerCase();
        if (host.includes("neon.tech")) {
            console.log("🥋 OSS! Conexão Neon detectada.");
            if (!finalDbUrl.includes("sslmode=")) {
                console.warn("⚠️ AVISO SENSEI: URLs do Neon geralmente precisam de '?sslmode=require' para funcionar no Cloud.");
            }
        }
    } catch (e) {}
  }
} else {
  console.warn("⚠️ OS SENSEI: DATABASE_URL não configurada nos Segredos.");
}
