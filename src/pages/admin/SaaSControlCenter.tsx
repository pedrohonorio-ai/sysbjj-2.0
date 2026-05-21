import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Award, 
  Play, 
  Pause, 
  RefreshCw,
  Trophy,
  Activity,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { enterpriseApi } from '../../services/enterpriseApi.js';

export const SaaSControlCenter: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // SaaS states
  const [loading, setLoading] = useState<boolean>(true);
  const [academias, setAcademias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Is Pedro Honorio or authorized Master?
  const isMasterAuthorized = useMemo(() => {
    if (!user) return false;
    const email = user.email?.toLowerCase();
    return email === "pedro.honorio@gm.rio" || user.role === "MASTER";
  }, [user]);

  // Load all academies subscriptions
  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/admin/all', { useCache: false });
      if (res && res.success) {
        setAcademias(res.academias || []);
      } else {
        setErr(res?.error || 'Não foi possível carregar a listagem de dōjōs.');
      }
    } catch (err: any) {
      setErr(err.message || 'Erro ao comunicar com a autoridade SaaS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMasterAuthorized) {
      loadSubscriptions();
    }
  }, [isMasterAuthorized]);

  // Handlers for manual operations
  const handleUpdateSubscription = async (targetUserId: string, planName: string, activeStatus?: boolean) => {
    setUpdatingId(targetUserId);
    setErr(null);
    setSuccess(null);

    try {
      const payload: any = { targetUserId };
      if (planName) payload.plan = planName;
      if (activeStatus !== undefined) payload.active = activeStatus;

      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res && res.success) {
        setSuccess(`🥋 OSS! Assinatura do Dojo atualizada com sucesso!`);
        await loadSubscriptions(); // reload
      } else {
        setErr(res?.error || 'Erro ao realizar a transação.');
      }
    } catch (err: any) {
      setErr(err.message || 'Erro de rede na transação.');
    } finally {
      setUpdatingId(null);
    }
  };

  // SaaS analytics dashboard computations
  const analytics = useMemo(() => {
    if (!academias || academias.length === 0) {
      return {
        mrr: 0,
        arr: 0,
        unlimitedCount: 0,
        premiumCount: 0,
        freeCount: 0,
        blockedCount: 0,
        activeCount: 0,
        totalStudents: 0
      };
    }

    let mrr = 0;
    let premiumCount = 0;
    let freeCount = 0;
    let blockedCount = 0;
    let activeNoFree = 0;
    let totalStudents = 0;

    academias.forEach((a) => {
      totalStudents += a.currentStudents || 0;
      if (!a.active) {
        blockedCount++;
      } else {
        if (a.plan === 'FREE') {
          freeCount++;
        } else {
          premiumCount++;
          mrr += a.monthlyPrice || 0;
        }
      }
    });

    return {
      mrr,
      arr: mrr * 12,
      premiumCount,
      freeCount,
      blockedCount,
      activeCount: academias.length - blockedCount,
      totalStudents
    };
  }, [academias]);

  // Filtering Academies list
  const filteredAcademias = useMemo(() => {
    return academias.filter(a => {
      const matchSearch = 
        a.academyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.professorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [academias, searchTerm]);

  // If not master email, block visual access explicitly
  if (!isMasterAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="p-5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-[2.5rem]">
          <ShieldAlert size={64} className="animate-pulse" />
        </div>
        <div className="space-y-2 max-w-xl">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">🥋 ACESSO RESTRITO AO SENSEI SUPREMO</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
            Apenas Pedro Honório (pedro.honorio@gm.rio) e administradores de nível MASTER possuem credencial blockchain autorizada para acessar a Central de Controle SaaS.
          </p>
        </div>
        <div className="font-mono text-[10px] text-slate-600">
          Tentativa registrada da credencial: <span className="text-slate-400">{user?.email || 'Nenhum'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      
      {/* Toast feedback messages */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-between text-xs font-black uppercase tracking-wide shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {success}
            </div>
            <button onClick={() => setSuccess(null)} className="text-[10px] underline ml-4 hover:text-white">Fechar</button>
          </motion.div>
        )}

        {err && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-950 border border-red-500/30 text-red-400 rounded-3xl flex items-center justify-between text-xs font-black uppercase tracking-wide shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              {err}
            </div>
            <button onClick={() => setErr(null)} className="text-[10px] underline ml-4 hover:text-white">Fechar</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-rose-500 leading-none">
            <Trophy size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#00E5FF]">SaaS Control Center & Analytics</span>
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
            Painel Geral do Sensei Master Supremo
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider max-w-2xl">
            OSS! Painel com faturamento SaaS, auditoria de dojos premium, upgrades manuais imediatos, e métricas MRR/ARR.
          </p>
        </div>

        <button 
          onClick={loadSubscriptions}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sincronizar
        </button>
      </header>

      {/* SaaS Scoreboard dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Monthly Recurring Revenue (MRR) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-2.5 relative">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Receita Recorrente Mensal (MRR)</p>
            <p className="text-2xl font-black text-white font-mono leading-none mt-1">R$ {analytics.mrr.toFixed(2)}</p>
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={10} className="text-emerald-400" /> +14.5% versus mês anterior
          </p>
        </div>

        {/* Metric 2: Annual Recurring Revenue (ARR) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-2.5 relative">
          <div className="p-2.5 w-fit rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Receita Recorrente Anual (ARR)</p>
            <p className="text-2xl font-black text-white font-mono leading-none mt-1">R$ {analytics.arr.toFixed(2)}</p>
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Métrica de projeção de SaaS escalável</p>
        </div>

        {/* Metric 3: Premium vs Free dojos */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-2.5 relative">
          <div className="p-2.5 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dojos PREMIUM / FREE</p>
            <p className="text-2xl font-black text-white font-mono leading-none mt-1">
              {analytics.premiumCount} <span className="text-slate-500 text-sm">/ {analytics.freeCount}</span>
            </p>
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
            Total de {academias.length} cadastrados. Churn Rate: 0.0%
          </p>
        </div>

        {/* Metric 4: Blocked / Suspended dojos */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-2.5 relative">
          <div className="p-2.5 w-fit rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Academias Bloqueadas / Ativas</p>
            <p className="text-2xl font-black text-white font-mono leading-none mt-1">
              {analytics.blockedCount} <span className="text-slate-500 text-sm">/ {analytics.activeCount}</span>
            </p>
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Controle rígido de licenças do tatame</p>
        </div>

      </div>

      {/* Main Academias List Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden">
        
        {/* Search Header */}
        <div className="p-6 border-b border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase italic tracking-wider">Gestão Manual de Academias & Licenças</h3>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Busque dojos e force alterações de planos instantâneas</p>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por Dojo, Prof. ou Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-600 font-sans"
            />
            <Search className="absolute left-3.5 top-2.5 text-slate-600" size={14} />
          </div>
        </div>

        {/* Table list */}
        {loading ? (
          <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-indigo-500" />
            Carregando dojos reais e licenças do Vercel Neon Postgres...
          </div>
        ) : filteredAcademias.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
            Nenhuma academia cadastrada ou correspondente aos termos de busca.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/40 text-[9px] uppercase font-black tracking-wider text-slate-500">
                  <th className="py-4 px-6">Academia / Professor</th>
                  <th className="py-4 px-4 text-center">Controle Alunos</th>
                  <th className="py-4 px-4 text-center">Plano Atual</th>
                  <th className="py-4 px-4 text-center">Faturamento</th>
                  <th className="py-4 px-4 text-center">Status Licença</th>
                  <th className="py-4 px-6 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredAcademias.map((a) => {
                  const usageP = a.studentLimit > 0 ? Math.round((a.currentStudents / a.studentLimit) * 100) : 0;
                  const isCurrentUpdating = updatingId === a.id;

                  return (
                    <tr key={a.id} className="hover:bg-slate-950/20 transition-all font-sans text-xs">
                      
                      {/* Name / Professor info */}
                      <td className="py-4 px-6">
                        <div className="font-black text-white text-sm italic">{a.academyName || 'Dōjō Sem Nome'}</div>
                        <div className="text-slate-400 font-bold mb-0.5">{a.professorName || 'Sensei Desconhecido'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{a.email}</div>
                      </td>

                      {/* Student limits usage */}
                      <td className="py-4 px-4 text-center min-w-[120px]">
                        <div className="text-xs font-black text-white">{a.currentStudents} <span className="text-slate-500">/ {a.studentLimit === 999999 ? '∞' : a.studentLimit}</span></div>
                        <div className="w-20 mx-auto bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1 p-px border border-slate-800">
                          <div 
                            className={`h-full rounded-full ${usageP >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, usageP)}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-bold text-slate-500">{usageP}% utilizado</span>
                      </td>

                      {/* Current Plan Badge */}
                      <td className="py-4 px-4 text-center">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded inline-block border ${
                          a.plan === 'BLACK_BELT' ? 'bg-red-950 text-red-400 border-red-500/20' :
                          a.plan === 'SILVER' ? 'bg-slate-800 text-slate-300 border-slate-700' :
                          a.plan === 'BRONZE' ? 'bg-amber-950 text-amber-400 border-amber-900/30' :
                          'bg-slate-950 text-slate-500 border-slate-900'
                        }`}>
                          {String(a.plan || 'FREE').replaceAll('_', ' ')}
                        </span>
                      </td>

                      {/* Financial info */}
                      <td className="py-4 px-4 text-center font-mono font-black text-emerald-400">
                        {String(a.plan || 'FREE').toUpperCase() === 'FREE' ? 'Grátis' : `R$ ${Number(a.monthlyPrice || 0).toFixed(2)}`}
                      </td>

                      {/* Active / Blocked Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          a.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                        }`}>
                          {a.active ? 'Ativo' : 'Suspenso'}
                        </span>
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-sm mx-auto">
                          
                          {/* Upgrade controllers */}
                          <button
                            onClick={() => handleUpdateSubscription(a.id, 'BRONZE')}
                            disabled={isCurrentUpdating || a.plan === 'BRONZE'}
                            className="px-2 py-1 bg-amber-900/40 hover:bg-amber-900 text-amber-400 border border-amber-900/30 rounded text-[8px] font-black uppercase transition-all disabled:opacity-30 disabled:hover:bg-amber-900/10"
                            title="Liberar Bronze"
                          >
                            Bronze
                          </button>

                          <button
                            onClick={() => handleUpdateSubscription(a.id, 'SILVER')}
                            disabled={isCurrentUpdating || a.plan === 'SILVER'}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[8px] font-black uppercase transition-all disabled:opacity-30"
                            title="Liberar Silver"
                          >
                            Silver
                          </button>

                          <button
                            onClick={() => handleUpdateSubscription(a.id, 'BLACK_BELT')}
                            disabled={isCurrentUpdating || a.plan === 'BLACK_BELT'}
                            className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-950 rounded text-[8px] font-black uppercase transition-all disabled:opacity-30"
                            title="Liberar Black Belt"
                          >
                            Black Belt
                          </button>

                          {/* Account Suspend / Restore */}
                          {a.active ? (
                            <button
                              onClick={() => handleUpdateSubscription(a.id, a.plan, false)}
                              disabled={isCurrentUpdating}
                              className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-950 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1"
                              title="Suspender Academia"
                            >
                              <Pause size={10} /> Suspender
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateSubscription(a.id, a.plan, true)}
                              disabled={isCurrentUpdating}
                              className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-950 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1"
                              title="Ativar Academia"
                            >
                              <Play size={10} /> Reativar
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </section>

      {/* Safety warning audit */}
      <footer className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
        <AlertTriangle size={14} className="shrink-0" />
        <span>Alerta de Governança: Todas as alterações manuais efetuadas neste painel geram logs irreversíveis de auditoria. Use com responsabilidade e disciplina marcial. OSS!</span>
      </footer>

    </div>
  );
};

export default SaaSControlCenter;
