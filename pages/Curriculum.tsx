
import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  BookOpenCheck,
  Plus, 
  Search, 
  PlayCircle, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  Layout, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Target,
  Sparkles,
  Trophy,
  Filter,
  History,
  ScrollText,
  X,
  ExternalLink,
  Shield,
  Edit3,
  Dumbbell,
  Sword,
  Users,
  Save,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { TechniqueCategory, LibraryTechnique, LessonPlan, BeltColor } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import * as Icons from 'lucide-react';

const Curriculum: React.FC = () => {
  const { t } = useTranslation();
  const { lessonPlans, addLessonPlan, updateLessonPlan, deleteLessonPlan, techniques, updateTechnique, addTechnique, deleteTechnique } = useData();
  const { profile, updateProfile } = useProfile();
  
  const [activeTab, setActiveTab] = useState<'library' | 'planner'>('planner');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  
  const [selectedTech, setSelectedTech] = useState<LibraryTechnique | null>(null);
  const [editingTech, setEditingTech] = useState<LibraryTechnique | null>(null);
  const [isAddingTech, setIsAddingTech] = useState(false);
  
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [focusData, setFocusData] = useState({
    title: profile.technicalFocus || '',
    description: profile.technicalFocusDescription || ''
  });

  const [newTech, setNewTech] = useState<Omit<LibraryTechnique, 'id'>>({
    name: '',
    category: TechniqueCategory.SUBMISSIONS,
    description: '',
    beltLevel: BeltColor.WHITE,
    videoUrl: ''
  });

  const [currentPlan, setCurrentPlan] = useState<Partial<LessonPlan>>({
    title: '',
    techniques: [],
    ruleFocus: '',
    warmup: '',
    specificTraining: '',
    sparring: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredLibrary = useMemo(() => {
    return techniques.filter(tech => 
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, techniques]);

  const handleAddToPlan = (tech: LibraryTechnique) => {
    if (currentPlan.techniques?.find(t => t.id === tech.id)) return;
    setCurrentPlan(prev => ({
      ...prev,
      techniques: [...(prev.techniques || []), tech]
    }));
  };

  const handleSavePlan = () => {
    if (!currentPlan.title) return;
    
    const planData: Omit<LessonPlan, 'id'> = {
      title: currentPlan.title,
      techniques: currentPlan.techniques || [],
      ruleFocus: currentPlan.ruleFocus || '',
      warmup: currentPlan.warmup || '',
      specificTraining: currentPlan.specificTraining || '',
      sparring: currentPlan.sparring || '',
      date: currentPlan.date || new Date().toISOString().split('T')[0],
      notes: currentPlan.notes || '',
      isPublished: true
    };

    if (editingPlanId) {
      updateLessonPlan(editingPlanId, planData);
    } else {
      addLessonPlan(planData);
    }

    setIsPlanning(false);
    setEditingPlanId(null);
    setCurrentPlan({ title: '', techniques: [], ruleFocus: '', warmup: '', specificTraining: '', sparring: '', notes: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleEditPlan = (plan: LessonPlan) => {
    setCurrentPlan(plan);
    setEditingPlanId(plan.id);
    setIsPlanning(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicatePlan = (plan: LessonPlan) => {
    const duplicatedPlan: Omit<LessonPlan, 'id'> = {
      ...plan,
      title: `${plan.title} (Cópia)`,
      date: new Date().toISOString().split('T')[0]
    };
    addLessonPlan(duplicatedPlan);
  };

  const handlePrintPlan = (plan: LessonPlan) => {
    window.print();
  };

  const handleDeletePlan = (id: string) => {
    if (window.confirm(t('common.confirmDelete') || 'Tem certeza que deseja excluir este plano?')) {
      deleteLessonPlan(id);
      if (editingPlanId === id) {
        setIsPlanning(false);
        setEditingPlanId(null);
      }
    }
  };

  const handleSaveFocus = () => {
    updateProfile({
      technicalFocus: focusData.title,
      technicalFocusDescription: focusData.description
    });
    setIsEditingFocus(false);
  };

  const handleOpenTechDetails = (tech: LibraryTechnique) => {
    setSelectedTech(tech);
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtube.com/v/')) {
      videoId = url.split('youtube.com/v/')[1].split(/[?#]/)[0];
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 w-full animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <BookOpenCheck size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
              {t('curriculum.title')}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic md:pl-15 text-sm md:text-base">
            {t('curriculum.subtitle')}
          </p>
        </div>
        
        <div className="flex p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
          <button 
            onClick={() => setActiveTab('planner')}
            className={`px-4 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'planner' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Calendar size={14} /> {t('curriculum.plannerTab')}
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-4 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <BookOpen size={14} /> {t('curriculum.libraryTab')}
          </button>
        </div>
      </div>

      {/* Technical Focus Section */}
      <div className="px-4 sm:px-0">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-600 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">{t('curriculum.techFocus')}</span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  {new Date().toLocaleDateString(t('common.dateLocale'), { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {!isEditingFocus ? (
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-tight max-w-2xl">
                    {profile.technicalFocus || 'Defina o Foco Técnico da Academia'}
                  </h2>
                  <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed italic">
                    {profile.technicalFocusDescription || 'Clique em editar para descrever os objetivos técnicos desta semana/mês para todos os alunos.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-left-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.title')}</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white font-black uppercase tracking-tight focus:ring-2 focus:ring-blue-600 outline-none"
                      value={focusData.title}
                      onChange={e => setFocusData({...focusData, title: e.target.value})}
                      placeholder="Ex: Domínio de Meia Guarda"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.description')}</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white font-medium text-sm focus:ring-2 focus:ring-blue-600 outline-none h-24 resize-none"
                      value={focusData.description}
                      onChange={e => setFocusData({...focusData, description: e.target.value})}
                      placeholder="Descreva os objetivos técnicos..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-end gap-4 min-w-[200px]">
              {!isEditingFocus ? (
                <button 
                  onClick={() => setIsEditingFocus(true)}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                >
                  <Edit3 size={16} /> {t('common.edit')}
                </button>
              ) : (
                <div className="flex gap-3">
                   <button 
                    onClick={() => setIsEditingFocus(false)}
                    className="flex-1 px-4 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    onClick={handleSaveFocus}
                    className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {t('common.save')}
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <div className="flex -space-x-3">
                  {['W', 'B', 'P', 'Br', 'Bl'].map((belt, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] font-black shadow-lg">
                      {belt}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('curriculum.plannedClasses')}: {lessonPlans.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'planner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0">
          <div className="lg:col-span-4 space-y-6">
            <button 
              onClick={() => {
                setIsPlanning(true);
                setEditingPlanId(null);
                setCurrentPlan({ 
                  title: '', 
                  techniques: [], 
                  ruleFocus: '', 
                  warmup: '', 
                  specificTraining: '', 
                  sparring: '', 
                  notes: '', 
                  date: new Date().toISOString().split('T')[0] 
                });
              }}
              className="w-full p-8 bg-blue-600 text-white rounded-[2.5rem] shadow-2xl shadow-blue-500/30 flex flex-col items-center justify-center gap-4 group hover:scale-[1.02] transition-all"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Plus size={32} />
              </div>
              <span className="font-black uppercase tracking-widest text-xs">Novo Quadro de Trabalho (QTD)</span>
            </button>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('curriculum.recentPlans')}</h3>
              <div className="space-y-3">
                {lessonPlans.map(plan => (
                  <div 
                    key={plan.id} 
                    onClick={() => handleEditPlan(plan)}
                    className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between ${editingPlanId === plan.id ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-xl' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-300'}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={10} className="text-blue-500" />
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                          {new Date(plan.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-black dark:text-white uppercase tracking-tight truncate text-sm">{plan.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">
                          {plan.techniques.length} Técnicas
                        </span>
                        {plan.ruleFocus && (
                           <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">
                             + Regras
                           </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDuplicatePlan(plan); }}
                        title="Duplicar Plano"
                        className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                      >
                        <Icons.Copy size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {lessonPlans.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 italic text-sm">{t('curriculum.noPlans')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {isPlanning ? (
                <motion.div 
                  key="editor"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8 sm:p-12 space-y-10"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                         {editingPlanId ? <Edit3 size={24} /> : <Plus size={24} />}
                       </div>
                       <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">
                         {editingPlanId ? 'Editar Quadro de Trabalho' : 'Novo Quadro de Trabalho (QTD)'}
                       </h2>
                    </div>
                    <button onClick={() => { setIsPlanning(false); setEditingPlanId(null); }} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
                      <X size={24}/>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('curriculum.lessonTitle')}</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Fundamentos de Passagem de Guarda"
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold transition-all"
                          value={currentPlan.title}
                          onChange={e => setCurrentPlan({...currentPlan, title: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ibjjfRules.ruleFocus')}</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Posição de 4 apoios e pontuação"
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold transition-all"
                          value={currentPlan.ruleFocus || ''}
                          onChange={e => setCurrentPlan({...currentPlan, ruleFocus: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Dumbbell size={12} className="text-blue-500" /> Aquecimento
                        </label>
                        <textarea 
                          rows={2}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold resize-none transition-all"
                          placeholder="Descreva o aquecimento (ex: Drills, Abdominais...)"
                          value={currentPlan.warmup || ''}
                          onChange={e => setCurrentPlan({...currentPlan, warmup: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Target size={12} className="text-blue-500" /> {t('common.date')}
                        </label>
                        <input 
                          type="date"
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold transition-all"
                          value={currentPlan.date}
                          onChange={e => setCurrentPlan({...currentPlan, date: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Sword size={12} className="text-blue-500" /> Especial / Específico
                        </label>
                        <textarea 
                          rows={2}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold resize-none transition-all"
                          placeholder="Drills específicos de situação..."
                          value={currentPlan.specificTraining || ''}
                          onChange={e => setCurrentPlan({...currentPlan, specificTraining: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Users size={12} className="text-blue-500" /> Rola / Sparring
                        </label>
                        <textarea 
                          rows={2}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold resize-none transition-all"
                          placeholder="Configuração dos rolas (ex: 5x5 min)..."
                          value={currentPlan.sparring || ''}
                          onChange={e => setCurrentPlan({...currentPlan, sparring: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                       <span className="flex items-center gap-2"><Layout size={14} className="text-blue-600" /> {t('curriculum.timeline')}</span>
                       <span className="text-[9px] opacity-60">ADICIONE DA BIBLIOTECA ABAIXO</span>
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentPlan.techniques?.map((tech, idx) => (
                        <motion.div 
                          key={tech.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-4 group"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm z-10 shadow-lg group-hover:scale-110 transition-transform">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:border-blue-500 transition-all shadow-sm">
                            <div className="min-w-0">
                              <p className="font-black text-sm dark:text-white uppercase truncate">{tech.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${tech.beltLevel === BeltColor.WHITE ? 'bg-slate-200' : 'bg-blue-600'}`} />
                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest truncate">{tech.category}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setCurrentPlan(prev => ({
                                ...prev,
                                techniques: prev.techniques?.filter(t => t.id !== tech.id)
                              }))}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      
                      {(!currentPlan.techniques || currentPlan.techniques.length === 0) && (
                        <div className="md:col-span-2 py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                          <BookOpen size={40} className="opacity-20 mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest">{t('curriculum.selectTechnique')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xs font-black dark:text-white uppercase tracking-widest flex items-center gap-3">
                         <span className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center"><Zap size={16} /></span>
                         {t('curriculum.quickLibrary')}
                       </h3>
                       <div className="relative w-48">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="text"
                           placeholder="Filtrar técnica..."
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] outline-none font-bold"
                         />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {techniques.slice(0, 6).map(tech => (
                        <button 
                          key={tech.id} 
                          onClick={() => handleAddToPlan(tech)}
                          className={`p-4 rounded-2xl text-left border transition-all flex justify-between items-center group relative overflow-hidden ${currentPlan.techniques?.find(t => t.id === tech.id) ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5'}`}
                        >
                          <div className="relative z-10 min-w-0">
                            <p className="font-bold text-xs dark:text-white truncate">{tech.name}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">{tech.category}</p>
                          </div>
                          {currentPlan.techniques?.find(t => t.id === tech.id) ? (
                            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                          ) : (
                            <Plus size={16} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
                          )}
                        </button>
                      ))}
                      <div 
                        onClick={() => setActiveTab('library')}
                        className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all cursor-pointer group"
                      >
                         <p className="text-[9px] font-black uppercase tracking-widest group-hover:scale-110 transition-transform">Ver Biblioteca Completa</p>
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 pt-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => { setIsPlanning(false); setEditingPlanId(null); }}
                        className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        {t('common.cancel')}
                      </button>
                      <button 
                        onClick={handleSavePlan}
                        disabled={!currentPlan.title}
                        className={`flex-[2] py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all ${currentPlan.title ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 active:scale-95 shadow-blue-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        <Save size={20} /> {editingPlanId ? 'ATUALIZAR QTD' : 'SALVAR QUADRO DO DIA (OSS)'}
                      </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 min-h-[400px]"
                >
                   <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-8 shadow-inner">
                      <Layout size={48} />
                   </div>
                   <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Gestão do Quadro do Dia (QTD)</h2>
                   <p className="text-slate-500 mt-4 max-w-xs leading-relaxed italic text-sm">
                     Selecione um plano à esquerda para visualizar e editar, ou clique no botão azul para criar um novo planejamento técnico para sua academia.
                   </p>
                   <div className="mt-10 flex gap-4">
                     <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 rounded-full border border-blue-600/20 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                       <CheckCircle2 size={12} /> Digital Sensei Ready
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 px-4 sm:px-0">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={20} />
              <input 
                type="text" 
                placeholder={t('curriculum.searchPlaceholder')} 
                className="w-full pl-14 pr-8 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none shadow-xl dark:text-white font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select className="bg-white dark:bg-slate-900 px-6 py-5 rounded-3xl border border-slate-200 dark:border-slate-700 outline-none text-[10px] font-black uppercase tracking-widest dark:text-white appearance-none min-w-[180px] shadow-sm">
                <option>{t('curriculum.allCategories')}</option>
                {Object.values(TechniqueCategory).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <button 
                onClick={() => setIsAddingTech(true)}
                className="bg-blue-600 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={16} /> {t('curriculum.newTechBtn')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLibrary.map(tech => (
              <div key={tech.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                   <PlayCircle size={56} className="text-white relative z-20 opacity-80 group-hover:scale-125 transition-all drop-shadow-2xl" />
                   <div className="absolute top-5 right-5 z-20 flex flex-col items-end gap-2 text-right">
                    <span className="bg-blue-600 text-white p-2 rounded-lg shadow-lg">
                      <Layout size={12} />
                    </span>
                   </div>
                   <div className="absolute bottom-5 left-5 z-20">
                    <span className="px-3 py-1 bg-white dark:bg-slate-900 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest dark:text-white border border-white/20">
                      {tech.beltLevel} Level
                    </span>
                   </div>
                </div>
                <div className="p-8 space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{tech.category}</span>
                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter mt-2">{tech.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 italic font-medium">{tech.description}</p>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => handleOpenTechDetails(tech)}
                      className="flex-[3] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      {t('curriculum.viewDetails')} <ExternalLink size={14}/>
                    </button>
                    <button 
                      onClick={() => setEditingTech(tech)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-amber-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technique Detail Modal */}
      {selectedTech && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-[0_0_50px_-12px_rgba(37,99,235,0.25)] overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide border border-slate-100 dark:border-slate-800"
          >
            <div className="p-10 md:p-14 space-y-10">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-8">
                <div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{selectedTech.category}</span>
                  <h3 className="text-3xl lg:text-4xl font-black dark:text-white uppercase tracking-tighter mt-4 leading-none">{selectedTech.name}</h3>
                </div>
                <button onClick={() => setSelectedTech(null)} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all rounded-2xl">
                  <X size={24} />
                </button>
              </div>

              <div className="aspect-video bg-slate-900 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group shadow-2xl border-4 border-slate-50 dark:border-slate-800">
                {selectedTech.videoUrl ? (
                  <iframe
                    src={getEmbedUrl(selectedTech.videoUrl) || ''}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedTech.name}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-6 italic">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-600 relative overflow-hidden">
                       <PlayCircle size={48} className="relative z-10" />
                       <div className="absolute inset-0 bg-blue-600/5 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Treinamento Presencial Exigido</p>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="prose dark:prose-invert max-w-none">
                   <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <MessageSquare size={14} /> Detalhamento Técnico
                   </h4>
                   <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 italic font-medium">
                     {selectedTech.description}
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[1.75rem] border border-blue-100 dark:border-blue-900/30 flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Nível Sugerido</p>
                    <p className="text-sm font-black dark:text-white uppercase tracking-tight">{selectedTech.beltLevel} Level</p>
                  </div>
                </div>
                <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-[1.75rem] border border-purple-100 dark:border-purple-900/30 flex items-center gap-5">
                   <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-purple-600 uppercase mb-1">Tipo de Técnica</p>
                    <p className="text-sm font-black dark:text-white uppercase tracking-tight">{selectedTech.category}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTech(null)} 
                className="w-full py-6 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Concluir Estudo (OSS)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Technique Modal */}
      {(isAddingTech || editingTech) && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide border border-slate-100 dark:border-slate-800"
          >
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">
                  {editingTech ? 'Refinar Técnica' : 'Cadastrar Técnica'}
                </h3>
                <button 
                  onClick={() => { setIsAddingTech(false); setEditingTech(null); }} 
                  className="p-3 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Técnica</label>
                  <input 
                    type="text"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                    value={editingTech ? editingTech.name : newTech.name}
                    onChange={e => editingTech ? setEditingTech({...editingTech, name: e.target.value}) : setNewTech({...newTech, name: e.target.value})}
                    placeholder="Ex: Armlock da Guarda"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                      value={editingTech ? editingTech.category : newTech.category}
                      onChange={e => editingTech ? setEditingTech({...editingTech, category: e.target.value as TechniqueCategory}) : setNewTech({...newTech, category: e.target.value as TechniqueCategory})}
                    >
                      {Object.values(TechniqueCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Faixa</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                      value={editingTech ? editingTech.beltLevel : newTech.beltLevel}
                      onChange={e => editingTech ? setEditingTech({...editingTech, beltLevel: e.target.value as BeltColor}) : setNewTech({...newTech, beltLevel: e.target.value as BeltColor})}
                    >
                      {Object.values(BeltColor).map(belt => <option key={belt} value={belt}>{belt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link do Vídeo (YouTube Embed)</label>
                  <input 
                    type="text"
                    placeholder="Ex: https://www.youtube.com/embed/..."
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                    value={editingTech ? editingTech.videoUrl : newTech.videoUrl}
                    onChange={e => editingTech ? setEditingTech({...editingTech, videoUrl: e.target.value}) : setNewTech({...newTech, videoUrl: e.target.value})}
                  />
                  <p className="text-[9px] text-slate-400 italic ml-1">Link de 'incorporação' ou URL padrão do YouTube.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea 
                    rows={4}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold resize-none"
                    value={editingTech ? editingTech.description : newTech.description}
                    onChange={e => editingTech ? setEditingTech({...editingTech, description: e.target.value}) : setNewTech({...newTech, description: e.target.value})}
                    placeholder="Descreva os detalhes da técnica..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                {editingTech && (
                  <button 
                    onClick={() => { if(window.confirm('Excluir técnica?')) { deleteTechnique(editingTech.id); setEditingTech(null); } }}
                    className="flex-1 py-5 bg-red-500/10 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all"
                  >
                    Excluir
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (editingTech) {
                      updateTechnique(editingTech.id, editingTech);
                      setEditingTech(null);
                    } else {
                      addTechnique(newTech);
                      setIsAddingTech(false);
                      setNewTech({ name: '', category: TechniqueCategory.SUBMISSIONS, description: '', beltLevel: BeltColor.WHITE, videoUrl: '' });
                    }
                  }}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {editingTech ? 'Atualizar Técnica' : 'Validar Técnica (OSS)'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Curriculum;
