
import React from 'react';
import { Book, Layout } from 'lucide-react';

const Curriculum: React.FC = () => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Quadro Técnico <span className="text-blue-600">(QTD)</span></h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Currículo de Aulas e Definição de Técnicas Diárias</p>
      </header>
      <div className="p-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 text-center">
        <Book size={48} className="text-blue-500 mx-auto mb-6" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Planejamento de Treino</h2>
        <p className="mt-4 text-slate-500 text-sm">Defina quais técnicas serão ensinadas em cada aula do dia.</p>
      </div>
    </div>
  );
};

export default Curriculum;
