import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, X, Clock, Trash2, Check, CheckSquare, Sparkles, 
  DollarSign, Users, Award, Calendar, Cpu, ShieldAlert, 
  Settings, Key, Flame, RefreshCcw, Info
} from 'lucide-react';
import { useData, AppNotification } from '../contexts/DataContext.js';
import { useTranslation } from '../contexts/LanguageContext.js';

const CategoryIcons: Record<string, any> = {
  financeiro: DollarSign,
  alunos: Users,
  graduacoes: Award,
  presenca: Flame,
  sistema: Cpu,
  seguranca: Key,
  agenda: Calendar,
  assinaturas: Sparkles
};

const CategoryLabels: Record<string, string> = {
  financeiro: 'Financeiro',
  alunos: 'Alunos',
  graduacoes: 'Graduações',
  presenca: 'Presença',
  sistema: 'Sistema',
  seguranca: 'Segurança',
  agenda: 'Agenda',
  assinaturas: 'Assinaturas'
};

const CategoryColors: Record<string, { bg: string, text: string, border: string, iconBg: string }> = {
  financeiro: {
    bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10 text-emerald-500'
  },
  alunos: {
    bg: 'bg-blue-500/5 dark:bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/10 text-blue-500'
  },
  graduacoes: {
    bg: 'bg-indigo-500/5 dark:bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/10 text-indigo-500'
  },
  presenca: {
    bg: 'bg-amber-500/5 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/10 text-amber-500'
  },
  sistema: {
    bg: 'bg-slate-500/5 dark:bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
    iconBg: 'bg-slate-500/10 text-slate-500'
  },
  seguranca: {
    bg: 'bg-rose-500/5 dark:bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/10 text-rose-500'
  },
  agenda: {
    bg: 'bg-cyan-500/5 dark:bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/10 text-cyan-500'
  },
  assinaturas: {
    bg: 'bg-purple-500/5 dark:bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/10 text-purple-500'
  }
};

const PriorityStyles = {
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
};

const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    clearNotification, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useData();
  const { t } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClearAll = () => {
    notifications.forEach(n => clearNotification(n.id));
  };

  const getFilteredNotifications = () => {
    let result = [...notifications];
    if (activeTab !== 'all') {
      result = result.filter(n => n.category === activeTab);
    }
    if (filterPriority !== 'all') {
      result = result.filter(n => n.priority === filterPriority);
    }
    // Sort latest first
    return result.sort((a, b) => b.timestamp - a.timestamp);
  };

  const filteredList = getFilteredNotifications();

  return (
    <div className="relative">
      {/* Sino Button */}
      <button 
        id="btn-bell-notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:border-blue-500/30 dark:hover:text-blue-400 transition-all shadow-sm active:scale-95 flex items-center justify-center"
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-swing origin-top" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-600 text-white font-sans text-[10px] font-black rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Panel Panel wrapper */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop cover for mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Main Center Container */}
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.97 }}
              className="absolute right-0 mt-4 w-[22rem] sm:w-[28rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-inner">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Central de Alertas</h3>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono">
                      {unreadCount} pendentes • {notifications.length} registros
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllNotificationsAsRead()}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors tooltip flex items-center gap-1"
                      title="Marcar todas como lidas"
                    >
                      <CheckSquare size={16} />
                      <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Lidas</span>
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Advanced Controls & filters */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/20">
                {/* Scrollable category selection */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                      activeTab === 'all' 
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Ver Todas
                  </button>
                  {Object.keys(CategoryLabels).map((catKey) => {
                    const count = notifications.filter(n => n.category === catKey).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={catKey}
                        onClick={() => setActiveTab(catKey)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${
                          activeTab === catKey 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10' 
                            : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {CategoryLabels[catKey]}
                        <span className="ml-0.5 opacity-80 text-[9px]">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Priority quick toggle */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Nível de Impacto:</span>
                  <div className="flex items-center gap-2">
                    {['all', 'high', 'medium', 'low'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all ${
                          filterPriority === p 
                            ? 'bg-blue-100 text-blue-700 font-extrabold dark:bg-blue-950 dark:text-blue-300' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        {p === 'all' ? 'Tudo' : p === 'high' ? 'Crítico' : p === 'medium' ? 'Médio' : 'Informativo'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* List container */}
              <div className="max-h-[380px] overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-900 custom-scrollbar">
                {filteredList.length > 0 ? (
                  filteredList.map((notif) => {
                    const CatIcon = CategoryIcons[notif.category || 'sistema'] || Info;
                    const catTheme = CategoryColors[notif.category || 'sistema'] || {
                      bg: 'bg-slate-50',
                      text: 'text-slate-600',
                      border: 'border-slate-100',
                      iconBg: 'bg-slate-100 text-slate-500'
                    };

                    return (
                      <motion.div 
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className={`p-4 rounded-3xl border ${notif.read ? 'bg-slate-50/40 dark:bg-slate-850/20 border-slate-100 dark:border-slate-800/80 shadow-inner' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md'} relative overflow-hidden transition-all flex gap-3.5`}
                      >
                        {/* Red unread light bar indicators */}
                        {!notif.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-blue-500 to-indigo-600 rounded-r-lg" />
                        )}

                        {/* Category Left Icon Bar */}
                        <div className={`shrink-0 w-9 h-9 rounded-xl ${catTheme.iconBg} flex items-center justify-center mt-0.5`}>
                          <CatIcon size={16} />
                        </div>

                        {/* Content text section */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${catTheme.bg} ${catTheme.text} border ${catTheme.border}`}>
                              {CategoryLabels[notif.category || 'sistema']}
                            </span>
                            
                            {notif.priority && (
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                notif.priority === 'high' ? PriorityStyles.high :
                                notif.priority === 'medium' ? PriorityStyles.medium :
                                PriorityStyles.low
                              }`}>
                                {notif.priority === 'high' ? 'Crítico' : notif.priority === 'medium' ? 'Importante' : 'Informativo'}
                              </span>
                            )}
                          </div>

                          <p className={`text-xs leading-normal font-sans break-words ${notif.read ? 'text-slate-500 dark:text-slate-400 font-normal' : 'text-slate-900 dark:text-slate-100 font-bold'}`}>
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest font-mono">
                            <Clock size={10} />
                            {new Date(notif.timestamp).toLocaleDateString()} {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>

                        {/* Operational command button list */}
                        <div className="shrink-0 flex flex-col justify-between items-center gap-2">
                          {!notif.read ? (
                            <button 
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="p-1 px-2 text-[9px] font-black text-blue-600 dark:text-blue-400 border border-blue-500/10 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                              title="Marcar como lida"
                            >
                              <Check size={10} />
                            </button>
                          ) : (
                            <div className="p-1 flex items-center justify-center text-slate-400 dark:text-slate-400">
                              <CheckSquare size={12} />
                            </div>
                          )}
                          
                          <button 
                            onClick={() => clearNotification(notif.id)}
                            className="p-1 text-slate-400 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="py-14 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-400">
                      <Bell size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider italic tracking-[0.16em]">Nenhum Alerta Ativo</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-550 italic leading-snug">Limpo no tatame! Oss.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Complete Footer with Clear All actions */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-between bg-slate-50/35">
                  <button 
                    onClick={() => handleClearAll()}
                    className="text-[9px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest hover:underline flex items-center gap-1.5"
                  >
                    <Trash2 size={12} />
                    Limpar Histórico
                  </button>
                  
                  <span className="text-[8px] font-bold text-slate-400 font-mono uppercase">
                    🥋 SYSBJJ Monitor
                  </span>
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
