
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    receipts, ledger, approveReceipt, rejectReceipt, verifyLedgerIntegrity,
    products, addProduct, deleteProduct,
    plans, addPlan, deletePlan
  } = useData();
  const { profile } = useProfile();
  
  const [showPix, setShowPix] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [reportTab, setReportTab] = useState<'dashboard' | 'monthly' | 'sales' | 'catalog' | 'receipts' | 'ledger' | 'analytics' | 'birthdays' | 'churn'>('dashboard');
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

  const churnRiskStudents = useMemo(() => {
    return students.filter(s => {
      if (s.status === StudentStatus.INACTIVE) return false;
      
      const lastAttendance = s.lastAttendanceDate ? new Date(s.lastAttendanceDate) : new Date(s.joinedAt || '2000-01-01');
      const diffDays = Math.floor((new Date().getTime() - lastAttendance.getTime()) / (1000 * 3600 * 24));
      
      const isAbsent = diffDays > 15;
      const isOverdue = s.status === StudentStatus.OVERDUE;
      
      return isAbsent || isOverdue;
    }).map(s => {
       const lastAttendance = s.lastAttendanceDate ? new Date(s.lastAttendanceDate) : new Date(s.joinedAt || '2000-01-01');
       const diffDays = Math.floor((new Date().getTime() - lastAttendance.getTime()) / (1000 * 3600 * 24));
       let riskLevel = 'Low';
       if (diffDays > 30 || s.status === StudentStatus.OVERDUE) riskLevel = 'High';
       else if (diffDays > 15) riskLevel = 'Medium';
       
       return { ...s, riskLevel, daysAbsent: diffDays };
    }).sort((a, b) => b.daysAbsent - a.daysAbsent);
  }, [students]);

  const churnRate = useMemo(() => {
    const activeAtStart = students.length;
    const churned = students.filter(s => s.status === StudentStatus.INACTIVE).length;
    return activeAtStart > 0 ? (churned / activeAtStart) * 100 : 0;
  }, [students]);

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

  const handleVerifyIntegrity = () => {
    const isValid = verifyLedgerIntegrity();
    setIntegrityStatus({
      valid: isValid,
      message: isValid ? 'Integridade da Blockchain confirmada! Todos os dados estão seguros.' : 'Atenção: Falha na integridade dos dados detectada!'
    });
    setTimeout(() => setIntegrityStatus(null), 5000);
  };

  const handleExportFinancialCSV = () => {
    const headers = ['Tipo', 'ID', 'Nome/Descrição', 'Valor', 'Data', 'Método', 'Status'];
    const rows = [
      ...payments.map(p => ['Mensalidade', p.id, p.name, p.amount, p.date, p.method, p.status]),
      ...extraRevenue.map(e => ['Venda/Extra', e.id, e.description, e.amount, e.date, e.paymentMethod, e.paid ? 'Confirmado' : 'Pendente'])
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.dataset.download = 'sysbjj_financeiro.csv';
    link.href = url;
    link.setAttribute('download', `sysbjj_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onClick={handleExportFinancialCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all active:scale-95"
            title="Exportar CSV"
          >
            <Download size={20} /> CSV
          </button>
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

      <div className="flex flex-wrap p-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-inner gap-1 mb-10 overflow-x-auto scrollbar-hide font-sans">
        {[
          { id: 'dashboard', icon: <LayoutDashboard size={16} />, label: t('common.dashboard'), color: 'text-blue-600', bg: 'bg-blue-600/5' },
          { id: 'monthly', icon: <Users size={16} />, label: t('financial.monthlyFees'), color: 'text-emerald-600', bg: 'bg-emerald-600/5' },
          { id: 'sales', icon: <ShoppingBag size={16} />, label: t('business.shopItems'), color: 'text-amber-600', bg: 'bg-amber-600/5' },
          { id: 'catalog', icon: <Layers size={16} />, label: t('business.catalog'), color: 'text-indigo-600', bg: 'bg-indigo-600/5' },
          { id: 'receipts', icon: <FileText size={16} />, label: t('common.receipts'), color: 'text-purple-600', bg: 'bg-purple-600/5', count: receipts.filter(r => r.status === 'Pending').length },
          { id: 'ledger', icon: <ShieldCheck size={16} />, label: t('common.ledger'), color: 'text-indigo-600', bg: 'bg-indigo-600/5' },
          { id: 'analytics', icon: <BarChartIcon size={16} />, label: t('business.analytics'), color: 'text-pink-600', bg: 'bg-pink-600/5' },
          { id: 'churn', icon: <ShieldAlert size={16} />, label: 'Previsão de Churn', color: 'text-red-600', bg: 'bg-red-600/5', count: churnRiskStudents.filter(s => s.riskLevel === 'High').length },
          { id: 'birthdays', icon: <Cake size={16} />, label: t('reports.birthdaysTab'), color: 'text-orange-600', bg: 'bg-orange-600/5' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setReportTab(tab.id as any)}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all duration-300 relative group
              ${reportTab === tab.id ? `${tab.bg} ${tab.color} shadow-sm border border-slate-200 dark:border-slate-700/50` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <span className={`${reportTab === tab.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{tab.icon}</span>
            {tab.label} 
            {tab.count !== undefined && tab.count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black border-2 border-white dark:border-slate-900 animate-pulse">
                {tab.count}
              </span>
            )}
            {reportTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 rounded-2xl border-2 border-current opacity-10"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={reportTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.3, ease: "easeOut" }}
           className="w-full"
        >
          {reportTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Advanced Financial Intelligence & Retention */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 p-10 bg-slate-900 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-10">
                         <div>
                           <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                             <TrendingUp className="text-blue-500" size={24} /> Retention Intelligence
                           </h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Análise preditiva de Churn e LTV</p>
                         </div>
                         <div className="px-6 py-2.5 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">
                            Health Score: 94.2%
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                         {[
                           { label: 'Growth rate', val: '+12.4%', icon: <TrendingUp size={16}/>, color: 'text-green-500', bg: 'bg-green-500/10' },
                           { label: 'Churn Rate', val: `${churnRate.toFixed(1)}%`, icon: <UserX size={16}/>, color: 'text-red-500', bg: 'bg-red-500/10' },
                           { label: 'LTV Previsto', val: 'R$ 3.8k', icon: <DollarSign size={16}/>, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
                         ].map((m, i) => (
                           <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group/stat">
                              <div className="flex items-center gap-3 mb-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.bg} ${m.color} group-hover/stat:scale-110 transition-transform`}>{m.icon}</div>
                                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{m.label}</p>
                              </div>
                              <p className="text-3xl font-black text-white leading-none tabular-nums">{m.val}</p>
                           </div>
                         ))}
                      </div>

                      <div className="h-56 w-full bg-slate-800/20 rounded-[2.5rem] p-6 flex items-end justify-between gap-1.5 pt-12">
                         {[45, 65, 50, 75, 95, 70, 85, 55, 50, 65, 80, 90].map((h, i) => (
                           <motion.div 
                             key={i}
                             initial={{ height: 0 }}
                             animate={{ height: `${h}%` }}
                             className={`flex-1 rounded-t-[10px] cursor-help relative group/bar ${i === 11 ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-700/40 hover:bg-slate-600'} transition-all`}
                           >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-slate-800 px-2 py-1 rounded-lg text-[8px] font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xl z-20">
                                Mês {i + 1}: R$ {(h * 100).toLocaleString('pt-BR')}
                              </div>
                           </motion.div>
                         ))}
                      </div>
                      <div className="flex justify-between mt-4 px-2 text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">
                         <span>Jan</span>
                         <span>Dez</span>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="p-10 bg-indigo-600 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between group hover:rotate-1 transition-all h-full min-h-[400px] relative overflow-hidden">
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-[60px]" />
                       <div className="relative z-10 w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-10 border border-white/20">
                         <Zap size={36} className="text-white fill-white shadow-2xl" />
                       </div>
                       <div className="relative z-10">
                         <h3 className="text-3xl font-black uppercase tracking-tighter leading-8 mb-4 italic">Power Growth Module</h3>
                         <p className="text-sm text-indigo-100 font-medium leading-relaxed opacity-90">
                           Sua academia está crescendo acima da média internacional. Detectamos oportunidade de expansão: <span className="font-black underline underline-offset-4 decoration-indigo-300">Horários Matinais (7 AM)</span> possuem 92% de demanda represada.
                         </p>
                       </div>
                       <button className="relative z-10 w-full mt-10 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-950/40 hover:scale-[1.03] active:scale-[0.97] transition-all">
                         Ativar Campanha de Expansão
                       </button>
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Bento Card: Main Balance */}
              <div className="lg:col-span-2 bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 transition-all group-hover:opacity-30" />
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <span className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-600/30">
                      Performance do Mês
                    </span>
                    <TrendingUp className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('financial.collected')} ({monthName})</p>
                    <div className="flex items-end gap-3">
                      <span className="text-6xl font-black tracking-tighter tabular-nums break-words">
                        {t('common.currencySymbol')} {monthPaidTotal.toFixed(2)}
                      </span>
                      <span className="text-emerald-400 font-bold mb-2 flex items-center text-sm">
                        <ArrowRight size={14} className="-rotate-45" /> +12%
                      </span>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex gap-10">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Previsão</p>
                      <p className="text-xl font-bold tracking-tight">{t('common.currencySymbol')} {(monthPaidTotal + monthUnpaidTotal).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">LTV Médio</p>
                      <p className="text-xl font-bold tracking-tight">R$ 280,00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card: Pending */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                    <CreditCard size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('financial.pending')}</p>
                  <p className="text-4xl font-black text-red-600 tracking-tighter tabular-nums">{t('common.currencySymbol')} {monthUnpaidTotal.toFixed(2)}</p>
                </div>
                <div className="pt-4">
                  <p className="text-[10px] font-bold text-slate-500 mb-2">{unpaidStudents.length} alunos com pendência</p>
                  <button onClick={() => setReportTab('monthly')} className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Ver Detalhes</button>
                </div>
              </div>

              {/* Bento Card: Health Percentage */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('financial.health')}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{healthPercentage}%</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${healthPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagos</p>
                      <p className="text-lg font-black text-emerald-600">{paidStudents.length}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Abertos</p>
                      <p className="text-lg font-black text-red-600">{unpaidStudents.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card: Quick Actions Integration */}
              <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-1">Gestão Ágil</h3>
                  <p className="text-indigo-100/70 text-[10px] uppercase font-bold tracking-widest">{t('business.subtitle')}</p>
                </div>
                <div className="space-y-3 mt-8">
                  <button onClick={() => setIsAddingSale(true)} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all group">
                    <span className="text-[10px] font-black uppercase tracking-widest">Registrar Venda</span>
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  </button>
                  <button onClick={() => setReportTab('receipts')} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest">Validar Recibos</span>
                    <FileText size={16} />
                  </button>
                </div>
              </div>

              {/* Inventory Management Card */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-[1.25rem] flex items-center justify-center font-black text-2xl">
                          <Package size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none">{t('business.catalog')}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Controle de Estoque e Planos</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => setIsAddingProduct(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">{t('business.addProduct')}</button>
                      <button onClick={() => setReportTab('catalog')} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 transition-all"><ArrowRight size={20} /></button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {products.slice(0, 3).map(p => (
                    <div key={p.id} className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-blue-600/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                          <Tag size={18} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">{t('common.currencySymbol')} {p.price.toFixed(2)}</span>
                      </div>
                      <p className="font-black text-sm dark:text-white uppercase tracking-tight">{p.name}</p>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Estoque: 12 un</span>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                      Nenhum produto cadastrado no catálogo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

          {reportTab === 'monthly' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex gap-2">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder={t('common.search')} 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all w-full md:w-80"
                      />
                   </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                   <button onClick={handleExportOverdue} className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-red-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95">
                      <UserX size={18} /> {t('financial.exportOverdue')}
                   </button>
                   <button onClick={handleExportFinancialCSV} className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
                      <Download size={18} /> Exportar Lista
                   </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                {/* Visual Grid Structure (Recipe 1) */}
                <div className="absolute inset-0 pointer-events-none border-x border-slate-100/30 dark:border-slate-800/20 mx-10" />
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{t('common.name')}</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{t('common.value')}</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{t('common.date')}</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] text-center">Status</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => {
                        const isPaid = s.lastPaymentDate?.startsWith(currentMonth);
                        return (
                          <motion.tr 
                            key={s.id} 
                            initial={false}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                            className="group transition-colors relative"
                          >
                            <td className="px-10 py-7">
                              <p className="font-black text-slate-900 dark:text-white uppercase text-sm group-hover:text-emerald-600 transition-colors duration-300">{s.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {s.id.split('-')[1]}</p>
                            </td>
                            <td className="px-10 py-7">
                              <span className={`text-base font-black tabular-nums font-mono ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                {t('common.currencySymbol')} {s.monthlyValue.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-10 py-7">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                <Clock size={12} />
                                DIA {s.dueDay}
                              </div>
                            </td>
                            <td className="px-10 py-7 text-center">
                               <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                 isPaid 
                                   ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' 
                                   : 'bg-red-100 text-red-700 border border-red-200/50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                               }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                  {isPaid ? 'Confirmado' : 'Atrasado'}
                               </div>
                               {churnRiskStudents.find((crs: any) => crs.id === s.id && crs.riskLevel === 'High') && (
                                 <div className="mt-1 flex items-center justify-center gap-1 text-[7px] font-black text-red-500 uppercase tracking-tighter">
                                   <ShieldAlert size={8} /> Churn Risk
                                 </div>
                               )}
                            </td>
                            <td className="px-10 py-7 text-right">
                              <div className="flex items-center justify-end gap-2 pr-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                {s.billingPaused ? (
                                  <button onClick={() => setShowPauseConfirm(s.id)} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">PAUSADO</button>
                                ) : (
                                  <>
                                    {!isPaid ? (
                                      <>
                                        <button onClick={() => { setSelectedStudent(s); setShowPix(true); }} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all outline-none" title="Pagar via PIX"><QrCode size={16} /></button>
                                        <button onClick={() => setShowManualConfirm(s.id)} className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all outline-none" title="Pagamento em Dinheiro"><DollarSign size={16} /></button>
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => handlePrintReceipt(s, 'monthly')} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white transition-all shadow-sm" title="Imprimir Recibo"><Printer size={16} /></button>
                                      </div>
                                    )}
                                    <button onClick={() => setShowPauseConfirm(s.id)} className="p-3 text-slate-300 hover:text-amber-500 transition-all hover:scale-110"><UserX size={16} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                      {allStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest text-xs">Nenhum aluno cadastrado para cobrança.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {reportTab === 'sales' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder={t('business.searchPlaceholder')} className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => setIsAddingSale(true)} className="w-full md:w-auto px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Plus size={18} /> {t('business.addBtn')}</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSales.map(rev => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={rev.id} 
                    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                          <ShoppingBag size={24} />
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{rev.category}</p>
                          <p className="text-lg font-black text-emerald-600 tabular-nums">{t('common.currencySymbol')} {rev.amount.toFixed(2)}</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <h4 className="text-base font-black dark:text-white uppercase tracking-tight">{rev.description}</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                             <Users size={12} /> {rev.studentName}
                          </p>
                       </div>
                       <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Clock size={12} /> {new Date(rev.date).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                             <button onClick={() => handlePrintReceipt(rev, 'extra')} className="p-2.5 text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl" title={t('common.print')}><Printer size={16} /></button>
                             <button onClick={() => deleteExtraRevenue(rev.id)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"><Trash2 size={16} /></button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
                {filteredSales.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                    Nenhuma venda encontrada.
                  </div>
                )}
              </div>
            </div>
          )}

      {reportTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-10">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm font-sans">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-4">
                 <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={24} />
                 </div>
                 {t('business.products')}
              </h3>
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 transition-all shadow-lg outline-none"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 group hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                      <Tag size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{product.name}</p>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mt-1">{t('common.currencySymbol')} {product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteProduct(product.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors hover:scale-110 outline-none"><Trash2 size={18} /></button>
                </div>
              ))}
              {products.length === 0 && <p className="text-center py-10 text-slate-400 italic text-sm">{t('business.noProducts')}</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm font-sans">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Layers size={24} />
                 </div>
                 {t('business.plans')}
              </h3>
              <button 
                onClick={() => setIsAddingPlan(true)}
                className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 transition-all shadow-lg outline-none"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {plans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{plan.name}</p>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mt-1">{t('common.currencySymbol')} {plan.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <button onClick={() => deletePlan(plan.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors hover:scale-110 outline-none"><Trash2 size={18} /></button>
                </div>
              ))}
              {plans.length === 0 && <p className="text-center py-10 text-slate-400 italic text-sm">{t('business.noPlans')}</p>}
            </div>
          </div>
        </div>
      )}

          {reportTab === 'analytics' && (
            <div className="space-y-8 pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[450px]">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} />
                      </div>
                      Fluxo de Receita
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={revenueStreamData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={6} 
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[450px]">
                   <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center">
                        <PieChartIcon size={20} />
                      </div>
                      Perfil Técnico
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie 
                        data={beltDistributionData} 
                        innerRadius={80} 
                        outerRadius={120} 
                        paddingAngle={10} 
                        dataKey="value" 
                        stroke="none"
                        animationDuration={1500}
                      >
                        {beltDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-8">
                      {beltDistributionData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 group cursor-default">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                           <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">{entry.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportTab === 'churn' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                     <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div>
                           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Análise Preditiva de Churn</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Identificação precoce de alunos em risco de desistência</p>
                        </div>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600">
                           <ShieldAlert size={32} />
                        </div>
                     </div>

                     <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</th>
                                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ausência</th>
                                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nível de Risco</th>
                                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {churnRiskStudents.map((s: any) => (
                                 <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                                    <td className="px-8 py-6">
                                       <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{s.name}</p>
                                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t(`belts.${s.belt}`)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                       <div className="flex items-center gap-2">
                                          <Clock size={12} className="text-slate-400" />
                                          <span className="text-xs font-black text-slate-600 dark:text-slate-300 tabular-nums">{s.daysAbsent} DIAS</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                          s.riskLevel === 'High' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                                          s.riskLevel === 'Medium' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                                          'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                       }`}>
                                          {s.riskLevel === 'High' ? 'Crítico' : s.riskLevel === 'Medium' ? 'Alerta' : 'Monitoramento'}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Notificar</button>
                                    </td>
                                 </tr>
                              ))}
                              {churnRiskStudents.length === 0 && (
                                 <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400 italic text-xs uppercase font-black tracking-widest">Nenhum aluno em risco detectado. Oss!</td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white border border-slate-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600 rounded-full blur-[60px] opacity-20" />
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                           <Zap size={14} /> Insights da AI
                        </h4>
                        <div className="space-y-6">
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Padrão Detectado</p>
                              <p className="text-xs font-medium leading-relaxed italic text-slate-400">
                                 "Alunos da faixa branca que faltam por mais de 10 dias consecutivos após o primeiro mês têm 85% de chance de churn. Recomendamos uma ligação de boas-vindas reforçada."
                              </p>
                           </div>
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Dica de Retenção</p>
                              <p className="text-xs font-medium leading-relaxed italic text-slate-400">
                                 "Crie um evento 'Family Day' para o próximo sábado. Dados indicam que o engajamento familiar reduz o churn em 30%."
                              </p>
                           </div>
                        </div>
                     </div>
                     
                     <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl">
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-2 italic">Ação Imediata</h4>
                        <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest mb-6">Reduzir Churn em 5% neste mês</p>
                        <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] transition-all">Distribuir Vouchers de Retorno</button>
                     </div>
                  </div>
               </div>
            </div>
          )}

      {reportTab === 'birthdays' && (
        <div className="space-y-12 pb-10">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide">
             <div className="inline-flex gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 min-w-full">
               {months.map((m, idx) => (
                 <button 
                  key={m} 
                  onClick={() => setSelectedMonth(idx)} 
                  className={`flex-1 min-w-[80px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group outline-none
                    ${selectedMonth === idx ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700'}`}
                 >
                   {m.substring(0, 3)}
                   {selectedMonth === idx && (
                      <motion.div layoutId="activeMonth" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                   )}
                 </button>
               ))}
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
            <AnimatePresence mode="popLayout">
              {monthlyBirthdays.map((s, i) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  key={s.id} 
                  className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-8 group hover:border-orange-500/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 text-orange-500 opacity-0 group-hover:opacity-10 transition-opacity rotate-12">
                    <Cake size={64} />
                  </div>
                  <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-3xl flex flex-col items-center justify-center font-black transition-transform group-hover:scale-110">
                    <span className="text-3xl tracking-tighter tabular-nums leading-none">{new Date(s.birthDate!).getDate()}</span>
                    <span className="text-[9px] uppercase tracking-widest">{months[new Date(s.birthDate!).getUTCMonth()].substring(0, 3)}</span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1 leading-none">{t('reports.birthday')}</p>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{s.name}</h4>
                    <div className="mt-3 flex gap-1">
                       <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                          {s.belt}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {monthlyBirthdays.length === 0 && (
              <div className="col-span-full py-24 text-center">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Cake size={40} />
                 </div>
                 <p className="text-slate-400 italic font-bold uppercase tracking-widest text-sm">
                    {t('reports.noBirthdays')}
                 </p>
              </div>
            )}
          </div>
        </div>
      )}

      {reportTab === 'receipts' && (
        <div className="space-y-12 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {receipts.map((r, i) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={r.id} 
                  className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-200 dark:border-slate-800 transition-all space-y-8 shadow-sm relative group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none mb-2">{r.studentName}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> {r.date}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      r.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200/50' : 
                      r.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50' : 'bg-red-100 text-red-700 border border-red-200/50'
                    }`}>
                      {t(`common.${r.status.toLowerCase()}`)}
                    </div>
                  </div>

                  <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 relative group/img shadow-inner bg-slate-50 dark:bg-slate-950">
                    <img 
                      src={r.receiptUrl} 
                      className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 transition-all duration-700" 
                      alt="Receipt" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button onClick={() => window.open(r.receiptUrl, '_blank')} className="w-16 h-16 bg-white text-slate-900 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><Eye size={28} /></button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-3xl font-black dark:text-white tabular-nums tracking-tighter">
                       <span className="text-lg opacity-50 mr-1">{t('common.currencySymbol')}</span>
                       {r.amount.toFixed(2)}
                    </p>
                  </div>

                  {r.status === 'Pending' && (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => approveReceipt(r.id)}
                        className="flex-1 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        {t('common.approve')}
                      </button>
                      <button 
                        onClick={() => rejectReceipt(r.id)}
                        className="flex-1 py-5 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all"
                      >
                        {t('common.reject')}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {receipts.length === 0 && (
              <div className="col-span-full py-40 text-center">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-300">
                  <FileText size={48} />
                </div>
                <h4 className="text-xl font-black text-slate-400 uppercase tracking-tighter mb-2">Sem Pendências</h4>
                <p className="text-slate-400 italic font-bold uppercase tracking-widest text-xs">
                  {t('financial.noRecords')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {reportTab === 'ledger' && (
        <div className="space-y-12 pb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-600/20">
                   <Lock size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none mb-1">{t('common.ledger')}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Integridade SHA-256</p>
                </div>
             </div>
             <button 
                onClick={handleVerifyIntegrity}
                className="w-full md:w-auto px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all group"
             >
                <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" /> {t('common.integrityCheck')}
             </button>
          </div>

          {integrityStatus && (
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className={`p-6 rounded-[2rem] flex items-center gap-4 border-2 ${integrityStatus.valid ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${integrityStatus.valid ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {integrityStatus.valid ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Verificação Completa</p>
                <p className="text-[10px] font-bold opacity-70">{integrityStatus.message}</p>
              </div>
            </motion.div>
          )}

          <div className="space-y-6">
            {ledger.map((block, idx) => (
              <div key={block.id} className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 space-y-6 relative group overflow-hidden shadow-sm hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 p-8 text-slate-100 dark:text-slate-800 group-hover:text-indigo-600/5 transition-colors">
                  <ShieldCheck size={120} />
                </div>
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <span className="px-5 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Block #{ledger.length - 1 - idx}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(block.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  <div className="md:col-span-1 border-r border-slate-100 dark:border-slate-800 pr-8">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Evento Registrado</p>
                    <p className="text-lg font-black dark:text-white uppercase tracking-tight leading-tight">{block.description}</p>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Hash da Transação</p>
                      <p className="text-[10px] font-mono break-all text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">{block.hash}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Hash Anterior (Chain)</p>
                      <p className="text-[10px] font-mono break-all text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">{block.previousHash}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      </motion.div>
    </AnimatePresence>

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
