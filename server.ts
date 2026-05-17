import "./init-env"; // 🥋 OSS SENSEI: Deve ser o PRIMEIRO import
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./prisma/client";
import { handleApiError } from "./api/utils";
import healthHandler from "./api/health";
import healthDbHandler from "./api/health-db";
import healthDbRlsHandler from "./api/health-db-rls";
import biHandler from "./api/bi";
import { loginHandler, registerHandler } from "./api/auth";
import { authenticate, AuthRequest } from "./api/authMiddleware";
import batchHandler from "./api/batch";
import { dataHandler } from "./api/data";

// GLOBAL ERROR HANDLERS
process.on('uncaughtException', (err) => {
  console.error("🥋 OS SENSEI! UNCAUGHT EXCEPTION:", err);
});

process.on('unhandledRejection', (reason) => {
  console.error("🥋 OS SENSEI! UNHANDLED REJECTION:", reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("OS SENSEI! Iniciando servidor...");
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // 🥋 OSS SENSEI: Configuração de CORS para Enterprise
  app.use(cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (como ferramentas de teste ou server-to-server)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://sysbjj-2-0.vercel.app",
        "https://sysbjj.online"
      ];

      const isAllowed = !origin || 
                       allowedOrigins.includes(origin) || 
                       origin.includes("ais-dev") ||
                       origin.includes("ais-pre") ||
                       origin.includes(".run.app") ||
                       origin.includes(".vercel.app") ||
                       origin.includes("onrender.com");

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`🥋 [CORS BLOCKED] Origin: ${origin}`);
        callback(null, false); // No ambiente enterprise, somos restritos, mas flexíveis se necessário
      }
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }));

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

  // Protected Routes - OSS! Acesso apenas com Cinto Preto (JWT)
  apiRouter.use(authenticate as any);

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
    const { collection, id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const anyPrisma = prisma as any;
      if (anyPrisma[collection]) {
        const result = await anyPrisma[collection].deleteMany({ where: { id, userId: String(userId) } });
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
