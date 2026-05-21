import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  QrCode, 
  Award, 
  Trophy, 
  Clock, 
  Lock, 
  Unlock, 
  Users, 
  ArrowRight,
  Sparkles,
  CreditCard,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext.js';
import { useData } from '../../contexts/DataContext.js';
import { enterpriseApi } from '../../services/enterpriseApi.js';
import { useNavigate } from 'react-router-dom';

export const SubscriptionManager: React.FC = () => {
  const { t } = useTranslation();
  const { students } = useData();
  const navigate = useNavigate();

  // SaaS Subscription States
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [sub, setSub] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Load current subscription
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/current', { useCache: false });
      if (res && res.success) {
        setSub(res.plan || res.subscription);
      } else {
        setActionError(res?.error || 'Não foi possível carregar as informações do seu plano.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao comunicar com o servidor SSO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchSubscription();
  }, []);

  // Compute student count and warning indicators
  const currentStudentsCount = students.length;
  
  const usageStats = useMemo(() => {
    if (!sub) return { limit: 20, count: currentStudentsCount, percent: 0, alert: 'none' };
    
    const limit = sub.studentLimit || sub.maxStudents || 20;
    const count = currentStudentsCount;
    const percent = Math.min(100, Math.round((count / limit) * 100));
    
    let alert: 'none' | 'warning' | 'critical' | 'blocked' = 'none';
    if (percent >= 100) alert = 'blocked';
    else if (percent >= 90) alert = 'critical';
    else if (percent >= 80) alert = 'warning';
    
    return { limit, count, percent, alert };
  }, [sub, currentStudentsCount]);

  // Official plans configuration
  const officialPlans = [
    {
      id: 'FREE',
      name: 'FREE',
      price: 0,
      studentLimit: 20,
      badge: 'Básico',
      accent: 'text-slate-400',
      bgColor: 'bg-slate-950/40 border-slate-800',
      tagline: 'Ideal para professores iniciando seu primeiro dojo.',
      features: [
        'Até 20 alunos ativos',
        'Gestão de treinos & chamada',
        'Grade de horários básica',
        'Presença em tempo real',
        'Visualização estática'
      ]
    },
    {
      id: 'BRONZE',
      name: 'BRONZE',
      price: 20,
      studentLimit: 50,
      badge: 'Popular',
      accent: 'text-amber-500',
      bgColor: 'bg-amber-950/10 border-amber-900/30 ring-1 ring-amber-500/20',
      tagline: 'Para academias em consolidação e crescimento constante.',
      features: [
        'Até 50 alunos ativos',
        'Relatórios de caixa básicos',
        'Controle financeiro integrado',
        'Biblioteca completa de técnicas',
        'Selo bronze de integridade'
      ]
    },
    {
      id: 'SILVER',
      name: 'SILVER',
      price: 30,
      studentLimit: 80,
      badge: 'Profissional',
      accent: 'text-slate-300',
      bgColor: 'bg-slate-900/40 border-slate-700/50',
      tagline: 'Para grandes dojos que exigem escala e gestão sólida.',
      features: [
        'Até 80 alunos ativos',
        'Business Hub (LTV & Churn)',
        'Notificações adicionais',
        'Suporte prioritário do Sensei',
        'Indicadores de presença reais'
      ]
    },
    {
      id: 'BLACK_BELT',
      name: 'BLACK BELT',
      price: 50,
      studentLimit: 999999,
      badge: 'Elite',
      accent: 'text-red-500 font-extrabold',
      bgColor: 'border-red-600/50 bg-radial-gradient bg-slate-950 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      tagline: 'Acesso total sem restrições. O ápice do ecossistema.',
      features: [
        'Alunos e cadastros ILIMITADOS',
        'Certificação SYSBJJ inclusa',
        'Inteligência Preditiva IA ativa',
        'Suporte VIP via WhatsApp',
        'Sistema multi-professor completo'
      ]
    }
  ];

  // Handle plan upgrade or downgrade
  const handlePlanChange = async (planId: string, currentPlan: string) => {
    // Determine action
    const currentPrice = officialPlans.find(p => p.id === currentPlan)?.price || 0;
    const targetPrice = officialPlans.find(p => p.id === planId)?.price || 0;
    
    const isUpgrade = targetPrice > currentPrice;
    const endpoint = isUpgrade ? '/api/subscription/upgrade' : '/api/subscription/downgrade';
    
    setSubmitting(planId);
    setActionError(null);
    setSuccessMsg(null);

    try {
      const res = await enterpriseApi.fetchWithEnterprise(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });
      if (res && res.success) {
        setSuccessMsg(`🥋 OSS! Seu plano foi alterado com sucesso de ${currentPlan} para ${planId}.`);
        await fetchSubscription(); 
      } else {
        setActionError(res?.error || 'Não foi possível alterar sua assinatura. Verifique possíveis limites excedidos.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro de rede ao trocar de plano.');
    } finally {
      setSubmitting(null);
    }
  };

  // Safe formatting helpers
  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading && !sub) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw size={44} className="text-indigo-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Calculando licença e fluxo do Dojo...</p>
      </div>
    );
  }

  const currentPlanId = String(sub?.plan || 'FREE').replaceAll('_', ' ').toUpperCase();

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-between text-xs font-black uppercase tracking-wide shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {successMsg}
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-[10px] underline ml-4 hover:text-white">Fechar</button>
          </motion.div>
        )}

        {actionError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-950 border border-red-500/30 text-red-400 rounded-3xl flex items-center justify-between text-xs font-black uppercase tracking-wide shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              {actionError}
            </div>
            <button onClick={() => setActionError(null)} className="text-[10px] underline ml-4 hover:text-white">Fechar</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Display Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-400 leading-none">
            <Sparkles size={14} className="animate-spin" />
            <span className="text-[9px] font-black uppercase tracking-widest">SaaS Billing Core</span>
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
            Gerenciamento de Assinatura & Planos de Evolução
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider max-w-2xl">
            OSS! Acompanhe o status do seu plano, limites, e faça upgrade de forma automática e integrada no Neon Postgres.
          </p>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all self-center border border-slate-700/50"
        >
          Configurações Gerais
        </button>
      </header>

      {/* Subscription Status Dashboard Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Metric panel 1: Plan Status Map */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] lg:col-span-8 space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-2xl">
                <Award size={24} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Assinatura Atual</p>
                <h3 className="text-xl font-black text-white uppercase italic leading-none flex items-center gap-2">
                  Plano {currentPlanId}
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${
                    sub?.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {sub?.active ? 'ATIVO' : 'SUSPENSO'}
                  </span>
                </h3>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Preço Mensal</p>
              <p className="text-2xl font-black text-white leading-none mt-0.5">
                {formatMoney(sub?.monthlyPrice || 0)}
              </p>
            </div>
          </div>

          {/* Student limit usage meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users size={14} className="text-indigo-400" />
                Saturação do Limite de Alunos
              </span>
              <span className="text-white font-black">{usageStats.count} / {usageStats.limit === 999999 ? 'Ilimitado' : usageStats.limit}</span>
            </div>

            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${usageStats.percent}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  usageStats.alert === 'blocked' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                  usageStats.alert === 'critical' ? 'bg-amber-500' :
                  usageStats.alert === 'warning' ? 'bg-yellow-400' :
                  'bg-emerald-500'
                }`}
              />
            </div>

            <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest pt-1">
              <span>0%</span>
              <span className={usageStats.percent > 80 ? "text-amber-400" : ""}>{usageStats.percent}% utilizado</span>
              <span>100%</span>
            </div>
          </div>

          {/* Alerts warnings system */}
          <AnimatePresence mode="wait">
            {usageStats.alert === 'blocked' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong>🥋 BLOQUEIO OPERACIONAL COMPACTO:</strong> Você atingiu seu limite total de <strong>{usageStats.limit} alunos</strong>. Novos cadastros estão bloqueados. Faça upgrade abaixo para liberar o cadastro de novos alunos.
                </div>
              </motion.div>
            )}
            
            {usageStats.alert === 'critical' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>🥋 ALERTA DE CAPACIDADE (90%+):</strong> Capaz de novos cadastros limite iminente! Considere migrar para o próximo plano para evitar bloqueios ao matricular novos alunos.
                </div>
              </motion.div>
            )}

            {usageStats.alert === 'warning' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
                <div>
                  <strong>Aviso de Escala (80%+):</strong> Seu dōjō está crescendo rapidamente! Você já preencheu 80% do limite máximo do seu plano.
                </div>
              </motion.div>
            )}

            {usageStats.alert === 'none' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-300/80 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <div>
                  Sua conta está operando com total integridade e em conformidade. Há espaço suficiente para mais matrículas. OSS!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Metric panel 2: Active Billing Info */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Clock size={16} className="text-indigo-400" />
              Próximo Faturamento
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Próxima Cobrança:</span>
                <span className="text-white font-black">{sub?.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString('pt-BR') : '21/06/2026'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Ativado Em:</span>
                <span className="text-white font-semibold">{sub?.startedAt ? new Date(sub.startedAt).toLocaleDateString('pt-BR') : '21/05/2026'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Método Oficial:</span>
                <span className="text-emerald-400 font-black flex items-center gap-1 uppercase text-[10px]">
                  <QrCode size={12} /> PIX Manual
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Renovação:</span>
                <span className="text-slate-200 font-black flex items-center gap-1 uppercase text-[10px]">
                  Ativada (Auto)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/billing')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <CreditCard size={14} />
            Acessar Central de Faturas & PIX
          </button>
        </div>
      </div>

      {/* Visual Cards Grid for SaaS Plan Selection */}
      <section className="space-y-6">
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Grade Oficial de Planos SYSBJJ 2.0</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Escolha a melhor estrutura para escalar sua gestão</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {officialPlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const currentPrice = officialPlans.find(p => p.id === currentPlanId)?.price || 0;
            const isUpgrade = plan.price > currentPrice;
            const isDowngrade = plan.price < currentPrice;

            return (
              <div 
                key={plan.id}
                className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between ${plan.bgColor} ${
                  isCurrent ? 'ring-2 ring-indigo-500 bg-indigo-950/10' : ''
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                      {plan.badge}
                    </span>
                    {isCurrent && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500 text-white px-2 py-0.5 rounded leading-none flex items-center gap-1">
                        <Check size={10} /> Seu Plano
                      </span>
                    )}
                  </div>

                  <h3 className={`text-base font-black tracking-wider uppercase mb-1 ${plan.accent}`}>{String(plan.name || '').replaceAll('_', ' ').toUpperCase()}</h3>
                  <p className="text-[9px] text-slate-400 leading-snug mb-4">{plan.tagline}</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-[10px] font-black text-slate-500">R$</span>
                    <span className="text-4xl font-black text-white italic tracking-tighter leading-none">{plan.price}</span>
                    <span className="text-[9px] font-bold text-slate-500 lowercase">/mês</span>
                  </div>

                  <div className="py-2.5 px-3 bg-slate-950/40 border border-slate-900 rounded-xl mb-6 text-[10px] uppercase font-black text-white flex justify-between items-center">
                    <span className="text-slate-500 text-[8px] tracking-wider">LIMITE:</span>
                    <span>{plan.studentLimit === 999999 ? 'Ilimitado' : `${plan.studentLimit} Alunos`}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-[10px] leading-normal text-slate-300">
                        <span className="p-0.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                          <Check size={10} />
                        </span>
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePlanChange(plan.id, currentPlanId)}
                  disabled={isCurrent || submitting !== null}
                  className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800' 
                      : submitting === plan.id
                        ? 'bg-indigo-600/30 text-indigo-200 cursor-not-allowed'
                        : isUpgrade
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border border-indigo-500/40 hover:scale-[1.02]'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/50 hover:scale-[1.02]'
                  }`}
                >
                  {submitting === plan.id ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Processando...
                    </>
                  ) : isCurrent ? (
                    'Plano Ativo'
                  ) : isUpgrade ? (
                    <>
                      Fazer Upgrade <Sparkles size={11} />
                    </>
                  ) : (
                    'Fazer Downgrade'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Manual PIX Integration & Info Guard */}
      <footer className="bg-slate-900 border border-slate-850 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-red-600/15 text-red-500 border border-red-500/10 rounded-2xl shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-white uppercase tracking-tight">Política Recíproca de Cobrança do Tatame</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-w-2xl">
              Nossos serviços são prestados em formato SaaS. Os limites de alunos são estritamente auditados. Após upgrade, as faturas e QrCodes correspondentes para liquidação manual são emitidas e ficam sob consulta na sua central de faturamento. Nenhum dado ou aluno é excluído permanentemente caso sua conta sofra alteração de plano.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/billing')}
          className="px-6 py-3.5 bg-slate-950 border border-slate-800 shadow-md hover:bg-slate-900 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-[#00E5FF] flex items-center gap-1.5 shrink-0 self-center"
        >
          <QrCode size={14} /> Pagar com PIX
        </button>
      </footer>

    </div>
  );
};

export default SubscriptionManager;
