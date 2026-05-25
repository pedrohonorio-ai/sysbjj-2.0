import { Response } from 'express';
import { prisma } from '../prisma/client.js';
import { AuthRequest } from './authMiddleware.js';
import { SAFE_STUDENT_SELECT } from './data.js';

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
        const collLower = collection.toLowerCase();
        
        // Define limits based on standard enterprise performance parameters
        const defaultStudentsTake = 200;
        const defaultPaymentsTake = 100;
        const defaultLogsTake = 50;
        const defaultLedgerTake = 50;

        switch(collLower) {
          case 'students': 
            try {
              data = await prisma.student.findMany({ 
                where: { userId: uid }, 
                orderBy: { joinedAt: 'desc' },
                take: defaultStudentsTake
              }); 
            } catch (err: any) {
              console.warn("⚠️ [BATCH SENSEI] Error reading students, running safe select:", err.message);
              try {
                const { graduationDate, nextDegreeDate, estimatedCoralDate, estimatedRedDate, blackBeltDate, blackBeltDegree, ...safeSelect } = SAFE_STUDENT_SELECT as any;
                data = await prisma.student.findMany({
                  where: { userId: uid },
                  orderBy: { joinedAt: 'desc' },
                  take: defaultStudentsTake,
                  select: safeSelect as any
                });
              } catch (fallbackErr: any) {
                console.error("🚨 [BATCH SENSEI CRITICAL] Safe student read failed, running ultra-safe select fallback:", fallbackErr.message);
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
                  data = await prisma.student.findMany({
                    where: { userId: uid },
                    orderBy: { joinedAt: 'desc' },
                    take: defaultStudentsTake,
                    select: ultraSafeSelect as any
                  });
                } catch (ultraErr: any) {
                  console.error("🚨 [BATCH ULTRALIMIT] Ultimate student read failed, returning empty list:", ultraErr.message);
                  data = [];
                }
              }
            }
            break;
          case 'payments': 
            data = await prisma.payment.findMany({ 
              where: { userId: uid }, 
              orderBy: { timestamp: 'desc' }, 
              take: defaultPaymentsTake
            }); 
            break;
          case 'schedules': 
            data = await prisma.classSchedule.findMany({ where: { userId: uid } }); 
            break;
          case 'logs': 
            data = await prisma.systemLog.findMany({ 
              where: { userId: uid }, 
              orderBy: { timestamp: 'desc' }, 
              take: defaultLogsTake
            }); 
            break;
          case 'ledger': 
            data = await prisma.transactionLedger.findMany({ 
              where: { userId: uid }, 
              orderBy: { timestamp: 'desc' }, 
              take: defaultLedgerTake
            }); 
            break;
          case 'receipts': 
            data = await prisma.paymentReceipt.findMany({ 
              where: { userId: uid }, 
              orderBy: { timestamp: 'desc' },
              take: 50
            }); 
            break;
          case 'extra_revenue': 
            data = await prisma.extraRevenue.findMany({ where: { userId: uid }, take: 50 }); 
            break;
          case 'lesson_plans': 
            data = await prisma.lessonPlan.findMany({ where: { userId: uid }, take: 50 }); 
            break;
          case 'techniques': 
            data = await prisma.libraryTechnique.findMany({ where: { userId: uid }, take: 100 }); 
            break;
          case 'products': 
            data = await prisma.product.findMany({ where: { userId: uid }, take: 50 }); 
            break;
          case 'orders': 
            data = await prisma.kimonoOrder.findMany({ where: { userId: uid }, take: 50 }); 
            break;
          case 'presence': 
            data = await prisma.presence.findMany({ where: { userId: uid }, take: 50 }); 
            break;
          case 'profile': 
            data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); 
            break;
          case 'plans': 
            data = await prisma.plan.findMany({ where: { userId: uid } }); 
            break;
          case 'graduationhistory':
            try {
              data = await prisma.graduationHistory.findMany({
                where: {
                  student: {
                    userId: uid
                  }
                },
                include: {
                  student: true
                },
                take: 50,
                orderBy: {
                  promotedAt: "desc"
                }
              });
            } catch (err: any) {
              console.warn("⚠️ [BATCH SENSEI] Error reading graduation history, running safe student select:", err.message);
              try {
                const { graduationDate, nextDegreeDate, estimatedCoralDate, estimatedRedDate, ...safeSelect } = SAFE_STUDENT_SELECT as any;
                data = await prisma.graduationHistory.findMany({
                  where: {
                    student: {
                      userId: uid
                    }
                  },
                  include: {
                    student: {
                      select: safeSelect as any
                    }
                  },
                  take: 50,
                  orderBy: {
                    promotedAt: "desc"
                  }
                });
              } catch (fallbackErr: any) {
                console.error("🚨 [BATCH SENSEI] Graduation history completely failed, empty set:", fallbackErr.message);
                data = [];
              }
            }
            break;
          default: 
            if (anyPrisma[collection]) {
              try {
                // Tenta com filtro de userId
                data = await anyPrisma[collection].findMany({ where: { userId: uid }, take: 30 });
              } catch (e1) {
                try {
                  // Se falhar (por exemplo, tabela sem userId, como table de Histórico ou Config), faz select geral
                  data = await anyPrisma[collection].findMany({ take: 30 });
                } catch (e2) {
                  data = [];
                }
              }
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
