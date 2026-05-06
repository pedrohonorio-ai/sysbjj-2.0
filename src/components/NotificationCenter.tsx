
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTranslation } from '../contexts/LanguageContext';

const NotificationCenter: React.FC = () => {
  const { notifications, clearNotification } = useData();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';
      case 'warning': return 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400';
      default: return 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Notificações</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <motion.div 
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-4 rounded-2xl border-l-4 flex gap-4 ${getTypeStyles(notif.type)} shadow-sm`}
                    >
                      <div className="shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-bold leading-relaxed">{notif.message}</p>
                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest opacity-60">
                          <Clock size={10} />
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button 
                        onClick={() => clearNotification(notif.id)}
                        className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Bell size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-[0.2em]">Tudo limpo por aqui</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button 
                    onClick={() => notifications.forEach(n => clearNotification(n.id))}
                    className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Limpar Tudo
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
