import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { serializeData } from './data';

export default async function biHandler(req: Request, res: Response) {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId is required for BI" });

  try {
    const [students, ledger, extraRevenue, payments] = await Promise.all([
      prisma.student.findMany({ where: { userId } }),
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
