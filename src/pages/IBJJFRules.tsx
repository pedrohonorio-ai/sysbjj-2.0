
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, BookOpen, AlertTriangle, CheckCircle2, Info, Trophy, 
  ChevronRight, PlayCircle, Star, Scale, GraduationCap, 
  ArrowLeft, Send, Baby, Search, Filter, Hash, User, 
  Target, Zap, Clock, ShieldCheck, Weight, Flame, X, AlertCircle
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { IBJJF_LESSONS, RuleLesson, IBJJF_COURSES, RuleCourse, RuleQuestion, IBJJF_REFERENCE } from '../constants/rulesData';

const IBJJFRules: React.FC = () => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'academy' | 'reference' | 'rulebook'>('academy');
  const [selectedCourse, setSelectedCourse] = useState<RuleCourse | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<RuleLesson | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [referenceTab, setReferenceTab] = useState<'points' | 'weights' | 'illegal'>('points');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return <Trophy size={20} className="text-amber-500" />;
      case 'ShieldCheck': return <Shield size={20} className="text-emerald-500" />;
      case 'AlertTriangle': return <AlertTriangle size={20} className="text-rose-500" />;
      case 'Baby': return <Baby size={20} className="text-pink-400" />;
      case 'GraduationCap': return <GraduationCap size={20} className="text-purple-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  const startQuiz = () => {
    setShowQuiz(true);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === selectedLesson?.questions?.[currentQuestionIndex].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (!selectedLesson?.questions) return;
    if (currentQuestionIndex < selectedLesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            REGRAS <span className="text-blue-600">IBJJF</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-3 italic flex items-center gap-2">
            <Shield size={12} className="text-blue-500" />
            Manual de Normas, Condutas e Pontuação Oficial - Versão 2026
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner">
           <button 
             onClick={() => setActiveView('academy')}
             className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeView === 'academy' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl border border-slate-100 dark:border-white/5' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <GraduationCap size={16} /> Academia
           </button>
           <button 
             onClick={() => setActiveView('reference')}
             className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeView === 'reference' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl border border-slate-100 dark:border-white/5' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <BookOpen size={16} /> Referência
           </button>
           <button 
             onClick={() => setActiveView('rulebook')}
             className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeView === 'rulebook' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl border border-slate-100 dark:border-white/5' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <ShieldCheck size={16} /> Rulebook
           </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeView === 'academy' && (
          <motion.div
            key="academy"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {selectedCourse && (
              <button 
                onClick={() => {
                  setSelectedCourse(null);
                  setSelectedLesson(null);
                  setShowQuiz(false);
                }}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:gap-3 transition-all"
              >
                <ArrowLeft size={14} /> Voltar para Cursos
              </button>
            )}

            {!selectedCourse ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {IBJJF_COURSES.map((course) => (
                  <motion.div
                    layoutId={course.id}
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl cursor-pointer hover:scale-105 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-colors" />
                    <div className="relative z-10 space-y-6">
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                         <GraduationCap size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight italic">
                          {course.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-400 mt-2 line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                         <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                           {course.lessons.length} Módulos
                         </span>
                         <div className="w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <ChevronRight size={18} />
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                  {selectedCourse.lessons.map((lesson) => (
                    <motion.button
                      key={lesson.id}
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setShowQuiz(false);
                      }}
                      className={`w-full p-6 text-left rounded-[2rem] border transition-all flex items-center gap-6 group ${
                        selectedLesson?.id === lesson.id 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-blue-600/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        selectedLesson?.id === lesson.id ? 'bg-white/20' : 'bg-slate-50 dark:bg-white/5'
                      }`}>
                        {getIcon(lesson.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-black uppercase tracking-tight truncate ${
                          selectedLesson?.id === lesson.id ? 'text-white' : 'text-slate-900 dark:text-white'
                        }`}>
                          {lesson.title}
                        </h4>
                        <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${
                          selectedLesson?.id === lesson.id ? 'text-blue-100' : 'text-slate-400'
                        }`}>
                          {lesson.category} • {lesson.points} OSS PTS
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    {selectedLesson ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        key={selectedLesson.id}
                        className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl space-y-8"
                      >
                        {!showQuiz ? (
                          <>
                            <div className="aspect-video bg-slate-900 rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                               <PlayCircle size={64} className="text-white relative z-10 opacity-40 group-hover:opacity-100 scale-100 group-hover:scale-110 transition-all cursor-pointer" />
                               <div className="absolute bottom-8 left-8 right-8 z-10">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 cursor-pointer">Assistir Aula Técnica</p>
                                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mt-1">{selectedLesson.title}</h3>
                               </div>
                            </div>

                            <div className="prose dark:prose-invert max-w-none">
                               <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                 {selectedLesson.content}
                               </p>
                            </div>

                            <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-white/5">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                                     <Star size={24} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recompensa</p>
                                     <p className="text-lg font-black text-slate-900 dark:text-white italic">{selectedLesson.points} OSS PTS</p>
                                  </div>
                               </div>
                               <button 
                                 onClick={startQuiz}
                                 className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-blue-600/20"
                               >
                                 <Send size={18} /> Iniciar Quiz
                               </button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-8">
                             <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                   <Scale size={24} className="text-blue-600" />
                                   Quiz: {selectedLesson.title}
                                </h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {currentQuestionIndex + 1} de {selectedLesson.questions?.length}
                                </span>
                             </div>

                             {!quizFinished ? (
                               <div className="space-y-6">
                                  <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                                     <p className="text-lg font-black leading-tight text-slate-900 dark:text-white">
                                        {selectedLesson.questions?.[currentQuestionIndex].question}
                                     </p>
                                  </div>

                                  <div className="grid grid-cols-1 gap-3">
                                     {selectedLesson.questions?.[currentQuestionIndex].options.map((opt, idx) => {
                                       const isCorrect = idx === selectedLesson.questions?.[currentQuestionIndex].correctAnswer;
                                       const isSelected = selectedAnswer === idx;
                                       
                                       return (
                                         <button
                                           key={idx}
                                           disabled={selectedAnswer !== null}
                                           onClick={() => handleAnswerSelect(idx)}
                                           className={`p-5 text-left rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-between group ${
                                             selectedAnswer === null 
                                             ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 hover:border-blue-500/50' 
                                             : isCorrect 
                                               ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' 
                                               : isSelected 
                                                 ? 'bg-rose-500/10 border-rose-500 text-rose-600' 
                                                 : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/5 opacity-50'
                                           }`}
                                         >
                                           {opt}
                                           {selectedAnswer !== null && isCorrect && <CheckCircle2 size={18} />}
                                           {selectedAnswer !== null && isSelected && !isCorrect && <AlertTriangle size={18} />}
                                         </button>
                                       );
                                     })}
                                  </div>

                                  {selectedAnswer !== null && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`p-6 rounded-2xl border ${selectedAnswer === selectedLesson.questions?.[currentQuestionIndex].correctAnswer ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}
                                    >
                                       <p className="text-xs font-bold leading-relaxed">
                                          <span className="uppercase tracking-widest text-[9px] block mb-1">Explicação Técnica:</span>
                                          {selectedLesson.questions?.[currentQuestionIndex].explanation}
                                       </p>
                                       <button 
                                         onClick={nextQuestion}
                                         className="mt-6 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                       >
                                         {currentQuestionIndex < (selectedLesson.questions?.length ?? 0) - 1 ? 'Próxima Questão' : 'Finalizar Quiz'}
                                       </button>
                                    </motion.div>
                                  )}
                               </div>
                             ) : (
                               <div className="py-12 text-center space-y-8">
                                  <div className="w-32 h-32 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl relative">
                                     <span className="text-4xl font-black italic">{Math.round((quizScore / (selectedLesson.questions?.length ?? 1)) * 100)}%</span>
                                     <motion.div 
                                       animate={{ rotate: 360 }}
                                       transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                       className="absolute inset-0 border-4 border-dashed border-white/20 rounded-full"
                                     />
                                  </div>
                                  <div>
                                     <h3 className="text-2xl font-black uppercase tracking-tighter italic">Missão Cumprida!</h3>
                                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Você concluiu o módulo com sucesso.</p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                     <button 
                                       onClick={startQuiz}
                                       className="px-8 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                     >
                                       Refazer Quiz
                                     </button>
                                     <button 
                                       onClick={() => {
                                         setShowQuiz(false);
                                         setQuizFinished(false);
                                       }}
                                       className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20"
                                     >
                                       Voltar para Aula
                                     </button>
                                  </div>
                               </div>
                             )}
                          </div>
                        )}
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
            )}
          </motion.div>
        )}

        {activeView === 'reference' && (
          <motion.div
            key="reference"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
             <div className="flex bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl max-w-2xl mx-auto">
                <button 
                  onClick={() => setReferenceTab('points')}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${referenceTab === 'points' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Trophy size={16} /> Pontuação
                </button>
                <button 
                  onClick={() => setReferenceTab('weights')}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${referenceTab === 'weights' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Hash size={16} /> Categorias
                </button>
                <button 
                  onClick={() => setReferenceTab('illegal')}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${referenceTab === 'illegal' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <AlertTriangle size={16} /> Ilegais
                </button>
             </div>

             <div className="grid grid-cols-1 gap-8">
                {referenceTab === 'points' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {IBJJF_REFERENCE.points.map((p, idx) => (
                       <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 text-blue-600/5 group-hover:text-blue-600/10 transition-colors">
                             <Trophy size={80} />
                          </div>
                          <div className="relative z-10">
                             <div className="flex items-center justify-between mb-4">
                                <span className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black italic shadow-lg shadow-blue-600/20">
                                   +{p.value}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">PONTOS</span>
                             </div>
                             <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">{p.position}</h4>
                             <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed italic">{p.description}</p>
                          </div>
                       </div>
                     ))}
                  </motion.div>
                )}

                {referenceTab === 'weights' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-white/5 p-10 shadow-2xl overflow-hidden">
                           <header className="flex items-center gap-4 mb-8">
                              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                 <Clock size={24} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Duração das Lutas</h3>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Tempo oficial por faixa (Adulto)</p>
                              </div>
                           </header>
                           <div className="grid grid-cols-1 gap-2">
                              {IBJJF_REFERENCE.matchDurations.map((m, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-amber-500/20 transition-all">
                                   <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{m.belt}</span>
                                   <span className="text-lg font-black text-amber-500 italic uppercase tracking-tighter">{m.time}</span>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-white/5 p-10 shadow-2xl overflow-hidden">
                           <header className="flex items-center gap-4 mb-8">
                              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                 <Target size={24} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Categorias de Idade</h3>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Critérios de inscrição IBJJF</p>
                              </div>
                           </header>
                           <div className="grid grid-cols-1 gap-2">
                              {IBJJF_REFERENCE.ageCategories.map((a, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-emerald-500/20 transition-all">
                                   <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{a.name}</span>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.age}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl overflow-hidden">
                           <header className="flex items-center gap-4 mb-8 px-4">
                              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                 <User size={24} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Masculino (Adulto/Gi)</h3>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Categorias de peso oficial</p>
                              </div>
                           </header>
                           <div className="space-y-2">
                              {IBJJF_REFERENCE.weightClasses.male.map((w, idx) => (
                                <div key={idx} className="flex items-center justify-between p-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                                   <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{w.category}</span>
                                   <span className="px-5 py-2 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest tabular-nums italic group-hover:bg-blue-600 transition-colors">
                                      {w.weight}
                                   </span>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl overflow-hidden">
                           <header className="flex items-center gap-4 mb-8 px-4">
                              <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                 <User size={24} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Feminino (Adulto/Gi)</h3>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Categorias de peso oficial</p>
                              </div>
                           </header>
                           <div className="space-y-2">
                              {IBJJF_REFERENCE.weightClasses.female.map((w, idx) => (
                                <div key={idx} className="flex items-center justify-between p-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                                   <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{w.category}</span>
                                   <span className="px-5 py-2 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest tabular-nums italic group-hover:bg-pink-600 transition-colors">
                                      {w.weight}
                                   </span>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {referenceTab === 'illegal' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {IBJJF_REFERENCE.illegalMoves.map((group, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-white/5 p-10 shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 text-rose-500/5">
                                <AlertTriangle size={120} />
                             </div>
                             <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8 flex items-center gap-4">
                                <ShieldCheck size={24} className="text-blue-600" />
                                {group.belt}
                             </h3>
                             <div className="space-y-4">
                                {group.moves.map((move, midx) => (
                                  <div key={midx} className="flex items-start gap-4 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 hover:bg-rose-500/10 transition-all cursor-default">
                                     <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                                        <X size={14} />
                                     </div>
                                     <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-relaxed italic">{move}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>

                     <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute bottom-[-50px] left-[-50px] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                           <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter italic italic-none">Faltas <span className="text-blue-500">Gravíssimas</span></h3>
                              <p className="text-sm font-bold opacity-60 uppercase tracking-widest mt-4 leading-relaxed">
                                 Ações que resultam em desclassificação imediata independente do placar ou tempo de luta.
                              </p>
                              <div className="grid grid-cols-1 gap-4 mt-8">
                                 {IBJJF_REFERENCE.fouls.serious.map((f, idx) => (
                                   <div key={idx} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 italic">
                                      <Flame size={16} className="text-rose-500 shrink-0" />
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{f}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-6 flex items-center gap-3">
                                 <Zap size={14} /> Dica do Sensei
                              </h4>
                              <p className="text-base font-bold italic leading-relaxed uppercase opacity-90">
                                 "Muitas vezes a luta é perdida não pela falta do ponto, mas por uma punição evitável. Estude os gestos do árbitro e mantenha a disciplina no tatame. A regra protege o esporte e os atletas."
                              </p>
                              <button className="mt-8 w-full py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all">
                                 Baixar Manual PDF Oficial
                              </button>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}
             </div>
          </motion.div>
        )}

        {activeView === 'rulebook' && (
          <motion.div
            key="rulebook"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
               <div className="bg-slate-950 rounded-[4rem] p-12 text-white relative overflow-hidden border border-white/5 shadow-2xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-20" />
                  <div className="relative z-10 max-w-3xl">
                     <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-6 leading-none">Seções Essenciais do Livro de Regras</h2>
                     <p className="text-lg text-slate-400 font-medium italic mb-10 leading-relaxed">O Livro de Regras da IBJJF é o pilar fundamental para qualquer competidor. Abaixo, resumimos os pontos críticos que definem o curso de uma luta oficial.</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                           <Shield className="text-blue-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
                           <h4 className="text-xl font-black uppercase tracking-tight mb-4">Área de Luta</h4>
                           <p className="text-xs text-slate-500 leading-relaxed italic uppercase font-bold">A área total do tatame deve ser de no mínimo 64m² e máximo 100m². A área externa é a zona de segurança. Sair da área de luta em situação de finalização ou queda iminente resulta em punição ou desclassificação.</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                           <Scale className="text-emerald-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
                           <h4 className="text-xl font-black uppercase tracking-tight mb-4">Pesagem</h4>
                           <p className="text-xs text-slate-500 leading-relaxed italic uppercase font-bold">A pesagem oficial ocorre imediatamente antes da primeira luta. O atleta tem apenas uma chance. O Kimono deve estar limpo e dentro das medidas oficiais (6 dedos de folga no braço e calça).</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                           <AlertCircle className="text-rose-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
                           <h4 className="text-xl font-black uppercase tracking-tight mb-4">Interrupção</h4>
                           <p className="text-xs text-slate-500 leading-relaxed italic uppercase font-bold">O árbitro pode interromper a luta se notar que um atleta está em perigo físico real (perda de consciência) ou se houver sangramento não estancável.</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                           <Zap className="text-amber-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
                           <h4 className="text-xl font-black uppercase tracking-tight mb-4">Vantagens</h4>
                           <p className="text-xs text-slate-500 leading-relaxed italic uppercase font-bold">Concedidas quando o atleta quase atinge uma posição de pontuação ou quase finaliza o oponente. São usadas como critério de desempate antes da decisão arbitral.</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-white/5 p-12 shadow-2xl">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-10">Tabela de Infrações Graves</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <div className="flex items-center gap-4 text-rose-600 font-black uppercase tracking-widest text-xs">
                           <AlertTriangle size={20} /> Desclassificação Direta
                        </div>
                        <ul className="space-y-4">
                           {['Bate-estaca (Slam)', 'Dedo no olho ou boca', 'Falar com o árbitro de forma agressiva', 'Finalizações que torçam a coluna', 'Morder ou cuspir', 'Fugir da área para evitar finalização'].map((item, i) => (
                             <li key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-rose-500/20 transition-all font-bold text-xs text-slate-500 uppercase italic">
                               <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                               {item}
                             </li>
                           ))}
                        </ul>
                     </div>
                     <div className="space-y-6">
                        <div className="flex items-center gap-4 text-blue-600 font-black uppercase tracking-widest text-xs">
                           <Scale size={20} /> Punções Acumuladas
                        </div>
                        <ul className="space-y-4">
                           {[
                             { d: '1ª Punição', effect: 'Apenas advertência verbal' },
                             { d: '2ª Punição', effect: 'Oponente recebe 1 vantagem' },
                             { d: '3ª Punição', effect: 'Oponente recebe 2 pontos' },
                             { d: '4ª Punição', effect: 'Desclassificação imediata' }
                           ].map((item, i) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all">
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{item.d}</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase italic">{item.effect}</span>
                             </div>
                           ))}
                        </ul>
                        <p className="p-6 bg-blue-600/5 rounded-3xl border border-blue-600/10 text-[10px] font-bold text-blue-600 uppercase italic leading-relaxed">
                           "Amarrar a luta (Stalling) é a causa mais comum de punições. Lembre-se: O Jiu-Jitsu Brasileiro preza pela combatividade."
                        </p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default IBJJFRules;
