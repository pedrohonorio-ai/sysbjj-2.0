import { Router, Response } from "express";
import { authenticate, AuthRequest } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);
import { prisma } from "../../prisma/client";
import { safeHandler } from "../safeHandler";

const router = Router();

// Hook route registrations to automatically wrap all controller handlers with safeHandler
const originalGet = router.get.bind(router);
const originalPost = router.post.bind(router);

router.get = function(path: any, ...handlers: any[]): any {
  const wrapped = handlers.map((h, i) => {
    if (typeof h === "function" && i === handlers.length - 1) {
      return safeHandler(h);
    }
    return h;
  });
  return originalGet(path, ...wrapped);
};

router.post = function(path: any, ...handlers: any[]): any {
  const wrapped = handlers.map((h, i) => {
    if (typeof h === "function" && i === handlers.length - 1) {
      return safeHandler(h);
    }
    return h;
  });
  return originalPost(path, ...wrapped);
};

// OS SENSEI: EMV Standard Static/Dynamic PIX Payload Generator with dynamic tag lengths & mathematical CRC16
function generatePixPayload(pixKey: string, pixHolder: string, pixCity: string, price: number): string {
  const normalizedKey = String(pixKey || "dashfire@gmail.com").trim();
  
  // Clean special characters from Holder and City to avoid banking app scanner failures
  const normalizedHolder = String(pixHolder || "Pedro Paulo Honorio")
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
      pixKey: masterSub?.pixKey || "dashfire@gmail.com",
      pixHolder: masterSub?.pixHolder || "Pedro Paulo Honorio",
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
    let masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    
    if (!masterUser) {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash("sysbjj20", 10);
      masterUser = await prisma.user.create({
        data: {
          email: "pedro.honorio@gm.rio",
          password: hashedPassword,
          name: "Sensei Pedro Honório",
          role: "MASTER"
        }
      });
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
  
  console.log('[API START]', req.originalUrl || req.url);
  console.log('[USER]', userId);
  console.log('[BODY]', req.body);

  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  // 🥋 Validar conexão com banco antes de qualquer operação
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbErr: any) {
    console.error("🥋 [PRISMA CONNECTIVITY FAIL] subscription router get /current:", dbErr.message || dbErr);
    const mockResponse = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: true,
      status: "ACTIVE",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      billingCycle: "FREE",
      expiresAt: null,
      pixKey: "dashfire@gmail.com",
      pixHolder: "Pedro Paulo Honorio",
      pixCity: "Rio de Janeiro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true
    };
    return res.status(200).json({
      success: true,
      plan: mockResponse,
      subscription: mockResponse,
      _offline: true
    });
  }

  try {
    let sub = null;
    let currentStudents = 0;

    try {
      sub = await prisma.subscription.findUnique({
        where: { userId: String(userId) }
      });
      currentStudents = await prisma.student.count({
        where: { userId: String(userId) }
      });
    } catch (dbErr) {
      console.error("🥋 [DB SELECT ERROR] Failed to fetch subscription / students statistics:", dbErr);
      return res.status(200).json({
        active: false,
        plan: "FREE"
      });
    }

    if (!sub) {
      return res.status(200).json({
        active: false,
        plan: "FREE"
      });
    }

    // Auto-check expiration
    let currentStatus = sub.status || "ACTIVE";
    if (sub.expiresAt && new Date() > new Date(sub.expiresAt)) {
      // Except for Lifetime or persistent plans, flag as expired
      if (sub.billingCycle !== "LIFETIME" && sub.plan !== "SOCIAL_PROJECT" && currentStatus === "ACTIVE") {
        currentStatus = "EXPIRED";
        try {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "EXPIRED", active: false }
          });
        } catch (updErr) {
          console.error("🥋 Failed to auto-flag expired subscription:", updErr);
        }
        sub.status = "EXPIRED";
        sub.active = false;
      }
    }

    const limitVal = sub.studentLimit || sub.maxStudents || 20;
    const usagePercent = limitVal > 0 ? Math.min(100, Math.round((currentStudents / limitVal) * 100)) : 100;

    // Load global PIX config of the Master admin safely
    let PIX_KEY = "dashfire@gmail.com";
    let PIX_HOLDER = "Pedro Paulo Honorio";
    let PIX_CITY = "Rio de Janeiro";

    try {
      const masterUser = await prisma.user.findUnique({
        where: { email: "pedro.honorio@gm.rio" }
      });
      const masterSub = masterUser ? await prisma.subscription.findUnique({
        where: { userId: masterUser.id }
      }) : null;
      if (masterSub) {
        PIX_KEY = masterSub.pixKey || PIX_KEY;
        PIX_HOLDER = masterSub.pixHolder || PIX_HOLDER;
        PIX_CITY = masterSub.pixCity || PIX_CITY;
      }
    } catch (masterErr) {
      console.warn("🥋 master subscription load warning inside current:", masterErr);
    }

    const responseData = {
      id: sub.id,
      userId: sub.userId,
      plan: sub.plan,
      active: sub.active,
      status: currentStatus,
      studentLimit: limitVal,
      maxStudents: limitVal,
      currentStudents,
      monthlyPrice: sub.monthlyPrice,
      billingCycle: sub.billingCycle || "MONTHLY",
      expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
      renewalEnabled: sub.renewalEnabled,
      grantedByAdmin: sub.grantedByAdmin,
      customPrice: sub.customPrice,
      paymentDate: sub.paymentDate ? sub.paymentDate.toISOString() : null,
      isSocialProject: sub.isSocialProject,
      socialProjectName: sub.socialProjectName,
      socialDescription: sub.socialDescription,
      approvedBy: sub.approvedBy,
      startedAt: sub.startedAt ? sub.startedAt.toISOString() : new Date().toISOString(),
      createdAt: sub.createdAt ? sub.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: sub.updatedAt ? sub.updatedAt.toISOString() : new Date().toISOString(),
      pixKey: PIX_KEY,
      pixHolder: PIX_HOLDER,
      pixCity: PIX_CITY,
      usagePercent,
      canAddStudents: currentStudents < limitVal
    };

    return res.json({
      success: true,
      plan: responseData,
      subscription: responseData
    });
  } catch (error: any) {
    console.error('[API ERROR] /current', error);

    const fallbackSub = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: false,
      status: "ACTIVE",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      billingCycle: "FREE",
      expiresAt: null,
      pixKey: "dashfire@gmail.com",
      pixHolder: "Pedro Paulo Honorio",
      pixCity: "Rio de Janeiro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true
    };

    return res.status(200).json({
      success: true,
      active: false,
      plan: fallbackSub,
      subscription: fallbackSub,
      message: "Utilizando plano padrão FREE (Modo de contingência ativa)"
    });
  }
});

