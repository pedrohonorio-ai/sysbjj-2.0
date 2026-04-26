
import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Shield, 
  Clock, 
  GraduationCap, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare,
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  Scale,
  X,
  Trophy,
  Users,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { GoogleGenAI } from "@google/genai";
import { IBJJF_LESSONS } from '../constants/rulesData';
import ReactMarkdown from 'react-markdown';
import * as Icons from 'lucide-react';

const IBJJFRules: React.FC = () => {
  const { t, tObj } = useTranslation();
  const { profile } = useProfile();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
        setMessages(prev => [...prev, { role: 'bot', text: t('ibjjfRules.aiKeyError') }]);
        setIsLoading(false);
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: t('ibjjfRules.aiSystemInstruction')
        }
      });

      setMessages(prev => [...prev, { role: 'bot', text: response.text || t('ibjjfRules.errorProcess') }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: t('ibjjfRules.errorAI') }]);
    } finally {
      setIsLoading(false);
    }
  };

  const adultRules = tObj('ibjjfRules.adultRules') || [];
  const prohibitedTechniques = tObj('ibjjfRules.prohibitions') || [];
  const ruleCases = tObj('ibjjfRules.cases') || [];
  const [activeSimulado, setActiveSimulado] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const simulados = tObj('ibjjfRules.simulados') || [];

  const handleAnswer = (idx: number) => {
    const currentSim = simulados.find(s => s.id === activeSimulado);
    if (idx === currentSim?.questions[currentQuestion].correct) {
      setScore(prev => prev + 1);
    }

    if (currentQuestion + 1 < (currentSim?.questions.length || 0)) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const startSimulado = (id: number) => {
    setActiveSimulado(id);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24 px-4 sm:px-0">
      {/* Simulado Modal */}
      {activeSimulado && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{t('ibjjfRules.simulatedPrep')}</p>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{simulados.find(s => s.id === activeSimulado)?.title}</h3>
              </div>
              <button onClick={() => setActiveSimulado(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-10">
              {!showResult ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t('ibjjfRules.questionOf', { current: currentQuestion + 1, total: simulados.find(s => s.id === activeSimulado)?.questions.length })}
                    </span>
                    <div className="h-1 flex-1 mx-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-500" 
                        style={{ width: `${((currentQuestion + 1) / (simulados.find(s => s.id === activeSimulado)?.questions.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {simulados.find(s => s.id === activeSimulado)?.questions[currentQuestion].q}
                  </h4>

                  <div className="space-y-3">
                    {simulados.find(s => s.id === activeSimulado)?.questions[currentQuestion].options.map((opt, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className="w-full p-5 text-left bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group flex items-center justify-between"
                      >
                        <span className="dark:text-slate-200">{opt}</span>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-8 py-10">
                  <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Trophy size={48} />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.finalResult')}</h4>
                    <p className="text-slate-500 font-medium mt-2">
                      {t('ibjjfRules.correctCount', { score, total: simulados.find(s => s.id === activeSimulado)?.questions.length })}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => startSimulado(activeSimulado)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                    >
                      {t('ibjjfRules.redo')}
                    </button>
                    <button 
                      onClick={() => setActiveSimulado(null)}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-xl transition-all"
                    >
                      {t('ibjjfRules.complete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent blur-3xl opacity-50 rounded-[4rem]" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                <Scale size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('ibjjfRules.officialRegulation')}</span>
            </div>
            <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
              {t('ibjjfRules.title')}
            </h1>
            <p className="text-slate-500 font-medium italic text-lg leading-relaxed">
              {t('ibjjfRules.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <a 
              href="https://cbjj.com.br/rules" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-10 py-6 rounded-3xl flex items-center gap-4 shadow-2xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all font-black text-xs uppercase tracking-widest group"
            >
              <BookOpen size={20} className="group-hover:rotate-12 transition-transform" />
              {t('ibjjfRules.rulesPdf')}
              <ArrowRight size={16} className="opacity-50" />
            </a>
          </div>
        </div>
      </div>

      {/* Internal Rules Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
          <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-lg border border-slate-100 dark:border-slate-700">
                <Shield size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{profile.academyName}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">{t('ibjjfRules.internalRules')}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-full border border-blue-600/20 text-[9px] font-black uppercase tracking-widest">
              <CheckCircle2 size={12} /> {t('ibjjfRules.verifiedSystem')}
            </div>
          </div>
          <div className="p-12 prose dark:prose-invert max-w-none prose-slate prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-black prose-p:font-medium prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-li:font-medium">
            <ReactMarkdown>{profile.graduationRules || t('ibjjfRules.noInternalRules')}</ReactMarkdown>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col justify-between group shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <Clock size={32} className="text-blue-400" />
            </div>
            <div className="space-y-4">
              <h4 className="text-3xl font-black uppercase tracking-tighter leading-none">{t('ibjjfRules.ageCalcTitle')}</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {t('ibjjfRules.ageCalcDesc')}
              </p>
            </div>
          </div>
          <div className="relative z-10 pt-10 border-t border-white/5 mt-10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">{t('ibjjfRules.currentPeriod')}</p>
            <p className="text-3xl font-black tabular-nums">{new Date().getFullYear()}</p>
          </div>
        </div>
      </div>

      {/* Rules Academy Hub */}
      <div className="space-y-10 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.rulesAcademyTitle')}</h2>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[8px] font-black tracking-widest uppercase">Mastery Course</span>
            </div>
            <p className="text-slate-500 font-medium italic text-lg">{t('ibjjfRules.rulesAcademySmallDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {IBJJF_LESSONS.map((lesson, idx) => {
            const IconComponent = (Icons as any)[lesson.icon] || Icons.BookOpen;
            // First item as a "featured" larger card in the grid
            const isFeatured = idx === 0;
            return (
              <div 
                key={lesson.id} 
                className={`${isFeatured ? 'md:col-span-2 md:row-span-2' : ''} bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 p-8 flex flex-col justify-between hover:border-blue-600 transition-all group relative overflow-hidden group shadow-sm hover:shadow-2xl`}
              >
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`${isFeatured ? 'w-16 h-16 bg-blue-600 text-white' : 'w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600'} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}>
                      <IconComponent size={isFeatured ? 32 : 24} />
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LEV 0{idx + 1}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-600/10 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-600/10">
                        {t(`portal.categories.${lesson.category.toLowerCase()}`)}
                      </span>
                    </div>
                    <h3 className={`${isFeatured ? 'text-3xl' : 'text-xl'} font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none`}>
                      {lesson.title}
                    </h3>
                    <p className={`${isFeatured ? 'text-sm' : 'text-[11px]'} text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic`}>
                      {lesson.content}
                    </p>
                  </div>
                </div>
                <div className="relative z-10 pt-8 mt-auto group-hover:translate-x-2 transition-transform">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 border border-slate-100 dark:border-zinc-700">
                    <ArrowRight size={18} />
                  </div>
                </div>
                {isFeatured && (
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Case Studies Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Scale size={24} className="text-blue-600" />
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tactical Scenarios</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ruleCases.map((c, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group border-b-4 border-b-blue-600">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Icons.Zap size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{c.penalty}</span>
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3 leading-tight">{c.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed italic line-clamp-3">{c.scenario}</p>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:border-blue-600/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-1 bg-blue-600 rounded-full" />
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{t('ibjjfRules.officialRule')}</p>
                </div>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-snug">{c.rule}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left Column: Graduation System */}
        <div className="xl:col-span-2 space-y-12">
          {/* Prohibitions Grid - Redesigned as focused modules */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/20">
                <AlertTriangle size={28} />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.prohibitedTechniques')}</h2>
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">Restricted Actions & Penalties</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {prohibitedTechniques.map((cat) => (
                <div key={cat.category} className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img 
                      src={cat.image} 
                      alt={cat.category} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    <div className="absolute bottom-6 left-8">
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-white rounded-full px-3 py-1 mb-2 inline-block">Prohibited</span>
                      <h4 className="text-xl font-black text-white uppercase tracking-tighter">{cat.category}</h4>
                    </div>
                  </div>
                  <div className="p-10">
                    <ul className="space-y-4">
                      {cat.items.map(item => (
                        <li key={item} className="flex items-start gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 group/item">
                          <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30 group-hover/item:scale-110 transition-transform">
                            <X size={12} />
                          </div>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graduation Matrix */}
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden">
            <div className="p-10 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('ibjjfRules.adultSystem')}</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2">Professional Grading Guidelines</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-800/40">
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">Belt Rank</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800 text-center">Minimum Time</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">Requirements & Mastery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                  {adultRules.map((rule) => (
                    <tr key={rule.belt} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-4 rounded-sm shadow-sm border ${
                            rule.belt === 'White' ? 'bg-white border-slate-200' : 
                            rule.belt === 'Blue' ? 'bg-blue-600 border-blue-700' : 
                            rule.belt === 'Purple' ? 'bg-purple-700 border-purple-800' : 
                            rule.belt === 'Brown' ? 'bg-amber-900 border-amber-950' : 
                            'bg-slate-900 border-slate-800'
                          }`} />
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">{t(`belts.${rule.belt}`)}</h3>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <span className="px-4 py-1.5 bg-blue-600/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-600/10">
                          {rule.minTime}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
                          {rule.description}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exam Prep Banner */}
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20 group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shrink-0 group-hover:rotate-6 transition-transform">
                <Trophy size={40} className="text-blue-400" />
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">{t('ibjjfRules.examPrep')}</h3>
                <p className="text-slate-400 font-medium leading-relaxed max-w-xl">{t('ibjjfRules.examDesc')}</p>
                <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                  {simulados.map((simu: any, idx: number) => (
                    <button 
                      key={simu.id}
                      onClick={() => startSimulado(simu.id)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                      <ArrowRight size={14} className="text-blue-400" />
                      {simu.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Sensei Tactical Consultant Interface */}
        <div className="relative">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[750px] overflow-hidden">
              <div className="p-10 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                      <Bot size={32} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white dark:border-zinc-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('ibjjfRules.digitalSensei')}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded border border-green-500/10">Tactical Online</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="text-center space-y-6 py-12">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto text-slate-400 border border-slate-100 dark:border-zinc-800">
                      <MessageSquare size={40} />
                    </div>
                    <div className="space-y-2">
                       <p className="text-xs text-slate-900 dark:text-white font-black uppercase tracking-widest leading-none">Aguardando Consulta</p>
                       <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-10 italic">
                         {t('ibjjfRules.chatEmpty')}
                       </p>
                    </div>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-5 rounded-3xl text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-600/20' 
                      : 'bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-zinc-700 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 dark:bg-zinc-800 p-5 rounded-3xl rounded-tl-none flex items-center gap-3">
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-8 bg-slate-50 dark:bg-zinc-800/30 border-t border-slate-100 dark:border-zinc-800">
                <div className="relative group/input">
                  <input 
                    type="text" 
                    placeholder={t('ibjjfRules.chatPlaceholder')}
                    className="w-full pl-6 pr-16 py-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-sm shadow-inner"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50 active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl flex items-center gap-5 group">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                <Icons.HelpCircle size={24} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                Need a physical copy? Use the master link above for official PDF documentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IBJJFRules;
