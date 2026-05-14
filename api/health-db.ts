import { Request, Response } from 'express';
import { prisma, detectedKey } from '../prisma/client';

export default async function healthDbHandler(req: Request, res: Response) {
  const getSource = () => {
    if (process.env.VERCEL) return "VERCEL (Serverless)";
    if (process.env.RAILWAY_STATIC_URL) return "RAILWAY";
    if (process.env.RENDER_SERVICE_ID) return "RENDER";
    return "CLOUD_RUN_OR_SECRETS";
  };

  const dbUrl = process.env.DATABASE_URL || "";
  const source = getSource();
  const isValidHost = dbUrl.includes("pooler.supabase.com") || dbUrl.includes(":6543");
  const isPlaceholder = dbUrl.includes("supabase.com") && !dbUrl.includes("pooler.supabase.com");

  try {
    // 🥋 Test connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return res.status(200).json({
      status: "ok",
      database: "connected",
      audit: {
        origin: source,
        used_variable: detectedKey,
        host: dbUrl.split('@')[1]?.split(':')[0] || "unknown",
        port_detected: dbUrl.includes(':6543') ? 6543 : (dbUrl.includes(':5432') ? 5432 : "default"),
        pooler_mode: isValidHost,
        vercel_controlled: !!process.env.VERCEL,
        supabase_integration: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.VITE_SUPABASE_URL
      },
      sensei_message: "OSS! Infraestrutura auditada e operando em máxima eficiência."
    });
  } catch (err: any) {
    console.error("🥋 [HEALTH DB FAIL]:", err.message);
    
    return res.status(503).json({
      status: "error",
      database: "disconnected",
      message: err.message,
      audit: {
        origin: source,
        used_variable: detectedKey,
        is_placeholder_detected: isPlaceholder,
        critical_warning: isPlaceholder ? "PLACEHOLDER DETECTED: supabase.com is NOT a valid production host." : "Connection failed.",
        vercel_fix_needed: (source.includes("VERCEL") && isPlaceholder)
      },
      tip: isPlaceholder 
        ? "🥋 SENSEI: Sua DATABASE_URL no Vercel/Secrets contém 'supabase.com'. Você DEVE usar o host completo do Pooler (ex: aws-1-us-west-1.pooler.supabase.com)."
        : "OSS! Verifique se o IP do servidor está liberado no Firewall do Supabase ou se a senha está correta."
    });
  }
}
