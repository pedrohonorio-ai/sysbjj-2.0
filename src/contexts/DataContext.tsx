
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Student, Payment, ClassSchedule, GalleryImage, ExtraRevenue, KimonoOrder, LessonPlan, LibraryTechnique, TechniqueCategory, BeltColor, Product, Plan, PaymentReceipt, TransactionLedger, SystemLog, AttendanceRecord, ExtraRevenueCategory, GraduationCriterion } from '../types';
import CryptoJS from 'crypto-js';
import { IBJJF_LESSONS } from '../constants/rulesData';
import { db } from '../firebase';
import { compressImage } from '../services/imageUtils';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null, setNotifications?: React.Dispatch<React.SetStateAction<any[]>>) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {}, 
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (setNotifications) {
    setNotifications(prev => [{
      id: `ERR-${Date.now()}`,
      message: `Erro na Nuvem (${operationType}): Verifique sua conexão.`,
      type: 'warning',
      timestamp: Date.now()
    }, ...prev]);
  }
};

interface DataContextType {
  students: Student[];
  payments: Payment[];
  schedules: ClassSchedule[];
  gallery: GalleryImage[];
  extraRevenue: ExtraRevenue[];
  orders: KimonoOrder[];
  lessonPlans: LessonPlan[];
  techniques: LibraryTechnique[];
  products: Product[];
  plans: Plan[];
  receipts: PaymentReceipt[];
  ledger: TransactionLedger[];
  professorRules: GraduationCriterion[];
  setProfessorRules: React.Dispatch<React.SetStateAction<GraduationCriterion[]>>;
  logs: SystemLog[];
  presence: { email: string; lastSeen: number; role: string; userAgent: string; id: string }[];
  attendance: AttendanceRecord[];
  notifications: { id: string; message: string; type: 'info' | 'success' | 'warning'; timestamp: number }[];
  logAction: (action: string, details: string, category: SystemLog['category']) => void;
  verifyAuditIntegrity: () => boolean;
  verifyLedgerIntegrity: () => boolean;
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  addReceipt: (receipt: Omit<PaymentReceipt, 'id' | 'status' | 'timestamp'>) => void;
  approveReceipt: (id: string) => void;
  rejectReceipt: (id: string) => void;
  addLedgerEntry: (entry: Omit<TransactionLedger, 'id' | 'timestamp' | 'previousHash' | 'hash'>) => void;
  clearNotification: (id: string) => void;
  recordAttendance: (studentIds: string[], lessonPlanId?: string, classId?: string, notes?: string) => void;
  completeRuleLesson: (studentId: string, lessonId: string, points: number) => void;
  addSchedule: (schedule: Omit<ClassSchedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<ClassSchedule>) => void;
  deleteSchedule: (id: string) => void;
  addGalleryImage: (image: Omit<GalleryImage, 'id'>) => void;
  addExtraRevenue: (rev: Omit<ExtraRevenue, 'id'>) => void;
  updateExtraRevenue: (id: string, updates: Partial<ExtraRevenue>) => void;
  deleteExtraRevenue: (id: string) => void;
  addOrder: (order: Omit<KimonoOrder, 'id'>) => void;
  updateOrder: (id: string, updates: Partial<KimonoOrder>) => void;
  deleteOrder: (id: string) => void;
  addLessonPlan: (plan: Omit<LessonPlan, 'id'>) => void;
  updateLessonPlan: (id: string, updates: Partial<LessonPlan>) => void;
  deleteLessonPlan: (id: string) => void;
  addTechnique: (tech: Omit<LibraryTechnique, 'id'>) => void;
  updateTechnique: (id: string, updates: Partial<LibraryTechnique>) => void;
  deleteTechnique: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  approveGraduation: (studentId: string, newBelt: string) => void;
  exportData: () => void;
  importData: (jsonData: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SCHEDULES: ClassSchedule[] = [
  { id: '1', time: '09:00', title: 'Gi - Fundamentos', instructor: 'Sensei SYSBJJ', category: 'Adulto', days: ['Seg', 'Qua', 'Sex'] },
  { id: '2', time: '12:00', title: 'No-Gi Avançado', instructor: 'Sensei SYSBJJ', category: 'Adulto', days: ['Ter', 'Qui'] },
  { id: '3', time: '18:00', title: 'Kids - Branca/Amarela', instructor: 'Instrutor SYS', category: 'Kids', days: ['Seg', 'Qua', 'Sex'] }
];
const DEFAULT_TECHNIQUES: LibraryTechnique[] = [
  // FINALIZAÇÕES (SUBMISSIONS)
  { id: 'T-001', name: 'Armlock da Guarda Fechada', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.WHITE, description: 'Ataque básico de braço partindo da guarda fechada, utilizando o quadril para isolar o cotovelo.' },
  { id: 'T-002', name: 'Triângulo da Guarda', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.WHITE, description: 'Estrangulamento com as pernas isolando o braço e o pescoço do adversário.' },
  { id: 'T-003', name: 'Mata Leão', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.WHITE, description: 'Estrangulamento clássico pelas costas.' },
  { id: 'T-004', name: 'Guilhotina', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.WHITE, description: 'Estrangulamento frontal sob a axila.' },
  { id: 'T-005', name: 'Kimura', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.WHITE, description: 'Chave de ombro rotacional.' },
  { id: 'T-006', name: 'Americana', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.WHITE, description: 'Chave de ombro do controle lateral.' },
  { id: 'T-007', name: 'Omoplata', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.BLUE, description: 'Chave de ombro com as pernas.' },
  { id: 'T-008', name: 'Ezequiel', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.WHITE, description: 'Estrangulamento com a manga.' },
  { id: 'T-009', name: 'Chave de Pé (Botinha)', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.WHITE, description: 'Ataque de tornozelo básico.' },
  { id: 'T-010', name: 'Katagatame', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.BLUE, description: 'Triângulo de braço.' },
  { id: 'T-041', name: 'Triângulo de Mão (D\'Arce)', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.PURPLE, description: 'Triângulo de braço aplicado quando o oponente está de quatro apoios ou na meia guarda.' },
  { id: 'T-042', name: 'Anaconda Choke', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.PURPLE, description: 'Estrangulamento frontal girando sob o braço do oponente.' },
  { id: 'T-043', name: 'Bolo de Rolo (Berimbolo)', category: TechniqueCategory.BACK_TAKES, beltLevel: BeltColor.PURPLE, description: 'Transição moderna para as costas saindo da De La Riva.' },
  { id: 'T-044', name: 'Canto Choke', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.PURPLE, description: 'Estrangulamento com a lapela utilizando a perna por cima do pescoço.' },
  { id: 'T-045', name: 'Bow and Arrow Choke', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.BLUE, description: 'Arco e flecha, o estrangulamento mais eficiente do BJJ com kimono.' },
  { id: 'T-046', name: 'Heel Hook (Chave de Calcanhar)', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.BROWN, description: 'Ataque rotacional de calcanhar extremamente perigoso (No-Gi).' },
  { id: 'T-047', name: 'Kneebar (Chave de Joelho)', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.BROWN, description: 'Hiperextensão do joelho.' },
  { id: 'T-048', name: 'Chave de Pulso (Mão de Vaca)', category: TechniqueCategory.SUBMISSIONS, beltLevel: BeltColor.BLUE, description: 'Ataque rápido de punho.' },
  
  // PASSAGEM DE GUARDA (GUARD PASSING)
  { id: 'T-011', name: 'Passagem de Toureando', category: TechniqueCategory.GUARD_PASSING, beltLevel: BeltColor.WHITE, description: 'Passagem dinâmica desviando das pernas.' },
  { id: 'T-012', name: 'Passagem de Joelho Cruzado', category: TechniqueCategory.GUARD_PASSING, beltLevel: BeltColor.BLUE, description: 'Knee Slide.' },
  { id: 'T-013', name: 'Passagem Double Under', category: TechniqueCategory.GUARD_PASSING, beltLevel: BeltColor.WHITE, description: 'Passagem por baixo abraçando as pernas.' },
  { id: 'T-014', name: 'Passagem Leg Drag', category: TechniqueCategory.GUARD_PASSING, beltLevel: BeltColor.PURPLE, description: 'Grampeando a perna para o lado oposto.' },
  { id: 'T-049', name: 'Passagem de Meia Guarda (Tripé)', category: TechniqueCategory.GUARD_PASSING, beltLevel: BeltColor.BLUE, description: 'Passagem clássica de pressão na meia guarda.' },
  { id: 'T-050', name: 'Long Step Pass', category: TechniqueCategory.GUARD_PASSING, beltLevel: BeltColor.PURPLE, description: 'Passagem com passo longo cruzando a guarda aberta.' },
  { id: 'T-051', name: 'Passagem Smash Pass', category: TechniqueCategory.GUARD_PASSING, beltLevel: BeltColor.BLUE, description: 'Amassando as pernas do oponente para um lado.' },

  // RASPAGENS (SWEEPS)
  { id: 'T-016', name: 'Raspagem de Tesoura', category: TechniqueCategory.SWEEPS, beltLevel: BeltColor.WHITE, description: 'Raspagem básica da guarda fechada.' },
  { id: 'T-017', name: 'Raspagem de Gancho', category: TechniqueCategory.SWEEPS, beltLevel: BeltColor.WHITE, description: 'Butterfly Sweep.' },
  { id: 'T-018', name: 'Raspagem Flower Sweep', category: TechniqueCategory.SWEEPS, beltLevel: BeltColor.WHITE, description: 'Raspagem pendular.' },
  { id: 'T-052', name: 'Raspagem Scissor Sweep', category: TechniqueCategory.SWEEPS, beltLevel: BeltColor.WHITE, description: 'Clássica tesourinha.' },
  { id: 'T-053', name: 'Raspagem de Dela Riva (Tomoe Nage)', category: TechniqueCategory.SWEEPS, beltLevel: BeltColor.BLUE, description: 'Capotagem da Dela Riva.' },
  { id: 'T-054', name: 'Raspagem Kiss of the Dragon', category: TechniqueCategory.SWEEPS, beltLevel: BeltColor.PURPLE, description: 'Inversão por baixo do oponente na De La Riva invertida.' },
  { id: 'T-055', name: 'Raspagem X-Guard (Technical Stand-up)', category: TechniqueCategory.SWEEPS, beltLevel: BeltColor.PURPLE, description: 'Levantada técnica da guarda X.' },

  // QUEDAS (TAKEDOWNS)
  { id: 'T-022', name: 'Baiana (Double Leg)', category: TechniqueCategory.TAKEDOWNS, beltLevel: BeltColor.WHITE, description: 'Queda clássica de duas pernas.' },
  { id: 'T-023', name: 'Single Leg', category: TechniqueCategory.TAKEDOWNS, beltLevel: BeltColor.WHITE, description: 'Ataque em uma perna.' },
  { id: 'T-056', name: 'Uchimata', category: TechniqueCategory.TAKEDOWNS, beltLevel: BeltColor.PURPLE, description: 'Projeção poderosa com a perna por dentro.' },
  { id: 'T-057', name: 'Ippon Seoi Nage', category: TechniqueCategory.TAKEDOWNS, beltLevel: BeltColor.BLUE, description: 'Arremesso por cima do ombro clássico.' },
  { id: 'T-058', name: 'Fireman Carry', category: TechniqueCategory.TAKEDOWNS, beltLevel: BeltColor.PURPLE, description: 'Carregada de bombeiro (Kata Garuma).' },

  // POSICIONAL E ESCAPADAS
  { id: 'T-027', name: 'Saída da Montada (Upa)', category: TechniqueCategory.ESCAPES, beltLevel: BeltColor.WHITE, description: 'Escapada básica com ponte.' },
  { id: 'T-059', name: 'Escapada de Cotovelo (Montada)', category: TechniqueCategory.ESCAPES, beltLevel: BeltColor.WHITE, description: 'Reposição de meia guarda.' },
  { id: 'T-060', name: 'Escapada de Quadril (100kg)', category: TechniqueCategory.ESCAPES, beltLevel: BeltColor.WHITE, description: 'Fuga essencial do controle lateral.' },
  { id: 'T-061', name: 'Shrimping (Fuga de Quadril)', category: TechniqueCategory.WARMUP, beltLevel: BeltColor.WHITE, description: 'Movimento fundamental de sobrevivência.' },
  { id: 'T-062', name: 'Pummeling (Esgrima)', category: TechniqueCategory.WARMUP, beltLevel: BeltColor.WHITE, description: 'Disputa de esgrima em pé ou solo.' }
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'P-1', name: 'Kimono Ultra Light Preto', price: 450, category: ExtraRevenueCategory.PRODUCT, stock: 15 },
  { id: 'P-2', name: 'Faixa Pro - Todas as Cores', price: 80, category: ExtraRevenueCategory.PRODUCT, stock: 50 },
  { id: 'P-3', name: 'Rash Guard SYSBJJ Edition', price: 180, category: ExtraRevenueCategory.PRODUCT, stock: 20 },
  { id: 'P-4', name: 'Whey Protein Isolado 900g', price: 210, category: ExtraRevenueCategory.PRODUCT, stock: 10 }
];

const DEFAULT_PLANS: Plan[] = [
  { id: 'PL-1', name: 'Plano Mensal', price: 280, description: 'Acesso total a todas as aulas.', benefits: ['Sem fidelidade', 'Acesso ao App', 'Treinos Livres'] },
  { id: 'PL-2', name: 'Plano Semestral', price: 240, description: 'Economia com fidelidade de 6 meses.', benefits: ['Desconto de 15%', 'Acesso VIP', 'Aula Particular Mensal'] },
  { id: 'PL-3', name: 'Plano Kids', price: 190, description: 'Foco técnico e educacional para crianças.', benefits: ['Ludicidade Técnica', 'Acompanhamento Escolar', 'Eventos Kids'] }
];

// Helper to compress base64 images to save LocalStorage space is now imported from lib/imageUtils

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Função auxiliar para carregar com segurança
  const loadSafely = useCallback((key: string, fallback: any) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || saved === 'undefined') return fallback;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      console.error(`Falha crítica ao ler ${key} do banco local:`, e);
      return fallback;
    }
  }, []);

  // Improved safe saving with quota management
  const saveSafely = useCallback((key: string, value: any) => {
    if (value === undefined) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn(`Quota exceeded while saving ${key}. Primary data prioritized, clearing caches...`);
        
        // Priority order for clearing: logs -> presence -> ledger -> gallery -> receipts -> techniques
        const clearPriority = ['oss_logs', 'oss_presence', 'oss_ledger', 'oss_gallery', 'oss_receipts', 'oss_techniques'];
        
        for (const cacheKey of clearPriority) {
          if (cacheKey !== key) {
             localStorage.removeItem(cacheKey);
             // Try to save again after each removal
             try {
               localStorage.setItem(key, JSON.stringify(value));
               return; // Success!
             } catch (retryErr) {
               continue; // Still failing, try to remove next in priority
             }
          }
        }
        
        // If we reach here, we couldn't even save after clearing some items.
        // For very large collections (like students), we might need to store only a subset locally
        if (key === 'oss_students' && Array.isArray(value) && value.length > 50) {
           try {
             // Store only the 50 most recently updated students locally as a safety measure
             const subset = [...value].sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)).slice(0, 50);
             localStorage.setItem(key, JSON.stringify(subset));
           } catch (subsetErr) {
             console.error("Could not even save student subset to LocalStorage.");
           }
        }
      } else {
        console.error(`Error saving ${key} to local storage:`, e);
      }
    }
  }, []);

  const [students, setStudents] = useState<Student[]>(() => loadSafely('oss_students', []));
  const [payments, setPayments] = useState<Payment[]>(() => loadSafely('oss_payments', []));
  const [schedules, setSchedules] = useState<ClassSchedule[]>(() => loadSafely('oss_schedules', DEFAULT_SCHEDULES));
  const [gallery, setGallery] = useState<GalleryImage[]>(() => loadSafely('oss_gallery', []));
  const [extraRevenue, setExtraRevenue] = useState<ExtraRevenue[]>(() => loadSafely('oss_extra_revenue', []));
  const [orders, setOrders] = useState<KimonoOrder[]>(() => loadSafely('oss_orders', []));
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(() => loadSafely('oss_lesson_plans', []));
  const [techniques, setTechniques] = useState<LibraryTechnique[]>(() => loadSafely('oss_techniques', DEFAULT_TECHNIQUES));
  const [products, setProducts] = useState<Product[]>(() => loadSafely('oss_products', DEFAULT_PRODUCTS));
  const [plans, setPlans] = useState<Plan[]>(() => loadSafely('oss_plans', DEFAULT_PLANS));
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => loadSafely('oss_receipts', []));
  const [ledger, setLedger] = useState<TransactionLedger[]>(() => loadSafely('oss_ledger', []));
  const [professorRules, setProfessorRules] = useState<GraduationCriterion[]>(() => loadSafely('oss_professor_rules', [
    { id: 'rule-1', name: 'Presença Mensal (>12)', weight: 0.3 },
    { id: 'rule-2', name: 'Domínio Técnico (Exame)', weight: 0.4 },
    { id: 'rule-3', name: 'Comportamento & Disciplina', weight: 0.2 },
    { id: 'rule-4', name: 'Conhecimento de Regras', weight: 0.1 }
  ]));
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [presence, setPresence] = useState<{ email: string; lastSeen: number; role: string; userAgent: string; id: string }[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'info' | 'success' | 'warning'; timestamp: number }[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const lastHashRef = React.useRef<string>('0');

  // Sync Auth State
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('oss_auth');
      setIsAuthenticated(!!authData);
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Firestore Real-time Sync (Optimized with Auth-gate and Limits)
  useEffect(() => {
    if (!db || !isAuthenticated) return;

    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      const cloudData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      if (cloudData.length > 0) setStudents(cloudData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'students', setNotifications));

    const paymentsQuery = query(collection(db, 'payments'), orderBy('date', 'desc'), limit(200));
    const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
      const cloudData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Payment));
      if (cloudData.length > 0) setPayments(cloudData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments', setNotifications));

    const logsQuery = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const logsData = snap.docs.map(doc => doc.data() as SystemLog);
      if (logsData.length > 0) setLogs(logsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'system_logs', setNotifications));

    const ledgerQuery = query(collection(db, 'ledger'), orderBy('timestamp', 'desc'), limit(100));
    const unsubLedger = onSnapshot(ledgerQuery, (snap) => {
      const ledgerData = snap.docs.map(doc => doc.data() as TransactionLedger);
      if (ledgerData.length > 0) setLedger(ledgerData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'ledger', setNotifications));

    const receiptsQuery = query(collection(db, 'receipts'), orderBy('timestamp', 'desc'), limit(50));
    const unsubReceipts = onSnapshot(receiptsQuery, (snap) => {
      const cloudData = snap.docs.map(doc => doc.data() as PaymentReceipt);
      if (cloudData.length > 0) setReceipts(cloudData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'receipts', setNotifications));

    const unsubSchedules = onSnapshot(collection(db, 'schedules'), (snap) => {
      const cloudData = snap.docs.map(doc => doc.data() as ClassSchedule);
      if (cloudData.length > 0) setSchedules(cloudData);
    });

    const unsubLessonPlans = onSnapshot(collection(db, 'lesson_plans'), (snap) => {
      const cloudData = snap.docs.map(doc => doc.data() as LessonPlan);
      if (cloudData.length > 0) setLessonPlans(cloudData);
    });

    const presenceQuery = query(
      collection(db, 'presence'), 
      where('lastSeen', '>', Date.now() - 3600000),
      limit(50)
    );
    const unsubPresence = onSnapshot(presenceQuery, (snap) => {
      setPresence(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'presence', setNotifications));

    return () => {
      unsubStudents(); unsubPayments(); unsubLogs(); unsubLedger();
      unsubReceipts(); unsubSchedules(); unsubLessonPlans(); unsubPresence();
    };
  }, [db, isAuthenticated]);

  // Persistência automática em cada mudança (Local Storage as fallback for UI smoothness)
  useEffect(() => { saveSafely('oss_students', students); }, [students, saveSafely]);
  useEffect(() => { saveSafely('oss_payments', payments); }, [payments, saveSafely]);
  useEffect(() => { saveSafely('oss_schedules', schedules); }, [schedules, saveSafely]);
  useEffect(() => { saveSafely('oss_gallery', gallery); }, [gallery, saveSafely]);
  useEffect(() => { saveSafely('oss_extra_revenue', extraRevenue); }, [extraRevenue, saveSafely]);
  useEffect(() => { saveSafely('oss_orders', orders); }, [orders, saveSafely]);
  useEffect(() => { saveSafely('oss_lesson_plans', lessonPlans); }, [lessonPlans, saveSafely]);
  useEffect(() => { saveSafely('oss_techniques', techniques); }, [techniques, saveSafely]);
  useEffect(() => { saveSafely('oss_products', products); }, [products, saveSafely]);
  useEffect(() => { saveSafely('oss_plans', plans); }, [plans, saveSafely]);
  useEffect(() => { saveSafely('oss_receipts', receipts); }, [receipts, saveSafely]);
  useEffect(() => { saveSafely('oss_ledger', ledger); }, [ledger, saveSafely]);

  const logAction = useCallback((action: string, details: string, category: SystemLog['category']) => {
    const auth = JSON.parse(localStorage.getItem('oss_auth') || '{}');
    
    // Improved Device Identification
    const getDeviceStr = () => {
      const ua = navigator.userAgent;
      let device = "Desktop";
      if (/Android/i.test(ua)) device = "Android";
      else if (/iPhone|iPad|iPod/i.test(ua)) device = "iOS";
      
      let browser = "Browser";
      if (/Chrome/i.test(ua)) browser = "Chrome";
      else if (/Safari/i.test(ua)) browser = "Safari";
      else if (/Firefox/i.test(ua)) browser = "Firefox";
      else if (/Edge/i.test(ua)) browser = "Edge";
      
      return `${device} (${browser})`;
    };

    const emailToLog = auth.email || 'system@sysbjj.com';
    const previousHash = lastHashRef.current;
    const timestamp = Date.now();
    const id = `LOG-${timestamp}-${Math.random().toString(36).substr(2, 5)}`;
    const deviceInfo = getDeviceStr();
    
    // Blockchain Hash
    const dataToHash = `${id}${timestamp}${emailToLog}${action}${details}${category}${deviceInfo}${previousHash}`;
    const hash = CryptoJS.SHA256(dataToHash).toString();
    
    // Update ref immediately for sequential logs in same render cycle
    lastHashRef.current = hash;

    const newLog: SystemLog = {
      id,
      timestamp,
      userId: auth.uid || 'system',
      userEmail: emailToLog,
      action,
      details,
      category,
      deviceInfo,
      previousHash,
      hash
    };
    
    setLogs(prev => [newLog, ...prev]);
    
    // Also persist to Firestore
    if (db) {
      const logRef = doc(collection(db, 'system_logs'), newLog.id);
      setDoc(logRef, newLog).catch(err => handleFirestoreError(err, OperationType.CREATE, 'system_logs', setNotifications));
    }
  }, []);

  const verifyAuditIntegrity = useCallback(() => {
    if (logs.length <= 1) return true;
    
    // Check from newest to oldest
    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (!log.hash || !log.previousHash) continue; // Skip legacy logs

        const dataToHash = `${log.id}${log.timestamp}${log.userEmail}${log.action}${log.details}${log.category}${log.deviceInfo}${log.previousHash}`;
        let calculatedHash = CryptoJS.SHA256(dataToHash).toString();
        
        // Handle branding transition mismatches (system vs system@sysbjj.com)
        if (calculatedHash !== log.hash) {
             const legacyEmails = ['system', 'system@sysbjj.com', 'admin@sysbjj.com'];
             for (const email of legacyEmails) {
                const legacyDataToHash = `${log.id}${log.timestamp}${email}${log.action}${log.details}${log.category}${log.deviceInfo}${log.previousHash}`;
                if (CryptoJS.SHA256(legacyDataToHash).toString() === log.hash) {
                    calculatedHash = log.hash;
                    break;
                }
             }
        }
        
        if (calculatedHash !== log.hash) {
            console.warn(`Blockchain Integrity Fail: Hash mismatch at log ${log.id}`);
            return false;
        }
        
        if (i < logs.length - 1) {
            const olderLog = logs[i+1];
            // If the older log has a hash, the current log's previousHash MUST match it
            // We ignore transitions from '0' as they represent legitimate chain resets or initial actions
            if (olderLog.hash && log.previousHash !== '0' && log.previousHash !== olderLog.hash) {
                // If there's a mismatch, we look for the next log that DOES match (handling potential deletions or forks)
                let foundMatch = false;
                for (let j = i + 1; j < Math.min(i + 10, logs.length); j++) {
                    if (logs[j].hash === log.previousHash) {
                        foundMatch = true;
                        break;
                    }
                }
                
                if (!foundMatch) {
                    console.warn(`Blockchain Integrity Fail: Previous hash mismatch at log ${log.id}`);
                    return false;
                }
            }
        }
    }
    return true;
  }, [logs]);

  const addStudent = useCallback(async (student: Omit<Student, 'id'>) => {
    try {
      const id = `STUD-${Date.now()}`;
      
      // Compress photo if exists to save space
      let photoUrl = student.photoUrl;
      if (photoUrl && photoUrl.startsWith('data:image')) {
        photoUrl = await compressImage(photoUrl);
      }

      const rawValue = student.monthlyValue;
      const monthlyValue = typeof rawValue === 'number' ? rawValue : (typeof rawValue === 'string' ? parseFloat(rawValue) || 0 : 0);
      const newStudent = { ...student, id, photoUrl, monthlyValue } as Student;
      
      // Optimistic Update
      setStudents(prev => [...prev, newStudent]);
      
      if (db) {
        await setDoc(doc(db, 'students', id), newStudent).catch(err => handleFirestoreError(err, OperationType.CREATE, 'students'));
      }
      
      logAction('Novo Cadastro', `Alunos ${student.name} cadastrado`, 'User');
    } catch (err) {
      console.error("Critical error adding student:", err);
      throw err; // Re-throw to be caught by UI
    }
  }, [logAction]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    // Compress photo if exists in updates
    let finalUpdates = { ...updates };
    if (finalUpdates.photoUrl && finalUpdates.photoUrl.startsWith('data:image')) {
      finalUpdates.photoUrl = await compressImage(finalUpdates.photoUrl);
    }

    // Optimistic Update
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...finalUpdates } : s));
    
    if (db) {
      await updateDoc(doc(db, 'students', id), finalUpdates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `students/${id}`));
    }
    logAction('Atualização de Cadastro', `Dados do aluno ID ${id} atualizados`, 'User');
  }, [logAction]);

  const deleteStudent = useCallback((id: string) => {
    // Optimistic Update
    setStudents(prev => prev.filter(s => s.id !== id));
    
    if (db) {
      deleteDoc(doc(db, 'students', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `students/${id}`));
    }
    logAction('Exclusão de Cadastro', `Aluno ID ${id} removido do sistema`, 'Security');
  }, [logAction]);

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const id = `PAY-${Date.now()}`;
    const newPayment = { ...payment, id } as Payment;
    
    // Optimistic Update
    setPayments(prev => [newPayment, ...prev]);
    
    if (db) {
      setDoc(doc(db, 'payments', id), newPayment).catch(err => handleFirestoreError(err, OperationType.CREATE, 'payments'));
    }

    logAction('Pagamento Registrado', `Mensalidade de ${payment.name} no valor de R$ ${payment.amount}`, 'Financial');
    
    // Auto-add to ledger for integrity
    addLedgerEntry({
      type: 'StudentPayment',
      amount: payment.amount,
      description: `Pagamento de mensalidade: ${payment.name}`,
      category: 'Mensalidade',
      method: payment.method,
      studentId: students.find(s => s.name === payment.name)?.id
    });
  };

  const addReceipt = (receipt: Omit<PaymentReceipt, 'id' | 'status' | 'timestamp'>) => {
    const id = `RCP-${Date.now()}`;
    const newReceipt: PaymentReceipt = {
      ...receipt,
      id,
      status: 'Pending',
      timestamp: Date.now()
    };
    
    // Optimistic Update
    setReceipts(prev => [newReceipt, ...prev]);
    
    if (db) {
      setDoc(doc(db, 'receipts', id), newReceipt).catch(err => handleFirestoreError(err, OperationType.CREATE, 'receipts'));
    }

    logAction('Comprovante Enviado', `Aluno ${receipt.studentName} enviou comprovante de R$ ${receipt.amount}`, 'Financial');
    setNotifications(prev => [{
      id: `NOT-${Date.now()}`,
      message: `Novo comprovante enviado por ${receipt.studentName}`,
      type: 'info',
      timestamp: Date.now()
    }, ...prev]);
  };

  const approveReceipt = (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (!receipt) return;

    // Optimistic Update
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    
    if (db) {
      updateDoc(doc(db, 'receipts', id), { status: 'Approved' }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `receipts/${id}`));
    }

    logAction('Comprovante Aprovado', `Comprovante ID ${id} aprovado pelo administrador`, 'Financial');
    
    // Register the actual payment
    addPayment({
      name: receipt.studentName,
      amount: receipt.amount,
      date: new Date().toISOString().split('T')[0],
      method: 'PIX (Comprovante)',
      status: 'Paid'
    });

    // Update student last payment
    updateStudent(receipt.studentId, { lastPaymentDate: new Date().toISOString().split('T')[0] });

    setNotifications(prev => [{
      id: `NOT-${Date.now()}`,
      message: `Pagamento de ${receipt.studentName} aprovado e registrado no ledger.`,
      type: 'success',
      timestamp: Date.now()
    }, ...prev]);
  };

  const rejectReceipt = (id: string) => {
    // Optimistic Update
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    
    if (db) {
      updateDoc(doc(db, 'receipts', id), { status: 'Rejected' }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `receipts/${id}`));
    }

    logAction('Comprovante Rejeitado', `Comprovante ID ${id} rejeitado pelo administrador`, 'Security');
  };

  const addLedgerEntry = useCallback((entry: Omit<TransactionLedger, 'id' | 'timestamp' | 'previousHash' | 'hash'>) => {
    const timestamp = Date.now();
    const id = `TX-${timestamp}`;
    const previousHash = ledger.length > 0 ? ledger[0].hash : '0';
    
    const dataToHash = `${id}${timestamp}${entry.type}${entry.amount}${entry.description}${entry.studentId || ''}${previousHash}`;
    const hash = CryptoJS.SHA256(dataToHash).toString();

    const newEntry: TransactionLedger = {
      ...entry,
      id,
      timestamp,
      previousHash,
      hash
    };

    // Optimistic Update
    setLedger(prev => [newEntry, ...prev]);

    if (db) {
      setDoc(doc(db, 'ledger', id), newEntry).catch(err => handleFirestoreError(err, OperationType.CREATE, 'ledger'));
    }

    logAction('Movimentação Ledger', `Nova entrada no ledger: ${entry.description}`, 'Financial');
  }, [ledger, logAction]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const verifyLedgerIntegrity = useCallback(() => {
    if (ledger.length === 0) return true;
    
    for (let i = 0; i < ledger.length; i++) {
      const entry = ledger[i];
      const dataToHash = `${entry.id}${entry.timestamp}${entry.type}${entry.amount}${entry.description}${entry.studentId || ''}${entry.previousHash}`;
      const calculatedHash = CryptoJS.SHA256(dataToHash).toString();
      
      if (calculatedHash !== entry.hash) return false;
      
      if (i < ledger.length - 1) {
        if (entry.previousHash !== ledger[i + 1].hash) return false;
      } else {
        if (entry.previousHash !== '0') return false;
      }
    }
    return true;
  }, [ledger]);

  const recordAttendance = useCallback(async (studentIds: string[], lessonPlanId?: string, classId?: string, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Update local state first for responsiveness
    setStudents(prev => prev.map(s => studentIds.includes(s.id) ? { 
      ...s, 
      attendanceCount: (s.attendanceCount || 0) + 1,
      currentStreak: (s.currentStreak || 0) + 1,
      attendanceHistory: [
        ...(s.attendanceHistory || []),
        { date: today, lessonPlanId, classId, notes }
      ]
    } : s));

    // Persist to Cloud
    if (db) {
      const batch = writeBatch(db);
      for (const id of studentIds) {
        const student = students.find(s => s.id === id); 
        if (student) {
          const studentRef = doc(db, 'students', id);
          batch.update(studentRef, {
            attendanceCount: (student.attendanceCount || 0) + 1,
            currentStreak: (student.currentStreak || 0) + 1,
            attendanceHistory: [
              ...(student.attendanceHistory || []),
              { date: today, lessonPlanId, classId, notes }
            ]
          });
        }
      }
      await batch.commit().catch(err => handleFirestoreError(err, OperationType.UPDATE, 'students-bulk'));
    }

    logAction('Chamada Realizada', `${studentIds.length} alunos marcaram presença`, 'User');
  }, [students, logAction]);

  const completeRuleLesson = useCallback((studentId: string, lessonId: string, points: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const alreadyCompleted = student.completedRuleLessons?.includes(lessonId);
    if (alreadyCompleted) return;

    const newCompletedLessons = [...(student.completedRuleLessons || []), lessonId];
    const newKnowledge = Math.round((newCompletedLessons.length / IBJJF_LESSONS.length) * 100);
    const newPoints = (student.rewardPoints || 0) + points;

    const updates = {
      rewardPoints: newPoints,
      rulesKnowledge: newKnowledge,
      completedRuleLessons: newCompletedLessons
    };

    // Optimistic Update
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));
    
    if (db) {
      updateDoc(doc(db, 'students', studentId), updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `students/${studentId}`));
    }

    setNotifications(prev => [{
      id: `NOT-${Date.now()}`,
      message: `Lição concluída! Você ganhou ${points} pontos de mérito.`,
      type: 'success',
      timestamp: Date.now()
    }, ...prev]);

    logAction('Regra Concluída', `Aluno ${student.name} concluiu lição de regra ${lessonId}`, 'System');
  }, [students, logAction]);

  const addSchedule = (schedule: Omit<ClassSchedule, 'id'>) => {
    const id = `SCH-${Date.now()}`;
    const newSchedule = { ...schedule, id };
    
    // Optimistic Update
    setSchedules(prev => [...prev, newSchedule].sort((a, b) => a.time.localeCompare(b.time)));
    
    if (db) {
      setDoc(doc(db, 'schedules', id), newSchedule).catch(err => handleFirestoreError(err, OperationType.CREATE, 'schedules'));
    }
    
    logAction('Novo Horário', `Aula de ${schedule.title} adicionada ao cronograma`, 'System');
  };

  const updateSchedule = (id: string, updates: Partial<ClassSchedule>) => {
    // Optimistic Update
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s).sort((a, b) => a.time.localeCompare(b.time)));
    
    if (db) {
      updateDoc(doc(db, 'schedules', id), updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `schedules/${id}`));
    }
    logAction('Horário Atualizado', `Aula ID ${id} modificada`, 'System');
  };

  const deleteSchedule = (id: string) => {
    // Optimistic Update
    setSchedules(prev => prev.filter(s => s.id !== id));
    
    if (db) {
      deleteDoc(doc(db, 'schedules', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `schedules/${id}`));
    }
    logAction('Horário Removido', `Aula ID ${id} excluída`, 'Security');
  };

  const approveGraduation = useCallback((studentId: string, newBelt: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const oldBelt = student.belt;
    const updates = { 
      belt: newBelt as any, 
      isReadyForPromotion: false,
      lastPromotionDate: new Date().toISOString().split('T')[0]
    };

    // Optimistic Update
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));

    if (db) {
      updateDoc(doc(db, 'students', studentId), updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `students/${studentId}`));
    }

    logAction('Graduação Aprovada', `Aluno ${student.name} graduado de ${oldBelt} para ${newBelt}`, 'Security');
    
    // Log to ledger for "Blockchain" financial/status audits
    addLedgerEntry({
      type: 'StatusChange',
      amount: 0,
      description: `Graduação: ${student.name} (${newBelt})`,
      category: 'Graduação',
      method: 'Sistema',
      studentId: studentId
    });

    setNotifications(prev => [{
      id: `GRD-${Date.now()}`,
      message: `Graduação de ${student.name} confirmada e registrada no Ledger!`,
      type: 'success',
      timestamp: Date.now()
    }, ...prev]);
  }, [students, logAction, addLedgerEntry]);

  const addGalleryImage = (image: Omit<GalleryImage, 'id'>) => {
    setGallery(prev => [{ ...image, id: `IMG-${Date.now()}` }, ...prev]);
  };

  const addExtraRevenue = (rev: Omit<ExtraRevenue, 'id'>) => {
    const id = `REV-${Date.now()}`;
    const newRev = { ...rev, id } as ExtraRevenue;
    
    // Optimistic Update
    setExtraRevenue(prev => [newRev, ...prev]);
    
    if (db) {
      setDoc(doc(db, 'extra_revenue', id), newRev).catch(err => handleFirestoreError(err, OperationType.CREATE, 'extra_revenue'));
    }
    
    logAction('Venda Extra', `Venda de ${rev.description} no valor de R$ ${rev.amount}`, 'Financial');

    // Auto-add to ledger for integrity
    addLedgerEntry({
      type: 'ExtraRevenue',
      amount: rev.amount,
      description: `Venda/Serviço: ${rev.description} (${rev.category})`,
      category: rev.category,
      method: rev.paymentMethod,
      studentId: rev.studentId
    });
  };

  const updateExtraRevenue = (id: string, updates: Partial<ExtraRevenue>) => {
    // Optimistic Update
    setExtraRevenue(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    
    if (db) {
      updateDoc(doc(db, 'extra_revenue', id), updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `extra_revenue/${id}`));
    }
    logAction('Venda Atualizada', `Venda ID ${id} modificada`, 'Financial');
  };

  const deleteExtraRevenue = (id: string) => {
    // Optimistic Update
    setExtraRevenue(prev => prev.filter(r => r.id !== id));
    
    if (db) {
      deleteDoc(doc(db, 'extra_revenue', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `extra_revenue/${id}`));
    }
    logAction('Venda Removida', `Venda ID ${id} removida pelo administrador`, 'Security');
  };

  const addOrder = (order: Omit<KimonoOrder, 'id'>) => {
    setOrders(prev => [{ ...order, id: `ORD-${Date.now()}` } as KimonoOrder, ...prev]);
  };

  const updateOrder = (id: string, updates: Partial<KimonoOrder>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const addLessonPlan = (plan: Omit<LessonPlan, 'id'>) => {
    const id = `PLAN-${Date.now()}`;
    const newPlan = { ...plan, id } as LessonPlan;
    setLessonPlans(prev => [newPlan, ...prev]);
    
    if (db) {
      setDoc(doc(db, 'lesson_plans', id), newPlan).catch(err => handleFirestoreError(err, OperationType.CREATE, 'lesson_plans'));
    }
    logAction('Novo Plano de Aula', `QTD: ${plan.title} criado`, 'System');
  };

  const updateLessonPlan = (id: string, updates: Partial<LessonPlan>) => {
    setLessonPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (db) {
      updateDoc(doc(db, 'lesson_plans', id), updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `lesson_plans/${id}`));
    }
    logAction('Plano Atualizado', `QTD ID ${id} modificado`, 'System');
  };

  const deleteLessonPlan = (id: string) => {
    setLessonPlans(prev => prev.filter(p => p.id !== id));
    if (db) {
      deleteDoc(doc(db, 'lesson_plans', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `lesson_plans/${id}`));
    }
    logAction('Plano Removido', `QTD ID ${id} excluído`, 'Security');
  };

  const addTechnique = (tech: Omit<LibraryTechnique, 'id'>) => {
    const id = `TECH-${Date.now()}`;
    const newTech = { ...tech, id } as LibraryTechnique;
    setTechniques(prev => [...prev, newTech]);
    
    if (db) {
      setDoc(doc(db, 'techniques', id), newTech).catch(err => handleFirestoreError(err, OperationType.CREATE, 'techniques'));
    }
    logAction('Nova Técnica', `Técnica ${tech.name} adicionada à biblioteca`, 'System');
  };

  const updateTechnique = (id: string, updates: Partial<LibraryTechnique>) => {
    setTechniques(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (db) {
      updateDoc(doc(db, 'techniques', id), updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `techniques/${id}`));
    }
    logAction('Técnica Atualizada', `Técnica ID ${id} modificada`, 'System');
  };

  const deleteTechnique = (id: string) => {
    setTechniques(prev => prev.filter(t => t.id !== id));
    if (db) {
      deleteDoc(doc(db, 'techniques', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `techniques/${id}`));
    }
    logAction('Técnica Removida', `Técnica ID ${id} excluída da biblioteca`, 'Security');
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: `PROD-${Date.now()}` } as Product]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addPlan = (plan: Omit<Plan, 'id'>) => {
    setPlans(prev => [...prev, { ...plan, id: `PLAN-${Date.now()}` } as Plan]);
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const exportData = () => {
    const data = { 
      students, 
      payments, 
      schedules, 
      gallery: [], // Exclude gallery from full backup to save size if needed, or keep smaller
      extraRevenue, 
      orders, 
      lessonPlans, 
      techniques, 
      products, 
      plans, 
      ledger, // NOW INCLUDING LEDGER
      logs,   // NOW INCLUDING AUDIT LOGS
      version: '6.0', 
      timestamp: Date.now() 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `SYSBJJ_MASTER_BACKUP_${dateStr}.json`;
    link.click();
    
    logAction('Exportação Global', `Backup completo do sistema gerado v6.0`, 'Security');
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.students) setStudents(data.students);
      if (data.payments) setPayments(data.payments);
      if (data.schedules) setSchedules(data.schedules);
      if (data.gallery) setGallery(data.gallery);
      if (data.extraRevenue) setExtraRevenue(data.extraRevenue);
      if (data.orders) setOrders(data.orders);
      if (data.lessonPlans) setLessonPlans(data.lessonPlans);
      if (data.techniques) setTechniques(data.techniques);
      if (data.products) setProducts(data.products);
      if (data.plans) setPlans(data.plans);
      alert('Banco de dados restaurado com sucesso! Oss.');
    } catch (e) {
      alert('Arquivo de backup inválido ou corrompido.');
    }
  };

  return (
    <DataContext.Provider value={{ 
      students, payments, schedules, gallery, extraRevenue, orders, lessonPlans, techniques, products, plans, receipts, ledger, professorRules, setProfessorRules, logs, attendance, presence, notifications,
      logAction, verifyAuditIntegrity, addStudent, updateStudent, deleteStudent, addPayment, addReceipt, approveReceipt, rejectReceipt, addLedgerEntry, clearNotification, recordAttendance, completeRuleLesson,
      addSchedule, updateSchedule, deleteSchedule,
      addGalleryImage,
      addExtraRevenue, updateExtraRevenue, deleteExtraRevenue,
      addOrder, updateOrder, deleteOrder,
      addLessonPlan, updateLessonPlan, deleteLessonPlan,
      addTechnique, updateTechnique, deleteTechnique,
      addProduct, updateProduct, deleteProduct,
      addPlan, updatePlan, deletePlan,
      approveGraduation,
      exportData, importData, verifyLedgerIntegrity
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData deve ser usado dentro de um DataProvider');
  return context;
};
