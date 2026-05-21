import React, { useMemo } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Terminal,
  ServerCrash,
  Database,
  CloudLightning,
  AlertOctagon
} from 'lucide-react';
import { PerformanceWarning } from '../../services/PerformanceGuardian.js';

interface SystemAlertsProps {
  warnings: PerformanceWarning[];
  dbStatus: string;
  neonLatency: number;
  memoryUsage: number;
  freeStudentCountExceeded: boolean;
}

export const SystemAlerts: React.FC<SystemAlertsProps> = ({ 
  warnings, 
  dbStatus, 
  neonLatency, 
  memoryUsage, 
  freeStudentCountExceeded 
}) => {

  const allAlerts = useMemo(() => {
    const list: Array<{
      id: string;
      level: 'RED' | 'AMBER' | 'YELLOW';
      title: string;
      desc: string;
      icon: React.ReactNode;
      time: string;
    }> = [];

    // 🔴 RED: Neon offline
    if (dbStatus !== 'connected') {
      list.push({
        id: 'neon-offline',
        level: 'RED',
        title: 'Neon PostgreSQL Desconectado',
        desc: 'Conexão falhou. O sistema falhou ao tentar efetuar SELECT 1 de pulso de integridade.',
        icon: <ServerCrash size={16} className="text-red-400" />,
        time: 'Agora'
      });
    }

    // 🔴 RED: DATABASE_URL ausente simulated (we can check if env variable exists or mock it based on errors)
    if (!dbStatus) {
      list.push({
        id: 'db-url-missing',
        level: 'RED',
        title: 'DATABASE_URL Erro de Configuração',
        desc: 'As variáveis de ambiente do Neon não foram lidas corretamente no bootstrap do servidor.',
        icon: <CloudLightning size={16} className="text-red-400" />,
        time: 'Bootstrap'
      });
    }

    // 🔴 RED: Slow query check (> 500ms) from active guardian alerts
    const slowGuardianAlerts = warnings.filter(w => w.message.includes('500ms') || w.type === 'CRITICAL');
    slowGuardianAlerts.forEach(wa => {
      list.push({
        id: wa.id,
        level: wa.type === 'CRITICAL' ? 'RED' : 'AMBER',
        title: wa.metric || 'Alerta de Performance',
        desc: wa.message,
        icon: <AlertCircle size={16} className={wa.type === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'} />,
        time: new Date(wa.timestamp).toLocaleTimeString()
      });
    });

    // 🟠 AMBER: High memory usage
    if (memoryUsage > 80) {
      list.push({
        id: 'high-mem',
        level: 'AMBER',
        title: 'Uso de Memória Elevado',
        desc: `Consumo de RAM do cluster está em ${memoryUsage}%. Verifique vazamento de websocket ou conexões zumbis.`,
        icon: <AlertTriangle size={16} className="text-amber-400" />,
        time: 'Agora'
      });
    }

    // 🟠 AMBER: Latency query slow
    if (neonLatency > 200) {
      list.push({
        id: 'high-latency',
        level: 'AMBER',
        title: 'Latência de Query Elevada',
        desc: `O tempo de resposta do Neon postgres subiu para ${neonLatency}ms. Possível enfileiramento de conexões.`,
        icon: <AlertTriangle size={16} className="text-amber-400" />,
        time: 'Agora'
      });
    }

    // 🟡 YELLOW: Excess students on FREE plan
    if (freeStudentCountExceeded) {
      list.push({
        id: 'free-limit',
        level: 'YELLOW',
        title: 'Excesso de Alunos no Plano FREE',
        desc: 'Algumas academias ativas ultrapassaram o limite contratual de 20 alunos no plano básico gratuito.',
        icon: <AlertOctagon size={16} className="text-yellow-400" />,
        time: 'Recalculado'
      });
    }

    // Other minor warnings from performance guardian (retries, duplicate fetches)
    const minorWarnings = warnings.filter(w => !w.message.includes('500ms') && w.type === 'WARNING');
    minorWarnings.forEach(mw => {
      list.push({
        id: mw.id,
        level: 'YELLOW',
        title: mw.metric || 'Aviso de Otimização',
        desc: mw.message,
        icon: <Info size={16} className="text-yellow-400" />,
        time: new Date(mw.timestamp).toLocaleTimeString()
      });
    });

    return list;
  }, [warnings, dbStatus, neonLatency, memoryUsage, freeStudentCountExceeded]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Terminal size={16} className="text-red-400" />
          Sensores de Alerta do Guardião ({allAlerts.length})
        </h3>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Monitoramento em Tempo Real
        </span>
      </div>

      {allAlerts.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/10">
            <Database size={24} />
          </div>
          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Sistema Operando Sem Gargalos</h4>
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
            OSS! Todas as queries e buffers estão rodando no limiar ótimo. Nenhum vazamento ou loop detectado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
          {allAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-2xl border flex items-start gap-4 transition-all hover:scale-[1.01] ${
                alert.level === 'RED' ? 'bg-red-950/20 border-red-500/20 text-red-100' :
                alert.level === 'AMBER' ? 'bg-amber-950/20 border-amber-500/20 text-amber-100' :
                'bg-yellow-950/10 border-yellow-500/15 text-yellow-100'
              }`}
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                alert.level === 'RED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                alert.level === 'AMBER' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
              }`}>
                {alert.icon}
              </div>

              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                    alert.level === 'RED' ? 'bg-red-500/20 text-red-300' :
                    alert.level === 'AMBER' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {alert.level} ALERT
                  </span>
                  <span className="text-[9px] font-bold text-slate-500">{alert.time}</span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-tight text-white">{alert.title}</h4>
                <p className="text-[10px] text-slate-300 leading-relaxed font-sans">{alert.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
