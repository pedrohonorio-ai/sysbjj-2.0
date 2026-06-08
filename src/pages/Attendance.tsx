import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  QrCode, CheckCircle, Search, Save, FileSpreadsheet, 
  Camera, X, Filter, Download, UserPlus, MapPin, 
  Scan, LayoutGrid, Tablet, Sparkles, Zap, RefreshCw,
  Compass, AlertCircle, Smile, HelpCircle, HardDrive, 
  Eye, Check, ListChecks
} from 'lucide-react';
import { StudentStatus, ClassSchedule, Student, AttendanceRecord } from '../types.js';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useData } from '../contexts/DataContext.js';
import { useProfile } from '../contexts/ProfileContext.js';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import AttendanceHistory from './AttendanceHistory.js';

type AttendancePageTab = 'record' | 'history';
type AttendanceMode = 'manual' | 'scanner' | 'station';

const AttendancePage: React.FC = () => {
  const { t } = useTranslation();
  const { students, recordAttendance, schedules, updateStudent, logAction } = useData();
  const { profile } = useProfile();

  // Tab switcher State
  const [activeTab, setActiveTab] = useState<AttendancePageTab>('record');
  const [mode, setMode] = useState<AttendanceMode>('manual');

  // Search and selector filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // GPS Calibration State
  const [calibratingGps, setCalibratingGps] = useState(false);
  const [calibratedLat, setCalibratedLat] = useState<number | null>(profile.latitude || null);
  const [calibratedLng, setCalibratedLng] = useState<number | null>(profile.longitude || null);
  const [calibratedRadius, setCalibratedRadius] = useState<number>(profile.geofenceRadius || 100);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Static Dojo QR code State
  const [staticQRSeed, setStaticQRSeed] = useState(() => {
    return localStorage.getItem('sysbjj_static_qr_seed') || Math.random().toString(36).substring(7);
  });

  // Facial Recognition Biomatch Mock Sandbox State
  const [activeFaceRegisterStudent, setActiveFaceRegisterStudent] = useState<Student | null>(null);
  const [isFaceCameraActive, setIsFaceCameraActive] = useState(false);
  const [faceScanPercent, setFaceScanPercent] = useState(0);
  const [faceEnrollSuccess, setFaceEnrollSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Advanced Manual State (multi-status selection sheet)
  const [manualStatusState, setManualStatusState] = useState<{ 
    [studentId: string]: { 
      status: 'present' | 'absent' | 'late' | 'trial'; 
      notes: string; 
    } 
  }>({});

  const [lastCheckedStudent, setLastCheckedStudent] = useState<Student | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'verifying' | 'success' | 'fail'>('idle');
  const [scannedCoordinates, setScannedCoordinates] = useState<{lat: number, lng: number} | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const activeStudents = useMemo(() => students.filter(s => s.status === StudentStatus.ACTIVE), [students]);
  
  const instructors = useMemo(() => {
    const list = schedules.map(s => s.instructor).filter(Boolean);
    return Array.from(new Set(list));
  }, [schedules]);

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

  const filteredSchedules = useMemo(() => {
    if (selectedInstructor === 'all') return schedules;
    return schedules.filter(s => s.instructor === selectedInstructor);
  }, [schedules, selectedInstructor]);

  const telemetryStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    let totalPresentToday = 0;
    let manualCount = 0;
    let qrStaticCount = 0;
    let qrDynamicCount = 0;
    let portalCount = 0;
    
    const checkinTimes: number[] = []; // minutes from midnight
    
    students.forEach(s => {
      const history = s.attendanceHistory || [];
      const todayRecords = history.filter(r => r.date === today && !r.isDeleted);
      if (todayRecords.length > 0) {
        totalPresentToday += todayRecords.length;
        todayRecords.forEach(rec => {
          const method = rec.checkinMethod || '';
          const origin = rec.origin || '';
          
          if (method === 'manual' || origin === 'MANUAL_PROFESSOR') {
            manualCount++;
          } else if (method === 'qr_static') {
            qrStaticCount++;
          } else if (method === 'qr_dynamic') {
            qrDynamicCount++;
          } else if (method === 'portal' || origin === 'PORTAL_ALUNO') {
            portalCount++;
          } else {
            qrStaticCount++; // default/fallback
          }
          
          if (rec.timestamp) {
            const timeObj = new Date(rec.timestamp);
            checkinTimes.push(timeObj.getHours() * 60 + timeObj.getMinutes());
          }
        });
      }
    });
    
    let formattedAvgTime = '--:--';
    if (checkinTimes.length > 0) {
      const avgMinutes = checkinTimes.reduce((a, b) => a + b, 0) / checkinTimes.length;
      const hours = Math.floor(avgMinutes / 60);
      const mins = Math.floor(avgMinutes % 60);
      formattedAvgTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    let peakHour = "Sem registros";
    if (checkinTimes.length > 0) {
      const buckets: Record<number, number> = {};
      checkinTimes.forEach(t => {
        const h = Math.floor(t / 60);
        buckets[h] = (buckets[h] || 0) + 1;
      });
      let maxHr = 19;
      let maxCount = 0;
      Object.entries(buckets).forEach(([hr, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxHr = parseInt(hr);
        }
      });
      peakHour = `${maxHr.toString().padStart(2, '0')}:00h - ${(maxHr + 1).toString().padStart(2, '0')}:00h`;
    }
    
    return {
      totalPresentToday,
      manualCount,
      qrStaticCount,
      qrDynamicCount,
      portalCount,
      formattedAvgTime,
      peakHour
    };
  }, [students]);

  // Sync state for students manual checklist when list is loaded
  useEffect(() => {
    const defaultState: typeof manualStatusState = {};
    filtered.forEach(s => {
      // unless already in state, default to awaiting checking/not present yet
      if (!manualStatusState[s.id]) {
        defaultState[s.id] = { status: 'present', notes: '' };
      }
    });
    if (Object.keys(defaultState).length > 0) {
      setManualStatusState(prev => ({ ...defaultState, ...prev }));
    }
  }, [filtered]);

  // QR Scanning Logic
  const studentsRef = useRef(students);
  const manualStatusStateRef = useRef(manualStatusState);

  useEffect(() => {
    studentsRef.current = students;
    manualStatusStateRef.current = manualStatusState;
  }, [students, manualStatusState]);

  useEffect(() => {
    if (mode === 'scanner') {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false);
      
      scanner.render((decodedText) => {
        // Handle student scanning their QR code
        if (decodedText.startsWith('SYSBJJ-STUDENT-')) {
          const studentId = decodedText.split('-STUDENT-')[1];
          const student = studentsRef.current.find(s => s.id === studentId);
          if (student) {
            setLastCheckedStudent(student);
            
            // Get kiosk userAgent details
            const ua = navigator.userAgent;
            let browser = 'Unknown Browser';
            let os = 'Unknown OS';
            if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
            else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
            else if (ua.indexOf('Safari') > -1) browser = 'Safari';
            else if (ua.indexOf('Edge') > -1) browser = 'Edge';

            if (ua.indexOf('Windows') > -1) os = 'Windows';
            else if (ua.indexOf('Macintosh') > -1) os = 'macOS';
            else if (ua.indexOf('Android') > -1) os = 'Android';
            else if (ua.indexOf('iPhone') > -1 || os.indexOf('iPad') > -1) os = 'iOS';

            const storedKioskId = localStorage.getItem('sysbjj_kiosk_device_id') || `KIOSK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
            localStorage.setItem('sysbjj_kiosk_device_id', storedKioskId);

            // Record attendance right away with advanced auditing info
            recordAttendance(
              [studentId], 
              undefined, 
              selectedClassId !== 'all' ? selectedClassId : undefined, 
              "Check-in via Leitor de QR Code no Totem do Receptor",
              { 
                origin: 'QR_CODE',
                checkinMethod: 'qr_dynamic',
                deviceInfo: {
                  device: `Dojo Receptor Token Kiosk - ${os}`,
                  ip: "192.168.1.100", // IP local do terminal receptor
                  browser,
                  os,
                  deviceId: storedKioskId
                },
                registeredBy: {
                  email: 'sensei@sysbjj.dev',
                  name: 'Recepção Automatizada',
                  role: 'Totem Kiosk'
                }
              }
            );

            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            audio.play().catch(() => {});
            
            setTimeout(() => setLastCheckedStudent(null), 3000);
          }
        }
      }, (error) => {
        // fail silently
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
  }, [mode, selectedClassId]);

  // Geoprocessing & GPS center calibration functions
  const calibrateGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("Seu celular/computador não suporta geolocalização.");
      return;
    }

    setCalibratingGps(true);
    setGpsMessage("Carregando sinal dos satélites (GPS)...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setCalibratedLat(lat);
        setCalibratedLng(lng);
        setCalibratingGps(false);
        setGpsMessage(`Célula sincronizada com precisão! Lat: ${lat}, Lng: ${lng}`);
        
        // Mock profile update logic in local context or warning
        logAction(
          'Georreferenciamento Calibrado', 
          `Calibração do Dojo salva no terminal: Lat ${lat} / Lng ${lng} • Raio tolerado: ${calibratedRadius}m`, 
          'Security'
        );
      },
      (error) => {
        setCalibratingGps(false);
        setGpsMessage(`Falha no GPS: ${error.message}. Por favor, permita o acesso para calibrar.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleTestGeofence = () => {
    if (!navigator.geolocation) return;
    setLocationStatus('verifying');
    
    navigator.geolocation.getCurrentPosition((position) => {
      const deviceLat = position.coords.latitude;
      const deviceLng = position.coords.longitude;
      setScannedCoordinates({ lat: deviceLat, lng: deviceLng });
      
      const targetLat = calibratedLat || -23.55052; // Default mock SP if fail
      const targetLng = calibratedLng || -46.633308;
      
      // Calculate distance (Haversine formula in meters)
      const R = 6371e3;
      const phi1 = deviceLat * Math.PI/180;
      const phi2 = targetLat * Math.PI/180;
      const deltaPhi = (targetLat - deviceLat) * Math.PI/180;
      const deltaLambda = (targetLng - deviceLng) * Math.PI/180;

      const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      if (distance <= calibratedRadius) {
        setLocationStatus('success');
      } else {
        setLocationStatus('fail');
        alert(`Fora do raio tolerado! Distância calculada: ${Math.round(distance)}m. Raio máximo: ${calibratedRadius}m.`);
      }
    }, () => {
      setLocationStatus('fail');
    });
  };

  // Static Dojo reception QR Code seed update selector
  const handleRegenerateStaticQR = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setStaticQRSeed(newSeed);
    localStorage.setItem('sysbjj_static_qr_seed', newSeed);
    alert("Código estático de presença do Dojo atualizado! Alunos precisam ler o QR atualizado a partir deste momento.");
    
    logAction('Ecosystem Security Token Updated', 'Chave estática de presença do Dojo foi reajustada para coatar prints antigos.', 'User');
  };

  // Facial enrollment mock sandbox
  const handleStartFacialEnroll = (student: Student) => {
    setActiveFaceRegisterStudent(student);
    setIsFaceCameraActive(true);
    setFaceScanPercent(0);
    setFaceEnrollSuccess(false);

    // Turn on dummy camera stream
    setTimeout(() => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(e => console.log(e));
            }
          }).catch(err => {
            console.log("No camera permission, fallback to simulator", err);
          });
      }
    }, 100);
  };

  // Scan facial enrollment progress simulation
  useEffect(() => {
    let interval: any;
    if (isFaceCameraActive && faceScanPercent < 100) {
      interval = setInterval(() => {
        setFaceScanPercent(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setFaceEnrollSuccess(true);
            
            // update local student meta
            if (activeFaceRegisterStudent) {
              updateStudent(activeFaceRegisterStudent.id, {
                // mock adding biometric facematch key matrix
                photoUrl: activeFaceRegisterStudent.photoUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${activeFaceRegisterStudent.name}`
              } as any);

              logAction('Facial Signature Enrolled', `Biometria e confiança facial computada para o Aluno ${activeFaceRegisterStudent.name}`, 'User');
            }
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isFaceCameraActive, faceScanPercent]);

  const closeFaceCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsFaceCameraActive(false);
    setActiveFaceRegisterStudent(null);
  };

  // Multi-status manual save call submission handler
  const handleSaveManualAttendance = async () => {
    const studentIdsToMark = Object.keys(manualStatusState);
    if (studentIdsToMark.length === 0) {
      alert("Nenhum guerreiro filtrado disponível para chamada.");
      return;
    }

    // Capture metadata for audits
    const deviceName = "Dojo Desktop Control Pad Map";
    const requestIP = "192.168.1.182"; 
    const professorEmail = 'sensei@sysbjj.dev';
    const classTitle = schedules.find(c => c.id === selectedClassId)?.title || "Tatame Geral";

    let counts = 0;
    // Iterate and save entries individually with detailed customProps
    for (const id of studentIdsToMark) {
      const row = manualStatusState[id];
      if (row) {
        counts++;
        await recordAttendance(
          [id],
          undefined,
          selectedClassId !== 'all' ? selectedClassId : undefined,
          row.notes || `Presença inserida no cronograma de aula: ${classTitle}`,
          {
            status: row.status,
            origin: 'MANUAL_PROFESSOR',
            checkinMethod: 'manual',
            deviceInfo: { 
              device: `${deviceName} - Admin`, 
              ip: requestIP,
              browser: 'Chrome/SenseiDojo',
              os: 'Desktop macOS/Windows'
            },
            registeredBy: { email: professorEmail, name: profile?.name || 'Sensei', role: 'Professor Principal' }
          }
        );
      }
    }

    setIsSaved(true);
    setSessionNotes('');
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Helper toggle specific student manual status
  const updateManualStateStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'trial') => {
    setManualStatusState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const updateManualStateNotes = (studentId: string, notes: string) => {
    setManualStatusState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  // Static Token QR code used for receptor checkin
  const receptorQRCodeValue = `SYSBJJ-DOJO-STATIC-RECEPTION-${profile.academyName.replace(/\s+/g, '-') || 'ACADEMY'}-${staticQRSeed}`;

  // MAIN TAB switcher page renderer selector
  if (activeTab === 'history') {
    return (
      <div className="space-y-6">
        <div className="flex border-b border-slate-200/40 dark:border-white/5 pb-4 max-w-7xl mx-auto px-4 sm:px-6 items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">Controle do Tatame</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Análises detalhadas do fluxo de treino</p>
          </div>
          <button 
            onClick={() => setActiveTab('record')} 
            className="px-5 py-3 text-[10px] bg-slate-900 text-white dark:bg-slate-800 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <ListChecks size={14} />
            <span>Voltar para Realizar Chamada</span>
          </button>
        </div>
        <AttendanceHistory />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 px-4 sm:px-6 relative">
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 border-b border-slate-100 dark:border-slate-800/50 pb-6">
        <div className="animate-in slide-in-from-left duration-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 italic">ÁREA DO PROFESSOR</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none italic">CONTROLE INTEGRADO DE PRESENÇA</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest mt-2 text-[9px] flex items-center gap-1.5">
            <LayoutGrid size={12} />
            Efetue chamadas manuais inteligentes, configure QR recepção e calibração de geoprocessamento.
          </p>
        </div>

        {/* Tab switcher Deck */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab('history')}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Eye size={14} />
            <span>Ver Métricas & Histórico Completo</span>
          </button>

          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.8rem] flex items-center gap-1.5 shadow-inner border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setMode('manual')}
              className={`px-5 py-3 rounded-2xl flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer ${mode === 'manual' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserPlus size={13} />
              Manual Call
            </button>
            <button 
              onClick={() => setMode('scanner')}
              className={`px-5 py-3 rounded-2xl flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer ${mode === 'scanner' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Scan size={13} />
              Scanner Kiosk
            </button>
            <button 
              onClick={() => setMode('station')}
              className={`px-5 py-3 rounded-2xl flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer ${mode === 'station' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Tablet size={13} />
              Dojo Reception QR
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic notifications inside turn */}
      <AnimatePresence>
        {isSaved && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 bg-emerald-500 text-white rounded-3xl font-sans uppercase font-black text-[9px] tracking-widest flex items-center gap-3 shadow-xl"
          >
            <CheckCircle className="shrink-0" />
            Chamada realizada e logs de auditoria gravados em sincronia com o servidor de banco de dados!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main interactive operational content (Left Side - occupies 2/3) */}
        <div className="lg:w-2/3 space-y-6">
          
          {/* Mode Manual: Advanced Call Sheets */}
          {mode === 'manual' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Planilha Diária de Chamada</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Marque presença, atrasos, faltas ou experimentais individualmente.</p>
                </div>
                <button 
                  onClick={handleSaveManualAttendance}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Save size={14} />
                  Salvar Registro Inteiro
                </button>
              </header>

              {/* Class scheduler level filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Filtrar por Instrutor</label>
                  <select 
                    value={selectedInstructor}
                    onChange={e => setSelectedInstructor(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
                  >
                    <option value="all">Todos os Sanseis</option>
                    {instructors.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Selecionar Turma</label>
                  <select 
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
                  >
                    <option value="all">Horário Livre / Geral</option>
                    {filteredSchedules.map(sch => (
                      <option key={sch.id} value={sch.id}>{sch.time} - {sch.title} ({sch.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Busca Aluno</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Pesquisar combatente..."
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance student spreadsheet cells list */}
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl space-y-3">
                    <AlertCircle className="mx-auto text-slate-300" size={32} />
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Nenhum aluno ativo encontrado para esta turma.</p>
                  </div>
                ) : (
                  filtered.map(student => {
                    const studentState = manualStatusState[student.id] || { status: 'present', notes: '' };
                    
                    return (
                      <div 
                        key={student.id}
                        className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-950 rounded-xl overflow-hidden font-black text-sm text-white flex items-center justify-center shrink-0">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name[0]
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                              <span>{student.name}</span>
                              <span className="text-[7px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-black mt-0.5">{student.belt ? student.belt.toUpperCase() : 'BRANCA'}</span>
                            </p>
                            <p className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-0.5">Última Presença: {student.lastAttendanceDate || 'Nenhum registro'}</p>
                          </div>
                        </div>

                        {/* Interactive presence cells */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { key: 'present', label: 'PRESENTE', color: 'bg-green-600' },
                            { key: 'late', label: 'ATRASADO', color: 'bg-amber-500' },
                            { key: 'trial', label: 'EXPERIMENTAL', color: 'bg-purple-600' },
                            { key: 'absent', label: 'FALTA', color: 'bg-red-600' }
                          ].map(opt => (
                            <button 
                              key={opt.key}
                              onClick={() => updateManualStateStatus(student.id, opt.key as any)}
                              className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                studentState.status === opt.key 
                                  ? `${opt.color} text-white shadow-md` 
                                  : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Notes insertion sheet */}
                        <div className="w-full md:w-44 shrink-0">
                          <input 
                            type="text" 
                            placeholder="Obs. técnica..."
                            value={studentState.notes}
                            onChange={e => updateManualStateNotes(student.id, e.target.value)}
                            className="w-full text-[10px] font-black uppercase px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Mode Scanner check-in reader station */}
          {mode === 'scanner' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Quiosque de Presença do Aluno</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Aponte o QR Code do Portal do Aluno para a camera integrada à direita.</p>
              </div>

              <div className="max-w-md mx-auto aspect-square bg-slate-950 dark:bg-slate-950 rounded-[2.5rem] overflow-hidden relative flex flex-col items-center justify-center p-6 border-4 border-slate-900 shadow-2xl">
                <div id="reader" className="w-full h-full bg-transparent overflow-hidden" />
                <div className="absolute inset-0 border-2 border-dashed border-blue-500 m-8 rounded-[1.5rem] pointer-events-none anime-pulse flex items-center justify-center">
                  <span className="text-[8px] bg-blue-500/80 backdrop-blur text-white px-3 py-1 rounded-full font-black tracking-widest uppercase">SCANNER ATIVO</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode Static Dojo QR Kiosk Station desk */}
          {mode === 'station' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">QR Code Fixo do Dojo</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Imprima ou configure este QR Code na recepção. O Aluno abre o portal e confirma a validação.</p>
              </div>

              <div className="max-w-xs mx-auto bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-950 p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white rounded-3xl shadow-md">
                  <QRCodeCanvas 
                    value={receptorQRCodeValue} 
                    size={200}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black tracking-tight text-slate-900 dark:text-white uppercase">QR CODE ATIVO DE RECEPÇÃO</p>
                  <p className="text-[8px] font-mono font-black text-slate-400 truncate max-w-[180px]">{receptorQRCodeValue}</p>
                </div>
              </div>

              <button 
                onClick={handleRegenerateStaticQR}
                className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 hover:dark:bg-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                <RefreshCw size={14} className="animate-spin duration-3000" />
                Regerar Token de Segurança
              </button>
            </div>
          )}
        </div>

        {/* Right side helper configurations/widgets panel (Occupies 1/3) */}
        <div className="lg:w-1/3 space-y-6">
          
          {/* Geoprocessing GPS perimeter configuration map card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <header className="flex items-center gap-2">
              <MapPin className="text-blue-600 shrink-0" size={18} />
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Calibrador Geofencing</h3>
            </header>

            <p className="text-[10px] text-slate-400 uppercase tracking-tight font-black leading-relaxed">
              Limite a validação de presença do aluno ao raio da academia. Calibre o perímetro com a sua localização em tempo real.
            </p>

            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Latitude Central (Dojo)</label>
                <input 
                  type="number" 
                  value={calibratedLat || ''} 
                  onChange={e => setCalibratedLat(e.target.value === '' ? null : parseFloat(e.target.value))}
                  placeholder="Ex: -23.55052"
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Longitude Central (Dojo)</label>
                <input 
                  type="number" 
                  value={calibratedLng || ''} 
                  onChange={e => setCalibratedLng(e.target.value === '' ? null : parseFloat(e.target.value))}
                  placeholder="Ex: -46.633308"
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block font-sans">Raio Máximo Tolerado</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={calibratedRadius} 
                    onChange={e => setCalibratedRadius(parseInt(e.target.value) || 100)}
                    placeholder="Metros..."
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-950 dark:text-white pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-slate-400">METROS</span>
                </div>
              </div>

              {gpsMessage && (
                <div className="p-3 bg-slate-900 dark:bg-black rounded-lg text-[8px] font-bold text-slate-300 font-mono leading-relaxed truncate antialiased">
                  {gpsMessage}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button 
                onClick={calibrateGpsLocation}
                disabled={calibratingGps}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10"
              >
                <Compass size={12} className={calibratingGps ? "animate-spin" : ""} />
                Sincronizar Localização (Sinal GPS)
              </button>

              <button 
                onClick={handleTestGeofence}
                className="w-full py-3.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles size={12} />
                Testar Geolocalização de Presença
              </button>
            </div>
          </div>

          {/* Facial Enrollment visual configuration Sandbox card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <header className="flex items-center gap-2">
              <Camera className="text-blue-600 shrink-0" size={18} />
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Reconhecimento Facial</h3>
            </header>

            <p className="text-[10px] text-slate-400 uppercase tracking-tight font-black leading-relaxed">
              Habilite o cadastro biométrico facial sandbox dos combatentes para check-in por imagem de selfie e facematch de segurança.
            </p>

            <div className="space-y-3">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">ESCOLHER ALUNO</label>
              <div className="max-h-44 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                {activeStudents.slice(0, 8).map(st => (
                  <div key={st.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs">
                    <span className="truncate uppercase font-bold text-slate-900 dark:text-white text-[10px] max-w-[120px]">{st.name}</span>
                    <button 
                      onClick={() => handleStartFacialEnroll(st)}
                      className="px-2.5 py-1 text-[8px] bg-slate-900 text-white hover:bg-slate-800 rounded-md font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      CADASTRAR FACE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TELEMETRIA DE TATAME EM TEMPO REAL PANEL */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3.5rem] shadow-2xl text-white space-y-6">
            <header className="flex items-center gap-2">
              <Sparkles className="text-blue-500 animate-pulse shrink-0" size={18} />
              <h3 className="text-lg font-black uppercase tracking-tighter italic">Telemetria de Tatame</h3>
            </header>
            
            <p className="text-[10px] text-slate-400 uppercase tracking-tight font-black leading-relaxed">
              Métricas consolidadas de recepção, fluxo de entrada e distribuição de frequência em tempo real hoje.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex flex-col justify-between">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Inscritos Hoje</span>
                <span className="text-3xl font-black font-mono tracking-tighter text-blue-500 mt-2">{telemetryStats.totalPresentToday} <span className="text-[10px] uppercase font-sans text-slate-500">Alunos</span></span>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex flex-col justify-between">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Entrada Média</span>
                <span className="text-2xl font-black font-mono tracking-tighter text-white mt-2">{telemetryStats.formattedAvgTime}</span>
              </div>
            </div>
            
            <div className="space-y-3.5 bg-slate-950 p-5 rounded-2xl border border-white/5">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">Distribuição de Entrada (Picos)</h4>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400">Pico Estimado</span>
                <span className="font-mono text-white uppercase">{telemetryStats.peakHour}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400">Status Geral do Tatame</span>
                <span className="font-mono text-emerald-400 uppercase">Perfeito & Operante</span>
              </div>
            </div>
            
            <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-white/5">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">Método de Validação</h4>
              <div className="space-y-2.5">
                {[
                  { label: "Check-in Manual", val: telemetryStats.manualCount, total: telemetryStats.totalPresentToday, color: "bg-blue-500" },
                  { label: "QR Estático Seguro", val: telemetryStats.qrStaticCount, total: telemetryStats.totalPresentToday, color: "bg-violet-500" },
                  { label: "QR Dinâmico (Totem)", val: telemetryStats.qrDynamicCount, total: telemetryStats.totalPresentToday, color: "bg-emerald-500" },
                  { label: "Portal e GPS", val: telemetryStats.portalCount, total: telemetryStats.totalPresentToday, color: "bg-amber-500" }
                ].map((item, idx) => {
                  const percent = item.total > 0 ? (item.val / item.total) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[8.5px] font-black uppercase text-slate-400">
                        <span>{item.label}</span>
                        <span>{item.val} ({Math.round(percent)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkin / Geofencing Verification popup animator */}
      <AnimatePresence>
        {lastCheckedStudent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 max-w-sm w-full border border-slate-200 dark:border-slate-800 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] mx-auto text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle size={48} className="animate-bounce" />
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">CHECK-IN CONFIRMADO</p>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">{lastCheckedStudent.name}</h3>
                <p className="text-[10px] uppercase font-bold text-slate-400">Graduação: {lastCheckedStudent.belt || 'Branca'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-sans uppercase font-black text-[8px] tracking-widest">
                Via Kiosk Scanner • {new Date().toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Facial biometric record sandbox enroll visual camera guide */}
      <AnimatePresence>
        {isFaceCameraActive && activeFaceRegisterStudent && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6"
            >
              <header className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                  <Camera size={18} />
                  Cadastrar Assinatura Facial
                </h3>
                <button 
                  onClick={closeFaceCamera}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X />
                </button>
              </header>

              <p className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">
                Aluno: {activeFaceRegisterStudent.name} • Alinhe o rosto no centro da máscara de captura.
              </p>

              {/* Camera interface element preview simulation */}
              <div className="relative aspect-square w-full bg-slate-950 rounded-[2.5rem] overflow-hidden border-2 border-slate-800 flex items-center justify-center max-w-xs mx-auto">
                <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
                
                {/* Facial scanning vector guide mesh overlays */}
                <div className="absolute inset-0 border-4 border-slate-900/60 rounded-[2.5rem] pointer-events-none flex items-center justify-center">
                  <div className={`w-40 h-52 rounded-[3.5rem] border-3 ${faceEnrollSuccess ? 'border-emerald-500 animate-pulse' : 'border-blue-500 animate-pulse'} pointer-events-none flex flex-col items-center justify-center`}>
                    <span className="text-[7px] text-white bg-slate-900/80 px-2 py-0.5 rounded font-black uppercase tracking-widest mt-auto mb-4">{faceEnrollSuccess ? '98.4% CONFIDENT' : 'ESCANEANDO_'}</span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-wider text-white">
                  {faceEnrollSuccess ? "Biometria Mapeada" : `Mapeando Matriz Facial: ${faceScanPercent}%`}
                </div>
              </div>

              {faceEnrollSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  Assinatura Cadastrada no Banco de Dados Biométricos!
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button 
                  onClick={closeFaceCamera} 
                  className="px-5 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                {faceEnrollSuccess && (
                  <button 
                    onClick={closeFaceCamera} 
                    className="px-6 py-3 text-[10px] font-black uppercase text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                  >
                    Concluir e Salvar Biometria
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendancePage;
