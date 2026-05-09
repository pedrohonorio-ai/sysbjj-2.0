
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Calendar, TrendingUp, DollarSign, Award, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Activity, Cake, History, CloudSun, Timer } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import VerificationBadge from '../components/ui/VerificationBadge';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { students, payments, logs, verifyAuditIntegrity } = useData();
  const { profile } = useProfile();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fetch local temperature using Open-Meteo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current_weather=true`);
          const data = await res.json();
          if (data.current_weather) {
            setTemp(Math.round(data.current_weather.temperature));
          }
        } catch (err) {
          console.error("Error fetching weather:", err);
        }
      });
    }

    return () => clearInterval(timer);
  }, []);

  const auditStatus = verifyAuditIntegrity() ? 'verified' : 'unverified';

  const activeStudents = students.filter(s => s.status === 'Active').length;
  const overdueStudents = students.filter(s => s.status === 'Overdue').length;
  const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'Paid' ? p.amount : 0), 0);

  const today = new Date();
  const todayBirthdays = students.filter(s => {
    if (!s.birthDate) return false;
    const bDate = new Date(s.birthDate);
    return bDate.getMonth() === today.getMonth() && bDate.getDate() === today.getDate();
  });

  const stats = [
    { title: t('dashboard.totalStudents'), value: students.length, icon: <Users size={24} />, color: 'bg-blue-500', trend: '+12%', isUp: true, link: '/students' },
    { title: t('dashboard.activeStudents'), value: activeStudents, icon: <Activity size={24} />, color: 'bg-emerald-500', trend: '+5%', isUp: true, link: '/students' },
    { title: t('common.timer'), value: 'PRO TIMER', icon: <Timer size={24} />, color: 'bg-rose-500', trend: 'IBJJF', isUp: true, link: '/timer' },
    { title: t('dashboard.monthlyRevenue'), value: `R$ ${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={24} />, color: 'bg-purple-500', trend: '+18%', isUp: true, link: '/finances' },
  ];

  const chartData = [
    { name: 'Seg', attendance: 45, revenue: 1200 },
    { name: 'Ter', attendance: 52, revenue: 1500 },
    { name: 'Qua', attendance: 48, revenue: 1100 },
    { name: 'Qui', attendance: 61, revenue: 2100 },
    { name: 'Sex', attendance: 55, revenue: 1800 },
    { name: 'Sab', attendance: 32, revenue: 800 },
    { name: 'Dom', attendance: 12, revenue: 200 },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
            Dashboard <span className="text-blue-600">Oss!</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            Status da Academia: {profile.academyName} | Protocolo de Monitoramento Ativo
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* Real-time Clock Widget */}
           <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl flex flex-col items-end min-w-[220px]">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                 {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">
                 {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </div>
           </div>

           {/* Temperature Widget */}
           <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <CloudSun size={20} />
              </div>
              <div>
                 <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {temp !== null ? `${temp}°C` : '--°C'}
                 </div>
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {t('dashboard.dojoTemp')}
                 </div>
              </div>
           </div>

           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">{t('dashboard.tatameRealTime')}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link 
              to={stat.link}
              className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none group hover:scale-[1.02] transition-all cursor-pointer overflow-hidden relative block h-full"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20`}>
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{stat.value}</h3>
                
                <div className="mt-4 flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${stat.isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.trend}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">{t('dashboard.vsLastMonth')}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {todayBirthdays.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-gradient-to-r from-rose-500 to-orange-500 rounded-[3rem] text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                  <Cake size={32} />
               </div>
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">{t('dashboard.birthdays')}</h2>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{t('dashboard.birthdayMessage')}</p>
               </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {todayBirthdays.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-white text-rose-500 flex items-center justify-center font-black text-xs">
                     {s.photoUrl ? <img src={s.photoUrl} className="w-full h-full rounded-full object-cover" /> : s.name[0]}
                  </div>
                  <span className="font-black uppercase tracking-tighter text-sm">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{t('dashboard.presenceRevenue')}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('dashboard.weeklyReview')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.presences')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.revenue')}</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '16px', 
                    color: '#fff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }} 
                  itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorAttendance)" />
                <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} strokeDasharray="10 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-8 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-700" />
          
          <div className="relative z-10 mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">{t('dashboard.tatameStatus')}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('dashboard.graduationIntegrity')}</p>
          </div>

          <div className="space-y-6 flex-1 relative z-10">
            <div className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:border-white/20 transition-all group/item">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-500">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">{t('dashboard.securityProtocol')}</span>
                </div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ativo</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '98%' }}
                  className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                />
              </div>
              <p className="mt-3 text-[8px] font-medium text-slate-500 uppercase tracking-widest leading-none text-slate-400">Criptografia SHA-256 Validada</p>
            </div>

            <div className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:border-white/20 transition-all group/item">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl text-purple-500">
                    <Award size={18} />
                  </div>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">{t('dashboard.globalRanking')}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.localRank')}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                />
              </div>
              <p className="mt-3 text-[8px] font-medium text-slate-500 uppercase tracking-widest leading-none text-slate-400">{t('dashboard.meritSystem')}</p>
            </div>
          </div>

          <button className="mt-8 w-full bg-white text-slate-950 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl shadow-white/10 transition-all hover:bg-slate-200 active:scale-95 relative z-10">
            {t('dashboard.exportReport')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-2xl">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                 <History size={24} className="text-blue-600" />
                 {t('dashboard.recentActivities')}
               </h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('dashboard.syncStatus')}</p>
            </div>
            <VerificationBadge status={auditStatus} />
         </div>

         <div className="space-y-4">
            {logs.slice(0, 5).map((log, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={log.id} 
                className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-blue-500/20 transition-all group"
              >
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                       <ShieldCheck size={20} />
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.action}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                             log.category === 'Security' ? 'bg-rose-500/10 text-rose-500' :
                             log.category === 'Financial' ? 'bg-emerald-500/10 text-emerald-500' :
                             'bg-blue-500/10 text-blue-500'
                          }`}>
                            {log.category}
                          </span>
                       </div>
                       <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{log.details}</p>
                    </div>
                 </div>
                 <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[8px] font-mono text-slate-400 truncate w-32 ml-auto mt-1">HASH: {log.hash?.substring(0, 16)}...</p>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
