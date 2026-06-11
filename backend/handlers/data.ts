import { Response } from 'express';
import { prisma } from '../../prisma/client';
import { AuthRequest } from '../authMiddleware';

/* =========================
   SERIALIZER (BIGINT SAFE)
========================= */
export const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (_, v) =>
      typeof v === 'bigint'
        ? Number(v) <= Number.MAX_SAFE_INTEGER
          ? Number(v)
          : v.toString()
        : v
    )
  );
};

/* =========================
   STUDENT ENRICHMENT (ENTERPRISE)
========================= */
export const enrichStudent = (s: any) => {
  if (!s || typeof s !== 'object') return s;

  const beltSinceDate =
    s.beltSince
      ? new Date(s.beltSince)
      : s.lastPromotionDate
        ? new Date(`${s.lastPromotionDate}T12:00:00`)
        : s.joinedAt
          ? new Date(s.joinedAt)
          : new Date();

  const now = new Date();

  const diffMonths =
    (now.getFullYear() - beltSinceDate.getFullYear()) * 12 +
    (now.getMonth() - beltSinceDate.getMonth());

  const belt = String(s.belt || 'branca').toLowerCase();

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
    stripes: s.stripes ?? 0,
    instructorId: s.userId || '',
    graduationDate:
      s.graduationDate || s.beltSince || s.joinedAt || new Date().toISOString(),
    graduationEligible: eligible,
    nextGraduationEstimate: nextPromotion.toISOString(),
    beltHistory: s.beltHistory || []
  };
};

export const enrichStudentsList = (data: any) => {
  if (Array.isArray(data)) return data.map(enrichStudent);
  return enrichStudent(data);
};

/* =========================
   SAFE SELECT
========================= */
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

/* =========================
   COLLECTION ROUTER (ENTERPRISE CONTROLLED)
========================= */
const ALLOWED_COLLECTIONS = [
  'students',
  'payments',
  'schedules',
  'logs',
  'profile',
  'notification',
  'presence'
] as const;

type Collection = typeof ALLOWED_COLLECTIONS[number];

/* =========================
   MAIN HANDLER
========================= */
export async function dataHandler(req: AuthRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Sessão inválida' });
  }

  let { collection } = req.params as { collection: Collection | string };

  if (!collection) {
    return res.status(400).json({ error: 'Collection obrigatória' });
  }

  if (!ALLOWED_COLLECTIONS.includes(collection as Collection)) {
    return res.status(404).json({
      error: `Coleção não suportada: ${collection}`
    });
  }

  const uid = String(userId);

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
            orderBy: { createdAt: 'desc' },
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

        case 'presence':
          data = await prisma.presence.findMany({
            where: { userId: uid },
            orderBy: { createdAt: 'desc' }
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

          const cleanPayload = {
            ...payload,
            belt: payload.belt || 'Branca',
            stripes: Number(payload.stripes) || 0
          };

          result = isNew
            ? await prisma.student.create({
                data: {
                  ...cleanPayload,
                  id: `STUD-${Date.now()}`,
                  userId: uid
                }
              })
            : await prisma.student.update({
                where: { id },
                data: {
                  ...cleanPayload,
                  userId: uid,
                  updatedAt: new Date()
                }
              });

          break;
        }

        case 'presence': {
          const presenceId =
            id && id !== 'new'
              ? id
              : `PRES-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          result = await prisma.presence.upsert({
            where: { id: presenceId },
            create: {
              ...payload,
              id: presenceId,
              userId: uid,
              createdAt: new Date()
            },
            update: {
              ...payload,
              userId: uid
            }
          });

          break;
        }

        case 'notification': {
          const finalId =
            id && id !== 'new'
              ? id
              : `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

        default:
          return res.status(404).json({
            error: `Operação não suportada: ${collection}`
          });
      }

      const finalResult =
        collection === 'students'
          ? enrichStudent(result)
          : result;

      return res.json(serializeData(finalResult));
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
