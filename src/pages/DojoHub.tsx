import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Trophy, 
  BookOpen, 
  Sparkles, 
  ClipboardCheck, 
  CalendarCheck, 
  TrendingUp, 
  MessageSquare, 
  Layers, 
  Star, 
  BarChart3, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Award, 
  Bell, 
  UserX, 
  ChevronRight, 
  Search, 
  Flame, 
  ThumbsUp, 
  Smartphone, 
  Video, 
  Book, 
  Download, 
  FileCheck,
  Zap,
  DollarSign,
  Scale,
  Play
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useData } from '../contexts/DataContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useProfile } from '../contexts/ProfileContext.js';
import { StudentStatus } from '../types.js';

// Import sub-pages directly to unmount from standalone context and present as integrated components
import Students from './Students.js';
import BeltSystem from './BeltSystem.js';
import CurriculumHub from './CurriculumHub.js';
import AttendancePage from './Attendance.js';
import PerformanceAnalytics from './PerformanceAnalytics.js';

// Chart libraries
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, PieChart, Pie } from 'recharts';

export type SidebarTab = 
  | 'overview' 
  | 'students' 
  | 'classes' 
  | 'graduation' 
  | 'lesson-plans' 
  | 'techniques' 
  | 'exams' 
  | 'attendance' 
  | 'performance' 
  | 'communication' 
  | 'library' 
  | 'evaluations' 
  | 'ai-guardian'
  | 'combat-core'
  | 'reports';

