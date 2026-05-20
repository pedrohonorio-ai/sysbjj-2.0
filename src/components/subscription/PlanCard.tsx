import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext.js';

interface PlanCardProps {
  subscription: {
    plan: string;
    monthlyPrice: number;
    maxStudents: number;
    currentStudents: number;
    usagePercent: number;
  };
}

const PlanCard: React.FC<PlanCardProps> = ({ subscription }) => {
  const { t } = useTranslation();
  
  const isNearLimit = subscription.usagePercent >= 80;
  const isAtLimit = subscription.usagePercent >= 100;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <ShieldCheck size={120} />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Status da Assinatura</p>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">🥋 Plano <span className="text-blue-500">{subscription.plan}</span></h3>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Mensalidade</p>
          <p className="text-lg font-black italic">R$ {subscription.monthlyPrice.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Zap size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capacidade de Alunos</p>
                <p className="text-xl font-black italic">{subscription.currentStudents} <span className="text-slate-600">/ {subscription.maxStudents === 999999 ? '∞' : subscription.maxStudents}</span></p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progresso</p>
             <p className={`text-xl font-black italic ${isAtLimit ? 'text-rose-500' : isNearLimit ? 'text-amber-500' : 'text-emerald-500'}`}>{Math.round(subscription.usagePercent)}%</p>
          </div>
        </div>

        <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${subscription.usagePercent}%` }}
            className={`h-full rounded-full ${isAtLimit ? 'bg-rose-600' : isNearLimit ? 'bg-amber-500' : 'bg-blue-600'}`}
          />
        </div>

        {isAtLimit ? (
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500">
             <AlertCircle size={20} />
             <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
               Límite atingido! O cadastro de novos alunos foi bloqueado. O upgrade para o próximo nível é automático ao expandir sua academia.
             </p>
          </div>
        ) : isNearLimit ? (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
             <TrendingUp size={20} />
             <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
               Atenção Sensei: Sua academia está crescendo rápido! Você está próximo do limite de {subscription.maxStudents} alunos.
             </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
             <ShieldCheck size={20} />
             <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
               Sua assinatura está operando em conformidade. O upgrade será automático conforme sua graduação no número de alunos.
             </p>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sincronização com Stripe: Pronta</span>
         </div>
         <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Upgrade Automático Ativo</p>
      </div>
    </div>
  );
};

export default PlanCard;
