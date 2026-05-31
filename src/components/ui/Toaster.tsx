import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../../utils/toast.js';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  return (
    <div 
      id="sysbjj-global-toaster"
      className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-[99999] flex flex-col gap-3 w-[90%] max-w-sm pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              t.type === 'success' 
                ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-100' 
                : t.type === 'error' 
                ? 'bg-red-950/95 border-red-500/30 text-red-100' 
                : 'bg-blue-950/95 border-blue-500/30 text-blue-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle size={18} className="text-emerald-400" />}
              {t.type === 'error' && <AlertTriangle size={18} className="text-red-400" />}
              {t.type === 'info' && <Info size={18} className="text-blue-400" />}
            </div>
            
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider leading-relaxed">
                {t.type === 'success' ? 'Sucesso' : t.type === 'error' ? 'Atenção' : 'Aviso'}
              </p>
              <p className="text-[11px] font-bold mt-1 text-white/95 leading-normal">
                {t.message}
              </p>
            </div>

            <button 
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-95"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
