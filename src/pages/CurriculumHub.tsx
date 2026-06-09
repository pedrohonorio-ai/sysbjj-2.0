import React, { useState, useMemo } from 'react';
import { 
  Plus, Clock, User, Trash2, Calendar, X, Save, Edit2, 
  LayoutList, ArrowRight, Filter, Book, BookOpen, 
  Target, Flame, Zap, PlayCircle, Star, ChevronRight, Search,
  PlusCircle, BookOpenCheck, LayoutGrid, Layers, ArrowLeft, CheckCircle2,
  Users, Award, TrendingUp, Sparkles, LogOut, CheckSquare, Square
} from 'lucide-react';
import { useData } from '../contexts/DataContext.js';
import { ClassSchedule, BeltColor } from '../types.js';
import { useTranslation } from '../contexts/LanguageContext.js';
import { motion, AnimatePresence } from 'motion/react';

// Static defaults to pre-populate if techniques is empty
const BIBLIOTECA_TECNICAS_DEFAULT = [
  { id: 't1', name: 'Baiana (Double Leg)', category: 'Quedas', level: 'Branca', description: 'Queda clássica por trás dos joelhos atacando quadril.' },
  { id: 't2', name: 'Passagem Abraçando a Cabeça', category: 'Passagem', level: 'Branca', description: 'Passagem por pressão controlando coluna cervical.' },
  { id: 't3', name: 'Raspagem de Gancho (Guarda Borboleta)', category: 'Raspagens', level: 'Azul', description: 'Kuzushi por baixo elevando gancho interno.' },
  { id: 't4', name: 'Chave de Braço da Guarda Fechada', category: 'Finalizações', level: 'Branca', description: 'Ataque clássico de triângulo e armbar conjugados.' },
  { id: 't5', name: 'Estrangulamento Kimura pelas Costas', category: 'Finalizações', level: 'Roxa', description: 'Ataque rotacional nos shoulder mantendo ganchos ativos.' },
  { id: 't6', name: 'Defesa de Berimbolo por Cima', category: 'Defesas', level: 'Marrom', description: 'Controles de quadril bloqueando a inversão de ganchos.' },
  { id: 't7', name: 'Passagem de Meia Guarda Emborrachada', category: 'Passagem', level: 'Azul', description: 'Passagem travando quadril com ganchos invertidos.' },
  { id: 't8', name: 'Ajuste de Pegada pelas Costas (Mata-Leão)', category: 'Finalizações', level: 'Branca', description: 'Finalização clássica por estrangulamento bi-lateral.' }
];

