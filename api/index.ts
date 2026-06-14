import express, { Response } from "express";
import cors from "cors";
import { prisma } from "../prisma/client.js";
import healthHandler from "../backend/handlers/health.js";
import healthDbHandler from "../backend/handlers/health-db.js";
import healthDbRlsHandler from "../backend/handlers/health-db-rls.js";
import biHandler from "../backend/handlers/bi.js";
import { loginHandler, registerHandler, forgotPasswordHandler, resetPasswordHandler, studentLoginHandler } from "../backend/handlers/auth.js";
import { authenticate, AuthRequest } from "../backend/authMiddleware.js";
import batchHandler from "../backend/handlers/batch.js";
import { dataHandler } from "../backend/handlers/data.js";
import subscriptionRouter from "../backend/routes/subscription.js";
import { requireMaster } from "../server/middleware/requireMaster.js";
import { safeHandler } from "../backend/safeHandler.js";
import { updateSubscriptionPlan } from "../backend/subscriptionService.js";
import neonStatusHandler from "../backend/admin/neon-status.js";
import resetSystemMetricsHandler from "../backend/admin/reset-system-metrics.js";
import systemMetricsHandler from "../backend/admin/system-metrics.js";
import diagnoseHandler from "../backend/admin/diagnose.js";

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error("🥋 [FATAL EXTREME UNHANDLED REJECTION]: Prevented crash.", reason?.stack || reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error("🥋 [FATAL EXTREME UNCAUGHT EXCEPTION]: Prevented crash.", error?.stack || error);
});

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    const origin = req.headers.origin;
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

app.use((req, res, next) => {
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
  res.json({ success: true, status: "OSS", timestamp: new Date().toISOString() })
})

app.post("/api/auth/login", safeHandler(loginHandler));
app.post("/api/auth/register", safeHandler(registerHandler));
app.post("/api/auth/forgot-password", safeHandler(forgotPasswordHandler));
app.post("/api/auth/reset-password", safeHandler(resetPasswordHandler));
app.post("/api/auth/student-login", safeHandler(studentLoginHandler));

app.post("/api/auth/admin/reset-password", authenticate as any, async (req: any, res: any) => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) return res.status(403).json({ success: false, error: "Acesso exclusivo ao Master." });

  const { targetEmail, newPassword } = req.body;
  if (!targetEmail || !newPassword) return res.status(400).json({ success: false, error: "Email e nova senha são obrigatórios." });

  try {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email: targetEmail }, data: { password: hashedPassword } });
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

  if (!userId) return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  if (!currentPassword || !newPassword) return res.status(400).json({ success: false, error: "Senha atual e nova senha são obrigatórias." });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: "Usuário não encontrado." });

    const bcrypt = await import("bcryptjs");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: "A senha atual está incorreta." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
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

app.delete("/api/admin/delete-user/:id", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
    const targetId = req.params.id;
    if (!targetId) return res.status(400).json({ success: false, error: "ID do usuário é obrigatório." });

    const masterEmail = "pedro.honorio@gm.rio";
    const isMaster = req.user?.email?.toLowerCase() === masterEmail || req.user?.role === "MASTER";
    const isOwner = req.user?.id === targetId;

    if (!isMaster && !isOwner) {
        return res.status(403).json({ success: false, error: "Restrito: Apenas o Sensei Master ou o próprio proprietário da conta podem executar esta ação." });
    }

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
        if (!targetUser) return res.status(404).json({ success: false, error: "Usuário não encontrado no tatame." });

        if (targetUser.email?.toLowerCase() === masterEmail) {
            return res.status(403).json({ success: false, error: "🥋 OPERAÇÃO NEGADA: O Sensei Master não pode ser excluído!" });
        }

        const uidStr = String(targetId);
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

        try {
            await prisma.systemLog.create({
                data: {
                    userId: "SYSTEM_AUDIT",
                    timestamp: BigInt(Date.now()),
                    userEmail: req.user?.email || "system",
                    action: 'USER_DELETED',
                    details: `Usuário ${targetUser.email} deletado.`,
                    category: 'Audit',
                    deviceInfo: req.headers['user-agent'] || 'Desconhecido',
                }
            });
        } catch (e) {}

        await prisma.systemLog.deleteMany({ where: { userId: uidStr } });

        try {
            await prisma.subscription.updateMany({
                where: { userId: uidStr },
                data: { plan: "FREE", active: false, monthlyPrice: 0, studentLimit: 20, status: "EXPIRED" }
            });
        } catch (e) {}

        await prisma.user.update({ where: { id: targetId }, data: { active: false, deletedAt: new Date() } });

        return res.json({ success: true, message: `🥋 OSS! A conta ${targetUser.name || targetUser.email} foi removida.` });

    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message || "Erro interno na transação de exclusão." });
    }
});

const protectedRouter = express.Router() as any;
protectedRouter.use(authenticate as any);

