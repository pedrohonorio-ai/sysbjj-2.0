import React, { useMemo } from 'react';
import { Clock, Calendar, Search, Users, ChevronRight, FileText, Download } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendanceHistory: React.FC = () => {
  const { t } = useTranslation();
  const { students, schedules } = useData();
  const [searchTerm, setSearchTerm] = React.useState('');

  const history = useMemo(() => {
    const allRecords: { date: string, studentName: string, classTitle: string, belt: string, id: string }[] = [];
    
    students.forEach(student => {
      if (student.attendanceHistory) {
        student.attendanceHistory.forEach((record, idx) => {
          const classObj = schedules.find(s => s.id === record.classId);
          allRecords.push({
            date: record.date,
            studentName: student.name,
            classTitle: classObj ? classObj.title : 'Aula Geral',
            belt: student.belt,
            id: `${student.id}-${idx}`
          });
        });
      }
    });

    return allRecords
      .filter(r => r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || r.classTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [students, schedules, searchTerm]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const presentToday = history.filter(h => h.date === today).length;
    const totalAttendances = history.length;
    return { presentToday, totalAttendances };
  }, [history]);

  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('SYSBJJ 2.0 - Histórico Completo de Presença', 14, 22);
    
    const tableData = history.map(h => [h.date, h.studentName, h.classTitle, h.belt]);
    autoTable(doc, {
      startY: 30,
      head: [['Data', 'Aluno', 'Aula', 'Faixa']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: '#1e293b' }
    });
    doc.save('Historico_Presenca.pdf');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-slate-900 dark:bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-blue-400 italic">Logs de Atividade</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Histórico de Aulas</h1>
          <p className="text-slate-500 font-bold italic mt-4 text-sm opacity-60 flex items-center gap-2">
            <Clock size={16} />
            Rastreamento completo de presenças e evolução tecnológica.
          </p>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95"
        >
          <Download size={16} />
          Exportar Relatório PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        <div className="bento-card p-8 flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Presentes Hoje</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{stats.presentToday}</p>
          </div>
        </div>
        <div className="bento-card p-8 flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calendar size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Presenças</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{stats.totalAttendances}</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="bento-card overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por aluno ou aula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aluno</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aula</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Faixa</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {history.slice(0, 100).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-blue-500" />
                        <span className="text-xs font-black tabular-nums dark:text-white uppercase">{record.date}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black uppercase tracking-tight dark:text-white">{record.studentName}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        {record.classTitle}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[9px] font-bold uppercase dark:text-slate-400">{record.belt}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <FileText size={48} />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">Nenhum registro encontrado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
