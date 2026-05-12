
import React from 'react';
import { AlertTriangle, ExternalLink, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';

const DatabaseWarning: React.FC = () => {
  const { dbStatus, setDemoMode } = useData();
  const [testStatus, setTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = React.useState<string | null>(null);

  const runTest = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch('/api/test-db');
      const data = await res.json();
      if (res.ok && data.status === 'connected') {
        setTestStatus('success');
        setTestMessage(data.message);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setTestStatus('error');
        setTestMessage(data.message || data.error || "Erro desconhecido");
      }
    } catch (e) {
      setTestStatus('error');
      setTestMessage("Erro ao tentar conectar com a API de diagnóstico.");
    }
  };

  if (dbStatus.connected && !dbStatus.isDemoMode) return null;

  return (
    <AnimatePresence>
      {( (!dbStatus.connected || dbStatus.isDemoMode) ) && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[100] p-4 lg:p-6"
        >
          <div className={`max-w-4xl mx-auto rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group border-2 ${
            dbStatus.isDemoMode 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <AlertTriangle size={120} className={dbStatus.isDemoMode ? 'text-blue-500' : 'text-amber-500'} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                dbStatus.isDemoMode ? 'bg-blue-500' : 'bg-amber-500'
              }`}>
                <AlertTriangle size={32} />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className={`text-xl font-black uppercase tracking-tighter leading-tight ${
                    dbStatus.isDemoMode ? 'text-blue-900 dark:text-blue-100' : 'text-amber-900 dark:text-amber-100'
                  }`}>
                    {dbStatus.isDemoMode ? 'MODO DEMONSTRAÇÃO ATIVADO' : 'OSS SENSEI! Erro Crítico de Conexão'}
                  </h2>
                  <p className={`text-sm font-bold mt-1 ${
                    dbStatus.isDemoMode ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {dbStatus.isDemoMode 
                      ? "O sistema está operando apenas com dados locais (LocalStorage). As alterações NÃO serão enviadas para o Supabase." 
                      : (dbStatus.error || "A conexão com o banco de dados falhou.")
                    }
                  </p>
                </div>

                {!dbStatus.isDemoMode && dbStatus.troubleshooting && dbStatus.troubleshooting.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-2">
                      <HelpCircle size={12} /> Guia de Sobrevivência (Troubleshooting):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dbStatus.troubleshooting.map((step, i) => (
                        <div key={i} className="bg-white/50 dark:bg-amber-900/40 p-3 rounded-xl border border-amber-200 dark:border-amber-700/50 text-[11px] font-bold text-amber-800 dark:text-amber-200 flex gap-3">
                          <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0 text-[10px]">{i + 1}</span>
                          {step}
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-amber-100 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-300 dark:border-amber-800/50">
                      <p className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 mb-2">Dica Pro: Sua senha tem @ ou #?</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        Se a sua senha no Supabase tiver caracteres especiais, o Prisma pode se perder. Use a codificação abaixo:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <code className="px-2 py-1 bg-white/50 dark:bg-black/30 rounded text-[10px] font-mono">@ → %40</code>
                        <code className="px-2 py-1 bg-white/50 dark:bg-black/30 rounded text-[10px] font-mono"># → %23</code>
                        <code className="px-2 py-1 bg-white/50 dark:bg-black/30 rounded text-[10px] font-mono">: → %3A</code>
                        <code className="px-2 py-1 bg-white/50 dark:bg-black/30 rounded text-[10px] font-mono">! → %21</code>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap gap-4 items-center">
                  {!dbStatus.isDemoMode ? (
                    <>
                      <button 
                        onClick={runTest}
                        disabled={testStatus === 'testing'}
                        className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                          testStatus === 'testing' ? 'bg-amber-400 opacity-50 cursor-not-allowed' : 
                          testStatus === 'success' ? 'bg-green-500 text-white' :
                          testStatus === 'error' ? 'bg-red-500 text-white' :
                          'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {testStatus === 'testing' ? 'Testando...' : 
                         testStatus === 'success' ? 'Conectado!' :
                         testStatus === 'error' ? 'Falhou. Tente novamente' :
                         'Testar Conexão Agora'}
                      </button>

                      <button 
                        onClick={() => setDemoMode(true)}
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 text-amber-900 dark:text-amber-100 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 border border-amber-500/30"
                      >
                        Modo Demo (Offline)
                      </button>
                      
                      {testMessage && (
                        <motion.p 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`text-[10px] font-black uppercase tracking-tight flex-1 ${
                            testStatus === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {testMessage}
                        </motion.p>
                      )}
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        setDemoMode(false);
                        window.location.reload();
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                      Restaurar Conexão Cloud
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DatabaseWarning;
