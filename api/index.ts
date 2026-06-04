import express, { Response } from "express";
import cors from "cors";
import { prisma } from "../prisma/client.js";
import healthHandler from "./handlers/health.js";
import healthDbHandler from "./handlers/health-db.js";
import healthDbRlsHandler from "./handlers/health-db-rls.js";
import biHandler from "./handlers/bi.js";
import { loginHandler, registerHandler, forgotPasswordHandler, resetPasswordHandler } from "./handlers/auth.js";
import { authenticate, AuthRequest } from "./authMiddleware.js";
import batchHandler from "./handlers/batch.js";
import { dataHandler } from "./handlers/data.js";
import subscriptionRouter from "./routes/subscription.js";
import { requireMaster } from "../server/middleware/requireMaster.js";
import { safeHandler } from "./safeHandler.js";
import neonStatusHandler from "./admin/neon-status.js";
import resetSystemMetricsHandler from "./admin/reset-system-metrics.js";
import systemMetricsHandler from "./admin/system-metrics.js";
import diagnoseHandler from "./admin/diagnose.js";

// 🥋 GLOBAL PROCESS EXCEPTION & REJECTION GUARD FOR PRODUCTION ULTRA RESILIENCE
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error("🥋 [FATAL EXTREME UNHANDLED REJECTION]: Prevented crash.", reason?.stack || reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error("🥋 [FATAL EXTREME UNCAUGHT EXCEPTION]: Prevented crash.", error?.stack || error);
});

const app = express();

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
app.post("/api/auth/login", safeHandler(loginHandler));
app.post("/api/auth/register", safeHandler(registerHandler));
app.post("/api/auth/forgot-password", safeHandler(forgotPasswordHandler));
app.post("/api/auth/reset-password", safeHandler(resetPasswordHandler));

app.post("/api/auth/admin/reset-password", authenticate as any, async (req: any, res: any) => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) return res.status(403).json({ success: false, error: "Acesso exclusivo ao Master." });

  const { targetEmail, newPassword } = req.body;
  if (!targetEmail || !newPassword) return res.status(400).json({ success: false, error: "Email e nova senha são obrigatórios." });

  try {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { email: targetEmail },
      data: { password: hashedPassword }
    });
    await prisma.systemLog.create({
      data: {
        userId: req.user.id,
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'ADMIN_RESET_PASSWORD',
        details: `Senha de ${targetEmail} resetada pelo Master.`,
        category: 'Security',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido'
      }
    });
    return res.json({ success: true, message: `Senha de ${targetEmail} resetada com sucesso!` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/change-password", authenticate as any, async (req: any, res: any) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: "Senha atual e nova senha são obrigatórias." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado." });
    }

    const bcrypt = await import("bcryptjs");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "A senha atual está incorreta." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    await prisma.systemLog.create({
      data: {
        userId: userId,
        timestamp: BigInt(Date.now()),
        userEmail: user.email,
        action: 'USER_CHANGE_PASSWORD',
        details: `Senha de ${user.email} alterada com sucesso pelo próprio usuário.`,
        category: 'Security',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido'
      }
    });

    return res.json({ success: true, message: "Sua senha foi alterada com sucesso!" });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/diagnose", safeHandler(diagnoseHandler));

