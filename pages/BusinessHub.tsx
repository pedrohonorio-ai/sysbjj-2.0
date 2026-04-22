
import React, { useState, useMemo } from 'react';
import { generateReceiptPdf, generateFinancialReportPdf } from '../services/pdfService';
import { 
  Download, 
  CreditCard, 
  QrCode, 
  X, 
  Wallet,
  ArrowRight,
  Plus,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Copy,
  Users,
  TrendingUp,
  Filter,
  UserX,
  UserCheck,
  ShoppingBag,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingDown,
  Clock,
  DollarSign,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Zap,
  Package,
  Layers,
  Search,
  Tag,
  Cake,
  Trash2,
  LayoutDashboard,
  Printer,
  ShieldAlert,
  Eye,
  FileDown
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { StudentStatus, ExtraRevenueCategory } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';

const BusinessHub: React.FC = () => {
  const { t } = useTranslation();
  const { 
    payments, students, addPayment, updateStudent, 
    extraRevenue, addExtraRevenue, deleteExtraRevenue, updateExtraRevenue,
    receipts, ledger, approveReceipt, rejectReceipt, verifyLedgerIntegrity, verifyReceiptWithAI,
    products, addProduct, deleteProduct,
    plans, addPlan, deletePlan
  } = useData();
  const { profile } = useProfile();
  
  const [showPix, setShowPix] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [reportTab, setReportTab] = useState<'dashboard' | 'monthly' | 'sales' | 'catalog' | 'receipts' | 'ledger' | 'analytics' | 'birthdays'>('dashboard');
  const [integrityStatus, setIntegrityStatus] = useState<{valid: boolean, message: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  const handlePrintReceipt = (item: any, type: 'monthly' | 'extra') => {
    const receiptData = {
      id: item.id,
      date: item.date,
      studentName: item.studentName || item.name,
      description: type === 'monthly' ? t('financial.monthlyFee') : item.description,
      amount: item.amount || item.monthlyValue,
      paymentMethod: item.paymentMethod || item.method || 'PIX',
      academyName: profile.academyName,
      professorName: profile.name
    };
    generateReceiptPdf(receiptData);
  };

  const handleGenerateFullReport = () => {
    const allData = [...payments, ...extraRevenue].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    generateFinancialReportPdf(t('business.fullReport'), allData, profile.academyName);
  };

  const handleAiVerify = async (id: string) => {
    setIsVerifying(id);
    await verifyReceiptWithAI(id);
    setIsVerifying(null);
  };

  const [saleFormData, setSaleFormData] = useState({
    description: '',
    category: ExtraRevenueCategory.PRODUCT,
    amount: 0,
    studentId: '',
    paid: true,
    paymentMethod: 'PIX'
  });

  const [productForm, setProductForm] = useState({ name: '', price: 0, category: ExtraRevenueCategory.PRODUCT, stock: 0 });
  const [planForm, setPlanForm] = useState({ name: '', price: 0, description: '' });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  const [showManualConfirm, setShowManualConfirm] = useState<string | null>(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState<string | null>(null);

  const handleManualPayment = (student: any) => {
    addPayment({
      name: student.name,
      amount: student.monthlyValue,
      date: new Date().toISOString().split('T')[0],
      method: 'Manual/Dinheiro',
      status: 'Confirmed'
    });
    updateStudent(student.id, { 
      status: StudentStatus.ACTIVE, 
      lastPaymentDate: new Date().toISOString().split('T')[0] 
    });
    setShowManualConfirm(null);
  };

  const handleTogglePause = (student: any) => {
    updateStudent(student.id, { billingPaused: !student.billingPaused });
    setShowPauseConfirm(null);
  };

  const generateAiSuggestions = () => {
    setIsAiLoading(true);
    setShowAiModal(true);
    setTimeout(() => {
      setAiSuggestions([
        "Implementar um programa de 'Indique um Amigo' com 10% de desconto na primeira mensalidade.",
        "Criar um kit 'Iniciante VIP' (Kimono + 3 meses de mensalidade) com valor promocional.",
        "Aumentar a oferta de aulas particulares nos horários de vale (10h - 15h) com pacotes de 5 aulas.",
        "Organizar um seminário técnico com professor convidado para gerar receita extra e engajamento.",
        "Lançar uma linha de vestuário casual (camisetas/moletons) da academia para venda no balcão."
      ]);
      setIsAiLoading(false);
    }, 1500);
  };

  const handleVerifyIntegrity = () => {
    const isValid = verifyLedgerIntegrity();
    setIntegrityStatus({
      valid: isValid,
      message: isValid ? 'Integridade da Blockchain confirmada! Todos os dados estão seguros.' : 'Atenção: Falha na integridade dos dados detectada!'
    });
    setTimeout(() => setIntegrityStatus(null), 5000);
  };

  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthName = new Intl.DateTimeFormat(t('common.dateLocale'), { month: 'long' }).format(new Date());

  // Cálculos de Relatório
  const allStudents = useMemo(() => {
    return students.filter(s => s.status !== StudentStatus.INACTIVE);
  }, [students]);

  const paidStudents = useMemo(() => {
    return students.filter(s => 
      s.status === StudentStatus.ACTIVE && 
      (s.monthlyValue === 0 || s.lastPaymentDate?.startsWith(currentMonth))
    );
  }, [students, currentMonth]);

  const unpaidStudents = useMemo(() => {
    return students.filter(s => 
      s.monthlyValue > 0 && (
        s.status === StudentStatus.OVERDUE || 
        (s.status === StudentStatus.ACTIVE && !s.lastPaymentDate?.startsWith(currentMonth) && s.dueDay < new Date().getDate())
      )
    );
  }, [students, currentMonth]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const monthPaidTotal = paidStudents.reduce((sum, s) => sum + s.monthlyValue, 0);
  const monthUnpaidTotal = unpaidStudents.reduce((sum, s) => sum + s.monthlyValue, 0);
  
  const healthPercentage = Math.round((monthPaidTotal / (monthPaidTotal + monthUnpaidTotal || 1)) * 100);

  const handleRecordPayment = (student: any) => {
    addPayment({
      name: student.name,
      amount: student.monthlyValue,
      date: new Date().toISOString().split('T')[0],
      method: 'PIX',
      status: 'Confirmed'
    });
    updateStudent(student.id, { 
      status: StudentStatus.ACTIVE, 
      lastPaymentDate: new Date().toISOString().split('T')[0] 
    });
    setSelectedStudent(null);
    setShowPix(false);
  };

  const handleExportOverdue = () => {
    if (unpaidStudents.length === 0) return;
    const headers = ["Nome", "Valor", "Dia Vencimento", "Telefone"];
    const rows = unpaidStudents.map(s => [s.name, s.monthlyValue, s.dueDay, s.phone]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = t('financial.overdueFilename').replace('{month}', monthName).replace('{year}', new Date().getFullYear().toString());
    link.click();
  };

  const generatePixPayload = (amount: number, description: string) => {
    const key = profile.pixKey;
    const name = profile.pixName;
    const city = profile.pixCity;
    return `00020126580014br.gov.bcb.pix01${key.length}${key}52040000530398654${amount.toFixed(2).length}${amount.toFixed(2)}5802BR59${name.length}${name.slice(0, 25)}60${city.length}${city}62070503OSS6304D1BB`;
  };

  const copyToClipboard = () => {
    if (!selectedStudent) return;
    const payload = generatePixPayload(selectedStudent.monthlyValue, selectedStudent.name);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSales = useMemo(() => {
    return extraRevenue.filter(r => 
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [extraRevenue, searchTerm]);

  const beltDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => { counts[s.belt] = (counts[s.belt] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: t(`belts.${name}`), 
      value,
      color: name === 'White' ? '#cbd5e1' : name === 'Blue' ? '#2563eb' : name === 'Purple' ? '#7e22ce' : name === 'Brown' ? '#78350f' : '#0f172a'
    }));
  }, [students, t]);

  const revenueStreamData = useMemo(() => {
    return payments.slice(-6).map(p => ({
      month: p.date.split('-')[2] + '/' + p.date.split('-')[1],
      revenue: p.amount
    }));
  }, [payments]);

  const monthlyBirthdays = useMemo(() => {
    return students.filter(s => s.birthDate && new Date(s.birthDate).getMonth() === selectedMonth)
      .sort((a, b) => new Date(a.birthDate!).getDate() - new Date(b.birthDate!).getDate());
  }, [students, selectedMonth]);

  const months = [
    t('common.monthNames.january'), t('common.monthNames.february'), t('common.monthNames.march'), t('common.monthNames.april'), 
    t('common.monthNames.may'), t('common.monthNames.june'), t('common.monthNames.july'), t('common.monthNames.august'), 
    t('common.monthNames.september'), t('common.monthNames.october'), t('common.monthNames.november'), t('common.monthNames.december')
  ];

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === saleFormData.studentId);
    addExtraRevenue({
      ...saleFormData,
      date: new Date().toISOString().split('T')[0],
      studentName: student?.name || t('business.externalClient')
    });
    setIsAddingSale(false);
    setSaleFormData({ description: '', category: saleFormData.category, amount: 0, studentId: '', paid: true, paymentMethod: 'PIX' });
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.9]">{t('business.title')}</h1>
          <p className="text-slate-500 font-medium italic mt-4 uppercase text-xs tracking-widest">{t('business.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleGenerateFullReport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <FileDown size={20} /> {t('business.exportReport')}
          </button>
          <button 
            onClick={handleExportOverdue}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-red-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95"
          >
            <UserX size={20} /> {t('financial.exportOverdue').toUpperCase()}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm gap-1">
        {[
          { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: t('common.dashboard'), color: 'text-blue-600' },
          { id: 'monthly', icon: <Users size={18} />, label: t('financial.monthlyFees'), color: 'text-emerald-600' },
          { id: 'sales', icon: <ShoppingBag size={18} />, label: t('business.shopItems'), color: 'text-amber-600' },
          { id: 'catalog', icon: <Layers size={18} />, label: t('business.catalog'), color: 'text-indigo-600' },
          { id: 'receipts', icon: <FileText size={18} />, label: t('common.receipts'), color: 'text-purple-600', count: receipts.filter(r => r.status === 'Pending').length },
          { id: 'ledger', icon: <ShieldCheck size={18} />, label: t('common.ledger'), color: 'text-slate-600' },
          { id: 'analytics', icon: <BarChartIcon size={18} />, label: t('business.analytics'), color: 'text-pink-600' },
          { id: 'birthdays', icon: <Cake size={18} />, label: t('reports.birthdaysTab'), color: 'text-orange-600' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setReportTab(tab.id as any)}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${reportTab === tab.id ? `bg-slate-100 dark:bg-slate-800 ${tab.color} shadow-sm` : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.icon} {tab.label} {tab.count !== undefined && tab.count > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px]">{tab.count}</span>}
          </button>
        ))}
      </div>

      {reportTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('financial.collected')} ({monthName})</p>
               <p className="text-5xl font-black text-emerald-600 tracking-tighter tabular-nums">{t('common.currencySymbol')} {monthPaidTotal.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('financial.pending')}</p>
               <p className="text-5xl font-black text-red-600 tracking-tighter tabular-nums">{t('common.currencySymbol')} {monthUnpaidTotal.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600 rounded-full blur-[60px] opacity-20" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">{t('financial.health')}</p>
              <div className="flex items-center gap-6">
                <span className="text-5xl font-black tracking-tighter tabular-nums">{healthPercentage}%</span>
                <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-1000 shadow-lg shadow-blue-500/50" style={{ width: `${healthPercentage}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 animate-pulse">
                <Zap size={40} className="text-white" />
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{t('business.aiSpecialist')}</h2>
                <p className="text-slate-400 font-medium text-sm max-w-2xl leading-relaxed">{t('business.aiSpecialistDesc')}</p>
              </div>
              <button onClick={generateAiSuggestions} className="px-10 py-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-400 transition-all shrink-0">{t('business.aiSuggestBtn')}</button>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'monthly' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setSearchTerm('')} className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-700 shadow-sm dark:text-white">{t('common.all')}</button>
               </div>
             <button onClick={handleExportOverdue} className="flex items-center gap-3 bg-red-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20"><UserX size={16} /> {t('financial.exportOverdue')}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.name')}</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.value')}</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.date')}</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allStudents.map(s => {
                  const isPaid = s.lastPaymentDate?.startsWith(currentMonth);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-10 py-6 font-bold text-slate-900 dark:text-white uppercase text-sm">{s.name}</td>
                      <td className={`px-10 py-6 font-black tabular-nums ${isPaid ? 'text-green-600' : 'text-red-600'}`}>{t('common.currencySymbol')} {s.monthlyValue.toFixed(2)}</td>
                      <td className="px-10 py-6 text-xs font-medium text-slate-500">{t('common.dueDay')} {s.dueDay}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.billingPaused ? (
                            <button 
                              onClick={() => setShowPauseConfirm(s.id)}
                              className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black uppercase tracking-widest"
                            >
                              {t('common.billingPaused')}
                            </button>
                          ) : (
                            <>
                              {!isPaid ? (
                                <>
                                  <button onClick={() => { setSelectedStudent(s); setShowPix(true); }} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all" title="PIX"><QrCode size={18} /></button>
                                  <button onClick={() => setShowManualConfirm(s.id)} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all" title={t('common.manualPayment')}><DollarSign size={18} /></button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="inline-flex p-3 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-xl"><CheckCircle size={18} /></div>
                                  <button onClick={() => handlePrintReceipt(s, 'monthly')} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-all" title={t('common.print')}><Printer size={18} /></button>
                                </div>
                              )}
                              <button onClick={() => setShowPauseConfirm(s.id)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-amber-600 transition-all" title={t('common.pauseBilling')}><UserX size={18} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportTab === 'sales' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder={t('business.searchPlaceholder')} className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setIsAddingSale(true)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3"><Plus size={18} /> {t('business.addBtn')}</button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('business.serviceProduct')}</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('business.recipient')}</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.date')}</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.value')}</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSales.map(rev => (
                    <tr key={rev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-10 py-6">
                        <p className="font-black text-slate-900 dark:text-white uppercase text-sm">{rev.description}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1"><Tag size={10}/> {rev.category}</p>
                      </td>
                      <td className="px-10 py-6 text-xs font-bold dark:text-slate-300">{rev.studentName}</td>
                      <td className="px-10 py-6 text-xs font-medium text-slate-500">{new Date(rev.date).toLocaleDateString()}</td>
                      <td className="px-10 py-6 font-black text-emerald-600 text-sm tabular-nums">{t('common.currencySymbol')} {rev.amount.toFixed(2)}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handlePrintReceipt(rev, 'extra')} className="p-3 text-slate-400 hover:text-blue-600 transition-colors" title={t('common.print')}><Printer size={18} /></button>
                          <button onClick={() => deleteExtraRevenue(rev.id)} className="p-3 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><Package className="text-blue-600" /> {t('business.products')}</h3>
              <button onClick={() => setIsAddingProduct(true)} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"><Plus size={18} /></button>
            </div>
            <div className="p-8 space-y-4">
              {products.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="font-black text-sm dark:text-white uppercase">{product.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600">{t('common.currencySymbol')} {product.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><Zap className="text-amber-500" /> {t('business.plans')}</h3>
              <button onClick={() => setIsAddingPlan(true)} className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all"><Plus size={18} /></button>
            </div>
            <div className="p-8 space-y-4">
              {plans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="font-black text-sm dark:text-white uppercase">{plan.name}</p>
                    <p className="text-[10px] font-bold text-blue-600">{t('common.currencySymbol')} {plan.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => deletePlan(plan.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><BarChartIcon className="text-blue-600" /> {t('reports.revenueStream')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueStreamData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} dy={15} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><PieChartIcon className="text-indigo-600" /> {t('reports.beltPopulation')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={beltDistributionData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                    {beltDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'birthdays' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
               {months.map((m, idx) => (
                 <button key={m} onClick={() => setSelectedMonth(idx)} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === idx ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{m.substring(0, 3)}</button>
               ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthlyBirthdays.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-400 tabular-nums">{new Date(s.birthDate!).getDate()}</div>
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t('reports.birthday')}</p>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mt-1">{s.name}</h4>
                </div>
              </div>
            ))}
            {monthlyBirthdays.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">{t('reports.noBirthdays')}</div>}
          </div>
        </div>
      )}

      {reportTab === 'receipts' && (
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <FileText className="text-purple-600" /> {t('common.receipts')}
            </h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
              <ShieldCheck size={16} className="text-purple-600" />
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Auditoria IA Ativa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {receipts.map(r => (
              <div key={r.id} className={`bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 transition-all space-y-6 shadow-sm ${
                r.aiAnalysis?.fraudAlert ? 'border-red-500 shadow-red-500/10' : 
                r.aiAnalysis?.isValid ? 'border-green-500 shadow-green-500/10' : 'border-slate-100 dark:border-slate-800'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-black dark:text-white uppercase tracking-tighter leading-none">{r.studentName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{r.date}</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    r.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                    r.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {t(`common.${r.status.toLowerCase()}`)}
                  </span>
                </div>

                <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                  <img src={r.receiptUrl} className="w-full h-full object-cover" alt="Receipt" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => window.open(r.receiptUrl, '_blank')} className="p-4 bg-white text-slate-900 rounded-full shadow-xl"><Eye size={24} /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black dark:text-white tabular-nums">{t('common.currencySymbol')} {r.amount.toFixed(2)}</p>
                  {r.status === 'Pending' && (
                    <button 
                      onClick={() => handleAiVerify(r.id)}
                      disabled={isVerifying === r.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        r.aiAnalysis ? 'bg-slate-100 text-slate-600' : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700'
                      }`}
                    >
                      {isVerifying === r.id ? <Clock size={14} className="animate-spin" /> : <Zap size={14} />}
                      {r.aiAnalysis ? 'Re-analisar' : 'Auditoria IA'}
                    </button>
                  )}
                </div>

                {r.aiAnalysis && (
                  <div className={`p-5 rounded-2xl border space-y-2 ${r.aiAnalysis.fraudAlert ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <div className="flex items-center gap-2">
                      {r.aiAnalysis.fraudAlert ? <ShieldAlert size={16} className="text-red-600" /> : <ShieldCheck size={16} className="text-green-600" />}
                      <p className={`text-[10px] font-black uppercase tracking-widest ${r.aiAnalysis.fraudAlert ? 'text-red-600' : 'text-green-600'}`}>
                        {r.aiAnalysis.fraudAlert ? 'Alerta de Inconsistência' : 'Verificado pela IA'}
                      </p>
                    </div>
                    {r.aiAnalysis.fraudAlert && <p className="text-xs font-bold text-red-700">{r.aiAnalysis.fraudAlert}</p>}
                    <p className="text-[10px] font-medium text-slate-600 leading-relaxed">{r.aiAnalysis.analysis}</p>
                    <div className="flex gap-4 mt-2 pt-2 border-t border-slate-200/50">
                      <div className="text-center flex-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Confiança</p>
                        <p className="text-xs font-black text-slate-700">{Math.round(r.aiAnalysis.confidence * 100)}%</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Valor Lido</p>
                        <p className="text-xs font-black text-slate-700">R$ {r.aiAnalysis.detectedAmount?.toFixed(2) || '---'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {r.status === 'Pending' && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => approveReceipt(r.id)}
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                    >
                      {t('common.approve')}
                    </button>
                    <button 
                      onClick={() => rejectReceipt(r.id)}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all"
                    >
                      {t('common.reject')}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {receipts.length === 0 && (
              <div className="col-span-full py-32 text-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <FileText size={40} />
                </div>
                <p className="text-slate-400 italic font-bold uppercase tracking-widest text-sm">
                  {t('financial.noRecords')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {reportTab === 'ledger' && (
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <Lock className="text-indigo-600" /> {t('common.ledger')}
            </h3>
            <button 
              onClick={handleVerifyIntegrity}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              <ShieldCheck size={16} /> {t('common.integrityCheck')}
            </button>
          </div>

          {integrityStatus && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${integrityStatus.valid ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {integrityStatus.valid ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              <span className="text-xs font-black uppercase tracking-widest">{integrityStatus.message}</span>
            </div>
          )}

          <div className="space-y-4">
            {ledger.map((block, idx) => (
              <div key={block.id} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck size={80} className="text-indigo-600" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Block #{ledger.length - 1 - idx}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(block.timestamp).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('common.transaction')}</p>
                    <p className="text-xs font-bold dark:text-slate-200">{block.description}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('common.hash')}</p>
                    <p className="text-[8px] font-mono break-all text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg">{block.hash}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('common.previousHash')}</p>
                    <p className="text-[8px] font-mono break-all text-slate-400 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg">{block.previousHash}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-2xl w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Zap size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t('business.aiSpecialist')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análise de Performance Financeira</p>
                  </div>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-red-500"><X/></button>
             </div>
             {isAiLoading ? (
               <div className="py-20 flex flex-col items-center justify-center gap-6">
                 <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                 <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">IA SYSBJJ Analisando seu Dojo...</p>
               </div>
             ) : (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 gap-4">
                   {aiSuggestions.map((suggestion, idx) => (
                     <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex gap-4 group hover:border-emerald-500 transition-all">
                       <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</div>
                       <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{suggestion}</p>
                     </div>
                   ))}
                 </div>
                 <button onClick={() => setShowAiModal(false)} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Entendido, Sensei! Oss.</button>
               </div>
             )}
          </div>
        </div>
      )}

      {isAddingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t('business.newTitle')}</h3>
                <button onClick={() => setIsAddingSale(false)} className="text-slate-400 hover:text-red-500"><X/></button>
             </div>
             <form onSubmit={handleSaleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('business.selectCatalog')}</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold appearance-none" onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const [type, id] = val.split(':');
                        if (type === 'prod') {
                          const p = products.find(p => p.id === id);
                          if (p) setSaleFormData({...saleFormData, description: p.name, amount: p.price, category: ExtraRevenueCategory.PRODUCT});
                        } else if (type === 'plan') {
                          const pl = plans.find(p => p.id === id);
                          if (pl) setSaleFormData({...saleFormData, description: pl.name, amount: pl.price, category: ExtraRevenueCategory.OTHER});
                        }
                      }}>
                      <option value="">-- {t('common.all')} --</option>
                      <optgroup label={t('business.products')}>
                        {products.map(p => <option key={p.id} value={`prod:${p.id}`}>{p.name} - {t('common.currencySymbol')} {p.price.toFixed(2)}</option>)}
                      </optgroup>
                      <optgroup label={t('business.plans')}>
                        {plans.map(p => <option key={p.id} value={`plan:${p.id}`}>{p.name} - {t('common.currencySymbol')} {p.price.toFixed(2)}</option>)}
                      </optgroup>
                    </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('business.category')}</label>
                   <div className="grid grid-cols-2 gap-2">
                      {Object.values(ExtraRevenueCategory).map(cat => (
                        <button key={cat} type="button" onClick={() => setSaleFormData({...saleFormData, category: cat})} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${saleFormData.category === cat ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-500'}`}>{cat}</button>
                      ))}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('business.description')}</label>
                   <input required type="text" placeholder={t('business.saleDescriptionPlaceholder')} value={saleFormData.description} onChange={e => setSaleFormData({...saleFormData, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.value')} ({t('common.currencySymbol')})</label>
                      <input required type="number" step="0.01" value={isNaN(saleFormData.amount) ? '' : saleFormData.amount} onChange={e => setSaleFormData({...saleFormData, amount: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('business.linkStudent')}</label>
                      <select value={saleFormData.studentId} onChange={e => setSaleFormData({...saleFormData, studentId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold appearance-none">
                        <option value="">{t('business.externalClientOption')}</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">{t('business.saveBtn').toUpperCase()}</button>
             </form>
          </div>
        </div>
      )}

      {isAddingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t('business.addProduct')}</h3>
                <button onClick={() => setIsAddingProduct(false)} className="text-slate-400 hover:text-red-500"><X/></button>
             </div>
             <form onSubmit={(e) => { e.preventDefault(); addProduct(productForm); setIsAddingProduct(false); setProductForm({ name: '', price: 0, category: ExtraRevenueCategory.PRODUCT, stock: 0 }); }} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.name')}</label>
                   <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.value')}</label>
                   <input required type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">{t('common.save')}</button>
             </form>
          </div>
        </div>
      )}

      {isAddingPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t('business.addPlan')}</h3>
                <button onClick={() => setIsAddingPlan(false)} className="text-slate-400 hover:text-red-500"><X/></button>
             </div>
             <form onSubmit={(e) => { e.preventDefault(); addPlan(planForm); setIsAddingPlan(false); setPlanForm({ name: '', price: 0, description: '' }); }} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.name')}</label>
                   <input required type="text" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.value')}</label>
                   <input required type="number" step="0.01" value={planForm.price} onChange={e => setPlanForm({...planForm, price: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                </div>
                <button type="submit" className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">{t('common.save')}</button>
             </form>
          </div>
        </div>
      )}

      {/* Pix Modal (Existing) */}
      {showPix && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-md w-full p-10 text-center space-y-8 animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-hide">
            <button onClick={() => setShowPix(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X /></button>
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl rotate-3"><QrCode size={40} /></div>
            <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t('financial.pixTitle')}</h3>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatePixPayload(selectedStudent.monthlyValue, selectedStudent.name))}`} 
                 className="w-48 h-48 mx-auto" 
                 alt="QR Code PIX"
               />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleRecordPayment(selectedStudent)}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle size={18} /> {t('financial.confirmPayment').toUpperCase()}
              </button>
              <button 
                onClick={copyToClipboard}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <Copy size={16} /> {copied ? t('business.copied') : t('financial.copyPix').toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Confirmation */}
      {showManualConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <DollarSign size={32} />
            </div>
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-2">{t('business.confirmManual')}</h3>
            <p className="text-slate-500 text-sm mb-8">{students.find(s => s.id === showManualConfirm)?.name}</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowManualConfirm(null)}
                className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={() => handleManualPayment(students.find(s => s.id === showManualConfirm))}
                className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Billing Confirmation */}
      {showPauseConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserX size={32} />
            </div>
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-2">
              {students.find(s => s.id === showPauseConfirm)?.billingPaused ? t('business.confirmResume') : t('business.confirmPause')}
            </h3>
            <p className="text-slate-500 text-sm mb-8">{students.find(s => s.id === showPauseConfirm)?.name}</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowPauseConfirm(null)}
                className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={() => handleTogglePause(students.find(s => s.id === showPauseConfirm))}
                className="py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessHub;
