import express from "express";
import cors from "cors";
import { prisma } from "../prisma/client";
import healthHandler from "./health";
import healthDbHandler from "./health-db";
import healthDbRlsHandler from "./health-db-rls";
import biHandler from "./bi";
import { loginHandler, registerHandler } from "./auth";
import { authenticate } from "./authMiddleware";
import batchHandler from "./batch";
import { dataHandler, serializeData } from "./data";

const app = express();

// Body parser
app.use(express.json());

// CORS config
app.use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Public Routes
app.get("/api/health", healthHandler);
app.post("/api/auth/login", loginHandler);
app.post("/api/auth/register", registerHandler);

// Initialization middleware
app.use((req, res, next) => {
    if (!prisma) {
        return res.status(503).json({ error: "O sistema está inicializando. Por favor, aguarde alguns segundos." });
    }
    next();
});

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