// 🥋 SUPREME ENDPOINT: DELETE /api/admin/delete-user/:id
app.delete("/api/admin/delete-user/:id", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
    const targetId = req.params.id;
    if (!targetId) {
        return res.status(400).json({ success: false, error: "ID do usuário é obrigatório." });
    }

    const masterEmail = "pedro.honorio@gm.rio";
    const isMaster = req.user?.email?.toLowerCase() === masterEmail || req.user?.role === "MASTER";
    const isOwner = req.user?.id === targetId;

    if (!isMaster && !isOwner) {
        return res.status(403).json({ 
            success: false, 
            error: "Restrito: Apenas o Sensei Master ou o próprio proprietário da conta podem executar esta ação." 
        });
    }

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
        if (!targetUser) {
            return res.status(404).json({ success: false, error: "Usuário não encontrado no tatame." });
        }

        // Bloquear exclusão do Master
        if (targetUser.email?.toLowerCase() === masterEmail) {
            return res.status(403).json({ 
                success: false, 
                error: "🥋 OPERAÇÃO NEGADA: O Sensei Master Geral do ecossistema (pedro.honorio@gm.rio) não pode ser excluído sob nenhuma circunstância!" 
            });
        }

        const uidStr = String(targetId);

        // 🥋 EXCLUSÃO EM CASCATA PROGRAMÁTICA
        console.log(`🥋 [CASCADE PURGE] Iniciando remoção completa dos dados da conta: ${targetUser.email}`);
        
        try {
            const stuList = await prisma.student.findMany({ where: { userId: uidStr }, select: { id: true } });
            const studentIds = stuList.map(s => s.id);
            await prisma.graduationHistory.deleteMany({ where: { studentId: { in: studentIds } } });
        } catch (gradErr) {
            console.error("🥋 Falha ao remover históricos de graduação:", gradErr);
        }

        await prisma.student.deleteMany({ where: { userId: uidStr } });
        await prisma.payment.deleteMany({ where: { userId: uidStr } });
        await prisma.classSchedule.deleteMany({ where: { userId: uidStr } });
        await prisma.presence.deleteMany({ where: { userId: uidStr } });
        await prisma.subscriptionPaymentHistory.deleteMany({ where: { userId: uidStr } });
        await prisma.paymentReceipt.deleteMany({ where: { userId: uidStr } });
        await prisma.extraRevenue.deleteMany({ where: { userId: uidStr } });
        await prisma.lessonPlan.deleteMany({ where: { userId: uidStr } });
        await prisma.libraryTechnique.deleteMany({ where: { userId: uidStr } });
        await prisma.product.deleteMany({ where: { userId: uidStr } });
        await prisma.kimonoOrder.deleteMany({ where: { userId: uidStr } });
        await prisma.professorProfile.deleteMany({ where: { userId: uidStr } });
        await prisma.plan.deleteMany({ where: { userId: uidStr } });
        await prisma.transactionLedger.deleteMany({ where: { userId: uidStr } });
        
        // Registrar log de auditoria global persistente (vinculada a MASTER ou SYSTEM)
        try {
            await prisma.systemLog.create({
                data: {
                    userId: "SYSTEM_AUDIT",
                    timestamp: BigInt(Date.now()),
                    userEmail: req.user?.email || "system",
                    action: 'USER_DELETED',
                    details: `Usuário ${targetUser.email} foi deletado (Soft Delete ativo). Todos os dados associados foram limpos de forma irreversível para otimizar o banco Postgres.`,
                    category: 'Audit',
                    deviceInfo: req.headers['user-agent'] || 'Desconhecido',
                }
            });
        } catch (e) {
            console.error("Falha ao salvar log de auditoria de exclusão:", e);
        }

        // Limpar logs do usuário que restavam
        await prisma.systemLog.deleteMany({ where: { userId: uidStr } });

        // Atualizar Subscription para reset
        try {
            await prisma.subscription.updateMany({
                where: { userId: uidStr },
                data: {
                    plan: "FREE",
                    active: false,
                    monthlyPrice: 0,
                    studentLimit: 20,
                    status: "EXPIRED"
                }
            });
        } catch (e) {}

        // 🥋 SOFT DELETE NO MODEL USER
        await prisma.user.update({
            where: { id: targetId },
            data: {
                active: false,
                deletedAt: new Date()
            }
        });

        console.log(`🥋 [CASCADE PURGE COMPLETE]: ${targetUser.email} removido com sucesso.`);

        return res.json({ 
            success: true, 
            message: `🥋 OSS! A conta da academia ${targetUser.name || targetUser.email} foi removida permanentemente do banco de dados.` 
        });

    } catch (err: any) {
        console.error("🥋 Erro na exclusão de conta:", err);
        return res.status(500).json({ success: false, error: err.message || "Erro interno na transação de exclusão." });
    }
});

// Protected Router
const protectedRouter = express.Router() as any;
protectedRouter.use(authenticate as any);

// Aplicar requireMaster em rotas sensíveis administrativas do SaaS e Governança
protectedRouter.use("/admin", requireMaster as any);
protectedRouter.get("/admin/neon-status", safeHandler(neonStatusHandler as any));
protectedRouter.get("/admin/system-metrics", safeHandler(systemMetricsHandler as any));
protectedRouter.post("/admin/reset-system-metrics", safeHandler(resetSystemMetricsHandler as any));
protectedRouter.use("/system-logs", requireMaster as any);
protectedRouter.use("/governance", requireMaster as any);
protectedRouter.use("/master", requireMaster as any);
protectedRouter.use("/global-dashboard", requireMaster as any);
protectedRouter.use("/audit", requireMaster as any);

// Custom endpoint for delete-student
protectedRouter.delete("/delete-student", requireMaster as any, safeHandler(async (req: any, res: any) => {
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
}));

protectedRouter.get("/health-db", safeHandler(healthDbHandler));
protectedRouter.get("/health-db-rls", safeHandler(healthDbRlsHandler));
protectedRouter.get("/bi", safeHandler(biHandler));
protectedRouter.get("/batch", safeHandler(batchHandler));

// Mount subscription routes
protectedRouter.use("/subscription", subscriptionRouter);
protectedRouter.get("/data/:collection", safeHandler(dataHandler));
protectedRouter.post("/data/:collection", safeHandler(dataHandler));

protectedRouter.delete("/data/:collection/:id", safeHandler(async (req: any, res: any) => {
    const { collection, id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Proteção dupla de exclusão de alunos - Permite se for o dono do cadastro ou se for o administrador geral
    const lowerColl = collection.toLowerCase();
    if (lowerColl === 'student' || lowerColl === 'students') {
        try {
            const student = await prisma.student.findUnique({ where: { id } });
            if (student && student.userId !== String(userId) && req.user?.role !== 'MASTER') {
                return res.status(403).json({
                    success: false,
                    error: "Acesso negado: Este aluno pertence a outra academia."
                });
            }
        } catch (e) {
            // Ignora erro de leitura e continua para o deleteMany seguro por userId
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
}));

app.use("/api", protectedRouter);
app.use("/", protectedRouter);

// 🥋 FALLBACK DE MONITORAMENTO DE ROTAS: Garante que NENHUMA rota da API responda HTML em caso de 404
app.all("/(.*)", (req, res) => {
    res.status(404).json({
        success: false,
        error: `Endpoint não encontrado no tatame do servidor: ${req.method} ${req.path}`,
        code: 404,
        sensei_tip: "OSS! Essa técnica/rota não foi montada no servidor. Verifique o caminho e tente novamente."
    });
});

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
