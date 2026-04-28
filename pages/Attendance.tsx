import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  QrCode, CheckCircle, Search, Save, FileSpreadsheet, 
  Camera, X, Filter, Download, UserPlus, MapPin, 
  Scan, LayoutGrid, Tablet
} from 'lucide-react';
import { StudentStatus, ClassSchedule } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';

type AttendanceMode = 'manual' | 'scanner' | 'station';

const AttendancePage: React.FC = () => {
  const { t } = useTranslation();
  const { students, recordAttendance, schedules } = useData();
  const [attendedIds, setAttendedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [isSaved, setIsSaved] = useState(false);
  const [mode, setMode] = useState<AttendanceMode>('manual');
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'verifying' | 'success' | 'fail'>('idle');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const activeStudents = useMemo(() => students.filter(s => s.status === StudentStatus.ACTIVE), [students]);
  
  const filtered = useMemo(() => {
    let list = activeStudents;
    
    if (!showAllStudents && selectedClassId !== 'all') {
      const selectedClass = schedules.find(s => s.id === selectedClassId);
      if (selectedClass) {
        list = activeStudents.filter(s => s.isKid === (selectedClass.category === 'Kids'));
      }
    }

    if (searchTerm) {
      list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return list;
  }, [activeStudents, selectedClassId, searchTerm, showAllStudents, schedules]);

  // QR Scanning Logic
  useEffect(() => {
    if (mode === 'scanner') {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false);
      
      scanner.render((decodedText) => {
        if (decodedText.startsWith('SYSBJJ-STUDENT-')) {
          const studentId = decodedText.split('-STUDENT-')[1];
          const student = students.find(s => s.id === studentId);
          if (student && !attendedIds.includes(studentId)) {
            setAttendedIds(prev => [...prev, studentId]);
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            audio.play().catch(() => {});
          }
        }
      }, (error) => {
        // quiet fail
      });

      scannerRef.current = scanner;
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, [mode, students, attendedIds]);

  // Geolocation Logic
  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('fail');
      return;
    }

    setLocationStatus('verifying');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const academyLat = -22.9068;
        const academyLng = -43.1729;
        const R = 6371e3;
        const φ1 = position.coords.latitude * Math.PI/180;
        const φ2 = academyLat * Math.PI/180;
        const Δφ = (academyLat-position.coords.latitude) * Math.PI/180;
        const Δλ = (academyLng-position.coords.longitude) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        if (distance <= 500) {
          setLocationStatus('success');
        } else {
          setLocationStatus('fail');
        }
      },
      () => setLocationStatus('fail'),
      { enableHighAccuracy: true }
    );
  };

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

  const handleConfirmEntireClass = () => {
    const classIds = filtered.map(s => s.id);
    setAttendedIds(prev => Array.from(new Set([...prev, ...classIds])));
  };

  const sessionQRCode = `SYSBJJ-SESSION-${new Date().toISOString().split('T')[0]}-${selectedClassId}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="animate-in slide-in-from-left duration-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 italic">Academy Operations</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none italic">{t('attendance.title')}</h1>
          <p className="text-slate-500 font-bold italic mt-4 text-sm opacity-60 flex items-center gap-2">
            <LayoutGrid size={16} />
            {t('attendance.subtitle')}
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-[2rem] flex items-center gap-2 shadow-inner border border-slate-200 dark:border-slate-700 w-full lg:w-auto">
          <button 
            onClick={() => setMode('manual')}
            className={`flex-1 lg:flex-none px-6 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserPlus size={16} />
            {t('attendance.modeManual')}
          </button>
          <button 
            onClick={() => setMode('scanner')}
            className={`flex-1 lg:flex-none px-6 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'scanner' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Scan size={16} />
            {t('attendance.modeScanner')}
          </button>
          <button 
            onClick={() => setMode('station')}
            className={`flex-1 lg:flex-none px-6 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'station' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Tablet size={16} />
            {t('attendance.modeSelfCheckIn')}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block italic">{t('attendance.selectClass')}</label>
              <div className="space-y-3">
                <button 
                  onClick={() => setSelectedClassId('all')}
                  className={`w-full px-6 py-4 rounded-2xl text-left text-[11px] font-black uppercase tracking-widest transition-all border-2 ${selectedClassId === 'all' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                >
                  <div className="flex items-center gap-3">
                    <Filter size={14} />
                    {t('attendance.allStudents')}
                  </div>
                </button>
                {schedules.map(sch => (
                  <button 
                    key={sch.id}
                    onClick={() => setSelectedClassId(sch.id)}
                    className={`w-full px-6 py-4 rounded-2xl text-left text-[11px] font-black uppercase tracking-widest transition-all border-2 ${selectedClassId === sch.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                  >
                     <div className="flex flex-col">
                        <span className="text-[9px] opacity-60">{sch.time}</span>
                        <span>{sch.title}</span>
                     </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {selectedClassId !== 'all' && (
                <button 
                  onClick={handleConfirmEntireClass}
                  className="w-full p-5 bg-blue-600 text-white rounded-2xl flex items-center justify-between text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                >
                  <span>Confirmar Todos</span>
                  <CheckCircle size={16} />
                </button>
              )}
              <button 
                onClick={handleExportDaily}
                className="w-full p-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl flex items-center justify-between text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group"
              >
                <span>{t('attendance.exportDaily')}</span>
                <Download size={16} className="group-hover:translate-y-1 transition-transform" />
              </button>
              <button 
                onClick={handleExportMonthly}
                className="w-full p-5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-between text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all group"
              >
                <span>{t('attendance.exportMonthly')}</span>
                <FileSpreadsheet size={16} className="group-hover:rotate-6 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <MapPin size={24} className="text-blue-200" />
                <h4 className="text-sm font-black uppercase tracking-widest italic">{t('attendance.geoRequired')}</h4>
              </div>
              <p className="text-[11px] font-bold italic opacity-80 leading-relaxed uppercase tracking-tight">
                Garante que os alunos estão fisicamente no Dojo para validar a presença.
              </p>
              <button 
                onClick={verifyLocation}
                className="w-full py-4 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 hover:bg-white/30 transition-all flex items-center justify-center gap-3"
              >
                {locationStatus === 'verifying' ? (
                   <span className="animate-pulse">VERIFICANDO...</span>
                ) : (
                  <>
                    <div className={`w-2 h-2 rounded-full ${locationStatus === 'success' ? 'bg-green-400 animate-ping' : locationStatus === 'fail' ? 'bg-red-400' : 'bg-white/40'}`} />
                    {locationStatus === 'success' ? t('attendance.geoSuccess') : locationStatus === 'fail' ? t('attendance.geoFail') : 'VERIFICAR LOCALIZAÇÃO'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[600px]">
          <AnimatePresence mode="wait">
            {mode === 'manual' && (
              <motion.div 
                key="manual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl h-full"
              >
                <div className="relative mb-12">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder={t('attendance.manualSearch')}
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[2rem] focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 dark:text-white font-bold text-lg transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((student) => {
                    const isChecked = attendedIds.includes(student.id);
                    return (
                      <button
                        key={student.id}
                        onClick={() => toggleAttendance(student.id)}
                        className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center gap-5 text-left group relative overflow-hidden ${
                          isChecked 
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
                          : 'border-slate-50 dark:border-slate-800 hover:border-blue-200 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl overflow-hidden shadow-xl transition-transform group-hover:scale-105 ${
                            isChecked ? 'bg-blue-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          }`}>
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name[0]
                            )}
                          </div>
                          {isChecked && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full border-4 border-white dark:border-slate-900 shadow-lg animate-in zoom-in duration-300">
                              <CheckCircle size={14} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-black uppercase tracking-tighter text-base leading-tight group-hover:text-blue-600 transition-colors ${isChecked ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                            {student.name}
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                            {t(`belts.${student.belt}`)} • {student.attendanceCount} {t('common.attendance').toLowerCase()}s
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-12 flex justify-end">
                   <button 
                    onClick={handleSave}
                    disabled={attendedIds.length === 0}
                    className={`px-16 py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm transition-all shadow-2xl active:scale-95 ${
                      isSaved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white shadow-blue-600/30'
                    }`}
                  >
                    {isSaved ? 'EVOLUÇÃO REGISTRADA!' : 'CONFIRMAR TREINOS'}
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'scanner' && (
              <motion.div 
                key="scanner"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 p-10 rounded-[4rem] border-2 border-white/5 shadow-2xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden"
              >
                <div className="absolute top-10 left-10 text-left space-y-2">
                  <h3 className="text-white text-3xl font-black uppercase tracking-tighter italic">{t('attendance.scanTitle')}</h3>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">{t('attendance.scanInstructions')}</p>
                </div>

                <div className="w-full max-w-sm aspect-square bg-white/5 rounded-[4rem] border-4 border-dashed border-blue-500/50 flex items-center justify-center overflow-hidden relative">
                   <div id="reader" className="w-full h-full" />
                </div>

                <div className="mt-12 w-full max-w-md">
                   <div className="flex items-center justify-between text-white/50 text-[10px] font-black uppercase tracking-widest mb-4">
                      <span>Recent Scans</span>
                      <span>Total: {attendedIds.length}</span>
                   </div>
                   <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                      {attendedIds.slice(-5).map(id => {
                        const s = students.find(std => std.id === id);
                        return (
                          <div key={id} className="shrink-0 bg-white/10 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
                            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold">
                               {s?.name[0]}
                            </div>
                            <span className="text-white text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">{s?.name}</span>
                          </div>
                        );
                      })}
                   </div>
                </div>

                <button 
                  onClick={handleSave}
                  className="mt-8 px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-700 active:scale-95 transition-all"
                >
                  SALVAR SESSÃO DE ESCANEAMENTO
                </button>
              </motion.div>
            )}

            {mode === 'station' && (
              <motion.div 
                key="station"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl h-full flex flex-col items-center justify-center text-center space-y-12"
              >
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{t('attendance.qrTitle')}</h2>
                  <p className="text-slate-500 font-bold italic text-lg max-w-2xl mx-auto">
                    {t('attendance.qrInstructions')}
                  </p>
                </div>

                <div className="relative bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-slate-100">
                  <QRCodeCanvas 
                    value={sessionQRCode} 
                    size={320}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="flex flex-col items-center gap-6">
                   <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/20 flex flex-col items-center gap-4">
                      <div className="flex items-center gap-3">
                         <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" />
                         <span className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter italic">
                           {t('attendance.sessionActive')}
                         </span>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time</p>
                            <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                         <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                         <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Checked</p>
                            <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">{attendedIds.length}</p>
                         </div>
                      </div>
                   </div>
                   
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
                     SYSBJJ Academy • {new Date().getFullYear()} • BIOMETRIC LOG
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
