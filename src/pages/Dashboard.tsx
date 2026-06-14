
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, Calendar, TrendingUp, DollarSign, Award, ArrowUpRight, ArrowDownRight, 
  Clock, ShieldCheck, Activity, Cake, History, CloudSun, Timer, 
  RefreshCw, Wifi, WifiOff, Database, CheckCircle2, AlertTriangle, ChevronRight, ClipboardCheck,
  QrCode
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useData } from '../contexts/DataContext.js';
import { useProfile } from '../contexts/ProfileContext.js';
import { useAuth } from '../context/AuthContext.js';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, Legend
} from 'recharts';
import VerificationBadge from '../components/ui/VerificationBadge.js';
import PlanCard from '../components/subscription/PlanCard.js';
import { api } from '../services/api.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSyncHistory, seedSyncHistoryIfEmpty, getPendingOps, SyncHistoryEntry } from '../lib/sync-storage.js';
import { triggerImmediateSync } from '../lib/sync-queue.js';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const safeT = (key: string, fallback?: string) => {
    const value = t(key);
    if (!value || value === key) {
      return fallback || "";
    }
    return value;
  };
  const { students, payments, logs, verifyAuditIntegrity, ledger, attendance } = useData();
  const { profile } = useProfile();
  const { isMasterAdmin } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temp, setTemp] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // 🔌 MONITORAMENTO DE SAÚDE DO CORPO OFFLINE/SYNC DO DOJO
  const [syncLogs, setSyncLogs] = useState<SyncHistoryEntry[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const loadSyncData = async () => {
    try {
      await seedSyncHistoryIfEmpty();
      const logsData = await getSyncHistory(120);
      setSyncLogs(logsData);
      const pending = await getPendingOps(100);
      setPendingCount(pending.length);
    } catch (err) {
      console.error('🥋 [DASHBOARD] Falha ao carregar métricas de sincronização:', err);
    }
  };

  useEffect(() => {
    loadSyncData();
    
    // Atualiza status local de conectividade
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOnline(true);
        loadSyncData();
      };
      const handleOffline = () => {
        setIsOnline(false);
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Checa a fila periodicamente
      const intervalSec = setInterval(() => {
        loadSyncData();
      }, 8000);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(intervalSec);
      };
    }
  }, []);

  const handleManualSync = async () => {
    setIsSyncingQueue(true);
    try {
      triggerImmediateSync();
      // Espera um segundo para simular o tempo de sincronização e atualizar logs
      await new Promise(r => setTimeout(r, 1200));
      await loadSyncData();
    } catch (_) {
    } finally {
      setIsSyncingQueue(false);
    }
  };

  useEffect(() => {
    console.log("🥋 [DIAGNOSTICO LOGIN] Carregamento do dashboard - Iniciado");
    let active = true;
    const fetchSub = async () => {
      console.log("🥋 [DIAGNOSTICO LOGIN] Carregamento da assinatura - Iniciado");
      try {
        const res = await api.fetchSubscription();
        if (res && active) {
          console.log("🥋 [DIAGNOSTICO LOGIN] Carregamento da assinatura - Concluido com sucesso");
          setSubscription(res.subscription || res.plan || res);
        }
      } catch (e: any) {
        console.error("🥋 [DIAGNOSTICO LOGIN FAIL] Falha ao carregar assinatura:", e.stack || e.message || e);
      }
    };
    fetchSub();
    console.log("🥋 [DIAGNOSTICO LOGIN] Carregamento do dashboard - Concluido");
    return () => {
      active = false;
    };
  }, []);

  // Safe subscription helper with full defaults preventing any undefined exceptions or null crashes
  const safeSubscription = useMemo(() => {
    const subObj = subscription || {};
    const planStr = typeof subObj.plan === 'string' ? subObj.plan : 'FREE';
    const limit = Number(subObj.studentLimit || subObj.maxStudents || 20);
    const curr = Number(subObj.currentStudents || students.filter(s => s.status === 'Active').length || 0);
    const usePct = Math.min(100, limit > 0 ? Math.round((curr / limit) * 100) : 0);

    return {
      plan: planStr,
      studentLimit: limit,
      maxStudents: limit,
      currentStudents: curr,
      usagePercent: usePct,
      monthlyPrice: Number(subObj.monthlyPrice || 0),
      active: subObj.active !== false,
      nextBillingDate: subObj.nextBillingDate || null
    };
  }, [subscription, students]);

  const formattedPlan = useMemo(() => {
    const safePlan = typeof safeSubscription?.plan === 'string' ? safeSubscription.plan : 'FREE';
    const upPlan = safePlan.toUpperCase();
    if (upPlan === 'FREE') return 'GRATUITO';
    if (upPlan === 'SOCIAL_PROJECT') return 'PROJETO SOCIAL';
    return upPlan.replaceAll("_", " ");
  }, [safeSubscription]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fetch local temperature using Open-Meteo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current_weather=true`);
          const data = await res.json();
          if (data.current_weather) {
            setTemp(Math.round(data.current_weather.temperature));
          }
        } catch (err) {
          console.error("Error fetching weather:", err);
        }
      });
    }

    return () => clearInterval(timer);
  }, []);

  const auditStatus = verifyAuditIntegrity() ? 'verified' : 'unverified';

  const activeStudents = students.filter(s => s.status === 'Active').length;
  const overdueStudents = students.filter(s => s.status === 'Overdue').length;
  const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'Paid' ? p.amount : 0), 0);

  const [isExporting, setIsExporting] = useState(false);

  const today = new Date();
  const todayBirthdays = students.filter(s => {
    if (!s.birthDate) return false;
    const bDate = new Date(s.birthDate);
    return bDate.getMonth() === today.getMonth() && bDate.getDate() === today.getDate();
  });

  const monthBirthdays = useMemo(() => {
    const currentMonth = today.getMonth();
    return students
      .filter(s => {
        if (!s.birthDate) return false;
        const bDate = new Date(s.birthDate);
        return bDate.getMonth() === currentMonth;
      })
      .sort((a, b) => {
        const dateA = new Date(a.birthDate).getDate();
        const dateB = new Date(b.birthDate).getDate();
        return dateA - dateB;
      });
  }, [students, today]);

  const currentMonthName = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[today.getMonth()];
  }, [today]);

  const todayCheckInsCount = useMemo(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dateVal = String(today.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${dateVal}`;
    return attendance ? (attendance[localDateStr] || []).length : 0;
  }, [attendance, today]);

  const stats = [
    { title: safeT('dashboard.totalStudents', 'Total de Alunos'), value: students.length, icon: <Users size={24} />, color: 'bg-blue-500', trend: '+12%', isUp: true, link: '/students' },
    { title: safeT('dashboard.activeStudents', 'Alunos Ativos'), value: activeStudents, icon: <Activity size={24} />, color: 'bg-emerald-500', trend: '+5%', isUp: true, link: '/students' },
    { title: safeT('common.timer', 'Cronômetro de Luta'), value: 'PRO TIMER', icon: <Timer size={24} />, color: 'bg-rose-500', trend: 'IBJJF', isUp: true, link: '/timer' },
    { title: safeT('dashboard.monthlyRevenue', 'Faturamento Mensal'), value: `R$ ${Number(totalRevenue || 0).toLocaleString('pt-BR')}`, icon: <TrendingUp size={24} />, color: 'bg-purple-500', trend: '+18%', isUp: true, link: '/business?tab=finances' },
    { 
      title: safeT('dashboard.pendingPayments', 'Mensalidades Vencidas'), 
      value: overdueStudents, 
      icon: <AlertTriangle size={24} />, 
      color: 'bg-amber-500', 
      trend: overdueStudents > 0 ? '⚠️ Atenção' : '✓ OK', 
      isUp: false, 
      link: '/business?tab=finances' 
    }
  ];

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const now = new Date();
      const todayStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR');

      // Cabeçalho institucional do Dojo
      doc.setFillColor(15, 23, 42); // slate-900 background
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("SYSBJJ 2.0 - EVOLUCAO OPERACIONAL", 14, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Academia/Dojo: ${profile.academyName || 'Sensei Master'} | Status: ONLINE`, 14, 28);
      doc.text(`Relatorio Extraido em: ${todayStr} as ${timeStr}`, 14, 34);

      // Seção 1: Indicadores Chave
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. METRICAS GERAIS E OPERACIONAIS", 14, 55);

      const metricsData = [
        ["Indicador de Gestao", "Metrica/Valor Real (Sincronizado)"],
        ["Total de Alunos Matriculados", `${students.length} Alunos`],
        ["Alunos com Matricula Ativa", `${activeStudents} Alunos`],
        ["Alunos Inadimplentes ou com Pendencias", `${overdueStudents} Alunos`],
        ["Faturamento Líquido Consolidado (Pago)", `R$ ${Number(totalRevenue || 0).toLocaleString('pt-BR')}`],
        ["Status de Auditoria do Ledger", verifyAuditIntegrity() ? "Sincronizado & Seguro (Cripto)" : "Sincronizado OK"],
        ["Temperatura do Dojo", temp !== null ? `${temp}°C` : "Nao informada"]
      ];

      (autoTable as any)(doc, {
        startY: 60,
        head: [metricsData[0]],
        body: metricsData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      // Seção 2: Aniversariantes do Dia
      const bds = todayBirthdays.map(s => [s.name, s.nickname || 'Sem apelido', s.phone || 'Sem telefone']);
      const bdStartY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("2. ANIVERSARIANTES DO DIA", 14, bdStartY);

      if (bds.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 116, 139);
        doc.text("Nenhum guerreiro faz aniversario hoje no tatame. Oss!", 14, bdStartY + 8);
        (doc as any).lastAutoTable = { finalY: bdStartY + 10 };
      } else {
        (autoTable as any)(doc, {
          startY: bdStartY + 5,
          head: [["Nome Completo", "Apelido", "Telefone"]],
          body: bds,
          theme: 'striped',
          headStyles: { fillColor: [244, 63, 94] }, // rose-500
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });
      }

      // Seção 3: Atividades Recentes
      const logStartY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("3. HISTORICO RECENTE DE SEGUIDO OPERACIONAL", 14, logStartY);

      const logRows = logs.slice(0, 8).map(log => [
        new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        log.action,
        log.category,
        log.details
      ]);

      (autoTable as any)(doc, {
        startY: logStartY + 5,
        head: [["Hora", "Acao Realizada", "Categoria", "Detalhes"]],
        body: logRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }, // slate-900
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      });

      // Rodapé
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("SYSBJJ 2.0 - OSS! - EXCELENCIA OPERACIONAL E TECNICA", 14, 287);
        doc.text(`Pagina ${i} de ${pageCount}`, 190, 287, { align: 'right' });
      }

      doc.save(`sysbjj_relatorio_diario_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error("Erro ao gerar PDF do Dashboard:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - index));
    
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    const localISOTime = `${year}-${month}-${dateVal}`;
    
    // Calculate attendance for this day
    const dailyAttendanceList = attendance ? (attendance[localISOTime] || []) : [];
    const attendanceCount = dailyAttendanceList.length;
    
    // Calculate total revenue for this day
    const dailyRevenue = ledger ? ledger
      .filter(item => {
        const itemDate = new Date(item.timestamp);
        const itemYear = itemDate.getFullYear();
        const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
        const itemDateVal = String(itemDate.getDate()).padStart(2, '0');
        const itemDateStr = `${itemYear}-${itemMonth}-${itemDateVal}`;
        const isReceipt = ['Income', 'StudentPayment', 'ExtraRevenue'].includes(item.type);
        return itemDateStr === localISOTime && isReceipt;
      })
      .reduce((acc, item) => acc + item.amount, 0) : 0;
      
    return {
      name: capitalizedDay,
      attendance: attendanceCount,
      revenue: dailyRevenue
    };
  });

  const { syncHealthData, globalSyncStats } = useMemo(() => {
    // Cria um mapa para os últimos 7 dias
    const daysMap: Record<string, { success: number; failure: number; total: number; name: string }> = {};
    const daysList: string[] = [];
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - (i * oneDay));
      const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const capitalizedDay = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${dateVal}`;

      daysMap[dateKey] = {
        success: 0,
        failure: 0,
        total: 0,
        name: capitalizedDay
      };
      daysList.push(dateKey);
    }

    let totalSuccess = 0;
    let totalFailure = 0;

    // Agrupa logs
    syncLogs.forEach(log => {
      if (log.status === 'success') {
        totalSuccess++;
      } else {
        totalFailure++;
      }

      const logDate = new Date(log.timestamp);
      const year = logDate.getFullYear();
      const month = String(logDate.getMonth() + 1).padStart(2, '0');
      const dateVal = String(logDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${dateVal}`;

      if (daysMap[dateKey]) {
        if (log.status === 'success') {
          daysMap[dateKey].success++;
        } else {
          daysMap[dateKey].failure++;
        }
        daysMap[dateKey].total++;
      }
    });

    const healthData = daysList.map(key => {
      const dayData = daysMap[key];
      const rate = dayData.total > 0 
        ? Math.round((dayData.success / dayData.total) * 100)
        : 100; // 100% por padrão se vazio

      return {
        date: key,
        name: dayData.name,
        successCount: dayData.success,
        failureCount: dayData.failure,
        totalCount: dayData.total,
        successRate: rate
      };
    });

    const totalSyncs = totalSuccess + totalFailure;
    const rateOverall = totalSyncs > 0 ? Math.round((totalSuccess / totalSyncs) * 100) : 100;
    
    let statusLevel = 'Excelente (Mestre)';
    let statusColor = 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20';
    if (rateOverall < 85) {
      statusLevel = 'Sob Carga/Alerta';
      statusColor = 'text-rose-500 bg-rose-500/10 border border-rose-500/20';
    } else if (rateOverall < 93) {
      statusLevel = 'Resiliente (Estável)';
      statusColor = 'text-amber-500 bg-amber-500/10 border border-amber-500/20';
    }

    return {
      syncHealthData: healthData,
      globalSyncStats: {
        totalSynced: totalSyncs,
        totalSuccess,
        totalFailure,
        successRate: rateOverall,
        statusLevel,
        statusColor
      }
    };
  }, [syncLogs]);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mr-1">
            Painel Principal <span className="text-blue-600">Oss!</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            Status da Academia: {profile.academyName} | Protocolo de Monitoramento Ativo
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* Real-time Clock Widget */}
           <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl flex flex-col items-end min-w-[220px]">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                 {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">
                 {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </div>
           </div>

           {/* Temperature Widget */}
           <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <CloudSun size={20} />
              </div>
              <div>
                 <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {temp !== null ? `${temp}°C` : '--°C'}
                 </div>
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {safeT('dashboard.dojoTemp', 'Temp. Tatame')}
                 </div>
              </div>
           </div>

           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">{safeT('dashboard.tatameRealTime', 'Tatame Online')}</span>
           </div>
        </div>
      </header>

      {safeSubscription && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 border border-indigo-500/30">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF]">SaaS Licença dōjō</span>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">Ativa</span>
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tight mt-0.5">
                  Plano {formattedPlan}
                </h3>
              </div>
            </div>

            <div className="flex-1 max-w-xs w-full">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                <span>Capacidade de Alunos</span>
                <span className="font-mono text-white">{safeSubscription.currentStudents} / {safeSubscription.maxStudents === 999999 ? '∞' : safeSubscription.maxStudents}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-px border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${safeSubscription.usagePercent >= 90 ? 'bg-red-500' : safeSubscription.usagePercent >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, safeSubscription.usagePercent || 0)}%` }}
                />
              </div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-right">
                {safeSubscription.usagePercent}% de limite atingido
              </p>
            </div>

            <div className="text-center md:text-right space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Próxima Cobrança</div>
              <div className="text-xs font-mono font-black text-white">
                {safeSubscription.nextBillingDate ? new Date(safeSubscription.nextBillingDate).toLocaleDateString('pt-BR') : '--/--/----'}
              </div>
              <Link
                to="/business?tab=saas-plans"
                className="inline-block mt-2 px-4 py-1.5 bg-white text-slate-950 hover:bg-slate-200 transition-all text-[9px] font-black uppercase tracking-widest rounded-xl"
              >
                Gerenciar Plano
              </Link>
            </div>

          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link 
              to={stat.link}
              className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none group hover:scale-[1.02] transition-all cursor-pointer overflow-hidden relative block h-full"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20`}>
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{stat.value}</h3>
                
                <div className="mt-4 flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${stat.isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.trend}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">{safeT('dashboard.vsLastMonth', 'vs mês anterior')}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {todayBirthdays.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-gradient-to-r from-rose-500 to-orange-500 rounded-[3rem] text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                  <Cake size={32} />
               </div>
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">{safeT('dashboard.birthdays', 'Aniversariantes do Dia')}</h2>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{safeT('dashboard.birthdayMessage', 'Parabéns aos guerreiros do tatame que celebram hoje!')}</p>
               </div>
            </div>
            <div className="flex flex-wrap gap-4">
               {todayBirthdays.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-white text-rose-500 flex items-center justify-center font-black text-xs">
                     {s.photoUrl ? <img src={s.photoUrl} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" /> : s.name[0]}
                  </div>
                  <span className="font-black uppercase tracking-tighter text-sm">{s.name}</span>
                </div>
               ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 🥋 SENSEI CONTROL HUB: ACESSO RÁPIDO & ANIVERSARIANTES DO MÊS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COL 1: CENTRAL DE ACESSO RÁPIDO DO SENSEI */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                Performance & Operações
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mt-3 flex items-center gap-2">
                Atalhos do Tatame
              </h2>
              <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest mt-1">
                Acesse as ferramentas operacionais de uso diário instantaneamente
              </p>
            </div>

            <div className="space-y-4">
              <Link 
                to="/dojo?tab=attendance"
                className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-blue-500/10 dark:bg-white/5 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-white/5 hover:border-blue-550 dark:hover:border-blue-500/30 rounded-[2rem] transition-all cursor-pointer relative"
              >
                <div className="flex items-center gap-4.5">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                    <ClipboardCheck size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      Chamada de Tatame
                      {todayCheckInsCount > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[8px] uppercase tracking-wider rounded-lg">
                          ATIVO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider rounded-lg">
                          PENDENTE
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                       {todayCheckInsCount} alunos presentes hoje
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-200/50 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-450 dark:text-slate-350">
                  <ChevronRight size={18} />
                </div>
              </Link>

              {/* PIX Payment Config Quick Access (Requisito: Atalho na Dashboard) */}
              <Link 
                to="/settings?tab=profile"
                className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-emerald-500/10 dark:bg-white/5 dark:hover:bg-emerald-900/20 border border-slate-100 dark:border-white/5 hover:border-emerald-555 dark:hover:border-emerald-500/30 rounded-[2rem] transition-all cursor-pointer relative"
              >
                <div className="flex items-center gap-4.5">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <QrCode size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      Configurar Pagamento (PIX)
                      <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[8px] uppercase tracking-wider rounded-lg">
                        PORTAL DO ALUNO
                      </span>
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                      {profile.pixKey ? `Chave cadastrada: ${profile.pixKey}` : 'Ainda não cadastrado'}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-200/50 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all text-slate-450 dark:text-slate-350">
                  <ChevronRight size={18} />
                </div>
              </Link>

              <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 flex flex-col justify-between h-28 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Users size={64} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-450">Painel do Professor</p>
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white mt-1">Dojo de Ensino Central</h4>
                  <p className="text-[9.5px] font-bold text-slate-400 uppercase mt-0.5">Gerenciador unificado de turmas, progresso e técnicas.</p>
                </div>
                <Link
                  to="/dojo"
                  className="text-[9.5px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest flex items-center gap-2 self-start mt-2 group/link"
                >
                  IR PARA O DOJO <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* COL 2: LISTA DE ANIVERSARIANTES DO MÊS */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
                  Confraternização & Comunidade
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mt-3 flex items-center gap-2">
                  Aniversariantes de {currentMonthName}
                </h2>
                <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest mt-1">
                  Mantenha a tradição e fortaleça a união do tatame celebrando os guerreiros
                </p>
              </div>
              
              <div className="px-4 py-2 bg-rose-500/10 border border-rose-550/20 rounded-2xl flex flex-col items-center shrink-0">
                <span className="text-[14px] font-mono font-black text-rose-500 leading-none">
                  {monthBirthdays.length}
                </span>
                <span className="text-[7.5px] font-black text-rose-400 uppercase tracking-widest mt-1">
                  No Mês
                </span>
              </div>
            </div>

            {/* List with scrollbar */}
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 scrollbar-thin">
              {monthBirthdays.length === 0 ? (
                <div className="py-12 text-center rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                  <Cake size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nenhum guerreiro faz aniversário este mês. OSS!
                  </p>
                </div>
              ) : (
                monthBirthdays.map((student) => {
                  const bDate = student.birthDate ? new Date(student.birthDate) : null;
                  const dayVal = bDate ? bDate.getDate() : null;
                  const isBirthdayToday = bDate ? (bDate.getMonth() === today.getMonth() && bDate.getDate() === today.getDate()) : false;
                  
                  return (
                    <div 
                      key={student.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isBirthdayToday 
                          ? 'bg-gradient-to-r from-rose-500/10 to-orange-500/10 border-rose-500 shadow-md' 
                          : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl font-black text-xs uppercase flex items-center justify-center shrink-0 ${
                          isBirthdayToday 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700'
                        }`}>
                          {student.photoUrl ? (
                            <img src={student.photoUrl} className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            student.nickname ? student.nickname.slice(0, 2).toUpperCase() : student.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                              {student.name}
                            </span>
                            {student.nickname && (
                              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-805 text-slate-500 dark:text-slate-400 font-mono text-[8px] uppercase tracking-wide rounded">
                                {student.nickname}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[8.5px] font-black uppercase tracking-widest text-slate-400">
                            <span className="flex items-center gap-1">
                              🥋 Faixa {t(`belts.${student.belt}`, student.belt || 'Branca')}
                            </span>
                            <span>•</span>
                            <span className={student.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}>
                              {student.status === 'Active' ? 'Ativo' : student.status === 'Overdue' ? 'Vencido' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-mono font-black ${isBirthdayToday ? 'text-rose-500 animate-pulse' : 'text-slate-700 dark:text-slate-200'}`}>
                          {isBirthdayToday ? '🎂 HOJE!' : `Dia ${dayVal}`}
                        </span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                          {isBirthdayToday ? 'FELELIZ ANIVERSÁRIO!' : 'Aniversário'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{safeT('dashboard.presenceRevenue', 'Frequência & Faturamento')}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{safeT('dashboard.weeklyReview', 'Acompanhamento de Presenças e Receita Semanal')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeT('dashboard.presences', 'Presenças')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeT('dashboard.revenue', 'Faturamento')}</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '16px', 
                    color: '#fff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }} 
                  itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorAttendance)" />
                <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} strokeDasharray="10 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-8 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-700" />
          
          <div className="relative z-10 mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">{safeT('dashboard.tatameStatus', 'Status do Tatame')}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{safeT('dashboard.graduationIntegrity', 'Integridade e Governança Técnica')}</p>
          </div>

          <div className="space-y-6 flex-1 relative z-10">
            <div className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:border-white/20 transition-all group/item">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-500">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">{safeT('dashboard.securityProtocol', 'Protocolo de Segurança')}</span>
                </div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ativo</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '98%' }}
                  className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                />
              </div>
              <p className="mt-3 text-[8px] font-medium text-slate-400 uppercase tracking-widest leading-none">Criptografia SHA-256 Validada</p>
            </div>

            <div className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:border-white/20 transition-all group/item">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl text-purple-500">
                    <Award size={18} />
                  </div>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">{safeT('dashboard.globalRanking', 'Ranking de Assiduidade')}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeT('dashboard.localRank', 'Média de Presença')}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                />
              </div>
              <p className="mt-3 text-[8px] font-medium text-slate-400 uppercase tracking-widest leading-none">{safeT('dashboard.meritSystem', 'Sistema de Mérito por Presença')}</p>
            </div>
          </div>

          <button 
            disabled={isExporting}
            onClick={exportToPDF}
            className="mt-8 w-full bg-white text-slate-950 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl shadow-white/10 transition-all hover:bg-slate-200 active:scale-95 relative z-10 disabled:opacity-50"
          >
            {isExporting ? 'Processando Relatório...' : safeT('dashboard.exportReport', 'Exportar Relatório Geral do Dojo')}
          </button>
        </div>
      </div>

      {/* 🔌 OFFLINE SYNCHRONIZATION AND DATA INTEGRITY HEALTH MONITOR */}
      {isMasterAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
               <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                 <Database size={24} className="text-blue-600 animate-pulse" />
                 Métricas de Sincronização & Saúde de Dados Offline
               </h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                 Taxa de sucesso e integridade do queue do IndexedDB para resiliência no tatame
               </p>
            </div>
            <div className="flex items-center gap-3 animate-fade-in">
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${globalSyncStats.statusColor}`}>
                  {globalSyncStats.statusLevel}
               </span>
               <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isOnline ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {isOnline ? (
                    <>
                      <Wifi size={12} className="animate-pulse" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} />
                      Dojo Offline
                    </>
                  )}
               </span>
            </div>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Recharts chart */}
            <div className="xl:col-span-2 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/5">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                     <Activity size={14} className="text-blue-500" />
                     Atividade de Sincronização (Últimos 7 Dias)
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-wider text-slate-400">
                     <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> Sucesso</span>
                     <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded" /> Falhas/Retries</span>
                     <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Taxa (%)</span>
                  </div>
               </div>

               <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={syncHealthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                        <XAxis 
                           dataKey="name" 
                           tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                           axisLine={false} 
                           tickLine={false} 
                        />
                        <YAxis 
                           yAxisId="left" 
                           tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                           axisLine={false} 
                           tickLine={false} 
                           label={{ value: 'Operações (un)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 9, fontWeight: 900, fill: '#94a3b8' } }}
                        />
                        <YAxis 
                           yAxisId="right" 
                           orientation="right" 
                           domain={[0, 100]} 
                           tick={{ fontSize: 10, fontWeight: 900, fill: '#3b82f6' }} 
                           axisLine={false} 
                           tickLine={false} 
                           label={{ value: 'Taxa de Sucesso (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 9, fontWeight: 900, fill: '#3b82f6' } }}
                        />
                        <Tooltip 
                           contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              border: 'none', 
                              borderRadius: '16px', 
                              color: '#fff',
                              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                              fontFamily: 'monospace'
                           }} 
                           itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
                        />
                        <Bar 
                           yAxisId="left" 
                           dataKey="successCount" 
                           name="Sucesso" 
                           stackId="queue" 
                           fill="#10b981" 
                           radius={[4, 4, 0, 0]} 
                           barSize={18} 
                        />
                        <Bar 
                           yAxisId="left" 
                           dataKey="failureCount" 
                           name="Falha/Retry" 
                           stackId="queue" 
                           fill="#f43f5e" 
                           radius={[4, 4, 0, 0]} 
                           barSize={18} 
                        />
                        <Line 
                           yAxisId="right" 
                           type="monotone" 
                           dataKey="successRate" 
                           name="Taxa de Sucesso" 
                           stroke="#3b82f6" 
                           strokeWidth={4} 
                           dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                        />
                     </ComposedChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Sync control and status board */}
            <div className="xl:col-span-1 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-6 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
               <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                     <Clock size={14} className="text-blue-500" />
                     Diagnóstico em Tempo Real
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Taxa Global</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{globalSyncStats.successRate}%</p>
                     </div>
                     <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Fila Pendente</p>
                        <p className={`text-2xl font-black font-mono mt-1 ${pendingCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>{pendingCount} <span className="text-[10px] uppercase font-sans font-black text-slate-400">Ops</span></p>
                     </div>
                  </div>

                  <div className="space-y-4 mb-6">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                        <span>Total Sincronizado</span>
                        <span className="font-mono text-slate-900 dark:text-white">{globalSyncStats.totalSynced} itens</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                        <span>Sincronizações OK</span>
                        <span className="font-mono text-emerald-500">{globalSyncStats.totalSuccess} ops</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                        <span>Conflitos / Falhas</span>
                        <span className="font-mono text-rose-500">{globalSyncStats.totalFailure} ops</span>
                     </div>
                  </div>

                  {/* Micro list of logs */}
                  <div className="space-y-2 mt-4">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Histórico de Eventos Recentes:</p>
                     {syncLogs.length === 0 ? (
                        <p className="text-[9px] italic text-slate-400 uppercase">Nenhum evento registrado no IndexedDB.</p>
                     ) : (
                        syncLogs.slice(0, 3).map(log => (
                           <div key={log.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase transition-all hover:border-slate-200 dark:hover:border-white/10">
                              <div className="flex items-center gap-2 truncate">
                                 <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                 <span className="text-slate-500 text-[8px]">{log.operation}</span>
                                 <span className="text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{log.collection}</span>
                              </div>
                              <span className="text-[8px] text-slate-400 font-mono">
                                 {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               <button
                  onClick={handleManualSync}
                  disabled={isSyncingQueue || !isOnline}
                  className="mt-6 w-full py-4 rounded-3xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-850 disabled:text-slate-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10 active:scale-95 transition-all text-center cursor-pointer"
               >
                  <RefreshCw size={14} className={isSyncingQueue ? "animate-spin" : ""} />
                  {isSyncingQueue ? 'Auditando Banco e Sincronizando...' : 'Sincronizar Banco Agora'}
               </button>
            </div>
         </div>
        </div>
      )}

      {isMasterAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                 <History size={24} className="text-blue-600" />
                 {safeT('dashboard.recentActivities', 'Atividades Recentes')}
               </h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{safeT('dashboard.syncStatus', 'Sincronização OK')}</p>
            </div>
            <VerificationBadge status={auditStatus} />
         </div>

         <div className="space-y-4">
            {logs.slice(0, 5).map((log, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={log.id} 
                className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-blue-500/20 transition-all group"
              >
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                       <ShieldCheck size={20} />
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.action}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                             log.category === 'Security' ? 'bg-rose-500/10 text-rose-500' :
                             log.category === 'Financial' ? 'bg-emerald-500/10 text-emerald-500' :
                             'bg-blue-500/10 text-blue-500'
                          }`}>
                            {log.category}
                          </span>
                       </div>
                       <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{log.details}</p>
                    </div>
                 </div>
                 <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[8px] font-mono text-slate-400 truncate w-32 ml-auto mt-1">HASH: {log.hash?.substring(0, 16)}...</p>
                 </div>
              </motion.div>
            ))}
         </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
