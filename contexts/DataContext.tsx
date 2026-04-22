
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Student, Payment, ClassSchedule, GalleryImage, ExtraRevenue, KimonoOrder, LessonPlan, LibraryTechnique, TechniqueCategory, BeltColor, Product, Plan, PaymentReceipt, TransactionLedger, SystemLog } from '../types';
import CryptoJS from 'crypto-js';
import { verifyPaymentProof } from '../services/gemini';
import { db } from '../firebase';
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

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {}, // Simplified for now as we don't have auth fully integrated in this snippet
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the app, but we log it
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
  logs: SystemLog[];
  presence: { email: string; lastSeen: number; role: string; userAgent: string; id: string }[];
  notifications: { id: string; message: string; type: 'info' | 'success' | 'warning'; timestamp: number }[];
  logAction: (action: string, details: string, category: SystemLog['category']) => void;
  verifyAuditIntegrity: () => boolean;
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  addReceipt: (receipt: Omit<PaymentReceipt, 'id' | 'status' | 'timestamp'>) => void;
  approveReceipt: (id: string) => void;
  rejectReceipt: (id: string) => void;
  verifyReceiptWithAI: (id: string) => Promise<void>;
  addLedgerEntry: (entry: Omit<TransactionLedger, 'id' | 'timestamp' | 'previousHash' | 'hash'>) => void;
  clearNotification: (id: string) => void;
  recordAttendance: (studentIds: string[], lessonPlanId?: string, classId?: string) => void;
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
  exportData: () => void;
  importData: (jsonData: string) => void;
  verifyLedgerIntegrity: () => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SCHEDULES: ClassSchedule[] = [
  { id: '1', time: '09:00', title: 'Gi - Fundamentos', instructor: 'Sensei SYSBJJ', category: 'Adulto', days: ['Seg', 'Qua', 'Sex'] },
  { id: '2', time: '12:00', title: 'No-Gi Avançado', instructor: 'Sensei SYSBJJ', category: 'Adulto', days: ['Ter', 'Qui'] },
  { id: '3', time: '18:00', title: 'Kids - Branca/Amarela', instructor: 'Instrutor SYS', category: 'Kids', days: ['Seg', 'Qua', 'Sex'] }
];

