import { Response } from 'express';
import { prisma } from '../../prisma/client.js';
import { AuthRequest } from '../authMiddleware.js';

export const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (k, v) =>
      typeof v === 'bigint'
        ? Number(v) <= Number.MAX_SAFE_INTEGER
          ? Number(v)
          : v.toString()
        : v
    )
  );
};

export const enrichStudent = (s: any) => {
  if (!s || typeof s !== 'object') return s;

  let beltSinceDate = s.beltSince ? new Date(s.beltSince) : null;

  if (!beltSinceDate && s.lastPromotionDate) {
    beltSinceDate = new Date(s.lastPromotionDate + 'T12:00:00');
  }

  if (!beltSinceDate || isNaN(beltSinceDate.getTime())) {
    beltSinceDate = s.joinedAt ? new Date(s.joinedAt) : new Date();
  }

  const rightNow = new Date();
  const diffMonths =
    (rightNow.getFullYear() - beltSinceDate.getFullYear()) * 12 +
    (rightNow.getMonth() - beltSinceDate.getMonth());

  let minTime = 12;

  const belt = String(s.belt || 'Branca').toLowerCase();

  if (belt.includes('azul')) minTime = 24;
  else if (belt.includes('roxa')) minTime = 18;
  else if (belt.includes('preta')) minTime = 36;
  else if (belt.includes('coral')) minTime = 84;
  else if (belt.includes('vermelha')) minTime = 120;
  else minTime = 12;

  const isEligible = diffMonths >= minTime;

  const estNextPromotion = new Date(beltSinceDate);
  estNextPromotion.setMonth(estNextPromotion.getMonth() + minTime);

  return {
    ...s,
    stripe: s.stripes ?? 0,
    instructorId: s.userId || '',
    graduationDate:
      s.graduationDate || s.beltSince || s.joinedAt || new Date().toISOString(),
    graduationEligible: isEligible,
    nextGraduationEstimate:
      s.nextPromotion || estNextPromotion.toISOString(),
    beltHistory: s.beltHistory || []
  };
};

export const enrichStudentsList = (data: any) => {
  if (Array.isArray(data)) return data.map(enrichStudent);
  return enrichStudent(data);
};

export async function dataHandler(req: AuthRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Sessão inválida' });
  }

  let { collection } = req.params;

  if (!collection) {
    return res.status(400).json({ error: 'Collection obrigatória' });
  }

  if (collection === 'notifications') {
    collection = 'notification';
  }

  const uid = String(userId);
  const anyPrisma = prisma as any;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return res.status(200).json({ success: true, offline: true });
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
            return res
              .status(404)
              .json({ error: `Coleção não encontrada: ${collection}` });
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
      const { userId: _, id, ...payload } = req.body;
      let result;

      switch (collection) {
        case 'students': {
          const isNew = !id || id === 'new' || id === 'new-stu';

          const cleanPayload = {
            ...payload,
            belt: payload.belt || 'Branca',
            stripes: Number(payload.stripes) || 0
          };

          if (isNew) {
            result = await prisma.student.create({
              data: {
                ...cleanPayload,
                id: `STUD-${Date.now()}`,
                userId: uid
              }
            });
          } else {
            result = await prisma.student.update({
              where: { id },
              data: {
                ...cleanPayload,
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
              : `notif-${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 9)}`;

          result = await prisma.notification.upsert({
            where: { id: finalId },
            create: {
              ...payload,
              id: finalId,
              userId: uid
            },
            update: {
              ...payload,
              userId: uid
            }
          });

          break;
        }

        default: {
          if (!anyPrisma[collection]) {
            return res
              .status(404)
              .json({ error: `Coleção não suportada: ${collection}` });
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
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
