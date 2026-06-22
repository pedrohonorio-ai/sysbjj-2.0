import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Plus, 
  Star, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  Search, 
  Filter, 
  ShoppingCart, 
  Tag, 
  BarChart3, 
  PieChart, 
  Users, 
  Target, 
  Activity, 
  RefreshCw, 
  X, 
  Trash2, 
  QrCode, 
  Award, 
  Trophy, 
  Ticket, 
  Clock, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Sparkles, 
  CreditCard, 
  Wallet, 
  Receipt, 
  AlertTriangle, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  ArrowDownLeft 
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useData } from '../contexts/DataContext.js';
import { motion, AnimatePresence } from 'motion/react';
import { ExtraRevenueCategory, StudentStatus } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import VerificationBadge from '../components/ui/VerificationBadge.js';
import { SUBSCRIPTION_PLANS } from '../constants/index.js';
import { enterpriseApi } from '../services/enterpriseApi.js';
import RaffleModule from '../components/RaffleModule.js';

interface BusinessHubProps {
  defaultTab?: 'shop' | 'orders' | 'raffle' | 'plans' | 'finances' | 'saas-plans' | 'reports';
}

const BusinessHub: React.FC<BusinessHubProps> = ({ defaultTab }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { 
    products, 
    plans, 
    ledger, 
    addProduct, 
    addPlan, 
    addExtraRevenue, 
    orders, 
    updateOrder, 
    deleteOrder, 
    addOrder, 
    students, 
    deleteProduct,
    verifyLedgerIntegrity,
    addLedgerEntry,
    deleteLedgerEntry
  } = useData();

  // Detect initial tab based on search param, prop path, or router. Default to 'shop'
  const getInitialTab = (): 'shop' | 'orders' | 'raffle' | 'plans' | 'finances' | 'saas-plans' | 'reports' => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['shop', 'orders', 'raffle', 'plans', 'finances', 'saas-plans', 'reports'].includes(tabParam)) {
      return tabParam as any;
    }
    if (defaultTab) return defaultTab;
    if (location.pathname === '/finances') return 'finances';
    if (location.pathname === '/plans' || location.pathname === '/billing') return 'saas-plans';
    return 'shop';
  };

  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'raffle' | 'plans' | 'finances' | 'saas-plans' | 'reports'>(getInitialTab());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Shop states
  const [showQuickSale, setShowQuickSale] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Finances states
  const [financeSearchTerm, setFinanceSearchTerm] = useState('');
  const [financeFilter, setFinanceFilter] = useState<'all' | 'income' | 'expense' | 'test'>('all');
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'verified' | 'unverified'>('verified');

  // New finance entry state
  const [newEntryType, setNewEntryType] = useState<'Income' | 'Expense'>('Income');
  const [newEntryAmount, setNewEntryAmount] = useState<string>('');
  const [newEntryDescription, setNewEntryDescription] = useState('');
  const [newEntryCategory, setNewEntryCategory] = useState('Mensalidade');
  const [newEntryMethod, setNewEntryMethod] = useState('Pix');
  const [newEntryStudentId, setNewEntryStudentId] = useState('');
  const [newEntryIsTeste, setNewEntryIsTeste] = useState(false);

  // SaaS states
  const [loadingSaas, setLoadingSaas] = useState<boolean>(true);
  const [submittingSaas, setSubmittingSaas] = useState<string | null>(null);
  const [sub, setSub] = useState<any>(null);
  const [saasError, setSaasError] = useState<string | null>(null);
  const [saasSuccess, setSaasSuccess] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // BI state
  const [biData, setBiData] = useState<any>(null);
  const [loadingBi, setLoadingBi] = useState(false);

  // Synced tab changer
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname, location.search, defaultTab]);

  useEffect(() => {
    if (activeTab === 'reports' && user?.id) {
      loadBi();
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab === 'saas-plans') {
      fetchSubscription();
    }
  }, [activeTab]);

  const loadBi = async () => {
    if (!user?.id) return;
    setLoadingBi(true);
    try {
      const res = await api.fetchBI(user.id);
      if (res && res.data) setBiData(res.data);
    } catch (e) {
      console.error("🥋 [BI ERROR]:", e);
    } finally {
      setLoadingBi(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      setLoadingSaas(true);
      setSaasError(null);
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/current', { useCache: false });
      if (res && res.success) {
        setSub(res.plan || res.subscription);
      } else {
        setSaasError(res?.error || 'Não foi possível carregar as informações do seu plano de licença.');
      }
    } catch (err: any) {
      setSaasError(err.message || 'Erro ao comunicar com o servidor de licenças SSO.');
    } finally {
      setLoadingSaas(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    monthlyRevenue: ledger.filter(e => ['Income', 'StudentPayment', 'ExtraRevenue'].includes(e.type)).reduce((acc, e) => acc + e.amount, 0),
    stockCount: products.reduce((acc, p) => acc + (p.stock || 0), 0),
    pendingOrders: orders.filter(o => o.status === 'Pending' || o.status === 'Ordered').length
  };

  // Finances chart & metrics calculation
  const getChartData = () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayIncome = ledger
        .filter(l => isSameDay(new Date(l.timestamp), day) && ['Income', 'StudentPayment', 'ExtraRevenue'].includes(l.type))
        .reduce((acc, curr) => acc + curr.amount, 0);
      const dayExpense = ledger
        .filter(l => isSameDay(new Date(l.timestamp), day) && l.type === 'Expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

      return {
        name: format(day, 'dd'),
        income: dayIncome,
        expenses: dayExpense,
        balance: dayIncome - dayExpense
      };
    });
  };

  const chartData = getChartData();
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const startOfLastMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const endOfLastMonth = endOfMonth(startOfLastMonth);

  const currentMonthLedger = ledger.filter(l => new Date(l.timestamp) >= startOfThisMonth);
  const monthIncome = currentMonthLedger.filter(l => ['Income', 'StudentPayment', 'ExtraRevenue'].includes(l.type)).reduce((acc, curr) => acc + curr.amount, 0);
  const monthExpense = currentMonthLedger.filter(l => l.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);

  const prevMonthLedger = ledger.filter(l => {
    const d = new Date(l.timestamp);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  });
  const prevMonthIncome = prevMonthLedger.filter(l => ['Income', 'StudentPayment', 'ExtraRevenue'].includes(l.type)).reduce((acc, curr) => acc + curr.amount, 0);
  const prevMonthExpense = prevMonthLedger.filter(l => l.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);

  const incomeGrowth = prevMonthIncome > 0 ? ((monthIncome - prevMonthIncome) / prevMonthIncome) * 100 : (monthIncome > 0 ? 100 : 0);
  const expenseGrowth = prevMonthExpense > 0 ? ((monthExpense - prevMonthExpense) / prevMonthExpense) * 100 : (monthExpense > 0 ? 100 : 0);

  const totalBalance = ledger.reduce((acc, curr) => acc + (['Income', 'StudentPayment', 'ExtraRevenue'].includes(curr.type) ? curr.amount : -curr.amount), 0);

  const runVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const ok = verifyLedgerIntegrity();
      setVerifyStatus(ok ? 'verified' : 'unverified');
      setIsVerifying(false);
    }, 1500);
  };

  const filteredLedger = ledger.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(financeSearchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(financeSearchTerm.toLowerCase());
    const matchesFilter = financeFilter === 'all' || 
                          (financeFilter === 'income' && ['Income', 'StudentPayment', 'ExtraRevenue'].includes(item.type)) || 
                          (financeFilter === 'expense' && item.type === 'Expense') ||
                          (financeFilter === 'test' && item.isTeste === true);
    return matchesSearch && matchesFilter;
  });

  const overdueStudentsFiltered = students.filter(s => s.status === StudentStatus.OVERDUE);
  const overdueAmount = overdueStudentsFiltered.reduce((acc, s) => acc + (s.monthlyValue || 0), 0);
  const overdueCount = overdueStudentsFiltered.length;
  const totalStudentsCount = students.length;
  const overduePercentage = totalStudentsCount > 0 ? (overdueCount / totalStudentsCount) * 100 : 0;

  // SaaS Upgrades & dynamic limitations compute
  const currentStudentsCount = students.length;
  
  const usageStats = useMemo(() => {
    if (!sub) return { limit: 20, count: currentStudentsCount, percent: 0, alert: 'none' as const };
    
    const limit = sub.studentLimit || sub.maxStudents || 20;
    const count = currentStudentsCount;
    const percent = Math.min(100, Math.round((count / limit) * 100));
    
    let alert: 'none' | 'warning' | 'critical' | 'blocked' = 'none';
    if (percent >= 100) alert = 'blocked';
    else if (percent >= 90) alert = 'critical';
    else if (percent >= 80) alert = 'warning';
    
    return { limit, count, percent, alert };
  }, [sub, currentStudentsCount]);

  const officialPlans = useMemo(() => {
    return SUBSCRIPTION_PLANS.filter(p => p.id !== 'LIBERADO' && p.id !== 'SOCIAL_PROJECT').map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      studentLimit: Number(p.students || 0),
      badge: p.id === 'FREE' ? 'Básico' : p.id === 'BRONZE' ? 'Popular' : p.id === 'SILVER' ? 'Profis.' : p.id === 'BLACK_BELT' ? 'Elite' : 'Social',
      accent: p.id === 'FREE' ? 'text-slate-400' : p.id === 'BRONZE' ? 'text-amber-500' : p.id === 'SILVER' ? 'text-slate-300' : p.id === 'BLACK_BELT' ? 'text-red-500 font-extrabold' : 'text-emerald-450 font-bold',
      bgColor: p.id === 'FREE' ? 'bg-slate-950/40 border-slate-800' : p.id === 'BRONZE' ? 'bg-amber-950/15 border-amber-900/30' : p.id === 'SILVER' ? 'bg-slate-900/40 border-slate-700/50' : p.id === 'BLACK_BELT' ? 'border-red-650/40 bg-radial bg-slate-950/90 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-emerald-950/15 border-emerald-900/30',
      tagline: p.tagline,
      features: p.features
    }));
  }, []);

  const handlePlanChange = async (planId: string, currentPlan: string) => {
    const currentPrice = officialPlans.find(p => p.id === currentPlan)?.price || 0;
    const targetPrice = officialPlans.find(p => p.id === planId)?.price || 0;
    
    const isUpgrade = targetPrice > currentPrice;
    const endpoint = isUpgrade ? '/api/subscription/upgrade' : '/api/subscription/downgrade';
    
    setSubmittingSaas(planId);
    setSaasError(null);
    setSaasSuccess(null);

    try {
      const res = await enterpriseApi.fetchWithEnterprise(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });
      if (res && res.success) {
        setSaasSuccess(`🥋 OSS! Alteração efetuada com sucesso de ${currentPlan} para ${planId}.`);
        await fetchSubscription(); 
      } else {
        setSaasError(res?.error || 'Não foi possível alterar sua assinatura. Limite de alunos ou condições restritivas impediram a troca.');
      }
    } catch (err: any) {
      setSaasError(err.message || 'Erro de conexão SSO ao processar upgrade de plano.');
    } finally {
      setSubmittingSaas(null);
    }
  };

  const handleAddFinanceEntry = () => {
    const amt = parseFloat(newEntryAmount);
    if (!amt || isNaN(amt)) {
      alert('🥋 OSS: Digite um valor numérico válido.');
      return;
    }

    if (!newEntryDescription.trim()) {
      alert('🥋 OSS: A descrição é obrigatória.');
      return;
    }

    addLedgerEntry({
      type: newEntryType,
      amount: amt,
      description: newEntryDescription,
      category: newEntryCategory,
      method: newEntryMethod,
      studentId: newEntryStudentId || undefined,
      isTeste: newEntryIsTeste
    });

    // Reset and close
    setNewEntryAmount('');
    setNewEntryDescription('');
    setNewEntryStudentId('');
    setNewEntryIsTeste(false);
    setShowFinanceModal(false);
    alert('🥋 Lançamento financeiro registrado com sucesso no Blockchain de Auditoria!');
  };

  const handleClearTestEntries = () => {
    const testEntries = ledger.filter(item => item.isTeste === true);
    if (testEntries.length === 0) {
      alert('🥋 OSS: Nenhum lançamento de teste encontrado para limpar.');
      return;
    }
    const confirmed = window.confirm(`🥋 Deseja realmente excluir ${testEntries.length} lançamentos de teste? Esta ação é irreversível.`);
    if (confirmed) {
      testEntries.forEach(item => {
        deleteLedgerEntry(item.id);
      });
      alert('🥋 OSS: Todos os lançamentos de teste foram removidos do sistema!');
    }
  };

  const currentPlanId = String(sub?.plan || 'FREE').replaceAll('_', ' ').toUpperCase();

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header Unificado & Elegante */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
            Hub <span className="text-blue-600">Comercial & Financeiro</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            Gestão Integrada de Loja, Atividades de Caixa, Planos e Controle SaaS do Dojo
          </p>
        </div>
        
        {/* Tab Selector Unificado */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto hover:border-slate-300 dark:hover:border-white/10 transition-all scrollbar-hide max-w-full scroll-smooth">
          <button 
            onClick={() => setActiveTab('shop')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'shop' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <ShoppingBag size={12} />
            Loja do Dojo
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'orders' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Package size={12} />
            Encomendas
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'plans' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Star size={12} />
            Mensalidades
          </button>
          <button 
            onClick={() => setActiveTab('finances')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'finances' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <DollarSign size={12} />
            Fluxo de Caixa
          </button>
          <button 
            onClick={() => setActiveTab('raffle')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'raffle' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Ticket size={12} />
            Rifas & Arrecadações
          </button>
          <button 
            onClick={() => setActiveTab('saas-plans')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'saas-plans' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Award size={12} />
            Assinatura SaaS
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'reports' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <BarChart3 size={12} />
            Inteligência
          </button>
        </div>
      </header>

      {/* Hero Quick Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10"><TrendingUp size={120} /></div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Faturamento Geral Acumulado</p>
          <h2 className="text-3xl font-black italic">R$ {Number(totalBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 w-fit px-3 py-1 rounded-lg">
             <ArrowUpRight size={14} />
             Saúde Financeira Ativa
          </div>
        </div>
        
        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden text-left md:text-left">
          <div className="absolute -left-4 -bottom-4 opacity-10"><Package size={120} /></div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Itens em Estoque da Loja</p>
          <h2 className="text-3xl font-black italic">{stats.stockCount} UND</h2>
          <div className="mt-4 flex md:inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-lg text-emerald-450">
             <ShieldCheck size={14} />
             Estoque Auditado
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={120} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lançamento de Registro de Caixa</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white italic">{ledger.length} Lançamentos</h2>
          <button 
            onClick={() => setActiveTab('finances')}
            className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all"
          >
             Visualizar Livro-Caixa <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Tabs Container */}
      <AnimatePresence mode="wait">
        
        {/* LOJA DO DOJO TAB */}
        {activeTab === 'shop' && (
          <motion.div
            key="shop"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text"
                   placeholder="Buscar produtos cadastrados..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm"
                 />
               </div>
               <button 
                 onClick={() => {
                   const name = prompt('🥋 Nome do Produto (ex: Kimono Trançado, Rash Guard, Whey):');
                   const priceText = prompt('🥋 Preço de Venda (R$):') || '0';
                   const price = parseFloat(priceText.replace(',', '.'));
                   const stockText = prompt('🥋 Quantidade Inicial em Estoque:') || '10';
                   const stock = parseInt(stockText);
                   if (name && !isNaN(price)) {
                     addProduct({ name, price, category: ExtraRevenueCategory.PRODUCT, stock: isNaN(stock) ? 10 : stock });
                     alert('🥋 Produto adicionado com sucesso!');
                   }
                 }}
                 className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
               >
                 <Plus size={18} />
                 Adicionar Produto à Loja
               </button>
            </div>

            {filteredProducts.length === 0 ? (
               <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-250 dark:border-white/5">
                 <ShoppingCart size={48} className="text-slate-300 mx-auto mb-4" />
                 <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter">Nenhum Produto na Loja</h3>
                 <p className="mt-1 text-slate-400 max-w-xs mx-auto text-xs font-medium">Inicie adicionando kimonos, suplementos ou faixas exclusivas.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <motion.div 
                    layout
                    key={product.id} 
                    className="group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl hover:border-blue-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full aspect-square bg-slate-50 dark:bg-white/5 rounded-3xl mb-5 flex items-center justify-center relative overflow-hidden">
                         <Tag size={36} className="text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                         <div className={`absolute top-4 right-4 px-2.5 py-1 text-white text-[8px] font-black uppercase tracking-widest rounded-lg ${product.stock && product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                           {product.stock && product.stock > 0 ? `Estoque: ${product.stock}` : 'Sem Estoque'}
                         </div>
                      </div>
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{product.category}</p>
                      <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate mt-1">{product.name}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-50 dark:border-white/5">
                      <span className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">R$ {Number(product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            if (window.confirm('🥋 Deseja remover este produto permanentemente?')) {
                              deleteProduct(product.id);
                              alert('🥋 Produto removido.');
                            }
                          }}
                          className="w-10 h-10 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-md border border-slate-100 dark:border-white/5"
                          title="Excluir Produto"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowQuickSale(true);
                          }}
                          className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center hover:bg-blue-650 hover:text-white transition-all shadow-md font-bold"
                          title="Vender ao Aluno"
                        >
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ENCOMENDAS TAB */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
             <div className="flex justify-end">
                <button 
                  onClick={() => {
                    const studentId = prompt('🥋 Digite o nome do aluno comprador:');
                    const eqType = prompt('🥋 Tipo de Equipamento (ex: Kimono Atama, Faixa Preta, Luvas MMA):') || 'Kimono';
                    const size = prompt('🥋 Tamanho (ex: A0, A1, A2, A3, M, G):') || 'A2';
                    const color = prompt('🥋 Cor do Equipamento:') || 'Preto';
                    const priceText = prompt('🥋 Valor Cobrado (R$):') || '350';
                    const price = parseFloat(priceText.replace(',', '.'));
                    
                    if (studentId && eqType && !isNaN(price)) {
                       let orderType: 'Kimono' | 'Rash Guard' | 'Faixa' | 'Outros' = 'Outros';
                       const normalized = eqType.toLowerCase();
                       if (normalized.includes('kimono')) orderType = 'Kimono';
                       else if (normalized.includes('rash') || normalized.includes('guard')) orderType = 'Rash Guard';
                       else if (normalized.includes('faixa')) orderType = 'Faixa';

                       addOrder({
                          studentId,
                          studentName: studentId,
                          type: orderType,
                          size,
                          color,
                          status: 'Pending',
                          date: new Date().toISOString().split('T')[0],
                          price,
                          paid: false
                       });
                       alert('Logística: Encomenda registrada com sucesso!');
                    }
                  }}
                  className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
                >
                  <Plus size={18} />
                  Registrar Nova Encomenda de Material
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-205 dark:border-white/5">
                    <Package size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sem Encomendas Pendentes</h3>
                    <p className="mt-1 text-slate-400 max-w-xs mx-auto text-xs font-medium">Cadastre pedidos sob medida para seus alunos para manter a logística ativa.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden border-l-4 border-l-blue-650 flex flex-col justify-between">
                       <div>
                         <div className="flex justify-between items-start mb-5">
                            <div>
                               <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">{order.type}</p>
                               <h4 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter">{order.studentName}</h4>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                              order.status === 'Delivered' ? 'bg-emerald-1100 text-emerald-400' : 
                              order.status === 'Pending' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-500'
                            }`}>
                              {order.status === 'Delivered' ? 'Entregue' :
                               order.status === 'Pending' ? 'Aguardando Compra' :
                               order.status === 'Ordered' ? 'Pedido Efetuado' :
                               order.status === 'Received' ? 'No Dojo (Recebido)' : order.status}
                            </span>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Tamanho</p>
                               <p className="text-xs font-black text-slate-900 dark:text-white">{order.size}</p>
                            </div>
                            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Cor</p>
                               <p className="text-xs font-black text-slate-900 dark:text-white">{order.color}</p>
                            </div>
                         </div>
                       </div>

                       <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-white/5">
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valor do Equipamento</p>
                             <p className="text-base font-black text-slate-900 dark:text-white italic">R$ {Number(order.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="flex gap-1.5">
                             {order.status === 'Pending' && (
                               <button 
                                 onClick={() => {
                                   updateOrder(order.id, { status: 'Ordered' });
                                   alert('Status alterado para: Pedido Efetuado com o Fornecedor.');
                                 }}
                                 className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow hover:scale-105 transition-all text-xs"
                                 title="Marcar como Comprado"
                               >
                                 <Plus size={16} />
                               </button>
                             )}
                             {order.status === 'Ordered' && (
                               <button 
                                 onClick={() => {
                                   updateOrder(order.id, { status: 'Received' });
                                   alert('Status alterado para: Recebido do fornecedor no Dojo.');
                                 }}
                                 className="w-9 h-9 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow hover:scale-105 transition-all text-xs"
                                 title="Recebido do Fornecedor"
                               >
                                 <Package size={16} />
                               </button>
                             )}
                             {order.status === 'Received' && (
                               <button 
                                 onClick={() => {
                                   updateOrder(order.id, { status: 'Delivered', paid: true });
                                   addExtraRevenue({
                                      description: `Entrega de Material: ${order.type} (${order.size})`,
                                      amount: order.price,
                                      date: new Date().toISOString().split('T')[0],
                                      category: ExtraRevenueCategory.PRODUCT,
                                      paid: true,
                                      paymentMethod: 'Faturado',
                                      studentName: order.studentName
                                   });
                                   alert('Material entregue ao aluno! Caixa atualizado automaticamente.');
                                 }}
                                 className="w-9 h-9 bg-emerald-650 text-white rounded-xl flex items-center justify-center shadow hover:scale-105 transition-all text-xs"
                                 title="Entregar e Faturar"
                               >
                                 <ShieldCheck size={16} />
                               </button>
                             )}
                             <button 
                               onClick={() => {
                                 if (confirm('🥋 OSS! Deseja realmente excluir esta encomenda?')) {
                                   deleteOrder(order.id);
                                   alert('🥋 Encomenda apagada.');
                                 }
                               }}
                               className="w-9 h-9 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/20 dark:hover:bg-rose-900/40 rounded-xl flex items-center justify-center border border-red-100 dark:border-red-900/20 shadow transition-all text-xs"
                               title="Excluir"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </motion.div>
        )}

        {/* PLANOS INTERNOS DO ALUNO TAB */}
        {activeTab === 'plans' && (
           <motion.div
             key="plans"
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -15 }}
             className="space-y-8"
           >
             <div className="flex justify-end">
                <button 
                  onClick={() => {
                    const name = prompt('🥋 Nome do Plano da Academia (ex: Mensal Premium, Anual Kids, Bianual Executivo):');
                    const priceText = prompt('🥋 Valor Mensalidade (R$):') || '150';
                    const price = parseFloat(priceText.replace(',', '.'));
                    const benefitListInput = prompt('🥋 Benefícios/Aulas (separados por vírgula):') || 'Aulas diárias, Suporte portal';
                    const benefits = benefitListInput.split(',').map(b => b.trim());
                    if (name && !isNaN(price)) {
                      addPlan({ name, price, description: 'Plano corporal de desenvolvimento jiu-jitsu', benefits });
                      alert('🥋 Plano comercial criado com sucesso!');
                    }
                  }}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-blue-650/20"
                >
                  <Plus size={18} />
                  Criar Novo Plano de Aluno
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {plans.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-205 dark:border-white/5">
                    <Star size={48} className="text-slate-350 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter">Nenhum Plano Comercial</h3>
                    <p className="mt-1 text-slate-405 max-w-xs mx-auto text-xs font-medium font-sans">Cadastre opções de planos para seus atletas (mensais, semestrais ou anuais).</p>
                  </div>
               ) : (
                 plans.map((plan, idx) => (
                    <div key={plan.id} className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden transition-all hover:scale-[1.01] hover:border-blue-500/20 flex flex-col justify-between">
                       <div className="space-y-6">
                         <div className="flex justify-between items-center">
                           <h3 className="text-xl font-black uppercase tracking-tighter italic">{plan.name}</h3>
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         </div>

                         <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
                           <span className="text-[10px] font-black text-slate-400">R$</span>
                           <span className="text-3xl font-black text-slate-900 dark:text-white italic leading-none">{Number(plan.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 pointer-events-none">/ mês</span>
                         </div>

                         <ul className="space-y-3">
                           {(plan.benefits || ['Aulas Comuns', 'Treinos Livres', 'Suporte Técnico e Presencial']).map((benefit, bIdx) => (
                             <li key={bIdx} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                                  <Plus size={8} className="text-blue-600" />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{benefit}</span>
                             </li>
                           ))}
                         </ul>
                       </div>

                       <div className="mt-8 pt-5 border-t border-slate-50 dark:border-white/5 flex gap-2">
                          <button className="flex-1 py-3 text-center bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                             Vincular Atletas
                          </button>
                       </div>
                    </div>
                 ))
               )}
             </div>
           </motion.div>
        )}

        {/* FLUXO DE CAIXA / FINANCEIRO TAB */}
        {activeTab === 'finances' && (
          <motion.div
            key="finances"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Header com botões do módulo financeiro */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                  <DollarSign size={20} className="text-blue-500" />
                  Controle de Atividades Financeiras do Dōjō
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Histórico auditado e verificado sequencialmente</p>
              </div>
              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                   <Download size={12} /> exportar relatório xls
                 </button>
                 <button 
                   onClick={handleClearTestEntries}
                   className="flex items-center gap-2 px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600 hover:text-white dark:bg-rose-550/10 dark:hover:bg-rose-600 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                 >
                   🗑️ Limpar Dados de Teste
                 </button>
                 <button 
                   onClick={() => setShowFinanceModal(true)}
                   className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                 >
                   <Plus size={12} /> registrar lançamento
                 </button>
              </div>
            </div>

            {/* Sub-cards de métricas financeiras */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Fluxo em Caixa Geral', value: totalBalance, icon: <Wallet className="text-blue-500" />, trend: 'Saldo Geral', color: 'text-blue-600' },
                { label: 'Entradas Mês Atual', value: monthIncome, icon: <ArrowUpRight className="text-emerald-500" />, trend: `${incomeGrowth >= 0 ? '+' : ''}${incomeGrowth.toFixed(1)}% vs. anterior`, color: 'text-emerald-550' },
                { label: 'Saídas Mês Atual', value: monthExpense, icon: <ArrowDownLeft className="text-rose-500" />, trend: `${expenseGrowth >= 0 ? '+' : ''}${expenseGrowth.toFixed(1)}% vs. anterior`, color: 'text-rose-500' },
                { label: 'Margem de Rendimento', value: monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0, isPercent: true, icon: <TrendingUp className="text-amber-500" />, trend: 'Saúde Operacional', color: 'text-amber-550' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">{stat.icon}</div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.trend}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</span>
                    <p className={`text-2xl font-black italic mt-1 ${stat.color}`}>
                      {stat.isPercent ? `${stat.value}%` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Área do Gráfico Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5"><BarChart3 size={100} /></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        Desempenho de Entrada & Saída de Caixa
                     </h2>
                     <div className="text-[10px] font-black text-slate-400 sidebar-nums uppercase tracking-widest">{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</div>
                  </div>
                  
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '9px', textTransform: 'uppercase' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="income" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorIncome)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="#f43f5e" 
                          strokeWidth={2}
                          fill="none" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center gap-8 mt-5 pt-5 border-t border-slate-50 dark:border-white/5">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receitas Comerciais</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Despesas e Pagamentos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensalidades Atrasadas / Inadimplência Widget */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-white/5 flex flex-col justify-between h-full">
                    <div className="absolute -right-4 -bottom-4 opacity-5"><Wallet size={120} /></div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tighter italic mb-5">Vencimentos Incidentes</h3>
                      <div className="space-y-3">
                         {students.filter(s => s.status === 'Overdue').slice(0, 3).map(s => (
                           <div key={s.id} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                              <div>
                                 <p className="text-xs font-black uppercase tracking-tight">{s.name}</p>
                                 <p className="text-[8px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">Atraso Pendente • Dia {s.dueDay}</p>
                              </div>
                              <p className="text-sm font-black italic">R$ {Number(s.monthlyValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                           </div>
                         ))}
                         {students.filter(s => s.status === 'Overdue').length === 0 && (
                            <div className="py-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                               <CheckCircle2 className="mx-auto text-emerald-450 mb-2 animate-bounce" size={24} />
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Todos os Alunos Adimplentes!</p>
                            </div>
                         )}
                      </div>
                    </div>
                    <button 
                      onClick={() => alert(`Encontrados ${overdueCount} alunos pendentes de mensalidade.`)}
                      className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-md"
                    >
                       Cobrar Alunos via WhatsApp
                    </button>
                 </div>
              </div>
            </div>

            {/* Histórico Consolidado de Transações */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                       <Receipt size={20} className="text-blue-600" />
                       Histórico Geral de Transações (Livro-Caixa)
                    </h2>
                    <VerificationBadge status={isVerifying ? 'verifying' : verifyStatus} />
                 </div>
                 
                 <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                      <input 
                        type="text" 
                        placeholder="Buscar descrição ou método..."
                        value={financeSearchTerm}
                        onChange={(e) => setFinanceSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl text-[9px] font-bold outline-none border border-slate-200 dark:border-white/10 focus:border-blue-500/50 w-56"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                      {(['all', 'income', 'expense', 'test'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setFinanceFilter(tab)}
                          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${financeFilter === tab ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {tab === 'all' ? 'Ver Tudo' : tab === 'income' ? 'Entradas' : tab === 'expense' ? 'Saídas' : 'Somente Testes'}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 text-left">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição do Lançamento</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Controles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                           <AlertCircle size={32} className="mx-auto text-slate-350 mb-3" />
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nenhuma transação encontrada correspondente.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((item) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-xs"
                        >
                          <td className="py-4 px-4 whitespace-nowrap">
                             <span className="font-bold text-slate-500 tabular-nums">{format(item.timestamp, 'dd MMM, yyyy', { locale: ptBR })}</span>
                          </td>
                          <td className="py-4 px-4">
                             <div className="flex items-center gap-2">
                               <p className="font-black uppercase text-slate-900 dark:text-white leading-tight">{item.description}</p>
                               {item.isTeste && (
                                 <span className="shrink-0 px-1.5 py-0.5 bg-red-650 dark:bg-rose-600 text-white text-[7px] font-black uppercase tracking-widest rounded-md leading-none">TESTE</span>
                               )}
                             </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                             <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 rounded text-[9px] font-black uppercase tracking-wider">{item.category}</span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                             <div className="flex items-center gap-1.5">
                                <CreditCard size={11} className="text-slate-400" />
                                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase text-[9px]">{item.method}</span>
                             </div>
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                             <p className={`font-black italic ${['Income', 'StudentPayment', 'ExtraRevenue'].includes(item.type) ? 'text-emerald-500' : 'text-rose-500'}`}>
                               {['Income', 'StudentPayment', 'ExtraRevenue'].includes(item.type) ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                             </p>
                          </td>
                          <td className="py-4 px-4">
                             <div className="flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                             </div>
                          </td>
                          <td className="py-4 px-4">
                             <div className="flex items-center justify-center">
                                <button
                                  onClick={() => {
                                    if (confirm('🥋 OSS! Deseja realmente excluir este lançamento financeiro permanentemente?')) {
                                      deleteLedgerEntry(item.id);
                                    }
                                  }}
                                  className="p-1 px-2 text-[9px] font-black uppercase text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded flex items-center gap-1 border border-rose-500/10 transition-colors"
                                >
                                   <Trash2 size={11} /> Excluir
                                </button>
                             </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auditoria do Mestre e Cartão de Inadimplência */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="p-8 bg-blue-600 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 space-y-5">
                     <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                           <ShieldCheck size={28} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black uppercase tracking-tighter italic">Ledger Criptográfico do Dojo</h3>
                           <p className="text-blue-105 text-[8px] font-black uppercase tracking-widest mt-0.5">Integridade de Caixa SYSBJJ</p>
                        </div>
                     </div>
                     <p className="text-blue-100 text-xs font-semibold leading-relaxed font-sans">
                        Todas as transações e pagamentos de alunos são encadeados em um protocolo imutável na base de dados. Nenhuma alteração indevida passará despercebida pela auditoria do Mestre Sensei.
                     </p>
                     <button 
                       onClick={runVerification}
                       disabled={isVerifying}
                       className="px-6 py-3 bg-white text-blue-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-all shadow-md disabled:opacity-55"
                     >
                        {isVerifying ? 'Codificando Segurança...' : 'Executar Verificação de Integridade'}
                     </button>
                  </div>
               </div>

               <div className="p-8 bg-slate-900 rounded-[3rem] text-white border border-white/5 relative overflow-hidden flex flex-col justify-between h-full">
                  <div>
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="font-black uppercase tracking-tighter italic text-base">Relatório Analítico de Inadimplência</h3>
                         <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded text-[8px] font-black uppercase tracking-widest">Alerta Ativo</span>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sob Atraso</span>
                            <span className="text-lg font-black text-rose-500 italic">R$ {Number(overdueAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                         </div>
                         <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${overduePercentage}%` }}
                              className="h-full bg-rose-500 rounded-full"
                            />
                         </div>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{overdueCount} alunos estão com pendência na mensalidade do Dojo.</p>
                      </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {/* ASSINATURA SAAS & LICENÇA TAB */}
        {activeTab === 'saas-plans' && (
          <motion.div
            key="saas-plans"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 animate-in fade-in duration-300"
          >
            {/* SaaS Status Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Licença Atual Box */}
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] lg:col-span-8 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-2xl">
                      <Award size={24} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sua Chave de Licença Ativa</p>
                      <h3 className="text-xl font-black text-white uppercase italic leading-none flex items-center gap-2 mt-0.5">
                        {currentPlanId === 'FREE' ? 'GRATUITO' : currentPlanId === 'SOCIAL PROJECT' ? 'PROJETO SOCIAL' : currentPlanId}
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${
                          sub?.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {sub?.active ? 'ATIVO' : 'SUSPENSO'}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Valor do Faturamento</p>
                    <p className="text-2xl font-black text-white leading-none mt-0.5">
                      R$ {Number(sub?.monthlyPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-[9px] font-black text-slate-400">/mês</span>
                    </p>
                  </div>
                </div>

                {/* Meter de alunos sintonizado */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[10px]">
                      <Users size={12} className="text-indigo-400" />
                      Limite de Alunos do Plano
                    </span>
                    <span className="text-white font-black">{usageStats.count} / {usageStats.limit === 999999 ? 'Ilimitado' : usageStats.limit}</span>
                  </div>

                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${usageStats.percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        usageStats.alert === 'blocked' ? 'bg-red-500' :
                        usageStats.alert === 'critical' ? 'bg-amber-500' :
                        usageStats.alert === 'warning' ? 'bg-yellow-400' :
                        'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Mínimo</span>
                    <span className={usageStats.percent > 80 ? "text-amber-400" : ""}>{usageStats.percent}% ocupado</span>
                    <span>Máximo</span>
                  </div>
                </div>

                {/* Alerts warnings system de estudantes */}
                <div className="mt-4">
                  {usageStats.alert === 'blocked' && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-350 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                      <AlertTriangle size={15} className="text-red-400 shrink-0" />
                      <p><strong>ALERTA DE CAPACIDADE EXCEDIDA:</strong> Você preencheu totalmente o limite de <strong>{usageStats.limit} alunos</strong> do seu plano. Novos cadastros estão bloqueados. Realize o upgrade de plano abaixo.</p>
                    </div>
                  )}
                  {usageStats.alert === 'critical' && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-350 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      <p><strong>ALERTA DE CAPACIDADE QUASE CHEIA (90%+):</strong> Seu Dojo está prestes a bloquear novos registros. Faça o upgrade recomendado.</p>
                    </div>
                  )}
                  {usageStats.alert === 'warning' && (
                    <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-350 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                      <AlertTriangle size={15} className="text-yellow-400 shrink-0" />
                      <p>Seu Dojo está crescendo rapidamente (80%+ de capacidade de alunos em uso). Considere o próximo plano.</p>
                    </div>
                  )}
                  {usageStats.alert === 'none' && (
                    <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-300 rounded-2xl text-[10px] leading-relaxed flex gap-2">
                      <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                      <p>Status de cadastro regular. Há espaço livre para novos alunos no seu plano atual. OSS!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Faturamento SaaS */}
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] lg:col-span-4 flex flex-col justify-between text-white relative overflow-hidden">
                <div>
                   <h3 className="text-xs font-black text-slate-350 uppercase tracking-wider flex items-center gap-1.5 mb-5">
                     <Clock size={15} className="text-indigo-400" />
                     Ciclo de Faturamento
                   </h3>

                   <div className="space-y-3.5 text-xs">
                     <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                       <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Cobrança Mensal:</span>
                       <span className="text-white font-black">{sub?.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString('pt-BR') : '21/06/2026'}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                       <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Ativação Inicial:</span>
                       <span className="text-white font-semibold">{sub?.startedAt ? new Date(sub.startedAt).toLocaleDateString('pt-BR') : '21/05/2026'}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                       <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Liquidação:</span>
                       <span className="text-emerald-440 font-black flex items-center gap-1 uppercase text-[9px]">
                         PIX Instantâneo
                       </span>
                     </div>
                   </div>
                </div>

                <button
                  onClick={() => navigate('/billing')}
                  className="w-full mt-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={14} /> Central de PIX & Faturas
                </button>
              </div>
            </div>

            {/* SaaS Plans Grade Selection */}
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">Grade Oficial de Upgrade SYSBJJ 2.0</h3>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-widest mt-1">Acompanhe as limitações de alunos e libere recursos avançados</p>
              </div>

              {saasSuccess && (
                <div className="p-4 bg-emerald-950 border border-emerald-550/30 text-emerald-400 rounded-2xl text-xs font-black uppercase">
                  {saasSuccess}
                </div>
              )}
              {saasError && (
                <div className="p-4 bg-red-950 border border-red-500/30 text-red-400 rounded-2xl text-xs font-black uppercase">
                  {saasError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {officialPlans.map((plan) => {
                  const isCurrent = plan.id === currentPlanId;
                  const currentPrice = officialPlans.find(p => p.id === currentPlanId)?.price || 0;
                  const isUpgrade = plan.price > currentPrice;

                  return (
                    <div 
                      key={plan.id}
                      className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between ${plan.bgColor} ${
                        isCurrent ? 'ring-2 ring-indigo-500 bg-indigo-950/10' : ''
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded border border-indigo-500/20">
                            {plan.badge}
                          </span>
                          {isCurrent && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-0.5 rounded">
                              Ativo
                            </span>
                          )}
                        </div>

                        <h4 className={`text-base font-black tracking-wider uppercase mb-1 ${plan.accent}`}>{plan.id.replaceAll('_', ' ')}</h4>
                        <p className="text-[9px] text-slate-400 leading-snug mb-4">{plan.tagline}</p>

                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-[9px] font-black text-slate-500">R$</span>
                          <span className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">{plan.price}</span>
                          <span className="text-[9px] font-bold text-slate-500 lowercase">/mês</span>
                        </div>

                        <div className="py-2 px-3 bg-slate-950/40 border border-slate-900 rounded-xl mb-4 text-[9px] uppercase font-black text-white flex justify-between items-center">
                          <span className="text-slate-500 text-[8px] tracking-wider">Limite:</span>
                          <span>{plan.studentLimit === 999999 ? 'Ilimitado' : `${plan.studentLimit} Alunos`}</span>
                        </div>

                        <ul className="space-y-2.5 mb-6">
                          {plan.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-1.5 text-[9px] leading-normal text-slate-350">
                              <span className="p-0.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                                <Plus size={8} />
                              </span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handlePlanChange(plan.id, currentPlanId)}
                        disabled={isCurrent || submittingSaas !== null}
                        className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                          isCurrent 
                            ? 'bg-slate-805 text-slate-550 border border-slate-800 cursor-not-allowed' 
                            : submittingSaas === plan.id
                              ? 'bg-indigo-605 text-indigo-200 cursor-not-allowed'
                              : isUpgrade
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:scale-[1.01]'
                                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/50 hover:scale-[1.01]'
                        }`}
                      >
                        {submittingSaas === plan.id ? (
                          <>
                            <RefreshCw size={11} className="spin" />
                            Codificando...
                          </>
                        ) : isCurrent ? (
                          'Plano Atual'
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
            </div>
          </motion.div>
        )}

        {/* INTELIGÊNCIA COMERCIAL & RELATÓRIOS BI TAB */}
        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {loadingBi ? (
              <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-205 dark:border-white/5">
                <RefreshCw size={44} className="text-blue-600 animate-spin mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Sintonizando métricas com sistema central do Mestre...</p>
              </div>
            ) : biData ? (
              <div className="space-y-8">
                
                {/* Métricas BI */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">Taxa de Evasão Est. (Churn)</p>
                    <h3 className="text-2xl font-black italic text-rose-400">{biData.churnRate || '2.4%'}</h3>
                  </div>
                  <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">Ticket Médio por Aluno</p>
                    <h3 className="text-2xl font-black italic">R$ {biData.avgTicket || '150,00'}</h3>
                  </div>
                  <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-2">Faturamento Potencial Alvo</p>
                    <h3 className="text-2xl font-black italic">R$ {Number(biData.summary?.monthlyRevenueGoal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                  </div>
                  <div className="p-6 bg-emerald-600 rounded-3xl text-white shadow-xl">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-2">Lucro Operacional Líquido</p>
                    <h3 className="text-2xl font-black italic">R$ {Number(biData.summary?.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Graduação de Faixa */}
                  <div className="lg:col-span-1 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl">
                    <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <BarChart3 size={16} className="text-blue-600" />
                      Graduação e Faixas Ativas
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(biData.students?.beltDistribution || {}).map(([belt, count]: [any, any]) => (
                        <div key={belt}>
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{belt}</span>
                             <span className="text-[9px] font-black text-slate-900 dark:text-white">{count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(count / (biData.students?.total || 1)) * 100}%` }}
                               className="h-full bg-blue-600 rounded-full"
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detalhamento de Composição Financeira */}
                  <div className="lg:col-span-2 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col justify-between">
                     <div>
                       <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <PieChart size={16} className="text-blue-600" />
                            Distribuição Percentual de Receita
                          </h3>
                          <button onClick={loadBi} className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                             <RefreshCw size={14} />
                          </button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3.5">
                             <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border-l-4 border-blue-500">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Matrículas & Mensalidades</p>
                               <p className="text-lg font-black text-slate-900 dark:text-white italic mt-0.5">R$ {Number(biData.finances?.breakdown?.studentPayments || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                             </div>
                             <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border-l-4 border-purple-500">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vendas de Balcão (Ledger)</p>
                               <p className="text-lg font-black text-slate-900 dark:text-white italic mt-0.5">R$ {Number(biData.finances?.breakdown?.ledgerIncomes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                             </div>
                             <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border-l-4 border-amber-500">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Aulas Particulares & Extras</p>
                               <p className="text-lg font-black text-slate-900 dark:text-white italic mt-0.5">R$ {Number(biData.finances?.breakdown?.extraIncomes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                             </div>
                          </div>
                          
                          <div className="flex flex-col justify-center items-center p-6 bg-slate-950 border border-white/5 rounded-3xl text-center relative overflow-hidden">
                             <TrendingUp size={40} className="text-blue-500 mb-3" />
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 select-none">Status de Performance</span>
                             <p className="text-xl font-black text-white italic uppercase tracking-tighter">
                               {biData.summary?.netProfit > 0 ? 'Superávit Operacional' : 'Déficit Avaliado'}
                             </p>
                          </div>
                       </div>
                     </div>
                  </div>
                </div>

                {/* Transações Consolidadas do Dashboard BI */}
                <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl">
                  <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" />
                    Balanço Consolidado por Categorias de Caixa
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5">
                          <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome da Categoria</th>
                          <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Montante de Lucro</th>
                          <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Análise do Sistema</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-55 dark:divide-white/5">
                        {Object.entries(biData.finances?.byCategory || {}).map(([cat, amount]: [any, any]) => (
                          <tr key={cat} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-xs">
                            <td className="py-4 font-black text-[10px] text-slate-600 dark:text-slate-350 uppercase tracking-widest">{cat}</td>
                            <td className={`py-4 font-black text-right italic ${amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {amount >= 0 ? '+' : '-'} R$ {Number(Math.abs(amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 text-right">
                               <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                  <ShieldCheck size={8} className="text-blue-500" />
                                  <span className="text-[7px] font-black text-slate-450 uppercase tracking-widest">Auditado</span>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                <Target size={44} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nenhum dado comercial de BI encontrado</h3>
                <p className="mt-1 text-slate-405 max-w-xs mx-auto text-xs font-medium">Insira pagamentos e realize vendas de balcão para iniciar os relatórios.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* CAMPANHA DE RIFAS TAB */}
        {activeTab === 'raffle' && (
          <motion.div
            key="raffle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <RaffleModule />
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK SALE / CHECKOUT MODAL */}
      <AnimatePresence>
        {showQuickSale && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickSale(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-slate-200 dark:border-white/5 p-8 overflow-hidden z-10"
            >
               <header className="mb-6">
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Faturamento Rápido</p>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Concluir <span className="text-blue-600">Venda</span></h2>
               </header>

               <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl mb-6 border border-slate-100 dark:border-white/10">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-250 dark:border-white/5 text-blue-600">
                     <Tag size={24} />
                  </div>
                  <div>
                     <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedProduct.name}</h4>
                     <p className="text-xl font-black text-slate-900 dark:text-white italic mt-0.5">R$ {Number(selectedProduct.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
               </div>

               <div className="space-y-5">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Quem é o Comprador (Aluno):</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl font-bold appearance-none outline-none focus:border-blue-500/50 text-xs"
                      onChange={(e) => {
                        const s = students.find(stu => stu.id === e.target.value);
                        if (s) {
                          addExtraRevenue({
                            description: `Venda Loja: ${selectedProduct.name}`,
                            amount: selectedProduct.price,
                            date: new Date().toISOString().split('T')[0],
                            category: ExtraRevenueCategory.PRODUCT,
                            paid: true,
                            paymentMethod: 'Venda de Balcão',
                            studentId: s.id,
                            studentName: s.name
                          });
                          setShowQuickSale(false);
                          alert(`🥋 OSS! ${selectedProduct.name} vendido para ${s.name} com sucesso.`);
                        }
                      }}
                    >
                      <option value="">Selecione o Aluno...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 py-3 px-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-500/10">
                     <ShieldCheck size={18} className="text-blue-500 shrink-0" />
                     <p className="text-[9px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-tight leading-normal">
                       A transação será anexada de forma instantânea às receitas extras e ao livro-caixa criptográfico.
                     </p>
                  </div>

                  <button 
                    onClick={() => setShowQuickSale(false)}
                    className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl font-black uppercase tracking-widest text-[9px] shadow"
                  >
                    Cancelar Checkout
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTRAR ADIÇÃO DO LIVRO-CAIXA MODAL */}
      <AnimatePresence>
        {showFinanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFinanceModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-250 dark:border-white/5 p-8 overflow-hidden z-10"
            >
               <header className="mb-6">
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Blockchain Ledger</p>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Lançamento de <span className="text-blue-600">Caixa</span></h2>
               </header>

               <div className="space-y-4">
                  {/* Tipo de Transação */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo de Operação</label>
                    <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10">
                      <button 
                        type="button"
                        onClick={() => {
                          setNewEntryType('Income');
                          setNewEntryCategory('Mensalidade');
                        }}
                        className={`py-2 px-3 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all ${newEntryType === 'Income' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        Entrada (+ Receita)
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setNewEntryType('Expense');
                          setNewEntryCategory('Aluguel');
                        }}
                        className={`py-2 px-3 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all ${newEntryType === 'Expense' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        Saída (- Despesa)
                      </button>
                    </div>
                  </div>

                  {/* Valor monetário */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor do Lançamento (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="Ex: 150.00"
                      value={newEntryAmount}
                      onChange={(e) => setNewEntryAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl font-bold appearance-none outline-none focus:border-blue-500/50 text-xs"
                      required
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Descrição Técnica / Nota</label>
                    <input 
                      type="text"
                      placeholder="Ex: Mensalidade Aluno Pedro, Compra de Tatame"
                      value={newEntryDescription}
                      onChange={(e) => setNewEntryDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl font-bold appearance-none outline-none focus:border-blue-500/50 text-xs"
                      required
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Categoria Comercial</label>
                    <select 
                      value={newEntryCategory}
                      onChange={(e) => setNewEntryCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl font-bold appearance-none outline-none focus:border-blue-500/50 text-xs"
                    >
                      {newEntryType === 'Income' ? (
                        <>
                          <option value="Mensalidade">Mensalidade</option>
                          <option value="Loja/Produtos">Loja/Produtos</option>
                          <option value="Aula Particular">Aula Particular</option>
                          <option value="Matrícula">Matrícula</option>
                          <option value="Seminário/Workshop">Seminário/Workshop</option>
                          <option value="Patrocínio">Patrocínio</option>
                          <option value="Outros">Outros</option>
                        </>
                      ) : (
                        <>
                          <option value="Aluguel">Aluguel</option>
                          <option value="Energia / Água">Energia / Água</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Equipamentos">Equipamentos</option>
                          <option value="Limpeza">Limpeza</option>
                          <option value="Impostos">Impostos</option>
                          <option value="Outros">Outros</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Método de pagamento */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Método de Liquidação</label>
                    <select 
                      value={newEntryMethod}
                      onChange={(e) => setNewEntryMethod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl font-bold appearance-none outline-none focus:border-blue-500/50 text-xs"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Transferência Bancária">Transferência Bancária</option>
                    </select>
                  </div>

                  {/* Aluno correlacionado (Opcional) */}
                  {newEntryType === 'Income' && (
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Aluno Correlacionado (Opcional)</label>
                      <select 
                        value={newEntryStudentId}
                        onChange={(e) => setNewEntryStudentId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl font-bold appearance-none outline-none focus:border-blue-500/50 text-xs"
                      >
                        <option value="">Nenhum</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Lançamento de Teste Checkbox */}
                  <div className="flex items-center gap-2 py-2">
                    <input 
                      type="checkbox"
                      id="isTesteCheckbox"
                      checked={newEntryIsTeste}
                      onChange={(e) => setNewEntryIsTeste(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isTesteCheckbox" className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer select-none">
                      Marcar como lançamento de teste
                    </label>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowFinanceModal(false)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button" 
                      onClick={handleAddFinanceEntry}
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow"
                    >
                      Registrar Lançamento
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BusinessHub;
