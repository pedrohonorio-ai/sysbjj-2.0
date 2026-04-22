
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
  Lock
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTranslation } from '../contexts/LanguageContext';
import { SystemLog } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MASTER_ADMINS } from '../constants';

const SystemAudit: React.FC = () => {
  const { t } = useTranslation();
  const { logs, students, ledger, verifyLedgerIntegrity, presence } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SystemLog['category'] | 'All'>('All');

  const auth = JSON.parse(localStorage.getItem('oss_auth') || '{}');
  const isAdmin = MASTER_ADMINS.includes(auth.email?.toLowerCase());

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [logs, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(l => l.timestamp >= today);
    
    // Group logs by user
    const userActivity = logs.reduce((acc, log) => {
      if (!acc[log.userEmail]) {
        acc[log.userEmail] = { count: 0, lastAction: 0, actions: [] };
      }
      acc[log.userEmail].count++;
      acc[log.userEmail].lastAction = Math.max(acc[log.userEmail].lastAction, log.timestamp);
      if (!acc[log.userEmail].actions.includes(log.action)) {
        acc[log.userEmail].actions.push(log.action);
      }
      return acc;
    }, {} as Record<string, { count: number, lastAction: number, actions: string[] }>);

    // Group logs by category
    const categoryUsage = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActions: logs.length,
      todayActions: todayLogs.length,
      totalStudents: students.length,
      ledgerIntegrity: verifyLedgerIntegrity(),
      uniqueUsers: Object.keys(userActivity).length,
      userActivity,
      categoryUsage
    };
  }, [logs, students, verifyLedgerIntegrity]);

  const onlineUsers = useMemo(() => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return presence.filter(p => p.lastSeen > fiveMinutesAgo);
  }, [presence]);

  const userActivityEntries = Object.entries(stats.userActivity) as [string, { count: number, lastAction: number, actions: string[] }][];
  const categoryUsageEntries = Object.entries(stats.categoryUsage) as [string, number][];

  const exportToPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleString();

    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Auditoria PPH BJJ', 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${today}`, 14, 30);
    doc.text(`Administrador: ${auth.email || 'Master'}`, 14, 35);

    // Stats Summary
    doc.setFontSize(14);
    doc.text('Resumo do Sistema', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total de Alunos: ${stats.totalStudents}`, 14, 52);
    doc.text(`Total de Ações: ${stats.totalActions}`, 14, 57);
    doc.text(`Usuários Ativos: ${stats.uniqueUsers}`, 14, 62);
    doc.text(`Integridade do Ledger: ${stats.ledgerIntegrity ? 'OK' : 'FALHA'}`, 14, 67);

    // Logs Table
    const tableData = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userEmail,
      log.action,
      log.category,
      log.details
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Data/Hora', 'Usuário', 'Ação', 'Categoria', 'Detalhes']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });

    doc.save(`pph_audit_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <Lock size={48} />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Acesso Restrito</h1>
          <p className="text-slate-400 font-medium">Esta área é exclusiva para o administrador mestre do sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none flex items-center gap-4">
            <Shield className="text-blue-600" size={40} />
            Auditoria de Sistema
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[9px] tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              LIVE SYNC
            </span>
          </h1>
          <p className="text-slate-500 font-medium italic">Fluxo de movimentações, integridade e uso global.</p>
        </div>
        <button 
          onClick={exportToPDF}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl"
        >
          <Download size={16} /> Exportar Relatório PDF
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uso do Sistema</p>
            <p className="text-3xl font-black dark:text-white tabular-nums">{stats.todayActions}</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Ações registradas hoje</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos Cadastrados</p>
            <p className="text-3xl font-black dark:text-white tabular-nums">{stats.totalStudents}</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Total de alunos na base</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600">
            <Globe size={24} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuários Online</p>
            <p className="text-3xl font-black dark:text-white tabular-nums">{onlineUsers.length}</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Sessões ativas agora</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Database size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuários do Sistema</p>
            <p className="text-3xl font-black dark:text-white tabular-nums">{stats.uniqueUsers}</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Contas com atividade logada</p>
          </div>
        </div>
      </div>

      {/* Usage Breakdown & User Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usage Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            Distribuição de Uso
          </h3>
          <div className="space-y-4">
            {categoryUsageEntries.map(([cat, count]) => (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat}</p>
                  <p className="text-xs font-black dark:text-white tabular-nums">{count} ações</p>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      cat === 'Security' ? 'bg-red-500' :
                      cat === 'Financial' ? 'bg-green-500' :
                      cat === 'User' ? 'bg-blue-500' : 'bg-slate-500'
                    }`}
                    style={{ width: `${(count / stats.totalActions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity Summary */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
              <Users className="text-purple-600" size={20} />
              Usuários Online
            </h3>
            <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              Real-time
            </span>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {onlineUsers.length > 0 ? onlineUsers.map((user) => (
              <div key={user.id} className="p-4 bg-green-500/5 dark:bg-green-500/10 rounded-2xl border border-green-500/20 flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <div>
                    <p className="text-xs font-black dark:text-white uppercase tracking-tight">{user.email}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                      {user.userAgent.includes('Mobile') ? 'Smartphone' : 'Desktop'} • Expira em breve
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                  ONLINE
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-400 italic font-bold uppercase tracking-widest text-[10px]">
                Nenhum usuário detectado nos últimos 5 min.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ação, detalhes ou email..." 
            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['All', 'User', 'Financial', 'System', 'Security'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat as any)}
              className={`px-6 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Data / Hora</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Usuário</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Ação</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Categoria</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group">
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold dark:text-white">{new Date(log.timestamp).toLocaleString()}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{log.id}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{log.userEmail}</p>
                    <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-1">ID: {log.userId}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.action}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">{log.details}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      log.category === 'Security' ? 'bg-red-100 text-red-600' :
                      log.category === 'Financial' ? 'bg-green-100 text-green-600' :
                      log.category === 'User' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      {log.deviceInfo.includes('Mobile') ? <Smartphone size={14} /> : <Globe size={14} />}
                      <span className="text-[8px] font-bold uppercase tracking-widest truncate max-w-[150px]">{log.deviceInfo}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">
                    Nenhum registro encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemAudit;
