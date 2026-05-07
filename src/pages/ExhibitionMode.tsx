
import React from 'react';
import { Eye, Monitor } from 'lucide-react';

const ExhibitionMode: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black p-12 flex flex-col items-center justify-center">
      <Monitor size={64} className="text-blue-600 mb-8" />
      <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Modo Exibição</h1>
      <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-sm">Interface otimizada para TVs e Monitores no Tatame</p>
      <button className="mt-12 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest transition-all hover:scale-105">
        Ativar Fullscreen
      </button>
    </div>
  );
};

export default ExhibitionMode;