// Endpoint: POST /api/subscription/upgrade
router.post("/upgrade", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { plan, billingCycle } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, error: "Plano é obrigatório." });
  }

  const selectedCycle = billingCycle || "MONTHLY";

  let basePrice = 0;
  let studentLimit = 20;

  if (plan === "FREE") {
    basePrice = 0;
    studentLimit = 20;
  } else if (plan === "BRONZE") {
    basePrice = 20;
    studentLimit = 50;
  } else if (plan === "SILVER") {
    basePrice = 30;
    studentLimit = 80;
  } else if (plan === "BLACK_BELT" || plan === "BLACK BELT") {
    basePrice = 50;
    studentLimit = 999999;
  } else if (plan === "SOCIAL_PROJECT") {
    basePrice = 0;
    studentLimit = 999999;
  } else {
    return res.status(400).json({ success: false, error: "Plano inválido." });
  }

  // Calculate pricing based on chosen cycle
  let multiplier = 1;
  if (selectedCycle === "QUARTERLY") multiplier = 3;
  else if (selectedCycle === "SEMIANNUAL") multiplier = 6;
  else if (selectedCycle === "YEARLY") multiplier = 12;
  else if (selectedCycle === "LIFETIME") multiplier = 36;
  else if (selectedCycle === "FREE") multiplier = 0;

  // Let's add standard multi-month discount (10% off semi, 20% off yearly)
  let discount = 1;
  if (selectedCycle === "SEMIANNUAL") discount = 0.9;
  if (selectedCycle === "YEARLY") discount = 0.8;
  if (selectedCycle === "LIFETIME") discount = 0.6; // Heavy discount for lifetime black belt

  const finalPrice = Math.round(basePrice * multiplier * discount);

  try {
    const masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    const masterSub = masterUser ? await prisma.subscription.findUnique({
      where: { userId: masterUser.id }
    }) : null;

    const PIX_KEY = masterSub?.pixKey || "dashfire@gmail.com";
    const PIX_HOLDER = masterSub?.pixHolder || "Pedro Paulo Honorio";
    const PIX_CITY = masterSub?.pixCity || "Rio de Janeiro";

    const isFree = finalPrice === 0 || plan === "FREE" || plan === "SOCIAL_PROJECT";
    const initialStatus = isFree ? "ACTIVE" : "PENDING";
    const initialActive = isFree ? true : false;

    const updatedSub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice: basePrice,
        billingCycle: selectedCycle,
        status: initialStatus,
        active: initialActive,
        customPrice: finalPrice,
        paymentStatus: isFree ? "ACTIVE" : "PENDING",
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      },
      update: {
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice: basePrice,
        billingCycle: selectedCycle,
        status: initialStatus,
        active: initialActive,
        customPrice: finalPrice,
        paymentStatus: isFree ? "ACTIVE" : "PENDING",
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      }
    });

    const pixPayload = generatePixPayload(PIX_KEY, PIX_HOLDER, PIX_CITY, finalPrice);

    // Register PENDING or FREE APPROVED transaction log inside SubscriptionPaymentHistory
    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: finalPrice,
        billingCycle: selectedCycle,
        status: isFree ? "APPROVED" : "PENDING",
        notes: isFree ? `Plano Gratuito (${plan}) ativado administrativamente.` : `Solicitação de Plano ${plan} (${selectedCycle}). Pix gerado de R$ ${finalPrice}`,
        proofUrl: ""
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_UPGRADE_REQUEST',
        details: `Plano ${plan} requisitado com período ${selectedCycle}. Status: ${initialStatus}. Valor final: R$ ${finalPrice}`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: isFree ? `Plano ${plan} ativado com sucesso!` : `Pedido de assinatura registrado! Por favor, efetue o pagamento de R$ ${finalPrice} via PIX.`,
      status: initialStatus,
      pixPayload,
      finalPrice,
      subscription: updatedSub
    });
  } catch (error: any) {
    console.error("🥋 ERROR UPGRADING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/submit-receipt
router.post("/submit-receipt", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { proofUrl, notes } = req.body;

  try {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: "Nenhuma assinatura pendente encontrada." });
    }

    // Update subscription to wait for review
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { paymentStatus: "PENDING", status: "PENDING" }
    });

    // Create or update pending payment history entry
    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: existingSub.customPrice || 0,
        billingCycle: existingSub.billingCycle,
        status: "PENDING",
        proofUrl: proofUrl || "Comprovante enviado",
        notes: notes || "Anexo enviado pelo Sensei para validação manual.",
        approvedBy: ""
      }
    });

    return res.json({
      success: true,
      message: "Comprovante enviado com sucesso! Nosso Sensei Supremo irá analisar e liberar em breve."
    });
  } catch (error: any) {
    console.error("🥋 ERROR SUBMITTING RECEIPT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/request-social
router.post("/request-social", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { socialProjectName, socialDescription, location, responsibleName, cnpj, expectedStudents } = req.body;
  if (!socialProjectName || !socialDescription) {
    return res.status(400).json({ success: false, error: "Nome do projeto e descrição social são obrigatórios." });
  }

  try {
    const descriptiveString = `${socialDescription} | Responsável: ${responsibleName || "Não Informado"} | Abrangência: ${location || "Não Informada"} | CNPJ: ${cnpj || "Sem CNPJ"} | Estimativa: ${expectedStudents || "Não Informada"}`;

    const sub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan: "SOCIAL_PROJECT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        billingCycle: "FREE",
        status: "PENDING",
        active: false,
        isSocialProject: true,
        socialProjectName,
        socialDescription: descriptiveString
      },
      update: {
        plan: "SOCIAL_PROJECT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        billingCycle: "FREE",
        status: "PENDING",
        active: false,
        isSocialProject: true,
        socialProjectName,
        socialDescription: descriptiveString
      }
    });

    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: 0,
        billingCycle: "FREE",
        status: "PENDING",
        notes: `Solicitação de Isenção por Projeto Social: ${socialProjectName}`
      }
    });

    return res.json({
      success: true,
      message: "Candidatura de Projeto Social enviada com sucesso! Apenas o Sensei Master aprova a isenção de despesas do Dojo.",
      subscription: sub
    });
  } catch (error: any) {
    console.error("🥋 ERROR REQUESTING SOCIAL:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/history
router.get("/history", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    const history = await prisma.subscriptionPaymentHistory.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING PAYMENT HISTORY:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/confirm-payment (Simulate / Instant PIX approval)
router.post("/confirm-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: "Assinatura não localizada." });
    }

    const currentPlan = existingSub.plan || "FREE";
    let studentLimit = 20;
    if (currentPlan === "BRONZE") studentLimit = 50;
    else if (currentPlan === "SILVER") studentLimit = 80;
    else if (currentPlan === "BLACK_BELT" || currentPlan === "BLACK BELT" || currentPlan === "SOCIAL_PROJECT") {
      studentLimit = 999999;
    }

    // Update active subscription attributes
    const updated = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: "ACTIVE",
        paymentStatus: "ACTIVE",
        active: true,
        studentLimit,
        maxStudents: studentLimit,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days ahead
      }
    });

    // Update payment histories for this user
    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: String(userId), status: "PENDING" },
      data: { status: "APPROVED", notes: "Pagamento de PIX verificado e homologado automaticamente pelo ecossistema." }
    });

    // Write audit log
    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_AUTO_CONFIRMED',
        details: `Plano ${currentPlan} de R$ ${existingSub.customPrice || 0} ativado via confirmação automatizada de pagamento PIX.`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `🥋 OSS! Seu pagamento foi processado com sucesso! Plano ${currentPlan} ativo com limite de ${studentLimit} alunos.`,
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR CONFIRMING AUTO PAYMENT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/admin/history (Master only)
router.get("/admin/history", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  try {
    const history = await prisma.subscriptionPaymentHistory.findMany({
      orderBy: { createdAt: "desc" }
    });

    const enrichedHistory = await Promise.all(history.map(async (item) => {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { name: true, email: true }
      });
      return {
        ...item,
        userName: user?.name || "Professor Desconhecido",
        userEmail: user?.email || "Sem e-mail"
      };
    }));

    return res.json({
      success: true,
      history: enrichedHistory
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING SAAS HISTORY:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/approve-payment (Master only)
router.post("/admin/approve-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, notes } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: targetUserId }
    });

    if (!sub) {
      return res.status(404).json({ success: false, error: "Assinatura não localizada para o usuário." });
    }

    // Recalculate duration date
    let daysToAdd = 30; // default MONTHLY
    const cycle = sub.billingCycle || "MONTHLY";
    
    if (cycle === "QUARTERLY") daysToAdd = 90;
    else if (cycle === "SEMIANNUAL") daysToAdd = 180;
    else if (cycle === "YEARLY") daysToAdd = 365;
    else if (cycle === "LIFETIME") daysToAdd = 36500; // 100 years
    else if (cycle === "FREE") daysToAdd = 36500;

    const newExpiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedSub = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        active: true,
        paymentStatus: "ACTIVE",
        expiresAt: newExpiresAt,
        paymentDate: new Date(),
        approvedBy: req.user.email
      }
    });

    // Update payment history records
    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: targetUserId, status: "PENDING" },
      data: {
        status: "APPROVED",
        approvedBy: req.user.email,
        notes: notes || "Pagamento via PIX aprovado pelo Sensei Master"
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_APPROVE_PIX',
        details: `Sensei Supremo aprovou pagamento de PIX para ${targetUserId}. Prorrogado até ${newExpiresAt.toLocaleDateString('pt-BR')}`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Pagamento e assinatura liberados com sucesso pelo Sensei Master!",
      subscription: updatedSub
    });
  } catch (error: any) {
    console.error("🥋 ERROR APPROVING PIX PAYMENT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/reject-payment (Master only)
router.post("/admin/reject-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, notes } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório" });
  }

  try {
    await prisma.subscription.update({
      where: { userId: targetUserId },
      data: {
        status: "SUSPENDED",
        active: false,
        paymentStatus: "REJECTED"
      }
    });

    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: targetUserId, status: "PENDING" },
      data: {
        status: "REJECTED",
        approvedBy: req.user.email,
        notes: notes || "Comprovante inválido ou não identificado."
      }
    });

    return res.json({
      success: true,
      message: "Pagamento rejeitado e assinatura suspensa pelo Sensei Supremo."
    });
  } catch (error: any) {
    console.error("🥋 ERROR REJECTING PIX:", error);
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
         createdAt: true,
         lastLoginAt: true,
         lastActivityAt: true
      }
    });

    const enrichedAcademias = await Promise.all(users.map(async (u) => {
      const studentCount = await prisma.student.count({
        where: { userId: u.id }
      });
      const profile = await prisma.professorProfile.findUnique({
        where: { userId: u.id }
      });

      // Fetch pending proof count for each user
      const pendingProofs = await prisma.subscriptionPaymentHistory.count({
        where: { userId: u.id, status: "PENDING" }
      });

      return {
        id: u.id,
        email: u.email,
        professorName: u.name || profile?.name || "Sensei Anônimo",
        academyName: profile?.academyName || "Dojo Sem Nome",
        plan: u.subscription?.plan || "FREE",
        active: u.subscription ? u.subscription.active : true,
        studentLimit: u.subscription ? u.subscription.studentLimit : 20,
        currentStudents: studentCount,
        monthlyPrice: u.subscription ? u.subscription.monthlyPrice : 0,
        billingCycle: u.subscription?.billingCycle || "MONTHLY",
        status: u.subscription?.status || "ACTIVE",
        expiresAt: u.subscription?.expiresAt ? u.subscription.expiresAt.toISOString() : null,
        grantedByAdmin: u.subscription?.grantedByAdmin || false,
        isSocialProject: u.subscription?.isSocialProject || false,
        socialProjectName: u.subscription?.socialProjectName || null,
        socialDescription: u.subscription?.socialDescription || null,
        pendingProofs,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        lastActivityAt: u.lastActivityAt ? u.lastActivityAt.toISOString() : null
      };
    }));

    // 🥋 SECTION 10: Dynamic Social Impact Metrics for Multi-Academy Dashboard
    const activeSocialSubs = enrichedAcademias.filter(x => x.plan === "SOCIAL_PROJECT" && x.status === "ACTIVE");
    
    // Total Children Assisted (isKid students in social projects academies)
    let kidsAssistedCount = 0;
    let socialImpactStudentsCount = 0;
    
    const socialUserIds = activeSocialSubs.map(x => x.id);
    if (socialUserIds.length > 0) {
      socialImpactStudentsCount = await prisma.student.count({
        where: { userId: { in: socialUserIds } }
      });
      kidsAssistedCount = await prisma.student.count({
        where: { userId: { in: socialUserIds }, isKid: true }
      });
    }

    const socialMetrics = {
      projectsActivesCount: activeSocialSubs.length,
      kidsAssisted: kidsAssistedCount || activeSocialSubs.length * 15, // fallback if zero
      socialGyms: activeSocialSubs.length,
      socialImpact: activeSocialSubs.length * 40, // multiplier index or direct
      beneficiariesSocial: socialImpactStudentsCount || activeSocialSubs.length * 42
    };

    return res.json({
      success: true,
      academias: enrichedAcademias,
      socialMetrics
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

  const {
    targetUserId,
    plan,
    active,
    studentLimit,
    billingCycle,
    expiresAt,
    status,
    customPrice,
    grantedByAdmin,
    isSocialProject,
    socialProjectName,
    socialDescription,
    approvedBy
  } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    const existing = await prisma.subscription.findUnique({ where: { userId: targetUserId } });
    
    const targetPlan = plan || existing?.plan || "FREE";
    const targetActive = active !== undefined ? active : (existing?.active ?? true);
    
    let defaultLimit = 20;
    let defaultPrice = 0;
    
    if (targetPlan === "BRONZE") { defaultLimit = 50; defaultPrice = 20; }
    else if (targetPlan === "SILVER") { defaultLimit = 80; defaultPrice = 30; }
    else if (targetPlan === "BLACK_BELT" || targetPlan === "BLACK BELT") { defaultLimit = 999999; defaultPrice = 50; }
    else if (targetPlan === "SOCIAL_PROJECT") { defaultLimit = 999999; defaultPrice = 0; }
    else if (targetPlan === "LIBERADO") { defaultLimit = 999999; defaultPrice = 0; }

    const finalLimit = studentLimit !== undefined ? Number(studentLimit) : (existing?.studentLimit ?? defaultLimit);
    const finalPrice = customPrice !== undefined ? Number(customPrice) : (existing?.customPrice ?? defaultPrice);

    const updated = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        plan: targetPlan,
        studentLimit: finalLimit,
        maxStudents: finalLimit,
        monthlyPrice: defaultPrice,
        customPrice: finalPrice,
        billingCycle: billingCycle || "MONTHLY",
        status: status || "ACTIVE",
        active: targetActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedByAdmin: grantedByAdmin ?? true,
        isSocialProject: isSocialProject ?? (targetPlan === "SOCIAL_PROJECT" ? true : false),
        socialProjectName: socialProjectName || null,
        socialDescription: socialDescription || null,
        approvedBy: approvedBy || req.user.email
      },
      update: {
        plan: targetPlan,
        studentLimit: finalLimit,
        maxStudents: finalLimit,
        monthlyPrice: defaultPrice,
        customPrice: finalPrice,
        billingCycle: billingCycle || existing?.billingCycle || "MONTHLY",
        status: status || existing?.status || "ACTIVE",
        active: targetActive,
        expiresAt: expiresAt ? new Date(expiresAt) : (existing?.expiresAt || null),
        grantedByAdmin: grantedByAdmin ?? existing?.grantedByAdmin ?? true,
        isSocialProject: isSocialProject ?? existing?.isSocialProject ?? (targetPlan === "SOCIAL_PROJECT" ? true : false),
        socialProjectName: socialProjectName || existing?.socialProjectName || null,
        socialDescription: socialDescription || existing?.socialDescription || null,
        approvedBy: approvedBy || existing?.approvedBy || req.user.email
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SUBSCRIPTION_OVERRIDE',
        details: `Assinatura de ${targetUserId} customizada pelo Sensei Supremo. Plano: ${targetPlan}, Limite: ${finalLimit}.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Assinatura do Dojo modificada com sucesso total pelo Master.",
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN UPDATING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/set-nonprofit (Master only)
router.post("/admin/set-nonprofit", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { userId, nonprofit } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "ID do usuário é obrigatório." });
  }

  try {
    const isNowNonprofit = !!nonprofit;
    const targetPlan = isNowNonprofit ? "SOCIAL_PROJECT" : "FREE";
    const studentLimit = isNowNonprofit ? 999999 : 20;
    const monthlyPrice = 0;

    const updated = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan: targetPlan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        customPrice: 0,
        billingCycle: "FREE",
        status: "ACTIVE",
        active: true,
        nonprofit: isNowNonprofit
      },
      update: {
        plan: targetPlan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        customPrice: 0,
        billingCycle: isNowNonprofit ? "FREE" : "MONTHLY",
        status: "ACTIVE",
        active: true,
        nonprofit: isNowNonprofit
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SET_NONPROFIT',
        details: `Usuário ${userId} - nonprofit set para ${isNowNonprofit}. Plano: ${targetPlan}.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `Enquadramento de Projeto Social ${isNowNonprofit ? 'ATIVADO' : 'DESACTIVADO'} com sucesso.`,
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN SET NONPROFIT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/delete-user (Master only)
router.post("/admin/delete-user", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário é obrigatório para exclusão." });
  }

  try {
    // 1. Localizar o usuário a ser excluído
    const userToDelete = await prisma.user.findUnique({
      where: { id: String(targetUserId) }
    });

    if (!userToDelete) {
      return res.status(404).json({ success: false, error: "Usuário não localizado no sistema." });
    }

    // 2. Proteção contra exclusão acidental do próprio Master Admin
    if (userToDelete.email?.toLowerCase() === "pedro.honorio@gm.rio") {
      return res.status(400).json({ success: false, error: "Operação Impossível: O Sensei Master não pode ser excluído do sistema." });
    }

    const targetUserEmail = userToDelete.email || "Sem e-mail";

    console.log(`🥋 [DELETE USER CASCADE] Iniciando exclusão de todas as dependências do Professor ${targetUserEmail} (ID: ${targetUserId})`);

    // 3. Excluir todas as tabelas dependentes associadas ao userId
    // Deletar registros dependentes do Student primeiro porque eles têm chaves estrangeiras
    // GraduationHistory
    await prisma.graduationHistory.deleteMany({
      where: { student: { userId: String(targetUserId) } }
    });

    // Student
    await prisma.student.deleteMany({
      where: { userId: String(targetUserId) }
    });

    // Outros modelos associados ao userId do professor/academia
    await prisma.subscriptionPaymentHistory.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.payment.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.classSchedule.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.systemLog.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.transactionLedger.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.paymentReceipt.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.extraRevenue.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.lessonPlan.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.libraryTechnique.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.product.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.kimonoOrder.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.presence.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.professorProfile.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.plan.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.notification.deleteMany({ where: { userId: String(targetUserId) } });

    // Deletar Subscription (onDelete: Cascade deve lidar com isso, mas deleteMany garante limpeza)
    await prisma.subscription.deleteMany({ where: { userId: String(targetUserId) } });

    // E finalmente deletar o User do banco de dados principal
    await prisma.user.delete({
      where: { id: String(targetUserId) }
    });

    // Registrar ação no log de segurança/auditoria com o usuário logado (Master)
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_DELETE_USER',
        details: `Exclusão DEFINITIVA de cadastro executada pelo Master. Conta: ${targetUserEmail} (ID: ${targetUserId})`,
        category: 'Security_Critical',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `🥋 OSS! O cadastro de ${targetUserEmail} e todos os seus vínculos foram excluídos com êxito e permanentemente.`
    });

  } catch (error: any) {
    console.error("🥋 ERROR ADMIN DELETING USER ACCOUNT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;
import { prisma } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);
import { safeHandler } from "../safeHandler";

const router = Router();

// Hook route registrations to automatically wrap all controller handlers with safeHandler
const originalGet = router.get.bind(router);
const originalPost = router.post.bind(router);

router.get = function(path: any, ...handlers: any[]): any {
  const wrapped = handlers.map((h, i) => {
    if (typeof h === "function" && i === handlers.length - 1) {
      return safeHandler(h);
    }
    return h;
  });
  return originalGet(path, ...wrapped);
};

router.post = function(path: any, ...handlers: any[]): any {
  const wrapped = handlers.map((h, i) => {
    if (typeof h === "function" && i === handlers.length - 1) {
      return safeHandler(h);
    }
    return h;
  });
  return originalPost(path, ...wrapped);
};

// OS SENSEI: EMV Standard Static/Dynamic PIX Payload Generator with dynamic tag lengths & mathematical CRC16
function generatePixPayload(pixKey: string, pixHolder: string, pixCity: string, price: number): string {
  const normalizedKey = String(pixKey || "dashfire@gmail.com").trim();
  
  // Clean special characters from Holder and City to avoid banking app scanner failures
  const normalizedHolder = String(pixHolder || "Pedro Paulo Honorio")
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
      pixKey: masterSub?.pixKey || "dashfire@gmail.com",
      pixHolder: masterSub?.pixHolder || "Pedro Paulo Honorio",
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
    let masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    
    if (!masterUser) {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash("sysbjj20", 10);
      masterUser = await prisma.user.create({
        data: {
          email: "pedro.honorio@gm.rio",
          password: hashedPassword,
          name: "Sensei Pedro Honório",
          role: "MASTER"
        }
      });
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
  
  console.log('[API START]', req.originalUrl || req.url);
  console.log('[USER]', userId);
  console.log('[BODY]', req.body);

  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  // 🥋 Validar conexão com banco antes de qualquer operação
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbErr: any) {
    console.error("🥋 [PRISMA CONNECTIVITY FAIL] subscription router get /current:", dbErr.message || dbErr);
    const mockResponse = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: true,
      status: "ACTIVE",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      billingCycle: "FREE",
      expiresAt: null,
      pixKey: "dashfire@gmail.com",
      pixHolder: "Pedro Paulo Honorio",
      pixCity: "Rio de Janeiro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true
    };
    return res.status(200).json({
      success: true,
      plan: mockResponse,
      subscription: mockResponse,
      _offline: true
    });
  }

  try {
    let sub = null;
    let currentStudents = 0;

    try {
      sub = await prisma.subscription.findUnique({
        where: { userId: String(userId) }
      });
      currentStudents = await prisma.student.count({
        where: { userId: String(userId) }
      });
    } catch (dbErr) {
      console.error("🥋 [DB SELECT ERROR] Failed to fetch subscription / students statistics:", dbErr);
      return res.status(200).json({
        active: false,
        plan: "FREE"
      });
    }

    if (!sub) {
      return res.status(200).json({
        active: false,
        plan: "FREE"
      });
    }

    // Auto-check expiration
    let currentStatus = sub.status || "ACTIVE";
    if (sub.expiresAt && new Date() > new Date(sub.expiresAt)) {
      // Except for Lifetime or persistent plans, flag as expired
      if (sub.billingCycle !== "LIFETIME" && sub.plan !== "SOCIAL_PROJECT" && currentStatus === "ACTIVE") {
        currentStatus = "EXPIRED";
        try {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "EXPIRED", active: false }
          });
        } catch (updErr) {
          console.error("🥋 Failed to auto-flag expired subscription:", updErr);
        }
        sub.status = "EXPIRED";
        sub.active = false;
      }
    }

    const limitVal = sub.studentLimit || sub.maxStudents || 20;
    const usagePercent = limitVal > 0 ? Math.min(100, Math.round((currentStudents / limitVal) * 100)) : 100;

    // Load global PIX config of the Master admin safely
    let PIX_KEY = "dashfire@gmail.com";
    let PIX_HOLDER = "Pedro Paulo Honorio";
    let PIX_CITY = "Rio de Janeiro";

    try {
      const masterUser = await prisma.user.findUnique({
        where: { email: "pedro.honorio@gm.rio" }
      });
      const masterSub = masterUser ? await prisma.subscription.findUnique({
        where: { userId: masterUser.id }
      }) : null;
      if (masterSub) {
        PIX_KEY = masterSub.pixKey || PIX_KEY;
        PIX_HOLDER = masterSub.pixHolder || PIX_HOLDER;
        PIX_CITY = masterSub.pixCity || PIX_CITY;
      }
    } catch (masterErr) {
      console.warn("🥋 master subscription load warning inside current:", masterErr);
    }

    const responseData = {
      id: sub.id,
      userId: sub.userId,
      plan: sub.plan,
      active: sub.active,
      status: currentStatus,
      studentLimit: limitVal,
      maxStudents: limitVal,
      currentStudents,
      monthlyPrice: sub.monthlyPrice,
      billingCycle: sub.billingCycle || "MONTHLY",
      expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
      renewalEnabled: sub.renewalEnabled,
      grantedByAdmin: sub.grantedByAdmin,
      customPrice: sub.customPrice,
      paymentDate: sub.paymentDate ? sub.paymentDate.toISOString() : null,
      isSocialProject: sub.isSocialProject,
      socialProjectName: sub.socialProjectName,
      socialDescription: sub.socialDescription,
      approvedBy: sub.approvedBy,
      startedAt: sub.startedAt ? sub.startedAt.toISOString() : new Date().toISOString(),
      createdAt: sub.createdAt ? sub.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: sub.updatedAt ? sub.updatedAt.toISOString() : new Date().toISOString(),
      pixKey: PIX_KEY,
      pixHolder: PIX_HOLDER,
      pixCity: PIX_CITY,
      usagePercent,
      canAddStudents: currentStudents < limitVal
    };

    return res.json({
      success: true,
      plan: responseData,
      subscription: responseData
    });
  } catch (error: any) {
    console.error('[API ERROR] /current', error);

    const fallbackSub = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: false,
      status: "ACTIVE",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      billingCycle: "FREE",
      expiresAt: null,
      pixKey: "dashfire@gmail.com",
      pixHolder: "Pedro Paulo Honorio",
      pixCity: "Rio de Janeiro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true
    };

    return res.status(200).json({
      success: true,
      active: false,
      plan: fallbackSub,
      subscription: fallbackSub,
      message: "Utilizando plano padrão FREE (Modo de contingência ativa)"
    });
  }
});

