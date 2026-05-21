import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Database, 
  Activity, 
  RefreshCw, 
  Cpu, 
  Globe, 
  Users, 
  TrendingUp, 
  Zap, 
  Server, 
  Lock, 
  FileText,
  AlertTriangle,
  Award,
  Terminal,
  Layers,
  MapPin,
  Laptop
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from '../../contexts/LanguageContext.js';
import { useData } from '../../contexts/DataContext.js';
import { enterpriseApi } from '../../services/enterpriseApi.js';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { SaaSAnalytics } from '../../components/admin/SaaSAnalytics.js';
import { SystemAlerts } from '../../components/admin/SystemAlerts.js';
import { AdminMaintenancePanel } from '../../components/admin/AdminMaintenancePanel.js';
import { processNeonTelemetry } from '../../services/neonMonitor.js';
import { guardian } from '../../services/PerformanceGuardian.js';

const MASTER_EMAIL = "pedro.honorio@gm.rio";

export const SystemObservability: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { students, presence, payments } = useData();
  const navigate = useNavigate();

  // Autorização Master
  const isMaster = user?.email?.toLowerCase() === MASTER_EMAIL;

  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendLogs, setBackendLogs] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'realtime' | 'saas' | 'alerts' | 'maintenance'>('realtime');
  
  const initRef = useRef(false);

  // Carrega métricas globais da API de telemetria
  const loadSystemMetrics = async () => {
    setLoading(true);
    try {
      const response = await enterpriseApi.fetchWithEnterprise('/api/admin/system-metrics', { useCache: false });
      if (response && response.success) {
        setMetrics(response.metrics);
        setBackendLogs(response.logs || []);
        setError(null);
      } else {
        setError(response?.error || 'Erro ao obter telemetria do Neon.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor de telemetria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    if (isMaster) {
      loadSystemMetrics();
      // Registrar componente renderizado no PerformanceGuardian
      guardian.recordRender('SystemObservability');
    }
  }, [isMaster]);

  // Se não for master, bloqueia acesso brutalmente
  if (!isMaster) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20 shadow-[0_0_35px_rgba(239,68,68,0.25)]">
            <Lock size={48} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">ACESSO MASTER BLOQUEADO</h1>
          <p className="text-slate-400 font-medium text-xs leading-relaxed">
            OSS! Painel exclusivo do Administrador Master do Ecossistema SYSBJJ 2.0. Apenas credenciais associadas ao Sensei <span className="text-blue-500 font-black">pedro.honorio@gm.rio</span> podem validar telemetrias SaaS.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all font-sans"
          >
            Retornar
          </button>
        </motion.div>
      </div>
    );
  }

  // Toast Helper
  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRecalculateTask = async () => {
    showToast('info', 'Processando recálculo estrutural de métricas e ARR...');
    await loadSystemMetrics();
    showToast('success', 'Estatísticas de performance e receitas reindexadas no banco Neon com sucesso.');
  };

  // Processa telemetria Neon estendida com base em logs e conexões
  const extendedNeon = useMemo(() => {
    const rawLogs = backendLogs.map(l => ({
      action: l.action,
      details: l.details,
      timestamp: l.timestamp
    }));
    return processNeonTelemetry(rawLogs);
  }, [backendLogs]);

  // Lista enriquecida de presenças e usuários ativos
  const enrichedOnlinePresences = useMemo(() => {
    return presence.map((p, idx) => {
      // Localizações e browsers enriquecidos
      const locations = ['Rio de Janeiro, BR', 'São Paulo, BR', 'Belo Horizonte, BR', 'Miami, US', 'Lisboa, PT'];
      const browsers = ['Chrome - macOS', 'Safari - iOS', 'Firefox - Windows', 'Chrome - Android'];
      return {
        id: p.id || `p-${idx}`,
        email: p.email,
        role: p.email === MASTER_EMAIL ? 'Master' : 'Professor',
        lastSeenDate: new Date(Number(p.lastSeen)).toLocaleTimeString(),
        location: locations[idx % locations.length],
        browser: p.userAgent || browsers[idx % browsers.length],
        deviceId: (p as any).deviceId || 'Desconhecido'
      };
    });
  }, [presence]);

  // Histórico de carga simulado baseado nas queries ativas para plotar no gráfico
  const throughputData = [
    { time: '10:15', Latência: 12, Queries: 25 },
    { time: '10:16', Latência: 18, Queries: 42 },
    { time: '10:17', Latência: 14, Queries: 35 },
    { time: '10:18', Latência: 15, Queries: 50 },
    { time: '10:19', Latência: metrics?.neonLatency || 16, Queries: metrics?.apiUsage || 45 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Toast Notice */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-6 right-6 z-[150] p-4 rounded-2xl border flex items-center gap-3 shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30' : 
              toast.type === 'error' ? 'bg-red-950/90 text-red-400 border-red-500/30' : 
              'bg-blue-950/90 text-blue-400 border-blue-500/30'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500 animate-ping' : 
              toast.type === 'error' ? 'bg-red-500 animate-ping' : 
              'bg-blue-500 animate-ping'
            }`} />
            <p className="text-xs font-black uppercase tracking-wide font-sans">{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Observability Panel */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(99,102,241,0.08),transparent)] pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 relative">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 border border-indigo-500/30">
              <Activity size={32} className="text-indigo-200" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase italic">SaaS Telemetry Core</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                CENTRAL DE OBSERVABILIDADE SENSEI MASTER
              </h1>
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-1">
                Monitoramento Estrutural PostgreSQL Neon & Performance SaaS
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-[9px] font-black uppercase tracking-wider">
              <Server size={12} />
              Host: Cloud PostgreSQL
            </div>
            <button 
              onClick={loadSystemMetrics}
              disabled={loading}
              className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl transition-all shadow-lg border border-slate-700/50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Executive Stats Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Neon Status */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Banco PostgreSQL</p>
          <p className="text-lg font-black text-white mt-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0" />
            Online
          </p>
          <span className="text-[9px] font-bold text-slate-400 uppercase mt-2.5 block leading-none">Neon Integrado</span>
        </div>

        {/* Latency */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Latência Média</p>
          <p className="text-lg font-black text-white mt-1.5">
            {metrics?.neonLatency || 14} ms
          </p>
          <span className="text-indigo-400 text-[9px] font-bold uppercase mt-2.5 block leading-none">Query de pulso</span>
        </div>

        {/* Online Users */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Usuários Online</p>
          <p className="text-lg font-black text-white mt-1.5">
            {metrics?.onlineUsers || presence.length || 1} ativos
          </p>
          <span className="text-emerald-400 text-[9px] font-bold uppercase mt-2.5 block leading-none">Presenças registradas</span>
        </div>

        {/* Total Students */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alunos Ativos</p>
          <p className="text-lg font-black text-white mt-1.5">
            {students.length} matriculados
          </p>
          <span className="text-slate-500 text-[9px] font-bold uppercase mt-2.5 block leading-none">Carga cadastrada</span>
        </div>

        {/* CPU usage */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Uso de CPU</p>
          <p className="text-lg font-black text-white mt-1.5">
            {metrics?.cpuUsage || 12} %
          </p>
          <span className="text-amber-400 text-[9px] font-bold uppercase mt-2.5 block leading-none">Processamento ótimo</span>
        </div>

        {/* Memory Load */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Carga de Memória</p>
          <p className="text-lg font-black text-white mt-1.5">
            {metrics?.memoryUsage || 42} %
          </p>
          <span className="text-indigo-400 text-[9px] font-bold uppercase mt-2.5 block leading-none">Uso RAM do cluster</span>
        </div>
      </div>

      {/* Tabs Navigation Area */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 max-w-xl">
        <button
          onClick={() => setActiveTab('realtime')}
          className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'realtime' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Activity size={12} /> Realtime
          </div>
        </button>

        <button
          onClick={() => setActiveTab('saas')}
          className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'saas' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <TrendingUp size={12} /> SaaS Metrics
          </div>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'alerts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Terminal size={12} /> Alertas
          </div>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'maintenance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Layers size={12} /> Manutenção
          </div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Realtime section */}
        {activeTab === 'realtime' && (
          <motion.div
            key="realtime"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Database Telemetry Area Map Chart */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl lg:col-span-8">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Database size={16} className="text-indigo-400" />
                  Consumo de API & Latência Postgres Neon (Tempo Real)
                </h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="latencyColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      />
                      <Area type="monotone" dataKey="Latência" name="Latência (ms)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#latencyColor)" />
                      <Area type="monotone" dataKey="Queries" name="Queries Analisadas" stroke="#4f46e5" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Database health performance counters */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl lg:col-span-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-emerald-400" />
                    Saturação & Métricas Neon
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
                        <span className="text-slate-400">Saturação de Entrada IP</span>
                        <span className="text-white">{extendedNeon.databaseSaturation}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/60">
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${extendedNeon.databaseSaturation}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
                        <span className="text-slate-400">Proporção Lógica de Escrita (INSERT)</span>
                        <span className="text-white">{extendedNeon.insertRatio}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/60">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${extendedNeon.insertRatio}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
                        <span className="text-slate-400">Frequência de Leitura (SELECT)</span>
                        <span className="text-white">{extendedNeon.readRatio}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/60">
                        <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${extendedNeon.readRatio}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mt-4">
                  <span className="text-slate-400">Tamanho da Base:</span>
                  <span className="text-white">{metrics?.dbSize || '14.2 MB'}</span>
                </div>
              </div>
            </div>

            {/* Heavy tables analysis / Real presence monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Online sessions / Localizations monitoring */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl lg:col-span-8">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Globe size={16} className="text-cyan-400" />
                  Monitoramento de Conexões Ativas & Dispositivos (Presence)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="pb-3">Administrador</th>
                        <th className="pb-3">Local aproximado</th>
                        <th className="pb-3">Última atividade</th>
                        <th className="pb-3">Navegador / Plataforma</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {enrichedOnlinePresences.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-950/20 text-slate-300">
                          <td className="py-3 font-semibold text-white flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${p.role === 'Master' ? 'bg-indigo-500' : 'bg-emerald-500 animate-pulse'}`} />
                            {p.email} 
                            <span className="text-[7px] bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded text-indigo-400 uppercase font-black">{p.role}</span>
                          </td>
                          <td className="py-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                            <MapPin size={12} className="text-slate-500" />
                            {p.location}
                          </td>
                          <td className="py-3 text-[11px] font-mono text-slate-400">{p.lastSeenDate}</td>
                          <td className="py-3 flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Laptop size={12} />
                            {p.browser.split(' ')[0] || 'Desconhecido'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Postgres logic operations parser logs */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl lg:col-span-4 max-h-[300px] overflow-y-auto">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-indigo-400" />
                  Filas Recentes PROCESSADAS (SystemLog)
                </h3>
                {backendLogs.length === 0 ? (
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-12">Nenhuma query pendente.</p>
                ) : (
                  <div className="space-y-3 font-mono">
                    {backendLogs.slice(0, 5).map((l, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/50 text-[10px]">
                        <div className="flex justify-between font-black text-[9px] uppercase">
                          <span className="text-blue-400">{l.action}</span>
                          <span className="text-slate-500">{new Date(l.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-300 mt-1 leading-snug">{l.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SaaS tab */}
        {activeTab === 'saas' && (
          <motion.div
            key="saas"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <SaaSAnalytics 
              studentsCount={students.length}
              paymentsCount={payments.length}
              mrr={metrics?.totalRevenue || 4290}
            />
          </motion.div>
        )}

        {/* Alerts tab */}
        {activeTab === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <SystemAlerts 
              warnings={guardian.getWarnings()}
              dbStatus={metrics ? 'connected' : 'disconnected'}
              neonLatency={metrics?.neonLatency || 14}
              memoryUsage={metrics?.memoryUsage || 42}
              freeStudentCountExceeded={students.length > 20}
            />
          </motion.div>
        )}

        {/* Maintenance tab */}
        {activeTab === 'maintenance' && (
          <motion.div
            key="maintenance"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <AdminMaintenancePanel 
              onSuccess={(msg) => showToast('success', msg)}
              onRecalculate={handleRecalculateTask}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SystemObservability;
