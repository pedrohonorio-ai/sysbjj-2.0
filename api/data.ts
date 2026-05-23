import { Response } from 'express';
import { prisma } from '../prisma/client.js';
import { handleApiError } from './utils.js';
import { AuthRequest } from './authMiddleware.js';

export const serializeData = (data: any) => {
  return JSON.parse(JSON.stringify(data, (k, v) => 
    typeof v === 'bigint' 
      ? (Number(v) <= Number.MAX_SAFE_INTEGER ? Number(v) : v.toString()) 
      : v
  ));
};

export async function dataHandler(req: AuthRequest, res: Response) {
  const { collection } = req.params;
  
  // OSS SENSEI: SEGURANÇA MÁXIMA - ID extraído do Token, nunca do Body/Query
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ 
      error: "Sessão inválida",
      sensei_tip: "O Tatame está fechado para este usuário. Reconecte-se." 
    });
  }

  const uid = String(userId);
  const anyPrisma = prisma as any;

  try {
    if (req.method === 'GET') {
      let data;
      switch(collection) {
        case 'students': data = await prisma.student.findMany({ where: { userId: uid }, orderBy: { joinedAt: 'desc' } }); break;
        case 'payments': data = await prisma.payment.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 200 }); break;
        case 'schedules': data = await prisma.classSchedule.findMany({ where: { userId: uid } }); break;
        case 'logs': data = await prisma.systemLog.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
        case 'profile': data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); break;
        default: 
          if (anyPrisma[collection]) {
            data = await anyPrisma[collection].findMany({ where: { userId: uid } });
          } else {
            return res.status(404).json({ error: `Coleção não encontrada: ${collection}` });
          }
      }
      return res.json(serializeData(data));
    }

    if (req.method === 'POST') {
      const { userId: _, id, ...payload } = req.body;
      let result;
      
      switch(collection) {
        case 'students':
          // Check limit for new students (id is null/undefined/new)
          const isNew = !id || id === 'new-stu' || id === 'new';
          if (isNew) {
            const [studentCount, subscription] = await Promise.all([
              prisma.student.count({ where: { userId: uid } }),
              prisma.subscription.findUnique({ where: { userId: uid } })
            ]);
            
            const maxStudents = subscription?.maxStudents || 20;
            if (studentCount >= maxStudents) {
              return res.status(403).json({
                success: false,
                error: "Limite do plano atingido",
                upgrade_required: true,
                sensei_tip: `Sensei, você atingiu o limite de ${maxStudents} alunos. Hora de subir de faixa!`
              });
            }
          }

          const pBelt = payload.belt ? String(payload.belt).trim() : "Branca";
          const beltMap: Record<string, string> = {
            white: "Branca", branca: "Branca",
            cinza: "Cinza", grey: "Cinza", gray: "Cinza",
            amarela: "Amarela", yellow: "Amarela",
            laranja: "Laranja", orange: "Laranja",
            verde: "Verde", green: "Verde",
            azul: "Azul", blue: "Azul",
            roxa: "Roxa", purple: "Roxa",
            marrom: "Marrom", brown: "Marrom",
            preta: "Preta", black: "Preta",
            coral: "Coral", vermelha: "Vermelha", red: "Vermelha"
          };
          const normalizedBelt = beltMap[pBelt.toLowerCase()] || (pBelt.charAt(0).toUpperCase() + pBelt.slice(1));
          const normalizedStripes = isNaN(Number(payload.stripes)) ? 0 : Math.round(Number(payload.stripes));
          const normalizedDegrees = isNaN(Number(payload.degrees)) ? 0 : Math.round(Number(payload.degrees));

          // 🥋 CALCULA PREVISÕES E ELEGIBILIDADE IBJJF EM SEGUNDO PLANO / SALVAMENTO
          let bSince: Date | null = null;
          if (payload.beltSince) {
            bSince = new Date(payload.beltSince);
          } else if (payload.lastPromotionDate) {
            bSince = new Date(payload.lastPromotionDate + 'T12:00:00');
          }
          if (!bSince || isNaN(bSince.getTime())) {
            bSince = new Date();
          }

          let minMonths = 12;
          const normalBeltLower = normalizedBelt.toLowerCase();
          if (normalBeltLower === "branca") minMonths = 12;
          else if (normalBeltLower === "azul") minMonths = 24;
          else if (normalBeltLower === "roxa") minMonths = 18;
          else if (normalBeltLower === "marrom") minMonths = 12;

          const nPromotion = new Date(bSince);
          nPromotion.setMonth(nPromotion.getMonth() + minMonths);

          const rightNow = new Date();
          const monthsElapsed = (rightNow.getFullYear() - bSince.getFullYear()) * 12 + (rightNow.getMonth() - bSince.getMonth());
          const ibjjfEligible = monthsElapsed >= minMonths;

          const cleanPayload = {
            ...payload,
            belt: normalizedBelt,
            stripes: normalizedStripes,
            degrees: normalizedStripes, // mantém stripes e degrees em sincronia para segurança
            beltSince: bSince,
            nextPromotion: nPromotion,
            ibjjfEligible: ibjjfEligible,
            lastPromotionDate: bSince.toISOString().split('T')[0]
          };

          result = await prisma.student.upsert({
            where: { id: id || 'new-stu' },
            create: { ...cleanPayload, userId: uid },
            update: { ...cleanPayload, userId: uid }
          });

          // Trigger automatic upgrade if allowed or update state
          import('./subscriptionService.js').then(m => m.updateSubscriptionPlan(uid));
          break;
        case 'presence':
          result = await prisma.presence.upsert({
            where: { 
              email_deviceId: { 
                email: String(payload.email || ''), 
                deviceId: String(payload.deviceId || 'default') 
              } 
            },
            create: { ...payload, userId: uid, lastSeen: BigInt(payload.lastSeen || Date.now()) },
            update: { ...payload, userId: uid, lastSeen: BigInt(payload.lastSeen || Date.now()) }
          });
          break;
        case 'profile':
          result = await prisma.professorProfile.upsert({
            where: { userId: uid },
            create: { ...payload, userId: uid },
            update: { ...payload, userId: uid }
          });
          break;
        case 'logs':
          result = await prisma.systemLog.create({
            data: {
              ...payload,
              timestamp: payload.timestamp ? BigInt(payload.timestamp) : BigInt(Date.now()),
              userId: uid
            }
          });
          break;
        default:
          if (anyPrisma[collection]) {
            result = await anyPrisma[collection].upsert({
              where: { id: id || 'new' },
              create: { ...payload, userId: uid },
              update: { ...payload, userId: uid }
            });
          } else {
            return res.status(404).json({ error: `Coleção não suportada: ${collection}` });
          }
      }
      return res.json(serializeData(result));
    }
  } catch (error: any) {
    handleApiError(res, error, collection);
  }
}