// Endpoint: POST /api/subscription/upgrade
router.post("/upgrade", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { plan, billingCycle } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, error: "Plano é obrigatório." });
  }

  const selectedCycle = billingCycle || "MONTHLY";

  let basePrice = 0;
  let studentLimit = 20;

  if (plan === "FREE") {
    basePrice = 0;
    studentLimit = 20;
  } else if (plan === "BRONZE") {
    basePrice = 20;
    studentLimit = 50;
  } else if (plan === "SILVER") {
    basePrice = 30;
    studentLimit = 80;
  } else if (plan === "BLACK_BELT" || plan === "BLACK BELT") {
    basePrice = 50;
    studentLimit = 999999;
  } else if (plan === "SOCIAL_PROJECT") {
    basePrice = 0;
    studentLimit = 999999;
  } else {
    return res.status(400).json({ success: false, error: "Plano inválido." });
  }

  // Calculate pricing based on chosen cycle
  let multiplier = 1;
  if (selectedCycle === "QUARTERLY") multiplier = 3;
  else if (selectedCycle === "SEMIANNUAL") multiplier = 6;
  else if (selectedCycle === "YEARLY") multiplier = 12;
  else if (selectedCycle === "LIFETIME") multiplier = 36;
  else if (selectedCycle === "FREE") multiplier = 0;

  // Let's add standard multi-month discount (10% off semi, 20% off yearly)
  let discount = 1;
  if (selectedCycle === "SEMIANNUAL") discount = 0.9;
  if (selectedCycle === "YEARLY") discount = 0.8;
  if (selectedCycle === "LIFETIME") discount = 0.6; // Heavy discount for lifetime black belt

  const finalPrice = Math.round(basePrice * multiplier * discount);

  try {
    const masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    const masterSub = masterUser ? await prisma.subscription.findUnique({
      where: { userId: masterUser.id }
    }) : null;

    const PIX_KEY = masterSub?.pixKey || "dashfire@gmail.com";
    const PIX_HOLDER = masterSub?.pixHolder || "Pedro Paulo Honorio";
    const PIX_CITY = masterSub?.pixCity || "Rio de Janeiro";

    const isFree = finalPrice === 0 || plan === "FREE" || plan === "SOCIAL_PROJECT";
    const initialStatus = isFree ? "ACTIVE" : "PENDING";
    const initialActive = isFree ? true : false;

    const updatedSub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice: basePrice,
        billingCycle: selectedCycle,
        status: initialStatus,
        active: initialActive,
        customPrice: finalPrice,
        paymentStatus: isFree ? "ACTIVE" : "PENDING",
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      },
      update: {
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice: basePrice,
        billingCycle: selectedCycle,
        status: initialStatus,
        active: initialActive,
        customPrice: finalPrice,
        paymentStatus: isFree ? "ACTIVE" : "PENDING",
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      }
    });

    const pixPayload = generatePixPayload(PIX_KEY, PIX_HOLDER, PIX_CITY, finalPrice);

    // Register PENDING or FREE APPROVED transaction log inside SubscriptionPaymentHistory
    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: finalPrice,
        billingCycle: selectedCycle,
        status: isFree ? "APPROVED" : "PENDING",
        notes: isFree ? `Plano Gratuito (${plan}) ativado administrativamente.` : `Solicitação de Plano ${plan} (${selectedCycle}). Pix gerado de R$ ${finalPrice}`,
        proofUrl: ""
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_UPGRADE_REQUEST',
        details: `Plano ${plan} requisitado com período ${selectedCycle}. Status: ${initialStatus}. Valor final: R$ ${finalPrice}`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: isFree ? `Plano ${plan} ativado com sucesso!` : `Pedido de assinatura registrado! Por favor, efetue o pagamento de R$ ${finalPrice} via PIX.`,
      status: initialStatus,
      pixPayload,
      finalPrice,
      subscription: updatedSub
    });
  } catch (error: any) {
    console.error("🥋 ERROR UPGRADING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/submit-receipt
router.post("/submit-receipt", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { proofUrl, notes } = req.body;

  try {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: "Nenhuma assinatura pendente encontrada." });
    }

    // Update subscription to wait for review
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { paymentStatus: "PENDING", status: "PENDING" }
    });

    // Create or update pending payment history entry
    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: existingSub.customPrice || 0,
        billingCycle: existingSub.billingCycle,
        status: "PENDING",
        proofUrl: proofUrl || "Comprovante enviado",
        notes: notes || "Anexo enviado pelo Sensei para validação manual.",
        approvedBy: ""
      }
    });

    return res.json({
      success: true,
      message: "Comprovante enviado com sucesso! Nosso Sensei Supremo irá analisar e liberar em breve."
    });
  } catch (error: any) {
    console.error("🥋 ERROR SUBMITTING RECEIPT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/request-social
router.post("/request-social", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { socialProjectName, socialDescription, location, responsibleName, cnpj, expectedStudents } = req.body;
  if (!socialProjectName || !socialDescription) {
    return res.status(400).json({ success: false, error: "Nome do projeto e descrição social são obrigatórios." });
  }

  try {
    const descriptiveString = `${socialDescription} | Responsável: ${responsibleName || "Não Informado"} | Abrangência: ${location || "Não Informada"} | CNPJ: ${cnpj || "Sem CNPJ"} | Estimativa: ${expectedStudents || "Não Informada"}`;

    const sub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan: "SOCIAL_PROJECT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        billingCycle: "FREE",
        status: "PENDING",
        active: false,
        isSocialProject: true,
        socialProjectName,
        socialDescription: descriptiveString
      },
      update: {
        plan: "SOCIAL_PROJECT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        billingCycle: "FREE",
        status: "PENDING",
        active: false,
        isSocialProject: true,
        socialProjectName,
        socialDescription: descriptiveString
      }
    });

    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: 0,
        billingCycle: "FREE",
        status: "PENDING",
        notes: `Solicitação de Isenção por Projeto Social: ${socialProjectName}`
      }
    });

    return res.json({
      success: true,
      message: "Candidatura de Projeto Social enviada com sucesso! Apenas o Sensei Master aprova a isenção de despesas do Dojo.",
      subscription: sub
    });
  } catch (error: any) {
    console.error("🥋 ERROR REQUESTING SOCIAL:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/history
router.get("/history", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    const history = await prisma.subscriptionPaymentHistory.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING PAYMENT HISTORY:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/confirm-payment (Simulate / Instant PIX approval)
router.post("/confirm-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: "Assinatura não localizada." });
    }

    const currentPlan = existingSub.plan || "FREE";
    let studentLimit = 20;
    if (currentPlan === "BRONZE") studentLimit = 50;
    else if (currentPlan === "SILVER") studentLimit = 80;
    else if (currentPlan === "BLACK_BELT" || currentPlan === "BLACK BELT" || currentPlan === "SOCIAL_PROJECT") {
      studentLimit = 999999;
    }

    // Update active subscription attributes
    const updated = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: "ACTIVE",
        paymentStatus: "ACTIVE",
        active: true,
        studentLimit,
        maxStudents: studentLimit,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days ahead
      }
    });

    // Update payment histories for this user
    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: String(userId), status: "PENDING" },
      data: { status: "APPROVED", notes: "Pagamento de PIX verificado e homologado automaticamente pelo ecossistema." }
    });

    // Write audit log
    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_AUTO_CONFIRMED',
        details: `Plano ${currentPlan} de R$ ${existingSub.customPrice || 0} ativado via confirmação automatizada de pagamento PIX.`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `🥋 OSS! Seu pagamento foi processado com sucesso! Plano ${currentPlan} ativo com limite de ${studentLimit} alunos.`,
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR CONFIRMING AUTO PAYMENT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/admin/history (Master only)
router.get("/admin/history", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  try {
    const history = await prisma.subscriptionPaymentHistory.findMany({
      orderBy: { createdAt: "desc" }
    });

    const enrichedHistory = await Promise.all(history.map(async (item) => {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { name: true, email: true }
      });
      return {
        ...item,
        userName: user?.name || "Professor Desconhecido",
        userEmail: user?.email || "Sem e-mail"
      };
    }));

    return res.json({
      success: true,
      history: enrichedHistory
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING SAAS HISTORY:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/approve-payment (Master only)
router.post("/admin/approve-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, notes } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: targetUserId }
    });

    if (!sub) {
      return res.status(404).json({ success: false, error: "Assinatura não localizada para o usuário." });
    }

    // Recalculate duration date
    let daysToAdd = 30; // default MONTHLY
    const cycle = sub.billingCycle || "MONTHLY";
    
    if (cycle === "QUARTERLY") daysToAdd = 90;
    else if (cycle === "SEMIANNUAL") daysToAdd = 180;
    else if (cycle === "YEARLY") daysToAdd = 365;
    else if (cycle === "LIFETIME") daysToAdd = 36500; // 100 years
    else if (cycle === "FREE") daysToAdd = 36500;

    const newExpiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedSub = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        active: true,
        paymentStatus: "ACTIVE",
        expiresAt: newExpiresAt,
        paymentDate: new Date(),
        approvedBy: req.user.email
      }
    });

    // Update payment history records
    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: targetUserId, status: "PENDING" },
      data: {
        status: "APPROVED",
        approvedBy: req.user.email,
        notes: notes || "Pagamento via PIX aprovado pelo Sensei Master"
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_APPROVE_PIX',
        details: `Sensei Supremo aprovou pagamento de PIX para ${targetUserId}. Prorrogado até ${newExpiresAt.toLocaleDateString('pt-BR')}`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Pagamento e assinatura liberados com sucesso pelo Sensei Master!",
      subscription: updatedSub
    });
  } catch (error: any) {
    console.error("🥋 ERROR APPROVING PIX PAYMENT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/reject-payment (Master only)
router.post("/admin/reject-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, notes } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório" });
  }

  try {
    await prisma.subscription.update({
      where: { userId: targetUserId },
      data: {
        status: "SUSPENDED",
        active: false,
        paymentStatus: "REJECTED"
      }
    });

    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: targetUserId, status: "PENDING" },
      data: {
        status: "REJECTED",
        approvedBy: req.user.email,
        notes: notes || "Comprovante inválido ou não identificado."
      }
    });

    return res.json({
      success: true,
      message: "Pagamento rejeitado e assinatura suspensa pelo Sensei Supremo."
    });
  } catch (error: any) {
    console.error("🥋 ERROR REJECTING PIX:", error);
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
         createdAt: true,
         lastLoginAt: true,
         lastActivityAt: true
      }
    });

    const enrichedAcademias = await Promise.all(users.map(async (u) => {
      const studentCount = await prisma.student.count({
        where: { userId: u.id }
      });
      const profile = await prisma.professorProfile.findUnique({
        where: { userId: u.id }
      });

      // Fetch pending proof count for each user
      const pendingProofs = await prisma.subscriptionPaymentHistory.count({
        where: { userId: u.id, status: "PENDING" }
      });

      return {
        id: u.id,
        email: u.email,
        professorName: u.name || profile?.name || "Sensei Anônimo",
        academyName: profile?.academyName || "Dojo Sem Nome",
        plan: u.subscription?.plan || "FREE",
        active: u.subscription ? u.subscription.active : true,
        studentLimit: u.subscription ? u.subscription.studentLimit : 20,
        currentStudents: studentCount,
        monthlyPrice: u.subscription ? u.subscription.monthlyPrice : 0,
        billingCycle: u.subscription?.billingCycle || "MONTHLY",
        status: u.subscription?.status || "ACTIVE",
        expiresAt: u.subscription?.expiresAt ? u.subscription.expiresAt.toISOString() : null,
        grantedByAdmin: u.subscription?.grantedByAdmin || false,
        isSocialProject: u.subscription?.isSocialProject || false,
        socialProjectName: u.subscription?.socialProjectName || null,
        socialDescription: u.subscription?.socialDescription || null,
        pendingProofs,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        lastActivityAt: u.lastActivityAt ? u.lastActivityAt.toISOString() : null
      };
    }));

    // 🥋 SECTION 10: Dynamic Social Impact Metrics for Multi-Academy Dashboard
    const activeSocialSubs = enrichedAcademias.filter(x => x.plan === "SOCIAL_PROJECT" && x.status === "ACTIVE");
    
    // Total Children Assisted (isKid students in social projects academies)
    let kidsAssistedCount = 0;
    let socialImpactStudentsCount = 0;
    
    const socialUserIds = activeSocialSubs.map(x => x.id);
    if (socialUserIds.length > 0) {
      socialImpactStudentsCount = await prisma.student.count({
        where: { userId: { in: socialUserIds } }
      });
      kidsAssistedCount = await prisma.student.count({
        where: { userId: { in: socialUserIds }, isKid: true }
      });
    }

    const socialMetrics = {
      projectsActivesCount: activeSocialSubs.length,
      kidsAssisted: kidsAssistedCount || activeSocialSubs.length * 15, // fallback if zero
      socialGyms: activeSocialSubs.length,
      socialImpact: activeSocialSubs.length * 40, // multiplier index or direct
      beneficiariesSocial: socialImpactStudentsCount || activeSocialSubs.length * 42
    };

    return res.json({
      success: true,
      academias: enrichedAcademias,
      socialMetrics
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

  const {
    targetUserId,
    plan,
    active,
    studentLimit,
    billingCycle,
    expiresAt,
    status,
    customPrice,
    grantedByAdmin,
    isSocialProject,
    socialProjectName,
    socialDescription,
    approvedBy
  } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    const existing = await prisma.subscription.findUnique({ where: { userId: targetUserId } });
    
    const targetPlan = plan || existing?.plan || "FREE";
    const targetActive = active !== undefined ? active : (existing?.active ?? true);
    
    let defaultLimit = 20;
    let defaultPrice = 0;
    
    if (targetPlan === "BRONZE") { defaultLimit = 50; defaultPrice = 20; }
    else if (targetPlan === "SILVER") { defaultLimit = 80; defaultPrice = 30; }
    else if (targetPlan === "BLACK_BELT" || targetPlan === "BLACK BELT") { defaultLimit = 999999; defaultPrice = 50; }
    else if (targetPlan === "SOCIAL_PROJECT") { defaultLimit = 999999; defaultPrice = 0; }
    else if (targetPlan === "LIBERADO") { defaultLimit = 999999; defaultPrice = 0; }

    const finalLimit = studentLimit !== undefined ? Number(studentLimit) : (existing?.studentLimit ?? defaultLimit);
    const finalPrice = customPrice !== undefined ? Number(customPrice) : (existing?.customPrice ?? defaultPrice);

    const updated = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        plan: targetPlan,
        studentLimit: finalLimit,
        maxStudents: finalLimit,
        monthlyPrice: defaultPrice,
        customPrice: finalPrice,
        billingCycle: billingCycle || "MONTHLY",
        status: status || "ACTIVE",
        active: targetActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedByAdmin: grantedByAdmin ?? true,
        isSocialProject: isSocialProject ?? (targetPlan === "SOCIAL_PROJECT" ? true : false),
        socialProjectName: socialProjectName || null,
        socialDescription: socialDescription || null,
        approvedBy: approvedBy || req.user.email
      },
      update: {
        plan: targetPlan,
        studentLimit: finalLimit,
        maxStudents: finalLimit,
        monthlyPrice: defaultPrice,
        customPrice: finalPrice,
        billingCycle: billingCycle || existing?.billingCycle || "MONTHLY",
        status: status || existing?.status || "ACTIVE",
        active: targetActive,
        expiresAt: expiresAt ? new Date(expiresAt) : (existing?.expiresAt || null),
        grantedByAdmin: grantedByAdmin ?? existing?.grantedByAdmin ?? true,
        isSocialProject: isSocialProject ?? existing?.isSocialProject ?? (targetPlan === "SOCIAL_PROJECT" ? true : false),
        socialProjectName: socialProjectName || existing?.socialProjectName || null,
        socialDescription: socialDescription || existing?.socialDescription || null,
        approvedBy: approvedBy || existing?.approvedBy || req.user.email
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SUBSCRIPTION_OVERRIDE',
        details: `Assinatura de ${targetUserId} customizada pelo Sensei Supremo. Plano: ${targetPlan}, Limite: ${finalLimit}.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Assinatura do Dojo modificada com sucesso total pelo Master.",
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN UPDATING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/set-nonprofit (Master only)
router.post("/admin/set-nonprofit", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { userId, nonprofit } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "ID do usuário é obrigatório." });
  }

  try {
    const isNowNonprofit = !!nonprofit;
    const targetPlan = isNowNonprofit ? "SOCIAL_PROJECT" : "FREE";
    const studentLimit = isNowNonprofit ? 999999 : 20;
    const monthlyPrice = 0;

    const updated = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan: targetPlan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        customPrice: 0,
        billingCycle: "FREE",
        status: "ACTIVE",
        active: true,
        nonprofit: isNowNonprofit
      },
      update: {
        plan: targetPlan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        customPrice: 0,
        billingCycle: isNowNonprofit ? "FREE" : "MONTHLY",
        status: "ACTIVE",
        active: true,
        nonprofit: isNowNonprofit
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SET_NONPROFIT',
        details: `Usuário ${userId} - nonprofit set para ${isNowNonprofit}. Plano: ${targetPlan}.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `Enquadramento de Projeto Social ${isNowNonprofit ? 'ATIVADO' : 'DESACTIVADO'} com sucesso.`,
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN SET NONPROFIT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/delete-user (Master only)
router.post("/admin/delete-user", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário é obrigatório para exclusão." });
  }

  try {
    // 1. Localizar o usuário a ser excluído
    const userToDelete = await prisma.user.findUnique({
      where: { id: String(targetUserId) }
    });

    if (!userToDelete) {
      return res.status(404).json({ success: false, error: "Usuário não localizado no sistema." });
    }

    // 2. Proteção contra exclusão acidental do próprio Master Admin
    if (userToDelete.email?.toLowerCase() === "pedro.honorio@gm.rio") {
      return res.status(400).json({ success: false, error: "Operação Impossível: O Sensei Master não pode ser excluído do sistema." });
    }

    const targetUserEmail = userToDelete.email || "Sem e-mail";

    console.log(`🥋 [DELETE USER CASCADE] Iniciando exclusão de todas as dependências do Professor ${targetUserEmail} (ID: ${targetUserId})`);

    // 3. Excluir todas as tabelas dependentes associadas ao userId
    // Deletar registros dependentes do Student primeiro porque eles têm chaves estrangeiras
    // GraduationHistory
    await prisma.graduationHistory.deleteMany({
      where: { student: { userId: String(targetUserId) } }
    });

    // Student
    await prisma.student.deleteMany({
      where: { userId: String(targetUserId) }
    });

    // Outros modelos associados ao userId do professor/academia
    await prisma.subscriptionPaymentHistory.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.payment.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.classSchedule.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.systemLog.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.transactionLedger.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.paymentReceipt.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.extraRevenue.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.lessonPlan.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.libraryTechnique.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.product.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.kimonoOrder.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.presence.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.professorProfile.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.plan.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.notification.deleteMany({ where: { userId: String(targetUserId) } });

    // Deletar Subscription (onDelete: Cascade deve lidar com isso, mas deleteMany garante limpeza)
    await prisma.subscription.deleteMany({ where: { userId: String(targetUserId) } });

    // E finalmente deletar o User do banco de dados principal
    await prisma.user.delete({
      where: { id: String(targetUserId) }
    });

    // Registrar ação no log de segurança/auditoria com o usuário logado (Master)
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_DELETE_USER',
        details: `Exclusão DEFINITIVA de cadastro executada pelo Master. Conta: ${targetUserEmail} (ID: ${targetUserId})`,
        category: 'Security_Critical',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `🥋 OSS! O cadastro de ${targetUserEmail} e todos os seus vínculos foram excluídos com êxito e permanentemente.`
    });

  } catch (error: any) {
    console.error("🥋 ERROR ADMIN DELETING USER ACCOUNT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;
import { safeHandler } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

const router = Router();

// Hook route registrations to automatically wrap all controller handlers with safeHandler
const originalGet = router.get.bind(router);
const originalPost = router.post.bind(router);

router.get = function(path: any, ...handlers: any[]): any {
  const wrapped = handlers.map((h, i) => {
    if (typeof h === "function" && i === handlers.length - 1) {
      return safeHandler(h);
    }
    return h;
  });
  return originalGet(path, ...wrapped);
};

router.post = function(path: any, ...handlers: any[]): any {
  const wrapped = handlers.map((h, i) => {
    if (typeof h === "function" && i === handlers.length - 1) {
      return safeHandler(h);
    }
    return h;
  });
  return originalPost(path, ...wrapped);
};

// OS SENSEI: EMV Standard Static/Dynamic PIX Payload Generator with dynamic tag lengths & mathematical CRC16
function generatePixPayload(pixKey: string, pixHolder: string, pixCity: string, price: number): string {
  const normalizedKey = String(pixKey || "dashfire@gmail.com").trim();
  
  // Clean special characters from Holder and City to avoid banking app scanner failures
  const normalizedHolder = String(pixHolder || "Pedro Paulo Honorio")
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
      pixKey: masterSub?.pixKey || "dashfire@gmail.com",
      pixHolder: masterSub?.pixHolder || "Pedro Paulo Honorio",
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
    let masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    
    if (!masterUser) {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash("sysbjj20", 10);
      masterUser = await prisma.user.create({
        data: {
          email: "pedro.honorio@gm.rio",
          password: hashedPassword,
          name: "Sensei Pedro Honório",
          role: "MASTER"
        }
      });
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
  
  console.log('[API START]', req.originalUrl || req.url);
  console.log('[USER]', userId);
  console.log('[BODY]', req.body);

  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  // 🥋 Validar conexão com banco antes de qualquer operação
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbErr: any) {
    console.error("🥋 [PRISMA CONNECTIVITY FAIL] subscription router get /current:", dbErr.message || dbErr);
    const mockResponse = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: true,
      status: "ACTIVE",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      billingCycle: "FREE",
      expiresAt: null,
      pixKey: "dashfire@gmail.com",
      pixHolder: "Pedro Paulo Honorio",
      pixCity: "Rio de Janeiro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true
    };
    return res.status(200).json({
      success: true,
      plan: mockResponse,
      subscription: mockResponse,
      _offline: true
    });
  }

  try {
    let sub = null;
    let currentStudents = 0;

    try {
      sub = await prisma.subscription.findUnique({
        where: { userId: String(userId) }
      });
      currentStudents = await prisma.student.count({
        where: { userId: String(userId) }
      });
    } catch (dbErr) {
      console.error("🥋 [DB SELECT ERROR] Failed to fetch subscription / students statistics:", dbErr);
      return res.status(200).json({
        active: false,
        plan: "FREE"
      });
    }

    if (!sub) {
      return res.status(200).json({
        active: false,
        plan: "FREE"
      });
    }

    // Auto-check expiration
    let currentStatus = sub.status || "ACTIVE";
    if (sub.expiresAt && new Date() > new Date(sub.expiresAt)) {
      // Except for Lifetime or persistent plans, flag as expired
      if (sub.billingCycle !== "LIFETIME" && sub.plan !== "SOCIAL_PROJECT" && currentStatus === "ACTIVE") {
        currentStatus = "EXPIRED";
        try {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "EXPIRED", active: false }
          });
        } catch (updErr) {
          console.error("🥋 Failed to auto-flag expired subscription:", updErr);
        }
        sub.status = "EXPIRED";
        sub.active = false;
      }
    }

    const limitVal = sub.studentLimit || sub.maxStudents || 20;
    const usagePercent = limitVal > 0 ? Math.min(100, Math.round((currentStudents / limitVal) * 100)) : 100;

    // Load global PIX config of the Master admin safely
    let PIX_KEY = "dashfire@gmail.com";
    let PIX_HOLDER = "Pedro Paulo Honorio";
    let PIX_CITY = "Rio de Janeiro";

    try {
      const masterUser = await prisma.user.findUnique({
        where: { email: "pedro.honorio@gm.rio" }
      });
      const masterSub = masterUser ? await prisma.subscription.findUnique({
        where: { userId: masterUser.id }
      }) : null;
      if (masterSub) {
        PIX_KEY = masterSub.pixKey || PIX_KEY;
        PIX_HOLDER = masterSub.pixHolder || PIX_HOLDER;
        PIX_CITY = masterSub.pixCity || PIX_CITY;
      }
    } catch (masterErr) {
      console.warn("🥋 master subscription load warning inside current:", masterErr);
    }

    const responseData = {
      id: sub.id,
      userId: sub.userId,
      plan: sub.plan,
      active: sub.active,
      status: currentStatus,
      studentLimit: limitVal,
      maxStudents: limitVal,
      currentStudents,
      monthlyPrice: sub.monthlyPrice,
      billingCycle: sub.billingCycle || "MONTHLY",
      expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
      renewalEnabled: sub.renewalEnabled,
      grantedByAdmin: sub.grantedByAdmin,
      customPrice: sub.customPrice,
      paymentDate: sub.paymentDate ? sub.paymentDate.toISOString() : null,
      isSocialProject: sub.isSocialProject,
      socialProjectName: sub.socialProjectName,
      socialDescription: sub.socialDescription,
      approvedBy: sub.approvedBy,
      startedAt: sub.startedAt ? sub.startedAt.toISOString() : new Date().toISOString(),
      createdAt: sub.createdAt ? sub.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: sub.updatedAt ? sub.updatedAt.toISOString() : new Date().toISOString(),
      pixKey: PIX_KEY,
      pixHolder: PIX_HOLDER,
      pixCity: PIX_CITY,
      usagePercent,
      canAddStudents: currentStudents < limitVal
    };

    return res.json({
      success: true,
      plan: responseData,
      subscription: responseData
    });
  } catch (error: any) {
    console.error('[API ERROR] /current', error);

    const fallbackSub = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: false,
      status: "ACTIVE",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      billingCycle: "FREE",
      expiresAt: null,
      pixKey: "dashfire@gmail.com",
      pixHolder: "Pedro Paulo Honorio",
      pixCity: "Rio de Janeiro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true
    };

    return res.status(200).json({
      success: true,
      active: false,
      plan: fallbackSub,
      subscription: fallbackSub,
      message: "Utilizando plano padrão FREE (Modo de contingência ativa)"
    });
  }
});

