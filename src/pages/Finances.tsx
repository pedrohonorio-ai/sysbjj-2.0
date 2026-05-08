import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownLeft, Search, Filter, Calendar, Users, ShieldCheck, Download, AlertCircle, TrendingUp, Wallet, Receipt, Trash2, CheckCircle2, Plus, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import VerificationBadge from '../components/ui/VerificationBadge';

const Finances: React.FC = () => {
  const { payments, receipts, ledger, students, verifyLedgerIntegrity, addLedgerEntry } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'verified' | 'unverified'>('verified');

  const totalBalance = ledger.reduce((acc, curr) => acc + (curr.type === 'Income' || curr.type === 'StudentPayment' || curr.type === 'ExtraRevenue' ? curr.amount : -curr.amount), 0);
  const monthIncome = ledger.filter(l => ['Income', 'StudentPayment', 'ExtraRevenue'].includes(l.type)).reduce((acc, curr) => acc + curr.amount, 0);
  const monthExpense = ledger.filter(l => l.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);

  const runVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const ok = verifyLedgerIntegrity();
      setVerifyStatus(ok ? 'verified' : 'unverified');
      setIsVerifying(false);
    }, 1500);
  };

  const filteredLedger = ledger.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                          (filter === 'income' && ['Income', 'StudentPayment', 'ExtraRevenue'].includes(item.type)) || 
                          (filter === 'expense' && item.type === 'Expense');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Gestão <span className="text-blue-600">Financeira</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Controle de Fluxo de Caixa, Mensalidades e Auditoria</p>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
             <Download size={14} /> Exportar LEDGER
           </button>
           <button 
             onClick={() => setShowEntryModal(true)}
             className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-600/20"
           >
             <Plus size={14} /> Novo Lançamento
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Saldo Total', value: totalBalance, icon: <Wallet className="text-blue-600" />, trend: '+12.5%', color: 'text-blue-600' },
          { label: 'Receita Mensal', value: monthIncome, icon: <ArrowUpRight className="text-emerald-500" />, trend: '+5.2%', color: 'text-emerald-600' },
          { label: 'Despesas', value: monthExpense, icon: <ArrowDownLeft className="text-rose-500" />, trend: '-2.1%', color: 'text-rose-600' },
          { label: 'Aproveitamento', value: 94, isPercent: true, icon: <TrendingUp className="text-amber-500" />, trend: 'Meta 95%', color: 'text-amber-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-blue-600/10 transition-colors" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">{stat.icon}</div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.trend}</span>
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</h3>
              <p className={`text-2xl font-black italic mt-1 ${stat.color}`}>
                {stat.isPercent ? `${stat.value}%` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                    <Receipt size={24} className="text-blue-600" />
                    Histórico de Transações
                 </h2>
                 <VerificationBadge status={isVerifying ? 'verifying' : verifyStatus} />
               </div>
          <div className="flex flex-wrap items-center gap-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                 type="text" 
                 placeholder="Buscar transação..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-bold outline-none border border-transparent focus:border-blue-500/50 w-64"
               />
             </div>
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
               {(['all', 'income', 'expense'] as const).map((t) => (
                 <button
                   key={t}
                   onClick={() => setFilter(t)}
                   className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {t === 'all' ? 'Ver Tudo' : t === 'income' ? 'Entradas' : 'Saídas'}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="text-left py-4 px-4 font-black">Data</th>
                <th className="text-left py-4 px-4 font-black">Descrição</th>
                <th className="text-left py-4 px-4 font-black">Categoria</th>
                <th className="text-left py-4 px-4 font-black">Método</th>
                <th className="text-right py-4 px-4 font-black">Valor</th>
                <th className="text-center py-4 px-4 font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                     <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma transação encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                       <span className="text-[10px] font-bold text-slate-500">{format(item.timestamp, 'dd MMM, yyyy', { locale: ptBR })}</span>
                    </td>
                    <td className="py-4 px-4">
                       <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white">{item.description}</p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                       <span className="px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider">{item.category}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                       <div className="flex items-center gap-2">
                          <CreditCard size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-white uppercase">{item.method}</span>
                       </div>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                       <p className={`text-sm font-black italic ${['Income', 'StudentPayment', 'ExtraRevenue'].includes(item.type) ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {['Income', 'StudentPayment', 'ExtraRevenue'].includes(item.type) ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                       </p>
                    </td>
                    <td className="py-4 px-4">
                       <div className="flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="p-8 bg-blue-600 rounded-[3rem] text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all" />
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center">
                     <ShieldCheck size={32} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter italic">Ledger de Auditoria</h3>
                     <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">Conformidade e Transparência</p>
                  </div>
               </div>
               <p className="text-blue-100 text-sm font-medium leading-relaxed">
                  Todos os lançamentos financeiros são registrados em uma cadeia de auditoria sequencial. Qualquer alteração indevida será detectada pelo protocolo de integridade SYSBJJ.
               </p>
               <button 
                 onClick={runVerification}
                 disabled={isVerifying}
                 className="px-8 py-3 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl disabled:opacity-50"
               >
                  {isVerifying ? 'Codificando...' : 'Verificar Auditoria'}
               </button>
            </div>
         </div>

         <div className="p-8 bg-slate-900 rounded-[3rem] text-white border border-white/5 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mb-24 blur-3xl" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                <div className="flex justify-between items-start">
                   <h3 className="text-xl font-black uppercase tracking-tighter italic">Relatório de Inadimplência</h3>
                   <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-500/20">Atenção</span>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Mensalidades em Atraso</span>
                      <span className="text-lg font-black text-rose-500 italic">R$ 1.450,00</span>
                   </div>
                   <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '15%' }}
                        className="h-full bg-rose-500"
                      />
                   </div>
                   <p className="text-[10px] text-slate-500 font-medium">8 alunos pendentes. Recomendamos o envio de avisos automáticos via WhatsApp.</p>
                </div>
                <button className="w-full py-4 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all">
                   Visualizar Inadimplentes
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Finances;
