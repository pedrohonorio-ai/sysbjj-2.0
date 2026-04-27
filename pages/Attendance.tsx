
import React, { useState, useEffect, useMemo } from 'react';
import { QrCode, CheckCircle, Search, Save, FileSpreadsheet, Camera, X, Filter, Download, UserPlus } from 'lucide-react';
import { StudentStatus, ClassSchedule } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendancePage: React.FC = () => {
  const { t } = useTranslation();
  const { students, recordAttendance, schedules } = useData();
  const [attendedIds, setAttendedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [isSaved, setIsSaved] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);

  const activeStudents = useMemo(() => students.filter(s => s.status === StudentStatus.ACTIVE), [students]);
  
  const filtered = useMemo(() => {
    let list = activeStudents;
    
    if (!showAllStudents && selectedClassId !== 'all') {
      const selectedClass = schedules.find(s => s.id === selectedClassId);
      if (selectedClass) {
        // Filter students by category (Adulto/Kids) as a proxy for class if no explicit class link exists
        // Or just show all active students but highlight the ones in the class if we had a class link.
        // Since we don't have a direct student-to-class mapping in the type, we'll use category.
        list = activeStudents.filter(s => s.isKid === (selectedClass.category === 'Kids'));
      }
    }

    if (searchTerm) {
      list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return list;
  }, [activeStudents, selectedClassId, searchTerm, showAllStudents, schedules]);

  const handleExportDaily = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();
    const selectedClass = schedules.find(s => s.id === selectedClassId);
    
    doc.setFontSize(20);
    doc.text(`SYSBJJ 2.0 - Chamada Diária`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Data: ${today}`, 14, 32);
    doc.text(`Turma: ${selectedClass ? selectedClass.title : 'Todas'}`, 14, 40);

    const data = filtered.map(s => [
      s.name,
      t(`belts.${s.belt}`),
      attendedIds.includes(s.id) ? 'PRESENTE' : 'AUSENTE'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Nome do Aluno', 'Faixa', 'Status']],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: '#1e293b' }
    });

    doc.save(`Chamada_${today.replace(/\//g, '-')}.pdf`);
  };

  const handleExportMonthly = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    doc.setFontSize(20);
    doc.text(`SYSBJJ 2.0 - Controle Mensal de Frequência`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Mês: ${month}`, 14, 32);

    // Get all days of current month
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const headers = ['Aluno', ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString())];

    const data = activeStudents.map(s => {
      const row = [s.name];
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const attended = s.attendanceHistory?.some(h => h.date === dateStr);
        row.push(attended ? 'X' : '');
      }
      return row;
    });

    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: data,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: '#1e293b' }
    });

    doc.save(`Frequencia_Mensal_${month.replace(/ /g, '_')}.pdf`);
  };

  const handlePhotoAttendance = () => {
    setIsAnalyzingPhoto(true);
    // Simulação de IA para reconhecimento de alunos na foto
    setTimeout(() => {
      const randomStudents = activeStudents
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 5) + 3)
        .map(s => s.id);
      
      setAttendedIds(prev => Array.from(new Set([...prev, ...randomStudents])));
      setIsAnalyzingPhoto(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 5000);
    }, 3000);
  };

  const toggleAttendance = (id: string) => {
    setAttendedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setIsSaved(false);
  };

  const handleSave = () => {
    if (attendedIds.length === 0) return;
    recordAttendance(attendedIds, undefined, selectedClassId !== 'all' ? selectedClassId : undefined);
    setIsSaved(true);
    setAttendedIds([]);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const sessionQRCode = `SYSBJJ-ATTENDANCE-${new Date().toISOString().split('T')[0]}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="animate-in slide-in-from-left duration-700">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('attendance.title')}</h1>
          <p className="text-slate-500 font-bold italic mt-2 text-xs opacity-70">{t('attendance.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowQRGenerator(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <QrCode size={18} />
            {t('attendance.qrBtn')}
          </button>
          <div className="flex gap-2 flex-1 sm:flex-none">
            <button 
              onClick={handleExportDaily}
              className="flex-1 p-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all group"
              title={t('attendance.exportDaily')}
            >
              <Download size={18} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={handleExportMonthly}
              className="flex-1 p-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all group"
              title={t('attendance.exportMonthly')}
            >
              <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-72 shrink-0 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">{t('attendance.selectClass')}</label>
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedClassId('all')}
                className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${selectedClassId === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
              >
                {t('attendance.allStudents')}
              </button>
              {schedules.map(sch => (
                <button 
                  key={sch.id}
                  onClick={() => setSelectedClassId(sch.id)}
                  className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${selectedClassId === sch.id ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                >
                  {sch.time} - {sch.title}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setShowAllStudents(!showAllStudents)}
            className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between text-left ${showAllStudents ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
          >
            <div className="flex items-center gap-3">
              <UserPlus size={20} className={showAllStudents ? 'text-amber-600' : 'text-slate-400'} />
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${showAllStudents ? 'text-amber-600' : 'text-slate-400'}`}>{t('attendance.activeAndPaid')}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                  {showAllStudents ? t('students.showingAllActive') || 'Exibindo todos os ativos' : t('students.showOnlyPaid') || 'Mostrar apenas adimplentes'}
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="relative mb-10">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t('attendance.manualSearch')}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((student) => {
            const isChecked = attendedIds.includes(student.id);
            return (
              <button
                key={student.id}
                onClick={() => toggleAttendance(student.id)}
                className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between text-left group ${
                  isChecked 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' 
                  : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden ${
                    isChecked ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {student.photoUrl ? (
                      <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      student.name[0]
                    )}
                  </div>
                  <div>
                    <p className={`font-black uppercase tracking-tight text-lg ${isChecked ? 'text-blue-900 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                      {student.name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                      {t(`belts.${student.belt}`)} • {student.attendanceCount} {t('common.attendance').toLowerCase()}s
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <button 
            onClick={handleSave}
            disabled={attendedIds.length === 0}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl ${
              isSaved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isSaved ? t('attendance.success').toUpperCase() : t('attendance.saveBtn').toUpperCase()}
          </button>
        </div>
      </div>
    </div>

    {showQRGenerator && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.oss')}</span>
               <button onClick={() => setShowQRGenerator(false)} className="p-2 text-slate-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full"><X /></button>
            </div>
            <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(sessionQRCode)}`} 
                className="w-full h-auto"
                alt="Attendance QR Code"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('attendance.qrTitle')}</h3>
              <p className="text-slate-500 text-xs font-medium">{t('attendance.qrInstructions')}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] tabular-nums">
                {t('attendance.sessionActive')}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
