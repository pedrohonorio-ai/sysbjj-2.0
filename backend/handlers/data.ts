import { Response } from 'express';
import { prisma } from '../../prisma/client.js';
import { AuthRequest } from '../authMiddleware.js';

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

  let unpacked: any = {};
  if (s.history && typeof s.history === 'object' && !Array.isArray(s.history)) {
    if ((s.history as any)._packed_fields) {
      unpacked = { ...(s.history as any)._packed_fields };
    }
  }

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
    ...unpacked,
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
  'student',
  'payments',
  'payment',
  'schedules',
  'schedule',
  'logs',
  'log',
  'profile',
  'notification',
  'notifications',
  'presence',
  'receipts',
  'receipt',
  'ledger',
  'extra_revenue',
  'orders',
  'order',
  'lesson_plans',
  'lesson_plan',
  'techniques',
  'technique',
  'products',
  'product',
  'plans',
  'plan',
  'graduationhistory',
  'graduation_history',
  'graduationHistory'
] as const;

type Collection = typeof ALLOWED_COLLECTIONS[number];

function getPrismaModelName(coll: string): string {
  const c = coll.toLowerCase();
  if (c === 'students' || c === 'student') return 'student';
  if (c === 'payments' || c === 'payment') return 'payment';
  if (c === 'schedules' || c === 'schedule') return 'classSchedule';
  if (c === 'logs' || c === 'log') return 'systemLog';
  if (c === 'profile' || c === 'profiles') return 'professorProfile';
  if (c === 'notification' || c === 'notifications') return 'notification';
  if (c === 'presence' || c === 'presences') return 'presence';
  if (c === 'receipts' || c === 'receipt') return 'paymentReceipt';
  if (c === 'ledger') return 'transactionLedger';
  if (c === 'extra_revenue') return 'extraRevenue';
  if (c === 'orders' || c === 'order') return 'kimonoOrder';
  if (c === 'lesson_plans' || c === 'lesson_plan') return 'lessonPlan';
  if (c === 'techniques' || c === 'technique') return 'libraryTechnique';
  if (c === 'products' || c === 'product') return 'product';
  if (c === 'plans' || c === 'plan') return 'plan';
  if (c === 'graduationhistory' || c === 'graduation_history' || c === 'graduationhistoryrecords') return 'graduationHistory';
  return '';
}

const NUMERIC_FIELDS: Record<string, string[]> = {
  student: ['stripes', 'degrees', 'monthlyValue', 'dueDay', 'attendanceCount', 'currentStreak', 'behaviorScore', 'rewardPoints'],
  payment: ['amount'],
  paymentReceipt: ['amount'],
  classSchedule: ['duration'],
  presence: [],
  graduationHistory: ['previousStripes', 'newStripes'],
  notification: [],
  systemLog: [],
  professorProfile: [],
  plan: ['price'],
  transactionLedger: ['amount'],
  extraRevenue: ['amount'],
  lessonPlan: ['duration'],
  libraryTechnique: [],
  product: ['price', 'stock'],
  kimonoOrder: ['quantity', 'totalPrice']
};

const BIGINT_FIELDS: Record<string, string[]> = {
  systemLog: ['timestamp'],
  paymentReceipt: ['timestamp'],
  presence: ['lastSeen']
};

