
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Shield, Target, Award, Plus, Search, 
  ChevronRight, Activity, Zap, History, User, Trophy,
  Flame, Monitor, Filter, BarChart3, Clock, Scale,
  Layers
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTranslation } from '../contexts/LanguageContext';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Student, SparringLog, CompetitionRecord } from '../types';

const PerformanceAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { students, updateStudent } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sparring' | 'competitions'>('overview');

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (b.attendanceCount || 0) - (a.attendanceCount || 0));
  }, [students, searchTerm]);

  const radarData = useMemo(() => {
    if (!selectedStudent) return [];
    const latest = selectedStudent.performanceRatings?.[0] || {
      technical: 60,
      tactical: 55,
      physical: 70,
      behavioral: 85,
      mindset: 65
    };
    return [
      { subject: 'Técnico', A: latest.technical, fullMark: 100 },
      { subject: 'Tático', A: latest.tactical, fullMark: 100 },
      { subject: 'Físico', A: latest.physical, fullMark: 100 },
      { subject: 'Mindset', A: latest.mindset, fullMark: 100 },
      { subject: 'Conduta', A: latest.behavioral, fullMark: 100 },
    ];
  }, [selectedStudent]);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Performance <span className="text-blue-600">HUB</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-3 italic flex items-center gap-2">
            <Shield size={12} className="text-blue-500" />
            Análise Avançada e Métricas de Combate
          </p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="BUSCAR ATLETA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] font-black text-sm focus:ring-2 focus:ring-blue-600 transition-all uppercase tracking-tight shadow-2xl"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student List */}
        <div className="lg:col-span-4 space-y-4 h-[calc(100vh-350px)] overflow-y-auto pr-2 scrollbar-thin">
           {filteredStudents.map((s, idx) => (
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.05 }}
               key={s.id}
               onClick={() => setSelectedStudent(s)}
               className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${
                 selectedStudent?.id === s.id 
                 ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-600/30' 
                 : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-blue-500/30'
               }`}
             >
                <div className="flex items-center gap-5 relative z-10">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic shadow-lg ${
                     selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                   }`}>
                      {s.photoUrl || s.photo ? (
                        <img src={s.photoUrl || s.photo} className="w-full h-full object-cover rounded-2xl" />
                      ) : s.name[0]}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-black uppercase tracking-tighter truncate leading-tight italic">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          selectedStudent?.id === s.id ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                           {s.belt}
                        </span>
                        <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest">{s.attendanceCount} AULAS</span>
                      </div>
                   </div>
                   <ChevronRight size={18} className={`transition-transform ${selectedStudent?.id === s.id ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </div>
                
                {selectedStudent?.id === s.id && (
                  <motion.div 
                    layoutId="glow"
                    className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"
                  />
                )}
             </motion.div>
           ))}
        </div>

        {/* Right Column: Analytics & Details */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
             {selectedStudent ? (
               <motion.div
                 key={selectedStudent.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="space-y-8"
               >
                  {/* Top Stats Banner */}
                  <div className="bg-slate-950 dark:bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
                     <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                     
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                           <div className="relative">
                              <div className="w-28 h-28 bg-white/10 rounded-[2.5rem] p-1 backdrop-blur-3xl border border-white/20 overflow-hidden">
                                 {selectedStudent.photoUrl || selectedStudent.photo ? (
                                   <img src={selectedStudent.photoUrl || selectedStudent.photo} className="w-full h-full object-cover rounded-[2rem]" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center font-black text-5xl italic">{selectedStudent.name[0]}</div>
                                 )}
                              </div>
                              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-slate-950 shadow-xl">
                                 <Trophy size={20} />
                              </div>
                           </div>
                           <div>
                              <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{selectedStudent.name}</h2>
                              <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-xs mt-3 flex items-center gap-3">
                                 <Zap size={14} /> Nível de Evolução PRO
                              </p>
                              <div className="flex gap-2 mt-6">
                                 <span className="px-5 py-2 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 italic">MVP Mês</span>
                                 <span className="px-5 py-2 bg-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 italic">Frequência 100%</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-10">
                           <div className="text-center">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Mat Time</p>
                              <p className="text-3xl font-black italic tabular-nums">{selectedStudent.attendanceCount * 1.5}h</p>
                           </div>
                           <div className="w-px h-12 bg-white/10" />
                           <div className="text-center">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Rounds</p>
                              <p className="text-3xl font-black italic tabular-nums">48</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="flex bg-slate-100 dark:bg-white/5 p-2 rounded-3xl border border-slate-200 dark:border-white/5 shadow-inner">
                     <button 
                       onClick={() => setActiveTab('overview')}
                       className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl border border-slate-100 dark:border-white/5' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       <Activity size={16} /> Visão Técnica
                     </button>
                     <button 
                       onClick={() => setActiveTab('sparring')}
                       className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'sparring' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl border border-slate-100 dark:border-white/5' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       <Flame size={16} /> Sparring Log
                     </button>
                     <button 
                       onClick={() => setActiveTab('competitions')}
                       className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'competitions' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl border border-slate-100 dark:border-white/5' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       <Trophy size={16} /> Competições
                     </button>
                  </div>

                  <AnimatePresence mode="wait">
                     {activeTab === 'overview' && (
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -20 }}
                         className="grid grid-cols-1 md:grid-cols-2 gap-8"
                       >
                          {/* Radar Chart Card */}
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-xl">
                             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8 flex items-center gap-4">
                                <Target size={24} className="text-blue-600" />
                                Radar de Atributos
                             </h3>
                             <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" strokeOpacity={0.3} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                                    <Radar
                                      name="Atributos"
                                      dataKey="A"
                                      stroke="#3b82f6"
                                      fill="#3b82f6"
                                      fillOpacity={0.4}
                                    />
                                  </RadarChart>
                                </ResponsiveContainer>
                             </div>
                             <div className="grid grid-cols-2 gap-4 mt-8">
                                {radarData.map(item => (
                                   <div key={item.subject} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{item.subject}</p>
                                      <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{item.A}%</p>
                                   </div>
                                ))}
                             </div>
                          </div>

                          {/* Efficiency Metrics */}
                          <div className="space-y-8">
                             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-xl">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8 flex items-center gap-4">
                                   <Zap size={24} className="text-amber-500" />
                                   Dinâmica de Ataque
                                </h3>
                                <div className="space-y-6">
                                   <div className="space-y-3">
                                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                                         <span className="text-slate-400">Taxa de Finalização</span>
                                         <span className="text-blue-600">62%</span>
                                      </div>
                                      <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                                         <motion.div initial={{ width: 0 }} animate={{ width: '62%' }} className="h-full bg-blue-600" />
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                                         <span className="text-slate-400">Eficiência de Raspagem</span>
                                         <span className="text-indigo-600">45%</span>
                                      </div>
                                      <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                                         <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-indigo-600" />
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                                         <span className="text-slate-400">Retenção de Guarda</span>
                                         <span className="text-emerald-600">89%</span>
                                      </div>
                                      <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                                         <motion.div initial={{ width: 0 }} animate={{ width: '89%' }} className="h-full bg-emerald-600" />
                                      </div>
                                   </div>
                                </div>
                             </div>

                             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                                <Monitor className="absolute bottom-[-20px] right-[-20px] w-48 h-48 opacity-10 rotate-12" />
                                <div className="relative z-10">
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Predição de Graduação</h4>
                                   <p className="text-[10px] leading-relaxed font-bold opacity-80 uppercase italic">
                                      Baseado nas métricas atuais, este atleta atingirá a proficiência para a Faixa {selectedStudent.belt === 'White' ? 'Azul' : selectedStudent.belt === 'Blue' ? 'Roxa' : 'Avançada'} em aproximadamente 4 meses.
                                   </p>
                                   <button className="mt-8 px-8 py-3 bg-white text-blue-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                                      Ver Detalhes do Diagnóstico
                                   </button>
                                </div>
                             </div>
                          </div>
                       </motion.div>
                     )}

                     {activeTab === 'sparring' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                           <div className="flex items-center justify-between">
                              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                                 <History size={24} className="text-blue-600" />
                                 Histórico de Rounds Logados
                              </h3>
                              <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
                                 <Plus size={14} /> Novo Log de Rola
                              </button>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                                   <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 transition-colors group-hover:bg-blue-600/10" />
                                   
                                   <div className="flex justify-between items-start mb-6">
                                      <div>
                                         <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">0{i} Maio, 2026</p>
                                         <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Sessão de Sparring Hard</h4>
                                      </div>
                                      <div className="px-4 py-1.5 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md italic">
                                         6 ROUNDS
                                      </div>
                                   </div>

                                   <div className="space-y-4 mb-8">
                                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                                               <TrendingUp size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Finalizações</span>
                                         </div>
                                         <span className="text-sm font-black text-emerald-500 italic">4 ACHIEVED</span>
                                      </div>
                                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center">
                                               <History size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cedidas</span>
                                         </div>
                                         <span className="text-sm font-black text-rose-500 italic">2 CONCEDED</span>
                                      </div>
                                   </div>

                                   <p className="text-xs text-slate-400 font-bold italic line-clamp-2 uppercase leading-relaxed">
                                      "Trabalhando guarda fechada e transição para o triângulo. Gás em 80%. Preciso ajustar a pegada na manga."
                                   </p>
                                </div>
                              ))}
                           </div>
                        </motion.div>
                     )}

                     {activeTab === 'competitions' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                           <div className="flex items-center justify-between">
                              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                                 <Trophy size={24} className="text-blue-600" />
                                 Carreira Competitiva
                              </h3>
                              <div className="flex items-center gap-6">
                                 <div className="flex gap-2">
                                    <div className="flex flex-col items-center">
                                       <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white shadow-lg animate-bounce">
                                          <Award size={20} />
                                       </div>
                                       <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-slate-400">12</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                       <div className="w-10 h-10 bg-slate-300 rounded-xl flex items-center justify-center text-white shadow-lg">
                                          <Award size={20} />
                                       </div>
                                       <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-slate-400">8</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                       <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                          <Award size={20} />
                                       </div>
                                       <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-slate-400">4</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
                              <table className="w-full">
                                 <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                       <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Evento</th>
                                       <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Data</th>
                                       <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Categoria</th>
                                       <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Resultado</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {[
                                      { name: 'IBJJF São Paulo Open', date: '12/04/2026', cat: 'Adulto / Pena', res: 'Gold' },
                                      { name: 'AJP Tour Brazil', date: '05/03/2026', cat: 'Adulto / Pena', res: 'Silver' },
                                      { name: 'Copa Podio', date: '20/01/2026', cat: 'Pro / Lightweight', res: 'Gold' },
                                    ].map((comp, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                         <td className="px-8 py-8 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{comp.name}</td>
                                         <td className="px-8 py-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{comp.date}</td>
                                         <td className="px-8 py-8">
                                            <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                                               {comp.cat}
                                            </span>
                                         </td>
                                         <td className="px-8 py-8 text-right">
                                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-xl ${
                                              comp.res === 'Gold' ? 'bg-amber-400 text-white' : 
                                              comp.res === 'Silver' ? 'bg-slate-300 text-slate-600' : 
                                              'bg-amber-600 text-white'
                                            }`}>
                                               {comp.res} MEDAL
                                            </span>
                                         </td>
                                      </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.div>
             ) : (
               <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-10 bg-white/50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-white/5 backdrop-blur-3xl">
                  <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-8 animate-pulse">
                     <User size={64} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-400 uppercase tracking-tighter italic">Selecione um Atleta</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Para visualizar o HUB de Performance e Diagnóstico</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