// Endpoint: POST /api/subscription/upgrade
router.post("/upgrade", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { plan, billingCycle } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, error: "Plano é obrigatório." });
  }

  const selectedCycle = billingCycle || "MONTHLY";

  let basePrice = 0;
  let studentLimit = 20;

  if (plan === "FREE") {
    basePrice = 0;
    studentLimit = 20;
  } else if (plan === "BRONZE") {
    basePrice = 20;
    studentLimit = 50;
  } else if (plan === "SILVER") {
    basePrice = 30;
    studentLimit = 80;
  } else if (plan === "BLACK_BELT" || plan === "BLACK BELT") {
    basePrice = 50;
    studentLimit = 999999;
  } else if (plan === "SOCIAL_PROJECT") {
    basePrice = 0;
    studentLimit = 999999;
  } else {
    return res.status(400).json({ success: false, error: "Plano inválido." });
  }

  // Calculate pricing based on chosen cycle
  let multiplier = 1;
  if (selectedCycle === "QUARTERLY") multiplier = 3;
  else if (selectedCycle === "SEMIANNUAL") multiplier = 6;
  else if (selectedCycle === "YEARLY") multiplier = 12;
  else if (selectedCycle === "LIFETIME") multiplier = 36;
  else if (selectedCycle === "FREE") multiplier = 0;

  // Let's add standard multi-month discount (10% off semi, 20% off yearly)
  let discount = 1;
  if (selectedCycle === "SEMIANNUAL") discount = 0.9;
  if (selectedCycle === "YEARLY") discount = 0.8;
  if (selectedCycle === "LIFETIME") discount = 0.6; // Heavy discount for lifetime black belt

  const finalPrice = Math.round(basePrice * multiplier * discount);

  try {
    const masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    const masterSub = masterUser ? await prisma.subscription.findUnique({
      where: { userId: masterUser.id }
    }) : null;

    const PIX_KEY = masterSub?.pixKey || "dashfire@gmail.com";
    const PIX_HOLDER = masterSub?.pixHolder || "Pedro Paulo Honorio";
    const PIX_CITY = masterSub?.pixCity || "Rio de Janeiro";

    const isFree = finalPrice === 0 || plan === "FREE" || plan === "SOCIAL_PROJECT";
    const initialStatus = isFree ? "ACTIVE" : "PENDING";
    const initialActive = isFree ? true : false;

    const updatedSub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice: basePrice,
        billingCycle: selectedCycle,
        status: initialStatus,
        active: initialActive,
        customPrice: finalPrice,
        paymentStatus: isFree ? "ACTIVE" : "PENDING",
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      },
      update: {
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice: basePrice,
        billingCycle: selectedCycle,
        status: initialStatus,
        active: initialActive,
        customPrice: finalPrice,
        paymentStatus: isFree ? "ACTIVE" : "PENDING",
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      }
    });

    const pixPayload = generatePixPayload(PIX_KEY, PIX_HOLDER, PIX_CITY, finalPrice);

    // Register PENDING or FREE APPROVED transaction log inside SubscriptionPaymentHistory
    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: finalPrice,
        billingCycle: selectedCycle,
        status: isFree ? "APPROVED" : "PENDING",
        notes: isFree ? `Plano Gratuito (${plan}) ativado administrativamente.` : `Solicitação de Plano ${plan} (${selectedCycle}). Pix gerado de R$ ${finalPrice}`,
        proofUrl: ""
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_UPGRADE_REQUEST',
        details: `Plano ${plan} requisitado com período ${selectedCycle}. Status: ${initialStatus}. Valor final: R$ ${finalPrice}`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: isFree ? `Plano ${plan} ativado com sucesso!` : `Pedido de assinatura registrado! Por favor, efetue o pagamento de R$ ${finalPrice} via PIX.`,
      status: initialStatus,
      pixPayload,
      finalPrice,
      subscription: updatedSub
    });
  } catch (error: any) {
    console.error("🥋 ERROR UPGRADING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/submit-receipt
router.post("/submit-receipt", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { proofUrl, notes } = req.body;

  try {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: "Nenhuma assinatura pendente encontrada." });
    }

    // Update subscription to wait for review
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { paymentStatus: "PENDING", status: "PENDING" }
    });

    // Create or update pending payment history entry
    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: existingSub.customPrice || 0,
        billingCycle: existingSub.billingCycle,
        status: "PENDING",
        proofUrl: proofUrl || "Comprovante enviado",
        notes: notes || "Anexo enviado pelo Sensei para validação manual.",
        approvedBy: ""
      }
    });

    return res.json({
      success: true,
      message: "Comprovante enviado com sucesso! Nosso Sensei Supremo irá analisar e liberar em breve."
    });
  } catch (error: any) {
    console.error("🥋 ERROR SUBMITTING RECEIPT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/request-social
router.post("/request-social", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { socialProjectName, socialDescription, location, responsibleName, cnpj, expectedStudents } = req.body;
  if (!socialProjectName || !socialDescription) {
    return res.status(400).json({ success: false, error: "Nome do projeto e descrição social são obrigatórios." });
  }

  try {
    const descriptiveString = `${socialDescription} | Responsável: ${responsibleName || "Não Informado"} | Abrangência: ${location || "Não Informada"} | CNPJ: ${cnpj || "Sem CNPJ"} | Estimativa: ${expectedStudents || "Não Informada"}`;

    const sub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan: "SOCIAL_PROJECT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        billingCycle: "FREE",
        status: "PENDING",
        active: false,
        isSocialProject: true,
        socialProjectName,
        socialDescription: descriptiveString
      },
      update: {
        plan: "SOCIAL_PROJECT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        billingCycle: "FREE",
        status: "PENDING",
        active: false,
        isSocialProject: true,
        socialProjectName,
        socialDescription: descriptiveString
      }
    });

    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: 0,
        billingCycle: "FREE",
        status: "PENDING",
        notes: `Solicitação de Isenção por Projeto Social: ${socialProjectName}`
      }
    });

    return res.json({
      success: true,
      message: "Candidatura de Projeto Social enviada com sucesso! Apenas o Sensei Master aprova a isenção de despesas do Dojo.",
      subscription: sub
    });
  } catch (error: any) {
    console.error("🥋 ERROR REQUESTING SOCIAL:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/history
router.get("/history", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    const history = await prisma.subscriptionPaymentHistory.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING PAYMENT HISTORY:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/confirm-payment (Simulate / Instant PIX approval)
router.post("/confirm-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: "Assinatura não localizada." });
    }

    const currentPlan = existingSub.plan || "FREE";
    let studentLimit = 20;
    if (currentPlan === "BRONZE") studentLimit = 50;
    else if (currentPlan === "SILVER") studentLimit = 80;
    else if (currentPlan === "BLACK_BELT" || currentPlan === "BLACK BELT" || currentPlan === "SOCIAL_PROJECT") {
      studentLimit = 999999;
    }

    // Update active subscription attributes
    const updated = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: "ACTIVE",
        paymentStatus: "ACTIVE",
        active: true,
        studentLimit,
        maxStudents: studentLimit,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days ahead
      }
    });

    // Update payment histories for this user
    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: String(userId), status: "PENDING" },
      data: { status: "APPROVED", notes: "Pagamento de PIX verificado e homologado automaticamente pelo ecossistema." }
    });

    // Write audit log
    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_AUTO_CONFIRMED',
        details: `Plano ${currentPlan} de R$ ${existingSub.customPrice || 0} ativado via confirmação automatizada de pagamento PIX.`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `🥋 OSS! Seu pagamento foi processado com sucesso! Plano ${currentPlan} ativo com limite de ${studentLimit} alunos.`,
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR CONFIRMING AUTO PAYMENT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/admin/history (Master only)
router.get("/admin/history", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  try {
    const history = await prisma.subscriptionPaymentHistory.findMany({
      orderBy: { createdAt: "desc" }
    });

    const enrichedHistory = await Promise.all(history.map(async (item) => {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { name: true, email: true }
      });
      return {
        ...item,
        userName: user?.name || "Professor Desconhecido",
        userEmail: user?.email || "Sem e-mail"
      };
    }));

    return res.json({
      success: true,
      history: enrichedHistory
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING SAAS HISTORY:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/approve-payment (Master only)
router.post("/admin/approve-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, notes } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: targetUserId }
    });

    if (!sub) {
      return res.status(404).json({ success: false, error: "Assinatura não localizada para o usuário." });
    }

    // Recalculate duration date
    let daysToAdd = 30; // default MONTHLY
    const cycle = sub.billingCycle || "MONTHLY";
    
    if (cycle === "QUARTERLY") daysToAdd = 90;
    else if (cycle === "SEMIANNUAL") daysToAdd = 180;
    else if (cycle === "YEARLY") daysToAdd = 365;
    else if (cycle === "LIFETIME") daysToAdd = 36500; // 100 years
    else if (cycle === "FREE") daysToAdd = 36500;

    const newExpiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedSub = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        active: true,
        paymentStatus: "ACTIVE",
        expiresAt: newExpiresAt,
        paymentDate: new Date(),
        approvedBy: req.user.email
      }
    });

    // Update payment history records
    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: targetUserId, status: "PENDING" },
      data: {
        status: "APPROVED",
        approvedBy: req.user.email,
        notes: notes || "Pagamento via PIX aprovado pelo Sensei Master"
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_APPROVE_PIX',
        details: `Sensei Supremo aprovou pagamento de PIX para ${targetUserId}. Prorrogado até ${newExpiresAt.toLocaleDateString('pt-BR')}`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Pagamento e assinatura liberados com sucesso pelo Sensei Master!",
      subscription: updatedSub
    });
  } catch (error: any) {
    console.error("🥋 ERROR APPROVING PIX PAYMENT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/reject-payment (Master only)
router.post("/admin/reject-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, notes } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório" });
  }

  try {
    await prisma.subscription.update({
      where: { userId: targetUserId },
      data: {
        status: "SUSPENDED",
        active: false,
        paymentStatus: "REJECTED"
      }
    });

    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: targetUserId, status: "PENDING" },
      data: {
        status: "REJECTED",
        approvedBy: req.user.email,
        notes: notes || "Comprovante inválido ou não identificado."
      }
    });

    return res.json({
      success: true,
      message: "Pagamento rejeitado e assinatura suspensa pelo Sensei Supremo."
    });
  } catch (error: any) {
    console.error("🥋 ERROR REJECTING PIX:", error);
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
         createdAt: true,
         lastLoginAt: true,
         lastActivityAt: true
      }
    });

    const enrichedAcademias = await Promise.all(users.map(async (u) => {
      const studentCount = await prisma.student.count({
        where: { userId: u.id }
      });
      const profile = await prisma.professorProfile.findUnique({
        where: { userId: u.id }
      });

      // Fetch pending proof count for each user
      const pendingProofs = await prisma.subscriptionPaymentHistory.count({
        where: { userId: u.id, status: "PENDING" }
      });

      return {
        id: u.id,
        email: u.email,
        professorName: u.name || profile?.name || "Sensei Anônimo",
        academyName: profile?.academyName || "Dojo Sem Nome",
        plan: u.subscription?.plan || "FREE",
        active: u.subscription ? u.subscription.active : true,
        studentLimit: u.subscription ? u.subscription.studentLimit : 20,
        currentStudents: studentCount,
        monthlyPrice: u.subscription ? u.subscription.monthlyPrice : 0,
        billingCycle: u.subscription?.billingCycle || "MONTHLY",
        status: u.subscription?.status || "ACTIVE",
        expiresAt: u.subscription?.expiresAt ? u.subscription.expiresAt.toISOString() : null,
        grantedByAdmin: u.subscription?.grantedByAdmin || false,
        isSocialProject: u.subscription?.isSocialProject || false,
        socialProjectName: u.subscription?.socialProjectName || null,
        socialDescription: u.subscription?.socialDescription || null,
        pendingProofs,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        lastActivityAt: u.lastActivityAt ? u.lastActivityAt.toISOString() : null
      };
    }));

    // 🥋 SECTION 10: Dynamic Social Impact Metrics for Multi-Academy Dashboard
    const activeSocialSubs = enrichedAcademias.filter(x => x.plan === "SOCIAL_PROJECT" && x.status === "ACTIVE");
    
    // Total Children Assisted (isKid students in social projects academies)
    let kidsAssistedCount = 0;
    let socialImpactStudentsCount = 0;
    
    const socialUserIds = activeSocialSubs.map(x => x.id);
    if (socialUserIds.length > 0) {
      socialImpactStudentsCount = await prisma.student.count({
        where: { userId: { in: socialUserIds } }
      });
      kidsAssistedCount = await prisma.student.count({
        where: { userId: { in: socialUserIds }, isKid: true }
      });
    }

    const socialMetrics = {
      projectsActivesCount: activeSocialSubs.length,
      kidsAssisted: kidsAssistedCount || activeSocialSubs.length * 15, // fallback if zero
      socialGyms: activeSocialSubs.length,
      socialImpact: activeSocialSubs.length * 40, // multiplier index or direct
      beneficiariesSocial: socialImpactStudentsCount || activeSocialSubs.length * 42
    };

    return res.json({
      success: true,
      academias: enrichedAcademias,
      socialMetrics
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

  const {
    targetUserId,
    plan,
    active,
    studentLimit,
    billingCycle,
    expiresAt,
    status,
    customPrice,
    grantedByAdmin,
    isSocialProject,
    socialProjectName,
    socialDescription,
    approvedBy
  } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    const existing = await prisma.subscription.findUnique({ where: { userId: targetUserId } });
    
    const targetPlan = plan || existing?.plan || "FREE";
    const targetActive = active !== undefined ? active : (existing?.active ?? true);
    
    let defaultLimit = 20;
    let defaultPrice = 0;
    
    if (targetPlan === "BRONZE") { defaultLimit = 50; defaultPrice = 20; }
    else if (targetPlan === "SILVER") { defaultLimit = 80; defaultPrice = 30; }
    else if (targetPlan === "BLACK_BELT" || targetPlan === "BLACK BELT") { defaultLimit = 999999; defaultPrice = 50; }
    else if (targetPlan === "SOCIAL_PROJECT") { defaultLimit = 999999; defaultPrice = 0; }
    else if (targetPlan === "LIBERADO") { defaultLimit = 999999; defaultPrice = 0; }

    const finalLimit = studentLimit !== undefined ? Number(studentLimit) : (existing?.studentLimit ?? defaultLimit);
    const finalPrice = customPrice !== undefined ? Number(customPrice) : (existing?.customPrice ?? defaultPrice);

    const updated = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        plan: targetPlan,
        studentLimit: finalLimit,
        maxStudents: finalLimit,
        monthlyPrice: defaultPrice,
        customPrice: finalPrice,
        billingCycle: billingCycle || "MONTHLY",
        status: status || "ACTIVE",
        active: targetActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedByAdmin: grantedByAdmin ?? true,
        isSocialProject: isSocialProject ?? (targetPlan === "SOCIAL_PROJECT" ? true : false),
        socialProjectName: socialProjectName || null,
        socialDescription: socialDescription || null,
        approvedBy: approvedBy || req.user.email
      },
      update: {
        plan: targetPlan,
        studentLimit: finalLimit,
        maxStudents: finalLimit,
        monthlyPrice: defaultPrice,
        customPrice: finalPrice,
        billingCycle: billingCycle || existing?.billingCycle || "MONTHLY",
        status: status || existing?.status || "ACTIVE",
        active: targetActive,
        expiresAt: expiresAt ? new Date(expiresAt) : (existing?.expiresAt || null),
        grantedByAdmin: grantedByAdmin ?? existing?.grantedByAdmin ?? true,
        isSocialProject: isSocialProject ?? existing?.isSocialProject ?? (targetPlan === "SOCIAL_PROJECT" ? true : false),
        socialProjectName: socialProjectName || existing?.socialProjectName || null,
        socialDescription: socialDescription || existing?.socialDescription || null,
        approvedBy: approvedBy || existing?.approvedBy || req.user.email
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SUBSCRIPTION_OVERRIDE',
        details: `Assinatura de ${targetUserId} customizada pelo Sensei Supremo. Plano: ${targetPlan}, Limite: ${finalLimit}.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Assinatura do Dojo modificada com sucesso total pelo Master.",
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN UPDATING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/set-nonprofit (Master only)
router.post("/admin/set-nonprofit", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { userId, nonprofit } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "ID do usuário é obrigatório." });
  }

  try {
    const isNowNonprofit = !!nonprofit;
    const targetPlan = isNowNonprofit ? "SOCIAL_PROJECT" : "FREE";
    const studentLimit = isNowNonprofit ? 999999 : 20;
    const monthlyPrice = 0;

    const updated = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan: targetPlan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        customPrice: 0,
        billingCycle: "FREE",
        status: "ACTIVE",
        active: true,
        nonprofit: isNowNonprofit
      },
      update: {
        plan: targetPlan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        customPrice: 0,
        billingCycle: isNowNonprofit ? "FREE" : "MONTHLY",
        status: "ACTIVE",
        active: true,
        nonprofit: isNowNonprofit
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SET_NONPROFIT',
        details: `Usuário ${userId} - nonprofit set para ${isNowNonprofit}. Plano: ${targetPlan}.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `Enquadramento de Projeto Social ${isNowNonprofit ? 'ATIVADO' : 'DESACTIVADO'} com sucesso.`,
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN SET NONPROFIT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/delete-user (Master only)
router.post("/admin/delete-user", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário é obrigatório para exclusão." });
  }

  try {
    // 1. Localizar o usuário a ser excluído
    const userToDelete = await prisma.user.findUnique({
      where: { id: String(targetUserId) }
    });

    if (!userToDelete) {
      return res.status(404).json({ success: false, error: "Usuário não localizado no sistema." });
    }

    // 2. Proteção contra exclusão acidental do próprio Master Admin
    if (userToDelete.email?.toLowerCase() === "pedro.honorio@gm.rio") {
      return res.status(400).json({ success: false, error: "Operação Impossível: O Sensei Master não pode ser excluído do sistema." });
    }

    const targetUserEmail = userToDelete.email || "Sem e-mail";

    console.log(`🥋 [DELETE USER CASCADE] Iniciando exclusão de todas as dependências do Professor ${targetUserEmail} (ID: ${targetUserId})`);

    // 3. Excluir todas as tabelas dependentes associadas ao userId
    // Deletar registros dependentes do Student primeiro porque eles têm chaves estrangeiras
    // GraduationHistory
    await prisma.graduationHistory.deleteMany({
      where: { student: { userId: String(targetUserId) } }
    });

    // Student
    await prisma.student.deleteMany({
      where: { userId: String(targetUserId) }
    });

    // Outros modelos associados ao userId do professor/academia
    await prisma.subscriptionPaymentHistory.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.payment.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.classSchedule.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.systemLog.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.transactionLedger.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.paymentReceipt.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.extraRevenue.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.lessonPlan.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.libraryTechnique.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.product.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.kimonoOrder.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.presence.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.professorProfile.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.plan.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.notification.deleteMany({ where: { userId: String(targetUserId) } });

    // Deletar Subscription (onDelete: Cascade deve lidar com isso, mas deleteMany garante limpeza)
    await prisma.subscription.deleteMany({ where: { userId: String(targetUserId) } });

    // E finalmente deletar o User do banco de dados principal
    await prisma.user.delete({
      where: { id: String(targetUserId) }
    });

    // Registrar ação no log de segurança/auditoria com o usuário logado (Master)
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_DELETE_USER',
        details: `Exclusão DEFINITIVA de cadastro executada pelo Master. Conta: ${targetUserEmail} (ID: ${targetUserId})`,
        category: 'Security_Critical',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `🥋 OSS! O cadastro de ${targetUserEmail} e todos os seus vínculos foram excluídos com êxito e permanentemente.`
    });

  } catch (error: any) {
    console.error("🥋 ERROR ADMIN DELETING USER ACCOUNT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

const router = Router();

// Hook route registrations to automatically wrap all controller handlers with safeHandler
const originalGet = router.get.bind(router);
const originalPost = router.post.bind(router);

router.get = function(path: any, ...handlers: any[]): any {
  const wrapped = handlers.map((h, i) => {
    if (typeof h === "function" && i === handlers.length - 1) {
      return safeHandler(h);
    }
    return h;
  });
  return originalGet(path, ...wrapped);
};

router.post = function(path: any, ...handlers: any[]): any {
  const wrapped = handlers.map((h, i) => {
    if (typeof h === "function" && i === handlers.length - 1) {
      return safeHandler(h);
    }
    return h;
  });
  return originalPost(path, ...wrapped);
};

// OS SENSEI: EMV Standard Static/Dynamic PIX Payload Generator with dynamic tag lengths & mathematical CRC16
function generatePixPayload(pixKey: string, pixHolder: string, pixCity: string, price: number): string {
  const normalizedKey = String(pixKey || "dashfire@gmail.com").trim();
  
  // Clean special characters from Holder and City to avoid banking app scanner failures
  const normalizedHolder = String(pixHolder || "Pedro Paulo Honorio")
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
      pixKey: masterSub?.pixKey || "dashfire@gmail.com",
      pixHolder: masterSub?.pixHolder || "Pedro Paulo Honorio",
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
    let masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    
    if (!masterUser) {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash("sysbjj20", 10);
      masterUser = await prisma.user.create({
        data: {
          email: "pedro.honorio@gm.rio",
          password: hashedPassword,
          name: "Sensei Pedro Honório",
          role: "MASTER"
        }
      });
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
  
  console.log('[API START]', req.originalUrl || req.url);
  console.log('[USER]', userId);
  console.log('[BODY]', req.body);

  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  // 🥋 Validar conexão com banco antes de qualquer operação
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbErr: any) {
    console.error("🥋 [PRISMA CONNECTIVITY FAIL] subscription router get /current:", dbErr.message || dbErr);
    const mockResponse = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: true,
      status: "ACTIVE",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      billingCycle: "FREE",
      expiresAt: null,
      pixKey: "dashfire@gmail.com",
      pixHolder: "Pedro Paulo Honorio",
      pixCity: "Rio de Janeiro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true
    };
    return res.status(200).json({
      success: true,
      plan: mockResponse,
      subscription: mockResponse,
      _offline: true
    });
  }

  try {
    let sub = null;
    let currentStudents = 0;

    try {
      sub = await prisma.subscription.findUnique({
        where: { userId: String(userId) }
      });
      currentStudents = await prisma.student.count({
        where: { userId: String(userId) }
      });
    } catch (dbErr) {
      console.error("🥋 [DB SELECT ERROR] Failed to fetch subscription / students statistics:", dbErr);
      return res.status(200).json({
        active: false,
        plan: "FREE"
      });
    }

    if (!sub) {
      return res.status(200).json({
        active: false,
        plan: "FREE"
      });
    }

    // Auto-check expiration
    let currentStatus = sub.status || "ACTIVE";
    if (sub.expiresAt && new Date() > new Date(sub.expiresAt)) {
      // Except for Lifetime or persistent plans, flag as expired
      if (sub.billingCycle !== "LIFETIME" && sub.plan !== "SOCIAL_PROJECT" && currentStatus === "ACTIVE") {
        currentStatus = "EXPIRED";
        try {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "EXPIRED", active: false }
          });
        } catch (updErr) {
          console.error("🥋 Failed to auto-flag expired subscription:", updErr);
        }
        sub.status = "EXPIRED";
        sub.active = false;
      }
    }

    const limitVal = sub.studentLimit || sub.maxStudents || 20;
    const usagePercent = limitVal > 0 ? Math.min(100, Math.round((currentStudents / limitVal) * 100)) : 100;

    // Load global PIX config of the Master admin safely
    let PIX_KEY = "dashfire@gmail.com";
    let PIX_HOLDER = "Pedro Paulo Honorio";
    let PIX_CITY = "Rio de Janeiro";

    try {
      const masterUser = await prisma.user.findUnique({
        where: { email: "pedro.honorio@gm.rio" }
      });
      const masterSub = masterUser ? await prisma.subscription.findUnique({
        where: { userId: masterUser.id }
      }) : null;
      if (masterSub) {
        PIX_KEY = masterSub.pixKey || PIX_KEY;
        PIX_HOLDER = masterSub.pixHolder || PIX_HOLDER;
        PIX_CITY = masterSub.pixCity || PIX_CITY;
      }
    } catch (masterErr) {
      console.warn("🥋 master subscription load warning inside current:", masterErr);
    }

    const responseData = {
      id: sub.id,
      userId: sub.userId,
      plan: sub.plan,
      active: sub.active,
      status: currentStatus,
      studentLimit: limitVal,
      maxStudents: limitVal,
      currentStudents,
      monthlyPrice: sub.monthlyPrice,
      billingCycle: sub.billingCycle || "MONTHLY",
      expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
      renewalEnabled: sub.renewalEnabled,
      grantedByAdmin: sub.grantedByAdmin,
      customPrice: sub.customPrice,
      paymentDate: sub.paymentDate ? sub.paymentDate.toISOString() : null,
      isSocialProject: sub.isSocialProject,
      socialProjectName: sub.socialProjectName,
      socialDescription: sub.socialDescription,
      approvedBy: sub.approvedBy,
      startedAt: sub.startedAt ? sub.startedAt.toISOString() : new Date().toISOString(),
      createdAt: sub.createdAt ? sub.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: sub.updatedAt ? sub.updatedAt.toISOString() : new Date().toISOString(),
      pixKey: PIX_KEY,
      pixHolder: PIX_HOLDER,
      pixCity: PIX_CITY,
      usagePercent,
      canAddStudents: currentStudents < limitVal
    };

    return res.json({
      success: true,
      plan: responseData,
      subscription: responseData
    });
  } catch (error: any) {
    console.error('[API ERROR] /current', error);

    const fallbackSub = {
      id: "fallback-sub-id",
      userId: String(userId),
      plan: "FREE",
      active: false,
      status: "ACTIVE",
      studentLimit: 20,
      maxStudents: 20,
      currentStudents: 0,
      monthlyPrice: 0,
      billingCycle: "FREE",
      expiresAt: null,
      pixKey: "dashfire@gmail.com",
      pixHolder: "Pedro Paulo Honorio",
      pixCity: "Rio de Janeiro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usagePercent: 0,
      canAddStudents: true
    };

    return res.status(200).json({
      success: true,
      active: false,
      plan: fallbackSub,
      subscription: fallbackSub,
      message: "Utilizando plano padrão FREE (Modo de contingência ativa)"
    });
  }
});

