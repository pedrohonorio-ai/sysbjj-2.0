
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
  Shield
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { TechniqueCategory, LibraryTechnique, LessonPlan, BeltColor } from '../types';

const Curriculum: React.FC = () => {
  const { t } = useTranslation();
  const { lessonPlans, addLessonPlan, techniques, updateTechnique, addTechnique, deleteTechnique } = useData();
  const [activeTab, setActiveTab] = useState<'library' | 'planner'>('planner');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [selectedTech, setSelectedTech] = useState<LibraryTechnique | null>(null);
  const [editingTech, setEditingTech] = useState<LibraryTechnique | null>(null);
  const [isAddingTech, setIsAddingTech] = useState(false);
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
    addLessonPlan({
      title: currentPlan.title,
      techniques: currentPlan.techniques || [],
      ruleFocus: currentPlan.ruleFocus || '',
      date: currentPlan.date || new Date().toISOString().split('T')[0],
      notes: currentPlan.notes || '',
      isPublished: true
    });
    setIsPlanning(false);
    setCurrentPlan({ title: '', techniques: [], ruleFocus: '', date: new Date().toISOString().split('T')[0] });
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 w-full animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <BookOpenCheck size={24} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
              {t('curriculum.title')}
            </h1>
          </div>
          <p className="text-slate-500 font-medium italic pl-15">
            {t('curriculum.subtitle')}
          </p>
        </div>
        
        <div className="flex p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('planner')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'planner' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Calendar size={14} /> {t('curriculum.plannerTab')}
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <BookOpen size={14} /> {t('curriculum.libraryTab')}
          </button>
        </div>
      </div>

      {/* Technical Focus of the Week - Dynamic Element */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-600 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">{t('curriculum.techFocus')}</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Semana 14 • Abril</span>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Domínio de Meia Guarda & <br/>Passagens de Pressão</h2>
              <p className="text-slate-400 text-sm mt-4 max-w-xl leading-relaxed">
                Nesta semana, o foco técnico será o refinamento do controle de esgrima e a transição para o tripé. 
                Objetivo: Maximizar a pressão no ombro e isolar o quadril do oponente.
              </p>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] font-black">
                    {i === 1 ? 'W' : i === 2 ? 'B' : 'P'}
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('curriculum.plannedClasses')}: 12</p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'planner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <button 
              onClick={() => setIsPlanning(true)}
              className="w-full p-8 bg-blue-600 text-white rounded-[2.5rem] shadow-2xl shadow-blue-500/30 flex flex-col items-center justify-center gap-4 group hover:scale-[1.02] transition-all"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Plus size={32} />
              </div>
              <span className="font-black uppercase tracking-widest text-xs">{t('curriculum.newPlanBtn')}</span>
            </button>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('curriculum.recentPlans')}</h3>
              {lessonPlans.map(plan => (
                <div key={plan.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                  <div>
                    <p className="font-black dark:text-white uppercase tracking-tight">{plan.title}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">{plan.date} • {plan.techniques.length} {t('curriculum.techniques')}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {lessonPlans.length === 0 && <p className="text-center py-10 text-slate-400 italic text-sm">{t('curriculum.noPlans')}</p>}
            </div>
          </div>

          <div className="lg:col-span-8">
            {isPlanning ? (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8 sm:p-12 space-y-8 animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t('curriculum.newPlanTitle')}</h2>
                  <button onClick={() => setIsPlanning(false)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={24}/></button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('curriculum.lessonTitle')}</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Fundamentos de Passagem de Guarda"
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                      value={currentPlan.title}
                      onChange={e => setCurrentPlan({...currentPlan, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ibjjfRules.ruleFocus')}</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Posição de 4 apoios e pontuação"
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                      value={currentPlan.ruleFocus || ''}
                      onChange={e => setCurrentPlan({...currentPlan, ruleFocus: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                      {t('curriculum.timeline')} <span>{t('curriculum.timelineHint')}</span>
                    </label>
                    
                    <div className="space-y-4">
                      {currentPlan.techniques?.map((tech, idx) => (
                        <div key={tech.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm z-10 shadow-lg">
                              {idx + 1}
                            </div>
                            {idx < (currentPlan.techniques?.length || 0) - 1 && <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 my-1" />}
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div>
                              <p className="font-black text-sm dark:text-white uppercase">{tech.name}</p>
                              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{tech.category}</p>
                            </div>
                            <button 
                              onClick={() => setCurrentPlan(prev => ({
                                ...prev,
                                techniques: prev.techniques?.filter(t => t.id !== tech.id)
                              }))}
                              className="text-slate-300 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex gap-4">
                        <div className="w-10 h-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-300">
                          <Plus size={20} />
                        </div>
                        <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center text-slate-400 text-xs italic">
                          {t('curriculum.selectTechnique')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                     <button 
                      onClick={handleSavePlan}
                      disabled={!currentPlan.title}
                      className={`w-full rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all ${currentPlan.title ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      <CheckCircle2 size={20} /> {t('curriculum.saveBtn').toUpperCase()}
                    </button>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black dark:text-white uppercase mb-6">{t('curriculum.quickLibrary')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {techniques.map(tech => (
                      <button 
                        key={tech.id} 
                        onClick={() => handleAddToPlan(tech)}
                        className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-left hover:border-blue-500 transition-all flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-bold text-sm dark:text-white">{tech.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black">{tech.category}</p>
                        </div>
                        <Plus size={16} className="text-slate-300 group-hover:text-blue-500" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
                    <Layout size={40} />
                 </div>
                 <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">{t('curriculum.noActivePlan')}</h2>
                 <p className="text-sm text-slate-500 mt-2 max-w-xs">{t('curriculum.noActivePlanDesc')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
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
              <select className="bg-white dark:bg-slate-900 px-6 py-5 rounded-3xl border border-slate-200 dark:border-slate-700 outline-none text-xs font-black uppercase tracking-widest dark:text-white appearance-none min-w-[150px]">
                <option>{t('curriculum.allCategories')}</option>
                {Object.values(TechniqueCategory).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <button 
                onClick={() => setIsAddingTech(true)}
                className="bg-blue-600 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} /> {t('curriculum.newTechBtn')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLibrary.map(tech => (
              <div key={tech.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                   <PlayCircle size={48} className="text-white relative z-20 opacity-80 group-hover:scale-125 transition-all" />
                   <span className="absolute top-4 right-4 z-20 bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                     {tech.beltLevel} Level
                   </span>
                </div>
                <div className="p-8 space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{tech.category}</span>
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mt-1">{tech.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{tech.description}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenTechDetails(tech)}
                      className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {t('curriculum.viewDetails')} <ArrowRight size={14}/>
                    </button>
                    <button 
                      onClick={() => setEditingTech(tech)}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-amber-500 transition-all"
                    >
                      <Layout size={16} />
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedTech.category}</span>
                  <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight mt-1">{selectedTech.name}</h3>
                </div>
                <button onClick={() => setSelectedTech(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center relative overflow-hidden group shadow-inner">
                {selectedTech.videoUrl ? (
                  <iframe
                    src={getEmbedUrl(selectedTech.videoUrl) || ''}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedTech.name}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                    <PlayCircle size={64} className="text-white relative z-10 opacity-80 group-hover:scale-110 transition-transform" />
                    <p className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-black text-white uppercase tracking-widest z-10">Visualização de Técnica Indisponível</p>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                  {selectedTech.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Nível Sugerido</p>
                  <p className="text-xs font-bold dark:text-white">{selectedTech.beltLevel} Level</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                  <p className="text-[9px] font-black text-purple-600 uppercase mb-1">Tipo de Técnica</p>
                  <p className="text-xs font-bold dark:text-white">{selectedTech.category}</p>
                </div>
              </div>

              <button onClick={() => setSelectedTech(null)} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Technique Modal */}
      {(isAddingTech || editingTech) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">
                  {editingTech ? 'Editar Técnica' : 'Nova Técnica'}
                </h3>
                <button 
                  onClick={() => { setIsAddingTech(false); setEditingTech(null); }} 
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Técnica</label>
                  <input 
                    type="text"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                    value={editingTech ? editingTech.name : newTech.name}
                    onChange={e => editingTech ? setEditingTech({...editingTech, name: e.target.value}) : setNewTech({...newTech, name: e.target.value})}
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
                  <p className="text-[9px] text-slate-400 italic ml-1">Certifique-se de usar o link de 'incorporação' (embed) do YouTube.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea 
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold resize-none"
                    value={editingTech ? editingTech.description : newTech.description}
                    onChange={e => editingTech ? setEditingTech({...editingTech, description: e.target.value}) : setNewTech({...newTech, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                {editingTech && (
                  <button 
                    onClick={() => { deleteTechnique(editingTech.id); setEditingTech(null); }}
                    className="flex-1 py-5 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest"
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
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                >
                  {editingTech ? 'Salvar Alterações' : 'Criar Técnica'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Curriculum;
