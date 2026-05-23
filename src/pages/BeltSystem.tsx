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
  
  // Abas: Adultos, Kids, Histórico Geral, Tabela IBJJF
  const [activeBoard, setActiveBoard] = useState<'adult' | 'kids' | 'history' | 'chart'>('adult');
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

  // Cache/Memoization dos cálculos de graduação para evitar recálculo a cada render (Requisito 19)
  const calculatedMetrics = useMemo(() => {
    return students.map(student => {
      const isKid = !!student.isKid;
      const currentBelt = student.belt || "Branca";
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

      // Obter carência IBJJF baseada na faixa atual
      const ibjjfMinMonths = IBJJF_TIME_LIMITS[currentBelt] || 12;
      const timeProgress = Math.min(100, Math.round((monthsElapsed / ibjjfMinMonths) * 100));
      const isTimeCompleted = monthsElapsed >= ibjjfMinMonths;

      // Próxima faixa sugerida pela IBJJF
      let nextBelt = currentBelt;
      if (isKid) {
        const kidBelts = ["Branca", "Cinza", "Amarela", "Laranja", "Verde"];
        const curIdx = kidBelts.indexOf(currentBelt);
        if (curIdx !== -1 && curIdx < kidBelts.length - 1) {
          nextBelt = kidBelts[curIdx + 1];
        }
      } else {
        const adultBelts = ["Branca", "Azul", "Roxa", "Marrom", "Preta"];
        const curIdx = adultBelts.indexOf(currentBelt);
        if (curIdx !== -1 && curIdx < adultBelts.length - 1) {
          nextBelt = adultBelts[curIdx + 1];
        }
      }

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

      // Verificação de elegibilidade automática IBJJF
      const ibjjfEligible = isTimeCompleted;

      // Requisito 15: se o professor desligar os critérios ou forçar pronto
      const isPassedProfessorCriteria = student.professorCriteria !== false;
      const isEligible = ibjjfEligible && isPassedProfessorCriteria; 

      // Alert thresholds (Requisito 9)
      const daysToNextStripe = Math.max(0, 30 - (daysElapsed % 30));
      const isApto = isEligible && stripes >= 4;
      const nextStripeIn30Days = daysToNextStripe <= 10 && stripes < 4;

      return {
        studentId: student.id,
        daysElapsed,
        monthsElapsed,
        ibjjfMinMonths,
        timeProgress,
        isTimeCompleted,
        nextBelt,
        evolutionScore,
        ibjjfEligible,
        isEligible,
        isApto,
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
      daysElapsed: 0,
      monthsElapsed: 0,
      ibjjfMinMonths: 12,
      timeProgress: 0,
      isTimeCompleted: false,
      nextBelt: "Azul",
      evolutionScore: 50,
      ibjjfEligible: false,
      isEligible: false,
      isApto: false,
      nextStripeIn30Days: false,
      daysToNextStripe: 30,
      nextPromotionDate: new Date()
    };
  };

  const handleApprove = () => {
    if (!selectedStudent) return;
    const metrics = getStudentMetrics(selectedStudent.id);
    const targetBelt = metrics.nextBelt;

    if (confirm(`Deseja aprovar a GRADUAÇÃO de ${selectedStudent.name} para a ${BELT_LABELS[targetBelt]}? Isto resetará os Graus para zero e criará um registro histórico permanente.`)) {
      approveGraduation(selectedStudent.id, targetBelt);
      setSelectedStudent(null);
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
            <Baby size={12} /> Kids
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
            className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl"
          >
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2 mb-4">
              <Scale size={20} className="text-blue-600" /> Regulamento Oficial de Faixas e Tempos IBJJF
            </h3>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6">
              Abaixo estão os prazos exigidos pela Confederação Brasileira de Jiu-Jitsu (CBJJ) e International Brazilian Jiu-Jitsu Federation (IBJJF). Nosso sistema valida esses limites de forma nativa e automática.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(IBJJF_TIME_LIMITS).map((belt, idx) => {
                const limit = IBJJF_TIME_LIMITS[belt];
                return (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-4 rounded-md ${OFFICIAL_BELT_COLORS[belt] || 'bg-slate-500'} shrink-0`} />
                      <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{BELT_LABELS[belt] || belt}</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                      Mínimo {limit >= 12 ? `${limit / 12} ${limit === 12 ? 'Ano' : 'Anos'}` : `${limit} Meses`}
                    </span>
                  </div>
                );
              })}
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
                      </div>
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
