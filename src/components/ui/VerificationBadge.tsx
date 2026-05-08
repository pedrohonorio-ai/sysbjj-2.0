
import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface VerificationBadgeProps {
  status: 'verified' | 'verifying' | 'unverified';
  timestamp?: number;
  hash?: string;
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, timestamp, hash, className = '' }) => {
  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
        status === 'verified' 
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
          : status === 'verifying'
            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          status === 'verified' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
          status === 'verifying' ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'
        }`} />
        {status === 'verifying' && <RefreshCw size={10} className="animate-spin mr-1" />}
        {status === 'verified' ? 'Imutabilidade Coerente' : status === 'verifying' ? 'Validando Bloco...' : 'Audit pendente'}
      </div>
      {hash && (
        <div className="mt-1 px-2">
          <p className="text-[7px] font-mono text-slate-400 dark:text-slate-500 truncate w-24">
            HASH: {hash}
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationBadge;
