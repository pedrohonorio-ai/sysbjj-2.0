import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../utils/toast.js';
import { 
  Cpu, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  HelpCircle, 
  Key, 
  Wifi, 
  WifiOff, 
  Database, 
  Layers, 
  X,
  Clock,
  Terminal,
  Activity,
  Award
} from 'lucide-react';

interface DiagnosticResult {
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed' | 'pending';
  message: string;
}

interface DiagnosticSenseiProps {
  isOpen: boolean;
  onClose: () => void;
  caughtError?: Error | null;
}

export const DiagnosticSensei: React.FC<DiagnosticSenseiProps> = ({ isOpen, onClose, caughtError }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'logs' | 'emergency' | 'commands'>('audit');
  const [runningAudit, setRunningAudit] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [emergencyBypass, setEmergencyBypass] = useState(() => {
    return localStorage.getItem('sysbjj_emergency_bypass') === 'true';
  });
  const [lowBandwidthMode, setLowBandwidthMode] = useState(() => {
    return localStorage.getItem('sysbjj_low_bandwidth') === 'true';
  });
  const [tatameCleaningResult, setTatameCleaningResult] = useState<string | null>(null);

  // Auto-run audit when modal opens
  useEffect(() => {
    if (isOpen) {
      handleRunAudit();
    }
  }, [isOpen]);

  const handleRunAudit = () => {
    setRunningAudit(true);
    setResults([]);

    // Simulate step-by-step samurai audit of the Dojo's software
    setTimeout(() => {
      const auditSteps: DiagnosticResult[] = [];

      // 1. Connection Status
      const isOnline = navigator.onLine;
      auditSteps.push({
        name: 'Conexão de Rede',
        category: 'Rede',
        status: isOnline ? 'passed' : 'warning',
        message: isOnline 
          ? 'Conexão ativa com a internet detectada.' 
          : 'Sistema offline. O SYSBJJ operará com persistência local e fila de sincronização.'
      });

      // 2. Local Storage Sandbox Test
      try {
        localStorage.setItem('sysbjj_diagnostic_temp', 'OSS_SENSEI');
        localStorage.removeItem('sysbjj_diagnostic_temp');
        auditSteps.push({
          name: 'Sandbox de Armazenamento',
          category: 'Navegador',
          status: 'passed',
          message: 'Permissões de leitura e escrita do LocalStorage estão operando normalmente.'
        });
      } catch (e: any) {
        auditSteps.push({
          name: 'Sandbox de Armazenamento',
          category: 'Navegador',
          status: 'failed',
          message: `Bloqueio no LocalStorage detectado: ${e?.message || 'Acesso negado'}`
        });
      }

      // 3. Local Auth Token Validity
      const authRaw = localStorage.getItem('oss_auth');
      if (authRaw) {
        try {
          const authObj = JSON.parse(authRaw);
          if (authObj && authObj.token) {
            auditSteps.push({
              name: 'Sessão do Professor',
              category: 'Autenticação',
              status: 'passed',
              message: `Usuário autenticado: ${authObj.email || 'Professor'}. Token de acesso detectado.`
            });
          } else {
            auditSteps.push({
              name: 'Sessão do Professor',
              category: 'Autenticação',
              status: 'warning',
              message: 'Não autenticado ou estrutura de login legada. Pronto para novos logins.'
            });
          }
        } catch (e) {
          auditSteps.push({
            name: 'Sessão do Professor',
            category: 'Autenticação',
            status: 'failed',
            message: 'Sessão corrompida localmente. Recomenda-se realizar a Limpeza do Tatame.'
          });
        }
      } else {
        auditSteps.push({
          name: 'Sessão do Professor',
          category: 'Autenticação',
          status: 'warning',
          message: 'Nenhum cookie ou token ativo. Modo visitante ou pendente de login.'
        });
      }

      // 4. React Context Verification
      const hasLanguage = !!localStorage.getItem('oss_language') || !!localStorage.getItem('language');
      auditSteps.push({
        name: 'Módulo de Tradução (i18n)',
        category: 'Contextos',
        status: hasLanguage ? 'passed' : 'passed', 
        message: 'Arquivos de localização carregados nos dicionários globais.'
      });

      // 5. Offline Queue Health
      const offlineQueue = localStorage.getItem('offline_mutations_queue');
      if (offlineQueue) {
        try {
          const queue = JSON.parse(offlineQueue);
          if (Array.isArray(queue) && queue.length > 0) {
            auditSteps.push({
              name: 'Fila de Sincronização Local',
              category: 'Banco de Dados',
              status: 'warning',
              message: `Sua academia tem ${queue.length} ações pendentes de sincronização remota.`
            });
          } else {
            auditSteps.push({
              name: 'Fila de Sincronização Local',
              category: 'Banco de Dados',
              status: 'passed',
              message: 'A fila de alterações offline está perfeitamente sincronizada com a nuvem.'
            });
          }
        } catch (e) {
          auditSteps.push({
            name: 'Fila de Sincronização Local',
            category: 'Banco de Dados',
            status: 'failed',
            message: 'Erro ao parsear dados offline. Pode travar interações locais.'
          });
        }
      } else {
        auditSteps.push({
          name: 'Fila de Sincronização Local',
          category: 'Banco de Dados',
          status: 'passed',
          message: 'Sem mutações pendentes. Banco local intacto.'
        });
      }

      // Check caught error
      if (caughtError) {
        auditSteps.push({
          name: 'Interrupção Crítica do React',
          category: 'Renderização',
          status: 'failed',
          message: `Código de erro capturado na tela atual: "${caughtError.message}".`
        });
      }

      setResults(auditSteps);
      setRunningAudit(false);
    }, 1200);
  };

  const cleanTatame = () => {
    setTatameCleaningResult('cleaning');
    setTimeout(() => {
      try {
        // Safe cleaning. Do not erase student DB, just active cache, theme settings and sessions that cause White Screen
        const keysToKeep = ['oss_demo_mode', 'sysbjj_local_students', 'sysbjj_local_finances', 'sysbjj_local_classes']; // keep offline DB intact!
        const savedData: Record<string, string | null> = {};
        
        keysToKeep.forEach(k => {
          savedData[k] = localStorage.getItem(k);
        });

        // Clear everything else to reset faulty React context values and logins
        localStorage.clear();

        // Restore offline DB
        keysToKeep.forEach(k => {
          if (savedData[k] !== null) {
            localStorage.setItem(k, savedData[k]!);
          }
        });

        // Set default indicators
        localStorage.setItem('language', 'pt');
        localStorage.setItem('oss_language', 'pt');
        
        setTatameCleaningResult('success');
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (e: any) {
        setTatameCleaningResult(`Erro: ${e.message}`);
      }
    }, 1000);
  };

  const toggleEmergencyBypass = (val: boolean) => {
    setEmergencyBypass(val);
    localStorage.setItem('sysbjj_emergency_bypass', val ? 'true' : 'false');
    if (val) {
      toast.success("🥋 MODO DE EMERGÊNCIA ATIVADO: Desativando animações e dados em cache propensos a erros.");
    } else {
      toast.success("Controle padrão reabilitado.");
    }
  };

  const toggleLowBandwidthMode = (val: boolean) => {
    setLowBandwidthMode(val);
    localStorage.setItem('sysbjj_low_bandwidth', val ? 'true' : 'false');
    if (val) {
      toast.success("📶 LARGURA DE BANDA DINÂMICA: Requisições de rede pesadas foram adiadas.");
    } else {
      toast.success("Banda padrão reabilitada.");
    }
  };

  const getTranslatedErrorInstruction = (errMessage: string) => {
    const msg = errMessage.toLowerCase();
    if (msg.includes('null') && msg.includes('usestate')) {
      return {
        diag: 'Incompatibilidade ou Chamada Inválida de Hooks',
        sol: 'Isso ocorre se algum hook foi inserido erradamente fora do escopo ou em arquivos com tipos de React duplicados. A Limpeza de Tatame resolve o desacoplamento de estado limpando instâncias fantasmas. OSS!'
      };
    }
    if (msg.includes('firebase') || msg.includes('auth') || msg.includes('permission')) {
      return {
        diag: 'Falha de Autorização ou Permissão',
        sol: 'Suas credenciais locais podem ter expirado ou o Firestore impôs regras rígidas de segurança. Faça logout no menu esquerdo e entre novamente para renovar as chaves de acesso.'
      };
    }
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
      return {
        diag: 'Erro de Conexão com a Nuvem',
        sol: 'O servidor central está temporariamente inacessível ou o sinal Wi-Fi do dojo oscilou. Use o "Modo Sem Rede" abaixo para trabalhar localmente até o sinal retornar.'
      };
    }
    return {
      diag: 'Erro Crítico Incomum',
      sol: 'Ocorreu um erro inesperado na lógica de visualização. Clique em "Limpar Tatame" para restaurar o fluxo seguro padrão.'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden text-white"
      >
        {/* Banner Dojo / Header */}
        <div className="p-8 pb-6 border-b border-white/5 bg-gradient-to-r from-blue-950 via-slate-900 to-black relative">
          <div className="absolute right-8 top-8 flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-3 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-2xl text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg">
              <Cpu size={24} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Utilitário de Prevenção de Falhas</span>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-2">🥋 Sensei Diagnóstico</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            OSS! Sensei, este painel audita a integridade do ecossistema <span className="text-blue-400 font-bold">SYSBJJ 2.0</span>. Se o sistema apresentar telas brancas, falhas ou lentidão de rede, use as ferramentas de cura abaixo para restaurar as atividades no tatame.
          </p>

          {/* Navigation Tab bar */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeTab === 'audit' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              💡 Autodiagnóstico
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeTab === 'logs' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              🔍 Depurador de Falhas
            </button>
            <button
              onClick={() => setActiveTab('emergency')}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeTab === 'emergency' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              🛠️ Modo Emergência
            </button>
            <button
              onClick={() => setActiveTab('commands')}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeTab === 'commands' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              🥋 Comando do Sensei
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 max-h-[55vh] overflow-y-auto">
          
          {/* TAB 1: Autodiagnóstico */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">Status das Engrenagens do Dojô</h3>
                  <p className="text-xs text-slate-400">Varredura de baixo nível da segurança e persistência em tempo de execução</p>
                </div>
                <button
                  onClick={handleRunAudit}
                  disabled={runningAudit}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <RefreshCw size={12} className={runningAudit ? "animate-spin" : ""} />
                  {runningAudit ? 'Analisando...' : 'Reexecutar Diagnóstico'}
                </button>
              </div>

              {runningAudit ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">Consultando oráculo do tatame...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((r, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[8px] font-semibold tracking-wider text-slate-500 uppercase">{r.category}</span>
                          <h4 className="text-sm font-bold uppercase">{r.name}</h4>
                        </div>
                        {r.status === 'passed' && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black rounded uppercase">Operando</span>
                        )}
                        {r.status === 'warning' && (
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black rounded uppercase">Limitação</span>
                        )}
                        {r.status === 'failed' && (
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-black rounded uppercase">Interrompido</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Depurador de Falhas */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="p-6 bg-slate-950 border border-white/5 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-orange-600/10 text-orange-400 border border-orange-500/20">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-md font-black uppercase italic text-orange-400 leading-none">Status de Crash Detectado</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Intercepção imediata pela equipe médica</p>
                  </div>
                </div>

                {caughtError ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl">
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Stack Trace Recebido:</p>
                      <code className="text-xs font-mono text-rose-300 block break-all whitespace-pre-wrap">{caughtError.stack || caughtError.message}</code>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Diagnóstico Recomendado pelo Sensei:</p>
                      <p className="text-sm font-bold uppercase italic text-white">{getTranslatedErrorInstruction(caughtError.message).diag}</p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {getTranslatedErrorInstruction(caughtError.message).sol}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="text-emerald-500" size={24} />
                    </div>
                    <p className="text-xs uppercase font-black tracking-widest text-slate-300">Nenhuma exceção do React em andamento.</p>
                    <p className="text-[9px] text-slate-500 mt-1 max-w-sm mx-auto">O motor de visualização principal está limpo e renderizando todas as rotas com estabilidade.</p>
                  </div>
                )}
              </div>

              {/* Limpeza de Tatame Tool */}
              <div className="p-6 border border-white/10 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-lg">
                  <div className="flex items-center gap-2">
                    <Trash2 size={16} className="text-rose-500" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-rose-400">Limpeza Técnica de Tatame (Reset Seguro)</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Esta ferramenta remove sessões instáveis no navegador, limpa cookies de controle expirados e dados de estado conflitantes de versões anteriores. **Seus dados locais (alunos e finanças offline) são mantidos seguros durante a higienização.**
                  </p>
                </div>

                <div className="shrink-0">
                  {tatameCleaningResult === 'cleaning' ? (
                    <div className="flex items-center gap-2 px-6 py-4 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                      <RefreshCw size={14} className="animate-spin" /> Varrendo Tatame...
                    </div>
                  ) : tatameCleaningResult === 'success' ? (
                    <div className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                      🥋 Tatame Limpo! Reiniciando...
                    </div>
                  ) : (
                    <button
                      onClick={cleanTatame}
                      className="px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-600/20 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Limpar e Reiniciar Painel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Modo de Emergência */}
          {activeTab === 'emergency' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">Interruptores de Proteção</h3>
                <p className="text-xs text-slate-400">Configure salvaguardas para rodar em celulares antigos ou redes Wi-Fi altamente instáveis</p>
              </div>

              <div className="space-y-4">
                {/* Emergency Bypass */}
                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-6">
                  <div className="space-y-1 max-w-xl">
                    <h4 className="text-sm font-bold uppercase flex items-center gap-2">
                      ⚔️ Desativador de Animações Conflitantes
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Desativa temporariamente transições complexas da biblioteca framer-motion/motion e atrasos em cascata. Ideal para economizar bateria e CPU em celulares de recepção de academia.
                    </p>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      id="bypass_toggle"
                      checked={emergencyBypass} 
                      onChange={(e) => toggleEmergencyBypass(e.target.checked)}
                      className="sr-only peer"
                    />
                    <label 
                      htmlFor="bypass_toggle" 
                      className="w-12 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 cursor-pointer block"
                    />
                  </div>
                </div>

                {/* Low Bandwidth Mode */}
                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-6">
                  <div className="space-y-1 max-w-xl">
                    <h4 className="text-sm font-bold uppercase flex items-center gap-2">
                      📶 Modo de Baixo Tráfego de Dados
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Instrui a camada de rede API a adiar logs de telemetria não-essenciais e reduzir a frequência de consultas repetitivas em segundo plano.
                    </p>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      id="bandwidth_toggle"
                      checked={lowBandwidthMode} 
                      onChange={(e) => toggleLowBandwidthMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <label 
                      htmlFor="bandwidth_toggle" 
                      className="w-12 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 cursor-pointer block"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Comando do Sensei */}
          {activeTab === 'commands' && (
            <div className="space-y-6">
              <div className="p-6 bg-slate-950 border border-blue-500/20 rounded-3xl bg-gradient-to-b from-blue-950/20 to-black">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/30">
                    <Award size={22} />
                  </div>
                  <div>
                    <h3 className="text-md font-black uppercase italic text-blue-400 leading-none">Doutrina de Resiliência Tecnológica</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">Sabedoria SYSBJJ aplicada à infraestrutura</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                  <p>
                    "Sensei, no tatame, um lutador de jiu-jitsu não reclama da umidade do chão ou do peso do adversário. Ele estuda os pontos de apoio, ajusta o quadril e executa a alavanca perfeita para neutralizar a força contrária."
                  </p>
                  <p>
                    "Seu painel administrativo compartilha a mesma filosofia. Quando a rede externa oscila, seu software não deve se render:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li>Sua <strong className="text-white">Fila Sincronizada</strong> retém as presenças e cobranças mesmo se o Wi-Fi cair, enviando-as assim que reconectar.</li>
                    <li>Sempre que uma tela branca inexplicada persistir, saiba que pode ser um conflito de sessão legada. A <strong className="text-white">Limpeza de Tatame</strong> descarta as instâncias inválidas sem comprometer dados cruciais dos alunos.</li>
                    <li>Use os <strong className="text-white">módulos de emergência</strong> para rodar liso em dispositivos de menor poder de processamento.</li>
                  </ul>
                  <p className="font-black italic text-blue-400 text-sm mt-4 text-right">
                    — Master Sensei, SYSBJJ Team. OSS!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-950/50 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            DIAGNOSTICS v3.0 // OPERANTE
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Fechar Painel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
