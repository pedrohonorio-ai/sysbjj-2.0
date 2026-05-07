
import React from 'react';
import { motion } from 'motion/react';
import { Shield, BookOpen, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const IBJJFRules: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
          Regras <span className="text-blue-600">IBJJF</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
          Manual de Normas, Condutas e Pontuação Oficial
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Quedas', points: '2 Pts', icon: <Info /> },
          { title: 'Passagem', points: '3 Pts', icon: <Shield /> },
          { title: 'Joelho na Barriga', points: '2 Pts', icon: <CheckCircle2 /> },
          { title: 'Montada / Costas', points: '4 Pts', icon: <BookOpen /> },
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl">
             <div className="text-blue-500 mb-4">{item.icon}</div>
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.title}</h3>
             <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{item.points}</p>
          </div>
        ))}
      </div>

      <div className="p-12 bg-slate-900 rounded-[3rem] border border-white/5 text-center">
        <AlertTriangle size={48} className="text-amber-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Módulo em Atualização</h2>
        <p className="mt-4 text-slate-400 max-w-md mx-auto text-sm font-medium leading-relaxed">
          O manual completo de regras da IBJJF está sendo sincronizado com a versão 2026. Em breve, todos os vídeos explicativos estarão disponíveis aqui.
        </p>
      </div>
    </div>
  );
};

export default IBJJFRules;
