import * as dotenv from "dotenv";

// 🥋 OSS SENSEI: Inicialização Master de Ambiente
dotenv.config({ override: true });

const cleanupEnv = (key: string) => {
  const val = process.env[key];
  if (val) {
    // 🥋 OSS SENSEI: Extra-safe cleaning
    let cleaned = val.trim();
    
    // Remove invisible characters
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, "");
    
    for (let i = 0; i < 3; i++) {
      cleaned = cleaned.replace(/^(DATABASE_URL|URL|DIRECT_URL|DATABASE|DATABASE_URI|SUPABASE_DATABASE_URL|SUPABASE_DB_URL)\s*[:=]\s*/i, "").trim();
      cleaned = cleaned.replace(/^['"`]|['"`]$/g, '').trim();
    }
    
    while (cleaned.startsWith('=') || cleaned.startsWith(':') || cleaned.startsWith(' ')) {
      cleaned = cleaned.substring(1).trim();
    }
    
    process.env[key] = cleaned;
    return cleaned;
  }
  return "";
};

const dbUrl = cleanupEnv('DATABASE_URL') || cleanupEnv('SUPABASE_DATABASE_URL') || cleanupEnv('SUPABASE_DB_URL');
const directUrl = cleanupEnv('DIRECT_URL') || dbUrl;

const ensureProtocol = (url: string) => {
  if (!url) return "";
  // Se já tem protocolo, não mexe
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return url;
  }
  
  // 🥋 OSS SENSEI: Se parece uma URL de banco ou host do Supabase, injeta o protocolo
  if (url.includes("@") || url.includes("supabase.co") || url.includes("pooler.supabase.com") || url.includes(":5432") || url.includes(":6543")) {
    console.warn("🥋 OSS SENSEI: Injetando protocolo 'postgresql://' na URL detectada.");
    return `postgresql://${url}`;
  }
  return url;
};

const finalDbUrl = ensureProtocol(dbUrl);
const finalDirectUrl = ensureProtocol(directUrl);

if (finalDbUrl !== dbUrl) process.env.DATABASE_URL = finalDbUrl;
if (finalDirectUrl !== directUrl) process.env.DIRECT_URL = finalDirectUrl;

if (finalDbUrl) {
  if (!finalDbUrl.startsWith('postgresql://') && !finalDbUrl.startsWith('postgres://')) {
    console.error("❌ OS SENSEI: DATABASE_URL inválida! Deve começar com postgresql://");
  } else {
    const isPooler = finalDbUrl.includes("pooler.supabase.com") || finalDbUrl.includes(":6543");
    const isDirect = finalDbUrl.includes(".supabase.co") && finalDbUrl.includes(":5432");
    
    // Masked log for safety
    const masked = finalDbUrl.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Dojo Status: ${masked.substring(0, 45)}...`);
    
    if (isDirect) {
      console.warn("🥋 OSS SENSEI! Aviso: Você está usando a conexão direta (5432).");
      console.warn("💡 DICA: Use a String de Conexão com PORTA 6543 para maior estabilidade.");
    }
  }
} else {
  console.warn("⚠️ OS SENSEI: DATABASE_URL não configurada nos Segredos.");
}