const VALID_MODEL_FIELDS: Record<string, string[]> = {
  user: [
    'id', 'email', 'password', 'name', 'role', 'active', 'deletedAt', 'createdAt', 'updatedAt', 'lastLoginAt', 'lastActivityAt'
  ],
  subscription: [
    'id', 'userId', 'plan', 'studentLimit', 'maxStudents', 'currentStudents', 'monthlyPrice', 'customPrice', 'billingCycle', 'status', 'paymentStatus', 'active', 'expiresAt', 'startedAt', 'paymentDate', 'renewalEnabled', 'grantedByAdmin', 'isSocialProject', 'socialProjectName', 'socialDescription', 'approvedBy', 'nonprofit', 'pixKey', 'pixHolder', 'pixCity', 'createdAt', 'updatedAt'
  ],
  subscriptionPaymentHistory: [
    'id', 'userId', 'amount', 'date', 'proofUrl', 'billingCycle', 'status', 'approvedBy', 'notes', 'createdAt'
  ],
  student: [
    'id', 'userId', 'name', 'nickname', 'email', 'phone', 'birthDate', 'gender', 'cpf', 'rg', 'weight', 'height', 'category', 'belt', 'stripes', 'degrees', 'status', 'monthlyValue', 'dueDay', 'attendanceCount', 'currentStreak', 'behaviorScore', 'rewardPoints', 'active', 'isInstructor', 'isKid', 'lastSeen', 'photoUrl', 'lastAttendanceDate', 'lastPaymentDate', 'joinedAt', 'createdAt', 'updatedAt', 'attendanceHistory', 'history', 'techniques', 'goals', 'feedbacks', 'completedRuleLessons', 'milestones', 'technicalMetrics', 'performanceRatings', 'sparringLogs', 'competitions'
  ],
  payment: [
    'id', 'userId', 'studentId', 'name', 'amount', 'date', 'method', 'status', 'createdAt'
  ],
  paymentReceipt: [
    'id', 'userId', 'studentId', 'amount', 'date', 'method', 'notes', 'timestamp', 'createdAt'
  ],
  classSchedule: [
    'id', 'userId', 'title', 'day', 'time', 'duration', 'instructor', 'level', 'createdAt', 'updatedAt'
  ],
  presence: [
    'id', 'userId', 'email', 'role', 'lastSeen', 'userAgent', 'deviceId', 'createdAt', 'updatedAt'
  ],
  graduationHistory: [
    'id', 'studentId', 'previousBelt', 'newBelt', 'previousStripes', 'newStripes', 'promotedAt', 'promotedBy', 'notes', 'ibjjfValidated'
  ],
  notification: [
    'id', 'userId', 'title', 'message', 'type', 'priority', 'read', 'createdAt'
  ],
  systemLog: [
    'id', 'userId', 'userEmail', 'action', 'details', 'category', 'deviceInfo', 'timestamp', 'createdAt'
  ],
  professorProfile: [
    'id', 'userId', 'name', 'academyName', 'bio', 'photoUrl', 'phone', 'address', 'city', 'state', 'belt', 'createdAt', 'updatedAt'
  ],
  plan: [
    'id', 'userId', 'name', 'price', 'description', 'features', 'active', 'createdAt', 'updatedAt'
  ],
  transactionLedger: [
    'id', 'userId', 'type', 'amount', 'category', 'description', 'date', 'timestamp', 'createdAt'
  ],
  extraRevenue: [
    'id', 'userId', 'description', 'amount', 'date', 'category', 'createdAt'
  ],
  lessonPlan: [
    'id', 'userId', 'title', 'description', 'content', 'belt', 'duration', 'createdAt', 'updatedAt'
  ],
  libraryTechnique: [
    'id', 'userId', 'title', 'description', 'category', 'belt', 'videoUrl', 'content', 'createdAt', 'updatedAt'
  ],
  product: [
    'id', 'userId', 'name', 'description', 'price', 'stock', 'category', 'imageUrl', 'active', 'createdAt', 'updatedAt'
  ],
  kimonoOrder: [
    'id', 'userId', 'studentId', 'productId', 'quantity', 'totalPrice', 'status', 'notes', 'createdAt', 'updatedAt'
  ]
};

