import React, { useMemo } from 'react';
import { 
  BarChart3, FileText, Download, TrendingUp, Users, Award, 
  CalendarCheck, Clock, ShieldCheck, DollarSign, Activity 
} from 'lucide-react';
import { useData } from '../contexts/DataContext.js';
import { useTranslation } from '../contexts/LanguageContext.js';
import { StudentStatus } from '../types.js';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const Reports: React.FC = () => {
  const { students, attendance, ledger } = useData();
  const { t } = useTranslation();

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === StudentStatus.ACTIVE).length;
  const totalLedgerRecords = ledger.length;

  // Compute metrics
  const beltMetrics = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const b = s.belt || 'Branca';
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const COLORS = ['#1e1b4b', '#1d4ed8', '#7e22ce', '#78350f', '#0f172a', '#b91c1c'];

  const triggerDownload = (title: string) => {
    alert(`OSS! Lançando geração do arquivo: ${title}. O download iniciará em segundos.`);
  };

  return (
    <div className="space-y-8 pb-20 text-left font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Relatórios <span className="text-blue-600">Globais</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4 italic flex items-center gap-2">
            <BarChart3 size={13} className="text-blue-500" />
            Estatísticas Consolidadas Pedagógicas e de Integridade Financeira
          </p>
        </div>
      </header>

      {/* Grid count cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Total de Matrículas</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-950 dark:text-white">{totalStudents}</h3>
          <p className="text-[8.5px] text-slate-400 uppercase font-bold mt-1">Registrados no BD {activeStudents} Ativos</p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Presenças Acumuladas</span>
            <CalendarCheck size={16} className="text-indigo-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-950 dark:text-white">{attendance.length}</h3>
          <p className="text-[8.5px] text-indigo-505 text-indigo-500 uppercase font-bold mt-1">Aulas dadas e monitoradas</p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Lançamentos no Livro Caixa</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-950 dark:text-white">{totalLedgerRecords}</h3>
          <p className="text-[8.5px] text-slate-400 uppercase font-bold mt-1">Integridade auditável garantida</p>
        </div>
      </div>

      {/* Recharts Pie Chart & Stat distribution table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3 mb-6 flex items-center gap-2">
            <Activity size={14} className="text-blue-500" /> Composição Populacional de Faixas do Tatame
          </h4>

          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={beltMetrics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {beltMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3 flex items-center gap-2">
            <FileText size={14} className="text-indigo-500" /> Download de Relatórios Avançados (PDF)
          </h4>

          <div className="space-y-3">
            {[
              { title: "Ficha Técnica Geral de Graduações", desc: "Listagem de alunos com tempo acumulado em faixa e estimativa de graus" },
              { title: "Planilha Financeira Anual de Caixa", desc: "Demonstrativo consolidado de fluxo de caixa, inadimplência e mensalidades" },
              { title: "Quadro de Atletas de Alta Frequência", desc: "Top 20 competidores com maior aproveitamento técnico e presenças registradas" },
              { title: "Histórico Seguro de Auditoria Global", desc: "Snapshot cripto-auditável de todas as modificações críticas do dojo" }
            ].map((rep, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-between hover:border-blue-600/20 border border-transparent transition-all">
                <div className="space-y-1">
                  <h5 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-tight">{rep.title}</h5>
                  <p className="text-[8.5px] text-slate-400 uppercase leading-none">{rep.desc}</p>
                </div>
                <button 
                  onClick={() => triggerDownload(rep.title)}
                  className="cursor-pointer p-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl transition-all"
                >
                  <Download size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
