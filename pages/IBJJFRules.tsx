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
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent blur-3xl opacity-50 rounded-[4rem]" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                <Scale size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('ibjjfRules.officialRegulation')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
              {t('ibjjfRules.title')}
            </h1>
            <p className="text-slate-500 font-medium italic text-base lg:text-lg leading-relaxed">
              {t('ibjjfRules.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <a 
              href="https://cbjj.com.br/rules" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-4 lg:px-10 lg:py-6 rounded-2xl lg:rounded-3xl flex items-center gap-4 shadow-2xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all font-black text-xs uppercase tracking-widest group"
            >
              <BookOpen size={20} className="group-hover:rotate-12 transition-transform" />
              {t('ibjjfRules.rulesPdf')}
              <ArrowRight size={16} className="opacity-50" />
            </a>
          </div>
        </div>
      </div>

      {/* Internal Rules Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
          <div className="p-6 lg:p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-lg border border-slate-100 dark:border-slate-700">
                <Shield size={32} />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{profile.academyName}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">{t('ibjjfRules.internalRules')}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-full border border-blue-600/20 text-[9px] font-black uppercase tracking-widest">
              <CheckCircle2 size={12} /> {t('ibjjfRules.verifiedSystem')}
            </div>
          </div>
          <div className="p-8 lg:p-12 prose dark:prose-invert max-w-none prose-slate prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-black prose-p:font-medium prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-li:font-medium">
            <ReactMarkdown>{profile.graduationRules || t('ibjjfRules.noInternalRules')}</ReactMarkdown>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl lg:rounded-[2.5rem] p-8 lg:p-10 text-white relative overflow-hidden flex flex-col justify-between group shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <Clock size={32} className="text-blue-400" />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter leading-none">{t('ibjjfRules.ageCalcTitle')}</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {t('ibjjfRules.ageCalcDesc')}
              </p>
            </div>
          </div>
          <div className="relative z-10 pt-10 border-t border-white/5 mt-10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">{t('ibjjfRules.currentPeriod')}</p>
            <p className="text-2xl lg:text-3xl font-black tabular-nums">{new Date().getFullYear()}</p>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          {IBJJF_LESSONS.map((lesson, idx) => {
            const IconComponent = (Icons as any)[lesson.icon] || Icons.BookOpen;
            const isFeatured = idx === 0;
            return (
              <motion.div 
                key={lesson.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`${isFeatured ? 'md:col-span-2 md:row-span-2' : ''} bg-white dark:bg-zinc-900 rounded-3xl lg:rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 p-6 lg:p-8 flex flex-col justify-between hover:border-blue-600 transition-all group relative overflow-hidden shadow-sm hover:shadow-2xl`}
              >
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`${isFeatured ? 'w-14 h-14 lg:w-16 lg:h-16 bg-blue-600 text-white' : 'w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600'} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}>
                      <IconComponent size={isFeatured ? 32 : 24} />
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">NIV {idx + 1}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-600/10 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-600/10">
                        {t(`portal.categories.${lesson.category.toLowerCase()}`)}
                      </span>
                    </div>
                    <h3 className={`${isFeatured ? 'text-2xl lg:text-3xl' : 'text-lg lg:text-xl'} font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none`}>
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
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Case Studies Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Scale size={24} className="text-blue-600" />
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.tacticalScenarios')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ruleCases.map((c: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group border-b-4 border-b-blue-600">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{c.penalty}</span>
                </div>
              </div>
              <h3 className="text-base lg:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3 leading-tight">{c.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed italic line-clamp-3">{c.scenario}</p>
              <div className="p-4 lg:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:border-blue-600/30 transition-colors">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-12 lg:col-span-2">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/20">
                <AlertTriangle size={28} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('ibjjfRules.prohibitedTechniques')}</h2>
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">{t('ibjjfRules.restrictedActions')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {prohibitedTechniques.map((cat: any) => (
                <div key={cat.category} className="bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img 
                      src={cat.image} 
                      alt={cat.category} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    <div className="absolute bottom-6 left-8">
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-white rounded-full px-3 py-1 mb-2 inline-block">{t('ibjjfRules.prohibited')}</span>
                      <h4 className="text-lg lg:text-xl font-black text-white uppercase tracking-tighter">{cat.category}</h4>
                    </div>
                  </div>
                  <div className="p-8 lg:p-10">
                    <ul className="space-y-4">
                      {cat.items.map((item: string) => (
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

          <div className="bg-white dark:bg-zinc-900 rounded-3xl lg:rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden">
            <div className="p-8 lg:p-10 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('ibjjfRules.adultSystem')}</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1 lg:mt-2">{t('ibjjfRules.professionalGrading')}</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-800/40">
                    <th className="px-6 lg:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">{t('ibjjfRules.beltRank')}</th>
                    <th className="px-6 lg:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800 text-center">{t('ibjjfRules.minimumTime')}</th>
                    <th className="px-6 lg:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">{t('ibjjfRules.requirementsMastery')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                  {adultRules.map((rule: any) => (
                    <tr key={rule.belt} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 lg:px-10 py-6 lg:py-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-4 rounded-sm shadow-sm border ${
                            rule.belt === 'White' || rule.belt === 'Branca' ? 'bg-white border-slate-200' : 
                            rule.belt === 'Blue' || rule.belt === 'Azul' ? 'bg-blue-600 border-blue-700' : 
                            rule.belt === 'Purple' || rule.belt === 'Roxa' ? 'bg-purple-700 border-purple-800' : 
                            rule.belt === 'Brown' || rule.belt === 'Marrom' ? 'bg-amber-900 border-amber-950' : 
                            'bg-slate-900 border-slate-800'
                          }`} />
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base lg:text-lg">{t(`belts.${rule.belt}`)}</h3>
                        </div>
                      </td>
                      <td className="px-6 lg:px-10 py-6 lg:py-8 text-center text-xs">
                        <span className="px-4 py-1.5 bg-blue-600/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-600/10">
                          {rule.minTime}
                        </span>
                      </td>
                      <td className="px-6 lg:px-10 py-6 lg:py-8">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm italic">
                          {rule.description}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl lg:rounded-[3rem] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20 group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shrink-0 group-hover:rotate-6 transition-transform">
                <Trophy size={40} className="text-blue-400" />
              </div>
              <div className="flex-1 space-y-4 text-center lg:text-left">
                <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none">{t('ibjjfRules.examPrep')}</h3>
                <p className="text-slate-400 font-medium leading-relaxed text-sm lg:text-base max-w-xl">{t('ibjjfRules.examDesc')}</p>
                <div className="pt-4 flex flex-wrap gap-4 justify-center lg:justify-start">
                  {simulados.map((simu: any) => (
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

        {/* Kids System Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl lg:rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden mt-8 lg:mt-12 col-span-1 lg:col-span-2">
          <div className="p-8 lg:p-10 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                <Users size={32} />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('students.kidsRulesTitle')}</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1 lg:mt-2">{t('ibjjfRules.youthGraduation')}</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800/40">
                  <th className="px-6 lg:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">{t('ibjjfRules.beltRank')}</th>
                  <th className="px-6 lg:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800 text-center">{t('ibjjfRules.minAge')}</th>
                  <th className="px-6 lg:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">{t('ibjjfRules.groupAndFocus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {(tObj('students.kidsRules') || []).map((rule: any) => (
                  <tr key={rule.belt} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 lg:px-10 py-6 lg:py-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-4 rounded-sm shadow-sm border ${
                          rule.belt.includes('White') || rule.belt.includes('Branca') ? 'bg-white border-slate-200' : 
                          rule.belt.includes('Gray') || rule.belt.includes('Cinza') ? 'bg-slate-400 border-slate-500' : 
                          rule.belt.includes('Yellow') || rule.belt.includes('Amarela') ? 'bg-yellow-400 border-yellow-500' : 
                          rule.belt.includes('Orange') || rule.belt.includes('Laranja') ? 'bg-orange-500 border-orange-600' : 
                          'bg-green-600 border-green-700'
                        }`} />
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base lg:text-lg">{rule.belt}</h3>
                      </div>
                    </td>
                    <td className="px-6 lg:px-10 py-6 lg:py-8 text-center text-xs">
                      <span className="px-4 py-1.5 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/10">
                        {rule.minAge} {t('common.years')}
                      </span>
                    </td>
                    <td className="px-6 lg:px-10 py-6 lg:py-8">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm italic">
                        {rule.description}
                      </p>
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
