import React, { useState } from 'react';
import { 
  Wrench, 
  RefreshCw, 
  Trash2, 
  Database,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { cacheManager } from '../../services/cacheManager.js';

interface AdminMaintenancePanelProps {
  onSuccess: (message: string) => void;
  onRecalculate: () => Promise<void>;
}

export const AdminMaintenancePanel: React.FC<AdminMaintenancePanelProps> = ({ onSuccess, onRecalculate }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRecalculate = async () => {
    setLoading('recalculate');
    try {
      // Execute parent callback for database recalculation
      await onRecalculate();
      
      // Perform local cache clearing
      cacheManager.clear();
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sysbjj_cache_')) {
          localStorage.removeItem(key);
        }
      }
      
      onSuccess('Métricas e gráficos recalculados com sucesso! Todo o cache temporário foi limpo.');
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleResetTemporaryMetrics = () => {
    setLoading('reset_temp');
    setTimeout(() => {
      // Purge cache and flush logs that are local
      cacheManager.clear();
      
      // Clear localStorage analytical cache
      for (const key of Object.keys(localStorage)) {
        if (key.includes('analytics') || key.includes('telemetry') || key.startsWith('sysbjj_cache_')) {
          localStorage.removeItem(key);
        }
      }

      onSuccess('Estatísticas temporárias e caches analíticos redefinidos com sucesso.');
      setLoading(null);
    }, 1200);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-xl">
          <Wrench size={18} />
        </div>
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Painel Administrativo de Manutenção</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Operações de Consistência & Saúde Estrutural</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recalculation card */}
        <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight flex items-center gap-2">
              <RefreshCw size={14} className="text-cyan-400" />
              Recalculação de Métricas
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Reindexa gráficos, recalcula faturamento MRR/ARR, receita projetada, pontuação de presença do aluno, contagem de faltas e ranking geral. Ideal após importação de grandes lotes de dados.
            </p>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={loading !== null}
            className="mt-4 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={12} className={loading === 'recalculate' ? 'animate-spin' : ''} />
            {loading === 'recalculate' ? 'Processando Recálculo...' : 'Executar Recálculo Geral'}
          </button>
        </div>

        {/* Temporary metrics card */}
        <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight flex items-center gap-2">
              <Trash2 size={14} className="text-red-400" />
              Resetar Estatísticas Analíticas
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Limpa caches de requisição, reseta os contadores temporários e forças recalibrações globais nos dashboards de monitoramento.
            </p>
          </div>
          <button
            onClick={handleResetTemporaryMetrics}
            disabled={loading !== null}
            className="mt-4 px-4 py-2.5 bg-red-950/30 border border-red-500/20 hover:bg-red-950/50 disabled:opacity-50 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={12} className={loading === 'reset_temp' ? 'animate-spin' : ''} />
            {loading === 'reset_temp' ? 'Limpando Memória...' : 'Resetar Estatísticas do Sistema'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-tight">Política Imutável de Salvaguarda do Dojo:</h5>
          <p className="text-[9px] text-amber-300/80 leading-relaxed font-sans">
            OSS! Estas operações realizam exclusivamente limpezas lógicas de cache e recomputam indicadores derivados. <strong>Alunos, logs históricos, perfis das academias, pagamentos reais e dados de graduação NUNCA são apagados</strong> nestas operações.
          </p>
        </div>
      </div>
    </div>
  );
};
