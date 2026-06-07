import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, User, Plus, X, Save, Edit2, 
  Trash2, Filter, Grid, LayoutList, ChevronRight, Award, 
  MapPin, ShieldAlert, Sparkles, CheckCircle2, Copy, Users 
} from 'lucide-react';
import { useData } from '../contexts/DataContext.js';
import { useTranslation } from '../contexts/LanguageContext.js';
import { ClassSchedule } from '../types.js';

const Agenda: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, students } = useData();
  const { t } = useTranslation();

  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showSuccessToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const dayIndexMap: { [key: string]: number } = { 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sáb': 6, 'Dom': 0 };
  const todayIndex = new Date().getDay(); // 0=Dom, 1=Seg, 2=Ter, ..., 6=Sáb

  const dayFullNameMap: { [key: string]: string } = {
    'Seg': 'Segunda-feira',
    'Ter': 'Terça-feira',
    'Qua': 'Quarta-feira',
    'Qui': 'Quinta-feira',
    'Sex': 'Sexta-feira',
    'Sáb': 'Sábado',
    'Dom': 'Domingo'
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchDay = filterDay === 'all' || s.days.some(d => d.toLowerCase().includes(filterDay.toLowerCase()));
      const matchCategory = filterCategory === 'all' || s.category === filterCategory || (filterCategory === 'Kids' && s.category === 'Kids');
      return matchDay && matchCategory;
    });
  }, [schedules, filterDay, filterCategory]);

  // Lista Cronológica ordenada por hora
  const allSchedulesSorted = useMemo(() => {
    return filteredSchedules
      .flatMap(s => s.days.map(d => ({ ...s, dayLabel: d })))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredSchedules]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSchedule(editingId, formData);
      showSuccessToast('Horário de aula atualizado com sucesso! OSS.');
      setEditingId(null);
    } else {
      addSchedule(formData);
      showSuccessToast('Novo horário de aula adicionado com sucesso! OSS.');
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

      {/* Success Alert/Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xl shadow-emerald-600/20 font-black text-[10px] uppercase tracking-widest border border-emerald-500/10"
          >
            <CheckCircle2 size={15} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Overview block */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-wrap gap-4 items-center">
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

        <div className="md:ml-auto flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            <Grid size={11} /> Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            <LayoutList size={11} /> Lista
          </button>
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

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-xl text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24">Hora</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-36">Dia</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Treino / Classe</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Professor</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Alunos</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {allSchedulesSorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic text-[10px] uppercase font-bold tracking-widest">
                      Nenhuma aula cadastrada nesta filtragem. OSS!
                    </td>
                  </tr>
                ) : (
                  allSchedulesSorted.map((s, idx) => {
                    const classStudentsCount = students?.filter(st => st.classId === s.id).length || 0;
                    const isToday = dayIndexMap[s.dayLabel] === todayIndex;
                    return (
                      <tr key={`${s.id}-${s.dayLabel}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-800 dark:text-slate-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-blue-500" />
                            <span className="text-[11px] font-mono font-black text-slate-900 dark:text-white tabular-nums">{s.time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                              isToday 
                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                            }`}>
                              {dayFullNameMap[s.dayLabel] || s.dayLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-tight">{s.title}</span>
                              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[6.5px] font-black uppercase tracking-widest rounded leading-none shrink-0 border border-blue-500/10">
                                {s.category || 'Adultos'}
                              </span>
                            </div>
                            {s.notes && <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Obs: {s.notes}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                          {s.instructor || '--'}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-[10px] font-black tracking-tight font-mono">
                          {classStudentsCount} {classStudentsCount === 1 ? 'aluno' : 'alunos'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button 
                              onClick={() => {
                                const { id, ...rest } = s;
                                addSchedule(rest);
                                showSuccessToast('Horário duplicado com sucesso! OSS.');
                              }}
                              className="p-1.5 bg-slate-50 dark:bg-white/5 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-lg border border-slate-205 dark:border-white/10 cursor-pointer"
                              title="Duplicar"
                            >
                              <Copy size={11} />
                            </button>
                            <button 
                              onClick={() => {
                                setFormData(s);
                                setEditingId(s.id);
                                setIsAdding(true);
                              }}
                              className="p-1.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-205 dark:border-white/10 cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Excluir horário ${s.time}?`)) {
                                  deleteSchedule(s.id);
                                  showSuccessToast('Horário excluído com sucesso! OSS.');
                                }
                              }}
                              className="p-1.5 bg-slate-50 dark:bg-white/5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg border border-slate-205 dark:border-white/10 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid view of week calendars */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAYS.map(dayOfWeek => {
            const dayMin = dayOfWeek.substring(0, 3);
            const dayClasses = filteredSchedules.filter(s => s.days.includes(dayMin));
            const isToday = dayIndexMap[dayMin] === todayIndex;

            return (
              <div key={dayOfWeek} className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">{dayOfWeek}</span>
                    {isToday && (
                      <span className="bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase leading-none shadow-sm shadow-emerald-600/30">Hoje</span>
                    )}
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-400 uppercase font-black">{dayClasses.length} treinos</span>
                </div>

                <div className="space-y-3">
                  {dayClasses.length === 0 ? (
                    <p className="text-[9px] text-slate-400 uppercase italic py-4">Sem treino programado.</p>
                  ) : (
                    dayClasses.map(s => {
                      const classStudentsCount = students?.filter(st => st.classId === s.id).length || 0;
                      return (
                        <div key={s.id} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200/40 dark:border-white/10 rounded-xl relative group text-left">
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
                          
                          <p className="text-[8px] text-blue-550 dark:text-blue-450 uppercase font-black mt-0.5 flex items-center gap-1">
                            <Users size={9} /> {classStudentsCount} {classStudentsCount === 1 ? 'aluno' : 'alunos'}
                          </p>

                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button 
                              onClick={() => {
                                const { id, ...rest } = s;
                                addSchedule(rest);
                                showSuccessToast('Horário duplicado com sucesso! OSS.');
                              }}
                              className="p-1 bg-white hover:bg-blue-50 text-blue-600 rounded dark:bg-slate-800 border border-slate-200/40 cursor-pointer"
                              title="Duplicar"
                            >
                              <Copy size={10} />
                            </button>
                            <button 
                              onClick={() => {
                                setFormData(s);
                                setEditingId(s.id);
                                setIsAdding(true);
                              }}
                              className="p-1 bg-white hover:bg-slate-105 rounded text-slate-600 dark:bg-slate-800 border border-slate-200/40 cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={10} />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Excluir horário ${s.time}?`)) {
                                  deleteSchedule(s.id);
                                  showSuccessToast('Horário excluído com sucesso! OSS.');
                                }
                              }}
                              className="p-1 bg-white hover:bg-red-50 text-red-600 rounded dark:bg-slate-800 border border-slate-200/40 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Agenda;
