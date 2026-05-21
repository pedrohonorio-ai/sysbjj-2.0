import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../authMiddleware.js";
import { prisma } from "../../prisma/client.js";

const router = Router();

// Endpoint: GET /api/subscription/current
router.get("/current", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    let sub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    const currentStudents = await prisma.student.count({
      where: { userId: String(userId) }
    });

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          userId: String(userId),
          plan: "FREE",
          studentLimit: 20,
          maxStudents: 20,
          monthlyPrice: 0,
          paymentStatus: "ACTIVE",
          active: true
        }
      });
    }

    const limitVal = sub.studentLimit || sub.maxStudents || 20;
    const usagePercent = Math.min(100, Math.round((currentStudents / limitVal) * 100));

    // Dynamic next billing & last payment calculations based on creation/updated values
    const startedAt = sub.startedAt || sub.createdAt;
    const expiresAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nextBillingDate = expiresAt;

    const responseData = {
      id: sub.id,
      userId: sub.userId,
      plan: sub.plan,
      active: sub.active,
      status: sub.active ? "Active" : "Suspended",
      studentLimit: limitVal, // Support limit
      maxStudents: limitVal,
      currentStudents,
      monthlyPrice: sub.monthlyPrice,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt,
      lastPaymentDate: sub.updatedAt.toISOString(),
      nextBillingDate: nextBillingDate,
      paymentStatus: sub.paymentStatus || "ACTIVE",
      pixKey: sub.pixKey || "pedro.honorio@gm.rio",
      pixHolder: sub.pixHolder || "SYSBJJ 2.0 Tecnologia Ltda",
      pixCity: sub.pixCity || "Rio de Janeiro",
      autoRenew: true,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      usagePercent,
      canAddStudents: currentStudents < limitVal
    };

    return res.json({
      success: true,
      plan: responseData,
      subscription: responseData
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING CURRENT SUBSCRIPTION (FALLBACK APPLIED):", error);
    const mockResponse = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: true,
      status: "Active",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastPaymentDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentStatus: "Paid",
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true,
      isFallback: true
    };
    return res.json({
      success: true,
      plan: mockResponse,
      subscription: mockResponse
    });
  }
});

