import { Response } from 'express';
import { prisma } from '../prisma/client';
import { handleApiError } from './utils';
import { AuthRequest } from './authMiddleware';

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
          result = await prisma.student.upsert({
            where: { id: id || 'new-stu' },
            create: { ...payload, userId: uid },
            update: { ...payload, userId: uid }
          });
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
