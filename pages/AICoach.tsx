
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, Sparkles, Wand2, BrainCircuit, 
  MessageCircle, Loader2, RotateCcw, Users, 
  Camera, Upload, Zap, Info, ShieldCheck, Shield,
  BookOpen, Clock, Target, Search, Timer, ArrowRight
} from 'lucide-react';
import { 
  getAcademyInsights, 
  suggestSparringPairs, 
  analyzeDrillImage, 
  generateQuickLessonPlan,
  searchTechniqueInfo 
} from '../services/gemini';
import { AIMessage } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

const AICoach: React.FC = () => {
  const { t } = useTranslation();
  const { students, payments, schedules } = useData();
  const [activeTab, setActiveTab] = useState<'chat' | 'pairing' | 'drills' | 'planner' | 'tech'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sparringPairs, setSparringPairs] = useState<any[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plannerTheme, setPlannerTheme] = useState(t('aiCoach.defaultTheme'));
  const [plannerDuration, setPlannerDuration] = useState(60);
  const [plannerLevel, setPlannerLevel] = useState(t('aiCoach.defaultLevel'));

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ 
        role: 'assistant', 
        text: t('aiCoach.welcome'),
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isTyping) return;

    if (activeTab === 'tech') {
      await handleTechSearch(textToSend);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', text: textToSend, timestamp: Date.now() }]);
    setInput('');
    setIsTyping(true);

    try {
      const insights = await getAcademyInsights(students, payments, schedules);
      const coachAdvice = insights.coachAdvice || t('aiCoach.defaultCoachAdvice');
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: coachAdvice,
        timestamp: Date.now() 
      }]);
    } catch (error: any) {
      console.error('Insights Error:', error);
      const errorMsg = error?.message === "AI_KEY_NOT_CONFIGURED" 
        ? t('aiCoach.aiKeyError') 
        : t('aiCoach.error');
      setMessages(prev => [...prev, { role: 'assistant', text: errorMsg, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTechSearch = async (query: string) => {
    setMessages(prev => [...prev, { role: 'user', text: `${t('aiCoach.tech')}: ${query}`, timestamp: Date.now() }]);
    setInput('');
    setIsTyping(true);
    try {
      const result = await searchTechniqueInfo(query);
      setMessages(prev => [...prev, { role: 'assistant', text: result || '', timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreatePlan = async () => {
    setIsTyping(true);
    setGeneratedPlan(null);
    try {
      const plan = await generateQuickLessonPlan(plannerTheme, plannerDuration, plannerLevel);
      setGeneratedPlan(plan);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGeneratePairs = async () => {
    setIsTyping(true);
    try {
      const result = await suggestSparringPairs(students);
      setSparringPairs(result.pairs || []);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTyping(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const feedback = await analyzeDrillImage(base64, t('aiCoach.analyzePrompt'));
      setMessages(prev => [...prev, 
        { role: 'user', text: `[${t('aiCoach.visionImageLabel')}]`, timestamp: Date.now() },
        { role: 'assistant', text: feedback || '', timestamp: Date.now() }
      ]);
      setIsTyping(false);
      setActiveTab('chat');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Bot size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
                <Shield className="text-blue-600" size={18} /> {t('aiCoach.title')}
                <Sparkles className="text-amber-500" size={16} />
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('aiCoach.subtitle')}</p>
            </div>
          </div>
          <button onClick={() => {setMessages([]); setGeneratedPlan(null);}} className="p-2 text-slate-400 hover:text-blue-600"><RotateCcw size={20}/></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <MessageCircle size={16}/> {t('aiCoach.insights')}
          </button>
          <button 
            onClick={() => setActiveTab('tech')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tech' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Search size={16}/> {t('aiCoach.tech')}
          </button>
          <button 
            onClick={() => setActiveTab('planner')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'planner' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <BookOpen size={16}/> {t('aiCoach.planner')}
          </button>
          <button 
            onClick={() => setActiveTab('pairing')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pairing' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Users size={16}/> {t('aiCoach.sparring')}
          </button>
          <button 
            onClick={() => setActiveTab('drills')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'drills' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Camera size={16}/> {t('aiCoach.vision')}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {(activeTab === 'chat' || activeTab === 'tech') && (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                  <div className={`max-w-[85%] p-5 rounded-[2rem] ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700 shadow-sm'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'planner' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-black uppercase tracking-tighter dark:text-white mb-6">{t('aiCoach.plannerTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('aiCoach.theme')}</label>
                    <input 
                      type="text" 
                      value={plannerTheme} 
                      onChange={e => setPlannerTheme(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold dark:text-white" 
                      placeholder="Ex: Passagem de Meia-Guarda"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('aiCoach.duration')}</label>
                    <select 
                      value={plannerDuration}
                      onChange={e => setPlannerDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value={60}>{t('aiCoach.oneHour')}</option>
                      <option value={90}>{t('aiCoach.oneHalfHour')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('aiCoach.level')}</label>
                    <select 
                      value={plannerLevel}
                      onChange={e => setPlannerLevel(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Iniciante">{t('aiCoach.beginnerLevel')}</option>
                      <option value="Intermediário">{t('aiCoach.intermediateLevel')}</option>
                      <option value="Avançado">{t('aiCoach.advancedLevel')}</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleCreatePlan}
                  className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                >
                  <Wand2 size={18}/> {t('aiCoach.generateBtn')}
                </button>
              </div>

              {generatedPlan && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-blue-100 dark:border-blue-900/30 shadow-2xl space-y-8 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tighter leading-none">{generatedPlan.title}</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t('aiCoach.structuredPlan')}</p>
                    </div>
                    <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Timer size={16} /> {plannerDuration} MIN
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Bloco 1: Aquecimento */}
                    <div className="relative pl-8 border-l-2 border-blue-600/20">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-slate-800" />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                          <Zap size={14}/> {t('aiCoach.warmupTitle')}
                        </span>
                        <span className="text-xs font-black dark:text-white">{generatedPlan.warmup?.duration || (plannerDuration === 60 ? 10 : 15)} min</span>
                      </div>
                      <p className="text-sm dark:text-slate-300 font-medium leading-relaxed">{generatedPlan.warmup?.description}</p>
                    </div>

                    {/* Bloco 2: Técnica */}
                    <div className="relative pl-8 border-l-2 border-blue-600/20">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-slate-800" />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                          <Target size={14}/> {t('aiCoach.techniqueTitle')}
                        </span>
                        <span className="text-xs font-black dark:text-white">{generatedPlan.technique?.duration || (plannerDuration === 60 ? 25 : 40)} min</span>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-sm dark:text-white font-bold leading-relaxed">{generatedPlan.technique?.description}</p>
                      </div>
                    </div>

                    {/* Bloco 3: Treinamento Controlado */}
                    <div className="relative pl-8 border-l-2 border-blue-600/20">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-slate-800" />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                          <Users size={14}/> {t('aiCoach.sparringTitle')}
                        </span>
                        <span className="text-xs font-black dark:text-white">{generatedPlan.sparring?.duration || (plannerDuration === 60 ? 25 : 35)} min</span>
                      </div>
                      <p className="text-sm dark:text-slate-300 font-medium italic leading-relaxed">{generatedPlan.sparring?.description}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                      <p className="text-[9px] font-black text-amber-600 uppercase mb-2 flex items-center gap-2"><Info size={12}/> {t('aiCoach.focusPoints')}</p>
                      <p className="text-[11px] dark:text-amber-200 font-bold">{generatedPlan.focusPoints}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pairing' && (
            <div className="space-y-6 animate-in zoom-in-95">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                <h4 className="font-black text-blue-600 uppercase text-xs mb-2">{t('aiCoach.pairingTitle')}</h4>
                <p className="text-xs text-slate-500">{t('aiCoach.pairingSubtitle')}</p>
                <button 
                  onClick={handleGeneratePairs}
                  className="mt-4 w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                >
                  <Wand2 size={16}/> {t('aiCoach.generatePairsBtn')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sparringPairs.map((pair, idx) => (
                  <div key={idx} className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase">{t('aiCoach.pairLabel')} #{idx+1}</span>
                       <Zap size={14} className="text-amber-500" />
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center font-bold text-sm">{pair.p1}</div>
                       <div className="text-slate-300 font-black italic">VS</div>
                       <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center font-bold text-sm">{pair.p2}</div>
                    </div>
                    <p className="text-[9px] text-slate-400 italic text-center px-4">{pair.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'drills' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-8 animate-in slide-in-from-bottom-4">
              <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] flex items-center justify-center text-blue-600">
                <Camera size={48} />
              </div>
              <div>
                <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">{t('aiCoach.visionTitle')}</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">{t('aiCoach.visionSubtitle')}</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3"
              >
                <Upload size={20}/> {t('aiCoach.uploadBtn')}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-[2rem] rounded-bl-none border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('aiCoach.processing')}</span>
              </div>
            </div>
          )}
        </div>

        {(activeTab === 'chat' || activeTab === 'tech') && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
              <input
                type="text"
                placeholder={activeTab === 'tech' ? t('aiCoach.techPlaceholder') : t('aiCoach.placeholder')}
                className="flex-1 px-4 py-2 bg-transparent outline-none text-sm dark:text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {(activeTab === 'chat' || activeTab === 'tech') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
          <button onClick={() => handleSend(t('aiCoach.academyInsights'))} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 group-hover:scale-110 transition-transform"><Info size={18} /></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('aiCoach.academyInsights')}</span>
          </button>
          <button onClick={() => { setActiveTab('tech'); setInput(t('aiCoach.throwsConsult')); }} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 group-hover:scale-110 transition-transform"><BrainCircuit size={18} /></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('aiCoach.throwsConsult')}</span>
          </button>
          <button onClick={() => { setActiveTab('planner'); }} className="hidden lg:flex p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 group-hover:scale-110 transition-transform"><BookOpen size={18} /></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('aiCoach.expressPlanner')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AICoach;
