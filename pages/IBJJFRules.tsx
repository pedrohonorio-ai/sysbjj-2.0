
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Scale size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('ibjjfRules.officialRegulation')}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('ibjjfRules.title')}</h1>
          <p className="text-slate-500 font-medium italic text-lg">{t('ibjjfRules.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a 
            href="https://cbjj.com.br/rules" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-5 rounded-[1.8rem] flex items-center gap-3 shadow-2xl hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <BookOpen size={20} />
            {t('ibjjfRules.rulesPdf')}
          </a>
        </div>
      </div>

      {/* Academy Specific Rules Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 bg-blue-600/5 flex items-center gap-4">
          <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-lg shrink-0">
            <Shield size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{profile.academyName} - {t('ibjjfRules.internalRules')}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">{t('ibjjfRules.graduationCriteria')}</p>
          </div>
        </div>
        <div className="p-8 sm:p-10 prose dark:prose-invert max-w-none prose-slate prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-black prose-p:font-medium prose-p:text-slate-600 dark:prose-p:text-slate-400">
          <ReactMarkdown>{profile.graduationRules || t('ibjjfRules.noInternalRules')}</ReactMarkdown>
        </div>
      </div>

      {/* Rules Academy Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.rulesAcademyTitle')}</h2>
            <p className="text-slate-500 font-medium italic">{t('ibjjfRules.rulesAcademySmallDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {IBJJF_LESSONS.map((lesson) => {
            const IconComponent = (Icons as any)[lesson.icon] || Icons.BookOpen;
            return (
              <div key={lesson.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                    <IconComponent size={28} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{t(`portal.categories.${lesson.category.toLowerCase()}`)}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{lesson.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{lesson.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Case Studies Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ruleCases.map((c, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              {c.icon}
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{c.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">{c.scenario}</p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{t('ibjjfRules.officialRule')}</p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-snug">{c.rule}</p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{c.penalty}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left Column: Graduation System */}
        <div className="xl:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Adult System */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem]">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <GraduationCap size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.adultSystem')}</h2>
              </div>
              <div className="space-y-4">
                {adultRules.map((rule) => (
                  <div key={rule.belt} className="bg-white dark:bg-slate-900 p-6 rounded-[2.2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] border ${rule.belt === 'White' ? 'bg-white text-slate-400 border-slate-200' : rule.belt === 'Blue' ? 'bg-blue-600 text-white' : rule.belt === 'Purple' ? 'bg-purple-700 text-white' : rule.belt === 'Brown' ? 'bg-amber-900 text-white' : 'bg-slate-900 text-white'}`}>
                          {rule.belt[0]}
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{t(`belts.${rule.belt}`)}</h3>
                      </div>
                      <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{rule.minTime}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prohibitions */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-[2rem]">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <AlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.prohibitedTechniques')}</h2>
              </div>
              <div className="space-y-6">
                {prohibitedTechniques.map((cat) => (
                  <div key={cat.category} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden group">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={cat.image} 
                        alt={cat.category} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      <h4 className="absolute bottom-4 left-6 text-sm font-black text-white uppercase tracking-widest">{cat.category}</h4>
                    </div>
                    <div className="p-8">
                      <ul className="space-y-3">
                        {cat.items.map(item => (
                          <li key={item} className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <X size={14} className="text-red-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Age Calculation Info */}
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center shrink-0">
                <Clock size={40} className="text-blue-400" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black uppercase tracking-tighter">{t('ibjjfRules.ageCalcTitle')}</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  {t('ibjjfRules.ageCalcDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Exam Prep Section */}
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Trophy size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{t('ibjjfRules.examPrep')}</h3>
                  <p className="text-blue-100 text-sm font-medium">{t('ibjjfRules.examDesc')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {simulados.map((simu: any, idx: number) => (
                  <div 
                    key={simu.id}
                    onClick={() => startSimulado(simu.id)}
                    className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer"
                  >
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">{t('ibjjfRules.simulatedPrep')} {idx + 1}</p>
                    <p className="font-black uppercase tracking-tight">{simu.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Sensei Chat */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[700px] sticky top-24">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('ibjjfRules.digitalSensei')}</h3>
                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {t('ibjjfRules.rulesExpert')}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center space-y-4 py-10">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <MessageSquare size={32} />
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-10">
                    {t('ibjjfRules.chatEmpty')}
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none">
                    <Loader2 size={20} className="animate-spin text-blue-600" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-[3rem]">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('ibjjfRules.chatPlaceholder')}
                  className="w-full pl-6 pr-14 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold text-sm"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IBJJFRules;
