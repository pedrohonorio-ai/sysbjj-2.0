
import React from 'react';
import { ShoppingBag, TrendingUp, DollarSign, Package } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const BusinessHub: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Business <span className="text-blue-600">Hub</span></h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Gestão Comercial, Loja e Receitas Extras</p>
      </header>
      <div className="p-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 text-center">
        <Package size={48} className="text-blue-500 mx-auto mb-6" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Central de Negócios</h2>
        <p className="mt-4 text-slate-500 text-sm">Gerencie o estoque de kimonos, vendas de suplementos e seminários.</p>
      </div>
    </div>
  );
};

export default BusinessHub;
