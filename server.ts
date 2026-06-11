import "./init-env";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GLOBAL ERROR HANDLERS
process.on('uncaughtException', (err) => {
  console.error("🥋 OS SENSEI! UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("🥋 OS SENSEI! UNHANDLED REJECTION:", reason);
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Body parser
  app.use(express.json());

  // CORS Middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    const isAllowed = !origin || 
                     origin.startsWith("http://localhost:") ||
                     origin.startsWith("http://127.0.0.1:") ||
                     origin.includes("vercel.app") ||
                     origin.includes("render.com");

    if (origin && isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (origin) {
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

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Simple auth endpoint for testing
  app.post("/api/auth/login", (req, res) => {
    res.json({ success: true, message: "Login endpoint - implementar depois" });
  });

  app.post("/api/auth/register", (req, res) => {
    res.json({ success: true, message: "Register endpoint - implementar depois" });
  });

  // API 404 handler
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Endpoint API nao encontrado: " + req.method + " " + req.path,
      code: 404
    });
  });

  // Serve static files in production
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  
  // SPA Fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("🥋 [SERVER ERROR]:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Erro interno do servidor",
      timestamp: new Date().toISOString()
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🥋 OSS SENSEI! Servidor rodando na porta " + PORT);
    console.log("URL Local: http://localhost:" + PORT);
  });
}

startServer().catch(err => {
  console.error("OS SENSEI! ERRO FATAL NO STARTUP:", err);
  process.exit(1);
});