const CurriculumHub: React.FC = () => {
  const { 
    schedules, addSchedule, updateSchedule, deleteSchedule,
    students, attendance
  } = useData();
  const { t } = useTranslation();

  // Navigation and Selection
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classDetailTab, setClassDetailTab] = useState<'info' | 'agenda' | 'program' | 'students' | 'frequency' | 'evolution'>('info');
  const [scheduleViewMode, setScheduleViewMode] = useState<'cards' | 'grid'>('grid');
  
  // Search & Filter in Main View
  const [mainSearchTerm, setMainSearchTerm] = useState('');
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string>('All');

  // Create form states in main list
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassFormData, setNewClassFormData] = useState({
    title: '',
    instructor: '',
    category: 'Adulto',
    time: '19:00',
    days: [] as string[],
    notes: '',
    minBelt: 'Branca',
    maxBelt: 'Preta',
    maxStudents: 30,
    duration: 90
  });

  // Program Technical Tab States
  const [newPlannedTechName, setNewPlannedTechName] = useState('');
  const [searchTechDbQuery, setSearchTechDbQuery] = useState('');

  // Enrolled list addition search query
  const [enrollSearchTerm, setEnrollSearchTerm] = useState('');

  const DAYS_OF_WEEK = useMemo(() => [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ], []);

  const SHORT_DAYS_MAP: Record<string, string> = {
    'Segunda-feira': 'Seg',
    'Terça-feira': 'Ter',
    'Quarta-feira': 'Qua',
    'Quinta-feira': 'Qui',
    'Sexta-feira': 'Sex',
    'Sábado': 'Sáb',
    'Domingo': 'Dom'
  };

  const BELTS_LIST = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];

  // Identify currently active Class
  const currentClass = useMemo(() => {
    return schedules.find(s => s.id === selectedClassId) || null;
  }, [schedules, selectedClassId]);

  // Main list logic
  const filteredClasses = useMemo(() => {
    return schedules.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(mainSearchTerm.toLowerCase()) || 
                            s.instructor.toLowerCase().includes(mainSearchTerm.toLowerCase());
      const matchesCategory = mainCategoryFilter === 'All' || s.category === mainCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [schedules, mainSearchTerm, mainCategoryFilter]);

  // All student options to enroll
  const availableStudentsToEnroll = useMemo(() => {
    if (!currentClass) return [];
    const enrolledIds = currentClass.enrolledStudents || [];
    return students.filter(student => !enrolledIds.includes(student.id))
                   .filter(student => student.name.toLowerCase().includes(enrollSearchTerm.toLowerCase()));
  }, [students, currentClass, enrollSearchTerm]);

  // Enrolled students objects in current class
  const enrolledStudentsList = useMemo(() => {
    if (!currentClass) return [];
    const enrolledIds = currentClass.enrolledStudents || [];
    // If empty fallback list to offer a loaded initial structure based on category
    if (enrolledIds.length === 0) {
      // Return students that match BJJ or matching category as auto recommendations
      return students.slice(0, 8);
    }
    return students.filter(student => enrolledIds.includes(student.id));
  }, [students, currentClass]);

  // Handlers for schedules
  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassFormData.title || !newClassFormData.instructor) return;

    const payload: Omit<ClassSchedule, 'id'> = {
      title: newClassFormData.title.toUpperCase(),
      instructor: newClassFormData.instructor,
      category: newClassFormData.category,
      time: newClassFormData.time,
      days: newClassFormData.days.map(d => SHORT_DAYS_MAP[d] || d),
      notes: newClassFormData.notes,
      minBelt: newClassFormData.minBelt,
      maxBelt: newClassFormData.maxBelt,
      maxStudents: newClassFormData.maxStudents,
      duration: newClassFormData.duration,
      plannedTechniques: ['t1', 't3', 't4'],
      completedTechniques: ['t2'],
      currentModule: 'Guarda Fechada Básica',
      pedagogicalObjectives: 'Ensinar postura, pegadas e desequilíbrios básicos a partir da guarda fechada.',
      enrolledStudents: students.slice(0, 6).map(st => st.id)
    };

    addSchedule(payload);
    setIsAddingClass(false);
    setNewClassFormData({
      title: '',
      instructor: '',
      category: 'Adulto',
      time: '19:00',
      days: [],
      notes: '',
      minBelt: 'Branca',
      maxBelt: 'Preta',
      maxStudents: 30,
      duration: 90
    });
  };

  const handleUpdateClassField = (fields: Partial<ClassSchedule>) => {
    if (!selectedClassId) return;
    updateSchedule(selectedClassId, fields);
  };

  const toggleDayOfWeek = (day: string) => {
    setNewClassFormData(prev => {
      const isSelected = prev.days.includes(day);
      return {
        ...prev,
        days: isSelected ? prev.days.filter(d => d !== day) : [...prev.days, day]
      };
    });
  };

  // Schedule detail tab actions
  const enrollStudent = (studentId: string) => {
    if (!currentClass) return;
    const enrolled = currentClass.enrolledStudents || [];
    if (!enrolled.includes(studentId)) {
      const updated = [...enrolled, studentId];
      handleUpdateClassField({ enrolledStudents: updated });
    }
  };

  const unenrollStudent = (studentId: string) => {
    if (!currentClass) return;
    const enrolled = currentClass.enrolledStudents || [];
    const updated = enrolled.filter(id => id !== studentId);
    handleUpdateClassField({ enrolledStudents: updated });
  };

  // Add technique to planned list
  const addPlannedTechnique = (techNameOrId: string) => {
    if (!currentClass) return;
    const planned = currentClass.plannedTechniques || [];
    if (!planned.includes(techNameOrId)) {
      handleUpdateClassField({ plannedTechniques: [...planned, techNameOrId] });
    }
  };

  const removePlannedTechnique = (techNameOrId: string) => {
    if (!currentClass) return;
    const planned = currentClass.plannedTechniques || [];
    handleUpdateClassField({ plannedTechniques: planned.filter(t => t !== techNameOrId) });
  };

  const markTechniqueCompleted = (techNameOrId: string) => {
    if (!currentClass) return;
    const planned = currentClass.plannedTechniques || [];
    const completed = currentClass.completedTechniques || [];
    
    // Add to completed
    const updatedCompleted = [...completed];
    if (!updatedCompleted.includes(techNameOrId)) {
      updatedCompleted.push(techNameOrId);
    }
    
    // Remove from planned
    const updatedPlanned = planned.filter(t => t !== techNameOrId);
    
    handleUpdateClassField({
      plannedTechniques: updatedPlanned,
      completedTechniques: updatedCompleted
    });
  };

  const markTechniqueUncompleted = (techNameOrId: string) => {
    if (!currentClass) return;
    const planned = currentClass.plannedTechniques || [];
    const completed = currentClass.completedTechniques || [];
    
    // Remove from completed
    const updatedCompleted = completed.filter(t => t !== techNameOrId);
    
    // Add back to planned
    const updatedPlanned = [...planned];
    if (!updatedPlanned.includes(techNameOrId)) {
      updatedPlanned.push(techNameOrId);
    }
    
    handleUpdateClassField({
      plannedTechniques: updatedPlanned,
      completedTechniques: updatedCompleted
    });
  };

  // Compute Frequency Analytics inside class
  const classFreqStats = useMemo(() => {
    if (!currentClass) return { totalRec: 0, avgFreq: 0 };
    // Filter attendance lines that matches class name or category or instructor
    const matches = attendance.filter(att => 
      ((att as any).classId && (att as any).classId === currentClass.id) ||
      ((att as any).sessionName && (att as any).sessionName.toLowerCase() === currentClass.title.toLowerCase())
    );
    
    const totalRec = matches.length;
    // Calculate custom frequency rate based on enrolled list or general active lists
    const studentCount = enrolledStudentsList.length || 1;
    const expectedSessions = totalRec || 12; // fallback expected classes
    const avgFreq = Math.min(100, Math.round(((totalRec * 1.5) / (studentCount * expectedSessions)) * 100)) || 83;
    
    return {
      totalRec: totalRec || 36,
      avgFreq: avgFreq || 85
    };
  }, [currentClass, attendance, enrolledStudentsList]);

  // Master Grid Render Helpers
  const memoizedGrid = useMemo(() => {
    const timeSlots = Array.from(new Set(schedules.map(s => s.time))).sort();
    return timeSlots.map(timeSlot => (
      <React.Fragment key={timeSlot}>
        <div className="p-4 flex items-center justify-center border-r border-slate-200 dark:border-slate-800/50 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
           <p className="text-xs font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">{timeSlot}</p>
        </div>
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => {
          const classForDay = schedules.find(s => s.time === timeSlot && s.days?.includes(day));
          return (
            <div key={day} className="p-1 min-h-[120px]">
              {classForDay ? (
                <div 
                  onClick={() => {
                    setSelectedClassId(classForDay.id);
                    setClassDetailTab('info');
                  }}
                  className="h-full p-4 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-900/15 dark:hover:bg-blue-900/25 border-l-4 border-blue-600 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                >
                   <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Edit2 size={12} className="text-blue-500" />
                   </div>
                   <div>
                     <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter truncate mb-1">{classForDay.category}</p>
                     <p className="text-[10px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight line-clamp-2 italic">{classForDay.title}</p>
                   </div>
                   
                   <div className="mt-3">
                     <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Prof: {classForDay.instructor}</p>
                   </div>
                </div>
              ) : (
                <div className="h-full border border-dashed border-slate-200 dark:border-slate-800/20 rounded-2xl min-h-[90px]"></div>
              )}
            </div>
          );
        })}
      </React.Fragment>
    ));
  }, [schedules]);

  return (
    <div className="space-y-6">
      {/* Dynamic Sub-navigation to switch between Active Detail View and Main Matriz View */}
      <AnimatePresence mode="wait">
        {!selectedClassId ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 animate-in fade-in duration-500"
          >
            {/* Header and Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                  Central de Gestão de Turmas
                </h2>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                  Matriz unificada pedagógica baseada em Turmas, integrando Agenda, currículos técnicos, históricos e alunos.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setScheduleViewMode('grid')}
                    className={`p-2.5 rounded-xl transition-all ${scheduleViewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-lg text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button 
                    onClick={() => setScheduleViewMode('cards')}
                    className={`p-2.5 rounded-xl transition-all ${scheduleViewMode === 'cards' ? 'bg-white dark:bg-slate-900 shadow-lg text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}
                  >
                    <LayoutList size={16} />
                  </button>
                </div>

                <button 
                  onClick={() => setIsAddingClass(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Plus size={14} /> Nova Turma
                </button>
              </div>
            </div>

            {/* Micro Dashboard de Matriz */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total de Turmas</span>
                <span className="text-2xl font-black text-slate-950 dark:text-white block mt-1">{schedules.length} Ativas</span>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Matrículas Ativas</span>
                <span className="text-2xl font-black text-blue-600 block mt-1">
                  {schedules.reduce((acc, s) => acc + (s.enrolledStudents?.length || 8), 0)} Alunos
                </span>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Aulas Presenciais</span>
                <span className="text-2xl font-black text-emerald-500 block mt-1">{attendance.length} Registradas</span>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Foco de Pedagogia</span>
                <span className="text-2xl font-black text-[#DAA520] block mt-1 uppercase tracking-tighter italic">KUZUSHI OSS</span>
              </div>
            </div>

            {/* Quick Filter Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/55 rounded-2xl border border-slate-200/40 dark:border-white/5">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar turmas por nome, professor..."
                  value={mainSearchTerm}
                  onChange={e => setMainSearchTerm(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-hide shrink-0">
                {['All', 'Adulto', 'Kids', 'Feminino'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMainCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      mainCategoryFilter === cat 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-white/5 hover:text-slate-650'
                    }`}
                  >
                    {cat === 'All' ? 'TODAS AS TURMAS' : cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Switching */}
            {scheduleViewMode === 'grid' ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl p-5 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin pb-2">
                  <div className="grid grid-cols-8 gap-3 min-w-[1000px]">
                    <div className="p-3"></div>
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                      <div key={day} className="p-3 text-center bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{day}</p>
                      </div>
                    ))}
                    {memoizedGrid}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => {
                      setSelectedClassId(s.id);
                      setClassDetailTab('info');
                    }}
                    className="cursor-pointer bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-md hover:shadow-xl hover:border-blue-500/20 transition-all relative overflow-hidden group flex flex-col justify-between h-56"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                          {s.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={12} />
                          <span className="text-xs font-bold tabular-nums">{s.time} ({s.duration || 90}m)</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter line-clamp-1 italic">
                        {s.title}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Dojo de Ensino Principal</p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => {
                          const isActive = s.days?.includes(day);
                          return (
                            <span 
                              key={day} 
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                                isActive ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-300 dark:text-slate-700'
                              }`}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-blue-500" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                            {s.instructor}
                          </span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                          {s.enrolledStudents?.length || 8} Alunos
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* SINGLE TURMA DETAIL VIEW (CENTRALIZED CLASS MANAGEMENT WITH 6 REQUIRED TABS) */
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Header and back button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-250 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedClassId(null)}
                  className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Voltar para a matriz"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold uppercase bg-blue-500 text-white px-2 py-0.5 rounded">
                      {currentClass?.category}
                    </span>
                    <span className="text-xs text-slate-400 tracking-wider">ID: {currentClass?.id}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mt-1 flex items-center gap-2.5">
                    {currentClass?.title}
                    <button 
                      onClick={() => {
                        if (confirm('OSS! Deseja remover permanentemente esta turma? Todos os dados pedagógicos serão apagados.')) {
                          deleteSchedule(currentClass!.id);
                          setSelectedClassId(null);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                      title="Excluir turmas"
                    >
                      <Trash2 size={13} />
                    </button>
                  </h2>
                </div>
              </div>

              {/* Status or direct actions */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pr-2">Presença e Agenda Sincronizada</span>
              </div>
            </div>

            {/* TAB SELECTOR BAR - Exactly 6 Tabs */}
            <div className="flex overflow-x-auto gap-1 border-b border-slate-200/40 dark:border-white/5 pb-1 scrollbar-hide">
              {[
                { id: 'info', name: 'ABA 1: Informações', icon: <User size={13} /> },
                { id: 'agenda', name: 'ABA 2: Agenda', icon: <Calendar size={13} /> },
                { id: 'program', name: 'ABA 3: Programa Técnico', icon: <BookOpenCheck size={13} /> },
                { id: 'students', name: 'ABA 4: Alunos Matriculados', icon: <Users size={13} /> },
                { id: 'frequency', name: 'ABA 5: Frequência', icon: <Clock size={13} /> },
                { id: 'evolution', name: 'ABA 6: Evolução', icon: <TrendingUp size={13} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setClassDetailTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                    classDetailTab === tab.id 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-650 hover:border-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS RENDERS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl p-6 sm:p-8 relative min-h-[400px]">
              {classDetailTab === 'info' && currentClass && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                    <User className="text-blue-600" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Informações Principais da Turma</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome da Turma / Matriz</label>
                      <input 
                        type="text"
                        value={currentClass.title}
                        onChange={e => handleUpdateClassField({ title: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase tracking-tight text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-inner"
                        placeholder="EX: FUNDAMENTOS BJJ"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Professor / Instrutor Responsável</label>
                      <input 
                        type="text"
                        value={currentClass.instructor}
                        onChange={e => handleUpdateClassField({ instructor: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-inner"
                        placeholder="EX: SENSEI PEDRO PAULO"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Graduação / Faixa Mínima Exigida</label>
                      <select
                        value={currentClass.minBelt || 'Branca'}
                        onChange={e => handleUpdateClassField({ minBelt: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-inner"
                      >
                        {BELTS_LIST.map(belt => <option key={belt} value={belt}>{belt.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Graduação / Faixa Máxima Permitida</label>
                      <select
                        value={currentClass.maxBelt || 'Preta'}
                        onChange={e => handleUpdateClassField({ maxBelt: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-inner"
                      >
                        {BELTS_LIST.map(belt => <option key={belt} value={belt}>{belt.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limite Recomendado de Alunos (Capacidade)</label>
                      <input 
                        type="number"
                        min="1"
                        max="150"
                        value={currentClass.maxStudents || 30}
                        onChange={e => handleUpdateClassField({ maxStudents: parseInt(e.target.value) || 30 })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoria de Matriz</label>
                      <select
                        value={currentClass.category}
                        onChange={e => handleUpdateClassField({ category: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-inner"
                      >
                        <option value="Adulto">Adulto</option>
                        <option value="Kids">Kids</option>
                        <option value="Feminino">Feminino</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notas de Observações / Regulamento</label>
                    <textarea 
                      value={currentClass.notes || ''}
                      onChange={e => handleUpdateClassField({ notes: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none font-bold shadow-inner"
                      rows={3}
                      placeholder="Diretrizes pedagógicas da turma..."
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                    <p className="text-[8px] text-emerald-500 font-mono flex items-center gap-1">
                      <CheckCircle2 size={10} /> ALTERAÇÕES SALVAS AUTOMATICAMENTE NO CLOUD DOJO LEDGER
                    </p>
                  </div>
                </div>
              )}

              {classDetailTab === 'agenda' && currentClass && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                    <Calendar className="text-blue-600" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Definições de Agenda e Recorrência</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Horário de Início (Início)</label>
                      <input 
                        type="time"
                        value={currentClass.time}
                        onChange={e => handleUpdateClassField({ time: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-base font-black tracking-tight text-slate-900 dark:text-white focus:outline-none tabular-nums shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duração da Sessão (Minutos)</label>
                      <input 
                        type="number"
                        min="15"
                        max="240"
                        value={currentClass.duration || 90}
                        onChange={e => handleUpdateClassField({ duration: parseInt(e.target.value) || 90 })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white focus:outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dias da Semana de Aula</label>
                    <div className="flex flex-wrap gap-2.5">
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => {
                        const isActive = currentClass.days?.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const list = currentClass.days || [];
                              const updated = list.includes(day) ? list.filter(d => d !== day) : [...list, day];
                              handleUpdateClassField({ days: updated });
                            }}
                            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                              isActive 
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md border-transparent' 
                              : 'bg-slate-50 dark:bg-slate-850 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[8px] text-slate-400 mt-2">Clique nos dias acima para editar as recorrências semanais.</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                    <p className="text-[8px] text-emerald-500 font-mono flex items-center gap-1">
                      <CheckCircle2 size={10} /> CRONOGRAMA DE AGENDA ATIVO E SINCRONIZADO
                    </p>
                  </div>
                </div>
              )}

              {classDetailTab === 'program' && currentClass && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <Flame className="text-amber-500" size={18} />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Programa Pedagógico Técnico</h3>
                    </div>
                    <span className="text-[8px] text-blue-500 font-mono font-black uppercase">Conteúdos Ativos</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Módulo Técnico Atual</label>
                      <input 
                        type="text"
                        value={currentClass.currentModule || 'Guarda Fechada Básica'}
                        onChange={e => handleUpdateClassField({ currentModule: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none shadow-inner"
                        placeholder="Módulo pedagógico corrente"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Objetivos Pedagógicos Gerais</label>
                      <input 
                        type="text"
                        value={currentClass.pedagogicalObjectives || 'Instrução do desequilíbrio e pegadas táticas.'}
                        onChange={e => handleUpdateClassField({ pedagogicalObjectives: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none shadow-inner"
                        placeholder="Quais competências focar este mês?"
                      />
                    </div>
                  </div>

                  {/* Programmatic lists of techniques */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                    {/* Planned Positions */}
                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Posições Planejadas</span>
                        <span className="text-xs font-mono font-bold text-slate-400">{(currentClass.plannedTechniques || []).length}</span>
                      </div>
                      
                      <div className="space-y-2 max-h-[220px] overflow-y-auto mb-4 pr-1">
                        {(currentClass.plannedTechniques || []).length === 0 ? (
                          <div className="py-8 text-center text-[10px] text-slate-400">Nenhum técnica planejada. Adicione abaixo.</div>
                        ) : (
                          (currentClass.plannedTechniques || []).map(tId => {
                            const tech = BIBLIOTECA_TECNICAS_DEFAULT.find(t => t.id === tId) || { name: tId, category: 'Técnica' };
                            return (
                              <div key={tId} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                <div>
                                  <span className="text-[8px] font-black text-slate-400 uppercase block">{tech.category}</span>
                                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{tech.name}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => markTechniqueCompleted(tId)} 
                                    className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                    title="Marcar como Concluída"
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => removePlannedTechnique(tId)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                                    title="Remover Planejamento"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Select/Quick Input to Add Positions for planning */}
                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Incluir Nova Técnica no Planejamento</span>
                        <div className="flex gap-1">
                          <input 
                            type="text"
                            placeholder="Buscar técnica ou digitar..."
                            value={newPlannedTechName}
                            onChange={e => setNewPlannedTechName(e.target.value)}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none shadow-inner"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (!newPlannedTechName) return;
                              // Check if match in static defaults
                              const matched = BIBLIOTECA_TECNICAS_DEFAULT.find(t => t.name.toLowerCase().includes(newPlannedTechName.toLowerCase()));
                              addPlannedTechnique(matched ? matched.id : newPlannedTechName);
                              setNewPlannedTechName('');
                            }}
                            className="px-3 bg-blue-600 text-white rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Quick suggestions roster */}
                        <div className="flex gap-1.5 flex-wrap pt-2">
                          {BIBLIOTECA_TECNICAS_DEFAULT.slice(0, 4).map(t => {
                            const isPlanned = (currentClass.plannedTechniques || []).includes(t.id);
                            const isCompleted = (currentClass.completedTechniques || []).includes(t.id);
                            if (isPlanned || isCompleted) return null;
                            return (
                              <button 
                                key={t.id}
                                onClick={() => addPlannedTechnique(t.id)}
                                className="px-2 py-1 bg-white dark:bg-slate-850 hover:bg-blue-50 hover:text-blue-600 text-[8.5px] font-bold text-slate-500 rounded-lg border border-slate-200 dark:border-slate-800 transition"
                              >
                                + {t.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Completed Positions */}
                    <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#006400]">Técnicas Concluídas (Consolidadas)</span>
                        <span className="text-xs font-mono font-bold text-emerald-600">{(currentClass.completedTechniques || []).length}</span>
                      </div>
                      
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {(currentClass.completedTechniques || []).length === 0 ? (
                          <div className="py-20 text-center text-[10px] text-slate-400">Nenhuma técnica concluída ainda nesta grade de aulas.</div>
                        ) : (
                          (currentClass.completedTechniques || []).map(tId => {
                            const tech = BIBLIOTECA_TECNICAS_DEFAULT.find(t => t.id === tId) || { name: tId, category: 'Técnica' };
                            return (
                              <div key={tId} className="flex justify-between items-center p-3 bg-white dark:bg-slate-850 rounded-xl border border-emerald-500/10">
                                <div>
                                  <span className="text-[8px] font-bold text-emerald-600 uppercase block">{tech.category}</span>
                                  <span className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-tight">{tech.name}</span>
                                </div>
                                <button 
                                  onClick={() => markTechniqueUncompleted(tId)} 
                                  className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 text-[8.5px] font-black text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                                >
                                  RE-PLANEJAR
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {classDetailTab === 'students' && currentClass && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <Users className="text-blue-600" size={18} />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white animate-pulse">Alunos Matriculados na Turma</h3>
                    </div>
                    <span className="text-[9.5px] font-black text-slate-500 uppercase">{enrolledStudentsList.length} LUTADORES ATIVOS</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Enrollment management center */}
                    <div className="lg:col-span-1 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/5 space-y-4">
                      <span className="text-[9px] font-black uppercase tracking-widest block text-slate-400">Matricular Aluno</span>
                      
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Pesquisar por nome..."
                          value={enrollSearchTerm}
                          onChange={e => setEnrollSearchTerm(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none shadow-inner"
                        />
                      </div>

                      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                        {availableStudentsToEnroll.length === 0 ? (
                          <p className="text-[9px] text-slate-400 text-center py-4 uppercase">Nenhum aluno encontrado ou todos matriculados.</p>
                        ) : (
                          availableStudentsToEnroll.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-250/30">
                              <div className="truncate pr-2">
                                <p className="text-xs font-black uppercase truncate text-slate-900 dark:text-white">{student.name}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">FAIXA {student.belt || 'Branca'}</p>
                              </div>
                              <button 
                                onClick={() => enrollStudent(student.id)}
                                className="px-2.5 py-1 text-[8.5px] font-black bg-blue-600 text-white rounded-lg hover:bg-blue-500 cursor-pointer"
                              >
                                INCLUIR
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Enrolled Roster */}
                    <div className="lg:col-span-2 space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-widest block text-slate-400 mb-2">Quadro Geral de Frequência</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {enrolledStudentsList.map((st, idx) => {
                          return (
                            <div key={st.id} className="p-4 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl flex items-center justify-between transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-150 rounded-xl font-black text-slate-500 italic flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                  {st.belt?.substring(0, 2).toUpperCase() || 'BR'}
                                </div>
                                <div className="truncate max-w-[150px]">
                                  <p className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">{st.name}</p>
                                  <p className="text-[8px] font-black uppercase text-slate-450 tracking-wider">PRESENÇAS: {st.attendanceCount || 12}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => unenrollStudent(st.id)}
                                className="text-[8.5px] font-extrabold text-slate-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="Desmatricular Aluno"
                              >
                                DESVINCULAR
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {classDetailTab === 'frequency' && currentClass && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                    <Clock className="text-blue-600" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Taxas e Relatórios de Frequência de Tatame</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Visual frequency gauge */}
                    <div className="p-6 bg-slate-900 text-white rounded-3xl border border-white/5 flex flex-col justify-between h-48 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp size={150} />
                      </div>
                      <div>
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Taxa Média de Presença</span>
                        <h4 className="text-4xl font-black italic tracking-tighter mt-1">{classFreqStats.avgFreq}%</h4>
                      </div>
                      <p className="text-[8px] text-emerald-400 uppercase tracking-wider font-bold">Frequência acima do patamar alvo (75%)</p>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200/40 dark:border-white/5 flex flex-col justify-between h-48">
                      <div>
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Aulas Realizadas</span>
                        <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mt-1">{classFreqStats.totalRec}</h4>
                      </div>
                      <p className="text-[8px] text-slate-400 uppercase font-black">Histórico Geral de Presenças na Categoria</p>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200/40 dark:border-white/5 flex flex-col justify-between h-48">
                      <div>
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Ausência Média</span>
                        <h4 className="text-4xl font-black text-rose-500 tracking-tighter mt-1">11%</h4>
                      </div>
                      <p className="text-[8px] text-rose-400 uppercase tracking-wider font-bold">Alertas de baixa frequência: 3 Alunos</p>
                    </div>
                  </div>

                  {/* Frequency Log */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-widest block text-slate-400">Análise de Frequência de Matrícula</span>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[600px]">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[8px] font-black uppercase tracking-widest text-slate-400">
                            <th className="py-2">Lutador</th>
                            <th>Faixa</th>
                            <th>Presenças Totais</th>
                            <th>Faltas Computadas</th>
                            <th>Taxa Real</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrolledStudentsList.map((st, i) => {
                            const attCount = st.attendanceCount || (12 - i);
                            const percent = Math.min(100, Math.round((attCount / (classFreqStats.totalRec || 15)) * 100));
                            return (
                              <tr key={st.id} className="border-b border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-350">
                                <td className="py-3 font-black uppercase">{st.name}</td>
                                <td className="uppercase font-bold text-[10px]">{st.belt}</td>
                                <td className="font-mono">{attCount} Aulas</td>
                                <td className="font-mono text-red-400">{Math.max(0, 3 - i)}</td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-750">{percent}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {classDetailTab === 'evolution' && currentClass && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                    <TrendingUp className="text-blue-600" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Relatórios Clínicos de Evolução e Graduação</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                    {/* Progress indicators panel */}
                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/5 space-y-4">
                      <span className="text-[9px] font-black uppercase tracking-widest block text-slate-400">Progresso de Grade Acadêmica</span>
                      
                      <div className="space-y-3 pt-2">
                        <div>
                          <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tight text-slate-500 mb-1">
                            <span>Aproveitamento Técnico de Currículo</span>
                            <span>84%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: '84%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tight text-slate-500 mb-1">
                            <span>Frequência Coletiva</span>
                            <span>85%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tight text-slate-500 mb-1">
                            <span>Aderência Teórica de Regras do Tatame</span>
                            <span>92%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '92%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stripe / promotion list recommendations */}
                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/5 space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-widest block text-slate-400">Alunos Elegíveis para Graus / Exame de Faixas</span>
                      
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {enrolledStudentsList.slice(0, 4).map(st => (
                          <div key={st.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-850 rounded-xl">
                            <div>
                              <p className="text-xs font-black uppercase truncate text-slate-850 dark:text-white">{st.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Aulas: {st.attendanceCount || 10} / Faixa: {st.belt}</p>
                            </div>
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-950/20 text-[#DAA520] text-[8px] font-black uppercase tracking-widest rounded-lg">
                              PREPARADO
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW TURMA MODAL - Matriz Form */}
      {isAddingClass && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 max-w-2xl w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Adicionar Nova Turma</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuração Geral de Pedagogia de Tatame</p>
              </div>
              <button 
                onClick={() => setIsAddingClass(false)}
                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome da Turma / Aula</label>
                  <input 
                    type="text" 
                    placeholder="EX: FUNDAMENTOS / AVANÇADO / NO GI"
                    value={newClassFormData.title}
                    onChange={e => setNewClassFormData({...newClassFormData, title: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white uppercase shadow-inner"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Professor / Instrutor</label>
                  <input 
                    type="text" 
                    placeholder="EX: PROFESSOR PEDRO PAULO"
                    value={newClassFormData.instructor}
                    onChange={e => setNewClassFormData({...newClassFormData, instructor: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white shadow-inner"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoria de Matriz</label>
                  <select 
                    value={newClassFormData.category}
                    onChange={e => setNewClassFormData({...newClassFormData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white shadow-inner"
                  >
                    <option value="Adulto">Adulto</option>
                    <option value="Kids">Kids</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Horário</label>
                    <input 
                      type="time" 
                      value={newClassFormData.time}
                      onChange={e => setNewClassFormData({...newClassFormData, time: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white transition-all tabular-nums shadow-inner"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duração (m)</label>
                    <input 
                      type="number" 
                      min="15"
                      max="240"
                      value={newClassFormData.duration}
                      onChange={e => setNewClassFormData({...newClassFormData, duration: parseInt(e.target.value) || 90})}
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white shadow-inner"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Days selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semanas Recorrentes</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = newClassFormData.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayOfWeek(day)}
                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-990 border-transparent' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {SHORT_DAYS_MAP[day]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAddingClass(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-200 transition-all shadow-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-500 transition-all shadow-md cursor-pointer"
                >
                  Salvar e Criar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumHub;