protectedRouter.use("/admin", requireMaster as any);
protectedRouter.get("/admin/neon-status", safeHandler(neonStatusHandler as any));
protectedRouter.get("/admin/system-metrics", safeHandler(systemMetricsHandler as any));
protectedRouter.post("/admin/reset-system-metrics", safeHandler(resetSystemMetricsHandler as any));
protectedRouter.use("/system-logs", requireMaster as any);
protectedRouter.use("/governance", requireMaster as any);
protectedRouter.use("/master", requireMaster as any);
protectedRouter.use("/global-dashboard", requireMaster as any);
protectedRouter.use("/audit", requireMaster as any);

protectedRouter.delete("/delete-student", requireMaster as any, safeHandler(async (req: any, res: any) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "ID do aluno é obrigatório." });
    try {
        let student;
        try {
            student = await prisma.student.findUnique({ where: { id } });
        } catch (findErr: any) {
            try {
                student = await prisma.student.findUnique({ where: { id }, select: { name: true } });
            } catch (fallbackErr) {
                student = null;
            }
        }
        await prisma.student.delete({ where: { id } });
        try {
            await prisma.systemLog.create({
                data: {
                    userId: req.user.id,
                    timestamp: BigInt(Date.now()),
                    userEmail: req.user.email,
                    action: 'DELETE_STUDENT',
                    details: `Aluno ${student?.name || id} excluído pelo Sensei Master.`,
                    category: 'Audit',
                    deviceInfo: req.headers['user-agent'] || 'Desconhecido',
                }
            });
        } catch (logErr) {}
        res.json({ success: true, count: 1 });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
}));

protectedRouter.get("/health-db", safeHandler(healthDbHandler));
protectedRouter.get("/health-db-rls", safeHandler(healthDbRlsHandler));
protectedRouter.get("/bi", safeHandler(biHandler));
protectedRouter.get("/batch", safeHandler(batchHandler));

protectedRouter.use("/subscription", subscriptionRouter);
protectedRouter.get("/data/:collection", safeHandler(dataHandler));
protectedRouter.post("/data/:collection", safeHandler(dataHandler));

protectedRouter.delete("/data/:collection/:id", safeHandler(async (req: any, res: any) => {
    const { collection, id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const lowerColl = collection.toLowerCase();
    if (lowerColl === 'student' || lowerColl === 'students') {
        try {
            const student = await prisma.student.findUnique({ where: { id } });
            if (student && student.userId !== String(userId) && req.user?.role !== 'MASTER') {
                return res.status(403).json({ success: false, error: "Acesso negado: Este aluno pertence a outra academia." });
            }
        } catch (e) {}
    }

    try {
        const getPrismaModelName = (coll: string): string => {
            const c = coll.toLowerCase();
            if (c === 'students' || c === 'student') return 'student';
            if (c === 'payments' || c === 'payment') return 'payment';
            if (c === 'schedules' || c === 'schedule') return 'classSchedule';
            if (c === 'logs' || c === 'log') return 'systemLog';
            if (c === 'profile' || c === 'profiles') return 'professorProfile';
            if (c === 'notification' || c === 'notifications') return 'notification';
            if (c === 'presence' || c === 'presences') return 'presence';
            if (c === 'receipts' || c === 'receipt') return 'paymentReceipt';
            if (c === 'ledger') return 'transactionLedger';
            if (c === 'extra_revenue') return 'extraRevenue';
            if (c === 'orders' || c === 'order') return 'kimonoOrder';
            if (c === 'lesson_plans' || c === 'lesson_plan') return 'lessonPlan';
            if (c === 'techniques' || c === 'technique') return 'libraryTechnique';
            if (c === 'products' || c === 'product') return 'product';
            if (c === 'plans' || c === 'plan') return 'plan';
            if (c === 'graduationhistory' || c === 'graduation_history' || c === 'graduationhistoryrecords') return 'graduationHistory';
            return c;
        };

        const modelName = getPrismaModelName(collection);
        const anyPrisma = prisma as any;
        if (anyPrisma[modelName]) {
            let studentName = id;
            if (lowerColl === 'student' || lowerColl === 'students') {
                try {
                    const student = await prisma.student.findUnique({ where: { id } });
                    if (student) studentName = student.name;
                } catch (e) {}
            }

            const result = await anyPrisma[modelName].deleteMany({ where: { id, userId: String(userId) } });

            if ((lowerColl === 'student' || lowerColl === 'students') && result.count > 0) {
                updateSubscriptionPlan(String(userId));
                try {
                    await prisma.systemLog.create({
                        data: {
                            userId: String(userId),
                            timestamp: BigInt(Date.now()),
                            userEmail: req.user.email,
                            action: 'DELETE_STUDENT',
                            details: `Aluno ${studentName} excluído.`,
                            category: 'Audit',
                            deviceInfo: req.headers['user-agent'] || 'Desconhecido',
                        }
                    });
                } catch (logErr) {}
            }

            res.json({ success: true, count: result.count });
        } else {
            res.status(404).json({ error: "Collection not found: " + collection });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}));

app.use("/api", protectedRouter);
app.use("/", protectedRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Endpoint não encontrado: ${req.method} ${req.path}`,
        code: 404,
        sensei_tip: "OSS! Essa rota não foi montada no servidor."
    });
});

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("🥋 [SERVER ERROR]:", err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || "Erro interno no tatame",
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

export default app;
