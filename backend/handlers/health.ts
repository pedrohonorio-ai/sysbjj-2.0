import { Request, Response } from 'express';
import { prisma } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);
import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
export default async function healthHandler(req: Request, res: Response) {
  let dbStatus = "healthy";
  let dbError = null;
  let dbLatency = 0;
  if (!prisma) {
    dbStatus = "unhealthy";
    dbError = "Prisma Client is not initialized";
  } else {
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch (e: any) {
      dbStatus = "unhealthy";
      dbError = e.message || String(e);
    }
  }
  let storageStatus = "healthy";
  let storageError = null;
  try {
    const testDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    const tempFile = path.join(testDir, '.health-test');
    fs.writeFileSync(tempFile, 'SYSBJJ_CHECK_' + Date.now());
    fs.unlinkSync(tempFile);
  } catch (e: any) {
    storageStatus = "unhealthy";
    storageError = e.message || String(e);
  }
  let blockchainStatus = "healthy";
  let blockchainError = null;
  try {
    const testHash = CryptoJS.SHA256("SYSBJJ_TEST").toString();
    if (!testHash || testHash.length !== 64) {
      throw new Error("Invalid SHA256 output length");
    }
  } catch (e: any) {
    blockchainStatus = "unhealthy";
    blockchainError = e.message || String(e);
  }
  const jwtSecretExists = !!(process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.SESSION_SECRET);
  const authStatus = {
    status: jwtSecretExists ? "ready" : "warning",
    mechanism: "JWT_BEARER",
    has_custom_secret: jwtSecretExists
  };
  const isHealthy = dbStatus === "healthy" && storageStatus === "healthy" && blockchainStatus === "healthy";
  res.status(200).json({
    success: true,
    status: isHealthy ? "OSS" : "DEGRADED",
    timestamp: new Date().toISOString(),
    diagnostics: {
      database: { status: dbStatus, latency_ms: dbLatency, error: dbError, provider: "Neon PostgreSQL" },
      prisma: { status: prisma ? "healthy" : "error", version: "Prisma 5 Enterprise Client" },
      storage: { status: storageStatus, error: storageError, writeable: storageStatus === "healthy" },
      blockchain_auditor: { status: blockchainStatus, error: blockchainError, algorithm: "SHA256" },
      auth_system: authStatus
    }
  });
}
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;
import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
export default async function healthHandler(req: Request, res: Response) {
  let dbStatus = "healthy";
  let dbError = null;
  let dbLatency = 0;
  if (!prisma) {
    dbStatus = "unhealthy";
    dbError = "Prisma Client is not initialized";
  } else {
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch (e: any) {
      dbStatus = "unhealthy";
      dbError = e.message || String(e);
    }
  }
  let storageStatus = "healthy";
  let storageError = null;
  try {
    const testDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    const tempFile = path.join(testDir, '.health-test');
    fs.writeFileSync(tempFile, 'SYSBJJ_CHECK_' + Date.now());
    fs.unlinkSync(tempFile);
  } catch (e: any) {
    storageStatus = "unhealthy";
    storageError = e.message || String(e);
  }
  let blockchainStatus = "healthy";
  let blockchainError = null;
  try {
    const testHash = CryptoJS.SHA256("SYSBJJ_TEST").toString();
    if (!testHash || testHash.length !== 64) {
      throw new Error("Invalid SHA256 output length");
    }
  } catch (e: any) {
    blockchainStatus = "unhealthy";
    blockchainError = e.message || String(e);
  }
  const jwtSecretExists = !!(process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.SESSION_SECRET);
  const authStatus = {
    status: jwtSecretExists ? "ready" : "warning",
    mechanism: "JWT_BEARER",
    has_custom_secret: jwtSecretExists
  };
  const isHealthy = dbStatus === "healthy" && storageStatus === "healthy" && blockchainStatus === "healthy";
  res.status(200).json({
    success: true,
    status: isHealthy ? "OSS" : "DEGRADED",
    timestamp: new Date().toISOString(),
    diagnostics: {
      database: { status: dbStatus, latency_ms: dbLatency, error: dbError, provider: "Neon PostgreSQL" },
      prisma: { status: prisma ? "healthy" : "error", version: "Prisma 5 Enterprise Client" },
      storage: { status: storageStatus, error: storageError, writeable: storageStatus === "healthy" },
      blockchain_auditor: { status: blockchainStatus, error: blockchainError, algorithm: "SHA256" },
      auth_system: authStatus
    }
  });
}

