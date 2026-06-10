import { Response } from 'express';
import { prisma } from '../../prisma/client.js';
import { AuthRequest } from '../authMiddleware.js';

/* =========================================================
   SERIALIZER (SAFE FOR BIGINT / JSON / PRISMA)
========================================================= */
export const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (_k, v) =>
      typeof v === 'bigint'
        ? (v <= Number.MAX_SAFE_INTEGER ? Number(v) : v.toString())
        : v
    )
  );
};

/* =========================================================
   STUDENT ENRICHMENT (SaaS RULE ENGINE)
========================================================= */
export const enrichStudent = (s: any) => {
  if (!s || typeof s !== 'object') return s;

  let beltSinceDate: Date;

  if (s.beltSince) {
    beltSinceDate = new Date(s.beltSince);
  } else if (s.lastPromotionDate) {
    beltSinceDate = new Date(s.lastPromotionDate + 'T12:00:00');
  } else {
    beltSinceDate = s.joinedAt ? new Date(s.joinedAt) : new Date();
  }

  const now = new Date();

  const diffMonths =
    (now.getFullYear() - beltSinceDate.getFullYear()) * 12 +
    (now.getMonth() - beltSinceDate.getMonth());

  const belt = String(s.belt || 'Branca').toLowerCase();

  let minMonths = 12;

  if (belt.includes('azul')) minMonths = 24;
  else if (belt.includes('roxa')) minMonths = 18;
  else if (belt.includes('marrom')) minMonths = 12;
  else if (belt.includes('preta')) minMonths = 36;
  else if (belt.includes('coral')) minMonths = 84;
  else if (belt.includes('vermelha')) minMonths = 120;

  const eligible = diffMonths >= minMonths;

  const nextPromotion = new Date(beltSinceDate);
  nextPromotion.setMonth(nextPromotion.getMonth() + minMonths);

  return {
    ...s,

    stripe: s.stripes ?? 0,
    instructorId: s.userId ?? '',

    graduationDate:
      s.graduationDate || s.beltSince || s.joinedAt || new Date().toISOString(),

    graduationEligible: eligible,
    nextGraduationEstimate:
      s.nextPromotion || nextPromotion.toISOString(),

    beltHistory: s.beltHistory || []
  };
};

export const enrichStudentsList = (data: any) => {
  if (Array.isArray(data)) return data.map(enrichStudent);
  return enrichStudent(data);
};

/* =========================================================
   SAFE SELECT (FIX EXPORT ERROR)
========================================================= */
export const SAFE_STUDENT_SELECT = {
  id: true,
  userId: true,
  name: true,
  nickname: true,
  email: true,
  phone: true,
  belt: true,
  stripes: true,
  degrees: true,
  status: true,
  active: true,
  joinedAt: true,
  updatedAt: true
};

/* =========================================================
   MAIN HANDLER (ENTERPRISE SaaS ROUTER)
========================================================= */
export async function dataHandler(req: AuthRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Sessão inválida' });
  }

  const uid = String(userId);
  let { collection } = req.params;

  if (!collection) {
    return res.status(400).json({ error: 'Collection obrigatória' });
  }

  if (collection === 'notifications') {
    collection = 'notification';
  }

  const anyPrisma = prisma as any;

  /* =========================
     HEALTH CHECK DB
  ========================= */
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return res.status(200).json({
      success: true,
      offline: true
    });
  }

  try {
    /* =========================
       GET
    ========================= */
    if (req.method === 'GET') {
      let data: any = [];

      switch (collection) {
        case 'students':
          data = await prisma.student.findMany({
            where: { userId: uid },
            orderBy: { joinedAt: 'desc' }
          });
          break;

        case 'payments':
          data = await prisma.payment.findMany({
            where: { userId: uid },
            orderBy: { timestamp: 'desc' },
            take: 200
          });
          break;

        case 'schedules':
          data = await prisma.classSchedule.findMany({
            where: { userId: uid }
          });
          break;

        case 'logs':
          data = await prisma.systemLog.findMany({
            where: { userId: uid },
            orderBy: { timestamp: 'desc' },
            take: 100
          });
          break;

        case 'presence':
          data = await prisma.presence.findMany({
            where: { userId: uid }
          });
          break;

        case 'profile':
          data = await prisma.professorProfile.findUnique({
            where: { userId: uid }
          });
          break;

        case 'notification':
          data = await prisma.notification.findMany({
            where: { userId: uid },
            orderBy: { createdAt: 'desc' }
          });
          break;

        default:
          if (!anyPrisma[collection]) {
            return res.status(404).json({
              error: `Coleção não suportada: ${collection}`
            });
          }

          data = await anyPrisma[collection].findMany({
            where: { userId: uid }
          });

          break;
      }

      const finalData =
        collection === 'students'
          ? enrichStudentsList(data)
          : data;

      return res.json(serializeData(finalData));
    }

    /* =========================
       POST
    ========================= */
    if (req.method === 'POST') {
      const { id, ...payload } = req.body || {};
      let result: any;

      switch (collection) {
        case 'students': {
          const isNew = !id || id === 'new';

          if (isNew) {
            result = await prisma.student.create({
              data: {
                ...payload,
                id: `STUD-${Date.now()}`,
                userId: uid
              }
            });
          } else {
            result = await prisma.student.update({
              where: { id },
              data: {
                ...payload,
                userId: uid,
                updatedAt: new Date()
              }
            });
          }

          break;
        }

        case 'notification': {
          const finalId =
            id && id !== 'new'
              ? id
              : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

          result = await prisma.notification.upsert({
            where: { id: finalId },
            create: { ...payload, id: finalId, userId: uid },
            update: { ...payload, userId: uid }
          });

          break;
        }

        case 'presence': {
          result = await prisma.presence.upsert({
            where: {
              email_deviceId: {
                email: String(payload.email || ''),
                deviceId: String(payload.deviceId || 'default')
              }
            },
            create: { ...payload, userId: uid },
            update: { ...payload }
          });

          break;
        }

        case 'profile': {
          result = await prisma.professorProfile.upsert({
            where: { userId: uid },
            create: { ...payload, userId: uid },
            update: { ...payload, userId: uid }
          });

          break;
        }

        case 'logs': {
          result = await prisma.systemLog.create({
            data: { ...payload, userId: uid }
          });

          break;
        }

        default: {
          if (!anyPrisma[collection]) {
            return res.status(404).json({
              error: `Coleção não suportada: ${collection}`
            });
          }

          result = await anyPrisma[collection].upsert({
            where: { id: id || 'new' },
            create: { ...payload, userId: uid },
            update: { ...payload, userId: uid }
          });

          break;
        }
      }

      const finalResult =
        collection === 'students'
          ? enrichStudent(result)
          : result;

      return res.json(serializeData(finalResult));
    }
  } catch (error) {
    console.error('[API ERROR]', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
