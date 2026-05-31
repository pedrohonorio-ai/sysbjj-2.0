import { Response } from 'express';
import { prisma } from '../../prisma/client.js';
import { AuthRequest } from '../authMiddleware.js';
import { SAFE_STUDENT_SELECT, enrichStudentsList } from './data.js';

const BATCH_COOLDOWN = 1500;
let lastBatchExecution = 0;

export default async function batchHandler(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const userEmail = req.user?.email || "Unknown";
  
  console.log('[API START]', req.originalUrl || req.url);
  console.log('[USER]', userId);
  console.log('[BODY]', req.body);

  if (!userId || !req.user) {
    return res.status(401).json({ 
      success: false,
      error: "Sessão expirada ou usuário não autenticado.",
      code: 401
    });
  }

  if (!req.query) {
    return res.status(400).json({
      success: false,
      error: "Parâmetros de requisição ausentes.",
      code: 400
    });
  }

  const { collections } = req.query;

  const now = Date.now();
  if (now - lastBatchExecution < BATCH_COOLDOWN) {
    return res.status(429).json({
      success: false,
      error: "Batch cooldown protection enabled (Mantenha a guarda!).",
      message: "Batch cooldown protection enabled",
      code: 429
    });
  }
  lastBatchExecution = now;

  if (collections === undefined || typeof collections !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: "Coleções de dados são obrigatórias.",
      code: 400
    });
  }

  // Sanitise collection names
  const collectionList = collections
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0 && /^[a-zA-Z0-9_]+$/.test(c));

  const results: Record<string, any> = {};
  const uid = String(userId);

  const serializeData = (data: any) => {
    return JSON.parse(JSON.stringify(data, (k, v) => 
      typeof v === 'bigint' 
        ? (Number(v) <= Number.MAX_SAFE_INTEGER ? Number(v) : v.toString()) 
        : v
    ));
  };

  const QUERY_TIMEOUT_MS = 4500; // 4.5 seconds query timeout per collection

  console.log(`🥋 [BATCH INITIATED] User: ${userEmail} (${uid}) | Collections: ${collectionList.join(', ')}`);

  try {
    await Promise.all(collectionList.map(async (collection) => {
      // Helper containing standard database load query
      const dbFetchQuery = async () => {
        let data;
        const anyPrisma = prisma as any;
        const collLower = collection.toLowerCase();
        
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
            try {
              data = await prisma.professorProfile.findUnique({ where: { userId: uid } });
            } catch {
              data = null;
            }
            break;
          case 'plans': 
            data = await prisma.plan.findMany({ where: { userId: uid } }); 
            break;
          case 'graduationhistory':
            try {
              data = await prisma.graduationHistory.findMany({
                where: { student: { userId: uid } },
                include: { student: true },
                take: 50,
                orderBy: { promotedAt: "desc" }
              });
            } catch (err: any) {
              console.warn("⚠️ [BATCH SENSEI] Error reading graduation history, running safe student select:", err.message);
              try {
                const { graduationDate, nextDegreeDate, estimatedCoralDate, estimatedRedDate, ...safeSelect } = SAFE_STUDENT_SELECT as any;
                data = await prisma.graduationHistory.findMany({
                  where: { student: { userId: uid } },
                  include: {
                    student: { select: safeSelect as any }
                  },
                  take: 50,
                  orderBy: { promotedAt: "desc" }
                });
              } catch (fallbackErr: any) {
                data = [];
              }
            }
            break;
          default: 
            if (anyPrisma[collection] && typeof anyPrisma[collection].findMany === 'function') {
              try {
                data = await anyPrisma[collection].findMany({ where: { userId: uid }, take: 30 });
              } catch (e1) {
                try {
                  data = await anyPrisma[collection].findMany({ take: 30 });
                } catch (e2) {
                  data = [];
                }
              }
            } else {
              data = [];
            }
        }
        return data || [];
      };

      // Race with timeout to safeguard enterprise performance
      const fetchPromise = dbFetchQuery();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), QUERY_TIMEOUT_MS);
      });

      try {
        results[collection] = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (err: any) {
        console.error(`🚨 [BATCH TIMEOUT/ERROR] Collection: ${collection} -> Fallback to [] | Details:`, err.message);
        results[collection] = [];
      }
    }));

    if (results.students) {
      results.students = enrichStudentsList(results.students);
    }

    res.json(serializeData({
      success: true,
      ...results
    }));
  } catch (error) {
    console.error('[API ERROR]', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
}
