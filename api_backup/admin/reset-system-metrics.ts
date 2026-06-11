import { Response } from 'express';
import { prisma } from '../../prisma/client';
import { AuthRequest } from '../authMiddleware';
import { isMasterUser } from './neon-status';

export default async function resetSystemMetricsHandler(req: AuthRequest, res: Response): Promise<any> {
  if (!req.user || !isMasterUser(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Restrito: Apenas o Sensei Master Pedro Honório tem permissão para realizar o Reset Estrutural.',
      sensei_tip: 'OSS! Esta operação remove permanentemente todos os lançamentos financeiros, presenças e histórico do dojo.'
    });
  }

  try {
    // 🥋 Perform transaction system reset
    await prisma.$transaction([
      // Delete transactional tables
      prisma.presence.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.paymentReceipt.deleteMany(),
      prisma.extraRevenue.deleteMany(),
      prisma.transactionLedger.deleteMany(),
      prisma.kimonoOrder.deleteMany(),
      
      // Update students statistics to reset (zero out attendance and status pointers)
      prisma.student.updateMany({
        data: {
          attendanceCount: 0,
          currentStreak: 0,
          lastAttendanceDate: null,
          lastPaymentDate: null,
          attendanceHistory: null,
          history: null,
          techniques: null,
          goals: null,
          feedbacks: null,
          completedRuleLessons: null,
          milestones: null,
          technicalMetrics: null,
          performanceRatings: null,
          sparringLogs: null,
          competitions: null
        }
      })
    ]);

    // Create a pristine log entry of this audit reset
    await prisma.systemLog.create({
      data: {
        userId: req.user.id,
        timestamp: BigInt(Date.now()),
        userEmail: req.user.email,
        action: 'RESET_SYSTEM_METRICS',
        details: 'REDIRECIONAMENTO INTEGRAL: O Sensei Master Pedro Honório executou um reset estrutural de estatísticas e limpezas financeiras em todo o ecossistema.',
        category: 'Audit',
        deviceInfo: req.headers['user-agent'] || 'Console de Controle'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Reset estrutural executado com sucesso.',
      sensei_tip: 'OSS! O tatame foi limpo e todas as estatísticas iniciam do zero definitivo.'
    });

  } catch (error: any) {
    console.error('🥋 [RESET METRICS FAIL]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao redefinir base de estatísticas.',
      sensei_tip: 'Sensei, falha ao redefinir. Verifique a saúde do banco Neon.'
    });
  }
}