const DojoHub: React.FC = () => {
  const { t } = useTranslation();
  const { students, schedules, attendance, techniques, lessonPlans, graduationHistory, addLedgerEntry, updateStudent } = useData();
  const { profile } = useProfile();
  const { user } = useAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');

  // Custom interactive premium notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Interactive local states for custom Dojo components
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom states for Communication subtab
  const [commType, setCommType] = useState<'all' | 'kids' | 'parents' | 'promotions'>('all');
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Grande Exame de Faixas - Segundo Semestre",
      type: "promotions",
      content: "Atenção guerreiros! Nosso exame oficial de graduação da CBJJ/IBJJF está agendado para o próximo dia 15 do mês que vem. Verifiquem suas carências de graus na aba de graduação e confirmem suas presenças.",
      date: "2026-05-25",
      author: "Sensei Principal",
      likes: 12
    },
    {
      id: 2,
      title: "Seminário Especial de Passagem de Guarda No-Gi",
      type: "all",
      content: "Neste sábado teremos um seminário de 3 horas cobrindo técnicas avançadas de passagem de guarda moderna por cima por pressão. Tragam camisa de Lycra SYSBJJ.",
      date: "2026-05-20",
      author: "Sensei Principal",
      likes: 24
    },
    {
      id: 3,
      title: "Avisos Financeiros Importantes para Pais da Turma Kids",
      type: "kids",
      content: "Lembramos a todos os pais que as mensalidades vencem no dia 5. O acerto garante a continuidade do cronograma técnico esportivo do dojo e da nossa estrutura pedagógica premium. OSS!",
      date: "2026-05-18",
      author: "Coordenação",
      likes: 8
    }
  ]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnType, setNewAnnType] = useState<'all' | 'kids' | 'parents' | 'promotions'>('all');
  const [newAnnContent, setNewAnnContent] = useState('');

  // Custom states for Evaluation (Avaliações) Board
  const [selectedStudentEval, setSelectedStudentEval] = useState<string>('');
  const [evalRatings, setEvalRatings] = useState({
    technical: 80,
    tactical: 75,
    physical: 85,
    behavioral: 90,
    mindset: 80
  });
  const [evalNotes, setEvalNotes] = useState('');
  const [evalSuccessMsg, setEvalSuccessMsg] = useState(false);

  // 🥋 SYSTEM OPERACIONAL GLOBAL (Combat Sports Operating System) STATES
  const [selectedCombatCoreModality, setSelectedCombatCoreModality] = useState<'bjj' | 'capoeira' | 'muay_thai' | 'judo' | 'kickboxing' | 'mma'>('bjj');
  const [selectedRetentionStudent, setSelectedRetentionStudent] = useState<string | null>(null);
  const [activeStreamingVideo, setActiveStreamingVideo] = useState<{ id: string, name: string, category: string, level: string, tags: string[], description: string, videoUrl: string } | null>(null);
  const [streamingProgress, setStreamingProgress] = useState(32);
  const [streamingPlaying, setStreamingPlaying] = useState(false);
  const [completedStreamingSteps, setCompletedStreamingSteps] = useState<string[]>(['kuzushi']);
  const [selectedStudentForCore, setSelectedStudentForCore] = useState<string>('');
  const [studentDisciplines, setStudentDisciplines] = useState<Record<string, string[]>>({
    'std1': ['bjj', 'muay_thai'],
    'std2': ['bjj'],
    'std3': ['capoeira'],
    'std4': ['judo', 'bjj'],
    'std5': ['mma', 'bjj', 'muay_thai'],
  });

  // Custom static techniques list for "Biblioteca Técnica" with premium feeling
  const BIBLIOTECA_TECNICAS = [
    { id: 't1', name: 'Baiana (Double Leg)', category: 'Quedas', level: 'Branca', tags: ['Gi', 'No-Gi'], description: 'Queda clássica por trás dos joelhos atacando quadril.', videoUrl: 'https://sysbjj.example.com/v1' },
    { id: 't2', name: 'Passagem Abraçando a Cabeça', category: 'Passagem', level: 'Branca', tags: ['Gi'], description: 'Passagem por pressão controlando coluna cervical.', videoUrl: 'https://sysbjj.example.com/v2' },
    { id: 't3', name: 'Raspagem de Gancho (Guarda Borboleta)', category: 'Raspagens', level: 'Azul', tags: ['Gi', 'No-Gi'], description: 'Kuzushi por baixo elevando gancho interno.', videoUrl: 'https://sysbjj.example.com/v3' },
    { id: 't4', name: 'Chave de Braço da Guarda Fechada', category: 'Finalizações', level: 'Branca', tags: ['Gi'], description: 'Ataque clássico de triângulo e armbar conjugados.', videoUrl: 'https://sysbjj.example.com/v4' },
    { id: 't5', name: 'Estrangulamento Kimura pelas Costas', category: 'Finalizações', level: 'Roxa', tags: ['No-Gi'], description: 'Ataque rotacional nos ombros mantendo ganchos ativos.', videoUrl: 'https://sysbjj.example.com/v5' },
    { id: 't6', name: 'Defesa de Berimbolo por Cima', category: 'Defesas', level: 'Marrom', tags: ['Gi'], description: 'Controles de quadril bloqueando a inversão de ganchos.', videoUrl: 'https://sysbjj.example.com/v6' },
  ];

  // Dojo general computed metrics
  const activeStudentsCount = useMemo(() => students.filter(s => s.status === StudentStatus.ACTIVE).length, [students]);
  const lowAttendanceStudents = useMemo(() => {
    return students.filter(s => s.status === StudentStatus.ACTIVE && (s.attendanceCount || 0) < 6);
  }, [students]);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    return students.filter(s => {
      if (!s.birthDate) return false;
      const bDate = new Date(s.birthDate);
      return bDate.getMonth() === today.getMonth();
    }).slice(0, 4);
  }, [students]);

  // Calculations for Belt eligibility in Overview (Modo Sensei)
  const eligibleForPromotion = useMemo(() => {
    return students.filter(student => {
      if (student.status !== StudentStatus.ACTIVE) return false;
      // Simulated promotion logic: attendance > 30 and months elapsed > 12
      const attCount = student.attendanceCount || 0;
      return attCount >= 24;
    }).slice(0, 5);
  }, [students]);

  // Aggregate belt distribution data for Recharts Chart
  const beltChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const b = s.belt || 'Branca';
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  // Handle post announcement
  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;
    const newAnn = {
      id: Date.now(),
      title: newAnnTitle,
      type: newAnnType,
      content: newAnnContent,
      date: new Date().toISOString().split('T')[0],
      author: user?.email ? user.email.split('@')[0].toUpperCase() : 'SENSEI',
      likes: 0
    };
    setAnnouncements([newAnn, ...announcements]);
    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnType('all');
  };

  // Handle post evaluation rating
  const handleCommitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentEval) return;
    
    const targetStudent = students.find(s => s.id === selectedStudentEval);
    if (targetStudent) {
      // update state with performance ratings
      const updatedRatings = [
        { ...evalRatings, updatedAt: Date.now() },
        ...(targetStudent.performanceRatings || [])
      ];
      updateStudent(targetStudent.id, {
        performanceRatings: updatedRatings,
        promotionNotes: evalNotes ? `${evalNotes} - OSS!` : targetStudent.promotionNotes
      });
      
      // Post to audit entries log directly
      addLedgerEntry({
        type: 'StatusChange',
        amount: 0,
        description: `Avaliação de desempenho lançada no Hub: Técnica=${evalRatings.technical}% Física=${evalRatings.physical}% Psicológico=${evalRatings.mindset}%. Notas: ${evalNotes || 'N/A'}`,
        category: 'Avaliação',
        method: 'Sistema',
        studentId: targetStudent.id
      });

      setEvalSuccessMsg(true);
      setTimeout(() => {
        setEvalSuccessMsg(false);
        setEvalNotes('');
      }, 3000);
    }
  };

  // Render content according to the selected sub-tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Dashboard Inteligente - Indicadores Principais Pedagógicos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest font-sans">Alunos Ativos</span>
                    <Users size={18} className="text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{activeStudentsCount}</h3>
                </div>
                <p className="text-[9px] text-slate-400 uppercase font-black mt-4 leading-relaxed">Capacidade do Tatame Ocupada</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest font-sans">Aulas Ativas</span>
                    <Calendar size={18} className="text-indigo-600" />
                  </div>
                  <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{schedules.length}</h3>
                </div>
                <p className="text-[9px] text-slate-400 uppercase font-black mt-4 leading-relaxed">Turmas Configuradas e Planejadas</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest font-sans">Registros de Presença</span>
                    <CalendarCheck size={18} className="text-emerald-600" />
                  </div>
                  <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{attendance.length}</h3>
                </div>
                <p className="text-[9px] text-emerald-500 uppercase font-black mt-4 leading-relaxed">Pontos Frequentes de Treino Registrados</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest font-sans">Técnicas Catalogadas</span>
                    <Flame size={18} className="text-amber-500" />
                  </div>
                  <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{techniques.length || BIBLIOTECA_TECNICAS.length}</h3>
                </div>
                <p className="text-[9px] text-slate-400 uppercase font-black mt-4 leading-relaxed">Posições no Cronograma Pedagógico</p>
              </div>
            </div>

            {/* MODO SENSEI: Command Center Panel */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck size={200} />
              </div>
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">OSS Sensei Hub Ativo</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mt-2 italic font-sans">SENSEI COMMAND CENTER</h3>
                  <p className="text-slate-405 text-[10px] uppercase font-bold tracking-wider max-w-[500px] mt-2 leading-relaxed">
                    Visualização centralizada e integrada para controle das principais decisões pedagógicas do tatame. Gerencie o ecossistema pedagógico de forma imaculada.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab('evaluations')} 
                    className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md"
                  >
                    Lançar Avaliação
                  </button>
                  <button 
                    onClick={() => setActiveTab('graduation')} 
                    className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl border border-white/10 transition-all"
                  >
                    Exame de Faixa
                  </button>
                </div>
              </div>
            </div>

            {/* Alerts & Critical Metrics Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Alunos aptos para Exame */}
              <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                      <Award size={14} className="text-yellow-500" />
                      Guerreiros Aptos / Treino OK
                    </h4>
                    <span className="text-[8px] bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded uppercase font-black">Aptidão</span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {eligibleForPromotion.length === 0 ? (
                      <p className="text-[9px] text-slate-400 uppercase italic">Carregando dados de aptidão...</p>
                    ) : (
                      eligibleForPromotion.map(s => (
                        <div key={s.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-black text-[10px] text-slate-900 dark:text-white uppercase">{s.name}</span>
                            <span className="text-[7.5px] bg-blue-600/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase font-black">{s.belt}</span>
                          </div>
                          <span className="text-[8.5px] font-mono text-slate-400 font-extrabold">{s.attendanceCount} aulas</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <button onClick={() => setActiveTab('graduation')} className="w-full text-center text-[9px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-white/5 mt-4 cursor-pointer">
                  Analisar Todos &rarr;
                </button>
              </div>

              {/* Frequência Baixa Alerta */}
              <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                      <AlertCircle size={14} className="text-red-500" />
                      Frequência Alerta (&lt;6 Aulas)
                    </h4>
                    <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded uppercase font-black">Chun Alerta</span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {lowAttendanceStudents.slice(0, 5).map(s => (
                      <div key={s.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-between">
                        <span className="font-sans font-black text-[10px] text-slate-900 dark:text-white uppercase">{s.name}</span>
                        <div className="text-right">
                          <span className="text-[8px] text-red-500 dark:text-red-400 uppercase font-black block">{s.attendanceCount || 0} aulas</span>
                        </div>
                      </div>
                    ))}
                    {lowAttendanceStudents.length === 0 && (
                      <div className="py-6 text-center">
                        <CheckCircle2 size={24} className="text-emerald-500 mx-auto opacity-70 mb-1" />
                        <span className="text-[8px] text-slate-455 font-black uppercase tracking-widest block">Nenhum atleta evasivo!</span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setActiveTab('attendance')} className="w-full text-center text-[9px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-white/5 mt-4 cursor-pointer">
                  Chamar Presença &rarr;
                </button>
              </div>

              {/* Aniversariantes do Mês */}
              <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                      <CalendarCheck size={14} className="text-blue-500" />
                      Aniversariantes do Mês
                    </h4>
                    <span className="text-[8px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded uppercase font-black">Social</span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {upcomingBirthdays.map(s => (
                      <div key={s.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-between">
                        <span className="font-sans font-black text-[10px] text-slate-900 dark:text-white uppercase">{s.name}</span>
                        <span className="text-[8.5px] font-mono text-slate-400 font-bold">
                          {s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : 'N/D'}
                        </span>
                      </div>
                    ))}
                    {upcomingBirthdays.length === 0 && (
                      <p className="text-[9px] text-slate-400 uppercase italic py-6 text-center">Nenhum aniversariante registrado.</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setActiveTab('communication')} className="w-full text-center text-[9px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-white/5 mt-4 cursor-pointer">
                  Escrever Parabéns ou Aviso &rarr;
                </button>
              </div>
            </div>

            {/* Visual Analytics Hub Board (Geral de Alunos por Faixa e Atletas Ativos) */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-3xl">
              <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white mb-6 flex items-center gap-1.5 font-sans border-b border-slate-100 dark:border-white/5 pb-3">
                <BarChart3 size={16} className="text-blue-600" /> Distribuição de Graduações e Alunos por Faixa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Recharts Bar Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={beltChartData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '10px' }} />
                      <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]}>
                        {beltChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Preta' ? '#0f172a' : entry.name === 'Marrom' ? '#78350f' : entry.name === 'Roxa' ? '#7e22ce' : entry.name === 'Azul' ? '#1d4ed8' : '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend or Detail List */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Composição Técnica do Dojo</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {beltChartData.map(d => (
                      <div key={d.name} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.name === 'Preta' ? '#0f0f12' : d.name === 'Marrom' ? '#78350f' : d.name === 'Roxa' ? '#7e22ce' : d.name === 'Azul' ? '#1d4ed8' : '#64748b' }} />
                          <span className="text-[9.5px] font-black uppercase text-slate-700 dark:text-slate-350">{d.name}</span>
                        </div>
                        <span className="text-[10px] font-mono font-black text-slate-900 dark:text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'students':
        return <Students />;
      
      case 'graduation':
        return <BeltSystem />;
      
      case 'classes':
      case 'lesson-plans':
        return <CurriculumHub />;
      
      case 'techniques':
        return <CurriculumHub />;
      
      case 'exams':
        return <BeltSystem />;
      
      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 border-b border-slate-200/40 dark:border-white/5 pb-4 items-start md:items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white font-sans">
                  Controle Integrado de chamada do tatame
                </h3>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                  Registre a presença em tempo real dos combatentes ou revise as planilhas históricas de check-in.
                </p>
              </div>
            </div>
            
            <AttendancePage />
          </div>
        );
      
      case 'performance':
        return <PerformanceAnalytics />;
      
      case 'communication':
        return (
          <div className="space-y-6 text-left">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white font-sans">
                Central de Comunicação e Avisos do Tatame
              </h3>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                Lance comunicados pedagógicos, notificações de exames e lembretes para turmas direcionadas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lançar novo aviso */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-1.5 font-sans">
                  <MessageSquare size={14} className="text-blue-600" /> Escrever Novo Comunicado
                </h4>
                <form onSubmit={handlePostAnnouncement} className="space-y-4">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Título do Aviso</label>
                    <input 
                      type="text" 
                      value={newAnnTitle}
                      onChange={e => setNewAnnTitle(e.target.value)}
                      placeholder="Ex: Treino no Feriado"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Público Alvo</label>
                    <select 
                      value={newAnnType}
                      onChange={e => setNewAnnType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white outline-none"
                    >
                      <option value="all">Avisos Gerais (Tudo)</option>
                      <option value="kids">Turma Infantil (Kids/Pais)</option>
                      <option value="parents">Pais de Alunos</option>
                      <option value="promotions">Promoções de Faixa & Exames</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Conteúdo do Informativo</label>
                    <textarea 
                      value={newAnnContent}
                      onChange={e => setNewAnnContent(e.target.value)}
                      rows={4}
                      placeholder="..."
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-black text-[9px] uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Publicar OSS
                  </button>
                </form>
              </div>

              {/* Quadro de avisos */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl w-fit">
                  {['all', 'kids', 'parents', 'promotions'].map(type => (
                    <button
                      key={type}
                      onClick={() => setCommType(type as any)}
                      className={`text-[8.5px] font-black px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
                        commType === type 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {type === 'all' ? 'Geral' : type === 'kids' ? 'Kids' : type === 'parents' ? 'Pais' : 'Exame/Promos'}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  {announcements
                    .filter(a => commType === 'all' || a.type === commType)
                    .map(a => (
                      <div key={a.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl space-y-3 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                              a.type === 'promotions' ? 'bg-amber-500/10 text-amber-600' : a.type === 'kids' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-blue-500/10 text-blue-600'
                            }`}>
                              {a.type}
                            </span>
                            <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-tight mt-1.5">{a.title}</h4>
                          </div>
                          <span className="text-[8px] font-mono text-slate-400">{a.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{a.content}</p>
                        
                        <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-black border-t border-slate-100 dark:border-white/5 pt-3">
                          <span>Resp: {a.author}</span>
                          <button 
                            onClick={() => {
                              const list = announcements.map(an => an.id === a.id ? { ...an, likes: an.likes + 1 } : an);
                              setAnnouncements(list);
                            }}
                            className="flex items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors uppercase cursor-pointer"
                          >
                            <ThumbsUp size={10} /> OSS • {a.likes}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'library':
        return (
          <div className="space-y-6 text-left">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white font-sans">
                Biblioteca Técnica de Posições (Dojo Library)
              </h3>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                Acesse o acervo técnico conceitual completo de Jiu-Jitsu do SYSBJJ 2.0.
              </p>
            </div>

            {/* Premium Theater Stream Player Block */}
            {activeStreamingVideo && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 text-white rounded-3xl border border-white/10 p-6 space-y-6 relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Video size={140} />
                </div>
                
                <div className="flex justify-between items-start border-b border-white/5 pb-4 relative z-10">
                  <div>
                    <div className="flex gap-1.5 items-center mb-1">
                      <span className="text-[7.5px] bg-red-600 px-2 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">LIVE STREAM</span>
                      <span className="text-[8px] uppercase font-mono text-slate-400 tracking-wide">{activeStreamingVideo.category} • Faixa {activeStreamingVideo.level}</span>
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-emerald-400 font-sans italic">{activeStreamingVideo.name}</h4>
                    <p className="text-[10px] text-slate-400 max-w-xl leading-relaxed">{activeStreamingVideo.description}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveStreamingVideo(null);
                      setStreamingPlaying(false);
                    }}
                    className="bg-white/10 hover:bg-white/25 text-slate-300 font-black text-[8px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Fechar Player
                  </button>
                </div>

                {/* Simulated 16:9 Cinema Screen with progress scanner line */}
                <div className="aspect-video max-h-[350px] w-full bg-slate-900 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between p-4 group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-10" />
                  
                  {/* Glowing dynamic scan line if playing */}
                  {streamingPlaying && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scan_2.8s_infinite] pointer-events-none z-20" />
                  )}

                  {/* Top video watermarks */}
                  <div className="flex justify-between items-center text-white/60 relative z-20">
                    <span className="text-[8px] font-mono font-black tracking-widest">SYSBJJ BROADCAST SERVICE</span>
                    <span className="text-[8.5px] font-mono font-black">{activeStreamingVideo.id.toUpperCase()} // POS_CAM_01</span>
                  </div>

                  {/* Play Center Indicator Icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400/40 flex items-center justify-center text-emerald-400 animate-pulse group-hover:scale-110 transition-transform">
                      <Play size={28} className={streamingPlaying ? 'opacity-20' : 'opacity-100 ml-1'} />
                    </div>
                  </div>

                  {/* Bottom Video Controls */}
                  <div className="space-y-3 relative z-20 mt-auto">
                    {/* Progress tracking line */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[7px] font-mono text-slate-400 uppercase tracking-widest">
                        <span>Tempo de Fluxo</span>
                        <span>{streamingProgress}% Concluído</span>
                      </div>
                      <div 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const pct = Math.min(100, Math.max(0, Math.round((clickX / rect.width) * 100)));
                          setStreamingProgress(pct);
                        }}
                        className="h-2 bg-white/15 rounded-full overflow-hidden p-0.5 border border-white/5 cursor-pointer relative"
                      >
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${streamingProgress}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setStreamingPlaying(!streamingPlaying)}
                          className="bg-white hover:bg-slate-100 text-slate-950 font-black text-[8px] uppercase tracking-widest px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          {streamingPlaying ? 'Pause' : 'Play / Assistir'}
                        </button>
                        <span className="text-[9px] font-mono font-black text-slate-400 animate-pulse">
                          {streamingPlaying ? '● TRANSMITINDO ATIVO' : '■ TRANSMISSÃO INTERROMPIDA'}
                        </span>
                      </div>

                      {/* Micro buttons to skip progress */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setStreamingProgress(Math.max(0, streamingProgress - 15))}
                          className="bg-white/5 hover:bg-white/10 text-slate-300 py-1.5 px-3 rounded-lg text-[7px] font-black uppercase tracking-widest"
                        >
                          -15s
                        </button>
                        <button 
                          onClick={() => setStreamingProgress(Math.min(100, streamingProgress + 15))}
                          className="bg-white/5 hover:bg-white/10 text-slate-300 py-1.5 px-3 rounded-lg text-[7px] font-black uppercase tracking-widest"
                        >
                          +15s
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-step evaluation list (Kuzushi, Tsukuri, Kake) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 text-left">
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block">Pedagogical Checkpoint Steps</span>
                    <h5 className="text-xs font-black uppercase text-slate-200">Etapas de Domínio Técnico</h5>
                    
                    <div className="space-y-2">
                      {[
                        { key: 'kuzushi', name: 'KUZUSHI (Fase de Desequilíbrio)', desc: 'Desestabilização completa do adversário.' },
                        { key: 'tsukuri', name: 'TSUKURI (Fase de Ajuste de Alavanca)', desc: 'Ajuste ideal e encaixe perfeito do quadril/punho.' },
                        { key: 'kake', name: 'KAKE (Fase de Execução Real)', desc: 'Finalização do movimento gerando a queda ou finalização.' },
                      ].map(step => {
                        const isDone = completedStreamingSteps.includes(step.key);
                        return (
                          <div 
                            key={step.key}
                            onClick={() => {
                              const updated = isDone 
                                ? completedStreamingSteps.filter(k => k !== step.key) 
                                : [...completedStreamingSteps, step.key];
                              setCompletedStreamingSteps(updated);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isDone ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white/5 border-transparent hover:border-white/10'
                            }`}
                          >
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-200 leading-none">{step.name}</p>
                              <p className="text-[8.5px] text-slate-500 leading-normal mt-1">{step.desc}</p>
                            </div>
                            <span className={`text-[7px] font-black uppercase px-2 py-1 rounded ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                              {isDone ? 'Domado' : 'Pendente'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between text-left">
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block">Ledger Sync</span>
                      <h5 className="text-xs font-black uppercase text-slate-200">Vincular Progresso Pedagógico</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        Selecione um aluno para registrar a visualização técnica e o domínio das fases (Kuzushi, Tsukuri, Kake) diretamente no Ledger da academia.
                      </p>
                    </div>

                    <div className="pt-3">
                      <button 
                        onClick={() => {
                          showToast(`✓ Domínio da técnica ${activeStreamingVideo.name} registrado com sucesso para toda turma ativa!`);
                          setCompletedStreamingSteps(['kuzushi']);
                          setActiveStreamingVideo(null);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[8px] uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer text-center"
                      >
                        Sincronizar Progresso com o Dojo OSS
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BIBLIOTECA_TECNICAS.map(tech => (
                <div key={tech.id} className="bg-white dark:bg-slate-900 border border-slate-202 dark:border-white/5 p-6 rounded-3xl flex flex-col justify-between hover:shadow-xl hover:border-blue-600/30 transition-all text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] font-black uppercase bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                        {tech.category}
                      </span>
                      <div className="flex gap-1">
                        {tech.tags.map(t => (
                          <span key={t} className="text-[6.5px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-tight pt-1">
                      {tech.name}
                    </h4>
                    
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {tech.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 pt-4 mt-4 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-yellow-600 font-sans">
                      Faixa Alvo: {tech.level}
                    </span>
                    <button 
                      onClick={() => {
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                        setActiveStreamingVideo(tech);
                        setStreamingProgress(15);
                        setStreamingPlaying(true);
                        showToast(`🎥 Carregando transmissão interna da técnica: ${tech.name}`);
                      }}
                      className="cursor-pointer text-[7.5px] font-black uppercase bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Video size={9} /> Assistir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'evaluations':
        return (
          <div className="space-y-6 text-left font-sans">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white font-sans">
                Planilha de Avaliação de Desempenho
              </h3>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                Atribua notas aos aspectos fundamentais de seus guerreiros para monitoramento de performance.
              </p>
            </div>

            <div className="max-w-xl mx-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-3">
                <Star size={14} className="text-blue-600" /> Nova Avaliação do Aluno
              </h4>

              <form onSubmit={handleCommitEvaluation} className="space-y-5">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Selecione o Atleta</label>
                  <select 
                    value={selectedStudentEval}
                    onChange={e => setSelectedStudentEval(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white outline-none"
                    required
                  >
                    <option value="">-- Escolha um Guerreiro --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name.toUpperCase()} (Faixa {s.belt})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[8px] font-black uppercase tracking-widest text-slate-400">Atributos (0 a 100)</h5>
                  
                  {[
                    { key: 'technical', label: 'Técnico (Kuzushi, Precisão)' },
                    { key: 'tactical', label: 'Tático (Sparring, Posicionamento)' },
                    { key: 'physical', label: 'Físico (Explosão, Gás)' },
                    { key: 'mindset', label: 'Mental (Foco, Calma nos Amassos)' },
                    { key: 'behavioral', label: 'Conduta (Respeito, Companheirismo)' }
                  ].map(attr => (
                    <div key={attr.key} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase">
                        <span className="text-slate-500">{attr.label}</span>
                        <span className="text-blue-600">{(evalRatings as any)[attr.key]}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={(evalRatings as any)[attr.key]}
                        onChange={e => setEvalRatings({ ...evalRatings, [attr.key]: Number(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Observações do Sensei</label>
                  <textarea 
                    value={evalNotes}
                    onChange={e => setEvalNotes(e.target.value)}
                    rows={3}
                    placeholder="Escreva sobre a evolução técnica, frequência ou postura no tatame..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 outline-none"
                  />
                </div>

                {evalSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-wider text-center">
                    ✓ Avaliação integrada com sucesso! Ledger assinado com OSS.
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={!selectedStudentEval}
                  className={`w-full font-black text-[9px] uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer text-center ${
                    selectedStudentEval 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800/40 cursor-not-allowed'
                  }`}
                >
                  Confirmar & Assinar OSS
                </button>
              </form>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6 text-left">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white font-sans">
                Relatórios e Analytics Pedagógicos (Dojo Reports)
              </h3>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                Gere snapshots da integridade, lista de presenças acumuladas e termos de graduação em PDF.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Report Options */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-202 dark:border-white/5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-sans">
                  <FileCheck size={16} className="text-indigo-600" /> Lista Geral de Chamada Acumulada
                </h4>
                <p className="text-[10px] text-slate-400 uppercase leading-normal">Gera uma folha inteligível com todos os alunos, presenças e total de aulas dadas.</p>
                <button 
                  onClick={() => showToast("✓ Relatório de chamada gerado com sucesso!")}
                  className="cursor-pointer bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 w-full"
                >
                  <Download size={11} /> Baixar Relatório (PDF)
                </button>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-202 dark:border-white/5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-sans">
                  <ShieldCheck size={16} className="text-emerald-600" /> Histórico Ledger de Graduações (Auditoria)
                </h4>
                <p className="text-[10px] text-slate-400 uppercase leading-normal">Cria um sumário criptográfico das passagens de faixas assinadas pelo mestre atual.</p>
                <button 
                  onClick={() => showToast("✓ Sumário Ledger de Auditoria gerado!")}
                  className="cursor-pointer bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 w-full"
                >
                  <Download size={11} /> Baixar Auditoria (PDF)
                </button>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-202 dark:border-white/5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-sans">
                  <BarChart3 size={16} className="text-blue-600" /> Métricas Financeiras e Churn por Alunos
                </h4>
                <p className="text-[10px] text-slate-400 uppercase leading-normal">Demonstra a receita estimada pelo LTV dos guerreiros ativos vs taxa de inadimplência.</p>
                <button 
                  onClick={() => showToast("✓ Snapshot de LTV gerado com sucesso!")}
                  className="cursor-pointer bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 w-full"
                >
                  <Download size={11} /> Gerar Financeiro (PDF)
                </button>
              </div>
            </div>
          </div>
        );

      case 'ai-guardian':
        return (
          <div className="space-y-6 text-left">
            <div className="bg-gradient-to-r from-amber-600 to-indigo-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 space-y-2">
                <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">Combat AI Engine 2.0</span>
                <h3 className="text-2xl font-black uppercase tracking-tight italic font-sans">Guardião IA, Professor & Advisor</h3>
                <p className="text-[10px] text-slate-200 max-w-xl leading-relaxed uppercase font-bold tracking-wide">
                  Inteligência automatizada operando silenciosamente para blindar seu dojo contra a evasão, otimizar sua progressão pedagógica curricular e otimizar exames de graduação.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Churn Retention Dashboard */}
              <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                    <span className="text-[8.5px] font-black uppercase text-red-500 tracking-wider">Antigravity Churn Predictor</span>
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white mt-1">Alunos em Risco de Evasão</h4>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                    {students.filter(s => s.status === 'Overdue' || (s.attendanceCount || 0) < 5).map(s => {
                      const frequency = s.attendanceCount || 0;
                      const isHighRisk = frequency < 3 || s.status === 'Overdue';
                      return (
                        <div 
                          key={s.id} 
                          onClick={() => setSelectedRetentionStudent(s.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                            selectedRetentionStudent === s.id 
                              ? 'bg-red-500/10 border-red-500 shadow-sm' 
                              : 'bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10.5px] font-extrabold text-slate-900 dark:text-white uppercase truncate max-w-[130px]">{s.name}</span>
                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                              isHighRisk ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
                            }`}>
                              {isHighRisk ? 'Risco Alto' : 'Médio'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2 text-[8.5px] text-slate-400 font-extrabold">
                            <span>Status: {s.status === 'Overdue' ? 'Inadimplente' : 'Inativo'}</span>
                            <span className="font-mono text-slate-400">{frequency} aulas o mês todo</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-4 mt-4">
                  {selectedRetentionStudent ? (() => {
                    const selS = students.find(s => s.id === selectedRetentionStudent);
                    if (!selS) return null;
                    return (
                      <div className="space-y-3 bg-red-500/5 p-3 rounded-2xl border border-red-500/10 animate-fade-in text-left">
                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Recomendação do Guardião IA</p>
                        <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-300 leading-normal">
                          Guerreiro {selS.name} está sem registrar check-in no tatame há dias e possui status financeiro {selS.status}.
                        </p>
                        
                        {/* WhatsApp copy template generator */}
                        <div className="p-2 bg-slate-900 rounded-lg text-[9px] text-emerald-400 font-mono select-all overflow-y-auto max-h-[85px]">
                          "OSS {selS.name}! O Sensei sentiu sua falta nos treinos essa semana. O tatame não é o mesmo sem você. Vamos voltar ao foco? Um forte abraço e OSS!"
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => {
                              showToast(`✓ Mensagem de resgate copiada! Envie para ${selS.name}`);
                              setSelectedRetentionStudent(null);
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[8px] uppercase tracking-widest py-2 rounded-lg transition-all cursor-pointer text-center"
                          >
                            Copiar Template
                          </button>
                          <button 
                            onClick={() => {
                              showToast(`✓ Isenção temporária / abono operacional aplicado para ${selS.name}`);
                              setSelectedRetentionStudent(null);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[8px] uppercase tracking-widest px-2 py-2 rounded-lg transition-all"
                          >
                            Abonar
                          </button>
                        </div>
                      </div>
                    );
                  })() : (
                    <p className="text-[9.5px] text-slate-400 uppercase italic text-center">Selecione um atleta em risco para ver a recomendação inteligente de retenção.</p>
                  )}
                </div>
              </div>

              {/* Center Column: Pedagogical AI Core */}
              <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                    <span className="text-[8.5px] font-black uppercase text-indigo-500 tracking-wider">Dojo Syllabus Intelligent Advisor</span>
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white mt-1">Recomendações e Drills da Semana</h4>
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-3.5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        <span className="text-[9px] font-black uppercase text-indigo-500">Turma Kids - Baixo Aproveitamento</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                        Detectamos queda no índice de presença dos pequenos em aulas de Queda/Projeção.
                      </p>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Indicação: Focar em lutas lúdicas e rolamentos de segurança.
                      </div>
                    </div>

                    <div className="p-3.5 bg-purple-500/5 rounded-2xl border border-purple-500/10 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <span className="text-[9px] font-black uppercase text-purple-500">Turma Adulto (Azul e Roxa)</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                        Média abaixo do esperado em retenção de guarda elástica/laçada (Aproveitamento Geral: 61%).
                      </p>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Indicação: Introduzir drills de conexão de quadril e postura.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
                  <button 
                    onClick={() => {
                      showToast("✓ IA gerou e incorporou um plano pedagógico completo de reposição de guarda e drills lúdicos no cronograma!");
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-white/10 font-black text-[8.5px] uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer text-center text-white"
                  >
                    Gerar Plano de Aula Recomendado
                  </button>
                </div>
              </div>

              {/* Right Column: Graduation AI Oracle */}
              <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                    <span className="text-[8.5px] font-black uppercase text-amber-500 tracking-wider">Promotion Compliance Officer</span>
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white mt-1">Elegibilidade Preditiva de Graus</h4>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {students.filter(s => s.status === 'Active' && (s.attendanceCount || 0) >= 15).slice(0, 4).map(s => {
                      const level = s.attendanceCount || 10;
                      return (
                        <div key={s.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/5 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-slate-900 dark:text-white">{s.name}</span>
                            <span className="text-amber-500 text-[8px]">Carência OK</span>
                          </div>
                          <div className="flex justify-between items-center text-[8.5px] text-slate-400">
                            <span>Frequência: {level} treinos</span>
                            <span>Score: +{85 + (level % 15)}%</span>
                          </div>
                          <button 
                            onClick={() => {
                              showToast(`✓ Guerreiro ${s.name} aprovado na pré-avaliação do exame pelo Guardião IA!`);
                            }}
                            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-[7.5px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-all text-center"
                          >
                            Habilitar Exame Oficial
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
                  <button 
                    onClick={() => {
                      showToast("✓ Análise analítica profunda gerou a recomendação de graduação para 15 candidatos aptos! Download do PDF com a lista exportado.");
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[8.5px] uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Examinar Todos Indicados
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'combat-core':
        return (
          <div className="space-y-6 text-left">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white font-sans">
                Universal Combat Core Multi-Modalidades
              </h3>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                Configure as regras, cronograma pedagógico especial, exames de faixas, cordas, khans e rounds para cada arte marcial do ecossistema.
              </p>
            </div>

            {/* Segment Selector for Modality */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl w-full">
              {[
                { id: 'bjj', label: 'BJJ (Jiu-Jitsu)' },
                { id: 'muay_thai', label: 'Muay Thai' },
                { id: 'capoeira', label: 'Capoeira' },
                { id: 'judo', label: 'Judô' },
                { id: 'kickboxing', label: 'Kickboxing' },
                { id: 'mma', label: 'MMA Elite' }
              ].map(art => (
                <button
                  key={art.id}
                  onClick={() => setSelectedCombatCoreModality(art.id as any)}
                  className={`text-[9px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer ${
                    selectedCombatCoreModality === art.id 
                      ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' 
                      : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  {art.label}
                </button>
              ))}
            </div>

            {/* Segment Render Area */}
            {selectedCombatCoreModality === 'bjj' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">🥋 Regras Oficiais IBJJF / CBJJ</h4>
                  <span className="text-[7.5px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-black">PADRÃO ATIVO</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  Sua academia opera com o motor oficial de cálculo de carência por faixa (Branca: sem tempo, Azul: 24 meses, Roxa: 18 meses, Marrom: 12 meses, Preta: 36 meses). O sistema audita elegibilidade e cronometra sparrings de lutas com tempos de regras de campeonato de forma síncrona.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[9px] font-black uppercase mt-4">
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-white/5">
                    <h6>Graus e Carência</h6>
                    <span className="text-slate-400 font-extrabold mt-1 block">Frequência Padrão: 80 presenças por grau</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-white/5">
                    <h6>Restrição de Idade</h6>
                    <span className="text-slate-400 font-extrabold mt-1 block">Azul mínima: 16 anos. Preta mínima: 19 anos.</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-white/5">
                    <h6>Ledger Audit Trial</h6>
                    <span className="text-slate-400 font-extrabold mt-1 block">Cada mudança assina hash criptográfico local</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCombatCoreModality === 'capoeira' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">🤸 Capoeira (Cordas, Musicalidade & Batizado)</h4>
                  <span className="text-[7.5px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-black">NÚCLEO ADAPTADO</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Cordas System Section */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sistema de Graduação de Cordas</h5>
                    <div className="space-y-1.5">
                      {[
                        { corda: 'Cordão Cinza e Amarelo (Kids)', desc: 'Carência: 6 meses' },
                        { corda: 'Corda Crua (Adulto)', desc: 'Iniciante, carência: 0 meses' },
                        { corda: 'Corda Amarela (Batizado)', desc: 'Carência: 12 meses' },
                        { corda: 'Corda Laranja (Intermediário)', desc: 'Carência: 12 meses' },
                        { corda: 'Corda Verde (Graduado)', desc: 'Carência: 18 meses' },
                        { corda: 'Corda Roxa (Instructor)', desc: 'Carência: 24 meses' }
                      ].map((c, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl flex justify-between items-center text-[10px] uppercase font-bold">
                          <span>{c.corda}</span>
                          <span className="text-[7.5px] font-mono text-slate-455 font-extrabold">{c.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Movements and Instruments */}
                  <div className="space-y-3 text-left">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Instrumentos & Toques de Berimbau</h5>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-white/5 space-y-2.5">
                      <div className="flex items-center gap-2 uppercase font-black text-[9px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                        <span>Angola: Ritmo lento e estratégico</span>
                      </div>
                      <div className="flex items-center gap-2 uppercase font-black text-[9px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        <span>São Bento Grande: Jogo rápido e ágil</span>
                      </div>
                      <div className="flex items-center gap-2 uppercase font-black text-[9px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span>Iúna: Exibição de floreios e acrobacias</span>
                      </div>
                    </div>

                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider pt-2">Fundamentos de Roda</h5>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-white/5 font-sans text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                      Exige conhecimentos em: Ginga, Meia-lua de compasso, Armada, Cabeçada, Rasteira e cantos tradicionais (Ladainhas e Chulas).
                    </div>
                  </div>

                  {/* Settings and events */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Configurar Próxima Roda de Batizado</h5>
                    <div className="p-4 bg-gradient-to-br from-amber-600/10 to-indigo-600/10 rounded-2xl border border-indigo-500/10 space-y-4">
                      <p className="text-[9.5px] text-slate-500 uppercase font-black tracking-tight leading-relaxed">Defina a data oficial do evento de Batizado de Cordas e Troca de Graduação.</p>
                      
                      <button 
                        onClick={() => {
                          showToast("✓ Evento de Batizado de Cordas agendado para o próximo mês e pais notificados!");
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-[8px] uppercase tracking-widest py-2 rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Agendar Batizado Oficial
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedCombatCoreModality === 'muay_thai' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">🥊 Muay Thai (Khan System & Round Controls)</h4>
                  <span className="text-[7.5px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-black">NÚCLEO ADAPTADO</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Khan System column */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Khan System (Prajied de Graduação)</h5>
                    <div className="space-y-1.5">
                      {[
                        { level: '1º ao 3º Khan - Prajied Branco/Amarelo', desc: 'Iniciante' },
                        { level: '4º ao 8º Khan - Prajied Verde/Azul', desc: 'Intermediário' },
                        { level: '9º ao 11º Khan - Prajied Marrom', desc: 'Avançado' },
                        { level: '12º Khan - Prajied Preto', desc: 'Professor (Kru)' },
                        { level: '15º Khan - Prajied Ouro', desc: 'Grão-Mestre (Grand Master)' }
                      ].map((k, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl flex justify-between items-center text-[10px] uppercase font-bold">
                          <span>{k.level}</span>
                          <span className="text-[7px] text-slate-455 font-extrabold">{k.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Drills and Combos */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Combinações Pedagógicas Pad Work</h5>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-white/5 space-y-3 text-[9.5px] font-mono whitespace-normal">
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-red-500 font-extrabold uppercase">Combo Básico A:</span>
                        <p className="text-slate-400 uppercase font-black mt-1">Jab - Direto - Chute Circular Direito Baixo nas pernas</p>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-red-500 font-extrabold uppercase">Combo Intermediário B:</span>
                        <p className="text-slate-400 uppercase font-black mt-1">Jab - Esquerda Esquiva - Cruzado - Joelhada Direto - Clinch</p>
                      </div>
                      <div>
                        <span className="text-red-500 font-extrabold uppercase">Táticas Avançadas:</span>
                        <p className="text-slate-400 uppercase font-black mt-1">Teep (Chute Frontal de Parada) seguido de Cotovelada Ascendente</p>
                      </div>
                    </div>
                  </div>

                  {/* Timer rounds config connecting to Timer */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Configurar Timer para Rounds Oficiais</h5>
                    <div className="p-4 bg-red-600/5 rounded-2xl border border-red-500/10 space-y-3">
                      <p className="text-[9.5px] text-slate-500 uppercase font-bold leading-normal">Carregue ou sincronize perfis de tempo de treino olímpico / profissional diretamente.</p>
                      
                      <div className="space-y-1.5">
                        <button 
                          onClick={() => {
                            showToast("✓ Configuração carregada: 5 Rounds de 3 Minutos com 1 Minuto de descanso!");
                          }}
                          className="w-full bg-slate-900 border border-white/10 text-white font-black text-[8.5px] uppercase tracking-widest py-2 rounded-xl transition-all cursor-pointer text-center"
                        >
                          Rounds Oficiais (5 x 3 min)
                        </button>
                        <button 
                          onClick={() => {
                            showToast("✓ Configuração carregada: 10 Rounds de Sparring Temático de 2 Minutos!");
                          }}
                          className="w-full bg-slate-900 border border-white/10 text-white font-black text-[8.5px] uppercase tracking-widest py-2 rounded-xl transition-all cursor-pointer text-center"
                        >
                          Rounds Sparring (10 x 2 min)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedCombatCoreModality === 'judo' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">🥋 Judô (Katas, Projeções & Graduações Oficiais)</h4>
                  <span className="text-[7.5px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-black">NÚCLEO ADAPTADO</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  Gerenciamento pedagógico integrado para a federação de Judô. Acompanhe a progressão pelas faixas (Branca, Cinza, Azul, Amarela, Laranja, Verde, Roxa, Marrom, Preta, Coral). Centralize gokyo, projeções técnicas (Nage-Waza) e controle de solo (Katame-Waza).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[9px] uppercase font-black text-slate-400 mt-4">
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-white/5 border-l-2 border-l-blue-500">
                    <span className="text-white">Nage-No-Kata</span>
                    <p className="mt-1 font-bold">15 formas fundamentais de projeções de Judô divididas de forma tradicional.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-white/5 border-l-2 border-l-emerald-500">
                    <span className="text-white">Ukemi (Rolamentos)</span>
                    <p className="mt-1 font-bold">Posturas rígidas e técnicas de rolamentos para quedas de segurança absoluta no tatame.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-white/5 border-l-2 border-l-amber-500">
                    <span className="text-white">Gokyo No Waza</span>
                    <p className="mt-1 font-bold">40 técnicas oficiais agrupadas em 5 grupos pedagógicos conforme evolução gradual.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedCombatCoreModality === 'kickboxing' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">🥊 Kickboxing (Graduações & Condicionamento Cardiovascular)</h4>
                  <span className="text-[7.5px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-black">NÚCLEO ADAPTADO</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  Aplicações completas para treinos de Point Fighting, Kick Light e K1 Rules. Acompanhamento sistemático de combinações em saco de pancada, sparring orientado de semi-contato e condicionamento aeróbico de alta performance.
                </p>
              </div>
            )}

            {selectedCombatCoreModality === 'mma' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">🥊 MMA Elite (Striking, Grappling, wrestling & Camps)</h4>
                  <span className="text-[7.5px] bg-indigo-500/10 text-indigo-505 px-2 py-0.5 rounded font-black">NÚCLEO ADAPTADO</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  Desenvolvido para amadores e profissionais de MMA (Artes Marciais Mistas). Centralize a preparação física de camps de luta, dieta/corte de peso para a pesagem, simulação de cage e transições da grade tática de Wrestling.
                </p>
              </div>
            )}

            {/* Link Student to modality roster database connector */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Sincronizar modalidade multiartes no cadastro do atleta</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Selecione o Atleta</label>
                  <select 
                    value={selectedStudentForCore}
                    onChange={e => setSelectedStudentForCore(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">-- Todos os Alunos --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Selecione as lutas praticadas por este atleta</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['bjj', 'muay_thai', 'capoeira', 'judo', 'kickboxing', 'mma'].map(d => {
                      const list = studentDisciplines[selectedStudentForCore] || [];
                      const hasIt = list.includes(d);
                      return (
                        <button
                          key={d}
                          disabled={!selectedStudentForCore}
                          onClick={() => {
                            const current = studentDisciplines[selectedStudentForCore] || [];
                            const updated = current.includes(d) ? current.filter(x => x !== d) : [...current, d];
                            setStudentDisciplines({ ...studentDisciplines, [selectedStudentForCore]: updated });
                          }}
                          className={`text-[8px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                            !selectedStudentForCore 
                              ? 'bg-slate-150 text-slate-400 dark:bg-slate-800/20 cursor-not-allowed border-transparent'
                              : hasIt 
                                ? 'bg-indigo-600 text-white border-indigo-500' 
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {d.toUpperCase().replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {selectedStudentForCore && (
                <div className="pt-2 animate-fade-in text-left">
                  <button
                    onClick={() => {
                      showToast(`✓ Cadastro de modalidades sincronizado com sucesso no Ledger do Dojo!`);
                      setSelectedStudentForCore('');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[8.5px] uppercase tracking-widest px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Salvar Sincronização OSS
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Dojo de <span className="text-blue-600">Ensino</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4 italic flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-500" />
            Hub Central Inteligente de Gestão de Academia e Pedagogia
          </p>
        </div>
      </header>

      {/* Internal Navigation Wrapper Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Interna do Dojo */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-4 rounded-3xl space-y-1 block max-h-[1000px] overflow-y-auto">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 mb-3 shrink-0">DIRETÓRIO INTERNO DO SENSEI</p>
          
          {[
            { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={14} /> },
            { id: 'classes', label: 'Turmas & Cronograma', icon: <Calendar size={14} /> },
            { id: 'lesson-plans', label: 'Plano de Aula', icon: <BookOpen size={14} /> },
            { id: 'techniques', label: 'Técnicas Ativas', icon: <Flame size={14} /> },
            { id: 'attendance', label: 'Chamada de Tatame', icon: <CalendarCheck size={14} /> },
            { id: 'performance', label: 'Desempenho & Combates', icon: <TrendingUp size={14} /> },
            { id: 'ai-guardian', label: 'Guardião IA (Retenção/Ped)', icon: <Sparkles size={14} className="text-amber-500 animate-pulse" /> },
            { id: 'combat-core', label: 'Universal Combat Core', icon: <ShieldCheck size={14} className="text-blue-500" /> },
            { id: 'communication', label: 'Comunicação Interna', icon: <MessageSquare size={14} /> },
            { id: 'library', label: 'Biblioteca Técnica', icon: <Layers size={14} /> },
            { id: 'evaluations', label: 'Evolução Pedagógica', icon: <Star size={14} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as SidebarTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-[9.5px] font-extrabold uppercase tracking-widest cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md font-black' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={activeTab === item.id ? 'scale-110' : 'opacity-70'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Viewer Body */}
        <div className="lg:col-span-9 p-8 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-white/5 rounded-3xl min-h-[600px] transition-all relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Premium Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[120] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-100/10 flex items-center gap-3.5 max-w-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest">Aviso Do Tatame</p>
              <p className="text-xs font-bold leading-normal mt-0.5">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DojoHub;
