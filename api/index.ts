import express, { Response } from "express";
import cors from "cors";
import { prisma } from "../prisma/client.js";
import healthHandler from "./health.js";
import healthDbHandler from "./health-db.js";
import healthDbRlsHandler from "./health-db-rls.js";
import biHandler from "./bi.js";
import { loginHandler, registerHandler } from "./auth.js";
import { authenticate, AuthRequest } from "./authMiddleware.js";
import batchHandler from "./batch.js";
import { dataHandler } from "./data.js";
import subscriptionRouter from "./routes/subscription.js";
import { requireMaster } from "../server/middleware/requireMaster.js";
import neonStatusHandler from "./admin/neon-status.js";
import resetSystemMetricsHandler from "./admin/reset-system-metrics.js";
import systemMetricsHandler from "./admin/system-metrics.js";

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

// Aplicar requireMaster em rotas sensíveis administrativas do SaaS e Governança
protectedRouter.use("/admin", requireMaster as any);
protectedRouter.get("/admin/neon-status", neonStatusHandler as any);
protectedRouter.get("/admin/system-metrics", systemMetricsHandler as any);
protectedRouter.post("/admin/reset-system-metrics", resetSystemMetricsHandler as any);
protectedRouter.use("/system-logs", requireMaster as any);
protectedRouter.use("/governance", requireMaster as any);
protectedRouter.use("/master", requireMaster as any);
protectedRouter.use("/global-dashboard", requireMaster as any);
protectedRouter.use("/audit", requireMaster as any);

// Custom endpoint for delete-student
protectedRouter.delete("/delete-student", requireMaster as any, async (req: any, res: any) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "ID do aluno é obrigatório." });
    try {
        const student = await prisma.student.findUnique({ where: { id } });
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

protectedRouter.get("/health-db", healthDbHandler);
protectedRouter.get("/health-db-rls", healthDbRlsHandler);
protectedRouter.get("/bi", biHandler);
protectedRouter.get("/batch", batchHandler);

// Mount subscription routes
protectedRouter.use("/subscription", subscriptionRouter);
protectedRouter.get("/data/:collection", dataHandler);
protectedRouter.post("/data/:collection", dataHandler);

protectedRouter.delete("/data/:collection/:id", async (req: any, res: any) => {
    const { collection, id } = req.params;
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
            // Get student info for log before delete if it represents student
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
                import('./subscriptionService.js').then(m => m.updateSubscriptionPlan(String(userId)));
                
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
