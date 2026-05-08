
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, BookOpen, AlertTriangle, CheckCircle2, Info, Trophy, ChevronRight, PlayCircle, Star, Scale, GraduationCap, ArrowLeft, Send } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { IBJJF_LESSONS, RuleLesson, IBJJF_COURSES, RuleCourse, RuleQuestion } from '../constants/rulesData';

const IBJJFRules: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState<RuleCourse | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<RuleLesson | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
            Academia de <span className="text-blue-600">Regras</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            Manual de Normas, Condutas e Pontuação Oficial - Versão 2026
          </p>
        </div>
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
      </header>

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
    </div>
  );
};

export default IBJJFRules;
