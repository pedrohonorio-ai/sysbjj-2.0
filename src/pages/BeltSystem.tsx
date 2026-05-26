import React, { useState, useMemo, useRef } from 'react';
import { 
  Award, Star, Search, ShieldCheck, Clock, CheckCircle2, AlertCircle, 
  TrendingUp, UserCheck, QrCode, Lock, ChevronRight, Zap, Medal, 
  Settings2, Users, Baby, Info, Save, Plus, Trash2, Scale, 
  Calendar, Award as CertificateIcon, Printer, Check, X, ShieldAlert 
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useData } from '../contexts/DataContext.js';
import { motion, AnimatePresence } from 'motion/react';
import { Student, GraduationCriterion, GraduationHistory } from '../types.js';

// Cores oficiais do Sensei (Requisito 11)
export const OFFICIAL_BELT_COLORS: Record<string, string> = {
  "Branca": "bg-white text-slate-800 border-2 border-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
  "Cinza": "bg-slate-400 text-white shadow-[0_4px_12px_rgba(100,116,139,0.3)]",
  "Amarela": "bg-amber-400 text-slate-900 shadow-[0_4px_12px_rgba(251,191,36,0.3)]",
  "Laranja": "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)]",
  "Verde": "bg-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.3)]",
  "Azul": "bg-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]",
  "Roxa": "bg-[#7C3AED] text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]",
  "Marrom": "bg-[#92400E] text-white shadow-[0_4px_12px_rgba(146,64,14,0.3)]",
  "Preta": "bg-[#111111] text-white border-b-4 border-rose-600 shadow-[0_4px_12px_rgba(17,17,17,0.4)]",
};

// Textos e descrições das faixas
export const BELT_LABELS: Record<string, string> = {
  "Branca": "Faixa Branca",
  "Cinza": "Faixa Cinza (Infantil)",
  "Amarela": "Faixa Amarela (Infantil)",
  "Laranja": "Faixa Laranja (Infantil)",
  "Verde": "Faixa Verde (Infantil)",
  "Azul": "Faixa Azul",
  "Roxa": "Faixa Roxa",
  "Marrom": "Faixa Marrom",
  "Preta": "Faixa Preta",
};

// Carência de faixas IBJJF (Requisito 4)
export const IBJJF_TIME_LIMITS: Record<string, number> = {
  "Branca": 12, // 1 ano para Azul
  "Cinza": 12,  // 1 ano para próxima
  "Amarela": 12,
  "Laranja": 12,
  "Verde": 12,
  "Azul": 24,   // 2 anos para Roxa
  "Roxa": 18,   // 18 meses para Marrom
  "Marrom": 12, // 1 ano para Preta
  "Preta": 36,  // 3 anos para Graus adicionais
};

export const BLACK_BELT_RULES: Record<number, number> = {
  0: 3,
  1: 3,
  2: 3,
  3: 5,
  4: 5,
  5: 5,
  6: 7,
  7: 7,
  8: 10
};

export function calculateBlackBeltProgress(student: any) {
  let bbDateStr = student.blackBeltDate;
  if (!bbDateStr) {
    if (student.beltSince) {
      if (student.beltSince instanceof Date) {
        bbDateStr = student.beltSince.toISOString().split('T')[0];
      } else {
        bbDateStr = String(student.beltSince);
      }
    } else if (student.lastPromotionDate) {
      bbDateStr = student.lastPromotionDate;
    }
  }

  if (!bbDateStr) return null;

  const today = new Date();
  let currentDegree = 0;
  let currentDate = new Date(bbDateStr);
  if (isNaN(currentDate.getTime())) {
    currentDate = new Date();
  }

  while (true) {
    const yearsRequired = BLACK_BELT_RULES[currentDegree];
    if (!yearsRequired) break;

    const eligibleDate = new Date(currentDate);
    eligibleDate.setFullYear(eligibleDate.getFullYear() + yearsRequired);

    if (today >= eligibleDate) {
      currentDegree++;
      currentDate = eligibleDate;
    } else {
      const yearsRemaining = eligibleDate.getFullYear() - today.getFullYear();
      const msDiff = eligibleDate.getTime() - today.getTime();
      const monthsRemaining = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24 * 30.4)));

      let displayBelt = "Preta";
      if (currentDegree >= 8) {
        displayBelt = "Coral Vermelha/Branca";
      } else if (currentDegree >= 7) {
        displayBelt = "Coral Vermelha/Preta";
      }

      const birthDate = student.birthDate ? new Date(student.birthDate) : null;
      let isAgeEligible = true;
      let minAgeRequired = 19; // Default starting age limit for Black Belt
      
      // Determine biological age rules:
      const ageSpecs: Record<number, number> = {
        1: 22, 2: 25, 3: 28, 4: 33, 5: 38, 6: 43, 7: 50, 8: 60, 9: 67
      };
      const nextDeg = currentDegree + 1;
      if (ageSpecs[nextDeg]) {
        minAgeRequired = ageSpecs[nextDeg];
      }
      
      if (birthDate && !isNaN(birthDate.getTime())) {
        const studentAge = today.getFullYear() - birthDate.getFullYear();
        if (studentAge < minAgeRequired) {
          isAgeEligible = false;
          // Projected eligible date will shift due to age constraint:
          const birthYearEligible = birthDate.getFullYear() + minAgeRequired;
          if (birthYearEligible > eligibleDate.getFullYear()) {
            eligibleDate.setFullYear(birthYearEligible);
          }
        }
      }

      return {
        currentDegree,
        nextDegree: currentDegree + 1,
        eligibleDate,
        yearsRemaining: Math.max(0, eligibleDate.getFullYear() - today.getFullYear()),
        monthsRemaining: Math.max(1, Math.round((eligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.4))),
        displayBelt,
        timeSpentYears: today.getFullYear() - new Date(bbDateStr).getFullYear(),
        status: (today >= eligibleDate && isAgeEligible) ? 'Elegível' : 'Em Progressão',
        isAgeEligible,
        minAgeRequired
      };
    }
  }

  let finalBelt = "Preta";
  if (currentDegree >= 8) {
    finalBelt = "Coral Vermelha/Branca";
  } else if (currentDegree >= 7) {
    finalBelt = "Coral Vermelha/Preta";
  }

  return {
    currentDegree,
    nextDegree: currentDegree + 1,
    eligibleDate: new Date(),
    yearsRemaining: 0,
    monthsRemaining: 0,
    displayBelt: finalBelt,
    timeSpentYears: today.getFullYear() - new Date(bbDateStr).getFullYear(),
    status: 'Graduação Máxima',
    isAgeEligible: true,
    minAgeRequired: 67
  };
}