// Endpoint: POST /api/subscription/upgrade
router.post("/upgrade", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { plan } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, error: "Plano é obrigatório." });
  }

  let studentLimit = 20;
  let monthlyPrice = 0;
  if (plan === "BRONZE") { studentLimit = 50; monthlyPrice = 20; }
  else if (plan === "SILVER") { studentLimit = 80; monthlyPrice = 30; }
  else if (plan === "BLACK_BELT" || plan === "BLACK BELT") { studentLimit = 999999; monthlyPrice = 50; }
  else if (plan === "FREE") { studentLimit = 20; monthlyPrice = 0; }
  else {
    return res.status(400).json({ success: false, error: "Plano inválido." });
  }

  try {
    const PIX_KEY = "pedro.honorio@gm.rio";
    const PIX_HOLDER = "SYSBJJ 2.0 Tecnologia Ltda";
    const PIX_CITY = "Rio de Janeiro";

    const updatedSub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        paymentStatus: "ACTIVE",
        active: true,
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      },
      update: {
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        paymentStatus: "ACTIVE",
        active: true,
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      }
    });

    const pixPayload = `00020101021126580014br.gov.bcb.pix0119${PIX_KEY}5204000053039865405${Number(monthlyPrice).toFixed(2)}5802BR5925${PIX_HOLDER.replace(/\s/g, '%20')}6014${PIX_CITY.replace(/\s/g, '%20')}62070503***6304`;

    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_UPGRADE',
        details: `Plano atualizado com sucesso e liberado automaticamente para ${plan} pelo próprio Sensei via Pix.`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `Plano atualizado para ${plan} com sucesso!`,
      status: "ACTIVE",
      pixPayload,
      qrCode: "data:image/svg+xml;utf8,...",
      subscription: {
        ...updatedSub,
        studentLimit,
        maxStudents: studentLimit
      }
    });
  } catch (error: any) {
    console.error("🥋 ERROR UPGRADING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/downgrade
router.post("/downgrade", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { plan } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, error: "Plano é obrigatório." });
  }

  let studentLimit = 20;
  let monthlyPrice = 0;
  if (plan === "BRONZE") { studentLimit = 50; monthlyPrice = 20; }
  else if (plan === "SILVER") { studentLimit = 80; monthlyPrice = 30; }
  else if (plan === "BLACK_BELT" || plan === "BLACK BELT") { studentLimit = 999999; monthlyPrice = 50; }
  else if (plan === "FREE") { studentLimit = 20; monthlyPrice = 0; }
  else {
    return res.status(400).json({ success: false, error: "Plano inválido." });
  }

  try {
    const currentStudents = await prisma.student.count({
      where: { userId: String(userId) }
    });

    if (currentStudents > studentLimit) {
      return res.status(400).json({
        success: false,
        error: `Não é possível realizar o downgrade. Você possui ${currentStudents} alunos ativos, excedendo o limite de ${studentLimit} do plano ${plan}.`
      });
    }

    const updatedSub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        paymentStatus: "ACTIVE",
        active: true
      },
      update: {
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        paymentStatus: "ACTIVE",
        active: true
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_DOWNGRADE',
        details: `Plano atualizado (downgrade) para ${plan} pelo próprio Sensei.`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `Plano atualizado para ${plan} com sucesso!`,
      subscription: {
        ...updatedSub,
        studentLimit,
        maxStudents: studentLimit
      }
    });
  } catch (error: any) {
    console.error("🥋 ERROR DOWNGRADING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/admin/all (Master only)
router.get("/admin/all", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
         id: true,
         email: true,
         name: true,
         subscription: true,
         createdAt: true
      }
    });

    const enrichedAcademias = await Promise.all(users.map(async (u) => {
      const studentCount = await prisma.student.count({
        where: { userId: u.id }
      });
      const profile = await prisma.professorProfile.findUnique({
        where: { userId: u.id }
      });

      return {
        id: u.id,
        email: u.email,
        professorName: u.name || profile?.name || "Sensei Anônimo",
        academyName: profile?.academyName || "Dojo Sem Nome",
        plan: u.subscription?.plan || "FREE",
        active: u.subscription ? u.subscription.active : true,
        studentLimit: u.subscription ? u.subscription.maxStudents : 20,
        currentStudents: studentCount,
        monthlyPrice: u.subscription ? u.subscription.monthlyPrice : 0,
        createdAt: u.createdAt
      };
    }));

    return res.json({
      success: true,
      academias: enrichedAcademias
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING ADMIN SUBSCRIPTIONS:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/update (Master only)
router.post("/admin/update", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, plan, active } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    let maxStudents = 20;
    let monthlyPrice = 0;
    
    const existing = await prisma.subscription.findUnique({ where: { userId: targetUserId } });
    const targetPlan = plan || existing?.plan || "FREE";
    
    if (targetPlan === "BRONZE") { maxStudents = 50; monthlyPrice = 20; }
    else if (targetPlan === "SILVER") { maxStudents = 80; monthlyPrice = 30; }
    else if (targetPlan === "BLACK_BELT" || targetPlan === "BLACK BELT") { maxStudents = 999999; monthlyPrice = 50; }
    else { maxStudents = 20; monthlyPrice = 0; }

    const isSuspended = active !== undefined ? !active : (existing ? !existing.active : false);

    const updated = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        plan: targetPlan,
        maxStudents,
        monthlyPrice,
        active: !isSuspended
      },
      update: {
        plan: targetPlan,
        maxStudents,
        monthlyPrice,
        active: !isSuspended
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SUBSCRIPTION_UPDATE',
        details: `Assinatura do usuário ${targetUserId} alterada para Plano ${targetPlan}, Ativo: ${!isSuspended} pelo Sensei Master.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Assinatura do Dojo modificada com sucesso pelo Master.",
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN UPDATING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
