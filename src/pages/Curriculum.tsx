
import React, { useState } from 'react';
import { Book, Layout, Plus, Search, Filter, BookOpen, Layers, Star, PlayCircle, ChevronRight, Zap, Target, Flame } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { TechniqueCategory, BeltColor, LibraryTechnique } from '../types';

const Curriculum: React.FC = () => {
  const { techniques, lessonPlans, addLessonPlan } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TechniqueCategory | 'All'>('All');

  const filteredTechniques = techniques.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Quadro Técnico <span className="text-blue-600">(QTD)</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Gestão de Técnicas e Planejamento de Aulas</p>
        </div>
        <div className="flex gap-2">
           <button 
             className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
             onClick={() => {
               const title = prompt('Título da Aula:');
               if(title) {
                 addLessonPlan({ title, date: new Date().toISOString().split('T')[0], techniques: [], notes: '', isPublished: true });
               }
             }}
           >
             Novo Plano de Aula
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Pesquisar técnicas na biblioteca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  />
               </div>
               <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                  {['All', ...Object.values(TechniqueCategory)].slice(0, 5).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat as any)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                      }`}
                    >
                      {cat === 'All' ? 'Todas' : cat}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredTechniques.map(tech => (
                 <div key={tech.id} className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-blue-500/20 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{tech.category}</span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{tech.name}</h3>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        tech.beltLevel === BeltColor.WHITE ? 'bg-slate-200 text-slate-700' : 
                        tech.beltLevel === BeltColor.BLUE ? 'bg-blue-600 text-white' :
                        tech.beltLevel === BeltColor.PURPLE ? 'bg-purple-600 text-white' :
                        'bg-slate-900 text-white'
                      }`}>
                         {tech.beltLevel}
                      </div>
                   </div>
                   <p className="text-xs text-slate-500 line-clamp-2 font-medium mb-6">{tech.description}</p>
                   <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex gap-1">
                         <Star size={12} className="text-amber-500" />
                         <Star size={12} className="text-amber-500" />
                         <Star size={12} className="text-amber-500" />
                      </div>
                      <button className="text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 group-hover:gap-3 transition-all">
                        Ver Vídeo <PlayCircle size={14} />
                      </button>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg w-fit">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Aulas Recentes</span>
                 </div>
                 
                 <div className="space-y-4">
                    {lessonPlans.length === 0 ? (
                       <div className="py-10 text-center opacity-50">
                          <BookOpen size={32} className="mx-auto mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhum plano ativo.</p>
                       </div>
                    ) : (
                      lessonPlans.map(plan => (
                        <div key={plan.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                           <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{new Date(plan.date).toLocaleDateString()}</p>
                           <h4 className="text-sm font-black uppercase tracking-tight mt-1">{plan.title}</h4>
                           <div className="flex items-center justify-between mt-4">
                              <span className="text-[8px] font-bold text-slate-400">{plan.techniques.length} Técnicas</span>
                              <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-white/5 shadow-xl space-y-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                 <Target size={24} className="text-rose-500" />
                 Foco do Mês
              </h3>
              <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center">
                       <Flame size={24} />
                    </div>
                    <div>
                       <h4 className="text-xs font-black uppercase tracking-tight">Meia Guarda Profunda</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Domínio e Inversão</p>
                    </div>
                 </div>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   Este mês focaremos na transição da meia guarda para as costas e raspagens de lapela.
                 </p>
                 <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Progresso</span>
                    <span className="text-rose-500">65%</span>
                 </div>
                 <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 w-[65%]" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Curriculum;
