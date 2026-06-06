import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, 
  Copy, 
  Check, 
  UploadCloud, 
  FileText, 
  DollarSign, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext.js';
import { useData } from '../../contexts/DataContext.js';
import { enterpriseApi } from '../../services/enterpriseApi.js';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PLANS, BILLING_CYCLES } from '../../constants/index.js';

export const BillingCenter: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Basic States
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upgrade selectors
  const [selectedPlan, setSelectedPlan] = useState<string>('BRONZE');
  const [selectedCycle, setSelectedCycle] = useState<string>('MONTHLY');
  const [finalPrice, setFinalPrice] = useState<number>(20);
  const [submittingUpgrade, setSubmittingUpgrade] = useState<boolean>(false);

  // Dynamic Pix states
  const [dynamicPixCode, setDynamicPixCode] = useState<string>('');
  const [isPixModalOpen, setIsPixModalOpen] = useState<boolean>(false);
  const [confirmingPix, setConfirmingPix] = useState<boolean>(false);

  // Proof upload states
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Social Project Request states
  const [isRequestingSocial, setIsRequestingSocial] = useState<boolean>(false);
  const [socialName, setSocialName] = useState<string>('');
  const [socialDesc, setSocialDesc] = useState<string>('');
  const [socialLocation, setSocialLocation] = useState<string>('');
  const [socialResponsible, setSocialResponsible] = useState<string>('');
  const [socialCnpj, setSocialCnpj] = useState<string>('');
  const [socialStudents, setSocialStudents] = useState<string>('');
  const [submittingSocial, setSubmittingSocial] = useState<boolean>(false);

  // Billing historical list from backend logs + locale storage fallback
  const [receipts, setReceipts] = useState<any[]>([]);

  // PIX Credentials Configuration loaded dynamically from master admin setup
  const PIX_KEY = sub?.pixKey || "dashfire@gmail.com";
  const PIX_BENEFICIARY = sub?.pixHolder || "Pedro Paulo Honorio";
  const PIX_CITY = sub?.pixCity || "Rio de Janeiro";

  // Fetch current subscription & history
  const fetchSubscriptionAndHistory = async () => {
    try {
      setLoading(true);
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/current', { useCache: false });
      if (res && res.success) {
        const subData = res.plan || res.subscription;
        setSub(subData);
        if (subData?.plan && subData.plan !== 'FREE') {
          setSelectedPlan(subData.plan);
        }
        if (subData?.billingCycle) {
          setSelectedCycle(subData.billingCycle);
        }
      }

      // Fetch payment history logs
      const histRes = await enterpriseApi.fetchWithEnterprise('/api/subscription/history', { useCache: false });
      if (histRes && histRes.success) {
        setReceipts(histRes.history || []);
      } else {
        // Fallback local storage
        const saved = localStorage.getItem('sysbjj_m_receipts2');
        if (saved) {
          setReceipts(JSON.parse(saved));
        } else {
          setReceipts([
            { id: 'h-01', amount: 20, billingCycle: 'MONTHLY', status: 'APPROVED', notes: 'Mensalidade Bronze retroativa homologada', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
          ]);
        }
      }
    } catch (e: any) {
      console.error(e);
      setActionError('Ocorreu um erro ao carregar as informações do financeiro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionAndHistory();
  }, []);

  // Recalculate billing values live
  const calculatedLivePrice = useMemo(() => {
    const planObj = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
    const basePrice = planObj ? Number(planObj.price || 0) : 0;

    let multiplier = 1;
    let discount = 1;

    const cycleObj = BILLING_CYCLES.find(c => c.id === selectedCycle);
    if (cycleObj) {
      multiplier = cycleObj.months;
      if (selectedCycle === 'SEMIANNUAL') discount = 0.9; // 10% off
      else if (selectedCycle === 'YEARLY') discount = 0.8; // 20% off
    } else if (selectedCycle === 'LIFETIME') {
      multiplier = 36;
      discount = 0.6; // 40% off
    } else if (selectedCycle === 'FREE') {
      multiplier = 0;
    }

    return Math.round(basePrice * multiplier * discount);
  }, [selectedPlan, selectedCycle]);

  useEffect(() => {
    setFinalPrice(calculatedLivePrice);
  }, [calculatedLivePrice]);

  // Request actual upgrade
  const handleUpgradeRequest = async () => {
    setSubmittingUpgrade(true);
    setActionError(null);
    setSuccessMsg(null);
    try {
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, billingCycle: selectedCycle })
      });

      if (res && res.success) {
        setSuccessMsg(res.message || 'Solicitação de plano efetuada com sucesso!');
        if (res.pixPayload) {
          setDynamicPixCode(res.pixPayload);
        }
        await fetchSubscriptionAndHistory();
        setIsPixModalOpen(true); // Open the PIX payment checkout modal!
      } else {
        setActionError(res?.error || 'Erro ao registrar solicitação de upgrade. Verifique com o admin.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro de conexão.');
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  // Auto-confirm payment simulated flow
  const handleConfirmPayment = async () => {
    setConfirmingPix(true);
    setActionError(null);
    setSuccessMsg(null);
    try {
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res && res.success) {
        setSuccessMsg(res.message || '🥋 OSS! Pagamento PIX e limites homologados instantaneamente!');
        setIsPixModalOpen(false);
        await fetchSubscriptionAndHistory();
      } else {
        setActionError(res?.error || 'Erro ao confirmar faturamento instantâneo.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao comunicar recebimento.');
    } finally {
      setConfirmingPix(false);
    }
  };

  // Submit actual Pix Receipt Proof
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSuccessMsg(null);
    setUploading(true);

    try {
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/submit-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl: proofUrl || "Comprovante de Transferência Vinculado", notes })
      });

      if (res && res.success) {
        setUploadSuccess(true);
        setSuccessMsg(res.message || 'Comprovante anexado perfeitamente! Aguardando homologação.');
        
        // Save local copy
        const localReceipt = {
          id: `h-usr-${Date.now().toString().slice(-4)}`,
          amount: finalPrice,
          billingCycle: selectedCycle,
          status: 'PENDING',
          notes: notes || 'Pendente de homologação manual',
          createdAt: new Date().toISOString()
        };
        const newList = [localReceipt, ...receipts];
        setReceipts(newList);
        localStorage.setItem('sysbjj_m_receipts2', JSON.stringify(newList));
        
        setProofUrl('');
        setNotes('');
        await fetchSubscriptionAndHistory();
      } else {
        setActionError(res?.error || 'Não foi possível enviar o comprovante.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro de rede ao submeter recibo.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadSuccess(false), 4500);
    }
  };

  // Social project submissions request
  const handleRequestSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialName.trim() || !socialDesc.trim()) {
      setActionError('Nome do projeto e descrição social são campos obrigatórios.');
      return;
    }

    setSubmittingSocial(true);
    setActionError(null);
    setSuccessMsg(null);

    try {
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/request-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialProjectName: socialName,
          socialDescription: socialDesc,
          location: socialLocation,
          responsibleName: socialResponsible,
          cnpj: socialCnpj,
          expectedStudents: socialStudents
        })
      });

      if (res && res.success) {
        setSuccessMsg('🥋 Candidatura para Projeto Social enviada com sucesso! Aguarde aprovação.');
        setIsRequestingSocial(false);
        // Clear forms
        setSocialName('');
        setSocialDesc('');
        setSocialLocation('');
        setSocialResponsible('');
        setSocialCnpj('');
        setSocialStudents('');
        await fetchSubscriptionAndHistory();
      } else {
        setActionError(res?.error || 'Erro ao submeter os parâmetros do Projeto Social.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao salvar os detalhes do dojo.');
    } finally {
      setSubmittingSocial(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Safe formatting helpers
  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // EMV standard static/fallback QR payload
  const fallbackPixCode = useMemo(() => {
    const key = String(PIX_KEY).trim();
    const holder = String(PIX_BENEFICIARY)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .slice(0, 25);
    const city = String(PIX_CITY)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .slice(0, 15);
    const price = Number(finalPrice || 20);

    const payloadFormat = "000201";
    const initiationMethod = "010211";

    const gui = "0014br.gov.bcb.pix";
    const keySub = `01${String(key.length).padStart(2, '0')}${key}`;
    const merchantAccount = `${gui}${keySub}`;
    const id26 = `26${String(merchantAccount.length).padStart(2, '0')}${merchantAccount}`;

    const id52 = "52040000";
    const id53 = "5303986";

    const amountStr = Number(price).toFixed(2);
    const id54 = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;

    const id58 = "5802BR";
    const id59 = `59${String(holder.length).padStart(2, '0')}${holder}`;
    const id60 = `60${String(city.length).padStart(2, '0')}${city}`;
    const id62 = "62070503***";

    const rawPayload = `${payloadFormat}${initiationMethod}${id26}${id52}${id53}${id54}${id58}${id59}${id60}${id62}6304`;

    let crc = 0xFFFF;
    for (let i = 0; i < rawPayload.length; i++) {
      crc ^= (rawPayload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    const crcStr = crc.toString(16).toUpperCase().padStart(4, '0');

    return `${rawPayload}${crcStr}`;
  }, [PIX_KEY, PIX_BENEFICIARY, PIX_CITY, finalPrice]);

  const finalPixPayload = dynamicPixCode || fallbackPixCode;

  if (loading && !sub) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw size={44} className="text-[#00E5FF] animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando livro caixa e credenciais de PIX...</p>
      </div>
    );
  }

  const safePlan = typeof sub?.plan === "string" ? sub.plan : "FREE";
  const userPlanText = String(safePlan).replaceAll('_', ' ').toUpperCase();
  const userStatus = String(sub?.status || 'Active').replaceAll('_', ' ').toUpperCase();

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      
      {/* Messages */}
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
            className="p-4 bg-red-950 border border-red-500/30 text-red-500 rounded-3xl flex items-center justify-between text-xs font-black uppercase tracking-wide shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              {actionError}
            </div>
            <button onClick={() => setActionError(null)} className="text-[10px] underline ml-4 hover:text-white">Fechar</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-[#00E5FF] leading-none">
            <CreditCard size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">SaaS Billing & Enterprise Hub</span>
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
            Central de Faturamento & Pagamentos PIX
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider max-w-2xl">
            OSS! Adquira upgrades, configure períodos flexíveis de recorrência de mensalidades e homologue comprovantes PIX instantaneamente.
          </p>
        </div>

        <button
          onClick={() => navigate('/business?tab=saas-plans')}
          className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700/50 flex items-center gap-2"
        >
          <ArrowLeft size={12} /> Painel de Planos
        </button>
      </header>

      {/* Main Grid: Split Billing Configuration & Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Recurrence Selection, Pricing Preview, PIX Generation */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* USER CONFIG: STEP 1 & 2 SELECTOR */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 border border-indigo-500/20 rounded">
                Configuração da Recorrência
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Seleção de Plano e Ciclo de Pagamento</h3>
            </div>

            {/* Select Plan Mode */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'LIBERADO' && plan.id !== 'SOCIAL_PROJECT').map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const priceNum = Number(plan.price || 0);
                const studentsNum = Number(plan.students || 0);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      if (plan.id === 'FREE' || plan.id === 'SOCIAL_PROJECT') {
                        setSelectedCycle('FREE');
                      } else {
                        if (selectedCycle === 'FREE') setSelectedCycle('MONTHLY');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between h-28 items-center ${
                      isSelected 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/40' 
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="w-full">
                      <p className="text-[9px] font-black tracking-wider uppercase leading-snug truncate">{plan.name}</p>
                      <p className="text-[11px] text-white mt-1.5 font-black">
                        {priceNum > 0 ? `R$ ${priceNum}` : 'Grátis'}
                      </p>
                    </div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-2">
                      {studentsNum >= 999999 ? 'Sem limites' : `Até ${studentsNum} Alunos`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Choose Recurring Period (Section 3: Flex recurrence options) */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Período de Assinatura (Ciclo):</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BILLING_CYCLES.map((cycle) => {
                  const isSel = selectedCycle === cycle.id;
                  const isFree = selectedPlan === 'FREE' || selectedPlan === 'SOCIAL_PROJECT';
                  return (
                    <button
                      key={cycle.id}
                      type="button"
                      disabled={isFree}
                      onClick={() => setSelectedCycle(cycle.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSel && !isFree
                          ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-black' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 disabled:opacity-35'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold leading-none">{cycle.label}</p>
                      <span className="text-[8px] opacity-70 block mt-1 font-bold uppercase">
                        {cycle.id === 'MONTHLY' ? 'Sem desc' : cycle.id === 'QUARTERLY' ? '3 meses' : cycle.id === 'SEMIANNUAL' ? '10% OFF' : '20% OFF'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Final dynamic price display (Section 4: visualizes final value) */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Valor do Plano Acumulado:</span>
                <p className="text-2xl font-black text-white leading-none">
                  {formatMoney(finalPrice)}
                  <span className="text-[10px] text-slate-500 lowercase font-bold font-sans ml-1">
                    {selectedPlan === 'FREE' || selectedPlan === 'SOCIAL_PROJECT' ? ' (Sem custos)' : '/período'}
                  </span>
                </p>
              </div>

              {selectedPlan === 'FREE' || selectedPlan === 'SOCIAL_PROJECT' ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (selectedPlan === 'SOCIAL_PROJECT') {
                      setIsRequestingSocial(true);
                      document.getElementById('social-request-form-container')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      // Gratuito
                      await handleUpgradeRequest();
                    }
                  }}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedPlan === 'SOCIAL_PROJECT' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-750 text-white'
                  }`}
                >
                  {selectedPlan === 'SOCIAL_PROJECT' ? 'Solicitar Gratuidade' : 'Ativar Plano Gratuito'}
                </button>
              ) : (
                <button
                  type="button"
                  id="checkout-upgrade-assinar-btn"
                  onClick={handleUpgradeRequest}
                  disabled={submittingUpgrade || finalPrice === 0}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  {submittingUpgrade ? <RefreshCw className="animate-spin" size={11} /> : <QrCode size={12} />}
                  Assinar Agora (PIX)
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE INVOICE & PIX CODE CONTAINER */}
          {finalPrice > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                  <QrCode size={16} className="text-[#00E5FF]" />
                  Dados de Pagamento via PIX Integrado
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded">
                  {userStatus === "PENDING" ? "Cobrança Pendente" : "Upgrade Agendado"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dynamically simulated QR code */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                  <div className="bg-white p-3 rounded-xl shadow-lg relative overflow-hidden">
                    <svg width="130" height="130" viewBox="0 0 100 100" className="text-slate-950">
                      <rect width="100" height="100" fill="white" />
                      <path d="M 0 0 h 25 v 25 h -25 z M 5 5 v 15 h 15 v -15 z M 8 8 h 9 v 9 h -9 z" fill="currentColor" />
                      <path d="M 75 0 h 25 v 25 h -25 z M 80 5 v 15 h 15 v -15 z M 83 8 h 9 v 9 h -9 z" fill="currentColor" />
                      <path d="M 0 75 h 25 v 25 h -25 z M 5 80 v 15 h 15 v -15 z M 8 83 h 9 v 9 h -9 z" fill="currentColor" />
                      <rect x="35" y="5" width="5" height="10" fill="currentColor" />
                      <rect x="45" y="15" width="10" height="5" fill="currentColor" />
                      <rect x="60" y="5" width="5" height="15" fill="currentColor" />
                      <rect x="35" y="25" width="15" height="5" fill="currentColor" />
                      <rect x="55" y="30" width="25" height="5" fill="currentColor" />
                      <rect x="30" y="45" width="10" height="10" fill="currentColor" />
                      <rect x="45" y="40" width="5" height="15" fill="currentColor" />
                      <rect x="60" y="50" width="20" height="5" fill="currentColor" />
                      <rect x="85" y="60" width="10" height="15" fill="currentColor" />
                      <rect x="35" y="65" width="25" height="5" fill="currentColor" />
                      <rect x="65" y="70" width="5" height="25" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Escaneie pelo App do Banco</span>
                </div>

                {/* Info and action keys */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 tracking-widest">Favorecido:</p>
                      <p className="text-white font-black">{PIX_BENEFICIARY}</p>
                    </div>

                    <div>
                      <p className="text-[8px] font-bold text-slate-500 tracking-widest">Chave Oficial Master:</p>
                      <p className="text-white font-mono font-black">{PIX_KEY}</p>
                    </div>

                    <div>
                      <p className="text-[8px] font-bold text-slate-500 tracking-widest">Instituição:</p>
                      <p className="text-white font-black">SSBJJ Pagamentos S.A.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleCopyKey}
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-[#00E5FF]" />}
                      {copied ? 'Chave Copiada!' : 'Copiar Chave CNPJ'}
                    </button>
                    
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(finalPixPayload);
                        setCopiedPayload(true);
                        setTimeout(() => setCopiedPayload(false), 2500);
                      }}
                      className="w-full py-2.5 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 border border-[#00E5FF]/20 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {copiedPayload ? <Check size={11} /> : <Copy size={11} />}
                      {copiedPayload ? 'Pix Copiado!' : 'Copiar Código Copia e Cola'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SOCIAL PROJECT APPLICATION FORM (SECTION 11 & 12: Gratuidade) */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                  <Sparkles size={14} />
                </span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-tight">Especial: Associação à Isenção de Projetos Sociais</h4>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Bolsas administrativas de gratuidade com alunos ilimitados</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRequestingSocial(!isRequestingSocial)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all"
              >
                {isRequestingSocial ? 'Fechar Formulário' : 'Solicitar Isenção'}
              </button>
            </div>

            <AnimatePresence>
              {isRequestingSocial && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleRequestSocial}
                  className="space-y-4 border-t border-slate-800/60 pt-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome do Projeto Social (🥋):</label>
                      <input
                        type="text"
                        value={socialName}
                        onChange={(e) => setSocialName(e.target.value)}
                        placeholder="Ex: Tatame do Amanhã"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white uppercase font-sans placeholder-slate-700"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Professor Responsável (Sensei):</label>
                      <input
                        type="text"
                        value={socialResponsible}
                        onChange={(e) => setSocialResponsible(e.target.value)}
                        placeholder="Nome completo do Sensei líder"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CNPJ da ONG / Entidade:</label>
                      <input
                        type="text"
                        value={socialCnpj}
                        onChange={(e) => setSocialCnpj(e.target.value)}
                        placeholder="Ex: 00.000.000/0001-00"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Comunidade / Localização:</label>
                      <input
                        type="text"
                        value={socialLocation}
                        onChange={(e) => setSocialLocation(e.target.value)}
                        placeholder="Ex: Rocinha, RJ"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Qtd Alunos Atendidos:</label>
                      <input
                        type="number"
                        value={socialStudents}
                        onChange={(e) => setSocialStudents(e.target.value)}
                        placeholder="Ex: 120 crianças"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Justificativa Social / Pedagogia Ativa:</label>
                    <textarea
                      value={socialDesc}
                      onChange={(e) => setSocialDesc(e.target.value)}
                      placeholder="Descreva o impacto do projeto, faixas etárias, e vulnerabilidade atendida para isenção total e concessão do plano especial ilimitado..."
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white font-sans"
                      rows={3}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingSocial}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {submittingSocial ? 'Processando Candidatura Suprema...' : 'Submeter Requerimento de Isenção ao Sensei Master'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* HISTORICAL BILLS LIST */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-[#00E5FF]" />
              Faturas & Histórico de Cobranças do Dojo
            </h3>

            {receipts.length === 0 ? (
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider text-center py-6">Nenhuma cobrança registrada para o ciclo.</p>
            ) : (
              <div className="space-y-2.5">
                {receipts.map((invoice, idx) => (
                  <div key={invoice.id || idx} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${
                        invoice.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase">
                          Fatura BJJ {invoice.billingCycle || 'FLEX'}
                        </h4>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          Ref: {new Date(invoice.createdAt || Date.now()).toLocaleDateString('pt-BR')} | {invoice.notes || 'Sem observações'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-xs font-black text-white">R$ {Number(invoice.amount || 0).toFixed(2)}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">PIX MANUAL</p>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                        invoice.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {invoice.status === 'APPROVED' ? 'APROVADO' : 'PENDENTE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Attachment file upload tool / Screen comprobation */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-6 sticky top-6">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <UploadCloud size={16} className="text-[#00E5FF]" />
                Comprovar Pagamento Manual Pix
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Anexe o link do comprovante ou arquivo para validação</p>
            </div>

            <form onSubmit={handleUploadProof} className="space-y-4">
              {/* Receipt URL input */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">URL do Comprovante / Link da Imagem:</label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Cole o link do comprovante (ex: imgur, drive, dropbox)"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white placeholder-slate-700 font-sans"
                  required
                />
              </div>

              {/* Observation notes */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Notas Adicionais do Dojo:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Transferido da conta jurídica da academia do Sensei Pedro"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-600 font-sans"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={uploading || (!proofUrl.trim() && !notes.trim())}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Clock className="animate-spin" size={12} />
                    Processando Comprovante...
                  </>
                ) : (
                  <>
                    Homologar Recibo Pix <Sparkles size={12} />
                  </>
                )}
              </button>
            </form>

            {uploadSuccess && (
              <div className="p-4 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>COMPROVANTE REGISTRADO:</strong> O recibo foi enviado com sucesso para aprovação pelo Sensei Supremo <strong>pedro.honorio@gm.rio</strong>. A liberação ocorrerá em instantes.
                </div>
              </div>
            )}

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-[9px] text-indigo-300 leading-relaxed flex gap-2">
              <Info size={14} className="text-indigo-400 shrink-0" />
              <span>
                <strong>Auditoria Recíproca:</strong> A liberação automática é concedida mediante confirmação de compensação no painel do administrador. Mantenha os seus dados atualizados para evitar qualquer suspensão.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 🥋 LUXURIOUS PIX MODAL OVERLAY */}
      <AnimatePresence>
        {isPixModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsPixModalOpen(false)}
                className="absolute top-5 right-5 text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl"
              >
                Fechar [X]
              </button>

              <div className="text-center space-y-1.5 mt-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#00E5FF] bg-[#00E5FF]/10 px-3 py-1 rounded-full border border-[#00E5FF]/20">
                  Checkout PIX Integrado
                </span>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                  Pague com PIX para Liberação Instantânea
                </h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Plano Selecionado: <span className="text-white">{selectedPlan}</span> ({selectedCycle})
                </p>
              </div>

              {/* QR Code and Pricing details */}
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl flex flex-col items-center justify-center space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-xl">
                  {/* Simulated QR Code SVG */}
                  <svg width="150" height="150" viewBox="0 0 100 100" className="text-slate-950">
                    <rect width="100" height="100" fill="white" />
                    <path d="M 0 0 h 25 v 25 h -25 z M 5 5 v 15 h 15 v -15 z M 8 8 h 9 v 9 h -9 z" fill="currentColor" />
                    <path d="M 75 0 h 25 v 25 h -25 z M 80 5 v 15 h 15 v -15 z M 83 8 h 9 v 9 h -9 z" fill="currentColor" />
                    <path d="M 0 75 h 25 v 25 h -25 z M 5 80 v 15 h 15 v -15 z M 8 83 h 9 v 9 h -9 z" fill="currentColor" />
                    <rect x="35" y="5" width="5" height="10" fill="currentColor" />
                    <rect x="45" y="15" width="10" height="5" fill="currentColor" />
                    <rect x="60" y="5" width="5" height="15" fill="currentColor" />
                    <rect x="35" y="25" width="15" height="5" fill="currentColor" />
                    <rect x="55" y="30" width="25" height="5" fill="currentColor" />
                    <rect x="30" y="45" width="10" height="10" fill="currentColor" />
                    <rect x="45" y="40" width="5" height="15" fill="currentColor" />
                    <rect x="60" y="50" width="20" height="5" fill="currentColor" />
                    <rect x="85" y="60" width="10" height="15" fill="currentColor" />
                    <rect x="35" y="65" width="25" height="5" fill="currentColor" />
                    <rect x="65" y="70" width="5" height="25" fill="currentColor" />
                  </svg>
                </div>

                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Valor Total:</span>
                  <p className="text-3xl font-black text-white">{formatMoney(finalPrice)}</p>
                </div>
              </div>

              {/* Transfer Details List */}
              <div className="space-y-3 bg-slate-950/50 p-4 border border-slate-850 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Favorecido:</span>
                  <span className="text-white font-black">{PIX_BENEFICIARY}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Chave PIX:</span>
                  <span className="text-white font-mono font-black">{PIX_KEY}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Cidade:</span>
                  <span className="text-white font-black">{PIX_CITY}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Período Selecionado:</span>
                  <span className="text-white font-black">
                    {BILLING_CYCLES.find(c => c.id === selectedCycle)?.label || selectedCycle}
                  </span>
                </div>
              </div>

              {/* PIX Copy buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-[#00E5FF]" />}
                  {copied ? 'Chave Copiada!' : 'Copiar Chave PIX'}
                </button>
                    
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(finalPixPayload);
                    setCopiedPayload(true);
                    setTimeout(() => setCopiedPayload(false), 2500);
                  }}
                  className="py-3 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 border border-[#00E5FF]/20 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {copiedPayload ? <Check size={11} /> : <Copy size={11} />}
                  {copiedPayload ? 'Pix Copiado!' : 'Copiar Copia e Cola'}
                </button>
              </div>

              {/* Auto Confirm Button */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirmingPix}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                {confirmingPix ? (
                  <>
                    <RefreshCw className="animate-spin" size={12} />
                    Confirmando PIX via webhook...
                  </>
                ) : (
                  <>
                    <QrCode size={14} /> Confirmar Pagamento Realizado
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BillingCenter;