const BeltSystem: React.FC = () => {
  const { t } = useTranslation();
  const { 
    students, 
    verifyAuditIntegrity, 
    professorRules, 
    setProfessorRules, 
    approveGraduation, 
    updateStudent,
    graduationHistory 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'fail' | null>(null);
  
  // Abas: Adultos, Kids, Histórico Geral, Tabela IBJJF, Faixas Pretas
  const [activeBoard, setActiveBoard] = useState<'adult' | 'kids' | 'history' | 'chart' | 'blackbelt'>('adult');
  const [showProfessorSettings, setShowProfessorSettings] = useState(false);
  
  // Customizações do Professor (Requisito 5)
  const [customMinTime, setCustomMinTime] = useState<number>(0);
  const [customMinClasses, setCustomMinClasses] = useState<number>(20);
  const [customPresence, setCustomPresence] = useState<number>(75); // % frequência

  // State do certificado automatizado (Requisito 17)
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateStudent, setCertificateStudent] = useState<Student | null>(null);
  const [certProfessorName, setCertProfessorName] = useState('Sensei Master SYSBJJ');
  const [certAcademyName, setCertAcademyName] = useState('Akademie SYSBJJ 2.0');

  // Estados para simulador de regras e autoridade de professores
  const [simulatedProfessorBelt, setSimulatedProfessorBelt] = useState<string>('Preta');
  const [simulatedProfessorDegrees, setSimulatedProfessorDegrees] = useState<number>(2);

  // Estados do Motor Faixa Preta
  const [editingBlackBelt, setEditingBlackBelt] = useState<any | null>(null);
  const [isSavingBlackBelt, setIsSavingBlackBelt] = useState(false);

  // Cache/Memoization dos cálculos de graduação para evitar recálculo a cada render (Requisito 19)
  const calculatedMetrics = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    return students.map(student => {
      const isKid = !!student.isKid;
      const currentBelt = (student.belt || "Branca") as any;
      const stripes = Number(student.stripes || student.degrees || 0);

      // Calcular tempo decorrido desde o início da faixa
      let beltSinceDate = student.beltSince ? new Date(student.beltSince) : null;
      if (!beltSinceDate && student.lastPromotionDate) {
        beltSinceDate = new Date(student.lastPromotionDate + 'T12:00:00');
      }
      if (!beltSinceDate || isNaN(beltSinceDate.getTime())) {
        beltSinceDate = new Date();
      }

      const now = new Date();
      const diffMs = now.getTime() - beltSinceDate.getTime();
      const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const monthsElapsed = Math.max(0, Math.floor(daysElapsed / 30.4));

      // Calcular idade do Aluno de forma robusta
      let age = 0;
      if (student.birthDate) {
        const bd = new Date(student.birthDate);
        if (!isNaN(bd.getTime())) {
          age = now.getFullYear() - bd.getFullYear();
          const m = now.getMonth() - bd.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) {
            age--;
          }
        }
      }

      // Detecção das carências e regras para faixas superiores (CBJJ / IBJJF)
      let ibjjfMinMonths = 12;
      let nextBelt = currentBelt;
      let isPromotionToDegree = false;
      let targetDegree = stripes + 1;
      let reqAge = 0;

      if (currentBelt === "Preta") {
        isPromotionToDegree = true;
        if (stripes < 3) {
          ibjjfMinMonths = 36; // 3 anos em cada para 1º, 2º e 3º graus
          targetDegree = stripes + 1;
          nextBelt = "Preta";
          reqAge = 19 + (targetDegree * 3);
        } else if (stripes < 6) {
          ibjjfMinMonths = 60; // 5 anos para 4º, 5º e 6º graus
          targetDegree = stripes + 1;
          nextBelt = "Preta";
          reqAge = 28 + ((targetDegree - 3) * 5);
        } else if (stripes === 6) {
          // Promoção de 6º Grau Faixa Preta para Coral 7º Grau aos 50 anos
          ibjjfMinMonths = 84; // 7 anos no 6º Grau
          targetDegree = 7;
          nextBelt = "Coral";
          isPromotionToDegree = false;
          reqAge = 50; 
        } else {
          ibjjfMinMonths = 120; // Geralmente 10 anos
          targetDegree = stripes + 1;
          nextBelt = "Coral";
          isPromotionToDegree = true;
          reqAge = 50;
        }
      } else if (currentBelt === "Coral") {
        // Coral Vermelha e Preta para Coral Vermelha e Branca (8º Grau) aos 60 anos
        if (stripes === 7) {
          ibjjfMinMonths = 120; // 10 anos
          targetDegree = 8;
          nextBelt = "CoralBranca";
          isPromotionToDegree = false;
          reqAge = 60;
        } else {
          ibjjfMinMonths = 120;
          targetDegree = stripes + 1;
          nextBelt = "CoralBranca";
          isPromotionToDegree = true;
          reqAge = 60;
        }
      } else if (currentBelt === "CoralBranca") {
        // Coral Vermelha e Branca (8º Grau) para Faixa Vermelha (9º Grau) aos 67 anos
        ibjjfMinMonths = 120; // 10 anos
        targetDegree = 9;
        nextBelt = "Vermelha";
        isPromotionToDegree = false;
        reqAge = 67;
      } else if (currentBelt === "Vermelha") {
        // Faixa Vermelha 9º Grau permanecia ativo
        ibjjfMinMonths = 120;
        targetDegree = 10;
        nextBelt = "Vermelha";
        isPromotionToDegree = true;
        reqAge = 99;
      } else {
        // Faixas ordinárias
        ibjjfMinMonths = IBJJF_TIME_LIMITS[currentBelt] || 12;
        if (isKid) {
          const kidBelts = ["Branca", "Cinza", "Amarela", "Laranja", "Verde"];
          const curIdx = kidBelts.indexOf(currentBelt);
          if (curIdx !== -1 && curIdx < kidBelts.length - 1) {
            nextBelt = kidBelts[curIdx + 1];
          }
          if (nextBelt === "Cinza") reqAge = 4;
          else if (nextBelt === "Amarela") reqAge = 7;
          else if (nextBelt === "Laranja") reqAge = 10;
          else if (nextBelt === "Verde") reqAge = 13;
        } else {
          const adultBelts = ["Branca", "Azul", "Roxa", "Marrom", "Preta"];
          const curIdx = adultBelts.indexOf(currentBelt);
          if (curIdx !== -1 && curIdx < adultBelts.length - 1) {
            nextBelt = adultBelts[curIdx + 1];
          }
          if (nextBelt === "Azul") reqAge = 16;
          else if (nextBelt === "Roxa") reqAge = 16;
          else if (nextBelt === "Marrom") reqAge = 18;
          else if (nextBelt === "Preta") reqAge = 19;
        }
      }

      const timeProgress = Math.min(100, Math.round((monthsElapsed / ibjjfMinMonths) * 100));
      const isTimeCompleted = monthsElapsed >= ibjjfMinMonths;
      const isAgeCompleted = age >= reqAge;

      // Requisito 14 — IA DE EVOLUÇÃO (Índice Evolutivo)
      // frequência, presença, desempenho, tempo, campeonatos
      const freqScore = Math.min(100, Math.round(((student.attendanceCount || 0) / customMinClasses) * 100));
      const behaviorScore = Math.min(100, (student.behaviorScore || 4) * 20);
      const rulesScore = student.rulesKnowledge || 0;
      const timeScore = Math.min(100, timeProgress);
      const champBonus = student.isCompetitor ? 100 : 50;

      const evolutionScore = Math.round(
        (freqScore * 0.3) +
        (behaviorScore * 0.2) +
        (rulesScore * 0.15) +
        (timeScore * 0.25) +
        (champBonus * 0.1)
      );

      // Verificação de elegibilidade automática IBJJF (tempo + idade)
      const ibjjfEligible = isTimeCompleted && isAgeCompleted;

      // Requisito 15: se o professor desligar os critérios ou forçar pronto
      const isPassedProfessorCriteria = student.professorCriteria !== false;
      const isEligible = ibjjfEligible && isPassedProfessorCriteria; 

      // Calcular aprovação do exame de faixa
      const tScore = Number(student.examRequirements?.scoreTakedowns || 7);
      const gScore = Number(student.examRequirements?.scoreGuard || 7);
      const dScore = Number(student.examRequirements?.scoreDefense || 7);
      const sScore = Number(student.examRequirements?.scoreCombate || 7);
      const avgExam = Math.round(((tScore + gScore + dScore + sScore) / 4) * 10) / 10;
      
      const isExamPassed = avgExam >= 7.0 && 
        !!student.examRequirements?.feePaid && 
        !!student.examRequirements?.theoreticalChecked && 
        !!student.examRequirements?.practicalChecked && 
        !!student.examRequirements?.financialChecked;

      // Alert thresholds (Requisito 9)
      const daysToNextStripe = Math.max(0, 30 - (daysElapsed % 30));
      const isApto = isEligible && (stripes >= 4 || isExamPassed || student.professorCriteria === true);
      const nextStripeIn30Days = daysToNextStripe <= 10 && stripes < 4;

      return {
        studentId: student.id,
        age,
        reqAge,
        isAgeCompleted,
        daysElapsed,
        monthsElapsed,
        ibjjfMinMonths,
        timeProgress,
        isTimeCompleted,
        isPromotionToDegree,
        targetDegree,
        nextBelt,
        evolutionScore,
        ibjjfEligible,
        isEligible,
        isApto,
        isExamPassed,
        examAverage: avgExam,
        nextStripeIn30Days,
        daysToNextStripe,
        nextPromotionDate: new Date(beltSinceDate.getTime() + ibjjfMinMonths * 30.4 * 24 * 60 * 60 * 1000)
      };
    });
  }, [students, customMinClasses]);

  // Filtrar guerreiros elegíveis/cadastrados e em busca baseado no tabuleiro selecionado
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = activeBoard === 'adult' ? !student.isKid : student.isKid;
      return matchSearch && categoryMatch;
    });
  }, [students, searchTerm, activeBoard]);

  // Obter métricas de um estudante específico de forma performática
  const getStudentMetrics = (studentId: string) => {
    return calculatedMetrics.find(m => m.studentId === studentId) || {
      studentId,
      age: 20,
      reqAge: 16,
      isAgeCompleted: true,
      daysElapsed: 0,
      monthsElapsed: 0,
      ibjjfMinMonths: 12,
      timeProgress: 0,
      isTimeCompleted: false,
      isPromotionToDegree: false,
      targetDegree: 1,
      nextBelt: "Azul",
      evolutionScore: 50,
      ibjjfEligible: false,
      isEligible: false,
      isApto: false,
      isExamPassed: false,
      examAverage: 7.0,
      nextStripeIn30Days: false,
      daysToNextStripe: 30,
      nextPromotionDate: new Date()
    };
  };

  const getBlackBeltTimeline = (promotionDateStr: string, birthDateStr?: string, currentDegrees: number = 0) => {
    let baseDate = promotionDateStr ? new Date(promotionDateStr) : null;
    if (!baseDate || isNaN(baseDate.getTime())) {
      baseDate = new Date();
    }
    const birthDate = birthDateStr ? new Date(birthDateStr) : null;
    const now = new Date();

    const specs = [
      { degree: 1, label: "1º Grau (Instrutor/Professor)", totalYears: 3, minAge: 22 },
      { degree: 2, label: "2º Grau (Professor)", totalYears: 6, minAge: 25 },
      { degree: 3, label: "3º Grau (Professor)", totalYears: 9, minAge: 28 },
      { degree: 4, label: "4º Grau (Professor)", totalYears: 14, minAge: 33 },
      { degree: 5, label: "5º Grau (Professor)", totalYears: 19, minAge: 38 },
      { degree: 6, label: "6º Grau (Professor)", totalYears: 24, minAge: 43 },
      { degree: 7, label: "7º Grau (Mestre - Faixa Coral Vermelha e Preta)", totalYears: 31, minAge: 50 },
      { degree: 8, label: "8º Grau (Mestre - Faixa Coral Vermelha e Branca)", totalYears: 41, minAge: 60 },
      { degree: 9, label: "9º Grau (Grande Mestre - Faixa Vermelha)", totalYears: 51, minAge: 67 }
    ];

    return specs.map((spec) => {
      const projectedDate = new Date(baseDate!.getTime());
      projectedDate.setFullYear(projectedDate.getFullYear() + spec.totalYears);

      // Recalculate based on age limit if birthDate is registered
      if (birthDate) {
        const ageAtProjectedDate = projectedDate.getFullYear() - birthDate.getFullYear();
        if (ageAtProjectedDate < spec.minAge) {
          projectedDate.setFullYear(birthDate.getFullYear() + spec.minAge);
        }
      }

      const formattedDate = projectedDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const msDiff = projectedDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      const monthsRemaining = Math.max(1, Math.round(daysRemaining / 30.4));

      let status: 'concluido' | 'vigente' | 'futuro' = 'futuro';
      if (currentDegrees >= spec.degree) {
        status = 'concluido';
      } else if (currentDegrees === spec.degree - 1) {
        status = now >= projectedDate ? 'concluido' : 'vigente';
      }

      return {
        ...spec,
        formattedDate,
        projectedDate,
        monthsRemaining,
        daysRemaining,
        status
      };
    });
  };

  const handleApprove = () => {
    if (!selectedStudent) return;
    const metrics = getStudentMetrics(selectedStudent.id);
    const targetBelt = metrics.nextBelt;

    if (metrics.isPromotionToDegree) {
      const targetDeg = metrics.targetDegree;
      if (confirm(`Deseja aprovar a OUTORGA do ${targetDeg}º Grau na Faixa ${selectedStudent.belt} para o aluno ${selectedStudent.name}?`)) {
        updateStudent(selectedStudent.id, {
          stripes: targetDeg,
          degrees: targetDeg,
          lastPromotionDate: new Date().toISOString().split('T')[0],
          beltSince: new Date(),
          isReadyForPromotion: false
        });
        setNotificationsPrev(`🥋 OSS! ${selectedStudent.name} promovido ao ${targetDeg}º Grau da Faixa ${selectedStudent.belt}!`);
        setSelectedStudent(null);
      }
    } else {
      if (confirm(`Deseja aprovar a GRADUAÇÃO de ${selectedStudent.name} para a ${BELT_LABELS[targetBelt]}? Isto resetará os Graus para zero e criará um registro histórico permanente.`)) {
        approveGraduation(selectedStudent.id, targetBelt);
        setSelectedStudent(null);
      }
    }
  };

  const triggerCertificate = (student: Student) => {
    setCertificateStudent(student);
    setShowCertificateModal(true);
  };

  // Requisito 15: MODO PROFESSOR - Permitir aprovar ou reprovar previsão automática
  const toggleProfessorCriteria = (studentId: string, value: boolean) => {
    updateStudent(studentId, { professorCriteria: value });
    setNotificationsPrev(`Critério do Professor alterado para ${value ? 'Aprovado' : 'Reprovado'} com sucesso!`);
  };

  // Alteridades manuais para Graus
  const changeStripesManually = (studentId: string, current: number, direction: 'up' | 'down') => {
    let nextVal = direction === 'up' ? current + 1 : current - 1;
    if (nextVal < 0) nextVal = 0;
    if (nextVal > 4) nextVal = 4;
    updateStudent(studentId, { stripes: nextVal, degrees: nextVal });
  };

  // Auxiliar para disparar alertas
  const [notifText, setNotifText] = useState<string | null>(null);
  const setNotificationsPrev = (msg: string) => {
    setNotifText(msg);
    setTimeout(() => setNotifText(null), 4000);
  };

  const runBlockchainVerification = () => {
    setIsVerifying(true);
    setVerificationResult(null);
    setTimeout(() => {
      const isIntegrityOk = verifyAuditIntegrity();
      setVerificationResult(isIntegrityOk ? 'success' : 'fail');
      setIsVerifying(false);
    }, 1800);
  };

  const currentSelectionMetrics = selectedStudent ? getStudentMetrics(selectedStudent.id) : null;

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence>
        {notifText && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/20 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl"
          >
            <CheckCircle2 className="text-emerald-500" size={18} />
            <span className="text-xs font-black uppercase tracking-wider">{notifText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
            Módulo Profissional de <span className="text-blue-600">Graduação IBJJF</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2 leading-relaxed">
            Gestão inteligente de Faixas, Graus, Linhas de Evolução e Inteligência Analítica de Performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => { setActiveBoard('adult'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeBoard === 'adult' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <Users size={12} /> Adultos
          </button>
          <button 
            onClick={() => { setActiveBoard('kids'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeBoard === 'kids' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <Baby size={12} /> Infantil (Kids)
          </button>
          <button 
            onClick={() => { setActiveBoard('history'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeBoard === 'history' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <Clock size={12} /> Histórico Geral
          </button>
          <button 
            onClick={() => { setActiveBoard('chart'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeBoard === 'chart' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <Scale size={12} /> Regulamento IBJJF
          </button>
          <button 
            onClick={() => { setActiveBoard('blackbelt'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeBoard === 'blackbelt' ? 'bg-slate-950 text-white border border-red-500/20 shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <Award size={12} className="text-red-500" /> Painel Faixa Preta
          </button>
        </div>
      </header>

      {/* REQUISITO 5: Regras de avaliação personalizada do Professor */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-600">
              <Settings2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">Regras de Graduação Personalizadas (Professor)</h3>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Defina as métricas recomendadas no tatame adicionais à carência da IBJJF</p>
            </div>
          </div>
          <button 
            onClick={() => setShowProfessorSettings(!showProfessorSettings)}
            className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
          >
            {showProfessorSettings ? 'Ocultar Filtros' : 'Ajustar Filtros'}
          </button>
        </div>

        <AnimatePresence>
          {showProfessorSettings && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-white/5 overflow-hidden"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} /> Tempo Mínimo (Carência Adicional - Meses)
                </label>
                <input 
                  type="number" 
                  value={customMinTime} 
                  onChange={(e) => setCustomMinTime(Math.max(0, parseInt(e.target.value) || 0))} 
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-white/5 rounded-xl border-none text-xs font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={12} /> Quantidade de Aulas Requeridas (Evolução)
                </label>
                <input 
                  type="number" 
                  value={customMinClasses} 
                  onChange={(e) => setCustomMinClasses(Math.max(1, parseInt(e.target.value) || 20))} 
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-white/5 rounded-xl border-none text-xs font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <UserCheck size={12} /> Comportamento & Desempenho Mínimo (%)
                </label>
                <input 
                  type="number" 
                  min="0" max="100"
                  value={customPresence} 
                  onChange={(e) => setCustomPresence(Math.max(0, Math.min(100, parseInt(e.target.value) || 75)))} 
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-white/5 rounded-xl border-none text-xs font-bold"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {activeBoard === 'chart' ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl space-y-8"
          >
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                <Scale size={20} className="text-blue-600" /> Regulamento Oficial de Graduações e Tempos (CBJJ & IBJJF)
              </h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-2 font-sans">
                Prazos regulamentados e limites de idade oficiais exigidos pela Confederação Brasileira de Jiu-Jitsu (CBJJ) e International Brazilian Jiu-Jitsu Federation (IBJJF). Nosso sistema valida esses limites de forma nativa.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LADO ESQUERDO: REGRAS E CARÊNCIA DE ALUNOS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                  <div className="p-1 bg-amber-500/10 text-amber-600 rounded">
                    <Users size={14} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Diretrizes e Carência de Alunos</h4>
                </div>

                <div className="space-y-3">
                  {[
                    { belt: "Branca", limit: 12, age: "A partir de 4 anos", desc: "Período básico de adaptação técnica e marcial" },
                    { belt: "Cinza", limit: 12, age: "4 a 15 anos", desc: "Grupo infantil, focado em destreza, motores e ludicidade" },
                    { belt: "Amarela", limit: 12, age: "7 a 15 anos", desc: "Grupo infantil, introdução a fundamentos avançados" },
                    { belt: "Laranja", limit: 12, age: "10 a 15 anos", desc: "Grupo infantil, evolução com foco técnico e tático" },
                    { belt: "Verde", limit: 12, age: "13 a 15 anos", desc: "Transição técnica final adaptada à categoria adulta" },
                    { belt: "Azul", limit: 24, age: "Mínimo 16 anos", desc: "Pilar do jiu-jitsu, tempo mínimo regulamentar de 2 anos" },
                    { belt: "Roxa", limit: 18, age: "Mínimo 16 anos", desc: "Domínio biomecânico refinado, tempo mínimo de 18 meses" },
                    { belt: "Marrom", limit: 12, age: "Mínimo 18 anos", desc: "Polimento técnico mestre, tempo mínimo regulamentar de 1 ano" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-4 rounded-md ${OFFICIAL_BELT_COLORS[item.belt] || 'bg-slate-500'} shrink-0`} />
                          <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{BELT_LABELS[item.belt] || item.belt}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.desc}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 text-right">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded uppercase tracking-wider">
                          Mínimo {item.limit >= 12 ? `${item.limit / 12} ${item.limit === 12 ? 'Ano' : 'Anos'}` : `${item.limit} Meses`}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.age}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              {/* LADO DIREITO: REGRAS E CARENCIA DE PROFESSORES / FAIXAS PRETAS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                  <div className="p-1 bg-rose-500/10 text-rose-600 rounded">
                    <Award size={14} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Diretrizes e Graus de Professores (Faixa Preta)</h4>
                </div>

                <div className="space-y-3">
                  {[
                    { rank: "Faixa Preta (Base)", limit: "Carência Regular", age: "Preta - Mínimo 19 anos", desc: "Outorgada por professores com pelo menos 2º Grau de Faixa Preta" },
                    { rank: "1º, 2º e 3º Graus", limit: "3 Anos em cada grau", age: "3 Anos de ativa", desc: "Prazos obrigatórios de magistério ativo e filiação regular para evolução" },
                    { rank: "4º, 5º e 6º Graus", limit: "5 Anos em cada grau", age: "5 Anos de ativa", desc: "Fase de alta maestria no tatame, exigindo formação de novos faixas pretas" },
                    { rank: "7º Grau (Coral Vermelha e Preta)", limit: "7 Anos no 6º Grau", age: "Idade Mínima: 50 anos", desc: "Título honorífico de Mestre de Jiu-Jitsu certificado pela CBJJ" },
                    { rank: "8º Grau (Coral Vermelha e Branca)", limit: "10 Anos no 7º Grau", age: "Idade Mínima: 60 anos", desc: "Grau avançado de mestre com longa jornada ativa dedicada à linhagem" },
                    { rank: "9º Grau (Faixa Vermelha)", limit: "10 Anos no 8º Grau", age: "Idade Mínima: 67 anos", desc: "Título honorífico supremo de Grande Mestre na história de evolução" },
                    { rank: "10º Grau (Vermelha)", limit: "Exclusivo fundação", age: "Dinastia Gracie", desc: "Reservado estatutariamente apenas aos desbravadores pioneiros do esporte" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all text-left">
                      <div className="space-y-1">
                        <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{item.rank}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.desc}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 text-right">
                        <span className="text-[10px] font-black text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded uppercase tracking-wider">
                          {item.limit}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.age}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BARRA INTERATIVA: SIMULADOR DE AUTORIDADE DE OUTORGA (Regra de Professores) */}
            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UserCheck size={16} className="text-blue-600" />
                    Simulador Regulamentar de Autoridade Outorgante (CBJJ)
                  </h4>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-relaxed">
                    Insira as qualificações de um professor para checar quais alunos ele está capacitado legalmente a graduar sob regras CBJJ.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 font-extrabold uppercase">Faixa do Professor</label>
                    <select 
                      value={simulatedProfessorBelt} 
                      onChange={(e) => setSimulatedProfessorBelt(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 dark:text-white"
                    >
                      <option value="Roxa">Faixa Roxa</option>
                      <option value="Marrom">Faixa Marrom</option>
                      <option value="Preta">Faixa Preta</option>
                      <option value="Coral">Faixa Coral (7º/8º Grau)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 font-extrabold uppercase">Graus / Stripes</label>
                    <select 
                      value={simulatedProfessorDegrees} 
                      onChange={(e) => setSimulatedProfessorDegrees(parseInt(e.target.value))}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                        <option key={d} value={d}>{d} Graus</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Resultado do Simulador de Autoridade */}
              <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-left">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Faixas de Alunos Autorizadas para Graduar</p>
                  <p className="font-extrabold uppercase tracking-tight text-slate-900 dark:text-white mt-1 leading-snug">
                    {simulatedProfessorBelt === 'Roxa' && 'Até Faixa Azul (Somente Infantil)'}
                    {simulatedProfessorBelt === 'Marrom' && 'Até Faixa Roxa (Adulto & Infantil)'}
                    {simulatedProfessorBelt === 'Preta' && simulatedProfessorDegrees < 1 && 'Até Faixa Roxa (Auxiliar)'}
                    {simulatedProfessorBelt === 'Preta' && simulatedProfessorDegrees === 1 && 'Até Faixa Marrom (Com registro)'}
                    {simulatedProfessorBelt === 'Preta' && simulatedProfessorDegrees >= 2 && 'Módulos Completos (De Branca até Faixa Preta)'}
                    {simulatedProfessorBelt === 'Coral' && 'Maestria Total (De Branca até Faixa Preta de Alto Rendimento)'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Capacidade de Assinar Diplomas CBJJ</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      (simulatedProfessorBelt === 'Preta' && simulatedProfessorDegrees >= 1) || simulatedProfessorBelt === 'Coral'
                        ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <span className="font-bold leading-normal text-slate-800 dark:text-slate-200">
                      {((simulatedProfessorBelt === 'Preta' && simulatedProfessorDegrees >= 1) || simulatedProfessorBelt === 'Coral')
                        ? 'Totalmente Autorizado como Titular' : 'Não qualificado para assinatura autônoma'
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Próxima Evolução do Professor</p>
                  <p className="font-extrabold text-slate-700 dark:text-slate-300 mt-1 leading-snug">
                    {simulatedProfessorBelt === 'Preta' && simulatedProfessorDegrees < 6 && `Mínimo 3 a 5 anos de Magistério ativo para o ${simulatedProfessorDegrees + 1}º Grau`}
                    {simulatedProfessorBelt === 'Preta' && simulatedProfessorDegrees === 6 && "Apto para Diplomação de Faixa Coral 7º Grau aos 50 anos de idade"}
                    {simulatedProfessorBelt === 'Coral' && "Mais 10 anos de carência de ensino regular de Jiu-Jitsu para o nível seguinte de grande mestre"}
                    {(simulatedProfessorBelt === 'Roxa' || simulatedProfessorBelt === 'Marrom') && "Carência regular para diplomação oficial na faixa preta"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeBoard === 'blackbelt' ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* 🥋 SENSEI MASTER OVERVIEW - Bento KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 border border-red-500/20 rounded-[2rem] p-6 shadow-xl flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total Faixas Pretas</span>
                  <h3 className="text-3xl font-black italic text-white tracking-tight">
                    {students.filter(s => (s.belt as any) === 'Preta').length}
                  </h3>
                  <p className="text-[9px] font-bold text-red-400 uppercase">Profissionais Cadastrados</p>
                </div>
                <div className="p-4 bg-red-500/15 rounded-2xl text-red-500">
                  <Award size={24} />
                </div>
              </div>

              <div className="bg-slate-950 border border-red-500/20 rounded-[2rem] p-6 shadow-xl flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Elegíveis (IBJJF)</span>
                  <h3 className="text-3xl font-black italic text-emerald-400 tracking-tight">
                    {students.filter(s => {
                      if ((s.belt as any) !== 'Preta') return false;
                      const prog = calculateBlackBeltProgress(s);
                      return prog && prog.status === 'Elegível';
                    }).length}
                  </h3>
                  <p className="text-[9px] font-bold text-emerald-400 uppercase">Tempo e Idade Mínimos Atingidos</p>
                </div>
                <div className="p-4 bg-emerald-500/15 rounded-2xl text-emerald-400">
                  <UserCheck size={24} />
                </div>
              </div>

              <div className="bg-slate-950 border border-red-500/20 rounded-[2rem] p-6 shadow-xl flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Evolução em Breve</span>
                  <h3 className="text-3xl font-black italic text-blue-400 tracking-tight">
                    {students.filter(s => {
                      if ((s.belt as any) !== 'Preta') return false;
                      const prog = calculateBlackBeltProgress(s);
                      return prog && prog.status === 'Em Progressão' && prog.monthsRemaining <= 12;
                    }).length}
                  </h3>
                  <p className="text-[9px] font-bold text-blue-400 uppercase">Menores de 12 Meses Próximos</p>
                </div>
                <div className="p-4 bg-blue-500/15 rounded-2xl text-blue-400">
                  <Clock size={24} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LADO ESQUERDO: LISTA DE FACHAS PRETAS */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                  <div className="text-left">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Quadro Geral de Faixas Pretas</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Clique para editar histórico, previsões e graus regulamentares</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {students.filter(s => (s.belt as any) === 'Preta').length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                      <Award size={48} className="mx-auto text-slate-300 dark:text-white/10 mb-4" />
                      Nenhum aluno cadastrado com Faixa Preta no momento. OSS!
                    </div>
                  ) : (
                    students.filter(s => (s.belt as any) === 'Preta').map((student) => {
                      const prog = calculateBlackBeltProgress(student);
                      const isSelected = editingBlackBelt?.id === student.id;

                      return (
                        <motion.button
                          key={student.id}
                          onClick={() => setEditingBlackBelt(student)}
                          whileHover={{ scale: 1.01 }}
                          className={`w-full p-5 rounded-2xl border text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                            isSelected 
                              ? 'bg-slate-950 text-white border-red-500/50 shadow-md' 
                              : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 border border-slate-800 text-red-500 font-black text-lg italic rounded-xl flex items-center justify-center shadow">
                              {student.blackBeltDegree || 0}G
                            </div>
                            <div className="text-left">
                              <h5 className={`font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                {student.name}
                              </h5>
                              <div className="flex gap-2 items-center mt-1 text-[9px] font-black uppercase tracking-wider">
                                <span className="text-red-500">
                                  {prog?.displayBelt || "Preta"}
                                </span>
                                <span className={isSelected ? 'text-slate-400' : 'text-slate-400'}>
                                  • {prog?.timeSpentYears || 0} Anos de Preta
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end md:self-auto">
                            <div className="text-right flex flex-col items-end">
                              <span className={`px-2.5 py-1 text-[8px] font-black rounded uppercase tracking-wider ${
                                prog?.status === 'Elegível' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {prog?.status || 'Em Progressão'}
                              </span>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {prog?.status === 'Elegível' ? 'Apto para Graduação' : `Faltam ${prog?.yearsRemaining || 0} anos`}
                              </p>
                            </div>
                            
                            <ChevronRight size={16} className={isSelected ? 'text-red-500' : 'text-slate-400'} />
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* LADO DIREITO: FORMULÁRIO DE GESTÃO DO FAIXA PRETA */}
              <div className="space-y-6">
                {editingBlackBelt ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-950 border border-red-500/20 rounded-[3rem] p-6 shadow-xl space-y-6 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[200px]">
                          {editingBlackBelt.name}
                        </h4>
                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-0.5">Editor de Carreira do Faixa Preta</p>
                      </div>
                      <button 
                        onClick={() => setEditingBlackBelt(null)}
                        className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Grau Atual de Faixa Preta</label>
                        <select 
                          value={editingBlackBelt.blackBeltDegree || 0}
                          onChange={(e) => setEditingBlackBelt({ ...editingBlackBelt, blackBeltDegree: parseInt(e.target.value) })}
                          className="w-full bg-slate-900 border border-white/10 text-white rounded-xl py-2 px-3 outline-none focus:ring-1 focus:ring-red-500 font-bold"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                            <option key={d} value={d} className="bg-slate-950 text-white">{d} Graus</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Data de Outorga da Faixa Preta</label>
                        <input 
                          type="date"
                          value={editingBlackBelt.blackBeltDate ? new Date(editingBlackBelt.blackBeltDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditingBlackBelt({ ...editingBlackBelt, blackBeltDate: e.target.value })}
                          className="w-full bg-slate-900 border border-white/10 text-white rounded-xl py-2 px-3 outline-none focus:ring-1 focus:ring-red-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Data do Último Grau Concedido</label>
                        <input 
                          type="date"
                          value={editingBlackBelt.lastDegreeDate ? new Date(editingBlackBelt.lastDegreeDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditingBlackBelt({ ...editingBlackBelt, lastDegreeDate: e.target.value })}
                          className="w-full bg-slate-900 border border-white/10 text-white rounded-xl py-2 px-3 outline-none focus:ring-1 focus:ring-red-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Anotações da Graduação & Carreira</label>
                        <textarea 
                          value={editingBlackBelt.graduationNotes || ''}
                          onChange={(e) => setEditingBlackBelt({ ...editingBlackBelt, graduationNotes: e.target.value })}
                          rows={3}
                          placeholder="Foco técnico, histórico de conquistas ou competências na academia..."
                          className="w-full bg-slate-900 border border-white/10 text-slate-300 rounded-xl py-2 px-3 outline-none focus:ring-1 focus:ring-red-500 font-medium text-xs resize-none"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          setIsSavingBlackBelt(true);
                          try {
                            const cleanDate = editingBlackBelt.blackBeltDate ? new Date(editingBlackBelt.blackBeltDate) : null;
                            const cleanLastDate = editingBlackBelt.lastDegreeDate ? new Date(editingBlackBelt.lastDegreeDate) : null;
                            
                            // Calcula previsões automaticamente com base nas regras de carência
                            const reqYears = BLACK_BELT_RULES[editingBlackBelt.blackBeltDegree || 0] || 3;
                            let forecastDate = cleanDate ? new Date(cleanDate) : new Date();
                            if (cleanLastDate) {
                              forecastDate = new Date(cleanLastDate);
                            }
                            forecastDate.setFullYear(forecastDate.getFullYear() + reqYears);

                            await updateStudent(editingBlackBelt.id, {
                              blackBeltDegree: editingBlackBelt.blackBeltDegree || 0,
                              blackBeltDate: cleanDate || undefined,
                              lastDegreeDate: cleanLastDate || undefined,
                              graduationEligibleDate: forecastDate,
                              graduationNotes: editingBlackBelt.graduationNotes || '',
                              // Mantém o belt synced
                              belt: 'Preta' as any
                            });
                            
                            // Visual Confete e Alerta
                            try {
                              import('canvas-confetti').then((m) => {
                                m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                              });
                            } catch (e) {}

                            // Atualizar localmente
                            const updatedFromStudentsList = students.find(s => s.id === editingBlackBelt.id);
                            if (updatedFromStudentsList) {
                              setEditingBlackBelt({
                                ...updatedFromStudentsList,
                                blackBeltDegree: editingBlackBelt.blackBeltDegree || 0,
                                blackBeltDate: cleanDate,
                                lastDegreeDate: cleanLastDate,
                                graduationEligibleDate: forecastDate,
                                graduationNotes: editingBlackBelt.graduationNotes || ''
                              });
                            }
                          } catch (err) {
                            console.error("Erro salvando faixa preta:", err);
                          } finally {
                            setIsSavingBlackBelt(false);
                          }
                        }}
                        disabled={isSavingBlackBelt}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow"
                      >
                        {isSavingBlackBelt ? (
                          <Zap size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        {isSavingBlackBelt ? 'Gravando Alterações...' : 'Salvar Carreira Profissional'}
                      </button>
                    </div>

                    {/* INTERACTIVE TIMELINE DEGREE PATH */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <h5 className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                        <TrendingUp size={10} className="text-red-500" /> Linha do Tempo de Graus CBJJ
                      </h5>
                      <div className="space-y-3 pl-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((deg) => {
                          const isActive = deg <= (editingBlackBelt.blackBeltDegree || 0);
                          const isNext = deg === (editingBlackBelt.blackBeltDegree || 0) + 1;
                          
                          let name = `${deg}º Grau`;
                          if (deg >= 8) name = `Mestre Coral ${deg}º Grau (Vermelha/Branca)`;
                          else if (deg >= 7) name = `Mestre Coral ${deg}º Grau (Vermelha/Preta)`;
                          else if (deg === 9) name = `Grande Mestre ${deg}º Grau (Vermelha)`;

                          return (
                            <div key={deg} className="flex gap-3 relative">
                              <div className="flex flex-col items-center shrink-0">
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${
                                  isActive 
                                    ? 'bg-red-500 text-white shadow shadow-red-500/50' 
                                    : isNext 
                                      ? 'bg-slate-800 text-slate-300 ring-2 ring-blue-500/50 border border-slate-700 animate-pulse' 
                                      : 'bg-slate-905 text-slate-600 border border-white/5'
                                }`}>
                                  {isActive ? '✓' : deg}
                                </div>
                                {deg < 9 && <div className="w-[1px] h-6 bg-white/5 mt-1" />}
                              </div>
                              <div className="text-left">
                                <p className={`text-[10px] font-black ${isActive ? 'text-white' : isNext ? 'text-blue-400' : 'text-slate-600'}`}>
                                  {name}
                                </p>
                                {isNext && (
                                  <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                                    Requer mais {BLACK_BELT_RULES[editingBlackBelt.blackBeltDegree || 0] || 3} anos neste grau
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-950/40 border border-white/5 rounded-[3rem] p-8 text-center text-slate-500 flex flex-col items-center justify-center h-[350px]">
                    <Award size={36} className="text-red-500/20 mb-3 animate-ping" />
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Motor de Evolução Profissional</p>
                    <p className="text-[9px] font-semibold text-slate-500 max-w-[200px] mt-1 text-center">
                      OSS! Selecione um Faixa Preta para calcular automaticamente a carência e próximos graus regulamentares.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeBoard === 'history' ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" /> Livro de Registros de Graduação
                </h3>
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mt-1">Histórico imutável de graduações e progressões no Ledger da Academia</p>
              </div>
              <button 
                onClick={runBlockchainVerification}
                disabled={isVerifying}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                {isVerifying ? <Zap size={12} className="animate-spin text-blue-500" /> : <Lock size={12} />}
                {isVerifying ? 'Verificando Ledger...' : 'Auditar Integridade Digital'}
              </button>
            </div>

            <AnimatePresence>
              {verificationResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-6 rounded-2xl flex items-center gap-4 text-white ${verificationResult === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}
                >
                  <ShieldCheck size={36} className="shrink-0" />
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Audit de Integridade Concluído!</h4>
                    <p className="text-xs opacity-90 font-medium leading-relaxed mt-1">
                      {verificationResult === 'success' 
                        ? 'Todas as assinaturas e passagens de faixas foram verificadas via hash de redundância. Nenhuma alteração não autorizada foi detectada.' 
                        : 'Atenção! Foram detectados descompassos nos registros de historização no Ledger.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {graduationHistory.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                  <AlertCircle size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ainda não foram registradas graduações no Ledger.</p>
                </div>
              ) : (
                graduationHistory.map((hist, hIdx) => {
                  const resolvedStudent = students.find(s => s.id === hist.studentId);
                  return (
                    <div key={hIdx} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-transparent hover:border-blue-600/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 overflow-hidden flex items-center justify-center font-black">
                          {resolvedStudent ? resolvedStudent.name[0] : 'G'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {resolvedStudent ? resolvedStudent.name : 'Guerreiro'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-black uppercase text-slate-400">{hist.previousBelt}</span>
                            <ChevronRight size={10} className="text-slate-300" />
                            <span className="text-[8px] font-black uppercase text-blue-600 font-extrabold">{hist.newBelt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-black text-slate-800 dark:text-white">
                          Certificado e Homologado
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {new Date(hist.promotedAt).toLocaleDateString('pt-BR')} • Por {hist.promotedBy || 'Sensei'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Lista de Alunos e Busca */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" />
                    Quadro Evolutivo de Alunos ({activeBoard === 'adult' ? 'Adulto' : 'Infantil'})
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar graduações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredStudents.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                      <AlertCircle size={36} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum guerreiro correspondente.</p>
                    </div>
                  ) : (
                    filteredStudents.map(student => {
                      const metrics = getStudentMetrics(student.id);
                      const isSelected = selectedStudent?.id === student.id;

                      return (
                        <motion.button
                          key={student.id}
                          whileHover={{ x: 6 }}
                          onClick={() => setSelectedStudent(student)}
                          className={`w-full p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left transition-all ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-50 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15'}`}
                        >
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border-2 border-white/20">
                              {student.photo || student.photoUrl ? (
                                <img src={student.photo || student.photoUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-lg uppercase">
                                  {student.name[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-black uppercase tracking-tight text-sm truncate max-w-[180px]">
                                {student.name}
                              </h4>
                              {/* Requisito 11: Renderização de cores oficiais */}
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-8 h-2 rounded-full ${OFFICIAL_BELT_COLORS[student.belt] || 'bg-slate-500'} border border-black/10`} />
                                <span className={`text-[8.5px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                  {student.belt} • {student.stripes || student.degrees || 0} Graus
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 self-end md:self-auto">
                            {/* Requisito 14 - Índice Evolutivo badge */}
                            <div className="flex flex-col items-end shrink-0">
                              <p className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>Índice Evolutivo</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${metrics.evolutionScore}%` }} />
                                </div>
                                <span className="text-xs font-black italic">{metrics.evolutionScore}%</span>
                              </div>
                            </div>

                            {/* Alertas Rápidos */}
                            <div className="flex gap-1.5">
                              {metrics.isApto && (
                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-blue-900 border border-emerald-500/20 rounded font-black uppercase tracking-wider">
                                  Apto
                                </span>
                              )}
                              {metrics.nextStripeIn30Days && (
                                <span className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-blue-900 border border-amber-500/20 rounded font-black uppercase tracking-wider">
                                  Grau Próximo
                                </span>
                              )}
                              {metrics.ibjjfEligible && (
                                <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-blue-900 border border-blue-500/20 rounded font-black uppercase tracking-wider">
                                  Carência OK
                                </span>
                              )}
                            </div>

                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-white/15' : 'bg-white dark:bg-slate-800'}`}>
                              <ChevronRight size={14} />
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Painel de Controle Lateral de Graduação */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {selectedStudent && currentSelectionMetrics ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    key={selectedStudent.id}
                    className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-6 shadow-xl space-y-6"
                  >
                    <div className="text-center space-y-3">
                      <div className="w-24 h-24 rounded-[1.5rem] border-2 border-slate-100 dark:border-white/5 overflow-hidden mx-auto shadow-md relative group">
                        {selectedStudent.photo || selectedStudent.photoUrl ? (
                          <img src={selectedStudent.photo || selectedStudent.photoUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-2xl font-black text-slate-300">
                            {selectedStudent.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">{selectedStudent.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Membro Ativo • Registro Oficial</p>
                      </div>
                    </div>

                    {/* REQUISITO 12: Graus interativos 0 até 4 */}
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Graus na Faixa Atual</p>
                        <div className="flex gap-1.5 mt-1.5">
                          {[1, 2, 3, 4].map((idx) => (
                            <div 
                              key={idx} 
                              className={`w-6 h-6 border rounded flex items-center justify-center text-xs font-black ${idx <= (selectedStudent.stripes || selectedStudent.degrees || 0) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-400'}`}
                            >
                              {idx}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => changeStripesManually(selectedStudent.id, selectedStudent.stripes || 0, 'down')}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => changeStripesManually(selectedStudent.id, selectedStudent.stripes || 0, 'up')}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* PARÂMETROS DO EXAME DE FAIXA (Regulatório CBJJ/IBJJF) */}
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-amber-500 scale-105" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[9.5px] text-slate-900 dark:text-white">Parâmetros do Exame de Faixa</h4>
                        </div>
                        <span className="text-[8px] font-black bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded uppercase tracking-wider">Avaliação Técnica</span>
                      </div>

                      {/* Requisitos Checklists */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={!!selectedStudent.examRequirements?.feePaid}
                            onChange={(e) => {
                              const requirements = selectedStudent.examRequirements || {};
                              updateStudent(selectedStudent.id, {
                                examRequirements: { ...requirements, feePaid: e.target.checked }
                              });
                            }}
                            className="rounded border-slate-300 dark:border-white/10 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-white dark:bg-slate-800"
                          />
                          <span className="text-slate-600 dark:text-slate-400">Taxa paga</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={!!selectedStudent.examRequirements?.theoreticalChecked}
                            onChange={(e) => {
                              const requirements = selectedStudent.examRequirements || {};
                              updateStudent(selectedStudent.id, {
                                examRequirements: { ...requirements, theoreticalChecked: e.target.checked }
                              });
                            }}
                            className="rounded border-slate-300 dark:border-white/10 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-white dark:bg-slate-800"
                          />
                          <span className="text-slate-600 dark:text-slate-400">Exame Teórico</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={!!selectedStudent.examRequirements?.practicalChecked}
                            onChange={(e) => {
                              const requirements = selectedStudent.examRequirements || {};
                              updateStudent(selectedStudent.id, {
                                examRequirements: { ...requirements, practicalChecked: e.target.checked }
                              });
                            }}
                            className="rounded border-slate-300 dark:border-white/10 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-white dark:bg-slate-800"
                          />
                          <span className="text-slate-600 dark:text-slate-400">Teste Prático</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={!!selectedStudent.examRequirements?.financialChecked}
                            onChange={(e) => {
                              const requirements = selectedStudent.examRequirements || {};
                              updateStudent(selectedStudent.id, {
                                examRequirements: { ...requirements, financialChecked: e.target.checked }
                              });
                            }}
                            className="rounded border-slate-300 dark:border-white/10 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-white dark:bg-slate-800"
                          />
                          <span className="text-slate-600 dark:text-slate-400">Financeiro OK</span>
                        </label>
                      </div>

                      {/* Sliders para pontuação */}
                      <div className="space-y-3 border-t border-slate-200/45 dark:border-slate-800 pt-3">
                        <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Fundamentos e Habilidades (Nota 0 a 10)</p>
                        
                        {/* Quedas */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-slate-500 dark:text-slate-400">Quedas & Projeções (Takedowns)</span>
                            <span className="font-extrabold text-blue-600">{selectedStudent.examRequirements?.scoreTakedowns ?? 7} / 10</span>
                          </div>
                          <input 
                            type="range" min="0" max="10" step="1"
                            value={selectedStudent.examRequirements?.scoreTakedowns ?? 7}
                            onChange={(e) => {
                              const requirements = selectedStudent.examRequirements || {};
                              updateStudent(selectedStudent.id, {
                                examRequirements: { ...requirements, scoreTakedowns: parseInt(e.target.value) }
                              });
                            }}
                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        {/* Passagens */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-slate-500 dark:text-slate-400">Controle & Passagem de Guarda</span>
                            <span className="font-extrabold text-blue-600">{selectedStudent.examRequirements?.scoreGuard ?? 7} / 10</span>
                          </div>
                          <input 
                            type="range" min="0" max="10" step="1"
                            value={selectedStudent.examRequirements?.scoreGuard ?? 7}
                            onChange={(e) => {
                              const requirements = selectedStudent.examRequirements || {};
                              updateStudent(selectedStudent.id, {
                                examRequirements: { ...requirements, scoreGuard: parseInt(e.target.value) }
                              });
                            }}
                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        {/* Defesa */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-slate-500 dark:text-slate-400">Defesa Pessoal & Saídas</span>
                            <span className="font-extrabold text-blue-600">{selectedStudent.examRequirements?.scoreDefense ?? 7} / 10</span>
                          </div>
                          <input 
                            type="range" min="0" max="10" step="1"
                            value={selectedStudent.examRequirements?.scoreDefense ?? 7}
                            onChange={(e) => {
                              const requirements = selectedStudent.examRequirements || {};
                              updateStudent(selectedStudent.id, {
                                examRequirements: { ...requirements, scoreDefense: parseInt(e.target.value) }
                              });
                            }}
                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        {/* Combate */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-slate-500 dark:text-slate-400">Combate Real (Pre-Sparring)</span>
                            <span className="font-extrabold text-blue-600">{selectedStudent.examRequirements?.scoreCombate ?? 7} / 10</span>
                          </div>
                          <input 
                            type="range" min="0" max="10" step="1"
                            value={selectedStudent.examRequirements?.scoreCombate ?? 7}
                            onChange={(e) => {
                              const requirements = selectedStudent.examRequirements || {};
                              updateStudent(selectedStudent.id, {
                                examRequirements: { ...requirements, scoreCombate: parseInt(e.target.value) }
                              });
                            }}
                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      </div>

                      {/* Média de Exame Final */}
                      {(() => {
                        const tScore = Number(selectedStudent.examRequirements?.scoreTakedowns ?? 7);
                        const gScore = Number(selectedStudent.examRequirements?.scoreGuard ?? 7);
                        const dScore = Number(selectedStudent.examRequirements?.scoreDefense ?? 7);
                        const cScore = Number(selectedStudent.examRequirements?.scoreCombate ?? 7);
                        const avg = Math.round(((tScore + gScore + dScore + cScore) / 4) * 10) / 10;
                        const isExamApproved = avg >= 7.0 && 
                          selectedStudent.examRequirements?.feePaid && 
                          selectedStudent.examRequirements?.theoreticalChecked && 
                          selectedStudent.examRequirements?.practicalChecked && 
                          selectedStudent.examRequirements?.financialChecked;

                        return (
                          <div className={`p-3 rounded-xl flex items-center justify-between text-[11px] font-black ${isExamApproved ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                            <div className="flex flex-col">
                              <span>Média: {avg} / 10.0</span>
                              <span className="text-[8px] text-slate-405 font-bold uppercase mt-0.5">Mínimo: 7.0</span>
                            </div>
                            <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-[8px] font-black uppercase tracking-widest">
                              {isExamApproved ? 'Aprovado' : 'Pendências'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* REQUISITO 9: Alertas Inteligentes e Carência */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                        <Scale size={13} className="text-blue-600" /> Elegibilidade & Prazos IBJJF
                      </h4>
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-500">Tempo na Faixa</span>
                          <span className="font-black">{currentSelectionMetrics.monthsElapsed} meses</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-500">Carência Mínima</span>
                          <span className="font-black">{currentSelectionMetrics.ibjjfMinMonths} meses</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-slate-100 dark:border-white/5 pt-2">
                          <span className="font-bold text-slate-500">Idade Registrada</span>
                          <span className="font-black">{currentSelectionMetrics.age} anos</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-500">Idade Mínima Exigida</span>
                          <span className="font-black">{currentSelectionMetrics.reqAge} anos</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                            <span>Progresso Regulamento</span>
                            <span>{currentSelectionMetrics.timeProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${currentSelectionMetrics.timeProgress}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Alertas baseados em regras */}
                      <div className="space-y-2">
                        {currentSelectionMetrics.isApto && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                            <CheckCircle2 size={13} /> Apto para graduação (Todas as regras cumpridas)
                          </div>
                        )}
                        {currentSelectionMetrics.nextStripeIn30Days && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                            <Clock size={13} /> Próximo grau em {currentSelectionMetrics.daysToNextStripe} dias
                          </div>
                        )}
                        {currentSelectionMetrics.isTimeCompleted ? (
                          <div className="p-3 bg-blue-500/10 border border-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                            <CheckCircle2 size={13} /> Tempo mínimo concluído (Elegível IBJJF)
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                            <ShieldAlert size={13} /> Carência incompleta (Faltam {Math.max(0, currentSelectionMetrics.ibjjfMinMonths - currentSelectionMetrics.monthsElapsed)} meses)
                          </div>
                        )}
                        {currentSelectionMetrics.isAgeCompleted ? (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                            <CheckCircle2 size={13} /> Idade regulamentar confirmada ({currentSelectionMetrics.age} anos)
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                            <ShieldAlert size={13} /> Idade incompatível (Menor de {currentSelectionMetrics.reqAge} anos)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CRONOGRAMA DE GRAUS - EXCLUSIVO FAIXA PRETA (Requisito Especial) */}
                    {(selectedStudent.belt as any) === 'Preta' && (
                      <div className="space-y-3 p-5 bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-[2rem] border border-red-500/20 shadow-2xl relative overflow-hidden">
                        {/* Background subtle elements */}
                        <div className="absolute right-0 top-0 w-24 h-24 bg-red-600/10 rounded-full blur-[30px] pointer-events-none" />
                        
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                          <Award className="text-red-500 scale-110" size={16} />
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">Cronograma de Graus (Faixa Preta)</h4>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Previsão regulamentar baseada nas regras de carência da CBJJ</p>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 select-none">
                          {getBlackBeltTimeline(
                            (() => {
                              let bDateStr = "";
                              if (selectedStudent.beltSince) {
                                if (selectedStudent.beltSince instanceof Date) {
                                  bDateStr = selectedStudent.beltSince.toISOString().split('T')[0];
                                } else {
                                  bDateStr = String(selectedStudent.beltSince);
                                }
                              } else if (selectedStudent.lastPromotionDate) {
                                bDateStr = selectedStudent.lastPromotionDate;
                              }
                              return bDateStr;
                            })(),
                            selectedStudent.birthDate,
                            selectedStudent.stripes || selectedStudent.degrees || 0
                          ).map((milestone) => {
                            const isCompleted = milestone.status === 'concluido';
                            const isCurrent = milestone.status === 'vigente';

                            return (
                              <div 
                                key={milestone.degree} 
                                className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                                  isCompleted 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                                    : isCurrent 
                                      ? 'bg-red-500/10 border-red-500/30 text-red-200 ring-1 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                                      : 'bg-white/5 border-white/5 text-slate-300 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-black uppercase text-[8.5px] tracking-wider">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-400' : isCurrent ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                                    {milestone.label}
                                  </div>
                                  <span className={`text-[7px] px-1.5 py-0.5 rounded font-black tracking-widest ${
                                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-slate-400'
                                  }`}>
                                    {isCompleted ? 'CONCLUÍDO' : isCurrent ? 'EM PROGRESSO' : 'PROJETADO'}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center text-[8.5px] font-mono mt-0.5 text-slate-400">
                                  <span>Carência: <strong className="text-white font-bold">{milestone.totalYears} anos</strong></span>
                                  <span>Idade Mín: <strong className="text-white font-bold">{milestone.minAge} anos</strong></span>
                                </div>

                                <div className="text-[10px] flex items-center justify-between font-bold border-t border-white/5 pt-1.5 pb-0.5 mt-1">
                                  <span className="text-slate-400 font-semibold">Previsão Outorga</span>
                                  <span className={isCompleted ? 'text-emerald-400 font-black' : isCurrent ? 'text-red-400 font-black animate-pulse' : 'text-slate-200 font-medium'}>
                                    {isCompleted ? '✓ Concedido' : isCurrent ? `⌛ Faltam ${milestone.monthsRemaining} meses (${milestone.formattedDate})` : milestone.formattedDate}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Autoridade de Outorga (CBJJ Sec 5) */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                        <Award size={13} className="text-rose-600" /> Autoridade de Outorga (CBJJ)
                      </h4>
                      {(() => {
                        const profBelt = simulatedProfessorBelt;
                        const profDeg = simulatedProfessorDegrees;
                        const nextB = currentSelectionMetrics.nextBelt;
                        
                        const normProf = profBelt.toLowerCase();
                        const normNext = nextB.toLowerCase();
                        
                        let isAuthOk = true;
                        let authReason = "Professor habilitado legalmente para esta outorga.";

                        if (normNext === "coral" || normNext === "coralbranca" || normNext === "vermelha") {
                          isAuthOk = normProf === "coral" || (normProf === "preta" && profDeg >= 7);
                          authReason = isAuthOk 
                            ? "Mestre habilitado. Exige protocolo de homologação complementar junto à CBJJ/IBJJF." 
                            : "Grau avançado de mestre ou chancela direta da Confederação necessária para Faixa Coral ou Vermelha.";
                        } else if (normNext === "preta") {
                          isAuthOk = (normProf === "preta" && profDeg >= 2) || normProf === "coral";
                          authReason = isAuthOk 
                            ? "Professor com no mínimo 2º Grau habilitado para certificar novos faixas pretas." 
                            : "Regulamento Sec. 5.2: Apenas professores Faixa Preta diplomados com no mínimo 2 Graus podem assinar Faixas Pretas.";
                        } else if (normNext === "marrom") {
                          isAuthOk = normProf === "preta" || normProf === "coral";
                          authReason = isAuthOk 
                            ? "Professor Faixa Preta habilitado para outorgas de Faixa Marrom." 
                            : "Faixa Marrom exige outorga e assinatura direta de um professor Faixa Preta diplomado.";
                        } else if (normNext === "roxa") {
                          isAuthOk = ["marrom", "preta", "coral"].includes(normProf);
                          authReason = isAuthOk 
                            ? "Graduação do professor qualificada para outorgar Faixa Roxa." 
                            : "Faixa Roxa exige assinatura de professor com no mínimo Faixa Marrom.";
                        } else if (normNext === "azul") {
                          isAuthOk = ["roxa", "marrom", "preta", "coral"].includes(normProf);
                          authReason = isAuthOk 
                            ? "Professor/Instrutor apto para chancelar Faixa Azul." 
                            : "Faixa Azul exige assinatura de instrutor com no mínimo Faixa Roxa.";
                        }

                        return (
                          <div className={`p-3.5 rounded-2xl border text-[10px] space-y-2 ${isAuthOk ? 'bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 border-emerald-500/15' : 'bg-rose-500/5 text-rose-800 dark:text-rose-300 border-rose-500/15'}`}>
                            <div className="flex items-center justify-between font-black uppercase tracking-tight">
                              <span>Outorga:</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] tracking-widest ${isAuthOk ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
                                {isAuthOk ? 'VERIFICADO' : 'NÃO AUTORIZADO'}
                              </span>
                            </div>
                            <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{authReason}</p>
                            <div className="font-mono text-[8px] text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-white/5">
                              Assinatura: {profBelt} {profDeg} Graus &rarr; Aluno: {BELT_LABELS[nextB] || nextB}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* REQUISITO 15: MODO PROFESSOR - Aprovar ou Reprovar previsão automática */}
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight">Status do Professor</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Aprovar previsão automática da IA</p>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => toggleProfessorCriteria(selectedStudent.id, false)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${selectedStudent.professorCriteria === false ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200'}`}
                          >
                            <X size={10} className="inline mr-1" /> Reprovar
                          </button>
                          <button 
                            onClick={() => toggleProfessorCriteria(selectedStudent.id, true)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${selectedStudent.professorCriteria !== false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200'}`}
                          >
                            <Check size={10} className="inline mr-1" /> Aprovar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Botoes de Ações Finais */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => triggerCertificate(selectedStudent)}
                        className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                      >
                        <CertificateIcon size={14} /> Certificado
                      </button>
                      
                      <button 
                        onClick={handleApprove}
                        disabled={!currentSelectionMetrics.isApto && selectedStudent.professorCriteria !== true}
                        className={`p-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all text-white ${selectedStudent.professorCriteria !== false ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/10' : 'bg-slate-700'}`}
                      >
                        <Medal size={14} /> Graduar Aluno
                      </button>
                    </div>

                    {/* REQUISITO 13: PREVISÃO FUTURA COMPLETA */}
                    <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={11} /> Linha do Tempo e Previsão Futura
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                          <span className="font-bold text-slate-500">Próxima Faixa</span>
                          <span className="font-black text-blue-600">{BELT_LABELS[currentSelectionMetrics.nextBelt] || currentSelectionMetrics.nextBelt}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                          <span className="font-bold text-slate-500">Previsão Próxima Faixa</span>
                          <span className="font-black">{currentSelectionMetrics.nextPromotionDate.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                          <span className="font-bold text-slate-500">Ano Estimado Faixa Preta</span>
                          <span className="font-black text-rose-500">
                            {new Date().getFullYear() + ((selectedStudent.belt as string) === 'Preta' || (selectedStudent.belt as string) === 'Black' ? 0 : 5)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-12 text-center h-96 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-300">
                      <UserCheck size={28} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Avaliação Técnica</h3>
                    <p className="mt-1 text-slate-400 text-xs font-semibold leading-relaxed">
                      Selecione um guerreiro ao lado para calcular previsões, histórico de evolução, graus e gerar certificados.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUISITO 17: MODAL DE CERTIFICADO DE GRADUAÇÃO IMPRESSÃO/PDF */}
      <AnimatePresence>
        {showCertificateModal && certificateStudent && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white text-slate-950 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Controles de Configuração do Certificado */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-tight">Configurações do Certificado</h4>
                  <p className="text-[10px] text-slate-500">Defina o nome do Professor e da Academia antes de gerar o PDF / Imprimir.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input 
                    type="text" 
                    value={certProfessorName} 
                    onChange={(e) => setCertProfessorName(e.target.value)}
                    placeholder="Nome do Professor"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <input 
                    type="text" 
                    value={certAcademyName} 
                    onChange={(e) => setCertAcademyName(e.target.value)}
                    placeholder="Nome da Academia"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <button 
                    onClick={() => window.print()} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <Printer size={12} /> Imprimir / PDF
                  </button>
                  <button 
                    onClick={() => setShowCertificateModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-black uppercase tracking-widest"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Corpo do Certificado (Perfeito para Impressão) */}
              <div id="graduation-certificate" className="p-16 bg-neutral-50 relative border-8 border-double border-slate-300 m-8 text-center flex flex-col justify-between h-[500px] select-none shadow-sm font-serif">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                
                {/* Cabeçalho */}
                <div className="relative z-10 space-y-2">
                  <div className="w-16 h-16 bg-slate-900 mx-auto rounded-full flex items-center justify-center text-white border-2 border-amber-500">
                    <Award size={32} className="text-amber-400" />
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-widest uppercase italic font-bold text-slate-900 mt-2">SYSBJJ 2.0</h1>
                  <p className="text-[10px] tracking-widest uppercase text-slate-500 font-sans">Diploma de Evolução e Graduação Técnica</p>
                </div>

                {/* Conteúdo Central */}
                <div className="relative z-10 space-y-4 my-6">
                  <p className="text-base italic text-slate-600 text-xl">
                    Certificamos para os devidos fins de mérito que o atleta
                  </p>
                  <h2 className="text-3xl font-black text-slate-950 uppercase border-b border-slate-300 pb-2 max-w-lg mx-auto py-1 font-sans">
                    {certificateStudent.name}
                  </h2>
                  <p className="text-base italic text-slate-600 text-xl leading-relaxed">
                    após cumprir os rigores técnicos e comportamentais estipulados pela academia e pela linha de linhagem de mestre, foi promovido com maestria ao nível de
                  </p>
                  <div className="inline-block px-10 py-3 bg-slate-900 text-amber-400 rounded-full font-sans text-lg font-black tracking-widest uppercase shadow-md pointer-events-none mt-2">
                    {BELT_LABELS[certificateStudent.belt] || certificateStudent.belt}
                  </div>
                </div>

                {/* Rodapé e Assinaturas */}
                <div className="relative z-10 grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mt-4 font-sans">
                  <div className="text-center">
                    <p className="border-b border-slate-300 h-6 max-w-[200px] mx-auto italic text-slate-500 text-xs">
                      {certProfessorName}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Professor Responsável</p>
                  </div>
                  <div className="text-center">
                    <p className="border-b border-slate-300 h-6 max-w-[200px] mx-auto italic text-slate-500 text-xs">
                      {certAcademyName}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Academia</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BeltSystem;