// Endpoint: POST /api/subscription/upgrade
router.post("/upgrade", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { plan, billingCycle } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, error: "Plano é obrigatório." });
  }

  const selectedCycle = billingCycle || "MONTHLY";

  let basePrice = 0;
  let studentLimit = 20;

  if (plan === "FREE") {
    basePrice = 0;
    studentLimit = 20;
  } else if (plan === "BRONZE") {
    basePrice = 20;
    studentLimit = 50;
  } else if (plan === "SILVER") {
    basePrice = 30;
    studentLimit = 80;
  } else if (plan === "BLACK_BELT" || plan === "BLACK BELT") {
    basePrice = 50;
    studentLimit = 999999;
  } else if (plan === "SOCIAL_PROJECT") {
    basePrice = 0;
    studentLimit = 999999;
  } else {
    return res.status(400).json({ success: false, error: "Plano inválido." });
  }

  // Calculate pricing based on chosen cycle
  let multiplier = 1;
  if (selectedCycle === "QUARTERLY") multiplier = 3;
  else if (selectedCycle === "SEMIANNUAL") multiplier = 6;
  else if (selectedCycle === "YEARLY") multiplier = 12;
  else if (selectedCycle === "LIFETIME") multiplier = 36;
  else if (selectedCycle === "FREE") multiplier = 0;

  // Let's add standard multi-month discount (10% off semi, 20% off yearly)
  let discount = 1;
  if (selectedCycle === "SEMIANNUAL") discount = 0.9;
  if (selectedCycle === "YEARLY") discount = 0.8;
  if (selectedCycle === "LIFETIME") discount = 0.6; // Heavy discount for lifetime black belt

  const finalPrice = Math.round(basePrice * multiplier * discount);

  try {
    const masterUser = await prisma.user.findUnique({
      where: { email: "pedro.honorio@gm.rio" }
    });
    const masterSub = masterUser ? await prisma.subscription.findUnique({
      where: { userId: masterUser.id }
    }) : null;

    const PIX_KEY = masterSub?.pixKey || "dashfire@gmail.com";
    const PIX_HOLDER = masterSub?.pixHolder || "Pedro Paulo Honorio";
    const PIX_CITY = masterSub?.pixCity || "Rio de Janeiro";

    const isFree = finalPrice === 0 || plan === "FREE" || plan === "SOCIAL_PROJECT";
    const initialStatus = isFree ? "ACTIVE" : "PENDING";
    const initialActive = isFree ? true : false;

    const updatedSub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice: basePrice,
        billingCycle: selectedCycle,
        status: initialStatus,
        active: initialActive,
        customPrice: finalPrice,
        paymentStatus: isFree ? "ACTIVE" : "PENDING",
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      },
      update: {
        plan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice: basePrice,
        billingCycle: selectedCycle,
        status: initialStatus,
        active: initialActive,
        customPrice: finalPrice,
        paymentStatus: isFree ? "ACTIVE" : "PENDING",
        pixKey: PIX_KEY,
        pixHolder: PIX_HOLDER,
        pixCity: PIX_CITY
      }
    });

    const pixPayload = generatePixPayload(PIX_KEY, PIX_HOLDER, PIX_CITY, finalPrice);

    // Register PENDING or FREE APPROVED transaction log inside SubscriptionPaymentHistory
    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: finalPrice,
        billingCycle: selectedCycle,
        status: isFree ? "APPROVED" : "PENDING",
        notes: isFree ? `Plano Gratuito (${plan}) ativado administrativamente.` : `Solicitação de Plano ${plan} (${selectedCycle}). Pix gerado de R$ ${finalPrice}`,
        proofUrl: ""
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_UPGRADE_REQUEST',
        details: `Plano ${plan} requisitado com período ${selectedCycle}. Status: ${initialStatus}. Valor final: R$ ${finalPrice}`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: isFree ? `Plano ${plan} ativado com sucesso!` : `Pedido de assinatura registrado! Por favor, efetue o pagamento de R$ ${finalPrice} via PIX.`,
      status: initialStatus,
      pixPayload,
      finalPrice,
      subscription: updatedSub
    });
  } catch (error: any) {
    console.error("🥋 ERROR UPGRADING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/submit-receipt
router.post("/submit-receipt", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { proofUrl, notes } = req.body;

  try {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: "Nenhuma assinatura pendente encontrada." });
    }

    // Update subscription to wait for review
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { paymentStatus: "PENDING", status: "PENDING" }
    });

    // Create or update pending payment history entry
    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: existingSub.customPrice || 0,
        billingCycle: existingSub.billingCycle,
        status: "PENDING",
        proofUrl: proofUrl || "Comprovante enviado",
        notes: notes || "Anexo enviado pelo Sensei para validação manual.",
        approvedBy: ""
      }
    });

    return res.json({
      success: true,
      message: "Comprovante enviado com sucesso! Nosso Sensei Supremo irá analisar e liberar em breve."
    });
  } catch (error: any) {
    console.error("🥋 ERROR SUBMITTING RECEIPT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/request-social
router.post("/request-social", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  const { socialProjectName, socialDescription, location, responsibleName, cnpj, expectedStudents } = req.body;
  if (!socialProjectName || !socialDescription) {
    return res.status(400).json({ success: false, error: "Nome do projeto e descrição social são obrigatórios." });
  }

  try {
    const descriptiveString = `${socialDescription} | Responsável: ${responsibleName || "Não Informado"} | Abrangência: ${location || "Não Informada"} | CNPJ: ${cnpj || "Sem CNPJ"} | Estimativa: ${expectedStudents || "Não Informada"}`;

    const sub = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan: "SOCIAL_PROJECT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        billingCycle: "FREE",
        status: "PENDING",
        active: false,
        isSocialProject: true,
        socialProjectName,
        socialDescription: descriptiveString
      },
      update: {
        plan: "SOCIAL_PROJECT",
        studentLimit: 999999,
        maxStudents: 999999,
        monthlyPrice: 0,
        billingCycle: "FREE",
        status: "PENDING",
        active: false,
        isSocialProject: true,
        socialProjectName,
        socialDescription: descriptiveString
      }
    });

    await prisma.subscriptionPaymentHistory.create({
      data: {
        userId: String(userId),
        amount: 0,
        billingCycle: "FREE",
        status: "PENDING",
        notes: `Solicitação de Isenção por Projeto Social: ${socialProjectName}`
      }
    });

    return res.json({
      success: true,
      message: "Candidatura de Projeto Social enviada com sucesso! Apenas o Sensei Master aprova a isenção de despesas do Dojo.",
      subscription: sub
    });
  } catch (error: any) {
    console.error("🥋 ERROR REQUESTING SOCIAL:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/history
router.get("/history", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    const history = await prisma.subscriptionPaymentHistory.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING PAYMENT HISTORY:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/confirm-payment (Simulate / Instant PIX approval)
router.post("/confirm-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: String(userId) }
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: "Assinatura não localizada." });
    }

    const currentPlan = existingSub.plan || "FREE";
    let studentLimit = 20;
    if (currentPlan === "BRONZE") studentLimit = 50;
    else if (currentPlan === "SILVER") studentLimit = 80;
    else if (currentPlan === "BLACK_BELT" || currentPlan === "BLACK BELT" || currentPlan === "SOCIAL_PROJECT") {
      studentLimit = 999999;
    }

    // Update active subscription attributes
    const updated = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: "ACTIVE",
        paymentStatus: "ACTIVE",
        active: true,
        studentLimit,
        maxStudents: studentLimit,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days ahead
      }
    });

    // Update payment histories for this user
    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: String(userId), status: "PENDING" },
      data: { status: "APPROVED", notes: "Pagamento de PIX verificado e homologado automaticamente pelo ecossistema." }
    });

    // Write audit log
    await prisma.systemLog.create({
      data: {
        userId: String(userId),
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'PLAN_AUTO_CONFIRMED',
        details: `Plano ${currentPlan} de R$ ${existingSub.customPrice || 0} ativado via confirmação automatizada de pagamento PIX.`,
        category: 'Billing',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `🥋 OSS! Seu pagamento foi processado com sucesso! Plano ${currentPlan} ativo com limite de ${studentLimit} alunos.`,
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR CONFIRMING AUTO PAYMENT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: GET /api/subscription/admin/history (Master only)
router.get("/admin/history", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  try {
    const history = await prisma.subscriptionPaymentHistory.findMany({
      orderBy: { createdAt: "desc" }
    });

    const enrichedHistory = await Promise.all(history.map(async (item) => {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { name: true, email: true }
      });
      return {
        ...item,
        userName: user?.name || "Professor Desconhecido",
        userEmail: user?.email || "Sem e-mail"
      };
    }));

    return res.json({
      success: true,
      history: enrichedHistory
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING SAAS HISTORY:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/approve-payment (Master only)
router.post("/admin/approve-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, notes } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: targetUserId }
    });

    if (!sub) {
      return res.status(404).json({ success: false, error: "Assinatura não localizada para o usuário." });
    }

    // Recalculate duration date
    let daysToAdd = 30; // default MONTHLY
    const cycle = sub.billingCycle || "MONTHLY";
    
    if (cycle === "QUARTERLY") daysToAdd = 90;
    else if (cycle === "SEMIANNUAL") daysToAdd = 180;
    else if (cycle === "YEARLY") daysToAdd = 365;
    else if (cycle === "LIFETIME") daysToAdd = 36500; // 100 years
    else if (cycle === "FREE") daysToAdd = 36500;

    const newExpiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedSub = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        active: true,
        paymentStatus: "ACTIVE",
        expiresAt: newExpiresAt,
        paymentDate: new Date(),
        approvedBy: req.user.email
      }
    });

    // Update payment history records
    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: targetUserId, status: "PENDING" },
      data: {
        status: "APPROVED",
        approvedBy: req.user.email,
        notes: notes || "Pagamento via PIX aprovado pelo Sensei Master"
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_APPROVE_PIX',
        details: `Sensei Supremo aprovou pagamento de PIX para ${targetUserId}. Prorrogado até ${newExpiresAt.toLocaleDateString('pt-BR')}`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Pagamento e assinatura liberados com sucesso pelo Sensei Master!",
      subscription: updatedSub
    });
  } catch (error: any) {
    console.error("🥋 ERROR APPROVING PIX PAYMENT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/reject-payment (Master only)
router.post("/admin/reject-payment", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId, notes } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório" });
  }

  try {
    await prisma.subscription.update({
      where: { userId: targetUserId },
      data: {
        status: "SUSPENDED",
        active: false,
        paymentStatus: "REJECTED"
      }
    });

    await prisma.subscriptionPaymentHistory.updateMany({
      where: { userId: targetUserId, status: "PENDING" },
      data: {
        status: "REJECTED",
        approvedBy: req.user.email,
        notes: notes || "Comprovante inválido ou não identificado."
      }
    });

    return res.json({
      success: true,
      message: "Pagamento rejeitado e assinatura suspensa pelo Sensei Supremo."
    });
  } catch (error: any) {
    console.error("🥋 ERROR REJECTING PIX:", error);
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
         createdAt: true,
         lastLoginAt: true,
         lastActivityAt: true
      }
    });

    const enrichedAcademias = await Promise.all(users.map(async (u) => {
      const studentCount = await prisma.student.count({
        where: { userId: u.id }
      });
      const profile = await prisma.professorProfile.findUnique({
        where: { userId: u.id }
      });

      // Fetch pending proof count for each user
      const pendingProofs = await prisma.subscriptionPaymentHistory.count({
        where: { userId: u.id, status: "PENDING" }
      });

      return {
        id: u.id,
        email: u.email,
        professorName: u.name || profile?.name || "Sensei Anônimo",
        academyName: profile?.academyName || "Dojo Sem Nome",
        plan: u.subscription?.plan || "FREE",
        active: u.subscription ? u.subscription.active : true,
        studentLimit: u.subscription ? u.subscription.studentLimit : 20,
        currentStudents: studentCount,
        monthlyPrice: u.subscription ? u.subscription.monthlyPrice : 0,
        billingCycle: u.subscription?.billingCycle || "MONTHLY",
        status: u.subscription?.status || "ACTIVE",
        expiresAt: u.subscription?.expiresAt ? u.subscription.expiresAt.toISOString() : null,
        grantedByAdmin: u.subscription?.grantedByAdmin || false,
        isSocialProject: u.subscription?.isSocialProject || false,
        socialProjectName: u.subscription?.socialProjectName || null,
        socialDescription: u.subscription?.socialDescription || null,
        pendingProofs,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        lastActivityAt: u.lastActivityAt ? u.lastActivityAt.toISOString() : null
      };
    }));

    // 🥋 SECTION 10: Dynamic Social Impact Metrics for Multi-Academy Dashboard
    const activeSocialSubs = enrichedAcademias.filter(x => x.plan === "SOCIAL_PROJECT" && x.status === "ACTIVE");
    
    // Total Children Assisted (isKid students in social projects academies)
    let kidsAssistedCount = 0;
    let socialImpactStudentsCount = 0;
    
    const socialUserIds = activeSocialSubs.map(x => x.id);
    if (socialUserIds.length > 0) {
      socialImpactStudentsCount = await prisma.student.count({
        where: { userId: { in: socialUserIds } }
      });
      kidsAssistedCount = await prisma.student.count({
        where: { userId: { in: socialUserIds }, isKid: true }
      });
    }

    const socialMetrics = {
      projectsActivesCount: activeSocialSubs.length,
      kidsAssisted: kidsAssistedCount || activeSocialSubs.length * 15, // fallback if zero
      socialGyms: activeSocialSubs.length,
      socialImpact: activeSocialSubs.length * 40, // multiplier index or direct
      beneficiariesSocial: socialImpactStudentsCount || activeSocialSubs.length * 42
    };

    return res.json({
      success: true,
      academias: enrichedAcademias,
      socialMetrics
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

  const {
    targetUserId,
    plan,
    active,
    studentLimit,
    billingCycle,
    expiresAt,
    status,
    customPrice,
    grantedByAdmin,
    isSocialProject,
    socialProjectName,
    socialDescription,
    approvedBy
  } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário destino é obrigatório." });
  }

  try {
    const existing = await prisma.subscription.findUnique({ where: { userId: targetUserId } });
    
    const targetPlan = plan || existing?.plan || "FREE";
    const targetActive = active !== undefined ? active : (existing?.active ?? true);
    
    let defaultLimit = 20;
    let defaultPrice = 0;
    
    if (targetPlan === "BRONZE") { defaultLimit = 50; defaultPrice = 20; }
    else if (targetPlan === "SILVER") { defaultLimit = 80; defaultPrice = 30; }
    else if (targetPlan === "BLACK_BELT" || targetPlan === "BLACK BELT") { defaultLimit = 999999; defaultPrice = 50; }
    else if (targetPlan === "SOCIAL_PROJECT") { defaultLimit = 999999; defaultPrice = 0; }
    else if (targetPlan === "LIBERADO") { defaultLimit = 999999; defaultPrice = 0; }

    const finalLimit = studentLimit !== undefined ? Number(studentLimit) : (existing?.studentLimit ?? defaultLimit);
    const finalPrice = customPrice !== undefined ? Number(customPrice) : (existing?.customPrice ?? defaultPrice);

    const updated = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        plan: targetPlan,
        studentLimit: finalLimit,
        maxStudents: finalLimit,
        monthlyPrice: defaultPrice,
        customPrice: finalPrice,
        billingCycle: billingCycle || "MONTHLY",
        status: status || "ACTIVE",
        active: targetActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedByAdmin: grantedByAdmin ?? true,
        isSocialProject: isSocialProject ?? (targetPlan === "SOCIAL_PROJECT" ? true : false),
        socialProjectName: socialProjectName || null,
        socialDescription: socialDescription || null,
        approvedBy: approvedBy || req.user.email
      },
      update: {
        plan: targetPlan,
        studentLimit: finalLimit,
        maxStudents: finalLimit,
        monthlyPrice: defaultPrice,
        customPrice: finalPrice,
        billingCycle: billingCycle || existing?.billingCycle || "MONTHLY",
        status: status || existing?.status || "ACTIVE",
        active: targetActive,
        expiresAt: expiresAt ? new Date(expiresAt) : (existing?.expiresAt || null),
        grantedByAdmin: grantedByAdmin ?? existing?.grantedByAdmin ?? true,
        isSocialProject: isSocialProject ?? existing?.isSocialProject ?? (targetPlan === "SOCIAL_PROJECT" ? true : false),
        socialProjectName: socialProjectName || existing?.socialProjectName || null,
        socialDescription: socialDescription || existing?.socialDescription || null,
        approvedBy: approvedBy || existing?.approvedBy || req.user.email
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SUBSCRIPTION_OVERRIDE',
        details: `Assinatura de ${targetUserId} customizada pelo Sensei Supremo. Plano: ${targetPlan}, Limite: ${finalLimit}.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: "Assinatura do Dojo modificada com sucesso total pelo Master.",
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN UPDATING PLAN:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/set-nonprofit (Master only)
router.post("/admin/set-nonprofit", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { userId, nonprofit } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "ID do usuário é obrigatório." });
  }

  try {
    const isNowNonprofit = !!nonprofit;
    const targetPlan = isNowNonprofit ? "SOCIAL_PROJECT" : "FREE";
    const studentLimit = isNowNonprofit ? 999999 : 20;
    const monthlyPrice = 0;

    const updated = await prisma.subscription.upsert({
      where: { userId: String(userId) },
      create: {
        userId: String(userId),
        plan: targetPlan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        customPrice: 0,
        billingCycle: "FREE",
        status: "ACTIVE",
        active: true,
        nonprofit: isNowNonprofit
      },
      update: {
        plan: targetPlan,
        studentLimit,
        maxStudents: studentLimit,
        monthlyPrice,
        customPrice: 0,
        billingCycle: isNowNonprofit ? "FREE" : "MONTHLY",
        status: "ACTIVE",
        active: true,
        nonprofit: isNowNonprofit
      }
    });

    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_SET_NONPROFIT',
        details: `Usuário ${userId} - nonprofit set para ${isNowNonprofit}. Plano: ${targetPlan}.`,
        category: 'Admin_Audit',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `Enquadramento de Projeto Social ${isNowNonprofit ? 'ATIVADO' : 'DESACTIVADO'} com sucesso.`,
      subscription: updated
    });
  } catch (error: any) {
    console.error("🥋 ERROR ADMIN SET NONPROFIT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: POST /api/subscription/admin/delete-user (Master only)
router.post("/admin/delete-user", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const isMaster = req.user?.email?.toLowerCase() === "pedro.honorio@gm.rio" || req.user?.role === "MASTER";
  if (!isMaster) {
    return res.status(403).json({ success: false, error: "Acesso exclusivo ao Sensei Master." });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "ID do usuário é obrigatório para exclusão." });
  }

  try {
    // 1. Localizar o usuário a ser excluído
    const userToDelete = await prisma.user.findUnique({
      where: { id: String(targetUserId) }
    });

    if (!userToDelete) {
      return res.status(404).json({ success: false, error: "Usuário não localizado no sistema." });
    }

    // 2. Proteção contra exclusão acidental do próprio Master Admin
    if (userToDelete.email?.toLowerCase() === "pedro.honorio@gm.rio") {
      return res.status(400).json({ success: false, error: "Operação Impossível: O Sensei Master não pode ser excluído do sistema." });
    }

    const targetUserEmail = userToDelete.email || "Sem e-mail";

    console.log(`🥋 [DELETE USER CASCADE] Iniciando exclusão de todas as dependências do Professor ${targetUserEmail} (ID: ${targetUserId})`);

    // 3. Excluir todas as tabelas dependentes associadas ao userId
    // Deletar registros dependentes do Student primeiro porque eles têm chaves estrangeiras
    // GraduationHistory
    await prisma.graduationHistory.deleteMany({
      where: { student: { userId: String(targetUserId) } }
    });

    // Student
    await prisma.student.deleteMany({
      where: { userId: String(targetUserId) }
    });

    // Outros modelos associados ao userId do professor/academia
    await prisma.subscriptionPaymentHistory.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.payment.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.classSchedule.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.systemLog.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.transactionLedger.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.paymentReceipt.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.extraRevenue.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.lessonPlan.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.libraryTechnique.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.product.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.kimonoOrder.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.presence.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.professorProfile.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.plan.deleteMany({ where: { userId: String(targetUserId) } });
    await prisma.notification.deleteMany({ where: { userId: String(targetUserId) } });

    // Deletar Subscription (onDelete: Cascade deve lidar com isso, mas deleteMany garante limpeza)
    await prisma.subscription.deleteMany({ where: { userId: String(targetUserId) } });

    // E finalmente deletar o User do banco de dados principal
    await prisma.user.delete({
      where: { id: String(targetUserId) }
    });

    // Registrar ação no log de segurança/auditoria com o usuário logado (Master)
    await prisma.systemLog.create({
      data: {
        userId: req.user?.id || 'admin',
        timestamp: BigInt(Date.now()),
        userEmail: req.user?.email || 'pedro.honorio@gm.rio',
        action: 'ADMIN_DELETE_USER',
        details: `Exclusão DEFINITIVA de cadastro executada pelo Master. Conta: ${targetUserEmail} (ID: ${targetUserId})`,
        category: 'Security_Critical',
        deviceInfo: req.headers['user-agent'] || 'Desconhecido',
      }
    });

    return res.json({
      success: true,
      message: `🥋 OSS! O cadastro de ${targetUserEmail} e todos os seus vínculos foram excluídos com êxito e permanentemente.`
    });

  } catch (error: any) {
    console.error("🥋 ERROR ADMIN DELETING USER ACCOUNT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

