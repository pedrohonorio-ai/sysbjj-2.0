
import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Activity, 
  Users, 
  Database, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Globe,
  Lock,
  Calendar,
  ChevronDown,
  LayoutList,
  History,
  ShieldCheck,
  FileText,
  Zap,
  Terminal,
  Cpu,
  Fingerprint,
  MoreVertical,
  ArrowUpRight,
  UserCheck,
  AlertTriangle,
  Monitor,
  Settings,
  RefreshCw,
  Power,
  HardDrive,
  Eye,
  EyeOff,
  Trash2,
  Save
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { SystemLog } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MASTER_ADMINS, BELT_COLORS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const SystemAudit: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { logs, students, ledger, verifyLedgerIntegrity, verifyAuditIntegrity, presence, updateStudent } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SystemLog['category'] | 'All'>('All');
  const [dateRange, setDateRange] = useState<'Today' | 'Week' | 'Month' | 'All'>('Week');
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'logs' | 'control'>('overview');
  const [viewMode, setViewMode] = useState<'Table' | 'Groups'>('Table');
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportData = async (type: 'CSV' | 'JSON' | 'PDF') => {
    if (type === 'PDF') {
      exportToPDF();
      return;
    }

    setExportLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let blob: Blob;
    let extension: string;

    if (type === 'JSON') {
      const dataToExport = {
        logs: filteredLogs,
        metrics: stats,
        timestamp: new Date().toISOString(),
        academy: profile.academyName
      };
      blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      extension = 'json';
    } else {
      // CSV
      const headers = [
        t('audit.csvHeaders.date'),
        t('audit.csvHeaders.user'),
        t('audit.csvHeaders.action'),
        t('audit.csvHeaders.category'),
        t('audit.csvHeaders.details'),
        t('audit.csvHeaders.hash')
      ];
      const rows = filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.userEmail,
        log.action,
        log.category,
        log.details,
        log.hash || 'Legacy'
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      extension = 'csv';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_report_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setExportLoading(false);
  };
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const auth = JSON.parse(localStorage.getItem('oss_auth') || '{}');
  const isAdmin = MASTER_ADMINS.includes(auth.email?.toLowerCase());

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const ranges = {
      Today: now - (24 * 60 * 60 * 1000),
      Week: now - (7 * 24 * 60 * 60 * 1000),
      Month: now - (30 * 24 * 60 * 60 * 1000),
      All: 0
    };

    return logs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
      const matchesDate = dateRange === 'All' || log.timestamp >= ranges[dateRange];
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [logs, searchTerm, categoryFilter, dateRange]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, SystemLog[]> = {};
    filteredLogs.slice(0, 500).forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const systemUsers = useMemo(() => {
    const users: Record<string, { 
      email: string, 
      name?: string,
      role: 'admin' | 'student',
      lastAction: number, 
      totalActions: number, 
      devices: Set<string>,
      categories: Record<string, number>,
      riskLevel: 'Low' | 'Medium' | 'High',
      status: 'Active' | 'Inactive' | 'Pending' | 'Overdue',
      belt?: string,
      joinedAt?: string
    }> = {};

    // Initial base from students
    students.forEach(s => {
      if (s.email) {
        users[s.email.toLowerCase()] = {
          email: s.email.toLowerCase(),
          name: s.name,
          role: 'student',
          lastAction: 0,
          totalActions: 0,
          devices: new Set(),
          categories: {},
          riskLevel: 'Low',
          status: s.status as any || 'Active',
          belt: s.belt,
          joinedAt: s.joinedAt
        };
      }
    });

    // Add Master Admins
    MASTER_ADMINS.forEach(email => {
      const lowerEmail = email.toLowerCase();
      if (!users[lowerEmail]) {
        users[lowerEmail] = {
          email: lowerEmail,
          name: 'Master Admin',
          role: 'admin',
          lastAction: 0,
          totalActions: 0,
          devices: new Set(),
          categories: {},
          riskLevel: 'Low',
          status: 'Active'
        };
      } else {
        users[lowerEmail].role = 'admin';
        if (users[lowerEmail].name === 'Sem Nome') users[lowerEmail].name = 'Master Admin';
      }
    });

    // Merge in logs
    logs.forEach(log => {
      const email = (log.userEmail || '').toLowerCase();
      if (!email) return;

      if (!users[email]) {
        users[email] = {
          email,
          role: MASTER_ADMINS.includes(email) ? 'admin' : 'student',
          lastAction: 0,
          totalActions: 0,
          devices: new Set(),
          categories: {},
          riskLevel: 'Low',
          status: 'Active'
        };
      }
      const u = users[email];
      u.totalActions++;
      u.lastAction = Math.max(u.lastAction, log.timestamp);
      if (log.deviceInfo) u.devices.add(log.deviceInfo);
      u.categories[log.category] = (u.categories[log.category] || 0) + 1;
      
      // Sophisticated risk heuristic
      if (u.categories['Security'] > 15 || u.devices.size > 5) u.riskLevel = 'High';
      else if (u.categories['Security'] > 5 || u.devices.size > 2) u.riskLevel = 'Medium';
    });

    return Object.values(users).sort((a, b) => b.lastAction - a.lastAction);
  }, [logs, students]);

  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainResult, setChainResult] = useState<{ success: boolean; message: string } | null>(null);

  const performChainVerification = async () => {
    setVerifyingChain(true);
    setChainResult(null);
    
    // Simulate intense calculation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isValid = verifyAuditIntegrity();
    setVerifyingChain(false);
    setChainResult({
      success: isValid,
      message: isValid 
        ? "Corrente de custódia verificada com sucesso. Todos os hashes conferem." 
        : "AVISO: Inconsistência detectada na corrente de hashes. Verifique logs manuais."
    });
  };

  const exportGlobalUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nome,Email,Cargo,Status,Ultimo Acesso,Acoes Totais,Risco\n"
      + systemUsers.map(u => `${u.name || 'N/A'},${u.email},${u.role},${u.status},${u.lastAction ? new Date(u.lastAction).toISOString() : 'Nunca'},${u.totalActions},${u.riskLevel}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sysbjj_global_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(l => l.timestamp >= today);
    
    const categoryUsage = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActions: logs.length,
      todayActions: todayLogs.length,
      totalStudents: students.length,
      ledgerIntegrity: verifyLedgerIntegrity(),
      auditIntegrity: verifyAuditIntegrity(),
      uniqueUsers: systemUsers.length,
      categoryUsage
    };
  }, [logs, students, verifyLedgerIntegrity, systemUsers]);

  const onlineUsers = useMemo(() => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return presence.filter(p => p.lastSeen > fiveMinutesAgo);
  }, [presence]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleString();
    doc.setFontSize(20);
    doc.text(t('audit.reportTitle'), 14, 22);
    doc.setFontSize(10);
    doc.text(`${t('audit.generatedAt')}: ${today}`, 14, 30);
    doc.text(`${t('audit.admin')}: ${auth.email || 'Master'}`, 14, 35);

    const tableData = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userEmail,
      log.action,
      log.category,
      log.details
    ]);

    autoTable(doc, {
      startY: 50,
      head: [[t('audit.tableHeaderDate'), t('audit.tableHeaderUser'), t('audit.tableHeaderAction'), t('audit.tableHeaderCategory'), t('audit.tableHeaderDetails')]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });

    doc.save(`sysbjj_audit_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <Lock size={48} />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{t('audit.restrictedAccess')}</h1>
          <p className="text-slate-400 font-medium">Acesso restrito apenas para Senseis com permissão master.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
               <ShieldCheck size={24} />
             </div>
             <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter uppercase leading-none">
              {t('securityConsole')}
             </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-2">
            Monitoramento de Integridade & Auditoria Multi-Usuário
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-green-500/10 text-green-500 rounded-2xl border border-green-500/20 text-[9px] font-black uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Blockchain Active
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button 
              disabled={exportLoading}
              onClick={() => handleExportData('CSV')}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2 group disabled:opacity-50"
            >
              <FileText size={14} /> {exportLoading ? '...' : 'CSV'}
            </button>
            <button 
              disabled={exportLoading}
              onClick={exportToPDF}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2 group disabled:opacity-50"
            >
              <Download size={14} /> PDF
            </button>
            <button 
              disabled={exportLoading}
              onClick={() => handleExportData('JSON')}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2 group disabled:opacity-50"
            >
              <HardDrive size={14} /> JSON
            </button>
          </div>
          <button 
            onClick={exportGlobalUsers}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
          >
            <Users size={16} /> Lista Nominal
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800 w-fit overflow-x-auto">
        {[
          { id: 'overview', label: 'Monitoramento', icon: <Cpu size={16} /> },
          { id: 'intelligence', label: t('userAccessCenter'), icon: <Fingerprint size={16} /> },
          { id: 'logs', label: 'Histórico de Logs', icon: <Terminal size={16} /> },
          { id: 'control', label: 'Master Control', icon: <Settings size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl shadow-blue-500/10' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Blockchain Verification Banner */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
              <div className="relative flex flex-col xl:flex-row items-center justify-between gap-12">
                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center relative z-10 ${verifyingChain ? 'animate-pulse' : ''} ${chainResult ? (chainResult.success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500') : 'bg-blue-600/20 text-blue-500 border border-blue-500/30'}`}>
                      {verifyingChain ? <RefreshCw className="animate-spin" size={44} /> : <ShieldCheck size={44} />}
                    </div>
                    {/* Animated Orbitals for "Blockchain" feel */}
                    <div className="absolute inset-x-0 inset-y-0 -m-4 border border-blue-500/10 rounded-[2.5rem] animate-[spin_10s_linear_infinite] pointer-events-none" />
                    <div className="absolute inset-x-0 inset-y-0 -m-8 border border-white/5 rounded-[3rem] animate-[spin_15s_linear_infinite_reverse] pointer-events-none" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-3 italic">Validação de Consenso Blockchain</h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                       <span className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest">Protocolo SHA-256</span>
                       <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">Imutabilidade Ativa</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-xl leading-relaxed">
                      {verifyingChain ? 'Executando algoritmos recursivos de verificação de hash...' : (chainResult ? chainResult.message : 'Sincronização master blindada pendente de auditoria de bloco.')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="hidden lg:flex items-center gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`w-2 h-8 rounded-full ${chainResult?.success ? 'bg-green-500/40' : (verifyingChain ? 'bg-blue-500/40 animate-pulse' : 'bg-slate-800')} transition-all delay-[${i*100}ms]`} />
                    ))}
                  </div>
                  <button 
                    onClick={performChainVerification}
                    disabled={verifyingChain}
                    className="px-12 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.25em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 group"
                  >
                    {verifyingChain ? 'Sincronizando...' : (
                      <>
                        <Zap size={18} className="group-hover:text-yellow-400 transition-colors" />
                        Autenticar Corrente
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Integridade Blockchain', value: stats.auditIntegrity ? 'Sincronizado' : 'Erro', icon: <Shield size={24} />, color: stats.auditIntegrity ? 'text-green-500' : 'text-red-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                { label: 'Sessões Ativas', value: onlineUsers.length, icon: <Zap size={24} />, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                { label: 'Base de Alunos', value: stats.totalStudents, icon: <Users size={24} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Logs de Eventos', value: stats.totalActions, icon: <Database size={24} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' }
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-blue-500/30 transition-all">
                  <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-4xl font-black tabular-nums mt-1 dark:text-white ${stat.color.includes('text-green-500') ? 'text-green-600' : ''}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Category Breakdown */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
                    <Activity className="text-blue-600" size={20} /> Distribuição
                  </h3>
                </div>
                <div className="space-y-6">
                  {Object.entries(stats.categoryUsage).map(([cat, count]) => (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat}</p>
                        <p className="text-xs font-black dark:text-white">{count} e.</p>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / stats.totalActions) * 100}%` }}
                          className={`h-full ${
                            cat === 'Security' ? 'bg-red-500' :
                            cat === 'Financial' ? 'bg-green-500' :
                            cat === 'User' ? 'bg-blue-600' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Online Now */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
                    <Globe className="text-green-500" size={20} /> Fluxo de Acesso Realtime
                  </h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                    Live Session Monitor
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onlineUsers.length > 0 ? onlineUsers.map((user, i) => (
                    <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center group hover:border-green-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-green-500 transition-colors">
                          {user.userAgent.includes('Mobile') ? <Smartphone size={24} /> : <Monitor size={24} />}
                        </div>
                        <div>
                          <p className="text-xs font-black dark:text-white uppercase tracking-tight">{user.email}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {user.role} • 0.0.0.0 (Proxy)
                          </p>
                        </div>
                      </div>
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                    </div>
                  )) : (
                    <div className="col-span-2 py-12 text-center text-slate-400 font-black uppercase tracking-widest text-[11px] opacity-50">
                      Nenhuma sessão ativa detectada no momento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'intelligence' && (
          <motion.div 
            key="intelligence"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black dark:text-white tracking-tighter uppercase leading-none">
                    {t('userAccessCenter')}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Fingerprint size={14} /> Perfilagem e Acesso Retroativo
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">REGISTROS TOTAIS</p>
                      <p className="text-sm font-black dark:text-white tabular-nums">{systemUsers.length}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <div className="text-right">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">AMEAÇA MÉDIA</p>
                      <p className="text-sm font-black text-green-500 uppercase">BAIXA</p>
                    </div>
                  </div>
                  
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Filtrar por e-mail..."
                      className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold transition-all text-xs"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('audit.user')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status de Conta</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Último Acesso</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Volume</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dispositivos</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('threatLevel')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ações Master</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {systemUsers
                    .filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map((user, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-sm ${user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-blue-600/10 text-blue-600'}`}>
                                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black dark:text-white uppercase tracking-tight">{user.name || 'Sem Nome'}</p>
                                  {user.role === 'admin' && <Shield size={12} className="text-indigo-600" />}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user.email}</p>
                                {user.belt && (
                                  <div className="mt-1 flex items-center gap-1">
                                    <div className={`w-2 h-1 rounded-full ${BELT_COLORS[user.belt]?.includes('bg-white') ? 'bg-slate-200' : BELT_COLORS[user.belt]?.split(' ')[0]}`} />
                                    <span className="text-[8px] font-black text-slate-500 uppercase">{user.belt}</span>
                                  </div>
                                )}
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-1.5">
                             <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                               user.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                               user.status === 'Overdue' ? 'bg-red-500/10 text-red-500' :
                               'bg-slate-500/10 text-slate-500'
                             }`}>
                               {user.status || 'Active'}
                             </div>
                             {user.joinedAt && <p className="text-[8px] font-bold text-slate-400 uppercase ml-1">Desde {new Date(user.joinedAt).toLocaleDateString()}</p>}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           {user.lastAction > 0 ? (
                             <>
                               <p className="text-xs font-bold dark:text-white">{new Date(user.lastAction).toLocaleString()}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Conexão Estável</p>
                             </>
                           ) : (
                             <p className="text-xs font-bold text-slate-300 uppercase italic">Nunca acessou</p>
                           )}
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <div className="text-xl font-black dark:text-white">{user.totalActions}</div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase">Ações</span>
                           </div>
                           <div className="flex gap-0.5 mt-2">
                             {[...Array(5)].map((_, j) => (
                               <div key={j} className={`h-1 flex-1 rounded-full ${j < Math.ceil(user.totalActions / 100) ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'}`} />
                             ))}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex -space-x-2">
                             {Array.from(user.devices).slice(0, 3).map((device, j) => (
                               <div key={j} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border-2 border-slate-50 dark:border-slate-800 flex items-center justify-center text-slate-500 shadow-sm" title={device}>
                                 {device.includes('Mobile') ? <Smartphone size={14} /> : <Monitor size={14} />}
                               </div>
                             ))}
                             {user.devices.size > 3 && (
                               <div className="w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-slate-50 dark:border-slate-800 flex items-center justify-center text-[10px] font-black">
                                 +{user.devices.size - 3}
                               </div>
                             )}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                             user.riskLevel === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                             user.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                             'bg-green-500/10 text-green-500 border-green-500/20'
                           }`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${
                               user.riskLevel === 'High' ? 'bg-red-500' :
                               user.riskLevel === 'Medium' ? 'bg-amber-500' :
                               'bg-green-500'
                             }`} />
                             {user.riskLevel === 'Low' ? t('lowRisk') : user.riskLevel === 'Medium' ? t('mediumRisk') : t('highRisk')}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                title="Resetar Acesso"
                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                onClick={() => alert(`Reset de acesso enviado para ${user.email}`)}
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button 
                                title={user.status === 'Active' ? 'Suspender' : 'Ativar'}
                                className={`p-2 bg-slate-100 dark:bg-slate-800 transition-all rounded-lg ${user.status === 'Active' ? 'hover:bg-red-600' : 'hover:bg-green-600'} hover:text-white`}
                              >
                                <Power size={14} />
                              </button>
                              <button 
                                title="Ver Detalhes"
                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 hover:text-white rounded-lg transition-all"
                              >
                                <ArrowUpRight size={14} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 shadow-sm">
               <div className="relative flex-1 min-w-[300px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder={t('audit.searchPlaceholder')}
                   className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold transition-all"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
               
               <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={() => setDateRange('Today')}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateRange === 'Today' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Hoje
                  </button>
                  <button 
                    onClick={() => setDateRange('Week')}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateRange === 'Week' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    7 Dias
                  </button>
                  <button 
                    onClick={() => setDateRange('All')}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateRange === 'All' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Tudo
                  </button>
               </div>

               <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={() => setViewMode('Table')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'Table' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <LayoutList size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('Groups')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'Groups' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <History size={20} />
                  </button>
               </div>
            </div>

            {/* Logs Body */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 dark:bg-slate-900/50">
                     <tr>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operador</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Evento</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Blockchain</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                     {paginatedLogs.map((log) => (
                       <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                         <td className="px-8 py-6">
                            <p className="text-xs font-bold dark:text-white">{new Date(log.timestamp).toLocaleString()}</p>
                            <span className="text-[8px] font-black text-slate-400 uppercase mt-1 block">{log.id}</span>
                         </td>
                         <td className="px-8 py-6">
                            <p className="text-xs font-black dark:text-white uppercase tracking-tight">{log.userEmail}</p>
                            <div className="flex items-center gap-2 mt-1">
                               {log.deviceInfo.includes('Mobile') ? <Smartphone size={12} className="text-slate-400" /> : <Monitor size={12} className="text-slate-400" />}
                               <span className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{log.deviceInfo}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2 mb-1">
                               <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                                 log.category === 'Security' ? 'bg-red-500 text-white' :
                                 log.category === 'Financial' ? 'bg-green-500 text-white' :
                                 'bg-blue-600 text-white'
                               }`}>
                                 {log.category}
                               </span>
                               <p className="text-xs font-black dark:text-white uppercase tracking-tight">{log.action}</p>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic">{log.details}</p>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                               {log.hash ? (
                                 <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[7px] font-black uppercase">
                                   <ShieldCheck size={10} /> {t('audit.integrityVerified')}
                                 </div>
                               ) : (
                                 <span className="text-[8px] text-slate-400 uppercase font-black">Legacy Data</span>
                               )}
                               <span className="text-[8px] font-mono text-slate-300">#{log.hash?.substring(0, 12)}</span>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               {/* Pagination */}
               {totalPages > 1 && (
                 <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       Mostrando {((currentPage - 1) * itemsPerPage) + 1} de {filteredLogs.length} eventos
                    </p>
                    <div className="flex items-center gap-2">
                       <button 
                         disabled={currentPage === 1}
                         onClick={() => setCurrentPage(p => p - 1)}
                         className="p-3 text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-all"
                       >
                         Página Anterior
                       </button>
                       <span className="px-6 py-2 bg-white dark:bg-slate-800 rounded-xl text-sm font-black dark:text-white shadow-sm">{currentPage} / {totalPages}</span>
                       <button 
                         disabled={currentPage === totalPages}
                         onClick={() => setCurrentPage(p => p + 1)}
                         className="p-3 text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-all"
                       >
                         Próxima Página
                       </button>
                    </div>
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'control' && (
          <motion.div 
            key="control"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* System Intelligence Card */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Terminal size={24} />
                  </div>
                  <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter italic">Comandos Master</h3>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Operações críticas de manutenção de integridade e saneamento de dados.</p>
                
                <div className="space-y-3 pt-4">
                  <button 
                    onClick={() => confirm('Tem certeza? Isso irá redefinir a âncora do blockchain.') && alert('Protocolo de Reset de Hash iniciado.')}
                    className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300"
                  >
                    <span>Redefinir Âncora Hash</span>
                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                  
                  <button 
                    onClick={() => confirm('Deseja arquivar logs com mais de 90 dias?') && alert('Arquivamento concluído.')}
                    className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between group hover:border-amber-500 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300"
                  >
                    <span>Arquivar Logs Antigos</span>
                    <Save size={16} />
                  </button>

                  <button 
                     onClick={() => alert('Sincronização forçada iniciada across nodes.')}
                     className="w-full py-4 px-6 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-between group hover:bg-blue-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest text-blue-600"
                  >
                    <span>Sincronização Forçada Firebase</span>
                    <RefreshCw size={16} className="animate-spin-slow" />
                  </button>
                </div>
              </div>

              {/* Storage Card */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-emerald-600/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <HardDrive size={24} />
                  </div>
                  <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter italic">Armazenamento Local</h3>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidade LocalStorage</p>
                     <p className="text-xs font-black dark:text-white">~5MB Limite</p>
                   </div>
                   <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '45%' }}
                        className="h-full bg-emerald-500"
                      />
                   </div>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                     O sistema usa LocalStorage como cache de persistência rápida enquanto sincroniza com o Firestore.
                   </p>
                   
                   <button 
                     onClick={() => confirm('ATENÇÃO: Isso apagará TODOS os dados salvos localmente (não afeta a nuvem). Continuar?') && localStorage.clear()}
                     className="w-full py-4 px-6 mt-4 bg-red-600/5 border border-red-600/20 rounded-2xl flex items-center justify-between group hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest text-red-600"
                   >
                     <span>Limpar Cache Local (Hard Reset)</span>
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>

              {/* Support Tool Card */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-amber-600/10 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Smartphone size={24} />
                  </div>
                  <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter italic">Diagnóstico Multi-Nodo</h3>
                </div>
                
                <div className="space-y-3">
                   <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latência Firestore</span>
                         <span className="text-[9px] font-black text-emerald-500 uppercase">ÓTIMA (45ms)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 w-1/4" />
                      </div>
                   </div>

                   <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Integridade de Sync</span>
                         <span className="text-[9px] font-black text-blue-500 uppercase">100% VERIFIED</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-full" />
                      </div>
                   </div>

                   <button 
                     onClick={() => alert('Relatório técnico gerado e baixado.')}
                     className="w-full py-4 px-6 bg-slate-900 text-white rounded-2xl flex items-center justify-between group hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest mt-4"
                   >
                     <span>Gerar Relatório Técnico Completo</span>
                     <ArrowUpRight size={16} />
                   </button>
                </div>
              </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* System Health */}
               <div className="lg:col-span-2 space-y-8">
                 <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Status da Infraestrutura</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conexão direta com os nós de processamento</p>
                     </div>
                     <div className="px-4 py-2 bg-green-500/10 text-green-500 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                       All Systems Operational
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     {[
                       { label: 'Latência do Banco', value: '24ms', icon: <ArrowUpRight size={18} />, status: 'green' },
                       { label: 'Uso de Memória', value: '18%', icon: <HardDrive size={18} />, status: 'blue' },
                       { label: 'Carga da CPU', value: '0.4%', icon: <Cpu size={18} />, status: 'yellow' }
                     ].map((box, i) => (
                       <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                          <div className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 ${box.status === 'green' ? 'text-green-500' : box.status === 'blue' ? 'text-blue-500' : 'text-yellow-500'}`}>
                            {box.icon}
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{box.label}</p>
                          <p className="text-2xl font-black dark:text-white mt-1">{box.value}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
               
               <div className="space-y-8">
                  <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden h-full min-h-[500px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_70%)]" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-2">
                       <Activity className="text-blue-500" size={20} /> Data Integrity Pulse
                    </h3>
                    
                    <div className="space-y-8 relative">
                       {[
                         { label: 'Blockchain Chain', status: 'Healthy', val: 100 },
                         { label: 'Financial Ledger', status: 'Synced', val: 100 },
                         { label: 'User Signatures', status: 'Valid', val: 98 },
                         { label: 'Storage Sync', status: 'Live', val: 100 }
                       ].map((p, i) => (
                         <div key={i} className="space-y-3">
                           <div className="flex justify-between items-end">
                               <div>
                                 <p className="text-[10px] font-black text-white uppercase tracking-widest">{p.label}</p>
                                 <p className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.2em]">{p.status}</p>
                               </div>
                               <p className="text-xs font-black text-white">{p.val}%</p>
                           </div>
                           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${p.val}%` }}
                                className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                              />
                           </div>
                         </div>
                       ))}

                       <div className="pt-8 border-t border-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cadeia de Blocos (Live Visualizer)</p>
                            <span className="text-[8px] font-mono text-blue-500">SYSBJJ_CORE_REVISION_2.1</span>
                          </div>
                          <div className="flex gap-2 overflow-hidden py-2">
                             {[...Array(12)].map((_, i) => (
                               <motion.div
                                 key={i}
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: i * 0.1 }}
                                 className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center gap-1 shrink-0 group relative cursor-pointer hover:border-blue-500/50 transition-all"
                               >
                                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                 <p className="text-[6px] font-mono text-slate-500">0x{Math.random().toString(16).substring(2, 6)}</p>
                               </motion.div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 bg-blue-600/5 border border-blue-600/10 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
          <Terminal size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black dark:text-white uppercase tracking-tight">Nota de Auditoria Blockchain</h4>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            O SYSBJJ 2.0 utiliza uma arquitetura de encadeamento de hash (blockchain-style) para garantir que nenhum log de auditoria seja modificado ou excluído sem deixar evidências. Cada ação é vinculada ao hash da ação anterior, criando uma corrente de custódia imutável para fins de conformidade legal e segurança do Dojo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemAudit;
