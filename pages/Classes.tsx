
import React, { useState } from 'react';
import { Plus, Clock, User, Trash2, Calendar, X, Save, Edit2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ClassSchedule } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const Classes: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useData();
  const { t } = useTranslation();
  
  const DAYS_OF_WEEK = [
    t('classes.seg'),
    t('classes.ter'),
    t('classes.qua'),
    t('classes.qui'),
    t('classes.sex'),
    t('classes.sab'),
    t('classes.dom')
  ];

  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('grid');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ClassSchedule, 'id'>>({
    time: '09:00',
    title: '',
    instructor: '',
    category: t('common.adult'),
    days: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSchedule(editingId, formData);
      setEditingId(null);
    } else {
      addSchedule(formData);
    }
    setIsAdding(false);
    setFormData({ time: '09:00', title: '', instructor: '', category: t('common.adult'), days: [] });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day]
    }));
  };

  const startEdit = (s: ClassSchedule) => {
    setFormData({
      time: s.time,
      title: s.title,
      instructor: s.instructor,
      category: s.category,
      days: s.days || []
    });
    setEditingId(s.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div className="animate-in slide-in-from-left duration-700">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('classes.title')}</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 font-bold italic text-xs opacity-70">{t('classes.subtitle')}</p>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
               >
                 <Calendar size={14} />
               </button>
               <button 
                 onClick={() => setViewMode('cards')}
                 className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
               >
                 <Edit2 size={14} />
               </button>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ time: '09:00', title: '', instructor: '', category: t('common.adult'), days: [] }); }}
          className="w-full lg:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <Plus size={20} />
          {t('classes.addBtn')}
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl p-1 sm:p-10 relative">
             {/* Hint for mobile users */}
             <div className="lg:hidden flex items-center justify-center gap-2 mb-4 text-slate-400">
               <Calendar size={12} className="animate-bounce" />
               <p className="text-[10px] font-black uppercase tracking-widest">{t('common.swipeToScroll') || 'Deslize para ver mais'}</p>
             </div>
             
             <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 pb-4">
               <div className="grid grid-cols-8 gap-2 min-w-[1000px] sm:min-w-[800px]">
                  <div className="p-4"></div>
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="p-2 sm:p-4 text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</p>
                    </div>
                  ))}
                  
                  {/* Organized by time slots */}
                  {Array.from(new Set(schedules.map(s => s.time))).sort().map(timeSlot => (
                    <React.Fragment key={timeSlot}>
                      <div className="p-2 sm:p-4 flex items-center justify-center border-r border-slate-50 dark:border-slate-800/50 sticky left-0 bg-white dark:bg-slate-900 z-10">
                         <p className="text-xs font-black text-slate-800 dark:text-white tabular-nums">{timeSlot}</p>
                      </div>
                      {DAYS_OF_WEEK.map(day => {
                        const classForDay = schedules.find(s => s.time === timeSlot && s.days?.includes(day));
                        return (
                          <div key={day} className="p-1">
                            {classForDay ? (
                              <div 
                                onClick={() => startEdit(classForDay)}
                                className="h-full p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 rounded-[1.2rem] hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden min-h-[80px]"
                              >
                                 <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Edit2 size={10} className="text-blue-400" />
                                 </div>
                                 <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter line-clamp-1 mb-1">{classForDay.category}</p>
                                 <p className="text-[10px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight line-clamp-2">{classForDay.title}</p>
                                 <div className="mt-2 flex items-center gap-1.5 text-slate-400">
                                   <User size={8} />
                                   <span className="text-[7px] font-black uppercase tracking-widest truncate">{classForDay.instructor}</span>
                                 </div>
                              </div>
                            ) : (
                              <div className="h-full border border-dashed border-slate-100 dark:border-slate-800/50 rounded-[1.2rem] min-h-[80px]"></div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
               </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none tabular-nums">{s.time}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.category}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(s)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => deleteSchedule(s.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">{s.title}</h3>
            
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-6">
              <User size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">{s.instructor || t('common.instructor')}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <span 
                  key={day} 
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    s.days?.includes(day) 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 max-w-xl w-full space-y-8 animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {editingId ? t('classes.editTitle') : t('classes.newTitle')}
              </h2>
              <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-red-600 outline-none"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('classes.time')}</label>
                  <input 
                    type="time" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('classes.category')}</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value={t('common.adult')}>{t('common.adult')}</option>
                    <option value={t('common.kid')}>{t('common.kid')}</option>
                    <option value={t('common.female')}>{t('common.female')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('classes.classTitle')}</label>
                <input 
                  type="text" 
                  placeholder={t('students.classTitlePlaceholder')}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('classes.instructor')}</label>
                <input 
                  type="text" 
                  placeholder={t('students.instructorPlaceholder')}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                  value={formData.instructor}
                  onChange={e => setFormData({...formData, instructor: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('classes.days')}</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.days.includes(day)
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-blue-700 transition-all">
                {editingId ? t('common.save').toUpperCase() : t('classes.saveBtn').toUpperCase()}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
