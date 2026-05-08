
import React, { useState, useMemo } from 'react';
import { Award, Star, Search, ShieldCheck, Clock, CheckCircle2, AlertCircle, TrendingUp, UserCheck, QrCode, Lock, ChevronRight, Zap, Medal, Settings2, Users, Baby, Info, Save, Plus, Trash2, Scale } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { BeltColor, KidsBeltColor, Student, GraduationCriterion } from '../types';
import { BELT_COLORS, IBJJF_BELT_RULES } from '../constants';
import { BELT_REQUIREMENTS, KIDS_BELT_REQUIREMENTS } from '../constants/beltRequirements';
import { IBJJF_REFERENCE } from '../constants/rulesData';
import VerificationBadge from '../components/ui/VerificationBadge';

const BeltSystem: React.FC = () => {
  const { t } = useTranslation();
  const { students, verifyAuditIntegrity, logs, professorRules, setProfessorRules, approveGraduation } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'fail' | null>(null);
  const [activeBoard, setActiveBoard] = useState<'adult' | 'kids' | 'chart'>('adult');
  const [showProfessorSettings, setShowProfessorSettings] = useState(false);
  const [chartSubTab, setChartSubTab] = useState<'adult' | 'kids'>('adult');

  const elegibleStudents = useMemo(() => {
    return students.filter(s => {
      const isCorrectCategory = activeBoard === 'adult' ? !s.isKid : s.isKid;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Eligibility logic based on Professor Rules weights (Simulated)
      // In a real app index, we would calculate this based on attendanceHistory, ruleLessons, etc.
      const hasAttendance = s.attendanceCount >= 40;
      const hasKnowledge = (s.rulesKnowledge || 0) >= 50;
      
      return isCorrectCategory && matchesSearch && (hasAttendance || hasKnowledge || s.isReadyForPromotion);
    }).sort((a, b) => (b.attendanceCount || 0) - (a.attendanceCount || 0));
  }, [students, searchTerm, activeBoard]);

  const handleApprove = () => {
    if (!selectedStudent) return;
    
    // Get next belt
    const belts = activeBoard === 'adult' ? Object.keys(BELT_COLORS) : Object.keys(BELT_COLORS); // Simplificação
    const currentIndex = belts.indexOf(selectedStudent.belt);
    const nextBelt = belts[currentIndex + 1] || selectedStudent.belt;

    if (confirm(`Deseja graduar ${selectedStudent.name} para a faixa ${nextBelt}? Esta ação será registrada no Ledger Imutável.`)) {
      approveGraduation(selectedStudent.id, nextBelt);
      setSelectedStudent(null);
    }
  };

  const runBlockchainVerification = () => {
    setIsVerifying(true);
    setVerificationResult(null);
    setTimeout(() => {
      const isIntegrityOk = verifyAuditIntegrity();
      setVerificationResult(isIntegrityOk ? 'success' : 'fail');
      setIsVerifying(false);
    }, 2000);
  };

  const addCriterion = () => {
    const name = prompt('Nome do Critério (ex: Pontualidade):');
    if (name) {
      setProfessorRules(prev => [...prev, { id: `rule-${Date.now()}`, name, weight: 0.1 }]);
    }
  };

  const removeCriterion = (id: string) => {
    setProfessorRules(prev => prev.filter(r => r.id !== id));
  };

  const getRequirements = (belt: string, isKid: boolean) => {
    if (isKid) return KIDS_BELT_REQUIREMENTS[belt] || ['Requisitos não definidos'];
    return BELT_REQUIREMENTS[belt] || ['Requisitos não definidos'];
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Sistema de <span className="text-blue-600">Graduação</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Evolução Técnica, Meritocracia e Registros Imutáveis</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
           <button 
             onClick={() => setActiveBoard('adult')}
             className={`px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeBoard === 'adult' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl' : 'text-slate-400 opacity-50 hover:opacity-100'}`}
           >
             <Users size={14} /> Adultos
           </button>
           <button 
             onClick={() => setActiveBoard('kids')}
             className={`px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeBoard === 'kids' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl' : 'text-slate-400 opacity-50 hover:opacity-100'}`}
           >
             <Baby size={14} /> Kids
           </button>
           <button 
             onClick={() => setActiveBoard('chart')}
             className={`px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeBoard === 'chart' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl' : 'text-slate-400 opacity-50 hover:opacity-100'}`}
           >
             <ShieldCheck size={14} /> {t('beltSystem.officialChart')}
           </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeBoard === 'chart' ? (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl max-w-md mx-auto">
              <button 
                onClick={() => setChartSubTab('adult')}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${chartSubTab === 'adult' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-100'}`}
              >
                {t('beltSystem.adultJuvenile')}
              </button>
              <button 
                onClick={() => setChartSubTab('kids')}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${chartSubTab === 'kids' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-100'}`}
              >
                {t('beltSystem.kidsTab')}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 text-blue-600/5">
                  <ShieldCheck size={200} />
               </div>
               
               <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8">
                     {t('beltSystem.graduationChartTitle')}
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                       <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <th className="px-6 py-4">{t('beltRank')}</th>
                             <th className="px-6 py-4">{t('beltSystem.minAge')}</th>
                             {chartSubTab === 'adult' && <th className="px-6 py-4">{t('beltSystem.minTime')}</th>}
                             <th className="px-6 py-4 text-right">{t('common.audit')}</th>
                          </tr>
                       </thead>
                       <tbody>
                          {(chartSubTab === 'adult' ? IBJJF_REFERENCE.graduationChart.adult : IBJJF_REFERENCE.graduationChart.kids).map((item: any, idx: number) => (
                            <tr key={idx} className="bg-slate-50 dark:bg-white/5 rounded-2xl group hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                               <td className="px-6 py-4 rounded-l-2xl">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-12 h-4 rounded-full ${BELT_COLORS[item.color]} border border-black/10`} />
                                     <span className="font-black uppercase tracking-tight italic text-sm text-slate-900 dark:text-white">{item.belt}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <span className="text-xs font-bold text-slate-500 uppercase italic">{item.age}</span>
                               </td>
                               {chartSubTab === 'adult' && (
                                 <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-blue-600 uppercase italic">{item.time}</span>
                                 </td>
                               )}
                               <td className="px-6 py-4 text-right rounded-r-2xl">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/5">
                                     <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                     <span className="text-[8px] font-black uppercase text-slate-400">OSS!</span>
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>

                  <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative">
                     <div className="absolute inset-0 bg-blue-600/10" />
                     <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <Info size={32} />
                        </div>
                        <div className="flex-1">
                           <h4 className="text-lg font-black uppercase tracking-tighter italic mb-2">{t('beltSystem.timelineNote')}</h4>
                           <p className="text-sm font-bold opacity-60 uppercase tracking-widest leading-relaxed">
                              {chartSubTab === 'adult' 
                                ? t('beltSystem.adultTimelineNote')
                                : t('beltSystem.kidsTimelineNote')
                              }
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                  <TrendingUp size={24} className="text-blue-600" />
                  {activeBoard === 'adult' ? 'Adultos Aptos' : 'Crianças Aptas'}
                </h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Filtrar guerreiros..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => setShowProfessorSettings(!showProfessorSettings)}
                    className={`p-2 rounded-xl transition-all ${showProfessorSettings ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}
                  >
                    <Settings2 size={20} />
                  </button>
                </div>
             </div>

             <AnimatePresence>
               {showProfessorSettings && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="mb-8 p-6 bg-blue-600/5 rounded-[2rem] border border-blue-600/10 overflow-hidden"
                 >
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                         <Star size={14} /> Regras do Professor (Syllabus)
                       </h3>
                       <button onClick={addCriterion} className="p-1.5 bg-blue-600 text-white rounded-lg hover:scale-105 transition-all">
                         <Plus size={14} />
                       </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {professorRules.map(rule => (
                         <div key={rule.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 group">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{rule.name}</span>
                            <div className="flex items-center gap-3">
                               <input 
                                 type="number" 
                                 step="0.1" 
                                 max="1" 
                                 value={rule.weight}
                                 onChange={(e) => {
                                   const val = parseFloat(e.target.value);
                                   setProfessorRules(prev => prev.map(r => r.id === rule.id ? { ...r, weight: val } : r));
                                 }}
                                 className="w-12 h-8 bg-slate-50 dark:bg-white/5 rounded-lg text-center text-[10px] font-black border-none"
                               />
                               <button onClick={() => removeCriterion(rule.id)} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                 <Trash2 size={14} />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>

             <div className="space-y-3">
               {elegibleStudents.length === 0 ? (
                 <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                   <AlertCircle size={40} className="text-slate-200 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum aluno atingiu os requisitos mínimos ainda.</p>
                 </div>
               ) : (
                 elegibleStudents.map(student => (
                   <motion.button
                     key={student.id}
                     whileHover={{ x: 8 }}
                     onClick={() => setSelectedStudent(student)}
                     className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${selectedStudent?.id === student.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                   >
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0 border-2 border-white/20">
                         {student.photoUrl ? <img src={student.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400 uppercase">{student.name[0]}</div>}
                       </div>
                       <div className="text-left">
                         <h4 className="font-black uppercase tracking-tight text-sm truncate max-w-[150px]">{student.name}</h4>
                         <div className="flex items-center gap-2 mt-1">
                           <div className={`w-8 h-2 rounded-full ${BELT_COLORS[student.belt] || 'bg-slate-500'} border border-black/10`} />
                           <span className={`text-[8px] font-black uppercase tracking-widest ${selectedStudent?.id === student.id ? 'text-blue-100' : 'text-slate-500'}`}>{student.belt}</span>
                         </div>
                       </div>
                     </div>

                     <div className="flex items-center gap-8">
                        <div className="hidden sm:flex flex-col items-end">
                           <p className={`text-[8px] font-black uppercase tracking-widest ${selectedStudent?.id === student.id ? 'text-blue-100' : 'text-slate-400'}`}>Presença</p>
                           <p className="text-sm font-black italic">{student.attendanceCount} Aulas</p>
                        </div>
                        <div className="hidden sm:flex flex-col items-end">
                           <p className={`text-[8px] font-black uppercase tracking-widest ${selectedStudent?.id === student.id ? 'text-blue-100' : 'text-slate-400'}`}>Regras</p>
                           <p className="text-sm font-black italic">{student.rulesKnowledge || 0}%</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedStudent?.id === student.id ? 'bg-white/20' : 'bg-white dark:bg-slate-800'}`}>
                           <ChevronRight size={18} />
                        </div>
                     </div>
                   </motion.button>
                 ))
               )}
             </div>
          </div>

          <div className="p-8 bg-slate-900 rounded-[3rem] text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 flex items-center justify-center text-blue-400 shadow-2xl">
                   <QrCode size={48} />
                </div>
                <div className="flex-1 text-center md:text-left">
                   <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-2">Selos de Autenticidade <span className="text-blue-500">Blockchain</span></h3>
                   <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">Cada graduação no sistema SYSBJJ gera uma assinatura criptográfica única, garantindo que o histórico do aluno seja imutável e verificável mundialmente.</p>
                   <button 
                     onClick={runBlockchainVerification}
                     disabled={isVerifying}
                     className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-xl shadow-blue-600/20"
                   >
                     {isVerifying ? <Zap size={16} className="animate-spin" /> : <Lock size={16} />}
                     {isVerifying ? 'Validando Cadeia de Blocos...' : 'Verificar Integridade do Sistema'}
                   </button>
                </div>
             </div>

             <AnimatePresence>
               {verificationResult && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className={`absolute inset-0 z-20 flex items-center justify-center backdrop-blur-md ${verificationResult === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}
                 >
                    <div className="text-center p-8">
                       {verificationResult === 'success' ? <ShieldCheck size={80} className="mx-auto mb-4 text-white" /> : <AlertCircle size={80} className="mx-auto mb-4 text-white" />}
                       <h3 className="text-4xl font-black uppercase tracking-tighter italic text-white mb-2">
                         {verificationResult === 'success' ? 'Integridade OK!' : 'Falha na Rede!'}
                       </h3>
                       <p className="text-white/80 font-black uppercase tracking-widest text-[10px] mb-8">
                         {verificationResult === 'success' ? 'Todos os registros estão sincronizados e válidos no Ledger local.' : 'Foram detectadas inconsistências nos hashes de segurança.'}
                       </p>
                       <button 
                         onClick={() => setVerificationResult(null)}
                         className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                       >
                         Continuar
                       </button>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedStudent ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                key={selectedStudent.id}
                className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-100 dark:border-white/5 overflow-hidden mx-auto shadow-2xl relative group">
                    {selectedStudent.photoUrl ? <img src={selectedStudent.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-3xl font-black text-slate-300">{selectedStudent.name[0]}</div>}
                    <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Award size={40} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{selectedStudent.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nível de Domínio Atual: {selectedStudent.belt}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Aulas Totais</p>
                     <p className="text-xl font-black italic text-slate-900 dark:text-white">{selectedStudent.attendanceCount}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pontos OSS</p>
                     <p className="text-xl font-black italic text-blue-600">{selectedStudent.rewardPoints || 0}</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Info size={14} className="text-blue-500" />
                        Critérios do Professor
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {professorRules.map(rule => (
                          <div key={rule.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                             <span className="text-[9px] font-bold text-slate-500 uppercase">{rule.name}</span>
                             <div className="flex gap-1">
                                {[1,2,3,4,5].map(star => (
                                  <Star key={star} size={10} className={star <= (selectedStudent.behaviorScore || 4) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                                ))}
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Scale size={14} className="text-blue-500" />
                        Requisitos Técnicos (IBJJF)
                      </h4>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {getRequirements(selectedStudent.belt, selectedStudent.isKid).map((req, idx) => (
                           <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-transparent hover:border-blue-500/20 transition-all">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase leading-tight">{req}</span>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handleApprove}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Medal size={18} />
                  Aprovar para Próxima Faixa
                </button>
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-12 text-center h-full flex flex-col items-center justify-center">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                   <UserCheck size={32} className="text-slate-300" />
                 </div>
                 <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Análise Meritocrática</h3>
                 <p className="mt-2 text-slate-400 text-sm font-medium">Selecione um aluno da lista ao lado para ver o detalhamento técnico e tempo de permanência na faixa atual.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )}
    </AnimatePresence>
  </div>
);
};

export default BeltSystem;