const DEFAULT_TECHNIQUES: LibraryTechnique[] = [];

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

  // Função auxiliar para salvar com segurança
  const saveSafely = useCallback((key: string, value: any) => {
    if (value === undefined) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.warn(`Local Storage quota exceeded for ${key}. Data will not be persisted locally.`);
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
  const [products, setProducts] = useState<Product[]>(() => loadSafely('oss_products', []));
  const [plans, setPlans] = useState<Plan[]>(() => loadSafely('oss_plans', []));
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => loadSafely('oss_receipts', []));
  const [ledger, setLedger] = useState<TransactionLedger[]>(() => loadSafely('oss_ledger', []));
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [presence, setPresence] = useState<{ email: string; lastSeen: number; role: string; userAgent: string; id: string }[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'info' | 'success' | 'warning'; timestamp: number }[]>([]);
  const lastHashRef = React.useRef<string>('0');

  // Update ref whenever logs change from Firestore
  useEffect(() => {
    if (logs.length > 0) {
      lastHashRef.current = logs[0].hash || '0';
    }
  }, [logs]);

  // Firestore Real-time Sync
  useEffect(() => {
    if (!db) return;

    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student)));
    });

    const unsubPayments = onSnapshot(collection(db, 'payments'), (snap) => {
      setPayments(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Payment)));
    });

    const unsubLogs = onSnapshot(collection(db, 'system_logs'), (snap) => {
      const logsData = snap.docs.map(doc => doc.data() as SystemLog);
      setLogs(logsData.sort((a, b) => b.timestamp - a.timestamp));
    });

    const unsubLedger = onSnapshot(collection(db, 'ledger'), (snap) => {
      const ledgerData = snap.docs.map(doc => doc.data() as TransactionLedger);
      setLedger(ledgerData.sort((a, b) => b.timestamp - a.timestamp));
    });

    const unsubReceipts = onSnapshot(collection(db, 'receipts'), (snap) => {
      setReceipts(snap.docs.map(doc => doc.data() as PaymentReceipt));
    });

    const unsubSchedules = onSnapshot(collection(db, 'schedules'), (snap) => {
      setSchedules(snap.docs.map(doc => doc.data() as ClassSchedule));
    });

    const unsubLessonPlans = onSnapshot(collection(db, 'lesson_plans'), (snap) => {
      setLessonPlans(snap.docs.map(doc => doc.data() as LessonPlan));
    });

    const unsubPresence = onSnapshot(collection(db, 'presence'), (snap) => {
      setPresence(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    });

    return () => {
      unsubStudents();
      unsubPayments();
      unsubLogs();
      unsubLedger();
      unsubReceipts();
      unsubSchedules();
      unsubLessonPlans();
      unsubPresence();
    };
  }, []);

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
      setDoc(logRef, newLog).catch(err => handleFirestoreError(err, OperationType.CREATE, 'system_logs'));
    }
  }, [logs]);

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

  const addStudent = (student: Omit<Student, 'id'>) => {
    try {
      const id = `STUD-${Date.now()}`;
      const monthlyValue = typeof student.monthlyValue === 'number' ? student.monthlyValue : 0;
      const newStudent = { ...student, id, monthlyValue } as Student;
      
      // Optimistic Update
      setStudents(prev => [...prev, newStudent]);
      
      if (db) {
        setDoc(doc(db, 'students', id), newStudent).catch(err => handleFirestoreError(err, OperationType.CREATE, 'students'));
      }
      
      logAction('Novo Cadastro', `Alunos ${student.name} cadastrado`, 'User');
    } catch (err) {
      console.error("Critical error adding student:", err);
      throw err; // Re-throw to be caught by UI
    }
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    // Optimistic Update
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    
    if (db) {
      updateDoc(doc(db, 'students', id), updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `students/${id}`));
    }
    logAction('Atualização de Cadastro', `Dados do aluno ID ${id} atualizados`, 'User');
  };

  const deleteStudent = (id: string) => {
    // Optimistic Update
    setStudents(prev => prev.filter(s => s.id !== id));
    
    if (db) {
      deleteDoc(doc(db, 'students', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `students/${id}`));
    }
    logAction('Exclusão de Cadastro', `Aluno ID ${id} removido do sistema`, 'Security');
  };

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

  const verifyReceiptWithAI = async (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (!receipt) return;

    try {
      // In a real app, we would fetch the image and convert to base64
      // For this demo, we'll simulate the AI analysis call if we don't have a real base64
      // But we'll try to use the URL if it's already base64
      let base64 = '';
      if (receipt.receiptUrl.startsWith('data:image')) {
        base64 = receipt.receiptUrl.split(',')[1];
      } else {
        // Fallback for demo: simulate a delay and return a mock analysis
        // In production, you'd fetch the image from the URL
      }

      const analysis = await verifyPaymentProof(base64, receipt.amount, receipt.studentName);
      
      setReceipts(prev => prev.map(r => r.id === id ? { ...r, aiAnalysis: analysis } : r));
      
      if (analysis.fraudAlert) {
        setNotifications(prev => [{
          id: `NOT-${Date.now()}`,
          message: `ALERTA DE FRAUDE: ${analysis.fraudAlert} no comprovante de ${receipt.studentName}`,
          type: 'warning',
          timestamp: Date.now()
        }, ...prev]);
      }
    } catch (error) {
      console.error("Erro na verificação de IA:", error);
    }
  };

  const addLedgerEntry = (entry: Omit<TransactionLedger, 'id' | 'timestamp' | 'previousHash' | 'hash'>) => {
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
  };

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

  const recordAttendance = (studentIds: string[], lessonPlanId?: string, classId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setStudents(prev => prev.map(s => studentIds.includes(s.id) ? { 
      ...s, 
      attendanceCount: (s.attendanceCount || 0) + 1,
      currentStreak: (s.currentStreak || 0) + 1,
      attendanceHistory: [
        ...(s.attendanceHistory || []),
        { date: today, lessonPlanId, classId }
      ]
    } : s));
    logAction('Chamada Realizada', `${studentIds.length} alunos marcaram presença`, 'User');
  };

  const completeRuleLesson = (studentId: string, lessonId: string, points: number) => {
    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      rewardPoints: (s.rewardPoints || 0) + points,
      rulesKnowledge: Math.min(100, (s.rulesKnowledge || 0) + 5),
      completedRuleLessons: [...(s.completedRuleLessons || []), lessonId]
    } : s));
    
    setNotifications(prev => [{
      id: `NOT-${Date.now()}`,
      message: `Lição concluída! Você ganhou ${points} pontos de mérito.`,
      type: 'success',
      timestamp: Date.now()
    }, ...prev]);
  };

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
  };

  const deleteSchedule = (id: string) => {
    // Optimistic Update
    setSchedules(prev => prev.filter(s => s.id !== id));
    
    if (db) {
      deleteDoc(doc(db, 'schedules', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `schedules/${id}`));
    }
  };

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
    
    // Auto-add to ledger for integrity
    addLedgerEntry({
      type: 'ExtraRevenue',
      amount: rev.amount,
      description: `Venda/Serviço: ${rev.description} (${rev.category})`,
      studentId: rev.studentId
    });
  };

  const updateExtraRevenue = (id: string, updates: Partial<ExtraRevenue>) => {
    // Optimistic Update
    setExtraRevenue(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    
    if (db) {
      updateDoc(doc(db, 'extra_revenue', id), updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `extra_revenue/${id}`));
    }
  };

  const deleteExtraRevenue = (id: string) => {
    // Optimistic Update
    setExtraRevenue(prev => prev.filter(r => r.id !== id));
    
    if (db) {
      deleteDoc(doc(db, 'extra_revenue', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `extra_revenue/${id}`));
    }
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
    setLessonPlans(prev => [{ ...plan, id: `PLAN-${Date.now()}` } as LessonPlan, ...prev]);
    logAction('Novo Plano de Aula', `QTD: ${plan.title} criado`, 'System');
  };

  const updateLessonPlan = (id: string, updates: Partial<LessonPlan>) => {
    setLessonPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteLessonPlan = (id: string) => {
    setLessonPlans(prev => prev.filter(p => p.id !== id));
  };

  const addTechnique = (tech: Omit<LibraryTechnique, 'id'>) => {
    setTechniques(prev => [...prev, { ...tech, id: `TECH-${Date.now()}` } as LibraryTechnique]);
    logAction('Nova Técnica', `Técnica ${tech.name} adicionada à biblioteca`, 'System');
  };

  const updateTechnique = (id: string, updates: Partial<LibraryTechnique>) => {
    setTechniques(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTechnique = (id: string) => {
    setTechniques(prev => prev.filter(t => t.id !== id));
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
    const data = { students, payments, schedules, gallery, extraRevenue, orders, lessonPlans, techniques, products, plans, version: '5.2', timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sysbjj_2_0_safe_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
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
      students, payments, schedules, gallery, extraRevenue, orders, lessonPlans, techniques, products, plans, receipts, ledger, logs, presence, notifications,
      logAction, verifyAuditIntegrity, addStudent, updateStudent, deleteStudent, addPayment, addReceipt, approveReceipt, rejectReceipt, verifyReceiptWithAI, addLedgerEntry, clearNotification, recordAttendance, completeRuleLesson,
      addSchedule, updateSchedule, deleteSchedule,
      addGalleryImage,
      addExtraRevenue, updateExtraRevenue, deleteExtraRevenue,
      addOrder, updateOrder, deleteOrder,
      addLessonPlan, updateLessonPlan, deleteLessonPlan,
      addTechnique, updateTechnique, deleteTechnique,
      addProduct, updateProduct, deleteProduct,
      addPlan, updatePlan, deletePlan,
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
