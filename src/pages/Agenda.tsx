import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, User, Plus, X, Save, Edit2, 
  Trash2, Filter, Grid, LayoutList, ChevronRight, Award, 
  MapPin, ShieldAlert, Sparkles, CheckCircle2 
} from 'lucide-react';
import { useData } from '../contexts/DataContext.js';
import { useTranslation } from '../contexts/LanguageContext.js';
import { ClassSchedule } from '../types.js';

const Agenda: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useData();
  const { t } = useTranslation();

  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<ClassSchedule, 'id'>>({
    time: '19:00',
    title: '',
    instructor: '',
    category: 'Adultos',
    days: [],
    notes: ''
  });

  const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const CATEGORIES = ['Adultos', 'Kids', 'No-Gi', 'Iniciantes', 'Avançado'];

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchDay = filterDay === 'all' || s.days.some(d => d.toLowerCase().includes(filterDay.toLowerCase()));
      const matchCategory = filterCategory === 'all' || s.category === filterCategory || (filterCategory === 'Kids' && s.category === 'Kids');
      return matchDay && matchCategory;
    });
  }, [schedules, filterDay, filterCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSchedule(editingId, formData);
      setEditingId(null);
    } else {
      addSchedule(formData);
    }
    setIsAdding(false);
    setFormData({
      time: '19:00',
      title: '',
      instructor: '',
      category: 'Adultos',
      days: [],
      notes: ''
    });
  };

  const handleDayToggle = (day: string) => {
    const current = formData.days;
    if (current.includes(day)) {
      setFormData({ ...formData, days: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, days: [...current, day] });
    }
  };

  return (
    <div className="space-y-8 pb-20 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Grade de <span className="text-blue-600">Agenda</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4 italic flex items-center gap-2">
            <Calendar size={13} className="text-blue-500" />
            Cronograma e Horários de Aulas Semanais (Do dojo ao tatame)
          </p>
        </div>

        <button 
          onClick={() => {
            setEditingId(null);
            setIsAdding(true);
          }}
          className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={14} /> Adicionar Horário
        </button>
      </header>

      {/* Filter and Overview block */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filtrar grade:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <select 
            value={filterDay}
            onChange={e => setFilterDay(e.target.value)}
            className="bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-wider p-2 rounded-xl outline-none text-slate-700 dark:text-white border border-slate-200/40"
          >
            <option value="all">Todos os Dias</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-wider p-2 rounded-xl outline-none text-slate-700 dark:text-white border border-slate-200/40"
          >
            <option value="all">Todas Categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Adding / Editing Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-3xl p-6 max-w-md w-full space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
                  <Calendar size={16} className="text-blue-600" />
                  {editingId ? 'Editar Horário de Aula' : 'Nova Aula na Agenda'}
                </h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-red-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Horário de Início</label>
                    <input 
                      type="time" 
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] text-slate-900 dark:text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Categoria ou Faixa</label>
                    <input 
                      type="text" 
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] text-slate-900 dark:text-white outline-none"
                      placeholder="Ex: No-Gi ou Infantil"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Título do Treino</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] text-slate-900 dark:text-white outline-none"
                    placeholder="Ex: Fundamentos de Guarda Fechada"
                    required
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Professor Responsável</label>
                  <input 
                    type="text" 
                    value={formData.instructor}
                    onChange={e => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] text-slate-900 dark:text-white outline-none"
                    placeholder="Ex: Sensei Master"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Dias de Treino</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {DAYS.map(day => {
                      const dayMin = day.substring(0, 3);
                      const isSelected = formData.days.includes(dayMin);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(dayMin)}
                          className={`text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-800'
                          }`}
                        >
                          {dayMin}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Notas Pedagógicas</label>
                  <input 
                    type="text" 
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Salvar Horário OSS
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid view of week calendars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS.map(dayOfWeek => {
          const dayMin = dayOfWeek.substring(0, 3);
          const dayClasses = filteredSchedules.filter(s => s.days.includes(dayMin));

          return (
            <div key={dayOfWeek} className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">{dayOfWeek}</span>
                <span className="text-[8.5px] font-mono text-slate-400 uppercase font-black">{dayClasses.length} treinos</span>
              </div>

              <div className="space-y-3">
                {dayClasses.length === 0 ? (
                  <p className="text-[9px] text-slate-400 uppercase italic py-4">Sem treino programado.</p>
                ) : (
                  dayClasses.map(s => (
                    <div key={s.id} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200/40 dark:border-white/10 rounded-xl relative group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-blue-500" />
                          <span className="text-[10px] font-mono font-black text-slate-900 dark:text-white tabular-nums">{s.time}</span>
                        </div>
                        <span className={`text-[7px] px-1.5 py-0.5 rounded font-black uppercase ${
                          s.category === 'Kids' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-blue-600/10 text-blue-600'
                        }`}>
                          {s.category || 'Adultos'}
                        </span>
                      </div>

                      <h4 className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-tight mt-1.5">{s.title}</h4>
                      {s.instructor && (
                        <p className="text-[8px] text-slate-400 uppercase font-black mt-1 flex items-center gap-1">
                          <User size={9} /> Resp: {s.instructor}
                        </p>
                      )}

                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button 
                          onClick={() => {
                            setFormData(s);
                            setEditingId(s.id);
                            setIsAdding(true);
                          }}
                          className="p-1 bg-white hover:bg-slate-105 rounded text-slate-600 dark:bg-slate-800 border border-slate-200/40 cursor-pointer"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Excluir horário ${s.time}?`)) {
                              deleteSchedule(s.id);
                            }
                          }}
                          className="p-1 bg-white hover:bg-red-50 text-red-600 rounded dark:bg-slate-800 border border-slate-200/40 cursor-pointer"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Agenda;
