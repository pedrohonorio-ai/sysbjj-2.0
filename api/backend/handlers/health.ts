import { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";

export default async function healthHandler(req: Request, res: Response) {
  let dbStatus = "healthy";
  let dbLatency = 0;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
  } catch {
    dbStatus = "unhealthy";
  }
  return res.status(200).json({
    success: true,
    status: dbStatus === "healthy" ? "OSS" : "DEGRADED",
    timestamp: new Date().toISOString(),
    diagnostics: { database: { status: dbStatus, latency_ms: dbLatency } }
  });
}
