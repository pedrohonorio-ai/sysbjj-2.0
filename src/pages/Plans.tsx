import React from 'react';
import { motion } from 'motion/react';
import { Check, ShieldCheck, Zap, Star, Trophy, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext.js';

const Plans: React.FC = () => {
  const { t } = useTranslation();

  const plans = [
    {
      id: 'FREE',
      name: 'FREE',
      price: '0',
      limit: '20 Alunos',
      color: 'bg-slate-100 dark:bg-slate-800',
      textColor: 'text-slate-900 dark:text-white',
      accent: 'text-slate-500',
      features: [
        'Até 20 alunos cadastrados',
        'Gestão de Presença & Chamada',
        'Relatórios Básicos',
        'Acesso ao HUB de Ensino',
        'Suporte via Comunidade'
      ]
    },
    {
      id: 'BRONZE',
      name: 'BRONZE',
      price: '20',
      limit: '50 Alunos',
      color: 'bg-amber-100 dark:bg-amber-900/20',
      textColor: 'text-amber-900 dark:text-amber-500',
      accent: 'text-amber-600',
      features: [
        'Até 50 alunos cadastrados',
        'Backup Diário na Nuvem',
        'Relatórios Financeiros',
        'Biblioteca de Técnicas Full',
        'Auditoria Blockchain Ativa'
      ],
      popular: true
    },
    {
      id: 'SILVER',
      name: 'SILVER',
      price: '30',
      limit: '80 Alunos',
      color: 'bg-slate-200 dark:bg-slate-700/50',
      textColor: 'text-slate-900 dark:text-slate-300',
      accent: 'text-slate-500',
      features: [
        'Até 80 alunos cadastrados',
        'Selo de Integridade Premium',
        'Módulo de Business Hub',
        'Relatórios de LTV & Churn',
        'Suporte Prioritário OSS'
      ]
    },
    {
      id: 'BLACK_BELT',
      name: 'BLACK BELT',
      price: '50',
      limit: 'Ilimitado',
      color: 'bg-slate-900 text-white border-r-8 border-rose-600',
      textColor: 'text-white',
      accent: 'text-rose-500',
      features: [
        'Alunos ilimitados',
        'Sistema Multi-Professor',
        'Inteligência Preditiva IA',
        'Certificação SYSBJJ inclusa',
        'Treinamento VIP para Sensei'
      ],
      premium: true
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="text-center space-y-4">
        <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
          Planos de <span className="text-blue-600">Evolução</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-2xl mx-auto">
          O SYSBJJ 2.0 escala junto com a sua academia. Upgrades automáticos baseados no número de alunos cadastrados.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex flex-col p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 relative overflow-hidden group shadow-xl ${plan.id === 'BLACK_BELT' ? 'bg-slate-900 dark:bg-black text-white' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'}`}
          >
            {plan.popular && (
              <div className="absolute top-6 right-6 bg-blue-600 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white">
                Mais Popular
              </div>
            )}
            
            {plan.premium && (
              <div className="absolute top-6 right-6 bg-rose-600 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white flex items-center gap-1">
                <Trophy size={10} /> Elite Edition
              </div>
            )}

            <div className="mb-8">
              <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-4 ${plan.accent}`}>{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">R$</span>
                <span className="text-5xl font-black italic tracking-tighter">{plan.price}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">/mês</span>
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] bg-blue-500/10 text-blue-500 w-fit px-3 py-1 rounded-lg">
                Até {plan.limit}
              </p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-start gap-3">
                  <div className={`mt-1 p-0.5 rounded-full ${plan.premium ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    <Check size={12} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            <button className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${plan.premium ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02]'}`}>
              {plan.id === 'FREE' ? 'Começar Agora' : 'Saber Mais'}
              <ArrowUpRight size={14} />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-left">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Protocolo de Recálculo Automático</span>
             </div>
             <h2 className="text-3xl font-black italic uppercase tracking-tighter">Crescimento sem atrito</h2>
             <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-xl opacity-80">
               O SYSBJJ 2.0 monitora o volume de alunos em tempo real. Sempre que você ultrapassar o limite do seu plano atual, o sistema gradua sua conta automaticamente para o próximo nível no próximo ciclo de faturamento.
             </p>
          </div>
          <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl min-w-[280px]">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                   <Zap size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status do Sync</p>
                   <p className="text-sm font-black italic uppercase">OSS Cloud Ativa</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div animate={{ width: '65%' }} className="h-full bg-blue-600" />
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest text-center text-slate-500">Pronto para a evolução</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
