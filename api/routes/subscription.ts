import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../authMiddleware.js";
import { prisma } from "../../prisma/client.js";
import { getPlanByStudentCount } from "../../src/shared/subscriptionPlans.js";

const router = Router();

// Endpoint: GET /current
router.get("/current", authenticate as any, async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  try {
    // Count active and inactive students for the user to determine the plan
    const currentStudents = await prisma.student.count({
      where: { userId: String(userId) }
    });

    const planInfo = getPlanByStudentCount(currentStudents);
    const usagePercent = Math.min(100, Math.round((currentStudents / planInfo.maxStudents) * 100));

    res.json({
      success: true,
      plan: {
        name: planInfo.name,
        maxStudents: planInfo.maxStudents,
        currentStudents,
        price: planInfo.price,
        usagePercent,
        canAddStudents: currentStudents < planInfo.maxStudents
      }
    });
  } catch (error: any) {
    console.error("🥋 ERROR FETCHING CURRENT SUBSCRIPTION:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao obter plano de assinatura."
    });
  }
});

export default router;
