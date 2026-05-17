import { Response } from 'express';
import { prisma } from '../src/server/prisma.js';
import { AuthRequest } from './authMiddleware.js';

export default async function batchHandler(req: AuthRequest, res: Response) {
  const { collections } = req.query;
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ error: "Sessão expirada" });
  if (!collections || typeof collections !== 'string') return res.status(400).json({ error: "collections list required" });

  const collectionList = collections.split(',');
  const results: Record<string, any> = {};
  const uid = String(userId);

  const serializeData = (data: any) => {
    return JSON.parse(JSON.stringify(data, (k, v) => 
      typeof v === 'bigint' 
        ? (Number(v) <= Number.MAX_SAFE_INTEGER ? Number(v) : v.toString()) 
        : v
    ));
  };

  try {
    await Promise.all(collectionList.map(async (collection) => {
      try {
        let data;
        const anyPrisma = prisma as any;
        switch(collection) {
          case 'students': data = await prisma.student.findMany({ where: { userId: uid }, orderBy: { joinedAt: 'desc' } }); break;
          case 'payments': data = await prisma.payment.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
          case 'schedules': data = await prisma.classSchedule.findMany({ where: { userId: uid } }); break;
          case 'logs': data = await prisma.systemLog.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
          case 'ledger': data = await prisma.transactionLedger.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
          case 'receipts': data = await prisma.paymentReceipt.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' } }); break;
          case 'extra_revenue': data = await prisma.extraRevenue.findMany({ where: { userId: uid } }); break;
          case 'lesson_plans': data = await prisma.lessonPlan.findMany({ where: { userId: uid } }); break;
          case 'techniques': data = await prisma.libraryTechnique.findMany({ where: { userId: uid } }); break;
          case 'products': data = await prisma.product.findMany({ where: { userId: uid } }); break;
          case 'orders': data = await prisma.kimonoOrder.findMany({ where: { userId: uid } }); break;
          case 'presence': data = await prisma.presence.findMany({ where: { userId: uid } }); break;
          case 'profile': data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); break;
          case 'plans': data = await prisma.plan.findMany({ where: { userId: uid } }); break;
          default: 
            if (anyPrisma[collection]) {
              data = await anyPrisma[collection].findMany({ where: { userId: uid }, take: 50 });
            } else {
              data = [];
            }
        }
        results[collection] = data;
      } catch (e) {
        console.error(`🥋 [BATCH ERROR] Falha na coleção ${collection}:`, e);
        results[collection] = [];
      }
    }));

    res.json(serializeData(results));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
