import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../authMiddleware.js";
import { prisma } from "../../prisma/client.js";

const router = Router();

// OS SENSEI: EMV Standard Static/Dynamic PIX Payload Generator with dynamic tag lengths & mathematical CRC16
function generatePixPayload(pixKey: string, pixHolder: string, pixCity: string, price: number): string {
  const normalizedKey = String(pixKey || "pedro.honorio@gm.rio").trim();
  
  // Clean special characters from Holder and City to avoid banking app scanner failures
  const normalizedHolder = String(pixHolder || "SYSBJJ 2.0 Tecnologia Ltda")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .slice(0, 25);
    
  const normalizedCity = String(pixCity || "Rio de Janeiro")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .slice(0, 15);

  const payloadFormat = "000201";
  const initiationMethod = "010211"; // Reusable standard static

  const gui = "0014br.gov.bcb.pix";
  const keySub = `01${String(normalizedKey.length).padStart(2, '0')}${normalizedKey}`;
  const merchantAccount = `${gui}${keySub}`;
  const id26 = `26${String(merchantAccount.length).padStart(2, '0')}${merchantAccount}`;

  const id52 = "52040000";
  const id53 = "5303986"; // BRL Currency Code

  const amountStr = Number(price || 0).toFixed(2);
  const id54 = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;

  const id58 = "5802BR";
  const id59 = `59${String(normalizedHolder.length).padStart(2, '0')}${normalizedHolder}`;
  const id60 = `60${String(normalizedCity.length).padStart(2, '0')}${normalizedCity}`;
  const id62 = "62070503***";

  const rawPayload = `${payloadFormat}${initiationMethod}${id26}${id52}${id53}${id54}${id58}${id59}${id60}${id62}6304`;

  // Standard CRC16-CCITT implementation over raw payload
  let crc = 0xFFFF;
  for (let i = 0; i < rawPayload.length; i++) {
    crc ^= (rawPayload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcStr = crc.toString(16).toUpperCase().padStart(4, '0');

  return `${rawPayload}${crcStr}`;
}

// Endpoint: GET /api/subscription/admin/pix-config
router.get("/admin/pix-config", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    
    const masterSub = masterUser ? await prisma.subscription.findUnique({
      where: { userId: masterUser.id }
    }) : null;

    return res.json({
      success: true,
      pixKey: masterSub?.pixKey || "pedro.honorio@gm.rio",
      pixHolder: masterSub?.pixHolder || "SYSBJJ 2.0 Tecnologia Ltda",
      pixCity: masterSub?.pixCity || "Rio de Janeiro"
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING SAAS PIX CONFIG:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/pix-config
router.post("/admin/pix-config", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { pixKey, pixHolder, pixCity } = req.body;
  if (!pixKey || !pixHolder || !pixCity) {
    return res.status(400).json({ success: false, error: "Todos os campos (Chave, Titular e Cidade) são obrigatórios." });
  }
  
  try {
    const masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    
    if (!masterUser) {
      return res.status(404).json({ success: false, error: "Usuário master pedro.honorio@gm.rio não encontrado." });
    }

    const updatedSub = await prisma.subscription.upsert({
      where: { userId: masterUser.id },
      create: {
        userId: masterUser.id,
        plan: "BLACK_BELT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        active: true,
        pixKey,
        pixHolder,
        pixCity
      },
      update: {
        pixKey,
        pixHolder,
        pixCity
      }
    });

    return res.json({
      success: true,
      message: "Configuração global de PIX do SaaS atualizada com sucesso pelo Sensei Supremo!",
      pixKey: updatedSub.pixKey,
      pixHolder: updatedSub.pixHolder,
      pixCity: updatedSub.pixCity
    });
  } catch (error: any) {
    console.error("🥋 ERROR SAVING SAAS PIX CONFIG:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

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

    if (typeof sub.plan !== "string") {
      sub.plan = "FREE";
    }

    const limitVal = sub.studentLimit || sub.maxStudents || 20;
    const usagePercent = Math.min(100, Math.round((currentStudents / limitVal) * 100));

    // Dynamic next billing & last payment calculations based on creation/updated values
    const startedAt = sub.startedAt || sub.createdAt;
    const expiresAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nextBillingDate = expiresAt;

    // Load global PIX config of the Master admin so that Billing center displays it
    const masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    const masterSub = masterUser ? await prisma.subscription.findUnique({
      where: { userId: masterUser.id }
    }) : null;

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
      pixKey: masterSub?.pixKey || "pedro.honorio@gm.rio",
      pixHolder: masterSub?.pixHolder || "SYSBJJ 2.0 Tecnologia Ltda",
      pixCity: masterSub?.pixCity || "Rio de Janeiro",
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
      pixKey: "pedro.honorio@gm.rio",
      pixHolder: "SYSBJJ 2.0 Tecnologia Ltda",
      pixCity: "Rio de Janeiro",
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
    // Load dynamic Master Admin's PIX configurations
    const masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    const masterSub = masterUser ? await prisma.subscription.findUnique({
      where: { userId: masterUser.id }
    }) : null;

    const PIX_KEY = masterSub?.pixKey || "pedro.honorio@gm.rio";
    const PIX_HOLDER = masterSub?.pixHolder || "SYSBJJ 2.0 Tecnologia Ltda";
    const PIX_CITY = masterSub?.pixCity || "Rio de Janeiro";

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

    const pixPayload = generatePixPayload(PIX_KEY, PIX_HOLDER, PIX_CITY, monthlyPrice);

    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_UPGRADE',
        details: `Plano atualizado com sucesso e liberado automaticamente para ${plan} pelo próprio Sensei via Pix. Key: ${PIX_KEY}`,
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
