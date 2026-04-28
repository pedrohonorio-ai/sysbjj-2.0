import React, { useState } from 'react';
import { 
  ArrowRight,
  ChevronRight,
  BookOpen,
  Scale,
  Shield,
  Clock,
  Zap,
  AlertTriangle,
  GraduationCap,
  Trophy,
  Users,
  X,
  CheckCircle2,
  HelpCircle,
  Search,
  CheckCircle,
  Copy,
  DollarSign,
  UserX,
  PieChart as PieChartIcon,
  Tag,
  Eye,
  Lock,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { IBJJF_LESSONS } from '../constants/rulesData';
import ReactMarkdown from 'react-markdown';
import * as Icons from 'lucide-react';

const IBJJFRules: React.FC = () => {
  const { t, tObj } = useTranslation();
  const { profile } = useProfile();
  
  const adultRules = tObj('ibjjfRules.adultRules') || [];
  const prohibitedTechniques = tObj('ibjjfRules.prohibitions') || [];
  const ruleCases = tObj('ibjjfRules.cases') || [];
  const [activeSimulado, setActiveSimulado] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const simulados = tObj('ibjjfRules.simulados') || [];

  const prohibitionsWithImages = [
    { 
      category: prohibitedTechniques[0]?.category || 'General (All Belts)', 
      items: prohibitedTechniques[0]?.items || [],
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Slam_BJJ.jpg/640px-Slam_BJJ.jpg' // Slam/High impact placeholder style
    },
    { 
      category: prohibitedTechniques[1]?.category || 'Kids (Up to 12)', 
      items: prohibitedTechniques[1]?.items || [],
      image: 'https://images.unsplash.com/photo-1552072092-7f9b5d63efaf?q=80&w=640&auto=format&fit=crop' // Kids BJJ focus
    },
    { 
      category: prohibitedTechniques[3]?.category || 'White Belt', 
      items: prohibitedTechniques[3]?.items || [],
      image: 'https://images.unsplash.com/photo-1599058917233-359f5115985b?q=80&w=640&auto=format&fit=crop' // White belt focus
    },
    { 
      category: prohibitedTechniques[4]?.category || 'Blue/Purple', 
      items: prohibitedTechniques[4]?.items || [],
      image: 'https://images.unsplash.com/photo-1509564343151-56191986427c?q=80&w=640&auto=format&fit=crop' // Focus on leg attacks/advanced
    }
  ];

  const handleAnswer = (idx: number) => {
    const currentSim = simulados.find((s: any) => s.id === activeSimulado);
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 max-w-7xl mx-auto pb-24 px-4 sm:px-0"
    >
      {/* Simulado Modal */}
      {activeSimulado && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{t('ibjjfRules.simulatedPrep')}</p>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{simulados.find((s: any) => s.id === activeSimulado)?.title}</h3>
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
                      {t('ibjjfRules.questionOf', { current: currentQuestion + 1, total: simulados.find((s: any) => s.id === activeSimulado)?.questions.length })}
                    </span>
                    <div className="h-1 flex-1 mx-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-500" 
                        style={{ width: `${((currentQuestion + 1) / (simulados.find((s: any) => s.id === activeSimulado)?.questions.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {simulados.find((s: any) => s.id === activeSimulado)?.questions[currentQuestion].q}
                  </h4>

                  <div className="space-y-3">
                    {simulados.find((s: any) => s.id === activeSimulado)?.questions[currentQuestion].options.map((opt: string, idx: number) => (
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
                      {t('ibjjfRules.correctCount', { score, total: simulados.find((s: any) => s.id === activeSimulado)?.questions.length })}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => activeSimulado && startSimulado(activeSimulado)}
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
      <div className="relative pt-12 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/5 to-transparent blur-3xl -z-10" />
        <div className="relative flex flex-col lg:flex-row items-center lg:items-end justify-between gap-10">
          <div className="space-y-6 text-center lg:text-left max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-full border border-blue-600/20"
            >
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('ibjjfRules.officialRegulation')}</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.85] italic">
              {t('ibjjfRules.title')}
            </h1>
            <p className="text-slate-500 font-bold italic text-lg lg:text-2xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t('ibjjfRules.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <a 
              href="https://cbjj.com.br/rules" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-5 lg:px-12 lg:py-8 rounded-[2rem] flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:shadow-blue-600/20 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all font-black text-sm uppercase tracking-widest group"
            >
              <BookOpen size={24} className="group-hover:rotate-12 transition-transform" />
              <span>{t('ibjjfRules.rulesPdf')}</span>
              <ArrowRight size={20} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
            </a>
          </div>
        </div>
      </div>

      {/* Internal Rules Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden group hover:border-blue-600/30 transition-colors"
        >
          <div className="p-8 lg:p-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                <ShieldCheck size={36} />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{profile.academyName}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">{t('ibjjfRules.internalRules')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-blue-600/10 text-blue-600 rounded-full border border-blue-600/20 text-[10px] font-black uppercase tracking-widest shadow-inner">
              <CheckCircle2 size={14} /> {t('ibjjfRules.verifiedSystem')}
            </div>
          </div>
          <div className="p-10 lg:p-16 prose dark:prose-invert max-w-none prose-slate prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-black prose-p:font-bold prose-p:italic prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-li:font-medium prose-strong:text-blue-600">
            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-8 lg:p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
              <ReactMarkdown>{profile.graduationRules || t('ibjjfRules.noInternalRules')}</ReactMarkdown>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="flex-1 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col justify-between group shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 space-y-8">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
                <Clock size={32} className="text-blue-400" />
              </div>
              <div className="space-y-4">
                <h4 className="text-3xl font-black uppercase tracking-tighter leading-tight italic">{t('ibjjfRules.ageCalcTitle')}</h4>
                <p className="text-slate-400 text-sm font-bold italic leading-relaxed opacity-80 uppercase tracking-tight">
                  {t('ibjjfRules.ageCalcDesc')}
                </p>
              </div>
            </div>
            <div className="relative z-10 pt-10 border-t border-white/5 mt-10">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">{t('ibjjfRules.currentPeriod')}</p>
              <p className="text-5xl font-black tabular-nums tracking-tighter">{new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Academy Hub */}
      <div className="space-y-10 py-6 lg:py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.rulesAcademyTitle')}</h2>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[8px] font-black tracking-widest uppercase">{t('ibjjfRules.masteryCourse')}</span>
            </div>
            <p className="text-slate-500 font-medium italic text-base lg:text-lg">{t('ibjjfRules.rulesAcademySmallDesc')}</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 lg:gap-8"
        >
          {IBJJF_LESSONS.map((lesson, idx) => {
            const IconComponent = (Icons as any)[lesson.icon] || Icons.BookOpen;
            const isWide = idx === 0 || idx === 3;
            return (
              <motion.div 
                key={lesson.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`${isWide ? 'md:col-span-2 lg:col-span-3' : 'md:col-span-1 lg:col-span-1.5'} bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 lg:p-10 flex flex-col justify-between hover:border-blue-600 group relative overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)] transition-all duration-500`}
              >
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className={`${isWide ? 'w-16 h-16 bg-blue-600 text-white' : 'w-12 h-12 bg-blue-600/10 text-blue-600'} rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 shadow-lg`}>
                      <IconComponent size={isWide ? 32 : 24} />
                    </div>
                    <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">LVL {idx + 1}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-blue-600 rounded-full" />
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                         {t(`portal.categories.${lesson.category.toLowerCase()}`)}
                       </span>
                    </div>
                    <h3 className={`${isWide ? 'text-2xl lg:text-3xl' : 'text-lg lg:text-xl'} font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none group-hover:text-blue-600 transition-colors`}>
                      {lesson.title}
                    </h3>
                    <p className={`${isWide ? 'text-sm lg:text-base' : 'text-xs'} text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic`}>
                      {lesson.content}
                    </p>
                  </div>
                </div>
                <div className="relative z-10 pt-10 mt-auto">
                  <button className="flex items-center gap-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest group/btn">
                    <span className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                      <ArrowRight size={18} />
                    </span>
                    {t('common.evolution')}
                  </button>
                </div>
                {isWide && (
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/[0.03] to-transparent pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Case Studies Section */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Scale size={28} className="text-blue-600" />
              <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{t('ibjjfRules.tacticalScenarios')}</h2>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('portal.categories.scenarios')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ruleCases.map((c: any, idx: number) => (
            <motion.div 
              key={idx} 
              whileHover={{ y: -10 }}
              className="bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-blue-600/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
                  <Zap size={28} />
                </div>
                <div className="px-4 py-1 bg-red-600/10 text-red-600 rounded-full border border-red-600/20">
                  <span className="text-[10px] font-black uppercase tracking-widest">{c.penalty}</span>
                </div>
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 leading-tight">{c.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-8 leading-relaxed italic line-clamp-3 opacity-80">{c.scenario}</p>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 group-hover:border-blue-600/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('ibjjfRules.officialRule')}</p>
                </div>
                <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 leading-snug">{c.rule}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-12 lg:col-span-2">
          {/* Prohibited Techniques Header */}
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-red-600/30">
                <AlertTriangle size={36} />
              </div>
              <div>
                <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{t('ibjjfRules.prohibitedTechniques')}</h2>
                <p className="text-red-600 text-[10px] font-black uppercase tracking-[0.3em] mt-1">{t('ibjjfRules.restrictedActions')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {prohibitionsWithImages.map((cat: any) => (
                <div key={cat.category} className="bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img 
                      src={cat.image} 
                      alt={cat.category} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale-[0.5] group-hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <div className="absolute bottom-6 left-8">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{t('ibjjfRules.prohibited')}</span>
                      </div>
                      <h4 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{cat.category}</h4>
                    </div>
                  </div>
                  <div className="p-8 lg:p-10 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
                    <ul className="grid grid-cols-1 gap-4">
                      {cat.items.map((item: string) => (
                        <li key={item} className="flex items-start gap-4 text-xs font-bold text-slate-700 dark:text-slate-300 group/item hover:text-red-600 transition-colors">
                          <div className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20 group-hover/item:rotate-12 transition-transform">
                            <X size={14} />
                          </div>
                          <span className="leading-relaxed border-b border-transparent group-hover/item:border-red-600/20 pb-0.5">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-8 lg:p-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 group-hover:rotate-3 transition-transform">
                  <GraduationCap size={40} />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('ibjjfRules.adultSystem')}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic">{t('ibjjfRules.professionalGrading')}</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                    <th className="px-8 lg:px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">{t('ibjjfRules.beltRank')}</th>
                    <th className="px-8 lg:px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 text-center">{t('ibjjfRules.minimumTime')}</th>
                    <th className="px-8 lg:px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">{t('ibjjfRules.requirementsMastery')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adultRules.map((rule: any) => (
                    <tr key={rule.belt} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300">
                      <td className="px-8 lg:px-12 py-10">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-5 rounded-full shadow-lg border-2 ${
                            rule.belt === 'White' || rule.belt === 'Branca' ? 'bg-white border-slate-200' : 
                            rule.belt === 'Blue' || rule.belt === 'Azul' ? 'bg-blue-600 border-blue-400' : 
                            rule.belt === 'Purple' || rule.belt === 'Roxa' ? 'bg-purple-700 border-purple-500' : 
                            rule.belt === 'Brown' || rule.belt === 'Marrom' ? 'bg-amber-900 border-amber-700' : 
                            'bg-slate-900 border-slate-700'
                          } ring-4 ring-slate-50 dark:ring-slate-800/50`} />
                          <div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg lg:text-xl">{t(`belts.${rule.belt}`)}</h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.evolution')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 lg:px-12 py-10 text-center">
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:scale-110 transition-transform">
                          <Clock size={12} className="text-blue-500" />
                          {rule.minTime}
                        </div>
                      </td>
                      <td className="px-8 lg:px-12 py-10">
                        <div className="flex items-start gap-4">
                          <CheckCircle className="text-blue-600 shrink-0 mt-1" size={16} />
                          <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-bold leading-relaxed max-w-sm italic">
                            {rule.description}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 lg:p-16 text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent)] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-blue-600 rounded-full blur-[120px] opacity-20 group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/5 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl shrink-0 group-hover:rotate-6 transition-all duration-500">
                <Trophy size={56} className="text-blue-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
              </div>
              <div className="flex-1 space-y-6 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <h3 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none italic">{t('ibjjfRules.examPrep')}</h3>
                  <div className="px-4 py-1 bg-blue-600 rounded-full w-fit mx-auto lg:mx-0">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">PROFESSIONAL CERTIFICATION</span>
                  </div>
                </div>
                <p className="text-slate-400 font-bold italic leading-relaxed text-lg lg:text-xl max-w-2xl opacity-80">{t('ibjjfRules.examDesc')}</p>
                <div className="pt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                  {simulados.map((simu: any) => (
                    <button 
                      key={simu.id}
                      onClick={() => startSimulado(simu.id)}
                      className="px-10 py-5 bg-white text-slate-900 hover:bg-blue-600 hover:text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-4 shadow-xl active:scale-95"
                    >
                      <ArrowRight size={18} className="text-blue-600 group-hover:text-white" />
                      {simu.title}
                    </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kids System Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mt-8 lg:mt-12 col-span-1 lg:col-span-2">
          <div className="p-8 lg:p-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-orange-500/30">
                <Users size={40} />
              </div>
              <div>
                <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('students.kidsRulesTitle')}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic">{t('ibjjfRules.youthGraduation')}</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                  <th className="px-8 lg:px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">{t('ibjjfRules.beltRank')}</th>
                  <th className="px-8 lg:px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 text-center">{t('ibjjfRules.minAge')}</th>
                  <th className="px-8 lg:px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">{t('ibjjfRules.groupAndFocus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(tObj('students.kidsRules') || []).map((rule: any) => (
                  <tr key={rule.belt} className="group hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all duration-300">
                    <td className="px-8 lg:px-12 py-10">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-5 rounded-full shadow-lg border-2 ${
                          rule.belt.includes('White') || rule.belt.includes('Branca') ? 'bg-white border-slate-200' : 
                          rule.belt.includes('Gray') || rule.belt.includes('Cinza') ? 'bg-slate-400 border-slate-500' : 
                          rule.belt.includes('Yellow') || rule.belt.includes('Amarela') ? 'bg-yellow-400 border-yellow-500' : 
                          rule.belt.includes('Orange') || rule.belt.includes('Laranja') ? 'bg-orange-500 border-orange-600' : 
                          'bg-green-600 border-green-700'
                        } ring-4 ring-slate-50 dark:ring-slate-800/50`} />
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg lg:text-xl">{rule.belt}</h3>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.kid')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 lg:px-12 py-10 text-center">
                      <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:scale-110 transition-transform">
                        <Tag size={12} className="text-orange-500" />
                        {rule.minAge} {t('common.years')}
                      </div>
                    </td>
                    <td className="px-8 lg:px-12 py-10">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="text-orange-500 shrink-0 mt-1" size={16} />
                        <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-bold leading-relaxed max-w-sm italic">
                          {rule.description}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default IBJJFRules;
