
import React from 'react';
import { Award, Star } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const BeltSystem: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Sistema de <span className="text-blue-600">Graduação</span></h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Evolução Técnica e Requisitos de Faixa</p>
      </header>
      <div className="p-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 text-center">
        <Award size={48} className="text-blue-500 mx-auto mb-6" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Jornada do Conhecimento</h2>
        <p className="mt-4 text-slate-500 text-sm">Acompanhe quem está apto para a próxima graduação baseado em meritocracia.</p>
      </div>
    </div>
  );
};

export default BeltSystem;
