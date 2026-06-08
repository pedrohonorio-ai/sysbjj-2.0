import React, { useState, useMemo } from 'react';
import { 
  Calendar, Search, Filter, Trash2, Edit2, AlertTriangle, 
  Trash, Download, FileSpreadsheet, FileText, Medal, Award, Trophy,
  TrendingUp, CircleDot, User, RefreshCw, Send, CheckCircle2, X, Compass, ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useData } from '../contexts/DataContext.js';
import { useProfile } from '../contexts/ProfileContext.js';
import { AttendanceRecord, Student, StudentStatus } from '../types.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const AttendanceHistory: React.FC = () => {
  const { t } = useTranslation();
  const { students, schedules, updateAttendanceRecord, addNotification, logAction } = useData();
  const { profile } = useProfile();

  // Filters state
  const [filterDate, setFilterDate] = useState('');
  const [filterClassId, setFilterClassId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  
  // Modals state
  const [editingRecord, setEditingRecord] = useState<{ studentId: string; record: AttendanceRecord } | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'trial'>('present');
  const [editNotes, setEditNotes] = useState('');
  const [deletingRecord, setDeletingRecord] = useState<{ studentId: string; record: AttendanceRecord } | null>(null);
  const [auditReason, setAuditReason] = useState('');
  const [showNotificationPopup, setShowNotificationPopup] = useState<string | null>(null);

  // Parse all attendance entries across all students
  const allAttendanceEntries = useMemo(() => {
    const list: {
      studentId: string;
      studentName: string;
      studentPhoto?: string;
      studentBelt: string;
      record: AttendanceRecord;
    }[] = [];

    students.forEach(s => {
      if (s.attendanceHistory && Array.isArray(s.attendanceHistory)) {
        s.attendanceHistory.forEach(r => {
          if (!r.isDeleted) {
            list.push({
              studentId: s.id,
              studentName: s.name,
              studentPhoto: s.photoUrl,
              studentBelt: s.belt || 'white',
              record: r
            });
          }
        });
      }
    });

    // Sort by date (newest first)
    return list.sort((a, b) => {
      const dateA = a.record.timestamp || a.record.date;
      const dateB = b.record.timestamp || b.record.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [students]);

  // Filtered attendance records for rendering
  const filteredEntries = useMemo(() => {
    return allAttendanceEntries.filter(entry => {
      // Date filter
      if (filterDate && entry.record.date !== filterDate) return false;
      
      // Class filter
      if (filterClassId !== 'all' && entry.record.classId !== filterClassId) return false;
      
      // Status filter
      const recordStatus = entry.record.status || 'present';
      if (filterStatus !== 'all' && recordStatus !== filterStatus) return false;
      
      // Search filter (handles student name or notes)
      if (filterSearch) {
        const query = filterSearch.toLowerCase();
        const matchesName = entry.studentName.toLowerCase().includes(query);
        const matchesNotes = entry.record.notes?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesNotes) return false;
      }
      
      return true;
    });
  }, [allAttendanceEntries, filterDate, filterClassId, filterStatus, filterSearch]);

  // Gamified Leaderboard & Streaks
  const leaderBoard = useMemo(() => {
    return [...students]
      .filter(s => s.status === StudentStatus.ACTIVE)
      .sort((a, b) => (b.attendanceCount || 0) - (a.attendanceCount || 0))
      .slice(0, 10);
  }, [students]);

  const streakBoard = useMemo(() => {
    return [...students]
      .filter(s => s.status === StudentStatus.ACTIVE && (s.currentStreak || 0) > 0)
      .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))
      .slice(0, 5);
  }, [students]);

  // Absent Students Triggers (7, 15, 30 days)
  const absentStudents = useMemo(() => {
    const now = new Date().getTime();
    const list: {
      student: Student;
      days: number;
      tier: 'inactive' | 'alert' | 'critical';
    }[] = [];

    students.forEach(s => {
      if (s.status !== StudentStatus.ACTIVE) return;
      
      const lastDateStr = s.lastAttendanceDate || s.lastPromotionDate || new Date().toISOString();
      if (!lastDateStr) return;

      const lastTime = new Date(lastDateStr).getTime();
      const diffDays = Math.floor((now - lastTime) / (1000 * 60 * 60 * 24));

      if (diffDays >= 7) {
        let tier: 'inactive' | 'alert' | 'critical' = 'inactive';
        if (diffDays >= 30) tier = 'critical';
        else if (diffDays >= 15) tier = 'alert';

        list.push({
          student: s,
          days: diffDays,
          tier
        });
      }
    });

    return list.sort((a, b) => b.days - a.days);
  }, [students]);

  // Trigger Warning Notification Alert
  const handleTriggerAlert = (student: Student, days: number, channel: 'portal' | 'whatsapp' | 'email') => {
    const alertId = `${student.id}-${days}-${channel}`;
    const levelName = days >= 30 ? 'CRÍTICO: Risco Grave de Evasão' : days >= 15 ? 'Alerta de Retenção' : 'Aviso Preventivo';
    
    // 1. Create App Notification
    addNotification(
      `Alerta de Frequência enviado para o Aluno ${student.name} (${days} dias sem treinar). Canal: ${channel.toUpperCase()}`,
      days >= 15 ? 'warning' : 'info',
      'graduacoes',
      days >= 30 ? 'high' : 'medium'
    );

    // 2. Mock Action Dispatch
    logAction(
      `Alerta de Ausência Despachado`, 
      `Aluno: ${student.name} • Dias: ${days} • Canal: ${channel.toUpperCase()} • Nível: ${levelName}`, 
      'User'
    );

    setShowNotificationPopup(`Alerta disparado com sucesso para ${student.name} via ${channel.toUpperCase()}!`);
    setTimeout(() => setShowNotificationPopup(null), 3000);
  };

  // Executive KPI stats calculations
  const stats = useMemo(() => {
    const activeCount = students.filter(s => s.status === StudentStatus.ACTIVE).length;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Present Today count
    const presentToday = new Set(allAttendanceEntries
      .filter(e => e.record.date === todayStr && (e.record.status === 'present' || e.record.status === 'late' || e.record.status === 'trial'))
      .map(e => e.studentId)
    ).size;

    // Attendance Rate Today
    const attendanceRateToday = activeCount > 0 ? Math.round((presentToday / activeCount) * 100) : 0;
    
    // Students in Critical Absence tier (15+ days)
    const criticalAbsenceCount = absentStudents.filter(as => as.days >= 15).length;
    
    // Overall Academy Retention (SaaS metric mapping estimated of average activity)
    const activeTrainingOverPastWeek = new Set(allAttendanceEntries
      .filter(e => {
        const diff = (new Date().getTime() - new Date(e.record.date).getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      })
      .map(e => e.studentId)
    ).size;
    const generalRetention = activeCount > 0 ? Math.round((activeTrainingOverPastWeek / activeCount) * 100) : 100;

    return {
      activeStudentsCount: activeCount,
      presentToday,
      attendanceRateToday,
      criticalAbsenceCount,
      generalRetention: Math.min(100, Math.max(0, generalRetention))
    };
  }, [students, allAttendanceEntries, absentStudents]);

  // Chart Data: Frequency per Day/Class over last 7 days
  const chartDataWeekly = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return dates.map(dt => {
      const records = allAttendanceEntries.filter(e => e.record.date === dt);
      const isWeekend = new Date(dt).getDay() === 0 || new Date(dt).getDay() === 6;
      
      // Calculate by status
      const present = records.filter(r => r.record.status === 'present' || !r.record.status).length;
      const late = records.filter(r => r.record.status === 'late').length;
      const trial = records.filter(r => r.record.status === 'trial').length;
      
      // Match a nice weekday abbreviation
      const label = new Date(dt).toLocaleDateString([], { weekday: 'short' });
      
      return {
        dateStr: dt,
        label,
        Presente: present,
        Atrasado: late,
        Experimental: trial,
        Faltas: isWeekend ? 0 : Math.max(0, Math.round(stats.activeStudentsCount * 0.15)) // estimate
      };
    });
  }, [allAttendanceEntries, stats.activeStudentsCount]);

  // Edit action
  const handleOpenEdit = (studentId: string, record: AttendanceRecord) => {
    setEditingRecord({ studentId, record });
    setEditStatus(record.status || 'present');
    setEditNotes(record.notes || '');
  };

  const submitEdit = async () => {
    if (!editingRecord) return;
    
    const professorUser = {
      email: 'sensei@sysbjj.com',
      name: profile?.name || 'Professor',
      role: 'Professor Principal'
    };

    await updateAttendanceRecord(
      editingRecord.studentId,
      editingRecord.record.id || '',
      {
        status: editStatus,
        notes: editNotes,
        date: editingRecord.record.date
      },
      professorUser,
      'update',
      `Manual modification: Status => ${editStatus.toUpperCase()}`
    );

    setEditingRecord(null);
    setShowNotificationPopup("Presença atualizada e auditada com sucesso! 🥋");
    setTimeout(() => setShowNotificationPopup(null), 3000);
  };

  // Soft delete action
  const handleOpenDelete = (studentId: string, record: AttendanceRecord) => {
    setDeletingRecord({ studentId, record });
    setAuditReason('');
  };

  const submitSoftDelete = async () => {
    if (!deletingRecord) return;
    if (!auditReason.trim()) {
      alert("Por favor, digite o motivo da remoção da presença.");
      return;
    }

    const professorUser = {
      email: 'sensei@sysbjj.com',
      name: profile?.name || 'Professor',
      role: 'Professor Principal'
    };

    await updateAttendanceRecord(
      deletingRecord.studentId,
      deletingRecord.record.id || '',
      {},
      professorUser,
      'delete',
      auditReason
    );

    setDeletingRecord(null);
    setShowNotificationPopup("Presença removida com soft-delete auditado! 📂");
    setTimeout(() => setShowNotificationPopup(null), 3000);
  };

  // Report: PDF Exports
  const handleExportCustomPDF = (type: 'current' | 'full' | 'atrisk') => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.text("SYSBJJ 2.0 - Relatório Executivo de Frequência", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${today} • Academia: ${profile?.academyName || 'SYSBJJ Dojo'}`, 14, 32);

    // Filter list to export
    let listToExport = filteredEntries;
    let title = "Relatório de Chamadas Filtradas";
    let headings = ["Aluno", "Graduação", "Data", "Status", "Origem", "Dispositivo"];

    if (type === 'atrisk') {
      title = "Relatório de Alunos Ausentes (Em Alerta de Retenção)";
      headings = ["Aluno", "Graduação", "Último Treino", "Dias de Ausência", "Impacto de Retenção"];
      
      const rows = absentStudents.map(as => [
        as.student.name,
        as.student.belt ? as.student.belt.toUpperCase() : 'BRANCA',
        as.student.lastAttendanceDate || "Nunca registrado",
        `${as.days} dias`,
        as.tier === 'critical' ? 'Risco Grave de Abandono' : as.tier === 'alert' ? 'Frequência Instável' : 'Ausência Periódica'
      ]);

      (autoTable as any)(doc, {
        startY: 42,
        head: [headings],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] }, // Red for risks
        styles: { fontSize: 9 }
      });
    } else {
      const recordsToUse = type === 'full' ? allAttendanceEntries : filteredEntries;
      title = type === 'full' ? "Histórico Geral Integrado de Presenças" : "Presenças Filtradas do Tatame";
      
      const rows = recordsToUse.map(e => [
        e.studentName,
        e.studentBelt.toUpperCase(),
        e.record.date,
        (e.record.status || 'present').toUpperCase(),
        e.record.origin || 'MANUAL_PROFESSOR',
        e.record.deviceInfo?.device || "Browser"
      ]);

      (autoTable as any)(doc, {
        startY: 42,
        head: [headings],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // Blue
        styles: { fontSize: 9 }
      });
    }

    doc.save(`SYSBJJ-Frequencia-${type}-${today.replace(/\//g, '-')}.pdf`);
  };

  // Report: CSV / Excel Export
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nome do Aluno,Graduacao,Data,Horario,Status,Registro Por,Origem,Observacoes,Dispositivo,Latitude,Longitude,Distancia\n";
    
    allAttendanceEntries.forEach(entry => {
      const r = entry.record;
      const row = [
        entry.studentName,
        entry.studentBelt,
        r.date,
        r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        r.status || 'present',
        r.registeredBy?.email || 'PROFESSOR',
        r.origin || 'MANUAL_PROFESSOR',
        (r.notes || '').replace(/,/g, ' '),
        r.deviceInfo?.device || 'N/A',
        r.gps?.latitude || '',
        r.gps?.longitude || '',
        r.gps?.distance ? `${Math.round(r.gps.distance)}m` : ''
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SYSBJJ_Controle_Frequencia_Tatame_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 px-4 sm:px-6 relative">
      
      {/* Toast feedback alerts inside UI */}
      <AnimatePresence>
        {showNotificationPopup && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-6 right-6 z-[120] bg-slate-900 border-2 border-emerald-500 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md"
          >
            <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider">{showNotificationPopup}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Taxa de Presença */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t('reports.attendanceRate') || 'TAXA DE PRESENÇA'}</span>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">{stats.attendanceRateToday}%</p>
            <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <TrendingUp size={12} />
              <span>{stats.presentToday} presentes hoje</span>
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl text-blue-600 transition-transform group-hover:scale-110">
            <UserCheck size={28} />
          </div>
        </div>

        {/* KPI: Alunos Ausentes / Retenção */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">ALUNOS EM RISCO</span>
            <p className="text-4xl font-extrabold text-red-500 tabular-nums">{stats.criticalAbsenceCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Ausentes há 15+ dias</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/10 p-4 rounded-2xl text-red-500 transition-transform group-hover:scale-110">
            <ShieldAlert size={28} />
          </div>
        </div>

        {/* KPI: Retenção Geral */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">ÍNDICE DE RETENÇÃO</span>
            <p className="text-4xl font-extrabold text-emerald-500 tabular-nums">{stats.generalRetention}%</p>
            <p className="text-[10px] text-slate-400 font-medium">Alunos ativos no tatame / semana</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/10 p-4 rounded-2xl text-emerald-500 transition-transform group-hover:scale-110">
            <TrendingUp size={28} />
          </div>
        </div>

        {/* KPI: Total Ativos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">EFETIVO ATIVO</span>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">{stats.activeStudentsCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Estudantes com plano elegível</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-slate-600 dark:text-slate-300 transition-transform group-hover:scale-110">
            <User size={28} />
          </div>
        </div>
      </div>

      {/* Visual Frequency Analytics Chart */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Análise de Fluxo Semanal de Alunos</h2>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Valores de frequência agrupados por dia útil e categoria de check-in</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleExportCustomPDF('full')} 
              className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              <FileText size={12} />
              <span>PDF COMPLETO</span>
            </button>
            <button 
              onClick={handleExportCSV} 
              className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <FileSpreadsheet size={12} />
              <span>EXCEL / CSV</span>
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDataWeekly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientPresente" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradientAtrasos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1rem', 
                  backgroundColor: '#0f172a', 
                  color: '#fff', 
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="Presente" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gradientPresente)" />
              <Area type="monotone" dataKey="Atrasado" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#gradientAtrasos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Master Chronicle Ledger Filters + Log (Takes 2/3 space) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Livro de Chamadas & Auditoria</h3>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Relação completa de todos os alunos que passaram pelo dojo.</p>
              </div>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                {filteredEntries.length} Registros
              </span>
            </header>

            {/* Ledger Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Buscar Aluno</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    value={filterSearch}
                    onChange={e => setFilterSearch(e.target.value)}
                    placeholder="Nome..." 
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Filtrar por Data</label>
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-blue-600 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Turma / Horário</label>
                <select 
                  value={filterClassId}
                  onChange={e => setFilterClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-600 dark:text-white"
                >
                  <option value="all">Todas as turmas</option>
                  {schedules.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.time} - {sc.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Status de Aula</label>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-600 dark:text-white"
                >
                  <option value="all">Ver todos</option>
                  <option value="present">Presente</option>
                  <option value="absent">Falta</option>
                  <option value="late">Atraso</option>
                  <option value="trial">Experimental</option>
                </select>
              </div>
            </div>

            {/* Ledger List */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
              {filteredEntries.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] space-y-3">
                  <UserCheck className="mx-auto text-slate-300" size={40} />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nenhum registro correspondente aos filtros.</p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const r = entry.record;
                  const statusVal = r.status || 'present';
                  const originLabel = r.origin || 'MANUAL_PROFESSOR';
                  
                  return (
                    <div 
                      key={r.id || `${entry.studentId}-${r.date}`}
                      className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-500/20 active:bg-slate-100/50 dark:active:bg-slate-800/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center font-black text-sm text-white shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
                          {entry.studentPhoto ? (
                            <img src={entry.studentPhoto} alt={entry.studentName} className="w-full h-full object-cover" />
                          ) : (
                            entry.studentName[0]
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{entry.studentName}</span>
                            <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-black tracking-wider uppercase">{entry.studentBelt}</span>
                          </p>
                          <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 tracking-wider">
                            <span className="font-mono text-blue-600 dark:text-blue-400">{r.date}</span>
                            <span>•</span>
                            <span className="uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Compass size={10} />
                              {originLabel}
                            </span>
                            {r.gps?.distance !== undefined && (
                              <span className="text-emerald-500 font-mono">({Math.round(r.gps.distance)}m do Dojo)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            statusVal === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            statusVal === 'late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                            statusVal === 'trial' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {statusVal === 'present' ? 'COMPARECEU' : statusVal === 'late' ? 'ATRASADO' : statusVal === 'trial' ? 'EXPERIMENTAL' : 'MISSING / FALTA'}
                          </span>
                          
                          {/* Registered Audit Tag */}
                          {r.registeredBy && (
                            <p className="text-[7px] text-slate-400 uppercase tracking-widest font-bold mt-1">Audit: {r.registeredBy.name}</p>
                          )}
                        </div>

                        {/* Audit Manager Control Buttons */}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleOpenEdit(entry.studentId, r)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-all"
                            title="Editar Presença"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(entry.studentId, r)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                            title="Remover Presença (Soft Delete)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Gamified leaderboard, training streak & retention signals */}
        <div className="space-y-6">
          
          {/* Section: Gamified Rankings */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <header className="flex items-center gap-3">
              <Trophy size={18} className="text-amber-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Ranking de Combatentes</h3>
            </header>

            <div className="space-y-4">
              {leaderBoard.slice(0, 5).map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg font-black text-[10px] flex items-center justify-center ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md' :
                      idx === 1 ? 'bg-slate-300 text-slate-950 shadow-md' :
                      idx === 2 ? 'bg-amber-600 text-white shadow-md' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{s.name}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{s.belt ? s.belt.toUpperCase() : 'BRANCA'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 font-mono">{s.attendanceCount} AULAS</span>
                    {s.attendanceCount >= 20 ? (
                      <Medal size={14} className="text-emerald-500" />
                    ) : s.attendanceCount >= 10 ? (
                      <Award size={14} className="text-blue-500" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Streak Champons section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CircleDot size={12} className="text-amber-500" />
                <span>MAIORES SEQUÊNCIAS (STREAK) ATIVAS</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {streakBoard.slice(0, 2).map(s => (
                  <div key={s.id} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <p className="text-[10px] font-black uppercase text-amber-600 truncate">{s.name}</p>
                    <p className="text-lg font-extrabold text-amber-500 font-mono mt-1">{s.currentStreak} 🔥</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Absence alerts / retention board */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <header className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Defesas de Retenção</h3>
              </div>
              <button 
                onClick={() => handleExportCustomPDF('atrisk')}
                className="text-[8px] text-red-500 font-black uppercase tracking-widest border border-red-500/20 px-3 py-1 rounded-lg hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                EXPORTAR ALERTA
              </button>
            </header>

            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-tight font-bold italic">
              Alunos que sumiram do tatame. Execute ações e envie convites de chamada de volta imediatamente para reincorporá-los!
            </p>

            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
              {absentStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                  <p className="text-[10px] uppercase font-black text-slate-500">Nenhum guerreiro sumido! Frequência total 100%! 🔥</p>
                </div>
              ) : (
                absentStudents.slice(0, 5).map(({ student, days, tier }) => (
                  <div key={student.id} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-900 dark:text-white">{student.name}</p>
                        <p className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-0.5">Último: {student.lastAttendanceDate || 'N/A'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        tier === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                        tier === 'alert' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                        'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {days} DIAS FORA
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 w-full">
                      <button 
                        onClick={() => handleTriggerAlert(student, days, 'portal')}
                        className="flex-1 py-1.5 bg-slate-900 border border-transparent hover:border-slate-700 text-white dark:bg-slate-800 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Send size={8} /> Portal
                      </button>
                      <button 
                        onClick={() => handleTriggerAlert(student, days, 'whatsapp')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Montar mensagem de Whatsapp de resgate"
                      >
                        WhatsApp
                      </button>
                      <button 
                        onClick={() => handleTriggerAlert(student, days, 'email')}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        Correio Email
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Audit Prompt for Soft-Deletes */}
      <AnimatePresence>
        {deletingRecord && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <header className="flex items-center justify-between">
                <h3 className="text-xl font-black text-red-500 uppercase tracking-tighter italic flex items-center gap-2">
                  <AlertTriangle />
                  Auditoria de Remoção
                </h3>
                <button 
                  onClick={() => setDeletingRecord(null)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X />
                </button>
              </header>

              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-xs leading-relaxed uppercase tracking-tight font-bold font-sans">
                Atenção Sensei, a presença nunca é excluída permanentemente. 
                Ela é desativada sob um soft-delete sob justificativa obrigatória registrada e auditada.
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Motivo da Exclusão / Correção</label>
                <textarea 
                  value={auditReason}
                  onChange={e => setAuditReason(e.target.value)}
                  placeholder="Por que está removendo esta presença? Ex: Aluno marcou na hora errada, duplicado, etc."
                  className="w-full text-sm font-bold p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-1 focus:ring-blue-600 min-h-[100px] dark:text-white"
                />
              </div>

              <footer className="flex gap-3 justify-end pt-3">
                <button 
                  onClick={() => setDeletingRecord(null)}
                  className="px-5 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  onClick={submitSoftDelete}
                  className="px-6 py-3 text-[10px] font-black uppercase text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/20"
                >
                  Confirmar Soft-Delete
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Audit Prompt for Editing Record Status */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <header className="flex items-center justify-between">
                <h3 className="text-xl font-black text-blue-600 uppercase tracking-tighter italic flex items-center gap-2">
                  <Edit2 />
                  Editar Presença
                </h3>
                <button 
                  onClick={() => setEditingRecord(null)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X />
                </button>
              </header>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">STATUS DO CHECK-IN</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'present', label: 'COMPARECEU' },
                      { key: 'late', label: 'ATRASADO' },
                      { key: 'trial', label: 'EXPERIMENTAL' },
                      { key: 'absent', label: 'FALTA' }
                    ].map(st => (
                      <button 
                        key={st.key}
                        onClick={() => setEditStatus(st.key as any)}
                        className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all ${
                          editStatus === st.key 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Observações Técnicas</label>
                  <textarea 
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Adicione notas ou correções sobre esta aula..."
                    className="w-full text-xs font-bold p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-1 focus:ring-blue-600 min-h-[90px] dark:text-white"
                  />
                </div>
              </div>

              <footer className="flex gap-3 justify-end pt-3">
                <button 
                  onClick={() => setEditingRecord(null)}
                  className="px-5 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  onClick={submitEdit}
                  className="px-6 py-3 text-[10px] font-black uppercase text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Confirmar Edição
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceHistory;
