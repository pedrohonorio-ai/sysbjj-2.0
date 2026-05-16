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
import batchHandler from "./api/batch";
import { dataHandler, serializeData } from "./api/data";

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

  // Helper para serialização segura de BigInt
  const serializeData = (data: any) => {
    return JSON.parse(JSON.stringify(data, (k, v) => 
      typeof v === 'bigint' 
        ? (Number(v) <= Number.MAX_SAFE_INTEGER ? Number(v) : v.toString()) 
        : v
    ));
  };

  // 🥋 Diagnostic for debugging
  const dbUrl = process.env.DATABASE_URL || "";
  const masked = dbUrl.replace(/:([^@]+)@/, ':****@');
  console.log('🥋 [SENSEI STATUS] DATABASE_URL Final:', masked);
  
  // 🥋 handleApiError removido (usando src/api/utils.ts)

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
  app.get("/api/health-db", healthDbHandler);
  app.get("/api/health-db-rls", healthDbRlsHandler);
  app.get("/api/bi", biHandler);

  // 🥋 OSS SENSEI: Middleware de Log para Depuração de Rotas
  app.use((req, res, next) => {
    // Log apenas para API e erros críticos
    if (req.path.startsWith("/api")) {
      console.log(`🥋 [API] ${req.method} ${req.path}`);
    } else if (process.env.NODE_ENV !== "production") {
       // Log de ativos apenas em dev
       if (!req.path.includes("node_modules") && !req.path.includes("@vite")) {
         console.log(`🥋 [DEV ASSET] ${req.method} ${req.path}`);
       }
    }
    next();
  });

  // API Router
  const apiRouter = express.Router();

  // Middleware para garantir que o Router está operando corretamente
  apiRouter.use((req, res, next) => {
    console.log(`🥋 [ROUTER DEBUG] Request matching: ${req.method} ${req.path}`);
    next();
  });

  // Initialization middleware for the entire router
  apiRouter.use((req, res, next) => {
    if (!prisma) {
      // Except for health checks
      const exempt = ["/health", "/health-db", "/test-db"].includes(req.path);
      if (exempt) return next();
      
      return res.status(503).json({ error: "O sistema está inicializando. Por favor, aguarde alguns segundos." });
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

  // Health and Diagnostic Routes
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), platform: "Neon + Prisma + Express" });
  });

  // Auth Routes
  apiRouter.post("/auth/login", loginHandler);
  apiRouter.post("/auth/register", registerHandler);

  // Legacy diagnostic route for backward compatibility with some components
  apiRouter.get("/test-db", async (req, res) => {
    try {
      if (!prisma) return res.status(503).json({ status: "initializing" });
      await prisma.$connect();
      res.json({ status: "connected", message: "OSS! Sistema online." });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Batch and Data Routes
  apiRouter.get("/batch", batchHandler);
  apiRouter.get("/data/:collection", dataHandler);
  apiRouter.post("/data/:collection", dataHandler);

  // DELETE Route
  apiRouter.delete("/data/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

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
    console.warn(`🥋 [API 404] ${req.method} ${req.originalUrl} - Não casou em nenhuma rota do apiRouter.`);
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
