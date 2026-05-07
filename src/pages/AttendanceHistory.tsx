
import React from 'react';
import { Calendar, History } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const AttendanceHistory: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Histórico de <span className="text-blue-600">Chamadas</span></h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Registro Cronológico de Presenças</p>
      </header>
      <div className="p-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 text-center">
        <History size={48} className="text-blue-500 mx-auto mb-6" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Linha do Tempo</h2>
        <p className="mt-4 text-slate-500 text-sm">Visualize o histórico completo de presenças da sua academia.</p>
      </div>
    </div>
  );
};

export default AttendanceHistory;
