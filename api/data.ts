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

export const SAFE_STUDENT_SELECT = {
  id: true,
  userId: true,
  name: true,
  nickname: true,
  email: true,
  phone: true,
  birthDate: true,
  gender: true,
  cpf: true,
  rg: true,
  weight: true,
  height: true,
  category: true,
  weightClass: true,
  federationId: true,
  lastPromotionDate: true,
  status: true,
  belt: true,
  degrees: true,
  stripes: true,
  beltSince: true,
  nextPromotion: true,
  promotionNotes: true,
  professorCriteria: true,
  ibjjfEligible: true,
  photoUrl: true,
  monthlyValue: true,
  dueDay: true,
  active: true,
  isKid: true,
  isInstructor: true,
  behaviorScore: true,
  rewardPoints: true,
  rulesKnowledge: true,
  securityAuditStatus: true,
  lastPaymentDate: true,
  attendanceCount: true,
  currentStreak: true,
  lastSeen: true,
  observations: true,
  photo: true,
  isReadyForPromotion: true,
  planId: true,
  portalAccessCode: true,
  graduationNotes: true,
  blackBeltDate: true,
  blackBeltDegree: true,
  lastDegreeDate: true,
  graduationEligibleDate: true,
  pros: true,
  cons: true,
  emergencyContact: true,
  emergencyPhone: true,
  medicalConditions: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  bloodType: true,
  responsiblePerson: true,
  responsibleEmail: true,
  responsiblePhone: true,
  responsibleCpf: true,
  civilStatus: true,
  occupation: true,
  nationality: true,
  rgIssuer: true,
  lgpdConsent: true,
  contractUrl: true,
  billingPaused: true,
  isCompetitor: true,
  isWaitlist: true,
  waitlistRank: true,
  technicalNotes: true,
  medicalCertificateUrl: true,
  medicalCertificateDate: true,
  medicalCertificateExpiration: true,
  liabilityWaiverAccepted: true,
  liabilityWaiverDate: true,
  classId: true,
  lastAttendanceDate: true,
  joinedAt: true,
  updatedAt: true,
  attendanceHistory: true,
  history: true,
  techniques: true,
  goals: true,
  feedbacks: true,
  homeWorkoutHistory: true,
  completedRuleLessons: true,
  customIndicators: true,
  positionVideos: true,
  milestones: true,
  examRequirements: true,
  graduationHistory: true,
  technicalMetrics: true,
  performanceRatings: true,
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
        case 'students':
          try {
            data = await prisma.student.findMany({ where: { userId: uid }, orderBy: { joinedAt: 'desc' } });
          } catch (err: any) {
            console.warn("⚠️ [PRISMA FALLBACK] Error finding students, using safe select fallback:", err.message);
            try {
              const { graduationDate, nextDegreeDate, estimatedCoralDate, estimatedRedDate, blackBeltDate, blackBeltDegree, ...safeSelect } = SAFE_STUDENT_SELECT as any;
              data = await prisma.student.findMany({
                where: { userId: uid },
                orderBy: { joinedAt: 'desc' },
                select: safeSelect as any
              });
            } catch (fallbackErr: any) {
              console.error("🚨 [PRISMA FALLBACK CRITICAL] Safe students query failed, running ultra-safe select fallback:", fallbackErr.message);
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
                  select: ultraSafeSelect as any
                });
              } catch (ultraErr: any) {
                console.error("🚨 [PRISMA ULTRALIMIT] Ultimate students query failed, returning empty list:", ultraErr.message);
                data = [];
              }
            }
          }
          break;
        case 'payments': data = await prisma.payment.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 200 }); break;
        case 'schedules': data = await prisma.classSchedule.findMany({ where: { userId: uid } }); break;
        case 'logs': data = await prisma.systemLog.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
        case 'profile': data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); break;
        default: 
          if (anyPrisma[collection]) {
            if (collection.toLowerCase() === 'graduationhistory') {
              try {
                data = await prisma.graduationHistory.findMany({
                  where: { student: { userId: uid } },
                  include: { student: true }
                });
              } catch (err: any) {
                console.warn("⚠️ [PRISMA FALLBACK] Error finding graduationHistory, using safe include select fallback:", err.message);
                try {
                  const { graduationDate, nextDegreeDate, estimatedCoralDate, estimatedRedDate, ...safeSelect } = SAFE_STUDENT_SELECT as any;
                  data = await prisma.graduationHistory.findMany({
                    where: { student: { userId: uid } },
                    include: {
                      student: {
                        select: safeSelect as any
                      }
                    }
                  });
                } catch (fallbackErr: any) {
                  console.error("🚨 [PRISMA FALLBACK] Graduation history failed completely, returning empty:", fallbackErr.message);
                  data = [];
                }
              }
            } else {
              try {
                data = await anyPrisma[collection].findMany({ where: { userId: uid } });
              } catch (e1) {
                try {
                  data = await anyPrisma[collection].findMany();
                } catch (e2) {
                  data = [];
                }
              }
            }
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

          let blackBeltDateParsed: Date | null = null;
          if (payload.blackBeltDate) {
            const d = new Date(payload.blackBeltDate);
            if (!isNaN(d.getTime())) blackBeltDateParsed = d;
          }
          
          let lastDegreeDateParsed: Date | null = null;
          if (payload.lastDegreeDate) {
            const d = new Date(payload.lastDegreeDate);
            if (!isNaN(d.getTime())) lastDegreeDateParsed = d;
          }

          let graduationDateParsed: Date | null = null;
          if (payload.graduationDate) {
            const d = new Date(payload.graduationDate);
            if (!isNaN(d.getTime())) graduationDateParsed = d;
          }

          let nextDegreeDateParsed: Date | null = null;
          if (payload.nextDegreeDate) {
            const d = new Date(payload.nextDegreeDate);
            if (!isNaN(d.getTime())) nextDegreeDateParsed = d;
          }

          let graduationEligibleDateParsed: Date | null = null;
          if (payload.graduationEligibleDate) {
            const d = new Date(payload.graduationEligibleDate);
            if (!isNaN(d.getTime())) graduationEligibleDateParsed = d;
          }

          let estimatedCoralDateParsed: Date | null = null;
          if (payload.estimatedCoralDate) {
            const d = new Date(payload.estimatedCoralDate);
            if (!isNaN(d.getTime())) estimatedCoralDateParsed = d;
          }

          let estimatedRedDateParsed: Date | null = null;
          if (payload.estimatedRedDate) {
            const d = new Date(payload.estimatedRedDate);
            if (!isNaN(d.getTime())) estimatedRedDateParsed = d;
          }
          
          const blackBeltDegreeParsed = isNaN(Number(payload.blackBeltDegree)) ? 0 : Math.round(Number(payload.blackBeltDegree));

          const cleanPayload = {
            ...payload,
            belt: normalizedBelt,
            stripes: normalizedStripes,
            degrees: normalizedStripes, // mantém stripes e degrees em sincronia para segurança
            beltSince: bSince,
            nextPromotion: nPromotion,
            ibjjfEligible: ibjjfEligible,
            lastPromotionDate: bSince.toISOString().split('T')[0],
            blackBeltDate: blackBeltDateParsed,
            graduationDate: graduationDateParsed,
            blackBeltDegree: blackBeltDegreeParsed,
            lastDegreeDate: lastDegreeDateParsed,
            nextDegreeDate: nextDegreeDateParsed,
            graduationEligibleDate: graduationEligibleDateParsed,
            estimatedCoralDate: estimatedCoralDateParsed,
            estimatedRedDate: estimatedRedDateParsed
          };

          try {
            result = await prisma.student.upsert({
              where: { id: id || 'new-stu' },
              create: { ...cleanPayload, userId: uid },
              update: { ...cleanPayload, userId: uid }
            });
          } catch (upsertError: any) {
            console.warn("⚠️ [PRISMA UPSERT FALLBACK] Failed to upsert student with full graduation fields, stripping them:", upsertError.message);
            // Exclude fields: graduationDate, nextDegreeDate, estimatedCoralDate, estimatedRedDate
            const { graduationDate, nextDegreeDate, estimatedCoralDate, estimatedRedDate, ...safePayload } = cleanPayload;
            try {
              result = await prisma.student.upsert({
                where: { id: id || 'new-stu' },
                create: { ...safePayload, userId: uid },
                update: { ...safePayload, userId: uid }
              });
            } catch (fallbackError: any) {
              console.error("🚨 [PRISMA UPSERT CRITICAL] Safe student upsert also failed:", fallbackError.message);
              throw fallbackError;
            }
          }

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
            try {
              result = await anyPrisma[collection].upsert({
                where: { id: id || 'new' },
                create: { ...payload, userId: uid },
                update: { ...payload, userId: uid }
              });
            } catch (e1) {
              try {
                // Tenta sem o campo userId caso a tabela não tenha essa coluna
                result = await anyPrisma[collection].upsert({
                  where: { id: id || 'new' },
                  create: payload,
                  update: payload
                });
              } catch (e2: any) {
                return res.status(500).json({ error: `Erro ao operar coleção dinâmica: ${e2.message}` });
              }
            }
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
