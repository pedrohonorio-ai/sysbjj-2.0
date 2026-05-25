import { Response } from 'express';
import { prisma } from '../prisma/client.js';
import { serializeData, SAFE_STUDENT_SELECT } from './data.js';
import { AuthRequest } from './authMiddleware.js';

export default async function biHandler(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Sessão expirada" });

  try {
    let students: any[] = [];
    try {
      students = await prisma.student.findMany({ where: { userId } });
    } catch (err: any) {
      console.warn("⚠️ [BI SENSEI] Error reading students, running safe select:", err.message);
      try {
        const { graduationDate, nextDegreeDate, estimatedCoralDate, estimatedRedDate, blackBeltDate, blackBeltDegree, ...safeSelect } = SAFE_STUDENT_SELECT as any;
        students = await prisma.student.findMany({
          where: { userId },
          select: safeSelect as any
        });
      } catch (fallbackE: any) {
        console.error("🚨 [BI SENSEI] Safe student read failed, running ultra-safe select fallback:", fallbackE.message);
        try {
          const ultraSafeSelect = {
            id: true,
            userId: true,
            name: true,
            nickname: true,
            email: true,
            phone: true,
            status: true,
            belt: true,
            degrees: true,
            stripes: true,
            photoUrl: true,
            monthlyValue: true,
            dueDay: true,
            active: true,
            joinedAt: true,
            updatedAt: true
          };
          students = await prisma.student.findMany({
            where: { userId },
            select: ultraSafeSelect as any
          });
        } catch (ultraE: any) {
          console.error("🚨 [BI ULTRALIMIT] Ultimate student read failed, returning empty list:", ultraE.message);
          students = [];
        }
      }
    }

    const [ledger, extraRevenue, payments] = await Promise.all([
      prisma.transactionLedger.findMany({ where: { userId } }),
      prisma.extraRevenue.findMany({ where: { userId } }),
      prisma.payment.findMany({ where: { userId } })
    ]);

    // 🥋 Métricas de Alunos
    const studentStats = {
      total: students.length,
      active: students.filter(s => s.status === 'Active' || s.active).length,
      inactive: students.filter(s => s.status !== 'Active' && !s.active).length,
      beltDistribution: students.reduce((acc: any, s) => {
        acc[s.belt] = (acc[s.belt] || 0) + 1;
        return acc;
      }, {}),
      newThisMonth: students.filter(s => {
        const joined = new Date(s.joinedAt);
        const now = new Date();
        return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
      }).length
    };

    // 🥋 Métricas Financeiras
    // Consolidamos Ledger (Incomes), ExtraRevenue e Payments de alunos
    const ledgerIncomes = ledger.filter(t => t.type.toLowerCase() === 'income' || t.type.toLowerCase() === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const ledgerExpenses = ledger.filter(t => t.type.toLowerCase() === 'expense' || t.type.toLowerCase() === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    const extraIncomes = extraRevenue.reduce((sum, e) => sum + e.amount, 0);
    const studentPayments = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

    const financialStats = {
      totalIncome: ledgerIncomes + extraIncomes + studentPayments,
      totalExpenses: ledgerExpenses,
      netProfit: 0,
      breakdown: {
        ledgerIncomes,
        extraIncomes,
        studentPayments,
        ledgerExpenses
      },
      byCategory: ledger.reduce((acc: any, t) => {
        const cat = t.category || "Geral";
        acc[cat] = (acc[cat] || 0) + (t.type.toLowerCase().includes('inc') ? t.amount : -t.amount);
        return acc;
      }, {})
    };
    financialStats.netProfit = financialStats.totalIncome - financialStats.totalExpenses;

    // 🥋 Churn Estimation (Simple: Inactive / Total)
    const churnRate = studentStats.total > 0 ? (studentStats.inactive / studentStats.total) * 100 : 0;

    // 🥋 LTV Estimado (Lifetime Value)
    // Média de mensalidade * tempo médio (simplificado por enquanto)
    const avgMonthly = studentStats.active > 0 
      ? students.filter(s => s.active).reduce((sum, s) => sum + (s.monthlyValue || 0), 0) / studentStats.active 
      : 0;

    res.json(serializeData({
      status: "ok",
      data: {
        summary: {
          totalStudents: studentStats.total,
          activeStudents: studentStats.active,
          monthlyRevenueGoal: students.filter(s => s.active).reduce((sum, s) => sum + (s.monthlyValue || 0), 0),
          actualRevenueThisMonth: studentPayments + ledgerIncomes + extraIncomes,
          netProfit: financialStats.netProfit
        },
        students: studentStats,
        finances: financialStats,
        churnRate: churnRate.toFixed(2) + "%",
        avgTicket: avgMonthly.toFixed(2),
        timestamp: new Date().toISOString()
      },
      message: "🥋 [BI SENSEI] Evolução do Dojo analisada com sucesso."
    }));

  } catch (error: any) {
    console.error("❌ [BI API ERROR]:", error.message);
    res.status(500).json({ error: error.message });
  }
}
