
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, BookOpen, AlertTriangle, CheckCircle2, Info, Trophy, ChevronRight, PlayCircle, Star, Scale } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { IBJJF_LESSONS, RuleLesson } from '../constants/rulesData';

const IBJJFRules: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLesson, setSelectedLesson] = useState<RuleLesson | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return <Trophy size={20} className="text-amber-500" />;
      case 'ShieldCheck': return <Shield size={20} className="text-emerald-500" />;
      case 'AlertTriangle': return <AlertTriangle size={20} className="text-rose-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
          Regras <span className="text-blue-600">IBJJF</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
          Manual de Normas, Condutas e Pontuação Oficial - Versão 2026
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Quedas', points: '2 Pts', icon: <Scale size={18}/>, color: 'text-amber-600' },
          { title: 'Passagem', points: '3 Pts', icon: <Shield size={18}/>, color: 'text-emerald-600' },
          { title: 'Joelho Barriga', points: '2 Pts', icon: <CheckCircle2 size={18}/>, color: 'text-blue-600' },
          { title: 'Pegada Costas', points: '4 Pts', icon: <Star size={18}/>, color: 'text-purple-600' },
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl group hover:scale-105 transition-all">
             <div className={`${item.color} mb-4 bg-slate-50 dark:bg-white/5 w-10 h-10 rounded-full flex items-center justify-center`}>{item.icon}</div>
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.title}</h3>
             <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{item.points}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
               <BookOpen size={24} className="text-blue-600" />
               Currículo Teórico
             </h2>
             <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
               {IBJJF_LESSONS.length} Módulos
             </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {IBJJF_LESSONS.map((lesson) => (
              <motion.button
                whileHover={{ x: 10 }}
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className={`p-6 text-left rounded-[2rem] border transition-all flex items-center justify-between group ${
                  selectedLesson?.id === lesson.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-blue-600/50'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    selectedLesson?.id === lesson.id ? 'bg-white/20' : 'bg-slate-50 dark:bg-white/5'
                  }`}>
                    {getIcon(lesson.icon)}
                  </div>
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      selectedLesson?.id === lesson.id ? 'text-blue-100' : 'text-blue-600'
                    }`}>
                      {lesson.category} • {lesson.points} OSS PTS
                    </span>
                    <h3 className={`text-lg font-black uppercase tracking-tight mt-1 ${
                      selectedLesson?.id === lesson.id ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}>
                      {lesson.title}
                    </h3>
                  </div>
                </div>
                <ChevronRight size={24} className={selectedLesson?.id === lesson.id ? 'text-white' : 'text-slate-300'} />
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedLesson ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                key={selectedLesson.id}
                className="bg-slate-900 rounded-[3rem] border border-white/10 p-8 text-white relative overflow-hidden h-full"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg w-fit">
                    <PlayCircle size={14} className="text-blue-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Estudo de Caso</span>
                  </div>

                  <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">
                    {selectedLesson.title}
                  </h3>

                  <p className="text-slate-400 text-sm leading-relaxed font-medium">
                    {selectedLesson.content}
                  </p>

                  {selectedLesson.questions && (
                    <div className="pt-6 border-t border-white/10">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Quiz Técnico</h4>
                      <div className="space-y-4">
                        {selectedLesson.questions.map((q) => (
                          <div key={q.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-xs font-bold leading-relaxed mb-3">{q.question}</p>
                            <div className="grid grid-cols-1 gap-2">
                              {q.options.map((opt, i) => (
                                <button key={i} className="px-4 py-2 text-left bg-white/5 hover:bg-blue-600/50 rounded-xl text-[10px] font-bold transition-all border border-transparent hover:border-blue-400">
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLesson.scenarios && (
                     <div className="pt-6 border-t border-white/10">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Dica do Sensei</h4>
                        <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 italic text-sm text-amber-200">
                           "{selectedLesson.scenarios[0].aiSenseiTip}"
                        </div>
                     </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <BookOpen size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Selecione um Módulo</h3>
                <p className="mt-2 text-slate-400 text-sm font-medium">Escolha uma lição técnica ao lado para iniciar o estudo das regras oficiais IBJJF.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-8 bg-amber-500/10 border-2 border-dashed border-amber-500/20 rounded-[2.5rem] flex items-center gap-6">
        <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h4 className="text-lg font-black text-amber-700 dark:text-amber-500 uppercase tracking-tighter italic">Importante: Ética e Respeito</h4>
          <p className="text-sm text-amber-800/70 dark:text-amber-500/70 font-medium">As regras existem para garantir a integridade física de todos os atletas. O conhecimento técnico das regras é uma obrigação de todo graduado.</p>
        </div>
      </div>
    </div>
  );
};

export default IBJJFRules;
