import React, { useMemo } from 'react';
import { 
  Database, 
  Cpu, 
  Activity, 
  HardDrive, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  Users, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';
import { formatNumber } from '../../utils/currency.js';

interface SystemDatabaseMonitorProps {
  extendedNeon: {
    queryCount: number;
    avgDurationMs: number;
    slowQueryCount: number;
    databaseSaturation: number;
    insertRatio: number;
    updateRatio: number;
    readRatio: number;
    heavyTables: Array<{ table: string; count: number; avgTimeMs: number }>;
    topEndpoints: Array<{ path: string; frequency: number; errorRate: number }>;
  };
  onlineCount: number;
}

export const SystemDatabaseMonitor: React.FC<SystemDatabaseMonitorProps> = ({ 
  extendedNeon,
  onlineCount 
}) => {

  const tablesWithRatios = useMemo(() => {
    return extendedNeon.heavyTables || [];
  }, [extendedNeon]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[#00E5FF] leading-none">
            <Zap size={14} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#00E5FF]">Neon Telemetry Guard</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
            System Database Monitor
          </h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            Latência do cluster serverless Neon e integridade de queries
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Neon Ativo</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Total Query count */}
        <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-2 relative">
          <div className="p-2 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total de Queries</p>
            <p className="text-2xl font-black text-white font-mono mt-1">{formatNumber(extendedNeon.queryCount)}</p>
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Inserts, Updates & Selects</span>
        </div>

        {/* Metric 2: Avg response latency */}
        <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-2 relative">
          <div className="p-2 w-fit rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tempo Médio Queries</p>
            <p className="text-2xl font-black text-[#00E5FF] font-mono mt-1">{extendedNeon.avgDurationMs}ms</p>
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Latência de replicação global</span>
        </div>

        {/* Metric 3: Database resource saturation */}
        <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-2 relative">
          <div className="p-2 w-fit rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Cpu size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Saturação / Uso de Banco</p>
            <p className="text-2xl font-black text-white font-mono mt-1">{extendedNeon.databaseSaturation}%</p>
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Capacidade total de conexões</span>
        </div>

        {/* Metric 4: Online Users active */}
        <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-2 relative">
          <div className="p-2 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Usuários Online</p>
            <p className="text-2xl font-black text-white font-mono mt-1">{onlineCount}</p>
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Sessões ativas no ecossistema</span>
        </div>

      </div>

      {/* Tables usage & query ratio section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Most Accessed Tables */}
        <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-3xl space-y-4">
          <h3 className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2">
            <HardDrive size={14} className="text-[#00E5FF]" />
            Tabelas Mais Acessadas do Neon
          </h3>
          <div className="space-y-3">
            {tablesWithRatios.map((table, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-0">
                <span className="font-mono font-bold text-slate-300">schema.{table.table}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium text-slate-500">{table.count} ops</span>
                  <span className="font-mono font-black text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2 py-0.5 rounded">{table.avgTimeMs}ms lat</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Query Distribution */}
        <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-3xl space-y-4">
          <h3 className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-indigo-400" />
            Distribuição de Transações SQL
          </h3>
          <div className="grid grid-cols-3 gap-4 pt-1 text-center">
            
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SELECTS (Reads)</span>
              <div className="p-3 bg-cyan-950/50 rounded-2xl border border-cyan-500/20 text-cyan-400 font-mono font-black text-sm">
                {extendedNeon.readRatio}%
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">INSERTS (Writes)</span>
              <div className="p-3 bg-emerald-950/50 rounded-2xl border border-emerald-500/20 text-emerald-400 font-mono font-black text-sm">
                {extendedNeon.insertRatio}%
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">UPDATES / DELETE</span>
              <div className="p-3 bg-purple-950/50 rounded-2xl border border-purple-500/20 text-purple-400 font-mono font-black text-sm">
                {extendedNeon.updateRatio}%
              </div>
            </div>

          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
            <span>Health Database</span>
            <span className="text-emerald-400 font-bold">100% OPERATIONAL (EXCELLENT)</span>
          </div>
        </div>

      </div>

    </div>
  );
};
export default SystemDatabaseMonitor;
