
import React, { useState, useMemo } from 'react';
import { 
  Baby, 
  Star, 
  ThumbsUp, 
  Search, 
  Medal, 
  ShoppingBag,
  TrendingUp,
  Zap,
  Target
} from 'lucide-react';
import { Reward, StudentStatus } from '../types';
import { BELT_COLORS } from '../constants';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

const REWARDS: Reward[] = [
  { id: 'r1', name: 'Sticker Pack', cost: 200, icon: '🎨', category: 'Arts' },
  { id: 'r2', name: 'Honor Medal', cost: 500, icon: '🥇', category: 'Achievement' },
  { id: 'r3', name: 'Oss Warrior Patch', cost: 350, icon: '🥋', category: 'Kimono' },
];

const KidsSystem: React.FC = () => {
  const { t } = useTranslation();
  const { students, updateStudent } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const kids = useMemo(() => {
    return students.filter(s => s.isKid);
  }, [students]);

  const filteredKids = useMemo(() => {
    return kids.filter(k => 
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      k.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, kids]);

  const handleAwardPoints = (id: string, currentPoints: number = 0) => {
    updateStudent(id, { rewardPoints: currentPoints + 50 });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-yellow-400 rounded-[2rem] text-slate-900 shadow-xl shadow-yellow-500/20 rotate-6 flex items-center justify-center">
            <Baby size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('common.kids')}</h1>
            <p className="text-slate-500 font-medium italic mt-1 tracking-tight">{t('kids.meritSystem')}</p>
          </div>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder={t('common.search')} 
            className="pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full focus:ring-2 focus:ring-yellow-400 outline-none transition-all shadow-sm dark:text-white font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-2">
            <Star size={16} className="text-yellow-500 fill-yellow-500" /> {filteredKids.length} {t('kids.activeWarriors')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredKids.map(kid => (
              <div key={kid.id} className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex justify-between items-start mb-8 relative">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center font-black text-2xl text-yellow-600 border border-yellow-100 dark:border-yellow-900/30 shadow-inner group-hover:rotate-12 transition-transform">
                      {kid.name[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-900 dark:text-white leading-none uppercase tracking-tighter">{kid.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{kid.nickname ? `"${kid.nickname}"` : 'OSS!'}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md ${BELT_COLORS[kid.belt] || 'bg-slate-100'}`}>
                    {t(`belts.${kid.belt}`)}
                  </span>
                </div>

                <div className="space-y-6 relative">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">{t('kids.behavior')}</span>
                      <span className="text-green-600 dark:text-green-400">{kid.behaviorScore || 0}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                      <div className="h-full bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.4)] transition-all duration-1000" style={{ width: `${kid.behaviorScore || 0}%` }} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl text-center group-hover:scale-105 transition-transform">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('kids.mats')}</p>
                        <p className="text-xl font-black text-blue-600">{kid.attendanceCount}</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl text-center group-hover:scale-105 transition-transform">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('kids.streak')}</p>
                        <p className="text-xl font-black text-red-600">{kid.currentStreak || 0}</p>
                     </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-yellow-600 shadow-inner group-hover:rotate-12 transition-transform">
                      <Medal size={20} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-lg font-black dark:text-white tracking-tighter leading-none tabular-nums">{kid.rewardPoints || 0}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{t('kids.ossPoints')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAwardPoints(kid.id, kid.rewardPoints)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 hover:-rotate-3 transition-all active:scale-95 shadow-xl"
                  >
                    <ThumbsUp size={14} /> {t('kids.award').toUpperCase()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400 rounded-full blur-[100px] opacity-10" />
            <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4 relative mb-10">
              <ShoppingBag className="text-yellow-400" size={32} /> {t('kids.store')}
            </h3>
            <div className="space-y-5 relative">
              {REWARDS.map(reward => (
                <div key={reward.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group hover:translate-x-1">
                  <div className="flex items-center gap-5">
                    <div className="text-3xl group-hover:scale-125 transition-transform">{reward.icon}</div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{reward.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{reward.category}</p>
                    </div>
                  </div>
                  <span className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-xl text-[11px] font-black shadow-lg group-hover:rotate-12 transition-transform tabular-nums">
                    {reward.cost}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-12 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 transition-all border border-white/5 flex items-center justify-center gap-2">
              {t('kids.catalog').toUpperCase()} <Zap size={14} />
            </button>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
             <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 mb-8">
               <TrendingUp size={24} className="text-green-500" /> {t('kids.ranking')}
             </h4>
             <div className="space-y-6">
                {filteredKids.sort((a, b) => (b.rewardPoints || 0) - (a.rewardPoints || 0)).slice(0, 3).map((kid, idx) => (
                  <div key={kid.id} className="flex items-center gap-5 group">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all group-hover:rotate-12 ${
                       idx === 0 ? 'bg-amber-400 text-slate-900' : 
                       idx === 1 ? 'bg-slate-200 text-slate-600' :
                       'bg-orange-200 text-orange-800'
                     }`}>
                        {idx + 1}
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-black dark:text-white uppercase tracking-tight leading-none mb-1.5">{kid.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500" style={{ width: `${Math.min(100, (kid.rewardPoints || 0) / 20)}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-green-600 uppercase">+{Math.floor(Math.random()*15 + 5)}%</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-10 py-5 bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:text-blue-600 transition-colors">
               {t('kids.viewFullRanking').toUpperCase()}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsSystem;
