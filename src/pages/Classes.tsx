
import React, { useState, useMemo } from 'react';
import { Plus, Clock, User, Trash2, Calendar, X, Save, Edit2, LayoutList, ArrowRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ClassSchedule } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

const Classes: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useData();
  const { t } = useTranslation();
  
  const DAYS_OF_WEEK = useMemo(() => [
    t('classes.seg'),
    t('classes.ter'),
    t('classes.qua'),
    t('classes.qui'),
    t('classes.sex'),
    t('classes.sab'),
    t('classes.dom')
  ], [t]);

  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('grid');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ClassSchedule, 'id'>>({
    time: '09:00',
    title: '',
    instructor: '',
    category: t('common.adult'),
    days: [],
    notes: ''
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
    setFormData({ time: '09:00', title: '', instructor: '', category: t('common.adult'), days: [], notes: '' });
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
      days: s.days || [],
      notes: s.notes || ''
    });
    setEditingId(s.id);
    setIsAdding(true);
  };

  const memoizedGrid = useMemo(() => {
    const timeSlots = Array.from(new Set(schedules.map(s => s.time))).sort();
    return timeSlots.map(timeSlot => (
      <React.Fragment key={timeSlot}>
        <div className="p-2 sm:p-4 flex items-center justify-center border-r border-slate-50 dark:border-slate-800/50 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
           <p className="text-xs font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">{timeSlot}</p>
        </div>
        {DAYS_OF_WEEK.map(day => {
          const classForDay = schedules.find(s => s.time === timeSlot && s.days?.includes(day));
          return (
            <div key={day} className="p-1">
              {classForDay ? (
                <div 
                  onClick={() => startEdit(classForDay)}
                  className="h-full p-4 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden min-h-[110px] flex flex-col justify-between"
                >
                   <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Edit2 size={12} className="text-blue-400" />
                   </div>
                   <div>
                     <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter line-clamp-1 mb-1">{classForDay.category}</p>
                     <p className="text-[10px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight line-clamp-2 italic">{classForDay.title}</p>
                   </div>
                   
                   <div className="mt-3 space-y-2">
                     <div className="flex items-center gap-1.5 text-slate-400">
                       <User size={10} />
                       <span className="text-[8px] font-black uppercase tracking-widest truncate">{classForDay.instructor}</span>
                     </div>
                     {classForDay.notes && (
                       <div className="flex items-start gap-1 p-2 bg-white/60 dark:bg-slate-800/50 rounded-xl border border-blue-100/50 dark:border-blue-900/40">
                         <Save size={8} className="text-blue-400 mt-0.5 shrink-0" />
                         <p className="text-[7px] text-slate-500 dark:text-slate-400 font-bold italic line-clamp-2 leading-tight uppercase tracking-tight">{classForDay.notes}</p>
                       </div>
                     )}
                   </div>
                </div>
              ) : (
                <div className="h-full border border-dashed border-slate-100 dark:border-slate-800/10 rounded-2xl min-h-[110px]"></div>
              )}
            </div>
          );
        })}
      </React.Fragment>
    ));
  }, [schedules, DAYS_OF_WEEK]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 px-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div className="animate-in slide-in-from-left duration-700">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none italic">{t('classes.title')}</h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-slate-500 font-bold italic text-[10px] uppercase tracking-[0.2em] opacity-70">{schedules.length} {t('common.classes')}</p>
            </div>
            <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-xl text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}
               >
                 <Calendar size={18} />
               </button>
               <button 
                 onClick={() => setViewMode('cards')}
                 className={`p-2.5 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-900 shadow-xl text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}
               >
                 <LayoutList size={18} />
               </button>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ time: '09:00', title: '', instructor: '', category: t('common.adult'), days: [], notes: '' }); }}
          className="w-full lg:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all font-black text-[10px] uppercase tracking-[0.3em]"
        >
          <Plus size={24} />
          {t('classes.addBtn')}
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-2 md:p-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Calendar size={300} />
             </div>

             {/* Hint for mobile users */}
             <div className="lg:hidden flex items-center justify-center gap-2 mb-8 text-slate-400">
               <ArrowRight size={16} className="animate-bounce" />
               <p className="text-[10px] font-black uppercase tracking-widest">{t('common.swipeToScroll') || 'Deslize horizontalmente para o Grid'}</p>
             </div>
             
             <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 pb-4 relative z-10">
                <div className="grid grid-cols-8 gap-4 min-w-[1200px]">
                   <div className="p-4"></div>
                   {DAYS_OF_WEEK.map(day => (
                     <div key={day} className="p-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] italic">{day}</p>
                     </div>
                   ))}
                   
                   {memoizedGrid}
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schedules.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -mr-20 -mt-20 group-hover:bg-blue-600/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Clock size={32} />
                </div>
                <div>
                  <p className="text-4xl font-black text-slate-900 dark:text-white leading-none tabular-nums tracking-tighter">{s.time}</p>
                  <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest mt-2 border border-blue-100 dark:border-blue-900/40">{s.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(s)} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all"><Edit2 size={20} /></button>
                <button onClick={() => deleteSchedule(s.id)} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all"><Trash2 size={20} /></button>
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 line-clamp-2 italic leading-tight">{s.title}</h3>
            
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <User size={20} className="text-blue-600" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">{t('common.instructor')}</span>
                <span className="text-sm font-black uppercase tracking-tight dark:text-slate-200">{s.instructor || 'Sensei Principal'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {DAYS_OF_WEEK.map(day => (
                <span 
                  key={day} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    s.days?.includes(day) 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 border-dashed dark:border-slate-800 text-slate-300'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>

            {s.notes && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-l-[6px] border-blue-600">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Plano de Aula / Notas</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-3">"{s.notes}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] p-6 sm:p-12 max-w-2xl w-full space-y-10 animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800 my-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                  {editingId ? t('classes.editTitle') : t('classes.newTitle')}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">{t('classes.subtitle')}</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-red-600 transition-all active:scale-95"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} className="text-blue-600" />
                    {t('classes.time')}
                  </label>
                  <input 
                    type="time" 
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none dark:text-white font-black text-xl transition-all shadow-inner"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Filter size={12} className="text-blue-600" />
                    {t('classes.category')}
                  </label>
                  <select 
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none dark:text-white font-black text-sm transition-all appearance-none shadow-inner"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value={t('common.adult')}>{t('common.adult')}</option>
                    <option value={t('common.kid')}>{t('common.kid')}</option>
                    <option value={t('common.female')}>{t('common.female')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Edit2 size={12} className="text-blue-600" />
                  {t('classes.classTitle')}
                </label>
                <input 
                  type="text" 
                  placeholder={t('students.classTitlePlaceholder')}
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none dark:text-white font-black transition-all shadow-inner uppercase tracking-tight"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} className="text-blue-600" />
                  {t('classes.instructor')}
                </label>
                <input 
                  type="text" 
                  placeholder={t('students.instructorPlaceholder')}
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none dark:text-white font-black transition-all shadow-inner uppercase tracking-tight"
                  value={formData.instructor}
                  onChange={e => setFormData({...formData, instructor: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} className="text-blue-600" />
                  {t('classes.days')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                        formData.days.includes(day)
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-2px]'
                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200 shadow-inner'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Save size={12} className="text-blue-600" />
                  {t('common.notes')}
                </label>
                <textarea 
                  placeholder={t('classes.notesPlaceholder') || 'Diretrizes técnicas ou plano de aula...'}
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-3xl outline-none dark:text-white font-bold min-h-[120px] transition-all shadow-inner"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95"
                >
                  {editingId ? t('common.save') : t('classes.saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