const MODELS_WITHOUT_USERID = ['graduationHistory'];

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

  // 🥋 Força erro correto se o PostgreSQL estiver offline/instável para disparar IndexedDB Fallback no cliente
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    console.error("🥋 [PRISMA OFFLINE ERROR] dataHandler:", err.message || err);
    return res.status(503).json({
      success: false,
      error: "O banco de dados está temporariamente indisponível. Salvando localmente de forma resiliente.",
      offline: true
    });
  }

  try {
    const modelName = getPrismaModelName(String(collection));
    const model = (prisma as any)[modelName];

    if (!model) {
      return res.status(404).json({
        error: `Coleção não associada a nenhum model Prisma: ${collection}`
      });
    }

    /* =========================
       GET
    ========================= */
    if (req.method === 'GET') {
      let data: any;
      if (modelName === 'professorProfile') {
        data = await model.findUnique({
          where: { userId: uid }
        });
      } else if (modelName === 'graduationHistory') {
        data = await model.findMany({
          where: { student: { userId: uid } },
          orderBy: { promotedAt: 'desc' }
        });
      } else {
        const hasUserIdField = !MODELS_WITHOUT_USERID.includes(modelName);
        data = await model.findMany({
          ...(hasUserIdField ? { where: { userId: uid } } : {}),
          ...(modelName === 'student' ? { orderBy: { joinedAt: 'desc' } } : {}),
          ...(modelName === 'payment' ? { orderBy: { createdAt: 'desc' }, take: 200 } : {}),
          ...(modelName === 'systemLog' ? { orderBy: { timestamp: 'desc' }, take: 100 } : {}),
          ...(modelName === 'transactionLedger' ? { orderBy: { timestamp: 'desc' }, take: 100 } : {})
        });
      }

      const finalData =
        modelName === 'student'
          ? enrichStudentsList(data)
          : data;

      return res.json(serializeData(finalData));
    }

    /* =========================
       POST
    ========================= */
    if (req.method === 'POST') {
      const { id, ...payload } = req.body || {};

      // 1. Identificar se é novo registro pesquisando o ID enviado no banco
      let exists = null;
      if (id && id !== 'new') {
        try {
          exists = await model.findUnique({ where: { id } });
        } catch (e) {}
      }

      // 🥋 Verificações adicionais baseadas em constraints de unicidade
      if (!exists) {
        if (modelName === 'presence') {
          const uniqueEmail = payload.email;
          const uniqueDevId = payload.deviceId;
          if (uniqueEmail && uniqueDevId) {
            try {
              exists = await model.findFirst({
                where: {
                  email: uniqueEmail,
                  deviceId: uniqueDevId
                }
              });
            } catch (e) {}
          }
        } else if (modelName === 'professorProfile') {
          try {
            exists = await model.findUnique({
              where: { userId: uid }
            });
          } catch (e) {}
        }
      }

      const isNew = !exists;

      // 2. Determinar ID final para gravação ou atualização antes da sanitização
      let finalId = id;
      if (exists) {
        finalId = exists.id;
      } else if (!finalId || finalId === 'new') {
        if (modelName === 'student') finalId = `STUD-${Date.now()}`;
        else if (modelName === 'presence') finalId = `PRES-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        else if (modelName === 'notification') finalId = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        else finalId = undefined; // Deixa o cuid() padrão do Prisma resolver
      }

      // 3. Sanitizar payload com base nos tipos de campos do Prisma
      const cleanPayload: any = {};
      const extraFields: any = {};
      
      // Defaults e correções especiais
      if (modelName === 'student') {
        payload.belt = payload.belt || 'Branca';
        payload.stripes = payload.stripes !== undefined ? payload.stripes : 0;
      }

      const validFields = VALID_MODEL_FIELDS[modelName] || [];

      for (const key of Object.keys(payload)) {
        // Ignora campos de relação Prisma para evitar quebras de validação
        if (key === 'student' && modelName === 'graduationHistory') continue;
        
        const val = payload[key];
        
        // Ignora objetos aninhados de relação
        if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
          continue;
        }

        if (validFields.includes(key)) {
          if (NUMERIC_FIELDS[modelName]?.includes(key)) {
            cleanPayload[key] = val !== null && val !== undefined ? Number(val) : undefined;
          } else if (BIGINT_FIELDS[modelName]?.includes(key)) {
            cleanPayload[key] = val !== null && val !== undefined ? BigInt(val) : undefined;
          } else {
            cleanPayload[key] = val;
          }
        } else {
          // Campo extra não persistido nas colunas nativas do banco
          extraFields[key] = val;
        }
      }

      // Se existirem campos extras, os empacotamos de forma transparente no campo JSON de fallback (como history nos estudantes)
      if (Object.keys(extraFields).length > 0) {
        if (modelName === 'student') {
          let historyObj: any = {};
          
          // Se for atualização, recuperamos os campos empacotados anteriormente para mesclar
          if (!isNew && finalId) {
            try {
              const currentRecord = await model.findUnique({ where: { id: finalId } });
              if (currentRecord && currentRecord.history) {
                const curHist = typeof currentRecord.history === 'string' ? JSON.parse(currentRecord.history) : currentRecord.history;
                if (curHist && typeof curHist === 'object' && !Array.isArray(curHist)) {
                  historyObj = { ...curHist };
                }
              }
            } catch (err) {
              console.error("🥋 [PRISMA HYDRATION MERGE FAIL]:", err);
            }
          }

          if (payload.history && typeof payload.history === 'object') {
            if (Array.isArray(payload.history)) {
              historyObj.items = payload.history;
            } else {
              historyObj = { ...historyObj, ...payload.history };
            }
          }

          historyObj._packed_fields = {
            ...(historyObj._packed_fields || {}),
            ...extraFields
          };
          cleanPayload.history = historyObj;
        }
      }

      const hasUserIdField = !MODELS_WITHOUT_USERID.includes(modelName);

      let result: any;
      if (isNew) {
        result = await model.create({
          data: {
            ...cleanPayload,
            ...(finalId ? { id: finalId } : {}),
            ...(hasUserIdField ? { userId: uid } : {})
          }
        });
      } else {
        result = await model.update({
          where: { id: finalId },
          data: {
            ...cleanPayload,
            ...(hasUserIdField ? { userId: uid } : {}),
            updatedAt: new Date()
          }
        });
      }

      // 4. Enriquecer retorno se for estudante
      const finalResult =
        modelName === 'student'
          ? enrichStudent(result)
          : result;

      return res.json(serializeData(finalResult));
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error("🥋 [DATA HANDLER CRITICAL ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
