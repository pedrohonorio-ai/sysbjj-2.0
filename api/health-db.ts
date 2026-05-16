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
  const isNeon = dbUrl.includes("neon.tech");

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
        vercel_controlled: !!process.env.VERCEL,
        neon_integration: isNeon
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
        used_variable: detectedKey
      },
      tip: "OSS! Verifique se a string de conexão (DATABASE_URL) está correta nos Secrets/Environment."
    });
  }
}
