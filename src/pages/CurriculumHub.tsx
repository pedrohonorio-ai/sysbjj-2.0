
import React, { useState, useMemo } from 'react';
import { 
  Plus, Clock, User, Trash2, Calendar, X, Save, Edit2, 
  LayoutList, ArrowRight, Filter, Book, BookOpen, 
  Target, Flame, Zap, PlayCircle, Star, ChevronRight, Search,
  PlusCircle, BookOpenCheck, LayoutGrid, Layers
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ClassSchedule, TechniqueCategory, BeltColor } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

const CurriculumHub: React.FC = () => {
  const { 
    schedules, addSchedule, updateSchedule, deleteSchedule,
    techniques, lessonPlans, addLessonPlan 
  } = useData();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'curriculum'>('schedule');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TechniqueCategory | 'All'>('All');
  
  // Schedule States
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<'cards' | 'grid'>('grid');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState<Omit<ClassSchedule, 'id'>>({
    time: '09:00',
    title: '',
    instructor: '',
    category: t('common.adult'),
    days: [],
    notes: ''
  });

  const DAYS_OF_WEEK = useMemo(() => [
    t('classes.seg'),
    t('classes.ter'),
    t('classes.qua'),
    t('classes.qui'),
    t('classes.sex'),
    t('classes.sab'),
    t('classes.dom')
  ], [t]);

  // Curriculum Logic
  const filteredTechniques = techniques.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Schedule Logic
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingScheduleId) {
      updateSchedule(editingScheduleId, scheduleFormData);
      setEditingScheduleId(null);
    } else {
      addSchedule(scheduleFormData);
    }
    setIsAddingSchedule(false);
    setScheduleFormData({ time: '09:00', title: '', instructor: '', category: t('common.adult'), days: [], notes: '' });
  };

  const toggleScheduleDay = (day: string) => {
    setScheduleFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day]
    }));
  };

  const startScheduleEdit = (s: ClassSchedule) => {
    setScheduleFormData({
      time: s.time,
      title: s.title,
      instructor: s.instructor,
      category: s.category,
      days: s.days || [],
      notes: s.notes || ''
    });
    setEditingScheduleId(s.id);
    setIsAddingSchedule(true);
  };

  const memoizedGrid = useMemo(() => {
    const timeSlots = Array.from(new Set(schedules.map(s => s.time))).sort();
    return timeSlots.map(timeSlot => (
      <React.Fragment key={timeSlot}>
        <div className="p-2 sm:p-4 flex items-center justify-center border-r border-slate-50 dark:border-slate-800/50 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
           <p className="text-xs font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">{timeSlot}</p>
        </div>
        {DAYS_OF_WEEK.map(day => {
          const classForDay = schedules.find(s => s.time === timeSlot && s.days?.includes(day));
          return (
            <div key={day} className="p-1">
              {classForDay ? (
                <div 
                  onClick={() => startScheduleEdit(classForDay)}
                  className="h-full p-4 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden min-h-[110px] flex flex-col justify-between"
                >
                   <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Edit2 size={12} className="text-blue-400" />
                   </div>
                   <div>
                     <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter line-clamp-1 mb-1">{classForDay.category}</p>
                     <p className="text-[10px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight line-clamp-2 italic">{classForDay.title}</p>
                   </div>
                   
                   <div className="mt-3 space-y-2">
                     <div className="flex items-center gap-1.5 text-slate-400">
                       <User size={10} />
                       <span className="text-[8px] font-black uppercase tracking-widest truncate">{classForDay.instructor}</span>
                     </div>
                   </div>
                </div>
              ) : (
                <div className="h-full border border-dashed border-slate-100 dark:border-slate-800/10 rounded-2xl min-h-[110px]"></div>
              )}
            </div>
          );
        })}
      </React.Fragment>
    ));
  }, [schedules, DAYS_OF_WEEK]);

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-in slide-in-from-left duration-700">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Teaching <span className="text-blue-600">Hub</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-3">
            Gestão Unificada de Turmas, Currículo e Planejamento Técnico
          </p>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner">
           <button 
             onClick={() => setActiveTab('schedule')}
             className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'schedule' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <Calendar size={14} /> Grade de Aulas
           </button>
           <button 
             onClick={() => setActiveTab('curriculum')}
             className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'curriculum' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <BookOpenCheck size={14} /> Quadro Técnico
           </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'schedule' ? (
          <motion.div 
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700">
                     <button 
                       onClick={() => setScheduleViewMode('grid')}
                       className={`p-2.5 rounded-xl transition-all ${scheduleViewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-xl text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}
                     >
                       <LayoutGrid size={18} />
                     </button>
                     <button 
                       onClick={() => setScheduleViewMode('cards')}
                       className={`p-2.5 rounded-xl transition-all ${scheduleViewMode === 'cards' ? 'bg-white dark:bg-slate-900 shadow-xl text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}
                     >
                       <LayoutList size={18} />
                     </button>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{schedules.length} Horários Ativos</p>
               </div>
               <button 
                 onClick={() => { setIsAddingSchedule(true); setEditingScheduleId(null); setScheduleFormData({ time: '09:00', title: '', instructor: '', category: t('common.adult'), days: [], notes: '' }); }}
                 className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 transition-all flex items-center justify-center gap-3"
               >
                 <Plus size={18} /> Adicionar Horário
               </button>
            </div>

            {scheduleViewMode === 'grid' ? (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Calendar size={300} />
                </div>
                
                <div className="overflow-x-auto scrollbar-thin pb-4 relative z-10">
                  <div className="grid grid-cols-8 gap-4 min-w-[1200px]">
                    <div className="p-4"></div>
                    {DAYS_OF_WEEK.map(day => (
                      <div key={day} className="p-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] italic">{day}</p>
                      </div>
                    ))}
                    {memoizedGrid}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {schedules.map((s) => (
                  <div key={s.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -mr-20 -mt-20 group-hover:bg-blue-600/10 transition-colors" />
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 italic font-black text-2xl">
                          {s.time.split(':')[0]}
                        </div>
                        <div>
                          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter italic">{s.time}</p>
                          <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/40">{s.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startScheduleEdit(s)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => deleteSchedule(s.id)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 italic leading-tight">{s.title || 'Aula Sem Título'}</h3>
                    
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {DAYS_OF_WEEK.map(day => (
                        <span 
                          key={day} 
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                            s.days?.includes(day) 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 border-dashed dark:border-slate-800 text-slate-300'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-slate-500 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <User size={16} className="text-blue-600" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Instrutor</span>
                        <span className="text-xs font-black uppercase tracking-tight dark:text-slate-200">{s.instructor || 'Sensei Principal'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="curriculum"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-2xl space-y-8">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                   <div className="relative flex-1 w-full">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="text"
                        placeholder="Buscar técnica na biblioteca técnica (QTD)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-blue-600 transition-all uppercase tracking-tight shadow-inner"
                      />
                   </div>
                   <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-none">
                      {['All', ...Object.values(TechniqueCategory)].slice(0, 5).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat as any)}
                          className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${
                            selectedCategory === cat 
                              ? 'bg-blue-600 text-white transform translate-y-[-2px] shadow-blue-500/20' 
                              : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {cat === 'All' ? 'Todas' : cat}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {filteredTechniques.map(tech => (
                     <div key={tech.id} className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-transparent hover:border-blue-500/20 transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-colors" />
                       
                       <div className="flex justify-between items-start mb-6">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                               <Book size={10} /> {tech.category}
                            </span>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic line-clamp-1">{tech.name}</h3>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md ${
                            tech.beltLevel === BeltColor.WHITE ? 'bg-slate-200 text-slate-700' : 
                            tech.beltLevel === BeltColor.BLUE ? 'bg-blue-600 text-white' :
                            tech.beltLevel === BeltColor.PURPLE ? 'bg-purple-600 text-white' :
                            'bg-slate-950 text-white'
                          }`}>
                             FAIXA {tech.beltLevel}
                          </div>
                       </div>
                       <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-bold mb-8 italic uppercase tracking-tight">"{tech.description}"</p>
                       
                       <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
                          <div className="flex gap-1.5">
                             {[1,2,3].map(s => <Star key={s} size={14} className="text-amber-500 fill-amber-500" />)}
                          </div>
                          <button className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2 group-hover:gap-4 transition-all">
                            DETALHES TÉCNICOS <PlayCircle size={18} />
                          </button>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
               <div className="bg-slate-950 dark:bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                  <div className="relative z-10 space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-2xl w-fit border border-white/10">
                           <Zap size={16} className="text-amber-400" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lesson Plans</span>
                        </div>
                        <button 
                          onClick={() => {
                            const title = prompt('Título do Plano de Aula:');
                            if(title) addLessonPlan({ title, date: new Date().toISOString().split('T')[0], techniques: [], notes: '', isPublished: true });
                          }}
                          className="p-3 bg-blue-600 rounded-xl hover:scale-110 transition-all shadow-lg shadow-blue-600/20"
                        >
                           <Plus size={20} />
                        </button>
                     </div>
                     
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                        {lessonPlans.length === 0 ? (
                           <div className="py-20 text-center opacity-30">
                              <BookOpen size={48} className="mx-auto mb-6" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum plano arquivado.</p>
                           </div>
                        ) : (
                          lessonPlans.map(plan => (
                            <div key={plan.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group flex flex-col justify-between h-40">
                               <div>
                                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 italic">{new Date(plan.date).toLocaleDateString()}</p>
                                  <h4 className="text-lg font-black uppercase tracking-tighter leading-tight">{plan.title}</h4>
                               </div>
                               <div className="flex items-center justify-between mt-6">
                                  <div className="flex items-center gap-2">
                                     <Layers size={14} className="text-slate-500" />
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{plan.techniques.length} Técnicas</span>
                                  </div>
                                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-all">
                                    <ChevronRight size={16} className="text-blue-400 group-hover:text-white" />
                                  </div>
                               </div>
                            </div>
                          ))
                        )}
                     </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-950 rounded-[3.5rem] p-10 border border-slate-200 dark:border-white/5 shadow-xl space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                        <Target size={28} className="text-rose-500" />
                        Monthly Focus
                     </h3>
                     <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping opacity-50" />
                  </div>
                  <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] space-y-6 relative overflow-hidden border border-slate-100 dark:border-white/5">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                           <Flame size={32} />
                        </div>
                        <div>
                           <h4 className="text-sm font-black uppercase tracking-tight italic">Guarda de Lapela</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enredamentos e Submissões</p>
                        </div>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed italic uppercase">
                       "Domínio total da distância e controle do adversário através do uso estratégico das lapelas."
                     </p>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span className="text-slate-400">Nível Crítico</span>
                           <span className="text-rose-500">78%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: '78%' }}
                             transition={{ duration: 1.5, ease: "easeOut" }}
                             className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" 
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      {isAddingSchedule && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] md:rounded-[4rem] p-8 sm:p-14 max-w-2xl w-full space-y-12 animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800 my-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                  {editingScheduleId ? 'Editar Horário' : 'Novo Horário'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 italic">Configuração de Sessão de Treinamento</p>
              </div>
              <button onClick={() => setIsAddingSchedule(false)} className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-red-600 transition-all active:scale-95 shadow-lg"><X size={28} /></button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                    <Clock size={14} className="text-blue-600" />
                    Horário de Início
                  </label>
                  <input 
                    type="time" 
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none dark:text-white font-black text-2xl transition-all shadow-inner tabular-nums"
                    value={scheduleFormData.time}
                    onChange={e => setScheduleFormData({...scheduleFormData, time: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                    <Filter size={14} className="text-blue-600" />
                    Categoria de Turma
                  </label>
                  <select 
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none dark:text-white font-black text-sm transition-all appearance-none shadow-inner"
                    value={scheduleFormData.category}
                    onChange={e => setScheduleFormData({...scheduleFormData, category: e.target.value})}
                  >
                    <option value={t('common.adult')}>{t('common.adult')}</option>
                    <option value={t('common.kid')}>{t('common.kid')}</option>
                    <option value={t('common.female')}>{t('common.female')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                  <Edit2 size={14} className="text-blue-600" />
                  Título da Turma
                </label>
                <input 
                  type="text" 
                  placeholder="EX: FUNDAMENTOS / AVANÇADO / NO GI"
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none dark:text-white font-black transition-all shadow-inner uppercase tracking-tight italic"
                  value={scheduleFormData.title}
                  onChange={e => setScheduleFormData({...scheduleFormData, title: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                  <User size={14} className="text-blue-600" />
                  Instrutor Responsável
                </label>
                <input 
                  type="text" 
                  placeholder="NOME DO PROFESSOR"
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none dark:text-white font-black transition-all shadow-inner uppercase tracking-tight"
                  value={scheduleFormData.instructor}
                  onChange={e => setScheduleFormData({...scheduleFormData, instructor: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              <div className="space-y-5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                  <Calendar size={14} className="text-blue-600" />
                  Dias da Semana Ativos
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleScheduleDay(day)}
                      className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                        scheduleFormData.days.includes(day)
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-4px]'
                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200 shadow-inner'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-6 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAddingSchedule(false)}
                  className="flex-1 py-6 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-slate-200 transition-all shadow-sm"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-6 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95"
                >
                  {editingScheduleId ? 'Salvar Matriz' : 'Publicar Horário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumHub;
