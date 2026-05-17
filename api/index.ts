import express from "express";
import cors from "cors";
import { prisma } from "../src/server/prisma.js";
import healthHandler from "./health.js";
import healthDbHandler from "./health-db.js";
import healthDbRlsHandler from "./health-db-rls.js";
import biHandler from "./bi.js";
import { loginHandler, registerHandler } from "./auth.js";
import { authenticate } from "./authMiddleware.js";
import batchHandler from "./batch.js";
import { dataHandler } from "./data.js";

const app = express();

// Body parser
app.use(express.json());

// CORS config
app.use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// 🥋 [OSS SENSEI] Initialization middleware - PROTEGE TODAS AS ROTAS API
app.use((req, res, next) => {
    // Health check simples não precisa de banco
    if (req.path === "/api/health") return next();

    if (!prisma) {
        console.error(`🥋 [SERVER INIT FAIL]: Prisma is NULL. Path: ${req.path}`);
        return res.status(503).json({ 
            success: false,
            error: "O sistema de dados (Prisma) não pôde ser inicializado.",
            sensei_tip: "Sensei, verifique a DATABASE_URL nas variáveis de ambiente do Vercel.",
            timestamp: new Date().toISOString()
        });
    }
    next();
});

app.get("/api/health", (_, res) => {
  res.json({
    success: true,
    status: "OSS",
    timestamp: new Date().toISOString()
  })
})
app.post("/api/auth/login", loginHandler);
app.post("/api/auth/register", registerHandler);

// Protected Router
const protectedRouter = express.Router() as any;
protectedRouter.use(authenticate as any);

protectedRouter.get("/health-db", healthDbHandler);
protectedRouter.get("/health-db-rls", healthDbRlsHandler);
protectedRouter.get("/bi", biHandler);
protectedRouter.get("/batch", batchHandler);
protectedRouter.get("/data/:collection", dataHandler);
protectedRouter.post("/data/:collection", dataHandler);

protectedRouter.delete("/data/:collection/:id", async (req: any, res: any) => {
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
        // Simple error handling for now as utils requires specific response type
        res.status(500).json({ error: error.message });
    }
});

app.use("/api", protectedRouter);

// --- GLOBAL ERROR HANDLER (OSS SENSEI) ---
// Garante que o servidor NUNCA envie HTML em caso de erro na API
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("🥋 [SERVER ERROR]:", err);
    
    // Status code padrão 500 se não estiver definido
    const statusCode = err.status || err.statusCode || 500;
    
    res.status(statusCode).json({
        success: false,
        error: err.message || "Erro interno no tatame",
        sensei_tip: "Desculpe Sensei, o servidor tropeçou num tatame solto. Tente novamente em instantes.",
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Export for Vercel
export default app;
