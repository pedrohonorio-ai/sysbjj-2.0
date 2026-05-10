import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

console.log("OS SENSEI! Verificando Ambiente...");
console.log("DATABASE_URL configurada:", !!process.env.DATABASE_URL);
console.log("DIRECT_URL configurada:", !!process.env.DIRECT_URL);

if (!process.env.DATABASE_URL) {
  console.error("OS SENSEI! ALERTA CRÍTICO: DATABASE_URL não encontrada no ambiente.");
} else {
  const urlProto = process.env.DATABASE_URL.split(':')[0];
  console.log(`OS SENSEI! Protocolo detectado: ${urlProto}`);
  if (process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
    console.warn("OS SENSEI! ALERTA: A senha do banco ainda não foi configurada no .env ou nas configurações.");
  }
}

import prisma from "./prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), platform: "Supabase + Prisma + Express" });
  });

  // DB Diagnostic
  app.get("/api/test-db", async (req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL || "";
      const hasPassword = !dbUrl.includes("[YOUR-PASSWORD]");
      const startsWithProto = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

      if (!dbUrl) {
        return res.status(500).json({ status: "error", message: "DATABASE_URL está vazia ou não foi definida." });
      }

      if (!startsWithProto) {
        return res.status(500).json({ status: "error", message: "DATABASE_URL deve começar com postgresql:// ou postgres://" });
      }

      await prisma.$connect();
      res.json({ status: "connected", message: "OSS! O sistema está online e conectado ao PostgreSQL (Supabase)." });
    } catch (error: any) {
      console.error("Erro de conexão DB:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Falha ao conectar no banco.",
        troubleshooting: [
          "Verifique se trocou [YOUR-PASSWORD] pela senha real.",
          "Confirme se a variável DATABASE_URL está no menu Settings > Secrets.",
          "Verifique se o IP do servidor está liberado no Supabase (ou use o Pooler se estiver usando Vercel/Cloud Run)."
        ],
        error: error.message 
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  // Generic Get Route for User Collections
  app.get("/api/data/:collection", async (req, res) => {
    const { userId } = req.query;
    const { collection } = req.params;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      let data;
      const uid = String(userId);
      switch(collection) {
        case 'students': data = await prisma.student.findMany({ where: { userId: uid }, orderBy: { joinedAt: 'desc' } }); break;
        case 'payments': data = await prisma.payment.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
        case 'schedules': data = await prisma.classSchedule.findMany({ where: { userId: uid } }); break;
        case 'logs': data = await prisma.systemLog.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 50 }); break;
        case 'ledger': data = await prisma.transactionLedger.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
        case 'receipts': data = await prisma.paymentReceipt.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' } }); break;
        case 'extra_revenue': data = await prisma.extraRevenue.findMany({ where: { userId: uid } }); break;
        case 'lesson_plans': data = await prisma.lessonPlan.findMany({ where: { userId: uid } }); break;
        case 'techniques': data = await prisma.libraryTechnique.findMany({ where: { userId: uid } }); break;
        case 'products': data = await prisma.product.findMany({ where: { userId: uid } }); break;
        case 'plans': data = await prisma.plan.findMany({ where: { userId: uid } }); break;
        case 'orders': data = await prisma.kimonoOrder.findMany({ where: { userId: uid } }); break;
        case 'profile': data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); break;
        default: return res.status(404).json({ error: "Collection not found" });
      }
      
      // JSON BigInt handling applied to GET as well to prevent "Do not know how to serialize a BigInt"
      res.json(JSON.parse(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
    } catch (error: any) {
      console.error(`OS SENSEI! Erro no GET /api/data/${collection}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generic Upsert Route
  app.post("/api/data/:collection", async (req, res) => {
    const { collection } = req.params;
    const body = req.body;
    const { userId, ...data } = body;

    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      let result;
      const uid = String(userId);
      
      switch(collection) {
        case 'students':
          result = await prisma.student.upsert({
            where: { id: data.id || 'new' },
            update: { ...data, userId: uid },
            create: { ...data, id: data.id || undefined, userId: uid }
          });
          break;
        case 'payments':
          result = await prisma.payment.create({ data: { ...data, userId: uid } });
          break;
        case 'logs':
          result = await prisma.systemLog.create({ data: { ...data, userId: uid, timestamp: BigInt(data.timestamp || Date.now()) } });
          break;
        case 'ledger':
          result = await prisma.transactionLedger.create({ data: { ...data, userId: uid, timestamp: BigInt(data.timestamp || Date.now()) } });
          break;
        case 'receipts':
          result = await prisma.paymentReceipt.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid, timestamp: BigInt(data.timestamp || Date.now()) },
            update: { ...data, userId: uid }
          });
          break;
        case 'schedules':
          result = await prisma.classSchedule.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'extra_revenue':
          result = await prisma.extraRevenue.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'lesson_plans':
          result = await prisma.lessonPlan.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'techniques':
          result = await prisma.libraryTechnique.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'products':
          result = await prisma.product.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'plans':
          result = await prisma.plan.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'orders':
          result = await prisma.kimonoOrder.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'presence':
          result = await prisma.presence.upsert({
            where: { email_deviceId: { email: data.email, deviceId: data.deviceId } },
            create: { ...data, userId: uid, lastSeen: BigInt(data.lastSeen || Date.now()) },
            update: { ...data, userId: uid, lastSeen: BigInt(data.lastSeen || Date.now()) }
          });
          break;
        case 'profile':
          result = await prisma.professorProfile.upsert({
            where: { userId: uid },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        default: return res.status(404).json({ error: "Collection not supported for POST" });
      }
      
      // JSON BigInt handling
      res.json(JSON.parse(JSON.stringify(result, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
    } catch (error: any) {
      console.error(`Error in POST /api/data/${collection}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Route
  app.delete("/api/data/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      const uid = String(userId);
      let result;
      switch(collection) {
        case 'students': result = await prisma.student.deleteMany({ where: { id, userId: uid } }); break;
        case 'payments': result = await prisma.payment.deleteMany({ where: { id, userId: uid } }); break;
        case 'schedules': result = await prisma.classSchedule.deleteMany({ where: { id, userId: uid } }); break;
        case 'extra_revenue': result = await prisma.extraRevenue.deleteMany({ where: { id, userId: uid } }); break;
        case 'lesson_plans': result = await prisma.lessonPlan.deleteMany({ where: { id, userId: uid } }); break;
        case 'techniques': result = await prisma.libraryTechnique.deleteMany({ where: { id, userId: uid } }); break;
        case 'products': result = await prisma.product.deleteMany({ where: { id, userId: uid } }); break;
        case 'plans': result = await prisma.plan.deleteMany({ where: { id, userId: uid } }); break;
        case 'orders': result = await prisma.kimonoOrder.deleteMany({ where: { id, userId: uid } }); break;
        default: return res.status(404).json({ error: "Collection not supported for DELETE" });
      }
      res.json({ success: true, count: result.count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sensei! Server running on http://localhost:${PORT}`);
  });
}

startServer();
