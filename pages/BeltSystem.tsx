
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Trophy, 
  ChevronRight, 
  GraduationCap, 
  Star, 
  FileText, 
  MessageSquare, 
  Save, 
  Download, 
  Clock, 
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  X,
  Plus,
  Trash2,
  Settings2,
  Map,
  Users2,
  Medal,
  Presentation,
  ClipboardCheck,
  Check,
  ShieldCheck
} from 'lucide-react';
import { BELT_COLORS, IBJJF_BELT_RULES } from '../constants';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { BeltColor, KidsBeltColor, Student, Milestone } from '../types';

const BeltSystem: React.FC = () => {
  const { t, tObj } = useTranslation();
  const { students, updateStudent } = useData();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBelt, setFilterBelt] = useState<string>('All');
  const [examMode, setExamMode] = useState(false);

  useEffect(() => {
    if (location.state?.examMode) {
      setExamMode(true);
    }
  }, [location.state]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [selectedStudentReport, setSelectedStudentReport] = useState<Student | null>(null);
  const [showCriteriaManager, setShowCriteriaManager] = useState(false);
  const [showRequirementLibrary, setShowRequirementLibrary] = useState(false);
  const [requirementSearch, setRequirementSearch] = useState('');
  const [activeExamStudentId, setActiveExamStudentId] = useState<string | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState<{ isOpen: boolean, studentId: string | null }>({ isOpen: false, studentId: null });
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({ type: 'Seminar', title: '', date: new Date().toISOString().split('T')[0] });

  const activeCriteria = useMemo(() => profile.customCriteria || [], [profile.customCriteria]);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const calculateMonthsInBelt = (promotionDate: string) => {
    if (!promotionDate) return 0;
    const today = new Date();
    const promo = new Date(promotionDate + 'T12:00:00');
    let months = (today.getFullYear() - promo.getFullYear()) * 12 + (today.getMonth() - promo.getMonth());
    if (today.getDate() < promo.getDate()) {
      months--;
    }
    return Math.max(0, months);
  };

  const getBeltChain = (belt: string, isKid: boolean) => {
    if (isKid) {
      return Object.values(KidsBeltColor);
    }
    return Object.values(BeltColor);
  };

  const studentList = useMemo(() => {
    return students.map(s => {
      const age = calculateAge(s.birthDate);
      const monthsInBelt = calculateMonthsInBelt(s.lastPromotionDate || s.birthDate);
      const isBlackBelt = s.belt === BeltColor.BLACK || s.belt === BeltColor.RED_BLACK || s.belt === BeltColor.RED_WHITE || s.belt === BeltColor.RED;
      
      let minMonthsRequired = 0;
      let attendanceThreshold = 40;
      let nextEnum: string = '';
      let futureBelts: string[] = [];
      let maxStripes = 4;
      
      const chain = getBeltChain(s.belt, s.isKid || age < 16) as any[];
      const currentIdx = chain.indexOf(s.belt);
      
      if (currentIdx !== -1) {
        nextEnum = currentIdx < chain.length - 1 ? chain[currentIdx + 1] : (s.isKid ? 'Adulto' : 'Mestre');
        futureBelts = chain.slice(currentIdx + 1, currentIdx + 4).filter(b => b);
      }

      if (s.isKid || age < 16) {
        attendanceThreshold = 30;
        minMonthsRequired = 4; // Usual school rule for kids stripes
      } else {
        const rule = (IBJJF_BELT_RULES as any)[s.belt as string];
        minMonthsRequired = rule?.minTimeMonths ?? 0;

        if (s.belt === BeltColor.PURPLE && age === 17) {
          minMonthsRequired = 12;
        }

        if (s.belt === BeltColor.WHITE) attendanceThreshold = 80;
        else if (s.belt === BeltColor.BLUE) attendanceThreshold = 120;
        else if (s.belt === BeltColor.PURPLE) attendanceThreshold = 100;
        else if (s.belt === BeltColor.BROWN) attendanceThreshold = 80;
        else if (s.belt === BeltColor.BLACK) attendanceThreshold = 60;
      }

      let nextDegreeDate: string | null = null;
      let degreeRequirements: string[] = [];
      let blackBeltTimeline: { degree: number, title: string, year: number, date: string, requirements: string[] }[] = [];

      // Black Belt Degree Logic
      if (isBlackBelt) {
        maxStripes = 6; 
        const promoDate = new Date(s.lastPromotionDate + 'T12:00:00');
        
        // Full Timeline Calculation
        let runningDate = new Date(promoDate);
        const rules = [
            { degree: 1, years: 3, title: '1º Grau', reqs: ["3 anos no grau zero", "Status ativo", "Primeiros Socorros"] },
            { degree: 2, years: 3, title: '2º Grau', reqs: ["3 anos no 1º grau", "Status ativo"] },
            { degree: 3, years: 3, title: '3º Grau', reqs: ["3 anos no 2º grau", "Status ativo"] },
            { degree: 4, years: 5, title: '4º Grau', reqs: ["5 anos no 3º grau", "Curso de Regras", "Primeros Socorros"] },
            { degree: 5, years: 5, title: '5º Grau', reqs: ["5 anos no 4º grau", "Atividade ativa"] },
            { degree: 6, years: 5, title: '6º Grau', reqs: ["5 anos no 5º grau", "Integridade"] },
            { degree: 7, years: 7, title: '7º Grau (Coral)', reqs: ["7 anos no 6º grau", "31 anos de faixa preta"] },
            { degree: 8, years: 7, title: '8º Grau (Coral)', reqs: ["7 anos no 7º grau"] },
            { degree: 9, years: 10, title: '9º Grau (Vermelha)', reqs: ["10 anos no 8º grau"] },
        ];

        // Start from degree 0 (just black belt) and project forward
        // If they already have degrees, we should respect that, but for now we project from lastPromotionDate
        // Assuming lastPromotionDate is the date they got their CURRENT degree (stripes)
        // This is tricky because we only have ONE lastPromotionDate.
        // Let's assume lastPromotionDate is the start of the ENTIRE Black Belt journey if stripes=0, 
        // or the start of the current degree.
        
        const currentDegree = s.stripes || 0;
        
        rules.forEach((r, idx) => {
           const yearsToAdd = r.years;
           runningDate = new Date(runningDate);
           runningDate.setFullYear(runningDate.getFullYear() + yearsToAdd);
           
           const timelineItem = {
              degree: r.degree,
              title: r.title,
              year: runningDate.getFullYear(),
              date: runningDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
              requirements: r.reqs
           };
           blackBeltTimeline.push(timelineItem);
           
           if (r.degree === currentDegree + 1) {
              nextDegreeDate = timelineItem.date;
              degreeRequirements = r.reqs;
              minMonthsRequired = r.years * 12;
           }
        });

        // Fallback for graduation logic if stripes is very high
        if (!nextDegreeDate) {
            minMonthsRequired = 120;
            const fallbackDate = new Date(promoDate);
            fallbackDate.setFullYear(fallbackDate.getFullYear() + 10);
            nextDegreeDate = fallbackDate.toLocaleDateString(undefined, { year: 'numeric' });
        }
      }

      const timeProgress = Math.min((monthsInBelt / (minMonthsRequired || 1)) * 100, 100);
      const attendanceProgress = Math.min((s.attendanceCount / attendanceThreshold) * 100, 100);
      
      const timeReady = monthsInBelt >= minMonthsRequired;
      const attendanceReady = s.attendanceCount >= attendanceThreshold;
      const stripeReady = isBlackBelt ? timeReady : (s.attendanceCount >= attendanceThreshold / (maxStripes + 1));
      
      const rulesReady = (s.rulesKnowledge || 0) >= 70;
      
      let customScore = 0;
      let totalWeight = 0;
      
      activeCriteria.forEach(criterion => {
        const studentIndicator = s.customIndicators?.find(ci => ci.name === criterion.name);
        customScore += (studentIndicator?.value || 0) * criterion.weight;
        totalWeight += criterion.weight;
      });
      
      const customProgress = totalWeight > 0 ? (customScore / (totalWeight * 100)) * 100 : 100;
      const customReady = customProgress >= 70 || activeCriteria.length === 0;

      const ageReady = age >= (IBJJF_BELT_RULES[nextEnum as string]?.minAge ?? 0);
      
      const isReadyByStripes = s.stripes >= maxStripes;
      const isReady = timeReady && attendanceReady && rulesReady && ageReady && customReady && isReadyByStripes && nextEnum !== 'Mestre' && nextEnum !== 'Adulto';

      return { 
        ...s, 
        age, 
        monthsInBelt, 
        minMonthsRequired, 
        attendanceThreshold, 
        nextEnum, 
        futureBelts,
        isBlackBelt,
        maxStripes,
        isReady, 
        timeReady, 
        attendanceReady,
        stripeReady,
        rulesReady,
        ageReady,
        timeProgress,
        attendanceProgress,
        customProgress,
        customReady,
        nextDegreeDate,
        degreeRequirements,
        blackBeltTimeline
      };
    }).filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBelt === 'All' || s.belt === filterBelt;
      const matchesExamMode = !examMode || (s.timeReady && s.attendanceReady);
      return matchesSearch && matchesFilter && matchesExamMode;
    }).sort((a, b) => b.attendanceCount - a.attendanceCount);
  }, [students, searchTerm, filterBelt, activeCriteria, examMode]);

  const handleAddMilestone = () => {
    if (!showMilestoneModal.studentId || !newMilestone.title) return;
    
    const student = students.find(s => s.id === showMilestoneModal.studentId);
    if (!student) return;

    const milestone: Milestone = {
      id: Date.now().toString(),
      type: newMilestone.type as any,
      title: newMilestone.title,
      date: newMilestone.date || new Date().toISOString().split('T')[0],
      description: newMilestone.description
    };

    const updatedMilestones = [...(student.milestones || []), milestone];
    updateStudent(student.id, { milestones: updatedMilestones });
    
    setNewMilestone({ type: 'Seminar', title: '', date: new Date().toISOString().split('T')[0] });
    setShowMilestoneModal({ isOpen: false, studentId: null });
    alert('Requisito adicionado com sucesso! OSS.');
  };

  const toggleExamRequirement = (studentId: string, requirement: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentReqs = student.examRequirements || {};
    const updatedReqs = { ...currentReqs, [requirement]: !currentReqs[requirement] };
    updateStudent(studentId, { examRequirements: updatedReqs });
  };

  const handleAddStripe = (student: Student, max: number) => {
    if (student.stripes >= max) {
      alert('Número máximo de graus atingido para esta faixa. OSS!');
      return;
    }

    const isBlackBelt = student.belt === BeltColor.BLACK || student.belt === BeltColor.RED_BLACK || student.belt === BeltColor.RED_WHITE || student.belt === BeltColor.RED;
    const stripeName = isBlackBelt ? `${student.stripes + 1}º Grau` : `${student.stripes + 1}º Grau`;
    
    if (confirm(`Confirmar atribuição de ${stripeName} para ${student.name}?`)) {
      const historyEntry = {
        date: new Date().toISOString().split('T')[0],
        type: 'Stripe' as const,
        description: `Recebeu o ${stripeName} na faixa ${t(`belts.${student.belt}`)}`,
        instructor: profile.name
      };

      updateStudent(student.id, { 
        stripes: student.stripes + 1,
        attendanceCount: 0, // Reset attendance for the next stripe journey
        history: [...(student.history || []), historyEntry]
      });
      alert('Grau atribuído com sucesso! OSS.');
    }
  };

  const handleRemoveStripe = (studentId: string, current: number) => {
    if (current <= 0) return;
    updateStudent(studentId, { stripes: current - 1 });
  };

  const handlePromote = (studentId: string, nextBelt: any) => {
    if (nextBelt === 'Mestre' || nextBelt === 'Adulto') return;
    const beltName = t(`belts.${nextBelt}`);
    if(confirm(`Confirmar graduação para ${beltName}? O histórico de presença atual será resetado para a nova jornada.`)) {
      updateStudent(studentId, { 
        belt: nextBelt, 
        attendanceCount: 0, 
        stripes: 0,
        lastPromotionDate: new Date().toISOString().split('T')[0],
        graduationNotes: '',
        rulesKnowledge: 0
      });
      alert('Graduação processada! Oss.');
    }
  };

  const beltStats = useMemo(() => {
    const stats: Record<string, number> = {};
    students.forEach(s => { stats[s.belt] = (stats[s.belt] || 0) + 1; });
    return stats;
  }, [students]);

  const mostPopulatedBelt = useMemo(() => {
    const entries = Object.entries(beltStats);
    if (entries.length === 0) return 'N/A';
    return entries.sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
  }, [beltStats]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24 w-full px-4 sm:px-0">
      {/* Modals */}
      {showRequirementLibrary && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-4xl flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 max-h-[85vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Biblioteca de Requisitos IBJJF</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consulte as regras oficiais de graduação</p>
              </div>
              <button onClick={() => setShowRequirementLibrary(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X/></button>
            </div>
            
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Pesquisar por requisitos de faixa (Ex: Azul, Marrom...)"
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                   value={requirementSearch}
                   onChange={e => setRequirementSearch(e.target.value)}
                 />
               </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-10">
               {Object.keys(IBJJF_BELT_RULES || {}).filter(key => key.toLowerCase().includes(requirementSearch.toLowerCase())).map((beltKey) => {
                 const rule = (IBJJF_BELT_RULES as any)[beltKey];
                 return (
                  <div key={beltKey} className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className={`w-3 h-8 rounded-full ${BELT_COLORS[beltKey] || ''}`} />
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Faixa {t(`belts.${beltKey}`)}</h4>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tempo Mínimo Permanência</p>
                           <p className="text-xl font-black dark:text-white uppercase tracking-tighter">{rule?.minTimeMonths ?? 0} Meses</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Idade Mínima</p>
                           <p className="text-xl font-black dark:text-white uppercase tracking-tighter">{rule?.minAge ?? 0} Anos</p>
                        </div>
                     </div>
                     <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Requisitos Técnicos Sugeridos</p>
                        <div className="flex flex-wrap gap-2">
                           {((tObj(`beltRequirements.${beltKey}`) as string[]) || []).map((req, i) => (
                             <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-xl uppercase">{req}</span>
                           ))}
                        </div>
                     </div>
                  </div>
                 );
               })}
            </div>
          </div>
        </div>
      )}

      {showCriteriaManager && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Gerenciar Indicadores</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defina os critérios de avaliação da sua equipe</p>
              </div>
              <button onClick={() => setShowCriteriaManager(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X/></button>
            </div>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {activeCriteria.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      className="w-full bg-transparent font-bold text-sm outline-none dark:text-white"
                      value={c.name}
                      onChange={(e) => {
                        const next = [...activeCriteria];
                        next[idx].name = e.target.value;
                        useProfile().updateProfile({ customCriteria: next });
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Peso</span>
                    <input 
                      type="number" 
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-bold text-center dark:text-white outline-none"
                      value={c.weight}
                      onChange={(e) => {
                        const next = [...activeCriteria];
                        next[idx].weight = parseFloat(e.target.value);
                        useProfile().updateProfile({ customCriteria: next });
                      }}
                    />
                    <button 
                      onClick={() => {
                        const next = activeCriteria.filter(curr => curr.id !== c.id);
                        useProfile().updateProfile({ customCriteria: next });
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {activeCriteria.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400 italic font-medium">Nenhum indicador customizado definido.</p>
                </div>
              )}
              <button 
                onClick={() => {
                  const newCriterion = { id: Date.now().toString(), name: 'Novo Indicador', weight: 0.1 };
                  useProfile().updateProfile({ customCriteria: [...activeCriteria, newCriterion] });
                }}
                className="w-full py-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
              >
                <Plus size={16} /> Adicionar Novo Critério
              </button>
            </div>
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-[3rem] flex items-center justify-between">
              <p className="text-[9px] text-slate-400 font-bold max-w-[70%] italic">
                * Os pesos devem somar 1.0 para um cálculo de média equilibrado, mas o sistema aceita pesos arbitrários para ênfases específicas.
              </p>
              <button 
                onClick={() => setShowCriteriaManager(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudentReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-4xl flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className={`p-8 text-white flex items-center justify-between ${BELT_COLORS[selectedStudentReport.belt] || 'bg-slate-900'}`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">
                  {selectedStudentReport.name[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedStudentReport.name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{t('beltSystem.studentReport')}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentReport(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('beltSystem.classesAttended')}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{selectedStudentReport.attendanceCount}</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('beltSystem.timeInBelt')}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{calculateMonthsInBelt(selectedStudentReport.lastPromotionDate)} <span className="text-sm text-slate-400">meses</span></p>
                </div>
                <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-lg">
                  <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest mb-2">Próxima Graduação</p>
                  <p className="text-xl font-black uppercase tracking-tighter">
                    {calculateMonthsInBelt(selectedStudentReport.lastPromotionDate) >= 12 ? 'Elegível' : 'Em Evolução'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> {t('beltSystem.techniquesReceived')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedStudentReport.attendanceHistory?.filter(h => h.lessonPlanId).map((h, idx) => {
                    const plan = useData().lessonPlans.find(p => p.id === h.lessonPlanId);
                    if (!plan) return null;
                    return (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[8px] font-black text-blue-600 uppercase mb-1">{new Date(h.date).toLocaleDateString()}</p>
                        <p className="text-xs font-bold dark:text-white uppercase">{plan.title}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {plan.techniques.map((t, tidx) => (
                            <span key={tidx} className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md text-[7px] font-black uppercase text-slate-500">{t.name}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {(!selectedStudentReport.attendanceHistory || selectedStudentReport.attendanceHistory.filter(h => h.lessonPlanId).length === 0) && (
                    <div className="col-span-2 py-10 text-center bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 italic">Nenhum registro de técnica QTD encontrado para este aluno.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => window.print()}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
              >
                <Download size={16} /> Imprimir Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Award size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Caminho da Evolução SYSBJJ</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('beltSystem.title')}</h1>
          <p className="text-slate-500 font-medium italic text-lg">{t('beltSystem.subtitle')}</p>
        </div>
        
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <button 
            onClick={() => setShowRequirementLibrary(true)}
            className="px-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Search size={18} /> Pesquisar Requisitos
          </button>
          <button 
            onClick={() => setShowCriteriaManager(true)}
            className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/20"
          >
            <Settings2 size={18} /> Indicadores da Equipe
          </button>
          <button 
            onClick={() => navigate('/ibjjf-rules')}
            className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
          >
            <BookOpen size={18} /> Consultar Regras
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar aluno..."
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-black uppercase text-[10px] tracking-widest"
            value={filterBelt}
            onChange={e => setFilterBelt(e.target.value)}
          >
            <option value="All">Todas as Faixas</option>
            {Object.keys(BELT_COLORS).map(b => <option key={b} value={b}>{t(`belts.${b}`)}</option>)}
          </select>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setExamMode(false)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!examMode ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              Visão Geral
            </button>
            <button 
              onClick={() => setExamMode(true)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${examMode ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400'}`}
            >
              Dia de Exame 🥋
            </button>
          </div>
        </div>
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Novo Requisito Extra</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seminários, Cursos ou Competições</p>
              </div>
              <button 
                onClick={() => setShowMilestoneModal({ isOpen: false, studentId: null })}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold dark:text-white outline-none"
                  value={newMilestone.type}
                  onChange={(e) => setNewMilestone({ ...newMilestone, type: e.target.value as any })}
                >
                  <option value="Seminar">Seminário</option>
                  <option value="Course">Curso de Regras</option>
                  <option value="Competition">Competição Oficial</option>
                  <option value="Other">Outro Requisito</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título / Nome do Evento</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold dark:text-white outline-none"
                  placeholder="Ex: Seminário Roger Gracie"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold dark:text-white outline-none"
                  value={newMilestone.date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                />
              </div>
            </div>

            <button 
              onClick={handleAddMilestone}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Confirmar Requisito
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Alunos</p>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{students.length}</p>
        </div>
        <div className="bg-blue-600 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Prontos para Graduação</p>
          <p className="text-3xl sm:text-4xl font-black tracking-tighter">{studentList.filter(s => s.isReady).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Média de Presença</p>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            {Math.round(students.reduce((acc, s) => acc + s.attendanceCount, 0) / (students.length || 1))}
          </p>
        </div>
        <div className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Faixa com mais Alunos</p>
          <p className="text-xl sm:text-2xl font-black tracking-tighter uppercase">
            {mostPopulatedBelt}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Listagem de Alunos</h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{studentList.length} resultados</span>
          </div>
          
          <div className="space-y-4">
            {studentList.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-4 h-20 rounded-full ${BELT_COLORS[s.belt] || 'bg-slate-200'} shadow-inner`} />
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">{s.name}</h3>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-lg uppercase">{s.age} anos</span>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock size={14} /> {s.monthsInBelt} meses na faixa
                        </span>
                        <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-1.5">
                          <TrendingUp size={14} /> {s.attendanceCount} treinos
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stripe/Degree Management */}
                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={() => handleRemoveStripe(s.id, s.stripes)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="px-4 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                          {s.isBlackBelt ? 'Graus' : 'Graus'}
                        </p>
                        <div className="flex gap-0.5">
                          {[...Array(s.maxStripes)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-4 rounded-sm transition-all ${i < s.stripes ? (s.isBlackBelt ? 'bg-yellow-400' : 'bg-slate-900 dark:bg-white') : 'bg-slate-200 dark:bg-slate-700'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddStripe(s, s.maxStripes)}
                        className="p-2 text-slate-400 hover:text-green-500 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button 
                      onClick={() => setSelectedStudentReport(s)}
                      className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"
                      title={t('beltSystem.studentReport')}
                    >
                      <FileText size={20} />
                    </button>
                    <button 
                      onClick={() => setEditingNotes(editingNotes === s.id ? null : s.id)}
                      className={`p-4 rounded-2xl transition-all ${editingNotes === s.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600'}`}
                    >
                      <MessageSquare size={20} />
                    </button>
                    <button 
                      onClick={() => setActiveExamStudentId(activeExamStudentId === s.id ? null : s.id)}
                      className={`p-4 rounded-2xl transition-all ${activeExamStudentId === s.id ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-600'}`}
                      title={t('beltSystem.examChecklist')}
                    >
                      <GraduationCap size={20} />
                    </button>
                    {s.isReady ? (
                      <button 
                        onClick={() => handlePromote(s.id, s.nextEnum)}
                        className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-3"
                      >
                        <GraduationCap size={20} /> Graduar para {t(`belts.${s.nextEnum}`)}
                      </button>
                    ) : (
                      <div className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
                        <AlertCircle size={20} /> Em Evolução
                      </div>
                    )}
                  </div>
                </div>

                {s.isBlackBelt && s.nextDegreeDate && (
                  <div className="mt-8 space-y-6">
                    <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-800/20 flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-3">
                         <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                             <Calendar size={16} /> Previsão Próximo Grau
                           </p>
                           <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">{Math.round(s.timeProgress)}% Tempo</span>
                         </div>
                         <p className="text-2xl font-black dark:text-white uppercase tracking-tighter">
                           {s.nextDegreeDate}
                         </p>
                         <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${s.timeProgress}%` }}
                             className="h-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" 
                           />
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                           Permanência mínima: {s.minMonthsRequired / 12} anos no {s.stripes}º Grau
                         </p>
                      </div>
                      <div className="flex-1 space-y-4">
                         <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <ShieldCheck size={16} className="text-slate-400" /> Requisitos de Graduação da Federação
                         </p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {s.degreeRequirements?.map((req: string, idx: number) => (
                             <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                               <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                 <Check size={12} />
                               </div>
                               <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase leading-none">{req}</span>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>

                    <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                         <Trophy size={14} /> Jornada Completa de Mestre (Projeção IBJJF)
                       </h4>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {s.blackBeltTimeline?.map((t: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded-2xl border-2 transition-all ${idx < s.stripes ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                               <div className="flex items-center justify-between mb-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest">{t.title}</span>
                                  {idx < s.stripes && <Check size={12} />}
                               </div>
                               <p className="text-lg font-black tracking-tighter">{t.year}</p>
                               <p className="text-[8px] font-bold opacity-60 uppercase mt-1">{t.date}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                )}

                {/* Exam Requirements Checklist */}
                {activeExamStudentId === s.id && (
                  <div className="mt-8 p-8 bg-amber-50/30 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                          <ClipboardCheck size={20} className="text-amber-500" /> {t('beltSystem.examChecklist')}
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Requisitos Técnicos para {t(`belts.${s.nextEnum}`)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-amber-600 tracking-tighter">
                          {Object.values(s.examRequirements || {}).filter(v => v).length} / {((tObj(`beltRequirements.${s.nextEnum || 'White'}`) as string[]) || []).length}
                        </p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Concluídos</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {((tObj(`beltRequirements.${s.nextEnum || 'White'}`) as string[]) || []).map((req, idx) => (
                        <button 
                          key={idx}
                          onClick={() => toggleExamRequirement(s.id, req)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${
                            s.examRequirements?.[req] 
                              ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' 
                              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-amber-500/50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            s.examRequirements?.[req] ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-transparent group-hover:text-amber-200'
                          }`}>
                            <Check size={14} strokeWidth={4} />
                          </div>
                          <span className={`text-[11px] font-bold uppercase tracking-tight leading-snug ${
                            s.examRequirements?.[req] ? 'text-amber-950 dark:text-amber-200' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {req}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-8 flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-amber-100/50 dark:border-amber-900/20">
                      <p className="text-[9px] font-black text-amber-600/70 uppercase tracking-widest max-w-md">
                        * Ao marcar todos os requisitos, o sistema considerará o aluno como tecnicamente apto para a nova faixa durante o exame de graduação.
                      </p>
                      <button 
                        onClick={() => setActiveExamStudentId(null)}
                        className="px-6 py-2 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20"
                      >
                        Salvar & Fechar
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tempo Mínimo</p>
                      <p className="text-xs font-black dark:text-white">{s.monthsInBelt} / {s.minMonthsRequired}m</p>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${s.timeReady ? 'bg-green-500' : 'bg-blue-600'}`}
                        style={{ width: `${s.timeProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compromisso (Aulas)</p>
                      <p className="text-xs font-black dark:text-white">{s.attendanceCount} / {s.attendanceThreshold}</p>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${s.attendanceReady ? 'bg-green-500' : 'bg-cyan-500'}`}
                        style={{ width: `${s.attendanceProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avaliação Técnica</p>
                      <p className="text-xs font-black dark:text-white">{Math.round(s.customProgress || 0)}%</p>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${s.customReady ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${s.customProgress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Path & Milestones */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Map size={14} className="text-blue-600" /> Caminho para a Próxima
                      </h4>
                      <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 uppercase tracking-tighter">
                        {t(`belts.${s.nextEnum}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
                      <div className="flex flex-col items-center gap-2 min-w-[80px]">
                        <div className={`w-10 h-1 rounded-full ${BELT_COLORS[s.belt]}`} />
                        <span className="text-[8px] font-bold text-slate-400 uppercase text-center">{t(`belts.${s.belt}`)}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                      <div className="flex flex-col items-center gap-2 min-w-[80px]">
                        <div className={`w-10 h-1.5 rounded-full ${BELT_COLORS[s.nextEnum]} border border-blue-400 shadow-sm shadow-blue-200`} />
                        <span className="text-[8px] font-black text-blue-600 uppercase text-center">{t(`belts.${s.nextEnum}`)}</span>
                      </div>
                      {s.futureBelts.slice(1).map((fb, idx) => (
                        <React.Fragment key={idx}>
                          <ChevronRight size={14} className="text-slate-200" />
                          <div className="flex flex-col items-center gap-2 min-w-[80px] opacity-30">
                            <div className={`w-10 h-1 rounded-full ${BELT_COLORS[fb]}`} />
                            <span className="text-[8px] font-bold text-slate-400 uppercase text-center">{t(`belts.${fb}`)}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Star size={14} className="text-amber-500" /> Requisitos & Conquistas
                      </h4>
                      <button 
                        onClick={() => setShowMilestoneModal({ isOpen: true, studentId: s.id })}
                        className="text-[8px] font-black text-blue-600 uppercase hover:underline"
                      >
                        + Adicionar Requisito
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.milestones?.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group relative">
                          {m.type === 'Seminar' && <Users2 size={12} className="text-amber-500" />}
                          {m.type === 'Competition' && <Medal size={12} className="text-blue-500" />}
                          {m.type === 'Course' && <Presentation size={12} className="text-purple-500" />}
                          {m.type === 'Other' && <Star size={12} className="text-slate-400" />}
                          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase">{m.title}</span>
                          <button 
                            onClick={() => {
                              const updated = s.milestones?.filter(curr => curr.id !== m.id);
                              updateStudent(s.id, { milestones: updated });
                            }}
                            className="bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                      {(!s.milestones || s.milestones.length === 0) && (
                        <p className="text-[9px] text-slate-400 italic">Nenhum requisito extra registrado.</p>
                      )}
                    </div>
                  </div>
                </div>

                {editingNotes === s.id && (
                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações de Graduação</label>
                        <textarea 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-sm dark:text-white outline-none min-h-[120px] font-medium"
                          placeholder="Descreva o desempenho técnico, comportamento e pontos a melhorar..."
                          defaultValue={s.graduationNotes}
                          onBlur={(e) => updateStudent(s.id, { graduationNotes: e.target.value })}
                        />
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Regras (0-100)</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            defaultValue={s.rulesKnowledge || 0}
                            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            onChange={(e) => updateStudent(s.id, { rulesKnowledge: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/20">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">Critérios da Equipe</p>
                          <div className="space-y-6">
                            {activeCriteria.map((criterion) => {
                              const indicator = s.customIndicators?.find(ci => ci.name === criterion.name);
                              return (
                                <div key={criterion.id} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{criterion.name}</span>
                                    <span className="text-[10px] font-bold text-blue-600">{indicator?.value || 0}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={indicator?.value || 0}
                                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      const currentIndicators = [...(s.customIndicators || [])];
                                      const existing = currentIndicators.findIndex(ci => ci.name === criterion.name);
                                      if (existing !== -1) {
                                        currentIndicators[existing].value = val;
                                      } else {
                                        currentIndicators.push({ name: criterion.name, value: val });
                                      }
                                      updateStudent(s.id, { customIndicators: currentIndicators });
                                    }}
                                  />
                                </div>
                              );
                            })}
                            {activeCriteria.length === 0 && (
                              <p className="text-[10px] text-slate-400 italic">Defina indicadores globais para avaliar este aluno.</p>
                            )}
                          </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dica do Professor</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                            "Acompanhe o progresso diário. Alunos com mais de 80% de presença e conhecimento de regras estão aptos para o exame de faixa."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Census Sidebar */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-lg">
                <GraduationCap size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Censo de Faixas</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(BELT_COLORS).map(([belt, colorClass]) => {
                const count = beltStats[belt] || 0;
                const percentage = Math.round((count / (students.length || 1)) * 100);
                return (
                  <div key={belt} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t(`belts.${belt}`)}</span>
                      </div>
                      <span className="text-xs font-black dark:text-white">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorClass}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20" />
              <div className="relative z-10">
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">Relatório de Graduação</h4>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Gere um PDF completo com o status de todos os alunos para o próximo evento.</p>
                <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 transition-all">
                  <Download size={16} /> Exportar Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeltSystem;
