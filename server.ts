import "./init-env.js"; // 🥋 OSS SENSEI: Deve ser o PRIMEIRO import
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./prisma/client.js";
import { handleApiError } from "./api/utils.js";
import healthHandler from "./api/handlers/health.js";
import healthDbHandler from "./api/handlers/health-db.js";
import healthDbRlsHandler from "./api/handlers/health-db-rls.js";
import biHandler from "./api/handlers/bi.js";
import { loginHandler, registerHandler, forgotPasswordHandler, resetPasswordHandler } from "./api/handlers/auth.js";
import { authenticate, AuthRequest } from "./api/authMiddleware.js";
import batchHandler from "./api/handlers/batch.js";
import { dataHandler } from "./api/handlers/data.js";
import { requireMaster } from "./server/middleware/requireMaster.js";
import subscriptionRouter from "./api/routes/subscription.js";
import neonStatusHandler from "./api/admin/neon-status.js";
import resetSystemMetricsHandler from "./api/admin/reset-system-metrics.js";
import systemMetricsHandler from "./api/admin/system-metrics.js";
import { safeHandler } from "./api/safeHandler.js";

// GLOBAL ERROR HANDLERS
process.on('uncaughtException', (err) => {
  console.error("🥋 OS SENSEI! UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error(reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("OS SENSEI! Iniciando servidor...");
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // 🥋 OSS SENSEI: Custom CORS Middleware for Enterprise Web Integrity
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow any localhost port, Render subdomains, Vercel subdomains, and official ones
    const isAllowed = !origin || 
                     origin.startsWith("http://localhost:") ||
                     origin.startsWith("http://127.0.0.1:") ||
                     origin.includes("ais-dev") ||
                     origin.includes("ais-pre") ||
                     origin.includes(".run.app") ||
                     origin.includes("vercel.app") ||
                     origin.includes("render.com") ||
                     origin.includes(".onrender.com") ||
                     origin.includes("sysbjj");

    if (origin && isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (origin) {
      // Safe fallback - always reflect origin to prevent 403 blocks in preview iframe containers
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Tenant-Id, Accept");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // 🥋 OSS SENSEI: Handlers Modulares (Vercel Ready)
  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  // Middleware de Log
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      // Registrar erros de API ou logs essenciais apenas em prod
      if (process.env.NODE_ENV !== "production") {
        console.log(`🥋 [API] ${req.method} ${req.path}`);
      }
    }
    next();
  });

  // API Router
  const apiRouter = express.Router();

  // 🥋 Proxy method registry on apiRouter to transparently inject safeHandler wrappers on every handler
  const originalGet = apiRouter.get.bind(apiRouter);
  const originalPost = apiRouter.post.bind(apiRouter);
  const originalPut = apiRouter.put.bind(apiRouter);
  const originalDelete = apiRouter.delete.bind(apiRouter);

  apiRouter.get = function(path: any, ...handlers: any[]): any {
    const wrapped = handlers.map((h, i) => {
      if (typeof h === "function" && i === handlers.length - 1) {
        return safeHandler(h);
      }
      return h;
    });
    return originalGet(path, ...wrapped);
  };

  apiRouter.post = function(path: any, ...handlers: any[]): any {
    const wrapped = handlers.map((h, i) => {
      if (typeof h === "function" && i === handlers.length - 1) {
        return safeHandler(h);
      }
      return h;
    });
    return originalPost(path, ...wrapped);
  };

  apiRouter.put = function(path: any, ...handlers: any[]): any {
    const wrapped = handlers.map((h, i) => {
      if (typeof h === "function" && i === handlers.length - 1) {
        return safeHandler(h);
      }
      return h;
    });
    return originalPut(path, ...wrapped);
  };

  apiRouter.delete = function(path: any, ...handlers: any[]): any {
    const wrapped = handlers.map((h, i) => {
      if (typeof h === "function" && i === handlers.length - 1) {
        return safeHandler(h);
      }
      return h;
    });
    return originalDelete(path, ...wrapped);
  };

  // Middleware para de Router (somente dev)
  if (process.env.NODE_ENV !== "production") {
    apiRouter.use((req, res, next) => {
      // console.log(`🥋 [ROUTER DEBUG] Request matching: ${req.method} ${req.path}`);
      next();
    });
  }

  // Initialization middleware for the entire router
  apiRouter.use((req, res, next) => {
    if (!prisma) {
      console.error(`🥋 [SERVER.TS INIT FAIL]: Prisma is NULL. Path: ${req.path}`);
      return res.status(503).json({ 
        success: false,
        error: "O sistema de dados (Prisma) não pôde ser inicializado.",
        sensei_tip: "Sensei, o banco de dados não respondeu ao chamado. Verifique o DATABASE_URL."
      });
    }
    next();
  });

  // Diagnostic route
  apiRouter.get("/routes", (req, res) => {
    const routes = (apiRouter.stack as any[])
      .filter(r => r.route)
      .map(r => `${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    res.json({ mounted_at: "/api", routes });
  });

  // Auth Routes
  apiRouter.post("/auth/login", loginHandler);
  apiRouter.post("/auth/register", registerHandler);
  apiRouter.post("/auth/forgot-password", forgotPasswordHandler);
  apiRouter.post("/auth/reset-password", resetPasswordHandler);

  // Protected Routes - OSS! Acesso apenas com Cinto Preto (JWT)
  apiRouter.use(authenticate as any);

  // Aplicar requireMaster em rotas sensíveis administrativas do SaaS e Governança
  apiRouter.use("/admin", requireMaster as any);
  apiRouter.get("/admin/neon-status", neonStatusHandler as any);
  apiRouter.get("/admin/system-metrics", systemMetricsHandler as any);
  apiRouter.post("/admin/reset-system-metrics", resetSystemMetricsHandler as any);
  apiRouter.use("/system-logs", requireMaster as any);
  apiRouter.use("/governance", requireMaster as any);
  apiRouter.use("/master", requireMaster as any);
  apiRouter.use("/global-dashboard", requireMaster as any);
  apiRouter.use("/audit", requireMaster as any);

  // Custom endpoint for delete-student
  apiRouter.delete("/delete-student", requireMaster as any, async (req: any, res: express.Response) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "ID do aluno é obrigatório." });
    try {
      let student;
      try {
        student = await prisma.student.findUnique({ where: { id } });
      } catch (findErr: any) {
        console.warn("⚠️ [PRISMA DETECTED P2022 FOR DELETE] Using safe name select:", findErr.message);
        try {
          student = await prisma.student.findUnique({ where: { id }, select: { name: true } });
        } catch (fallbackErr) {
          student = null;
        }
      }
      const result = await prisma.student.delete({ where: { id } });
      
      // Registrar log de exclusão
      try {
        await prisma.systemLog.create({
          data: {
            userId: req.user.id,
            timestamp: BigInt(Date.now()),
            userEmail: req.user.email,
            action: 'DELETE_STUDENT',
            details: `Aluno ${student?.name || id} foi excluído permanentemente pelo Sensei Master.`,
            category: 'Audit',
            deviceInfo: req.headers['user-agent'] || 'Desconhecido',
          }
        });
      } catch (logErr) {
        console.error("🥋 Falha ao registrar log de exclusão:", logErr);
      }

      res.json({ success: true, count: 1 });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Mount subscription routes
  apiRouter.use("/subscription", subscriptionRouter);

  // Health and Diagnostic Routes (Protected)
  apiRouter.get("/health-db", healthDbHandler as any);
  apiRouter.get("/health-db-rls", healthDbRlsHandler as any);
  apiRouter.get("/bi", biHandler as any);

  // Batch and Data Routes
  apiRouter.get("/batch", batchHandler as any);
  apiRouter.get("/data/:collection", dataHandler as any);
  apiRouter.post("/data/:collection", dataHandler as any);

  // DELETE Route
  apiRouter.delete("/data/:collection/:id", async (req: any, res: express.Response) => {
    let { collection, id } = req.params;
    if (collection === 'notifications') {
      collection = 'notification';
    }
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Proteção dupla de exclusão de alunos
    const lowerColl = collection.toLowerCase();
    if (lowerColl === 'student' || lowerColl === 'students') {
      if (req.user?.role !== 'MASTER') {
        return res.status(403).json({
          success: false,
          error: "Apenas o Sensei Master pode remover estudantes permanentemente."
        });
      }
    }

    try {
      const anyPrisma = prisma as any;
      if (anyPrisma[collection]) {
        // Get name for logging
        let studentName = id;
        if (lowerColl === 'student' || lowerColl === 'students') {
          try {
            const student = await prisma.student.findUnique({ where: { id } });
            if (student) studentName = student.name;
          } catch (e) {}
        }

        const result = await anyPrisma[collection].deleteMany({ where: { id, userId: String(userId) } });
        
        // Recalculate plan on student deletion
        if (collection === 'students' && result.count > 0) {
          import('./api/subscriptionService.js').then(m => m.updateSubscriptionPlan(String(userId)));

          // Log exclusion audit
          try {
            await prisma.systemLog.create({
              data: {
                userId: String(userId),
                timestamp: BigInt(Date.now()),
                userEmail: req.user.email,
                action: 'DELETE_STUDENT',
                details: `Aluno ${studentName} foi excluído permanentemente pelo Sensei Master.`,
                category: 'Audit',
                deviceInfo: req.headers['user-agent'] || 'Desconhecido',
              }
            });
          } catch (logErr) {
            console.error("🥋 Falha ao registrar log de exclusão:", logErr);
          }
        }
        
        res.json({ success: true, count: result.count });
      } else {
        res.status(404).json({ error: "Collection not found" });
      }
    } catch (error: any) {
      handleApiError(res, error, collection);
    }
  });

  // API 404 catch-all (inside the router!)
  apiRouter.use((req, res) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`🥋 [API 404] ${req.method} ${req.originalUrl} - Não casou em nenhuma rota do apiRouter.`);
    }
    res.status(404).json({ 
      error: `API Route not found: ${req.method} ${req.originalUrl}`,
      tip: "OSS! Verifique se o endpoint existe no server.ts e se o prefixo /api está correto."
    });
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // 🥋 API JSON FALLBACK: Garante que nenhuma rota /api ou /api/* não correspondida retorne HTML
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      error: `Endpoint API não correspondido: ${req.method} ${req.path}`,
      code: 404,
      sensei_tip: "OSS! Esse golpe desafiou nossa API. Verifique os parâmetros e o endpoint."
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("OS SENSEI! Iniciando Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("OS SENSEI! Vite pronto.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback: Use a middleware that serves index.html for non-API requests
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- GLOBAL ERROR HANDLER ---
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("🥋 [SERVER CONFIG ERROR]:", err);
    res.status(err.status || err.statusCode || 500).json({
      success: false,
      error: err.message || "Erro interno do servidor",
      timestamp: new Date().toISOString()
    });
  });

  // START LISTENING
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🥋 OSS SENSEI! Dojo Cloud ouvindo na porta ${PORT}`);
    console.log(`URL Local: http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error("OS SENSEI! ERRO FATAL NO STARTUP:", err);
});
