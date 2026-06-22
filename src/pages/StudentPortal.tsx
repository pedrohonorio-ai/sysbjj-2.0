
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, Flame, Calendar, BookOpen, Ticket, Printer,
  ArrowRight, Shield, Zap, Plus, LogOut, Scale, Gamepad2, Award, Play,
  QrCode, Clock, Info, Camera, CheckCircle2, AlertTriangle, X, Copy, Image as ImageIcon, Download, Maximize2,
  RefreshCw, FileText, Upload, ShieldCheck, AlertCircle, ShieldAlert, ChevronRight,
  Map, Star, Users2, Medal, Presentation, ClipboardCheck, GraduationCap, Check,
  CreditCard, Video, ExternalLink, MessageSquare, Cake, TrendingUp, Users,
  Target, Dumbbell, Activity, ClipboardList, Timer, Pause, RotateCcw,
  MapPin
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useData } from '../contexts/DataContext.js';
import { useProfile } from '../contexts/ProfileContext.js';
import { useAuth } from '../context/AuthContext.js';
import { StudentStatus, GalleryImage, BeltColor, KidsBeltColor } from '../types.js';
import { BELT_COLORS, IBJJF_BELT_RULES } from '../constants/index.js';
import { IBJJF_LESSONS, RuleLesson, RuleScenario, IBJJF_REFERENCE } from '../constants/rulesData.js';
import ReactMarkdown from 'react-markdown';

import { 
  ResponsiveContainer, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import CryptoJS from 'crypto-js';

const getIBJJFRealTimeCategory = (birthDate: string, t: any): {
  category: string;
  age: number;
  nextCategory: string;
  whenChanges: string;
} => {
  if (!birthDate) return { category: t('common.notInformed', 'Não informada'), age: 0, nextCategory: '--', whenChanges: '--' };
  const birthYear = new Date(birthDate).getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();
  const age = currentYear - birthYear; // IBJJF is based on birth year
  
  let categoryLabel = 'Pré-Mirim';
  let nextCategoryLabel = 'Mirim I';
  let changeAge = 6;
  
  if (age < 4) {
    categoryLabel = t('portal.category.preMirimKids', 'Pré-Mirim (Menor de 4)');
    nextCategoryLabel = t('portal.category.preMirim', 'Pré-Mirim');
    changeAge = 4;
  } else if (age >= 4 && age <= 5) {
    categoryLabel = t('portal.category.preMirim', 'Pré-Mirim');
    nextCategoryLabel = t('portal.category.mirimI', 'Mirim I');
    changeAge = 6;
  } else if (age >= 6 && age <= 7) {
    categoryLabel = t('portal.category.mirimI', 'Mirim I');
    nextCategoryLabel = t('portal.category.mirimII', 'Mirim II');
    changeAge = 8;
  } else if (age >= 8 && age <= 9) {
    categoryLabel = t('portal.category.mirimII', 'Mirim II');
    nextCategoryLabel = t('portal.category.infantilI', 'Infantil I');
    changeAge = 10;
  } else if (age >= 10 && age <= 11) {
    categoryLabel = t('portal.category.infantilI', 'Infantil I');
    nextCategoryLabel = t('portal.category.infantilII', 'Infantil II');
    changeAge = 12;
  } else if (age >= 12 && age <= 13) {
    categoryLabel = t('portal.category.infantilII', 'Infantil II');
    nextCategoryLabel = t('portal.category.juvenil', 'Juvenil');
    changeAge = 14;
  } else if (age >= 14 && age <= 15) {
    categoryLabel = t('portal.category.juvenil', 'Juvenil');
    nextCategoryLabel = t('portal.category.juvenilAdult', 'Juvenil (Adulto)');
    changeAge = 16;
  } else if (age >= 16 && age <= 17) {
    categoryLabel = t('portal.category.juvenilAdult', 'Juvenil (Adulto)');
    nextCategoryLabel = t('portal.category.adult', 'Adulto');
    changeAge = 18;
  } else if (age >= 18 && age <= 29) {
    categoryLabel = t('portal.category.adult', 'Adulto');
    nextCategoryLabel = t('portal.category.master1', 'Master 1');
    changeAge = 30;
  } else if (age >= 30 && age <= 35) {
    categoryLabel = t('portal.category.master1', 'Master 1');
    nextCategoryLabel = t('portal.category.master2', 'Master 2');
    changeAge = 36;
  } else if (age >= 36 && age <= 40) {
    categoryLabel = t('portal.category.master2', 'Master 2');
    nextCategoryLabel = t('portal.category.master3', 'Master 3');
    changeAge = 41;
  } else if (age >= 41 && age <= 45) {
    categoryLabel = t('portal.category.master3', 'Master 3');
    nextCategoryLabel = t('portal.category.master4', 'Master 4');
    changeAge = 46;
  } else if (age >= 46 && age <= 50) {
    categoryLabel = t('portal.category.master4', 'Master 4');
    nextCategoryLabel = t('portal.category.master5', 'Master 5');
    changeAge = 51;
  } else {
    categoryLabel = t('portal.category.master5', 'Master 5');
    nextCategoryLabel = t('portal.category.maxLevel', 'Nível Máximo');
    changeAge = 999;
  }

  const yearsLeft = changeAge - age;
  let whenChanges = '';
  if (changeAge === 999) {
    whenChanges = t('portal.maxMasterReached', 'Categoria Master máxima atingida');
  } else {
    const changeYear = birthYear + changeAge;
    const yearWord = yearsLeft === 1 ? t('common.year', 'ano') : t('common.years', 'anos');
    whenChanges = t('portal.changesInYear', `Em ${changeYear} (em ${yearsLeft} ${yearWord})`);
  }

  return { category: categoryLabel, age, nextCategory: nextCategoryLabel, whenChanges };
};

const getCategoryBadgeStyle = (category: string) => {
  if (category.startsWith('Pré-Mirim') || category.startsWith('Mirim')) {
    return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20';
  }
  if (category.startsWith('Infantil')) {
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
  }
  if (category.startsWith('Juvenil')) {
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
  }
  if (category.startsWith('Adulto')) {
    return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
  }
  if (category.startsWith('Master')) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
  }
  return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const getMonthlyPresenceStats = (history: { date: string }[]) => {
  if (!history) return { currentMonthTotal: 0, previousMonthTotal: 0, diff: 0, presentDaysSet: new Set<number>(), daysInMonth: 30, monthName: '' };
  
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const currentMonthIdx = today.getUTCMonth(); // 0-11
  
  // Previous month idx
  let prevMonthIdx = currentMonthIdx - 1;
  let prevYear = currentYear;
  if (prevMonthIdx < 0) {
    prevMonthIdx = 11;
    prevYear = currentYear - 1;
  }
  
  let currentMonthTotal = 0;
  let previousMonthTotal = 0;
  const presentDaysSet = new Set<number>();
  
  history.forEach(item => {
    const itemDate = new Date(item.date);
    const itemYear = itemDate.getUTCFullYear();
    const itemMonth = itemDate.getUTCMonth();
    const itemDay = itemDate.getUTCDate();
    
    if (itemYear === currentYear && itemMonth === currentMonthIdx) {
      currentMonthTotal++;
      presentDaysSet.add(itemDay);
    } else if (itemYear === prevYear && itemMonth === prevMonthIdx) {
      previousMonthTotal++;
    }
  });
  
  const diff = currentMonthTotal - previousMonthTotal;
  
  // Get all days of current month to build the calendar grid
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });
  
  return {
    currentMonthTotal,
    previousMonthTotal,
    diff,
    presentDaysSet,
    daysInMonth,
    monthName
  };
};

const getYoutubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  try {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    } else {
      return url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (e) {
    console.error('Error parsing youtube URL', e);
  }
  return url;
};

const StudentPortal: React.FC = () => {
  const { code: routeCode } = useParams();
  const { loading: authLoading, studentCode } = useAuth();
  const code = routeCode || studentCode;
  const navigate = useNavigate();
  const { t, tObj } = useTranslation();
  const { students, recordAttendance, gallery, payments, addGalleryImage, addReceipt, completeRuleLesson, logs, graduationHistory, schedules, products = [], updateProduct } = useData();
  const { profile } = useProfile();
  const student = useMemo(() => students.find(s => s.portalAccessCode?.toUpperCase() === code?.toUpperCase()), [students, code]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'training' | 'knowledge' | 'community' | 'wallet' | 'gallery' | 'homeTraining' | 'timer' | 'rules' | 'raffle'>('home');
  const [selectedModality, setSelectedModality] = useState<'bjj' | 'capoeira' | 'muay_thai' | 'mma' | 'judo' | 'kickboxing'>('bjj');
  const [qrRotaryToken, setQrRotaryToken] = useState('SYSBJJ-SECURE-INIT-HASH');
  const [qrCountdown, setQrCountdown] = useState(30);
  const [capoeiraBeats, setCapoeiraBeats] = useState<string[]>([]);
  const [rulesSubTab, setRulesSubTab] = useState<'regulations' | 'library'>('library');
  const [timerTimeLeft, setTimerTimeLeft] = useState(300);
  const [timerIsRunning, setTimerIsRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timerIsRunning && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timerTimeLeft === 0) {
      setTimerIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerIsRunning, timerTimeLeft]);

  const resetTimer = () => {
    setTimerIsRunning(false);
    setTimerTimeLeft(300);
  };
  const [showScanner, setShowScanner] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [showWorkoutSavedToast, setShowWorkoutSavedToast] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'guard' | 'pass' | 'takedown' | 'defense' | 'submission'>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bjj_library_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('bjj_library_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const [showPix, setShowPix] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [raffleSubTab, setRaffleSubTab] = useState<'board' | 'cartela'>('board');

  // Requirement 5 - Geolocation and Manuel Check-In States
  const [geoChecking, setGeoChecking] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState(false);

  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState(false);

  const [selectedCheckinClassId, setSelectedCheckinClassId] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const hasCheckedInToday = useMemo(() => {
    return student?.attendanceHistory?.some((a: any) => a.date === todayStr);
  }, [student, todayStr]);

  const todayCheckinRecord = useMemo(() => {
    return student?.attendanceHistory?.find((a: any) => a.date === todayStr);
  }, [student, todayStr]);

  const todayCheckinClass = useMemo(() => {
    if (!todayCheckinRecord || !schedules) return null;
    return schedules.find((s: any) => s.id === todayCheckinRecord.classId);
  }, [todayCheckinRecord, schedules]);

  const todayClasses = useMemo(() => {
    if (!schedules) return [];
    const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const currentDayName = daysMap[new Date().getDay()];
    return schedules.filter((s: any) => s.days && s.days.includes(currentDayName));
  }, [schedules]);

  // Set initial selected checkin class based on active schedule or first class of today
  useEffect(() => {
    if (todayClasses.length > 0 && !selectedCheckinClassId) {
      const activeSched = checkActiveSchedule();
      if (activeSched.active && activeSched.matchingClassId) {
        setSelectedCheckinClassId(activeSched.matchingClassId);
      } else {
        setSelectedCheckinClassId(todayClasses[0].id);
      }
    }
  }, [todayClasses, selectedCheckinClassId]);

  const handleQuickCheckinSubmit = (classId: string) => {
    if (!student) return;
    const sched = schedules?.find((sc: any) => sc.id === classId);
    const className = sched ? sched.title : 'Treino Livre';
    
    const audit = getAuditInfo();
    recordAttendance(
      [student.id],
      undefined,
      classId,
      `Check-In Rápido Confirmado (${className})`,
      {
        origin: 'PORTAL_ALUNO',
        checkinMethod: 'portal',
        deviceInfo: {
          device: `${audit.os} / ${audit.browser}`,
          browser: audit.browser,
          os: audit.os,
          deviceId: audit.deviceId,
          ip: "186.230.12.98"
        }
      }
    );
    
    setCheckinSuccess(true);
    
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.play().catch(() => {});
    
    setTimeout(() => {
      setCheckinSuccess(false);
    }, 4000);
  };

  const getAuditInfo = () => {
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
    else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';

    let storedId = localStorage.getItem('sysbjj_device_id');
    if (!storedId) {
      storedId = 'DEV-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      localStorage.setItem('sysbjj_device_id', storedId);
    }

    return { browser, os, deviceId: storedId };
  };

  const checkActiveSchedule = () => {
    if (!schedules || schedules.length === 0) {
      return { active: true, matchingClassId: undefined, title: "Treino Livre Geral" };
    }
    
    const now = new Date();
    const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const todayDay = daysMap[now.getDay()];
    
    const todaySchedules = schedules.filter(s => s.days && s.days.includes(todayDay));
    if (todaySchedules.length === 0) {
      return { active: false, error: "Nenhuma aula ativa agendada para hoje no dojo." };
    }
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const sched of todaySchedules) {
      const match = sched.time.match(/(\d{2}):(\d{2})/);
      if (match) {
        const h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const schedMin = h * 60 + m;
        
        // Window of +/- 90 minutes of class start tolerance
        if (Math.abs(currentMinutes - schedMin) <= 90) {
          return { active: true, matchingClassId: sched.id, title: sched.title };
        }
      }
    }
    
    return { active: false, error: "Nenhuma aula ativa cadastrada para este horário no Dojo (+/- 90min de tolerância)." };
  };

  const handleGeoCheckin = () => {
    if (!student) return;
    setGeoChecking(true);
    setGeoError(null);
    setGeoSuccess(false);

    if (!profile || !profile.latitude || !profile.longitude) {
      setGeoError("Geolocalização não configurada pelo professor");
      setGeoChecking(false);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError("Geolocalização não suportada pelo seu navegador");
      setGeoChecking(false);
      return;
    }

    const audit = getAuditInfo();
    const schedCheck = checkActiveSchedule();
    if (!schedCheck.active) {
      setGeoError(`Check-in Recusado: ${schedCheck.error}`);
      setGeoChecking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        const distance = calculateDistance(userLat, userLon, profile.latitude, profile.longitude);
        const radius = profile.geofenceRadius || 500;

        if (distance <= radius) {
          recordAttendance(
            [student.id], 
            undefined, 
            schedCheck.matchingClassId, 
            `Presença via Geofence GPS Ativo (Distânia: ${Math.round(distance)}m, Classe: ${schedCheck.title})`,
            {
              origin: 'PORTAL_ALUNO',
              checkinMethod: 'portal',
              gps: { latitude: userLat, longitude: userLon, distance },
              deviceInfo: {
                device: `${audit.os} / ${audit.browser}`,
                browser: audit.browser,
                os: audit.os,
                deviceId: audit.deviceId,
                ip: "186.230.12.98"
              }
            }
          );
          setGeoSuccess(true);
          setCheckinSuccess(true);
          setGeoChecking(false);

          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          audio.play().catch(() => {});

          setTimeout(() => {
            setCheckinSuccess(false);
            setGeoSuccess(false);
          }, 4000);
        } else {
          setGeoError(`Você está fora do raio da academia (${Math.round(distance)}m de distância, raio permitido: ${radius}m)`);
          setGeoChecking(false);
        }
      },
      (error) => {
        setGeoError("Erro ao obter sua localização. Ative o GPS/Permissões.");
        setGeoChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualCheckinSubmit = () => {
    if (!student) return;
    setManualError(null);
    setManualSuccess(false);
    
    const expected = (student.portalAccessCode || '').substring(0, 6).toUpperCase();
    if (manualCode.trim().toUpperCase() === expected) {
      const audit = getAuditInfo();
      const schedCheck = checkActiveSchedule();
      
      recordAttendance(
        [student.id],
        undefined,
        schedCheck.matchingClassId,
        `Check-in Manual digitado (${schedCheck.title})`,
        {
          origin: 'PORTAL_ALUNO',
          checkinMethod: 'portal',
          deviceInfo: {
            device: `${audit.os} / ${audit.browser}`,
            browser: audit.browser,
            os: audit.os,
            deviceId: audit.deviceId,
            ip: "186.230.12.98"
          }
        }
      );
      setManualSuccess(true);
      setCheckinSuccess(true);
      setManualCode('');
      setShowManualInput(false);
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.play().catch(() => {});

      setTimeout(() => {
        setCheckinSuccess(false);
        setManualSuccess(false);
      }, 4000);
    } else {
      setManualError("Código incorreto. Digite os 6 caracteres fornecidos pelo professor.");
    }
  };
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryImage | null>(null);
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [showWaiver, setShowWaiver] = useState(false);
  const [showMedicalUpload, setShowMedicalUpload] = useState(false);
  const [medicalFile, setMedicalFile] = useState<string | null>(null);
  const [medicalIssueDate, setMedicalIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const { updateStudent } = useData();

  const [workoutCounts, setWorkoutCounts] = useState<Record<string, number>>({});

  const handleRegisterWorkout = (sectionId: string) => {
    if (!student) return;
    
    const count = Object.values(workoutCounts).reduce((a, b) => a + b, 0);
    if (count === 0) return;

    const newPoints = (student.rewardPoints || 0) + 10;
    const newHistory = [
      ...(student.homeWorkoutHistory || []),
      { date: new Date().toISOString().split('T')[0], type: sectionId, count }
    ];

    updateStudent(student.id, { 
      rewardPoints: newPoints,
      homeWorkoutHistory: newHistory
    });

    setWorkoutCounts({});
    setShowWorkoutSavedToast(true);
    setTimeout(() => setShowWorkoutSavedToast(false), 4000);
  };

  const homeWorkouts = useMemo(() => [
    {
      id: 'core',
      title: t('portal.absSection'),
      icon: <Activity className="text-amber-500" />,
      exercises: [
        { name: 'Abdominal Supra (Crunches)', reps: '3 x 30', desc: 'Foco no abdômen superior.' },
        { name: 'Abdominal Infra (Leg Raises)', reps: '3 x 20', desc: 'Trabalho de abdômen inferior e core.' },
        { name: 'Prancha Isométrica (Plank)', reps: '3 x 1 min', desc: 'Estabilidade abdominal e lombar.' },
        { name: 'Bicicleta (Russian Twist)', reps: '3 x 40', desc: 'Trabalho de oblíquos.' }
      ]
    },
    {
      id: 'mobility',
      title: t('portal.mobilitySection'),
      icon: <RefreshCw className="text-blue-500" />,
      exercises: [
        { name: 'Fuga de Quadril (Hip Escape)', reps: '3 x 20/lado', desc: 'Movimento fundamental de defesa e reposição.' },
        { name: 'Rolamento de Ombro', reps: '10/lado', desc: 'Proteção cervical e agilidade no solo.' },
        { name: 'Ponte (Bridge)', reps: '3 x 15', desc: 'Kuzushi e potência de quadril.' },
        { name: 'Yoga BJJ (Cobra/Cachorro)', reps: '10 reps', desc: 'Flexibilidade de cadeia anterior e posterior.' }
      ]
    },
    {
      id: 'drills',
      title: t('portal.drillsSection'),
      icon: <Shield className="text-emerald-500" />,
      exercises: [
        { name: 'Triângulo no Ar', reps: '3 x 30', desc: 'Velocidade e coordenação de pernas.' },
        { name: 'Sprawl Solitário', reps: '3 x 15', desc: 'Defesa de queda e cárdio.' },
        { name: 'Mão no Chão / Passo de Lado', reps: '3 x 1 min', desc: 'Passagem de guarda e equilíbrio.' },
        { name: 'Entrada de Queda Sombra', reps: '3 x 10', desc: 'Mecânica de projeção.' }
      ]
    }
  ], [t]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && student) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateStudent(student.id, { photo: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Rotary secure QR token generator
  useEffect(() => {
    if (!student) return;
    const interval = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          // Re-generate rotary token
          const stamp = new Date().getTime();
          const hash = CryptoJS.SHA256(student.id + stamp.toString()).toString().substring(0, 24).toUpperCase();
          setQrRotaryToken(`SYSBJJ-${hash}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    // Initial token setup
    if (qrRotaryToken === 'SYSBJJ-SECURE-INIT-HASH') {
      const initHash = CryptoJS.SHA256(student.id + "init").toString().substring(0, 24).toUpperCase();
      setQrRotaryToken(`SYSBJJ-${initHash}`);
    }

    return () => clearInterval(interval);
  }, [student, qrRotaryToken]);

  const graduationAnalysis = useMemo(() => {
    if (!student) return null;
    const age = calculateAge(student.birthDate);
    const isKid = student.isKid || age < 16;
    const isBlackBelt = student.belt === BeltColor.BLACK || student.belt === BeltColor.RED_BLACK || student.belt === BeltColor.RED_WHITE || student.belt === BeltColor.RED;
    const kidsValues = KidsBeltColor ? Object.values(KidsBeltColor) : [];
    const adultValues = BeltColor ? Object.values(BeltColor) : [];
    const chain = (isKid ? kidsValues : adultValues) as any[];
    const currentIdx = chain.indexOf(student.belt);
    const nextBelt = currentIdx !== -1 && currentIdx < chain.length - 1 ? chain[currentIdx + 1] : (isKid ? 'Adulto' : 'Mestre');
    const futurePath = currentIdx !== -1 ? chain.slice(currentIdx + 1, currentIdx + 4) : [];
    
    let minMonths = 4;
    let attendanceThreshold = 30;
    let maxStripes = 4;
    
    if (!isKid) {
      const rule = (IBJJF_BELT_RULES as any)[student.belt as string];
      minMonths = rule?.minTimeMonths ?? 0;
      if (student.belt === 'Purple' && age === 17) minMonths = 12;
      
      if (student.belt === 'White') attendanceThreshold = 80;
      else if (student.belt === 'Blue') attendanceThreshold = 120;
      else if (student.belt === 'Purple') attendanceThreshold = 100;
      else if (student.belt === 'Brown') attendanceThreshold = 80;
      else if (student.belt === 'Black') attendanceThreshold = 60;
    }

    if (isBlackBelt) {
      maxStripes = 6;
      if (student.belt === 'Black') {
        if (student.stripes < 3) minMonths = 36;
        else minMonths = 60;
      } else if (student.belt === 'Red-Black' || student.belt === 'Red-White') {
        minMonths = 84;
      }
    }

    const today = new Date();
    const promo = new Date(student.lastPromotionDate + 'T12:00:00');
    let monthsInBelt = (today.getFullYear() - promo.getFullYear()) * 12 + (today.getMonth() - promo.getMonth());
    if (today.getDate() < promo.getDate()) monthsInBelt--;
    monthsInBelt = Math.max(0, monthsInBelt);

    let nextDegreeDate: string | null = null;
    if (isBlackBelt) {
      const nextDate = new Date(promo);
      nextDate.setMonth(nextDate.getMonth() + minMonths);
      nextDegreeDate = nextDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    }

    return {
      nextBelt: nextBelt as string,
      futurePath,
      monthsInBelt,
      minMonths,
      attendanceThreshold,
      isBlackBelt,
      maxStripes,
      nextDegreeDate,
      timeProgress: Math.min(100, (monthsInBelt / (minMonths || 1)) * 100),
      attendanceProgress: Math.min(100, (student.attendanceCount / (attendanceThreshold || 1)) * 100)
    };
  }, [student]);

  const [rankingBeltFilter, setRankingBeltFilter] = useState<string>('all');
  const [rankingClassFilter, setRankingClassFilter] = useState<string>('all');
  const [rankingMonthFilter, setRankingMonthFilter] = useState<number>(new Date().getMonth());
  const [rankingYearFilter, setRankingYearFilter] = useState<number>(new Date().getFullYear());

  const [currentRuleLessonId, setCurrentRuleLessonId] = useState<string | null>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: '', videoUrl: '', description: '' });

  const handleAddVideo = () => {
    if (student && newVideo.title && newVideo.videoUrl) {
      const videoData = {
        id: `VID-${Date.now()}`,
        ...newVideo,
        date: new Date().toISOString().split('T')[0],
        authorId: student.id,
        authorName: student.nickname || student.name
      };
      
      const updatedVideos = [...(student.positionVideos || []), videoData];
      updateStudent(student.id, { positionVideos: updatedVideos });
      
      setShowAddVideo(false);
      setNewVideo({ title: '', videoUrl: '', description: '' });
    }
  };

  const [quizMode, setQuizMode] = useState(false);
  const [scenarioMode, setScenarioMode] = useState(false);
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'answering' | 'correct' | 'wrong'>('idle');

  const currentLesson = useMemo(() => 
    IBJJF_LESSONS.find(l => l.id === currentRuleLessonId), 
  [currentRuleLessonId]);

  const currentScenario = useMemo(() => 
    currentLesson?.scenarios?.[currentScenarioIdx],
  [currentLesson, currentScenarioIdx]);

  const handleStartQuiz = () => {
    setQuizMode(true);
    setScenarioMode(false);
    setQuizState('answering');
    setSelectedOption(null);
  };

  const handleStartScenarios = () => {
    setScenarioMode(true);
    setQuizMode(false);
    setQuizState('answering');
    setSelectedOption(null);
    setCurrentScenarioIdx(0);
  };

  const handleAnswer = (index: number) => {
    if (!student || !currentLesson) return;
    setSelectedOption(index);
    
    let isCorrect = false;
    if (quizMode && currentLesson.questions?.[0]) {
      isCorrect = index === currentLesson.questions[0].correctAnswer;
    } else if (scenarioMode && currentScenario) {
      isCorrect = index === currentScenario.correctAnswer;
    }

    if (isCorrect) {
      setQuizState('correct');
      if (quizMode) {
        completeRuleLesson(student.id, currentLesson.id, currentLesson.points);
      } else if (scenarioMode) {
        // If it's the last scenario, complete the lesson
        if (currentScenarioIdx === (currentLesson.scenarios?.length || 0) - 1) {
          completeRuleLesson(student.id, currentLesson.id, currentLesson.points);
        }
      }
    } else {
      setQuizState('wrong');
    }
  };

  const handleNextScenario = () => {
    if (currentLesson?.scenarios && currentScenarioIdx < currentLesson.scenarios.length - 1) {
      setCurrentScenarioIdx(prev => prev + 1);
      setQuizState('answering');
      setSelectedOption(null);
    } else {
      handleCloseRuleDetail();
    }
  };

  const handleCloseRuleDetail = () => {
    setCurrentRuleLessonId(null);
    setQuizMode(false);
    setScenarioMode(false);
    setQuizState('idle');
    setSelectedOption(null);
  };

  const monthlyBirthdays = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    return students.filter(s => {
      const bMonth = new Date(s.birthDate).getUTCMonth() + 1;
      return bMonth === currentMonth;
    }).sort((a, b) => new Date(a.birthDate).getUTCDate() - new Date(b.birthDate).getUTCDate());
  }, [students]);

  const rankingData = useMemo(() => {
    const filteredStudents = students.filter(s => {
      const matchBelt = rankingBeltFilter === 'all' || s.belt === rankingBeltFilter;
      const matchClass = rankingClassFilter === 'all' || s.classId === rankingClassFilter;
      return matchBelt && matchClass;
    });

    const monthly = filteredStudents.map(s => {
      const count = s.attendanceHistory?.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === rankingMonthFilter && d.getFullYear() === rankingYearFilter;
      }).length || 0;
      return { id: s.id, name: s.name, count, belt: s.belt, rewardPoints: s.rewardPoints || 0 };
    }).sort((a, b) => b.count - a.count || b.rewardPoints - a.rewardPoints).slice(0, 50);

    const annual = filteredStudents.map(s => {
      const count = s.attendanceHistory?.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === rankingYearFilter;
      }).length || 0;
      return { id: s.id, name: s.name, count, belt: s.belt, rewardPoints: s.rewardPoints || 0 };
    }).sort((a, b) => b.count - a.count || b.rewardPoints - a.rewardPoints).slice(0, 50);

    return { monthly, annual };
  }, [students, rankingBeltFilter, rankingClassFilter, rankingMonthFilter, rankingYearFilter]);

  const activityFeed = useMemo(() => {
    return logs
      .filter(log => 
        log.action.includes('Check-in') || 
        log.action.includes('Graduou') || 
        log.action.includes('Quiz')
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [logs]);

  const schoolAverageXP = useMemo(() => {
    if (students.length === 0) return 0;
    const totalXP = students.reduce((acc, s) => acc + (s.rewardPoints || 0), 0);
    return Math.round(totalXP / students.length);
  }, [students]);

  const blockchainHash = useMemo(() => {
    if (!student) return '';
    return CryptoJS.SHA256(student.id + student.belt + student.lastPromotionDate).toString().substring(0, 16).toUpperCase();
  }, [student]);

  const radarData = useMemo(() => {
    if (!student) return [];
    const base = student.rewardPoints || 0;
    
    if (selectedModality === 'muay_thai') {
      return [
        { subject: 'Guarda/Stance', A: Math.min(100, 50 + (base % 35)) },
        { subject: 'Clinche/Clinch', A: Math.min(100, 45 + (student.attendanceCount % 40)) },
        { subject: 'Chutes/Kicks', A: Math.min(100, 60 + (student.stripes * 8)) },
        { subject: 'Socos/Punches', A: Math.min(100, 55 + (student.rulesKnowledge || 30)) },
        { subject: 'Cárdio/Stamina', A: Math.min(100, 40 + (student.currentStreak || 0) * 8) },
        { subject: 'Bloqueios/Blocks', A: Math.min(100, 65 + (base % 25)) },
      ];
    }
    if (selectedModality === 'capoeira') {
      return [
        { subject: 'Ritmo Ginga', A: Math.min(100, 65 + (student.stripes * 7)) },
        { subject: 'Musicalidade', A: Math.min(100, 50 + (base % 45)) },
        { subject: 'Acrobacias', A: Math.min(100, 40 + (student.attendanceCount % 35)) },
        { subject: 'Ataques/Chutes', A: Math.min(100, 55 + (student.rulesKnowledge || 25)) },
        { subject: 'Roda/Estratégia', A: Math.min(100, 60 + (student.currentStreak || 0) * 8) },
        { subject: 'Esquivas/Quedas', A: Math.min(100, 70 + (base % 20)) },
      ];
    }
    if (selectedModality === 'mma') {
      return [
        { subject: 'Boxe (Trocação)', A: Math.min(100, 55 + (base % 40)) },
        { subject: 'Wrestling (Clinch)', A: Math.min(100, 50 + (student.attendanceCount % 30)) },
        { subject: 'Submission (Sem Kimono)', A: Math.min(100, 60 + (student.stripes * 6)) },
        { subject: 'Trabalho de Grade', A: Math.min(100, 45 + (student.rulesKnowledge || 35)) },
        { subject: 'Cárdio/Resistência', A: Math.min(100, 65 + (student.currentStreak || 0) * 9) },
        { subject: 'Ground and Pound (Solo)', A: Math.min(100, 50 + (base % 30)) },
      ];
    }
    if (selectedModality === 'judo') {
      return [
        { subject: 'Kumi-kata (Pegada)', A: Math.min(100, 60 + (student.stripes * 8)) },
        { subject: 'Nage-waza (Quedas)', A: Math.min(100, 55 + (base % 35)) },
        { subject: 'Katame-waza (Solo)', A: Math.min(100, 45 + (student.attendanceCount % 40)) },
        { subject: 'Ukemi (Rolamento)', A: Math.min(100, 70 + (student.rulesKnowledge || 20)) },
        { subject: 'Reações/Kuzushi', A: Math.min(100, 50 + (student.currentStreak || 0) * 7) },
        { subject: 'Katas Tradicionais', A: Math.min(100, 40 + (base % 45)) },
      ];
    }
    if (selectedModality === 'kickboxing') {
      return [
        { subject: 'Combos de Soco', A: Math.min(100, 55 + (base % 30)) },
        { subject: 'Chutes de Impacto', A: Math.min(100, 65 + (student.stripes * 7)) },
        { subject: 'Footwork/Movimentação', A: Math.min(100, 50 + (student.attendanceCount % 25)) },
        { subject: 'Bloqueios Rápidos', A: Math.min(100, 60 + (student.rulesKnowledge || 15)) },
        { subject: 'Fôlego/Stamina', A: Math.min(100, 45 + (student.currentStreak || 0) * 8) },
        { subject: 'Timing/Antecipação', A: Math.min(100, 50 + (base % 40)) },
      ];
    }

    // Default BJJ:
    return [
      { subject: t('portal.technicalGrade'), A: Math.min(100, 40 + (base % 50)) },
      { subject: t('portal.tacticalIntelligence'), A: Math.min(100, 30 + (student.rulesKnowledge || 0)) },
      { subject: t('portal.physicalCondition'), A: Math.min(100, 50 + (student.currentStreak || 0) * 5) },
      { subject: t('portal.biomechanics'), A: Math.min(100, 45 + (student.attendanceCount % 40)) },
      { subject: t('portal.defense'), A: Math.min(100, 60 + (student.stripes * 5)) },
      { subject: t('portal.offense'), A: Math.min(100, 35 + (student.rewardPoints % 60)) },
    ];
  }, [student, selectedModality, t]);

  const heatmapData = useMemo(() => {
    if (!student || !student.attendanceHistory) return [];
    // Generate last 6 weeks of attendance for heatmap
    const weeks = [];
    const today = new Date();
    for (let i = 0; i < 42; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const hasAttended = student.attendanceHistory.some(a => a.date === dayStr);
        weeks.unshift(hasAttended ? 1 : 0);
    }
    return weeks;
  }, [student]);

  const userRankPercentile = useMemo(() => {
    if (!student || students.length === 0) return 100;
    const higherThan = students.filter(s => (s.rewardPoints || 0) < (student.rewardPoints || 0)).length;
    return Math.round(100 - (higherThan / students.length) * 100);
  }, [students, student]);

  const hasPaidCurrentMonth = useMemo(() => {
    if (!student) return false;
    const currentMonth = new Date().toISOString().substring(0, 7);
    return payments.some(p => p.name === student.name && p.date.startsWith(currentMonth));
  }, [payments, student]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    if (student) {
      setLoading(false);
    } else if (students.length > 0) {
      // If we have loaded some students, but this specific code still doesn't match any student,
      // let's wait a tiny bit (say, 800ms) for any final updates, then set loading to false.
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // If students.length === 0, it means we are still awaiting the first hydration of students.
      // Let's set a timeout of 3000ms before we give up and set loading to false.
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [students, student, code, authLoading]);

  const handleScanSimulation = () => {
    if (student) {
      recordAttendance([student.id]);
      setCheckinSuccess(true);
      setShowScanner(false);
      setTimeout(() => setCheckinSuccess(false), 3000);
    }
  };

  const generatePixPayload = (amount: number) => {
    const formatEMVField = (id: string, val: string): string => {
      const len = val.length.toString().padStart(2, '0');
      return `${id}${len}${val}`;
    };

    const pixKey = (profile.pixKey || '').trim();
    const pixName = (profile.pixName || 'ACADEMIA').trim().slice(0, 25);
    const pixCity = (profile.pixCity || 'SAO PAULO').trim().slice(0, 15);
    const amountStr = amount.toFixed(2);

    // Merchant Account Info (GUI & Key)
    const merchantAccountInfo = formatEMVField('00', 'br.gov.bcb.pix') + formatEMVField('01', pixKey);

    let payload = '';
    payload += '000201'; // Payload Format Indicator
    payload += formatEMVField('26', merchantAccountInfo); // Merchant Account Information
    payload += '52040000'; // Merchant Category Code
    payload += '5303986'; // Transaction Currency (986 = BRL)
    payload += formatEMVField('54', amountStr); // Transaction Amount
    payload += '5802BR'; // Country Code (BR)
    payload += formatEMVField('59', pixName); // Merchant Name
    payload += formatEMVField('60', pixCity); // Merchant City
    payload += formatEMVField('62', formatEMVField('05', '***')); // Additional Data Field (no TX ID)

    // Calculate CRC16 (CCITT-FALSE) over the entire payload including the CRM indicator tag
    const pixSecureRaw = payload + '6304';
    let crc = 0xFFFF;
    for (let i = 0; i < pixSecureRaw.length; i++) {
      let charCode = pixSecureRaw.charCodeAt(i);
      crc ^= (charCode << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    crc = (crc & 0xFFFF);
    const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');

    return pixSecureRaw + crcHex;
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmReceipt = () => {
    if (student && receiptFile) {
      setPaymentProcessing(true);
      
      // Add receipt to system (notifications are handled internally by addReceipt)
      addReceipt({
        studentId: student.id,
        studentName: student.name,
        amount: student.monthlyValue,
        date: new Date().toISOString().split('T')[0],
        receiptUrl: receiptFile
      });

      setTimeout(() => {
        setPaymentProcessing(false);
        setShowReceipt(false);
        setReceiptFile(null);
      }, 2000);
    }
  };

  const handleMedicalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedicalFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmMedical = () => {
    if (student && medicalFile) {
      const expirationDate = new Date(medicalIssueDate);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      
      updateStudent(student.id, {
        medicalCertificateUrl: medicalFile,
        medicalCertificateDate: medicalIssueDate,
        medicalCertificateExpiration: expirationDate.toISOString().split('T')[0]
      });
      
      setShowMedicalUpload(false);
      setMedicalFile(null);
    }
  };

  const handleAcceptWaiver = () => {
    if (student) {
      updateStudent(student.id, {
        liabilityWaiverAccepted: true,
        liabilityWaiverDate: new Date().toISOString().split('T')[0]
      });
      setShowWaiver(false);
    }
  };

  const handleCompleteLesson = (lessonId: string, points: number) => {
    if (student) {
      completeRuleLesson(student.id, lessonId, points);
    }
  };

  const studentRef = useRef(student);
  useEffect(() => {
    studentRef.current = student;
  }, [student]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showScanner) {
      // Delay slightly to ensure the element is in the DOM
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner('reader', { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        }, false);
        
        scanner.render((decodedText) => {
          if (studentRef.current) {
            // Check if scanning Dojo static Reception QR Code
            if (decodedText.startsWith('SYSBJJ-DOJO-STATIC-RECEPTION-')) {
              if (!navigator.geolocation) {
                setGeoError("Este QR Code do Dojo exige verificação de Geofence por GPS ativo.");
                setShowScanner(false);
                if (scanner) scanner.clear().catch(e => console.error(e));
                return;
              }
              
              setGeoChecking(true);
              setGeoError(null);
              
              const currentStudentId = studentRef.current.id;
              
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const userLat = pos.coords.latitude;
                  const userLon = pos.coords.longitude;
                  const distance = calculateDistance(userLat, userLon, profile?.latitude || 0, profile?.longitude || 0);
                  const radius = profile?.geofenceRadius || 500;
                  
                  if (distance <= radius) {
                    const audit = getAuditInfo();
                    const schedCheck = checkActiveSchedule();
                    
                    if (!schedCheck.active) {
                      setGeoError(`QR Rejeitado: ${schedCheck.error}`);
                      setGeoChecking(false);
                      setShowScanner(false);
                      return;
                    }
                    
                    recordAttendance(
                      [currentStudentId],
                      undefined,
                      schedCheck.matchingClassId,
                      `Presença via QR Estático Seguro do Dojo (Confirmada por GPS, Dist.: ${Math.round(distance)}m)`,
                      {
                        origin: 'QR_CODE',
                        checkinMethod: 'qr_static',
                        gps: { latitude: userLat, longitude: userLon, distance },
                        deviceInfo: {
                          device: `${audit.os} / ${audit.browser}`,
                          browser: audit.browser,
                          os: audit.os,
                          deviceId: audit.deviceId,
                          ip: "186.230.12.98"
                        }
                      }
                    );
                    
                    setGeoSuccess(true);
                    setCheckinSuccess(true);
                    setGeoChecking(false);
                    setShowScanner(false);
                    
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                    audio.play().catch(() => {});
                    
                    setTimeout(() => {
                      setCheckinSuccess(false);
                      setGeoSuccess(false);
                    }, 4000);
                  } else {
                    setGeoError(`QR Inválido: Você está a ${Math.round(distance)}m do Dojo, mas o limite permitido é ${radius}m.`);
                    setGeoChecking(false);
                    setShowScanner(false);
                  }
                },
                (err) => {
                  setGeoError("GPS inacessível ou permissão recusada. Não foi possível validar o check-in no Dojo.");
                  setGeoChecking(false);
                  setShowScanner(false);
                },
                { enableHighAccuracy: true, timeout: 8000 }
              );
              
              if (scanner) scanner.clear().catch(e => console.error(e));
            } else {
              // Standard fallback direct code scan
              const audit = getAuditInfo();
              recordAttendance(
                [studentRef.current.id],
                undefined,
                undefined,
                "Check-in via Simulação QR",
                {
                  origin: 'PORTAL_ALUNO',
                  checkinMethod: 'portal',
                  deviceInfo: {
                    device: `${audit.os} / ${audit.browser}`,
                    browser: audit.browser,
                    os: audit.os,
                    deviceId: audit.deviceId,
                    ip: "186.230.12.98"
                  }
                }
              );
              setCheckinSuccess(true);
              setShowScanner(false);
              setTimeout(() => setCheckinSuccess(false), 3000);
              if (scanner) scanner.clear().catch(e => console.error(e));
            }
          }
        }, (error) => {
          // Successive errors are normal while scanning
        });
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [showScanner]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-8 text-center font-black uppercase tracking-tighter">{t('portal.invalidCode')}</div>;

  const isOverdue = student.status === StudentStatus.OVERDUE || (!hasPaidCurrentMonth && student.dueDay < new Date().getDate());

  const showBloodTypeSetting = profile?.showBloodType !== false;
  const showMedicalConditionsSetting = profile?.showMedicalConditions !== false;
  const showLiabilityWaiverSetting = profile?.showLiabilityWaiver !== false;
  const showMedicalCertificateSetting = profile?.showMedicalCertificate !== false;
  const hasAnyHealthSetting = showBloodTypeSetting || showMedicalConditionsSetting || showLiabilityWaiverSetting || showMedicalCertificateSetting;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors">
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {activeTab === 'home' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Mensalidade em atraso Alert Banner */}
            {student.isOverdue && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-650 bg-red-600 text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-[2rem] flex items-center justify-center gap-2.5 shadow-lg shadow-red-600/10 border border-red-500"
              >
                <AlertTriangle size={15} className="shrink-0 animate-bounce text-yellow-300" />
                <span>⚠️ Mensalidade em atraso</span>
              </motion.div>
            )}

            {/* Professional Profile Header */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative shadow-2xl overflow-hidden border border-white/5 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity" />
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="relative group/avatar">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 p-1 border-2 border-white/10 shadow-2xl overflow-hidden">
                    <div className="w-full h-full rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-4xl sm:text-6xl font-black text-white/90 overflow-hidden relative">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        student.name[0]
                      )}
                      
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                      >
                        <Camera size={24} className="text-white" />
                      </button>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -bottom-1 -right-1 w-10 h-10 bg-slate-950 rounded-2xl border-2 border-blue-500/50 flex items-center justify-center shadow-lg"
                  >
                    <ShieldCheck size={20} className="text-blue-400" />
                  </motion.div>
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[7px] font-black uppercase tracking-[0.2em] rounded border border-blue-500/20">{t('common.verifiedMember')}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[7px] font-black uppercase tracking-[0.2em] rounded border border-emerald-500/20">{t('common.blockchainIdLabel')}: {blockchainHash}</span>
                    {student.isInstructor && (
                      <span className="px-2.5 py-0.5 bg-red-600 text-white text-[7px] font-black uppercase tracking-[0.15em] rounded border border-red-500/20">INSTRUTOR 🥋</span>
                    )}
                    {student.isClassProfessor && (
                      <span className="px-2.5 py-0.5 bg-red-800 text-white text-[7px] font-black uppercase tracking-[0.15em] rounded border border-red-900/30">PROFESSOR DE TURMA</span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none">{student.name}</h1>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${BELT_COLORS[student.belt]}`}>
                        {t(`belts.${t(`belts.${student.belt}`, student.belt)}`)}
                      </div>
                      <div className="flex gap-1">
                        {[...Array(student.stripes)].map((_, i) => (
                          <div key={i} className="w-1 h-4 bg-white rounded-full opacity-80" />
                        ))}
                      </div>
                    </div>

                    {student.classId && (() => {
                      const studentClass = schedules?.find((sc: any) => sc.id === student.classId);
                      if (studentClass) {
                        return (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-300 font-sans">
                            <Clock size={11} className="text-blue-450 shrink-0" />
                            <span>Turma: {studentClass.title} • {studentClass.time}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {student.instructorId && (() => {
                    const inst = students.find((s: any) => s.id === student.instructorId);
                    if (inst) {
                      return (
                        <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start text-xs text-slate-350 font-bold">
                          <Users size={14} className="text-slate-400 shrink-0" />
                          <span>Professor: {inst.name}</span>
                          <span className="text-slate-500 font-normal shadow-sm">•</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none ${BELT_COLORS[inst.belt]}`}>
                            {inst.belt}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Technical / Bio Observações field inside header */}
              {student.technicalNotes && (
                <div className="mt-6 p-4.5 bg-white/5 rounded-2xl border border-white/5 text-left relative z-10">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 leading-none">
                    <Info size={11} className="text-blue-400 shrink-0" /> Observações do Aluno / Bio
                  </p>
                  <p className="text-xs font-bold text-slate-200 leading-normal whitespace-pre-wrap">
                    {student.technicalNotes}
                  </p>
                </div>
              )}

              {/* Blockchain Badge Section */}
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                      <Shield size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">{t('portal.blockchainTitle')}</p>
                      <p className="text-[8px] font-medium text-slate-400 uppercase tracking-tighter">{t('portal.blockchainDesc')}</p>
                    </div>
                 </div>
                 <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[8px] font-black text-blue-400 uppercase tracking-widest transition-colors">
                    {t('portal.viewOnChain')}
                 </button>
              </div>
            </div>

            {/* 🥋 [NOVO] CHECK-IN DA AULA DO DIA - MÓDULO PRINCIPAL COMPLEMENTAR */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border-2 border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${hasCheckedInToday ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {hasCheckedInToday ? <CheckCircle2 size={22} className="animate-pulse" /> : <ClipboardCheck size={22} />}
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Módulo de Presença</span>
                    <h3 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                      Check-in da Aula do Dia
                    </h3>
                  </div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    hasCheckedInToday 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                  }`}>
                    {hasCheckedInToday ? 'Presença Confirmada' : 'Aguardando Luta'}
                  </span>
                </div>
              </div>

              {hasCheckedInToday ? (
                <div className="pt-4 space-y-3 relative z-10">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      OSS! Sua presença foi registrada hoje com sucesso. Tenha um excelente treino e continue focado na evolução!
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                      <div>
                        <span className="font-bold uppercase">Treino:</span> {(todayCheckinRecord as any)?.classTitle || todayCheckinClass?.title || 'Treino Livre / Geral'}
                      </div>
                      {todayCheckinClass?.time && (
                        <div>
                          <span className="font-bold uppercase">Horário:</span> {todayCheckinClass.time}
                        </div>
                      )}
                      <div>
                        <span className="font-bold uppercase">Registro:</span> {todayCheckinRecord?.notes ? todayCheckinRecord.notes.split('(')[0].trim() : 'Manual via Portal'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-4 space-y-4 relative z-10">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Mantenha sua consistência em dia para acelerar sua jornada rumo à próxima faixa. Veja as turmas de hoje e realize o check-in:
                  </p>

                  {/* Lista de Aulas de Hoje */}
                  <div className="space-y-2">
                    {todayClasses.length > 0 ? (
                      todayClasses.map((sched: any) => {
                        const isStudentClass = student?.classId === sched.id;
                        return (
                          <div 
                            key={sched.id} 
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                              isStudentClass 
                                ? 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-800/30' 
                                : 'bg-slate-50 dark:bg-slate-850/30 border-slate-100 dark:border-slate-800/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isStudentClass ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                <Clock size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-slate-850 dark:text-white uppercase leading-tight">{sched.title}</span>
                                  {isStudentClass && (
                                    <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[6.5px] font-black uppercase tracking-wider rounded">Minha Turma</span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 leading-none">{sched.time} • {sched.modality?.toUpperCase() || 'GI BJJ'}</span>
                              </div>
                            </div>
                            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              Capacidade: <span className="font-bold tabular-nums">{sched.capacity || 30} alunos</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-850/20 rounded-2xl border border-slate-150 dark:border-slate-850 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Nenhuma aula regular agendada para hoje</span>
                        <p className="text-[10px] text-slate-500 mt-1">Mas você pode fazer check-in como Treino Livre Geral ou registrar no painel de presença abaixo!</p>
                      </div>
                    )}
                  </div>

                  {/* Ações Rápidas de Check-In */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <button 
                      onClick={handleGeoCheckin}
                      disabled={geoChecking}
                      className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[8.5px] tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-center"
                    >
                      {geoChecking ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MapPin size={13} className="text-white" />
                      )}
                      <span>{geoChecking ? 'Obtendo GPS...' : 'Check-in por GPS'}</span>
                    </button>

                    <button 
                      onClick={() => {
                        setShowMyQR(true);
                        setGeoError(null);
                      }}
                      className="py-3 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-black uppercase text-[8.5px] tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-center"
                    >
                      <QrCode size={13} className="text-blue-400" />
                      <span>Meu QR Code</span>
                    </button>

                    <button 
                      onClick={() => {
                        setShowManualInput(true);
                        setGeoError(null);
                      }}
                      className="py-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-black uppercase text-[8.5px] tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-center"
                    >
                      <Shield size={13} className="text-amber-500" />
                      <span>Código Manual</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 🥋 Bento Columns of the Student Portal Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* CARD DE CLASSIFICAÇÃO AUTOMÁTICA IBJJF/CBJJ */}
            {(() => {
              const ibjjfInfo = getIBJJFRealTimeCategory(student.birthDate, t);
              const badgeStyle = getCategoryBadgeStyle(ibjjfInfo.category);
              return (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                     <div>
                       <p className="text-[9px] font-black text-blue-650 dark:text-blue-400 uppercase tracking-widest leading-none mb-1">{t('portal.officialRegulation', 'Regulamento Oficial')}</p>
                       <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white">{t('portal.ibjjfClassification', 'Classificação IBJJF/CBJJ')}</h4>
                     </div>
                     <span className="text-[8px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-black uppercase">{t('portal.automatic', 'Automática')}</span>
                   </div>
 
                   <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gradient-to-br dark:from-slate-850 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <div>
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('portal.myCategory', 'Minha Categoria')}</span>
                         <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider inline-block ${badgeStyle}`}>
                           🥋 {ibjjfInfo.category}
                         </span>
                       </div>
                       <div className="text-right">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('portal.currentAge', 'Idade Atual')}</span>
                         <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                           {ibjjfInfo.age} <span className="text-[10px] font-bold text-slate-400 uppercase">{t('portal.years', 'Anos')}</span>
                         </span>
                       </div>
                     </div>
 
                     <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                       <div>
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{t('portal.nextCategory', 'Próxima Categoria')}</span>
                         <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                           {ibjjfInfo.nextCategory}
                         </span>
                       </div>
                       <div className="text-right">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{t('portal.whenChanges', 'Quando Muda?')}</span>
                         <span className="text-[10.5px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                           {ibjjfInfo.whenChanges}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })()}

            {/* Multi-Modality Segment Control Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">{t('portal.combatCore', 'Núcleo de Combate')}</span>
                  <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white">Modalidades Unificadas</h4>
                </div>
                <span className="text-[7.5px] bg-blue-600/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider animate-pulse">Multidisciplinar</span>
              </div>

              {/* Segmented Modality Buttons */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                {[
                  { id: 'bjj', label: 'BJJ', color: 'text-blue-500' },
                  { id: 'muay_thai', label: 'M. Thai', color: 'text-red-500' },
                  { id: 'capoeira', label: 'Capoeira', color: 'text-emerald-500' },
                  { id: 'mma', label: 'MMA', color: 'text-indigo-500' },
                  { id: 'judo', label: 'Judô', color: 'text-amber-500' },
                  { id: 'kickboxing', label: 'K. Boxing', color: 'text-rose-500' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedModality(item.id as any);
                    }}
                    className={`text-[8.5px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer ${
                      selectedModality === item.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Modality Specific Render Panel */}
              <div className="pt-2">
                {selectedModality === 'bjj' && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <p className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Métrica de Jiu-Jitsu (Gi/No-Gi)</p>
                    <div className="p-3 bg-blue-600/5 rounded-2xl border border-blue-600/10 flex justify-between items-center">
                      <div>
                        <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase leading-none block">Grau Teórico de Regras</span>
                        <span className="text-[8.5px] text-slate-400 font-bold uppercase mt-1 block">Conformidade com a IBJJF / CBJJ</span>
                      </div>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 tabular-nums">+{student.rulesKnowledge || 0} XP</span>
                    </div>
                  </div>
                )}

                {selectedModality === 'muay_thai' && (
                  <div className="space-y-3 animate-fade-in text-left">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-red-500 tracking-wider">
                      <span>Graduação Muay Thai</span>
                      <span>Prajied Azul Escuro</span>
                    </div>
                    <div className="p-3.5 bg-red-500/5 rounded-2xl border border-red-500/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase">Combinações de Soco/Chute</span>
                        <span className="text-[8px] bg-red-500/10 text-red-500 py-0.5 px-2 rounded-full font-black uppercase">Foco Ativo</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
                        <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-extrabold">
                          <CheckCircle2 size={10} className="text-red-500" /> JAB + DIRETO + CHUTE LOW ESQUERDO
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-extrabold">
                          <CheckCircle2 size={10} className="text-red-500" /> UPPERCUT + ESQUIVA LATERAL + JOELHADA
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedModality === 'capoeira' && (
                  <div className="space-y-3 animate-fade-in text-left">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-emerald-500 tracking-wider font-sans">
                      <span>Área de Capoeira</span>
                      <span>Cordão Verde-Amarelo</span>
                    </div>
                    
                    {/* Beat Creator / Drum machine for Capoeira Toque! */}
                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase block">Ginga Instrument Pad</span>
                        <button 
                          onClick={() => setCapoeiraBeats([])}
                          className="text-[7.5px] text-emerald-600 hover:text-emerald-500 uppercase font-black tracking-widest cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-1.5">
                        {['gunga', 'médio', 'viola', 'atabaque'].map(instr => (
                          <button
                            key={instr}
                            onClick={() => {
                              setCapoeiraBeats(prev => [...prev.slice(-7), instr.toUpperCase()]);
                            }}
                            className="bg-slate-900 hover:bg-black text-emerald-400 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest border border-emerald-500/10 active:scale-95 transition-all text-center cursor-pointer"
                          >
                            {instr}
                          </button>
                        ))}
                      </div>

                      {capoeiraBeats.length > 0 ? (
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 flex gap-1.5 overflow-x-auto min-h-[30px] items-center">
                          <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest shrink-0">Seq:</span>
                          {capoeiraBeats.map((b, idx) => (
                            <span key={idx} className="bg-emerald-500/15 text-emerald-400 text-[8.5px] py-0.5 px-1.5 rounded font-mono font-extrabold border border-emerald-500/15 shrink-0 animate-pulse">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[8.5px] font-medium text-slate-400 text-center uppercase tracking-wide">Toque nos pads para compor o ritmo da roda.</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedModality === 'mma' && (
                  <div className="space-y-3 animate-fade-in text-left">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                      <span>Pro-Camp Preparation</span>
                      <span>Welterweight (77.1kg)</span>
                    </div>
                    <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex justify-between items-center">
                      <div>
                        <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase leading-none block">Corte de Peso Ativo</span>
                        <span className="text-[8.5px] text-slate-400 font-bold uppercase mt-1 block">Meta: 77.1 kg // Atual: 78.5 kg</span>
                      </div>
                      <span className="text-[9.5px] font-black bg-indigo-500/15 text-indigo-500 py-1 px-2.5 rounded-full uppercase tracking-wider">97% Alinhado</span>
                    </div>
                  </div>
                )}

                {selectedModality === 'judo' && (
                  <div className="space-y-3 animate-fade-in text-left">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-amber-500 tracking-wider">
                      <span>Projeções Judô</span>
                      <span>Segundo Kyo (Gokyo)</span>
                    </div>
                    <div className="p-3.5 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-1.5">
                      <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase block">Waza-ari Focus da Semana</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['IPPON SEOI NAGE', 'OSOTO GARI', 'UCHI MATA'].map(tn => (
                          <span key={tn} className="bg-slate-900 text-amber-400 text-[8px] font-mono py-1 px-2.5 rounded-lg border border-amber-550/10">
                            {tn}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedModality === 'kickboxing' && (
                  <div className="space-y-3 animate-fade-in text-left">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-rose-500 tracking-wider">
                      <span>K1 Rules Kickboxing</span>
                      <span>Graduação: Faixa Verde</span>
                    </div>
                    <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-1.5">
                      <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase block">Combinações de Sparring</span>
                      <div className="space-y-1 text-[8.5px] font-mono text-slate-400 leading-normal">
                        <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold uppercase">
                          <Check size={10} className="text-rose-500" /> Left Hook + Right Low Kick
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold uppercase">
                          <Check size={10} className="text-rose-500" /> Double Jab + Right Cross
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tactical Intelligence Radar */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 pb-0 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('portal.trainingRadar')}</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('portal.tacticalIntelligence')}</h3>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
              </div>
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 900 }}
                    />
                    <Radar
                      name={t('common.student', 'Aluno')}
                      dataKey="A"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Consistency Heatmap */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('portal.consistencyHeatmap')}</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('portal.attendanceTitle')}</h3>
                    </div>
                </div>
                
                {heatmapData.length > 0 ? (
                    <div className="grid grid-cols-7 gap-2">
                        {heatmapData.map((val, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.01 }}
                                className={`aspect-square rounded-lg transition-all hover:scale-110 cursor-pointer ${
                                    val === 1 
                                    ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' 
                                    : 'bg-slate-100 dark:bg-slate-800'
                                }`}
                            >
                               {i === heatmapData.length - 1 && (
                                   <div className="w-full h-full border-2 border-blue-400 rounded-lg animate-pulse" />
                               )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{t('portal.noDataHeatmap')}</p>
                    </div>
                )}
                
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('portal.trainingCategory')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('portal.noActivity')}</span>
                    </div>
                </div>
            </div>

            {/* Gamification Level & Streak Gauge (Requisito 5) */}
            {(() => {
              const xpValue = student.rewardPoints || 0;
              const currentLvl = Math.floor(xpValue / 100) + 1;
              const lvlProgress = xpValue % 100;
              
              // Custom Title Rank
              let rankTitle = "Guerreiro Iniciante";
              if (currentLvl >= 10) rankTitle = "Samurai do Tatame";
              else if (currentLvl >= 7) rankTitle = "Elite do Dojo";
              else if (currentLvl >= 5) rankTitle = "Casca Grossa";
              else if (currentLvl >= 3) rankTitle = "Maratonista Interno";

              return (
                <div className="bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-900 rounded-[2.5rem] p-8 text-white relative shadow-2xl overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-[80px] opacity-15" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-550/30 flex items-center justify-center text-amber-400">
                        <Award size={22} className="animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status Evolutivo</p>
                        <h4 className="text-xs font-black uppercase text-white tracking-tight">{rankTitle}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Level {currentLvl}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>Progresso XP para o próximo nível</span>
                      <span className="text-amber-400 tabular-nums">{lvlProgress} / 100 XP</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-550" style={{ width: `${lvlProgress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10 text-[9px] font-mono text-slate-400">
                    <span className="flex items-center gap-1"><Flame size={12} className="text-orange-500 animate-bounce" /> {t('portal.streakLabel', 'Sequência')}: {student.currentStreak || 0} dias ativos</span>
                    <span>Total Acumulado: {xpValue} XP</span>
                  </div>
                </div>
              );
            })()}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center group active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.attendance')}</p>
                <p className="text-lg font-black dark:text-white tabular-nums">{student.attendanceCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center group active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Flame size={20} />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('kids.streak')}</p>
                <p className="text-lg font-black text-orange-500 tabular-nums">{student.currentStreak || 0}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center group active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 mb-3 flex items-center justify-center group-hover/avatar:scale-110 transition-transform">
                  <Star size={20} />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('portal.schoolAverage')}</p>
                <p className="text-lg font-black text-emerald-500 tabular-nums">{schoolAverageXP}</p>
              </div>
            </div>

            {/* SISTEMA DE PRESENÇA - MÚLTIPLOS MODOS */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <QrCode size={14} className="text-blue-500" /> {t('portal.attendanceSystem', 'Sistema de Presença')}
                </h4>
                <span className="text-[8px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">{t('portal.multiModes', 'Multi-Modos')}</span>
              </div>
              
              {/* Daily Class Check-In Block */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4.5 rounded-[1.8rem] border border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    {t('portal.dailyCheckin', 'Check-In Rápido da Aula do Dia')}
                  </span>
                  <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">{todayStr}</span>
                </div>

                {hasCheckedInToday ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 animate-bounce" />
                      <span className="text-xs font-black uppercase tracking-tight">Presença Confirmada Hoje!</span>
                    </div>
                    <p className="text-[9.5px] font-medium leading-relaxed uppercase opacity-90">
                      OSS! Sua presença na aula <strong className="font-extrabold">{todayCheckinClass?.title ?? 'Geral / Treino Livre'}</strong> às <strong className="font-extrabold">{todayCheckinClass?.time ?? ''}</strong> foi devidamente registrada e criptografada no ledger do Dojo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    {todayClasses.length > 0 ? (
                      <div className="space-y-3">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Selecione a Turma de Hoje:</label>
                        <select
                          value={selectedCheckinClassId}
                          onChange={(e) => setSelectedCheckinClassId(e.target.value)}
                          className="w-full p-3.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-black uppercase text-slate-950 dark:text-white dark:[color-scheme:dark] cursor-pointer"
                        >
                          {todayClasses.map(sc => (
                            <option key={sc.id} value={sc.id}>
                              {sc.title} ({sc.time})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleQuickCheckinSubmit(selectedCheckinClassId)}
                          disabled={!selectedCheckinClassId}
                          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/15 hover:shadow-blue-600/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Zap size={14} className="text-white animate-pulse" />
                          <span>Confirmar Check-in de Hoje</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center py-2">
                        <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide leading-relaxed">Nenhuma turma com horário agendado para hoje. Deseja registrar check-in geral de treino?</p>
                        <button
                          onClick={() => handleQuickCheckinSubmit('')}
                          className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/5"
                        >
                          <Zap size={14} className="text-emerald-400" />
                          <span>Check-in Geral / Livre</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* [1] Escanear QR Dojo */}
                <button 
                  onClick={() => {
                    setShowScanner(true);
                    setShowManualInput(false);
                    setGeoError(null);
                  }} 
                  className="py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-md flex flex-col items-center justify-center gap-2 active:scale-95 transition-all border border-white/5 cursor-pointer text-center"
                >
                  <Camera size={18} className="text-blue-500" />
                  <span>Escanear QR Dojo</span>
                </button>

                {/* [2] Apresentar Meu QR */}
                <button 
                  onClick={() => {
                    setShowMyQR(true);
                    setShowManualInput(false);
                    setGeoError(null);
                  }} 
                  className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-md flex flex-col items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-center"
                >
                  <QrCode size={18} className="text-white animate-pulse" />
                  <span>Apresentar Meu QR</span>
                </button>

                {/* [3] Check-in por Geolocalização */}
                <button 
                  onClick={handleGeoCheckin}
                  disabled={geoChecking}
                  className="py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-950 dark:text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  {geoChecking ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MapPin size={18} className="text-emerald-500" />
                  )}
                  <span>{geoChecking ? 'Obtendo GPS...' : 'Via GPS / Localização'}</span>
                </button>

                {/* [4] Check-in Manual */}
                <button 
                  onClick={() => {
                    setShowManualInput(!showManualInput);
                    setGeoError(null);
                  }} 
                  className={`py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-center ${
                    showManualInput 
                      ? 'bg-amber-500 text-slate-950' 
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-700/80 text-slate-950 dark:text-white'
                  }`}
                >
                  <Shield size={18} className={showManualInput ? 'text-slate-950' : 'text-amber-500'} />
                  <span>manual com código</span>
                </button>
              </div>

              {/* Geo Info Feedback */}
              {geoError && (
                <div className="p-3.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-2xl text-[9.5px] font-bold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{geoError}</span>
                </div>
              )}
              {geoSuccess && (
                <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl text-[9.5px] font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>Check-in via GPS realizado com sucesso!</span>
                </div>
              )}

              {/* Manual Input Drawer/Inline form */}
              {showManualInput && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-850/55 space-y-3 text-left">
                  <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider block">Inserir Código Fornecido</span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Código (6 dígitos)"
                      value={manualCode}
                      onChange={(e) => {
                        setManualCode(e.target.value);
                        setManualError(null);
                      }}
                      className="flex-1 bg-white dark:bg-slate-850 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold uppercase tracking-widest text-slate-900 dark:text-white"
                    />
                    <button 
                      onClick={handleManualCheckinSubmit}
                      className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      Enviar
                    </button>
                  </div>
                  {manualError && (
                    <p className="text-[9.5px] font-bold text-red-500 uppercase tracking-tight mt-1">{manualError}</p>
                  )}
                  {manualSuccess && (
                    <p className="text-[9.5px] font-bold text-emerald-500 uppercase tracking-tight mt-1">Presença registrada com sucesso!</p>
                  )}
                </div>
              )}
              
              {checkinSuccess && !geoSuccess && !manualSuccess && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500 text-white p-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{t('portal.checkinSuccess')}</span>
                </motion.div>
              )}
            </div>

            {/* MY ROTATING QR BADGE DIALOG/MODAL */}
            {showMyQR && (
              <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-[3rem] p-8 max-w-sm w-full space-y-6 relative overflow-hidden text-center"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
                  <button onClick={() => setShowMyQR(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500">
                    <X size={20} />
                  </button>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Meu QR de Acesso</h3>
                    <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Apresente no Tablet do Dojo para Check-in</p>
                  </div>
                  
                  <div className="w-56 h-56 bg-slate-100 p-4 rounded-[2.5rem] border border-slate-200/50 mx-auto flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 animate-[scan_2.5s_infinite] pointer-events-none" />
                    {/* Simulated vector robust high end QR Representation */}
                    <div className="w-full h-full bg-slate-900 p-4 rounded-[1.8rem] flex flex-col justify-between items-center relative z-10 shadow-inner">
                      <div className="grid grid-cols-4 gap-2 w-full mt-2">
                        {[...Array(16)].map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-6 rounded-md ${
                              (idx * 7 + Math.floor(Date.now() / 15000)) % 3 === 0 
                                ? 'bg-white' 
                                : (idx * 5) % 2 === 0 
                                ? 'bg-blue-400' 
                                : 'bg-transparent border border-white/20'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[7.5px] font-mono text-slate-400 font-bold uppercase tracking-widest">SYS-{student.portalAccessCode}-OK</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rotary Token</span>
                      <span className="text-[9.5px] font-mono font-black text-blue-600 truncate max-w-[150px]">{qrRotaryToken}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <Clock size={11} className="text-blue-500 animate-[spin_4s_linear_infinite]" /> Token expira em:
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{qrCountdown}s</span>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                      A criptografia do SYSBJJ 2.0 gera chaves rotativas válidas por 30s. Apresente no tablet receptor de presença do dojo.
                    </p>
                  </div>

                  <button 
                    onClick={() => setShowMyQR(false)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all"
                  >
                    Fechar OSS
                  </button>
                </motion.div>
              </div>
            )}

            {/* SAÚDE & FICHA MÉDICA (Requisito: Informações de Saúde) */}
            {hasAnyHealthSetting && student && (
              <div id="health-card" className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div>
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                    <Activity size={12} className="animate-pulse" /> Saúde & Integridade Física
                  </p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Dados Médicos & Termos</h3>
                </div>

                <div className="space-y-4">
                  {/* Tipo Sanguíneo */}
                  {showBloodTypeSetting && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Tipo Sanguíneo</span>
                        <span className="text-xs font-bold text-slate-750 dark:text-slate-300">
                          {student.bloodType || 'Não informado'}
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                          <button
                            key={type}
                            onClick={() => updateStudent(student.id, { bloodType: type })}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black border transition-all cursor-pointer ${
                              student.bloodType === type
                                ? 'bg-rose-500 text-white border-rose-600 scale-105 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observações Clínicas */}
                  {showMedicalConditionsSetting && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Restrições e Condições Clínicas</span>
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Informe caso possua asma, alergias, lesões ou faça uso de medicamentos.</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={student.medicalConditions}
                          onBlur={(e) => updateStudent(student.id, { medicalConditions: e.target.value })}
                          placeholder="Ex: Asma moderada, alergia a dipirona..."
                          className="flex-1 px-4 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-850 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <button
                          onClick={(e) => {
                            const input = (e.currentTarget.previousSibling as HTMLInputElement);
                            updateStudent(student.id, { medicalConditions: input.value });
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-805 dark:hover:bg-slate-700 text-white border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Termo de Responsabilidade Técnica */}
                  {showLiabilityWaiverSetting && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Termo de Responsabilidade</span>
                        <span className="text-xs font-bold dark:text-white">
                          {student.liabilityWaiverAccepted ? (
                            <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle2 size={13} /> {t('medical.accepted')}</span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1.5"><AlertTriangle size={13} /> {t('medical.notAccepted')}</span>
                          )}
                        </span>
                        {student.liabilityWaiverAccepted && student.liabilityWaiverDate && (
                          <span className="text-[8px] font-mono text-slate-400 uppercase block tracking-wider">Assinado em {new Date(student.liabilityWaiverDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      {!student.liabilityWaiverAccepted && (
                        <button
                          onClick={() => setShowWaiver(true)}
                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-[9px] tracking-widest rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                        >
                          Assinar Termo
                        </button>
                      )}
                    </div>
                  )}

                  {/* Atestado Médico */}
                  {showMedicalCertificateSetting && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Atestado Médico (Aptidão Física)</span>
                        <span className="text-xs font-bold dark:text-white">
                          {student.medicalCertificateUrl ? (
                            new Date(student.medicalCertificateExpiration!) < new Date() ? (
                              <span className="text-red-500 flex items-center gap-1.5"><AlertCircle size={13} /> {t('medical.expired')}</span>
                            ) : (
                              <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle2 size={13} /> {t('medical.valid')}</span>
                            )
                          ) : (
                            <span className="text-rose-500 flex items-center gap-1.5"><ShieldAlert size={13} /> {t('medical.missing')}</span>
                          )}
                        </span>
                        {student.medicalCertificateExpiration && (
                          <span className="text-[8px] font-mono text-slate-400 uppercase block tracking-wider">Validade: {new Date(student.medicalCertificateExpiration).toLocaleDateString()}</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setMedicalIssueDate(new Date().toISOString().split('T')[0]);
                          setShowMedicalUpload(true);
                        }}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        {student.medicalCertificateUrl ? 'Atualizar' : 'Enviar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MAPA DE EVOLUÇÃO TÉCNICA (Interactive positional levels - Requisito 3) */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Análise de Habilidades</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Meu Mapa de Evolução Técnica</h3>
              </div>

              {/* Positional bars representing the 8 positions requested */}
              <div className="space-y-4">
                {[
                  { name: "Guarda Sob Controle", val: 85, color: "bg-blue-600" },
                  { name: "Raspagens Eficientes", val: 75, color: "bg-amber-400" },
                  { name: "Passagem de Guarda", val: 65, color: "bg-emerald-500" },
                  { name: "Quedas & Projeções", val: 50, color: "bg-rose-500" },
                  { name: "Defesas & Escapes", val: 80, color: "bg-purple-500" },
                  { name: "Finalizações Fatais", val: 70, color: "bg-cyan-500" },
                  { name: "Estratégia de Competição", val: 55, color: "bg-indigo-500" },
                  { name: "Disciplina & Presença", val: Math.min(100, Math.round((student.attendanceCount / 40) * 100)), color: "bg-teal-500" }
                ].map((pos, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                      <span>{pos.name}</span>
                      <span className="tabular-nums">{pos.val}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div className={`h-full ${pos.color} rounded-full transition-all duration-700`} style={{ width: `${pos.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* INTERNAL LEADERBOARD BLOCK (Gamificação Tatame - Requisito 5) */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ranking do Dojo</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Quadro Geral de Líderes</h3>
                </div>
                <Trophy size={20} className="text-amber-500 animate-bounce" />
              </div>

              <div className="space-y-3">
                {/* Dynamically sorted list of real registered students */}
                {[...students]
                  .map(s => ({
                    id: s.id,
                    name: s.id === student.id ? `${s.name} (Você)` : (s.nickname ? `${s.name} (${s.nickname})` : s.name),
                    belt: s.belt || 'Branca',
                    points: s.rewardPoints || 0,
                    attendance: s.attendanceCount || 0,
                    isMe: s.id === student.id
                  }))
                  .sort((a,b) => b.points - a.points || b.attendance - a.attendance)
                  .map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`p-3.5 rounded-2xl flex items-center justify-between border ${
                        item.isMe 
                          ? 'bg-blue-600/15 border-blue-600/30 text-slate-900 dark:text-white font-bold' 
                          : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center ${
                          index === 0 ? 'bg-amber-500 text-white shadow' : index === 1 ? 'bg-slate-350 text-white' : index === 2 ? 'bg-amber-850 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <div>
                          <h5 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-tight">{item.name}</h5>
                          <p className="text-[8px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">{item.belt} • {item.attendance} Presenças</p>
                        </div>
                      </div>
                      <span className="text-xs font-black italic text-blue-500">{item.points} XP</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* GAMIFIED ACHIEVEMENTS LOCKER BADGES (Requisito 5) */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Medalhas e Conquistas</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Minhas Conquistas</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: "Guerreiro de Ferro", icon: <Flame size={20} />, active: student.attendanceCount >= 10, desc: "Atingiu 10 check-ins no tatame." },
                  { title: "Dona da Teoria", icon: <Award size={20} />, active: (student.completedRuleLessons?.length || 0) >= 1, desc: "Primeiro quiz de regras respondido." },
                  { title: "Centurião Supremo", icon: <Trophy size={20} />, active: student.attendanceCount >= 100, desc: "Semana brilhante de 100 treinos." },
                  { title: "Casca Grossa", icon: <Star size={20} />, active: student.isCompetitor, desc: "Atleta do circuito de competições." }
                ].map((badge, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-3xl border text-center flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-103 ${
                      badge.active 
                        ? 'bg-amber-400/10 border-amber-400/30 text-slate-900 dark:text-white' 
                        : 'bg-slate-50 dark:bg-slate-850/20 border-slate-100 dark:border-white/5 opacity-40'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 shadow ${
                      badge.active ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {badge.icon}
                    </div>
                    <h5 className="text-[9.5px] font-black uppercase tracking-tight leading-none mb-1 text-slate-900 dark:text-white">{badge.title}</h5>
                    <p className="text-[7.5px] text-slate-400 leading-normal font-bold max-w-[100px]">{badge.desc}</p>
                    
                    {badge.active && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Challenge of the Day */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group border border-white/10">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      <Gamepad2 size={20} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest">Desafio do Conhecimento</h3>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-lg text-[8px] font-black">DIÁRIO</span>
                </div>
                
                <h4 className="text-xl font-black uppercase tracking-tighter leading-tight mb-4">
                  {IBJJF_LESSONS[new Date().getDate() % IBJJF_LESSONS.length].title}
                </h4>
                
                <p className="text-[10px] font-medium text-blue-100 opacity-80 leading-relaxed max-w-xs mb-8">
                  Aprimore sua base técnica respondendo ao quiz diário e ganhe XP extra para o seu ranking.
                </p>

                <button 
                  onClick={() => {
                    setCurrentRuleLessonId(IBJJF_LESSONS[new Date().getDate() % IBJJF_LESSONS.length].id);
                    setActiveTab('knowledge');
                  }}
                  className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-slate-50 cursor-pointer"
                >
                   Aceitar Desafio <ArrowRight size={14} />
                </button>
              </div>
              <Trophy className="absolute bottom-[-20px] right-[-20px] text-white/5 group-hover:scale-110 transition-transform duration-1000" size={180} />
            </div>

            {/* Save Toast feedback indicator */}
            {showWorkoutSavedToast && (
              <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] w-full max-w-xs p-4 bg-emerald-500 dark:bg-emerald-600 text-white rounded-2xl flex items-center gap-3 shadow-2xl uppercase tracking-widest text-[9px] font-black animate-bounce border border-emerald-400">
                <CheckCircle2 size={16} /> Treino salvo! Ganhou +10 XP de mérito.
              </div>
            )}

            {/* Knowledge Progress Teaser */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('portal.rulesKnowledge')}</p>
                  <p className="text-lg font-black text-blue-500 tabular-nums">{student.rulesKnowledge || 0}%</p>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${student.rulesKnowledge || 0}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  />
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic text-center">Nível de mestre em andamento... Oss!</p>
            </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'training' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Evolution Progress */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Minha Graduação e Evolução</h3>
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Status e Carência de Faixa Regulamento Oficial</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <GraduationCap size={24} />
                </div>
              </div>

              {/* Visual Belt Card representing current belt & degrees */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-8 rounded-lg shrink-0 border border-black/10 flex items-center justify-center font-bold text-[10px] uppercase shadow-sm ${
                    (student.belt as string) === 'Branca' || (student.belt as string) === 'White' ? 'bg-white text-slate-800 border-slate-300' :
                    (student.belt as string) === 'Cinza' || (student.belt as string) === 'Gray' ? 'bg-slate-400 text-white' :
                    (student.belt as string) === 'Amarela' || (student.belt as string) === 'Yellow' ? 'bg-amber-400 text-slate-900' :
                    (student.belt as string) === 'Laranja' || (student.belt as string) === 'Orange' ? 'bg-orange-500 text-white' :
                    (student.belt as string) === 'Verde' || (student.belt as string) === 'Green' ? 'bg-emerald-600 text-white' :
                    (student.belt as string) === 'Azul' || (student.belt as string) === 'Blue' ? 'bg-[#2563EB] text-white' :
                    (student.belt as string) === 'Roxa' || (student.belt as string) === 'Purple' ? 'bg-[#7C3AED] text-white' :
                    (student.belt as string) === 'Marrom' || (student.belt as string) === 'Brown' ? 'bg-[#92400E] text-white' :
                    'bg-[#111111] text-white border-b-2 border-rose-500'
                  }`}>
                    {student.belt}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">Faixa Atual: {t(`belts.${student.belt}`, student.belt)}</h4>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                      Graus na Faixa: {student.stripes || student.degrees || 0}
                    </p>
                  </div>
                </div>

                {/* Degrees indicators */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((g) => (
                    <div 
                      key={g}
                      className={`w-7 h-7 rounded border text-[10px] font-black flex items-center justify-center ${
                        g <= (student.stripes || student.degrees || 0) 
                          ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-sm' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {g}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress and Countdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Tempo de Carência</span>
                    <span>{graduationAnalysis?.monthsInBelt} / {graduationAnalysis?.minMonths} m</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${graduationAnalysis?.timeProgress}%` }}
                      className="h-full bg-blue-600"
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Mínimo exigido pela IBJJF para a {(student.belt as string) === 'Branca' || (student.belt as string) === 'White' ? 'Faixa Azul' : 'próxima faixa'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Frequência tatame</span>
                    <span>{student.attendanceCount || 0} de {graduationAnalysis?.attendanceThreshold || 30} aulas</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((student.attendanceCount || 0) / (graduationAnalysis?.attendanceThreshold || 30)) * 100)}%` }}
                      className="h-full bg-cyan-500"
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Engajamento técnico sugerido pelo seu Sensei
                  </p>
                </div>
              </div>

              {/* Elegibilidade Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" /> Auto-Verificação Legal IBJJF
                </h5>
                {graduationAnalysis && graduationAnalysis.monthsInBelt >= graduationAnalysis.minMonths ? (
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                    <CheckCircle2 size={13} /> Tempo regulamentar atingido! Você está elegível perante as regras da CBJJ/IBJJF.
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                    <AlertTriangle size={13} /> Carência incompleta. Restam aproximadamente {Math.max(0, (graduationAnalysis?.minMonths || 12) - (graduationAnalysis?.monthsInBelt || 0))} meses de estágio nesta faixa.
                  </div>
                )}
              </div>

              {/* Linha do tempo de promoções passadas */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} /> Meu Histórico de Evolução (Ledger)
                </p>
                {(() => {
                  const myPromos = graduationHistory.filter(h => h.studentId === student.id);
                  if (myPromos.length === 0) {
                    return (
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide italic">Nenhum registro anterior no Ledger digital.</p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {myPromos.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px]">Promoção</span>
                            <p className="font-black dark:text-white text-xs mt-0.5">{p.previousBelt} ➔ {p.newBelt}</p>
                          </div>
                          <span className="text-[9px] font-black bg-blue-500/10 text-blue-600 px-2 py-1 rounded uppercase">
                            {new Date(p.promotedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* HISTÓRICO DE PRESENÇAS DO MÊS */}
            {(() => {
              const stats = getMonthlyPresenceStats(student.attendanceHistory || []);
              
              const today = new Date();
              const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              const startWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
              const daysArray = [
                ...Array(startWeekday).fill(null),
                ...Array.from({ length: stats.daysInMonth }, (_, i) => i + 1)
              ];

              return (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase block mb-1">Registro Mensal</span>
                      <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar size={15} className="text-emerald-500" /> Presenças este Mês ({stats.monthName})
                      </h4>
                    </div>
                    <div className="text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Frequência Total</span>
                        <span className="text-2xl font-black text-emerald-500 tabular-nums">{stats.currentMonthTotal} <span className="text-xs font-bold text-slate-400">Aulas</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Comparativo de Desempenho com Mês Anterior */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/45 flex items-center justify-between">
                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">vs. Mês Anterior</span>
                    {stats.diff > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-wide border border-emerald-500/20 leading-none">
                        <TrendingUp size={12} /> +{stats.diff} aulas
                      </span>
                    ) : stats.diff < 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wide border border-amber-500/20 leading-none">
                        <Activity size={12} /> {stats.diff} aulas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wide border border-slate-500/20 leading-none">
                        Sem alteração
                      </span>
                    )}
                  </div>

                  {/* Calendar Grid View */}
                  <div className="space-y-3.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mapa de Frequência no Tatame</p>
                    <div className="bg-slate-50 dark:bg-slate-850/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                      {/* Weekday Headers */}
                      <div className="grid grid-cols-7 gap-2 mb-3 text-center">
                        {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((d, index) => (
                          <span key={index} className="text-[8px] font-black uppercase text-slate-400 leading-none tracking-wider">
                            {d}
                          </span>
                        ))}
                      </div>

                      {/* Calendar Days Cells */}
                      <div className="grid grid-cols-7 gap-2">
                        {daysArray.map((day, index) => {
                          if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                          }

                          const isPresent = stats.presentDaysSet.has(day);

                          return (
                            <div 
                              key={`day-${day}`}
                              className={`aspect-square rounded-xl text-xs font-bold leading-none flex items-center justify-center relative select-none ${
                                isPresent 
                                  ? 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-555/10 scale-105'
                                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <span className="tabular-nums">{day}</span>
                              {isPresent && (
                                <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Technical Exam Requirements */}
            {(() => {
              const rawReqs = tObj(`beltRequirements.${graduationAnalysis?.nextBelt || 'White'}`);
              const examReqs = Array.isArray(rawReqs) ? rawReqs : [];
              return (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck size={20} className="text-amber-500" />
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('common.examRequirements')}</h3>
                    </div>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full uppercase">
                      {Object.values(student.examRequirements || {}).filter(v => v).length} / {examReqs.length}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {examReqs.map((req, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                          student.examRequirements?.[req]
                            ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 opacity-60'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                          student.examRequirements?.[req] ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'
                        }`}>
                          <Check size={12} strokeWidth={4} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${
                          student.examRequirements?.[req] ? 'text-amber-900 dark:text-amber-200' : 'text-slate-500'
                        }`}>
                          {req}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Video Section Title */}
            <div className="flex items-center justify-between px-2 pt-4">
               <div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('portal.videosTitle')}</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Biblioteca de Técnicas</p>
               </div>
               <button 
                  onClick={() => setShowAddVideo(true)}
                  className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  <Plus size={20} />
                </button>
            </div>

            {/* Videos List */}
            <div className="grid grid-cols-1 gap-4">
              {student.positionVideos?.map((video) => (
                <div key={video.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group">
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative">
                    <iframe 
                      src={getYoutubeEmbedUrl(video.videoUrl)} 
                      className="w-full h-full border-none"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">{video.date}</span>
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-slate-400" />
                        <span className="text-[8px] font-black text-slate-400 uppercase">{video.authorName}</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-black dark:text-white uppercase tracking-tight leading-none">{video.title}</h4>
                    {video.description && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">{video.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!student.positionVideos || student.positionVideos.length === 0) && (
                <div className="py-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                    <Video size={32} />
                  </div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">{t('common.noVideosYet')}</p>
                </div>
              )}
            </div>

            {/* Milestones & Techniques History */}
            <div className="space-y-4 pt-8">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{t('common.historyConquests')}</h3>
               
               <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                  {/* Milestones */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-amber-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.eventsSeminars')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {student.milestones?.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                          {m.type === 'Seminar' && <Users size={12} className="text-amber-500" />}
                          {m.type === 'Competition' && <Medal size={12} className="text-blue-500" />}
                          {m.type === 'Course' && <BookOpen size={12} className="text-purple-500" />}
                          {m.type === 'Other' && <Star size={12} className="text-slate-400" />}
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase leading-none">{m.title}</span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{m.date}</span>
                          </div>
                        </div>
                      ))}
                      {(!student.milestones || student.milestones.length === 0) && (
                        <p className="text-[9px] text-slate-400 italic">{t('common.noRecords')}</p>
                      )}
                    </div>
                  </div>

                  {/* Proficiency */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.techLevel')}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {student.techniques?.map((tech, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                          <div>
                            <p className="text-xs font-bold dark:text-slate-200 leading-none">{tech.name}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{tech.category}</p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Zap key={star} size={10} className={star <= tech.proficiency ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'community' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Social Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[60px] opacity-10" />
               <div className="flex items-center justify-between mb-8">
                 <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Comunidade Dojo</h3>
                   <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Conexão & Fraternidade</p>
                 </div>
                 <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                   <Users size={24} />
                 </div>
               </div>

               <div className="flex gap-4">
                 <div className="flex-1 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Guerreiros Ativos</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{students.filter(s => s.status === StudentStatus.ACTIVE).length}</p>
                 </div>
                 <div className="flex-1 p-5 bg-emerald-500 text-white rounded-3xl text-center shadow-lg shadow-emerald-500/20">
                    <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mb-1">Treinando Hoje</p>
                    <p className="text-2xl font-black tabular-nums">{students.filter(s => s.lastAttendanceDate === new Date().toISOString().split('T')[0]).length}</p>
                 </div>
               </div>
            </div>

            {/* Birthdays Section */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Cake size={80} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Cake size={16} /> {t('portal.birthdaysTitle')}
                </h3>
                
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {monthlyBirthdays.map(b => (
                    <div key={b.id} className="min-w-[140px] bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur-sm flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-black border border-white/30 mb-3">
                        {b.name[0]}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{b.name}</p>
                      <p className="text-[14px] font-black tracking-tight mt-1">{new Date(b.birthDate).getUTCDate()}/{new Date(b.birthDate).getUTCMonth() + 1}</p>
                    </div>
                  ))}
                  {monthlyBirthdays.length === 0 && (
                    <div className="w-full text-center py-6 border-2 border-dashed border-white/20 rounded-3xl">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Nenhum guerreiro assopra velas este mês.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dojo Activity Feed */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('portal.activityLog')}</h3>
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('portal.live')}</span>
              </div>

              <div className="space-y-4">
                {activityFeed.map((log, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        log.action.includes('Check-in') ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {log.action.includes('Check-in') ? <Check size={16} /> : <Trophy size={16} />}
                      </div>
                      {idx !== activityFeed.length - 1 && (
                        <div className="absolute top-8 bottom-[-16px] left-1/2 w-px bg-slate-100 dark:bg-slate-800 -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">
                          {log.details.split(':')[0] || t('portal.warrior')}
                        </p>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
                        {log.action}
                      </p>
                    </div>
                  </div>
                ))}
                {activityFeed.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center italic py-4">{t('portal.noActivity')}</p>
                )}
              </div>
            </div>

            {/* Hall of Fame / Rankings */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Medal size={20} className="text-amber-500" />
                   <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Hall da Fama (Presença)</h3>
                 </div>
                 
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                   <button 
                    onClick={() => setRankingMonthFilter(new Date().getMonth())}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${rankingMonthFilter === new Date().getMonth() ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                   >
                     Mês
                   </button>
                   <button 
                    onClick={() => setRankingMonthFilter(-1)} // Special value for annual or just logic
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${rankingMonthFilter === -1 ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                   >
                     Geral
                   </button>
                 </div>
               </div>

               <div className="space-y-3">
                 {rankingData.monthly.slice(0, 10).map((r, idx) => (
                   <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={r.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${r.id === student.id ? 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-600/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}
                   >
                     <div className="flex items-center gap-4">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${idx < 3 ? (idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-orange-400 text-slate-900') : (r.id === student.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')}`}>
                         {idx + 1}
                       </div>
                       <div>
                         <span className="text-xs font-black uppercase tracking-tight block leading-none">{r.name}</span>
                         <span className={`text-[8px] font-black uppercase tracking-widest ${r.id === student.id ? 'text-white/60' : 'text-slate-400'}`}>{r.belt}</span>
                       </div>
                     </div>
                     <div className="text-right">
                        <p className={`text-[10px] font-black tabular-nums ${r.id === student.id ? 'text-white' : 'text-blue-500'}`}>{r.count}</p>
                        <p className={`text-[7px] font-black uppercase tracking-widest ${r.id === student.id ? 'text-white/60' : 'text-slate-400'}`}>Aulas</p>
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'wallet' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Professional Financial Card */}
            <div className={`rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-2 group ${isOverdue ? 'bg-red-950 border-red-500/50' : 'bg-slate-900 border-white/5'}`}>
               <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 ${isOverdue ? 'bg-red-500' : 'bg-blue-600'}`} />
               
               <div className="relative z-10 flex justify-between items-start mb-12">
                  <div className="p-4 bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                    <CreditCard size={32} className={isOverdue ? 'text-red-400' : 'text-blue-400'} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">MENSALIDADE {new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isOverdue ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOverdue ? 'bg-red-400' : 'bg-emerald-400'}`} />
                      {isOverdue ? t('financial.statusOverdue') : t('financial.statusPaid')}
                    </div>
                  </div>
               </div>

               <div className="relative z-10 space-y-2">
                 <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">VALOR DO INVESTIMENTO</p>
                 <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter tabular-nums">{t('common.currencySymbol')} {student.monthlyValue.toFixed(2)}</h3>
                   <span className="text-[10px] font-bold text-white/30 uppercase italic">/ Mês</span>
                 </div>
               </div>

               <div className="mt-12 pt-8 border-t border-white/10 relative z-10 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/40 uppercase">PRÓXIMO VENCIMENTO</p>
                    <p className="text-xs font-black uppercase">{student.dueDay} {new Date().toLocaleDateString('pt-BR', { month: 'short' })}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[8px] font-black text-white/40 uppercase">MÉTODO PREFERENCIAL</p>
                    <p className="text-xs font-black uppercase">PIX SEGURO</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setShowPix(true)} 
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-4 active:scale-95 hover:bg-blue-700 transition-all group"
              >
                <QrCode size={24} className="group-hover:rotate-12 transition-transform" /> {t('portal.payPix').toUpperCase()}
              </button>
              
              <button 
                onClick={() => setShowReceipt(true)} 
                className="w-full py-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-4 border border-slate-200 dark:border-slate-800 active:scale-95 hover:bg-slate-50 transition-all"
              >
                <Upload size={24} className="text-slate-400" /> {t('portal.uploadReceipt').toUpperCase()}
              </button>
            </div>

            {/* Financial History Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                    <FileText size={18} />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Histórico de Quitação</h4>
                </div>
                
                <div className="space-y-3">
                   {payments.filter(p => p.name === student.name).slice(0, 5).map((pay, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           <div>
                              <p className="text-[10px] font-black dark:text-white uppercase leading-none">{pay.date}</p>
                              <p className="text-[8px] font-medium text-slate-500 uppercase mt-1 italic">Processado via Ledger</p>
                           </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{t('common.currencySymbol')} {pay.amount.toFixed(2)}</span>
                     </div>
                   ))}
                   {payments.filter(p => p.name === student.name).length === 0 && (
                     <p className="text-[9px] text-slate-400 text-center italic py-4">{t('financial.noRecentFlow')}</p>
                   )}
                </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {!currentRuleLessonId ? (
                <motion.div 
                  key="lesson-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 bg-blue-600/20 border border-blue-600/30 rounded-full text-[8px] font-black uppercase tracking-widest text-blue-400">CENTRO DE ESTUDO SYS</div>
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-3">Academia de Regras</h3>
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed mb-8 italic">"O conhecimento das regras é a sua melhor defesa."</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">XP CONQUISTADO</p>
                            <p className="text-xl font-black text-blue-400 tabular-nums">{student.rewardPoints || 0}</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">MÓDULOS</p>
                            <p className="text-xl font-black text-blue-400 tabular-nums">{student.completedRuleLessons?.length || 0}/{IBJJF_LESSONS.length}</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Maestria Teórica</span>
                          <span className="text-xs font-black text-blue-500">{Math.round((student.completedRuleLessons?.length || 0) / IBJJF_LESSONS.length * 100)}%</span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(student.completedRuleLessons?.length || 0) / IBJJF_LESSONS.length * 100}%` }}
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {IBJJF_LESSONS.map((lesson) => {
                      const iconMap: Record<string, any> = {
                        Trophy,
                        ShieldCheck,
                        AlertTriangle,
                        BookOpen,
                        Zap,
                        Target
                      };
                      const IconComponent = iconMap[lesson.icon] || BookOpen;
                      const isCompleted = student.completedRuleLessons?.includes(lesson.id);

                      return (
                        <motion.button 
                          key={lesson.id}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCurrentRuleLessonId(lesson.id)}
                          className={`flex items-center gap-5 p-5 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group ${
                            isCompleted 
                              ? 'bg-green-50/10 border-green-500/20 shadow-lg shadow-green-500/5' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/30 shadow-sm'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl transition-all duration-500 group-hover:rotate-6 ${
                            isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            <IconComponent size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.15em]">{t(`portal.categories.${lesson.category.toLowerCase()}`)}</span>
                              {isCompleted && (
                                <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 size={8} /> DOMINADO
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black dark:text-white uppercase tracking-tight truncate leading-none mb-1">{lesson.title}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate opacity-60 italic">+{lesson.points} XP de Honra</p>
                          </div>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="lesson-detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={handleCloseRuleDetail}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest group"
                  >
                    <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> {t('common.cancel')}
                  </button>

                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-10" />
                    
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                            {currentLesson ? t(`portal.categories.${currentLesson.category.toLowerCase()}`) : ''}
                          </span>
                          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                            +{currentLesson?.points} XP
                          </span>
                        </div>
                      </div>
                      
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                        {currentLesson?.title}
                      </h2>

                      {!quizMode && !scenarioMode && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group">
                          <div className="relative z-10">
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                              {currentLesson?.content}
                            </p>
                          </div>
                          <Scale className="absolute -bottom-4 -right-4 text-slate-100 dark:text-slate-800/50 group-hover:scale-110 transition-transform duration-700" size={100} />
                        </div>
                      )}
                    </div>

                    {!quizMode && !scenarioMode ? (
                      <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('portal.howToLearn')}</h4>
                        {currentLesson?.questions && (
                          <button 
                            onClick={handleStartQuiz}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 flex items-center justify-center gap-3 active:scale-95 transition-all"
                          >
                            <Gamepad2 size={20} /> {t('portal.theoryQuiz')}
                          </button>
                        )}
                        {currentLesson?.scenarios && (
                          <button 
                            onClick={handleStartScenarios}
                            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                          >
                            <Play size={20} /> {t('portal.realScenarios')}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${quizMode ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                              {quizMode ? <Shield size={16} /> : <Target size={16} />}
                            </div>
                            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {quizMode ? t('portal.knowledgeCheck') : `${t('portal.knowledgeCheckShort')} ${currentScenarioIdx + 1}/${currentLesson?.scenarios?.length}`}
                            </h4>
                          </div>
                          {scenarioMode && (
                            <span className="text-[9px] font-black text-slate-400 uppercase">{currentScenario?.title}</span>
                          )}
                        </div>
                        
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                            {quizMode ? currentLesson?.questions?.[0].question : currentScenario?.situation}
                          </p>
                          {scenarioMode && currentScenario?.description && (
                             <p className="text-[10px] text-slate-500 mt-2 italic font-bold">{t('portal.context')}: {currentScenario.description}</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          {(quizMode ? currentLesson?.questions?.[0].options : currentScenario?.options)?.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => quizState === 'answering' && handleAnswer(idx)}
                              disabled={quizState !== 'answering'}
                              className={`w-full p-5 rounded-3xl text-left text-xs font-black uppercase tracking-tight transition-all border-2 flex items-center justify-between group ${
                                selectedOption === idx 
                                  ? (quizState === 'correct' ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white')
                                  : (quizState !== 'answering' && idx === (quizMode ? currentLesson?.questions?.[0].correctAnswer : currentScenario?.correctAnswer) ? 'bg-green-500/20 border-green-600 text-green-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500/50')
                              }`}
                            >
                              {option}
                              {selectedOption === idx && (
                                quizState === 'correct' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />
                              )}
                            </button>
                          ))}
                        </div>

                        {quizState !== 'answering' && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className={`p-6 rounded-[2rem] ${quizState === 'correct' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
                          >
                            <div className="flex gap-4">
                              <div className={`p-3 rounded-2xl hidden sm:block ${quizState === 'correct' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {quizState === 'correct' ? <Award size={24} /> : <BookOpen size={24} />}
                              </div>
                              <div className="space-y-1">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${quizState === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                                  {quizState === 'correct' ? t('portal.excellentJudgment') : t('portal.incorrectAnalysis')}
                                </p>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                  {quizMode ? currentLesson?.questions?.[0].explanation : currentScenario?.explanation}
                                </p>
                                
                                {quizState === 'correct' && (
                                  <div className="mt-4 flex gap-2">
                                    <button 
                                      onClick={quizMode ? handleCloseRuleDetail : handleNextScenario}
                                      className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
                                    >
                                      {quizMode || (currentScenarioIdx === (currentLesson?.scenarios?.length || 0) - 1) ? t('portal.completeModule') : t('portal.nextLesson')} <Play size={12} fill="currentColor" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {activeTab === 'homeTraining' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative shadow-2xl overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 w-fit mb-4">
                  <Dumbbell size={24} className="text-amber-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{t('portal.homeTrainingTitle')}</h3>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed max-w-sm">
                  {t('portal.homeTrainingDesc')}
                </p>
              </div>
            </div>

            {homeWorkouts.map((section) => (
              <div key={section.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    {section.icon}
                  </div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{section.title}</h4>
                </div>

                <div className="space-y-4">
                  {section.exercises.map((ex, i) => {
                    const exerciseId = `${section.id}-${i}`;
                    return (
                      <div key={i} className="group p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-blue-500/30 transition-all">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{ex.name}</p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight italic">{ex.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-slate-400 uppercase">{t('portal.repsPlaceholder')}</span>
                             <input 
                                type="number" 
                                value={workoutCounts[exerciseId] || ''}
                                onChange={(e) => setWorkoutCounts(prev => ({ ...prev, [exerciseId]: parseInt(e.target.value) || 0 }))}
                                className="w-12 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-xs font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="0"
                             />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRegisterWorkout(section.id)}
                  className="w-full mt-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle2 size={16} />
                  {t('portal.registerWorkout')}
                </motion.button>
              </div>
            ))}
            
            <div className="p-6 bg-blue-600/5 rounded-[2rem] border border-blue-600/10 text-center">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest italic">"A constância é a mãe da maestria." - SENSEI</p>
            </div>
          </motion.div>
        )}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest dark:text-white">{t('portal.navGallery')}</h3>
              <label className="p-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                <Plus size={20} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        addGalleryImage({
                          url: reader.result as string,
                          title: `${t('portal.trainingCategory')} - ${student.name}`,
                          date: new Date().toISOString().split('T')[0],
                          category: t('portal.trainingCategory') as any
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               {gallery.map(img => (
                 <div key={img.id} onClick={() => setSelectedPhoto(img)} className="aspect-square rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                   <img src={img.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Maximize2 size={24} className="text-white" />
                   </div>
                 </div>
               ))}
               {gallery.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest italic">{t('portal.noPhotos')}</div>}
            </div>
          </div>
        )}
        {activeTab === 'timer' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 py-10"
          >
            <div className="text-center space-y-2">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{t('timer.title')}</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Treino Independente</p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-12">
               <div className="text-8xl font-black tabular-nums tracking-tighter italic text-slate-900 dark:text-white">
                  {Math.floor(timerTimeLeft / 60)}:{(timerTimeLeft % 60).toString().padStart(2, '0')}
               </div>

               <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setTimerIsRunning(!timerIsRunning)}
                    className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all active:scale-95 ${timerIsRunning ? 'bg-slate-800' : 'bg-blue-600'}`}
                  >
                    {timerIsRunning ? <Pause size={40} /> : <Play size={40} className="translate-x-1" />}
                  </button>
                  <button 
                    onClick={resetTimer}
                    className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95"
                  >
                    <RotateCcw size={28} />
                  </button>
               </div>

               <div className="flex flex-wrap justify-center gap-3">
                  {[2, 3, 5, 6, 8, 10].map(m => (
                    <button 
                      key={m}
                      onClick={() => { setTimerIsRunning(false); setTimerTimeLeft(m * 60); }}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${timerTimeLeft === m * 60 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400'}`}
                    >
                      {m} MIN
                    </button>
                  ))}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rules' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Sub-tab segmented premium toggle (Dojo de Ensino Hub - Requisito 6) */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setRulesSubTab('library')}
                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  rulesSubTab === 'library' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                🎥 Dojo Hub de Ensino
              </button>
              <button 
                onClick={() => setRulesSubTab('regulations')}
                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  rulesSubTab === 'regulations' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                📖 Regulamento IBJJF
              </button>
            </div>

            {rulesSubTab === 'regulations' ? (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Regulamento Oficial</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consulta Rápida de Faixas & Regras</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-6 border border-slate-200 dark:border-white/5 shadow-xl">
                   <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-6 flex items-center gap-2">
                      <Trophy size={16} className="text-amber-500" /> {t('beltSystem.graduationChartTitle')}
                   </h4>
                   
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 italic">Sistema de Faixas Adulto</p>
                      <div className="grid grid-cols-1 gap-2">
                        {IBJJF_REFERENCE.graduationChart.adult.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-2 rounded-full ${BELT_COLORS[item.color] || 'bg-slate-500'} border border-black/10`} />
                               <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{item.belt}</span>
                            </div>
                            <span className="text-[8px] font-black text-slate-400 uppercase">{item.age}</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-8 mb-4 italic">Sistema de Faixas Kids</p>
                      <div className="grid grid-cols-2 gap-2">
                        {IBJJF_REFERENCE.graduationChart.kids.slice(0, 10).map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className={`w-full h-1.5 rounded-full ${BELT_COLORS[item.color] || 'bg-slate-500'} border border-black/10`} />
                            <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase truncate">{item.belt}</span>
                            <span className="text-[7px] font-black text-slate-400 uppercase">{item.age}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-[60px] opacity-20" />
                   <h4 className="text-lg font-black uppercase tracking-tighter italic mb-4">Pontuação Oficial de Luta</h4>
                   <div className="space-y-3">
                      {IBJJF_REFERENCE.points.map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-xs font-medium text-slate-400">{p.position}</span>
                          <span className="text-sm font-black text-red-500 tabular-nums">+{p.value} PTS</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              /* DOJO HUB TECHNICAL LIBRARY (Requisito 6) */
              <div className="space-y-6">
                <div className="text-center space-y-1">
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Biblioteca Técnica Inteligente</h3>
                   <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Trilhas de Aprendizado & Playlists</p>
                </div>

                {/* Training of the week Section Spotlight */}
                <div className="p-6 bg-gradient-to-br from-indigo-900 to-blue-950 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl border border-blue-500/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20" />
                  <div className="relative z-10 space-y-4">
                    <span className="px-3 py-1 bg-amber-400 text-slate-900 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">TREINO DA SEMANA ⭐</span>
                    <h4 className="text-lg font-black uppercase tracking-tight text-white leading-none">Passagem de Meia Guarda Esgrimada</h4>
                    <p className="text-[10px] leading-relaxed text-slate-350 font-medium">A base técnica central desta semana é a finalização dos 100kg após a esgrima alta da meia-guarda colada.</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[8px] font-mono text-slate-400">Instrutor: Sensei Honorio • 5m 20s</span>
                      <button 
                        onClick={() => toggleFavorite('week-spotlight')}
                        className={`p-2 rounded-xl border transition-all ${
                          favorites.includes('week-spotlight') 
                            ? 'bg-amber-400 border-amber-450 text-slate-900' 
                            : 'bg-white/5 border-white/10 text-white'
                        }`}
                      >
                        <Star size={14} className="fill-current" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Horizontal list of category filters */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'guard', label: 'Guarda' },
                    { id: 'pass', label: 'Passagem' },
                    { id: 'takedown', label: 'Quedas' },
                    { id: 'defense', label: 'Defesa' },
                    { id: 'submission', label: 'Finalizações' },
                  ].map((cat) => (
                    <button 
                      key={cat.id}
                      onClick={() => setLibraryFilter(cat.id as any)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                        libraryFilter === cat.id 
                          ? 'bg-blue-600 border-blue-600 text-white shadow' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Grid of lessons/techniques */}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'tech-hook', title: 'Raspagem de Gancho Clássica', cat: 'guard', diff: 'Fácil', belt: 'Faixa Branca', len: '2:50', steps: ["Pegue na gola oposta e na manga oposta", "Aproxime seu quadril entrando o gancho esquerdo", "Chute o gancho para cima enquanto puxa a manga", "Suba consolidando a passagem ou raspagem"] },
                    { id: 'tech-halfpass', title: 'Passagem de Guarda Meia-Lua', cat: 'pass', diff: 'Médio', belt: 'Faixa Azul', len: '3:45', steps: ["Controle o quadril adversário contra o tatame", "Esgrima o braço oposto e cole o peito no peito", "Deslize o joelho diagonalmente sobre a meia guarda de forma firme", "Abaixe o centro de gravidade e consolide no cem quilos"] },
                    { id: 'tech-doubleleg', title: 'Double Leg Explosivo', cat: 'takedown', diff: 'Médio', belt: 'Faixa Branca', len: '4:10', steps: ["Mantenha a postura bem baixa e simule um jab de contato", "Dê o passo de penetração direto entre as pernas do oponente", "Segure atrás das dobras dos dois joelhos puxando para si", "Empurre com a cabeça na costela lateral do oponente"] },
                    { id: 'tech-armlock', title: 'Armbar da Guarda Fechada', cat: 'submission', diff: 'Fácil', belt: 'Faixa Branca', len: '3:15', steps: ["Domine o punho adversário", "Coloque o pé no quadril oposto e faça o giro angular de fuga", "Passe a perna sobre a cabeça colando ambos os calcanhares", "Eleve o quadril mantendo o dedão dele apontado para cima"] },
                    { id: 'tech-mountesc', title: 'Escape da Montada Pontes & Rolo', cat: 'defense', diff: 'Fácil', belt: 'Faixa Branca', len: '3:00', steps: ["Prenda um dos braços do adversário colado exatamente ao peito", "Segure o mesmo pé do lado do ombro preso", "Upa com força extraordinária elevando o quadril", "Gire sobre o ombro livre caindo na guarda fechada"] },
                    { id: 'tech-doubleunder', title: 'Passagem Emborrachando a Guarda', cat: 'pass', diff: 'Avançado', belt: 'Faixa Roxa', len: '5:20', steps: ["Passe ambos os braços por baixo das coxas do adversário", "Junte as mãos acima do quadril travando a lombar dele no tatame", "Pressione empurrando o quadril para cima com a cabeça dele dobrada", "Passe de lado para o cem quilos de maneira firme"] },
                  ]
                  .filter(t => libraryFilter === 'all' || t.cat === libraryFilter)
                  .map((tech) => (
                    <div 
                      key={tech.id} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 hover:border-blue-500/30 transition-all relative group shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[7px] font-black uppercase rounded">{tech.diff}</span>
                            <span className="px-2 py-0.5 bg-blue-100/40 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[7px] font-black uppercase rounded">{tech.belt}</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{tech.title}</h4>
                          <p className="text-[8px] font-bold text-slate-450 uppercase tracking-widest">{tech.len} • Vídeo Instrutivo</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => toggleFavorite(tech.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              favorites.includes(tech.id) 
                                ? 'bg-amber-400 border-amber-400 text-slate-900 shadow-sm' 
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                            }`}
                          >
                            <Star size={12} className="fill-current" />
                          </button>
                        </div>
                      </div>

                      {/* Video Player representation */}
                      <div className="aspect-video bg-slate-950 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                        <div className="absolute top-4 left-4 z-25 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] font-mono font-bold text-slate-200 uppercase">TRANSMISSÃO HD</span>
                        </div>
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 hover:bg-blue-500 transition-all z-20 shadow-xl shadow-blue-600/30">
                          <Play size={20} className="translate-x-0.5" />
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-3 z-20 font-mono">REPRODUZIR VIDEO TUTORIAL DE POSIÇÃO</span>
                      </div>

                      {/* Steps Checklist representation */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <h5 className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen size={11} className="text-blue-500" /> Passo a Passo da Posição:
                        </h5>
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl text-[8px] font-bold text-slate-450 dark:text-slate-400 list-decimal space-y-1.5 leading-relaxed">
                          {tech.steps.map((st, sidx) => (
                            <div key={sidx} className="flex gap-2">
                              <span className="text-blue-500">{sidx + 1}.</span>
                              <span className="uppercase">{st}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                  }
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'raffle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-left pb-24"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-400/10 rounded-full flex items-center justify-center text-blue-500 text-xl">
                🎟️
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Campanhas de Rifas & Arrecadações
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Apoie os atletas, projetos e viagens do Dojo comprando números de rifa. OSS!
                </p>
              </div>
            </div>

            {/* List of passive/active campaigns */}
            {(() => {
              const studentRaffles = products
                .filter((p: any) => p.category === 'RAFFLE')
                .map((p: any) => {
                  let meta: any = {
                    descriptionText: p.description || '',
                    status: 'OPEN',
                    totalNumbers: p.stock || 100,
                    ticketPrice: p.price || 10,
                    winnerNumber: null,
                    winnerStudentId: null,
                    winnerStudentName: null,
                    drawnAt: null,
                    tickets: {}
                  };

                  if (p.description && p.description.startsWith('{')) {
                    try {
                      meta = { ...meta, ...JSON.parse(p.description) };
                    } catch (e) {
                      console.error('[STUDENT PORTAL RAFFLE DECODE ERROR]', e);
                    }
                  }

                  return {
                    id: p.id,
                    name: p.name,
                    imageUrl: p.imageUrl,
                    active: p.active,
                    createdAt: p.createdAt,
                    ...meta
                  };
                });

              if (studentRaffles.length === 0) {
                return (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <span className="text-3xl">🎫</span>
                    <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 mt-2">Nenhuma Campanha no Momento</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                      O Sensei ainda não cadastrou nenhuma campanha de rifa ativa. Fique atento às novidades no tatame! OSS!
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {studentRaffles.map((r) => {
                    const totalSold = Object.keys(r.tickets).length;
                    const soldPct = Math.round((totalSold / r.totalNumbers) * 100);
                    
                    // Filter tickets purchased by this student
                    const myTickets = Object.entries(r.tickets)
                      .filter(([_, ticketInfo]: [string, any]) => ticketInfo.studentId === student?.id)
                      .map(([numStr]) => numStr)
                      .sort();

                    const myCost = myTickets.length * r.ticketPrice;

                    return (
                      <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
                        
                        {/* Title and Badge */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-855/80 pb-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 leading-tight">
                              {r.name}
                            </h4>
                            <p className="subtitle text-xs text-slate-500 dark:text-slate-400">
                              {r.descriptionText}
                            </p>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap ${
                            r.status === 'DRAWN'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/40'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/40'
                          }`}>
                            {r.status === 'DRAWN' ? 'Sorteado' : 'Em Aberto'}
                          </span>
                        </div>

                        {/* WINNER SHOWCASE */}
                        {r.status === 'DRAWN' && (
                          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-200 dark:border-yellow-905/40 rounded-2xl flex items-center gap-3">
                            <span className="text-3xl text-yellow-500">🏆</span>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-400 leading-none">
                                Ganhador Sorteado!
                              </p>
                              <p className="text-xs font-bold text-slate-855 dark:text-slate-100 mt-1 uppercase">
                                {r.winnerStudentId === student?.id ? 'Parabéns! Você foi o ganhador!' : `Ganhador: ${r.winnerStudentName}`}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Cota Contemplada: <span className="font-mono font-black text-xs text-amber-700 dark:text-amber-400">Nº {r.winnerNumber}</span>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* PROGRESS BLOCK */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block pb-0.5">Preço da Cota</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">R$ {r.ticketPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block pb-0.5">Cotas Vendidas</span>
                            <span className="font-bold text-slate-705 dark:text-slate-350 text-xs">{totalSold} / {r.totalNumbers} vendidos ({soldPct}%)</span>
                          </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="w-full h-1.5 bg-slate-105 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${soldPct}%` }} />
                        </div>

                        {/* PROFESSOR SUB-TABS SELECTOR */}
                        {(student?.isInstructor || student?.isClassProfessor) && (
                          <div className="flex border-b border-slate-100 dark:border-slate-800 pb-0.5 gap-2 pt-1" id={`student-raffle-tabs-${r.id}`}>
                            <button
                              type="button"
                              onClick={() => setRaffleSubTab('board')}
                              className={`pb-2 px-2 text-xs font-black uppercase tracking-wider relative transition-all ${
                                raffleSubTab === 'board'
                                  ? 'text-blue-605 dark:text-blue-400 border-b-2 border-blue-605 dark:border-blue-400'
                                  : 'text-slate-400 hover:text-slate-705 dark:hover:text-slate-350'
                              }`}
                            >
                              📋 Quadro Interativo
                            </button>
                            <button
                              type="button"
                              onClick={() => setRaffleSubTab('cartela')}
                              className={`pb-2 px-3 text-xs font-black uppercase tracking-wider relative transition-all ${
                                raffleSubTab === 'cartela'
                                  ? 'text-blue-605 dark:text-blue-400 border-b-2 border-blue-650 dark:border-blue-400'
                                  : 'text-slate-400 hover:text-slate-705 dark:hover:text-slate-350'
                              }`}
                            >
                              🎟️ Prévia da Cartela Oficial
                            </button>
                          </div>
                        )}

                        {raffleSubTab === 'cartela' && (student?.isInstructor || student?.isClassProfessor) ? (
                          /* TAB 2: PRINTER AND DOJO RAFFLE SHEET PREVIEW (CARTELA) */
                          <div className="space-y-6 pt-2" id={`student-raffle-cartela-view-${r.id}`}>
                            {/* ADMINISTRATIVE ACTION BAR */}
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-500/10 dark:bg-blue-400/5 p-4 rounded-2xl border border-blue-500/20">
                              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-xs font-semibold">
                                <Info className="w-4 h-4 shrink-0 text-blue-500" />
                                <span>Sensei, use esta visualização física para imprimir e afixar no dojo se desejar!</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const shareUrl = `${window.location.origin}/student-portal/${code}`;
                                    navigator.clipboard.writeText(shareUrl);
                                    alert("Link do Portal do Aluno copiado com sucesso para compartilhar!");
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-705 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Copiar Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-707 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Imprimir Cartela
                                </button>
                              </div>
                            </div>

                            {/* PHYSICAL CONTAINER TO MOCK TICKET SHEET */}
                            <div className="border-4 border-double border-slate-300 dark:border-slate-700 bg-amber-50/15 dark:bg-slate-900/40 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
                              
                              {/* Substantial left stub / Canhoto de Apoio */}
                              <div className="md:col-span-1 border-r border-dashed border-slate-300 dark:border-slate-750 pr-4 space-y-4 print:border-r">
                                <div className="space-y-1 text-center border-b border-slate-200/50 pb-2">
                                  <p className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-550 uppercase">CANHOTO OFICIAL</p>
                                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">SYSBJJ 2.0 DOJO</p>
                                  <p className="text-[8px] font-mono text-slate-500 truncate max-w-full">Reg: {r.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                
                                <div className="space-y-2 text-left">
                                  <div>
                                    <span className="text-[8px] text-slate-400 block font-bold uppercase">CAMPANHA</span>
                                    <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 line-clamp-2">{r.name}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-400 block font-bold uppercase">VALOR UNITÁRIO</span>
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">R$ {r.ticketPrice.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-400 block font-bold uppercase">COTAS RESERVADAS</span>
                                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">{totalSold} / {r.totalNumbers}</span>
                                  </div>
                                </div>

                                {/* Stamped List of Reservas */}
                                <div className="space-y-1 border-t border-slate-200/50 pt-2 text-left">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">RELAÇÃO DE COTAS</p>
                                  <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 font-mono text-[9px] text-slate-600 dark:text-slate-400">
                                    {Object.keys(r.tickets).length === 0 ? (
                                      <p className="text-[8px] italic text-slate-450">Nenhuma cota reservada ainda.</p>
                                    ) : (
                                      Object.keys(r.tickets).sort().map((numStr) => {
                                        const buyer = r.tickets[numStr];
                                        return (
                                          <div key={numStr} className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-950/40 p-1 px-1.5 rounded border border-slate-100/30">
                                            <span className="font-bold text-slate-800 dark:text-slate-300">Nº {numStr}</span>
                                            <span className="truncate max-w-[85px] font-semibold text-slate-550">{buyer.studentName.split(' ')[0]}</span>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>

                                {/* Watermark */}
                                <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-center">
                                  <div className="w-14 h-14 rounded-full border-2 border-double border-red-500/40 flex flex-col items-center justify-center rotate-[-12deg] text-red-500/55 p-1 text-center select-none">
                                    <span className="text-[6px] font-bold leading-none uppercase">PROFESSOR</span>
                                    <span className="text-[7px] font-black leading-none my-0.5">SENSEI</span>
                                    <span className="text-[5px] font-bold uppercase leading-none">SYSBJJ 2.0</span>
                                  </div>
                                </div>
                              </div>

                              {/* Main raffle body */}
                              <div className="md:col-span-3 space-y-4 text-left">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-double border-slate-300/60 pb-3">
                                  <div>
                                    <span className="px-2 py-0.5 bg-blue-600 text-white font-black text-[8px] rounded uppercase tracking-wider">AÇÃO ENTRE AMIGOS</span>
                                    <h4 className="text-md font-extrabold text-slate-800 dark:text-white mt-1 uppercase tracking-tight">CAMPANHA COOPERATIVA DO TATAME</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Arrecadação tecnológica integrada do Dojo beneficente</p>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                                    <p className="text-[8px] font-black text-slate-405 uppercase tracking-widest">Apoiador</p>
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">R$ {r.ticketPrice.toFixed(2)}</p>
                                  </div>
                                </div>

                                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">PRÊMIO DA RIFA</span>
                                  <span className="text-xs font-black text-slate-850 dark:text-white block uppercase mt-0.5">{r.name}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{r.descriptionText}</span>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">MAPA DE DISPONIBILIDADE DA CARTELA</p>
                                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                                    {Array.from({ length: r.totalNumbers }, (_, i) => {
                                      const numStr = (i + 1).toString().padStart(2, '0');
                                      const buyer = r.tickets[numStr];
                                      const isSold = !!buyer;
                                      const isDrawnWinner = r.winnerNumber === (i + 1);

                                      return (
                                        <div
                                          key={i}
                                          className={`p-2 py-3 border rounded-xl flex flex-col items-center justify-center font-mono transition-all text-center ${
                                            isDrawnWinner
                                              ? 'bg-emerald-500 border-emerald-600 text-white font-black'
                                              : isSold
                                              ? 'bg-blue-100/55 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-350'
                                              : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                                          }`}
                                        >
                                          <span className="text-xs font-bold">{numStr}</span>
                                          {isDrawnWinner ? (
                                            <span className="text-[7px] font-black uppercase tracking-tight mt-0.5 truncate max-w-full">GANHADOR</span>
                                          ) : isSold ? (
                                            <span className="text-[7px] font-bold text-blue-900/60 dark:text-blue-400/80 uppercase tracking-tighter truncate max-w-full mt-0.5">
                                              {buyer.studentName.split(' ')[0].slice(0, 6)}
                                            </span>
                                          ) : (
                                            <span className="text-[7px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-tighter mt-0.5">LIVRE</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-[9px] text-slate-500 leading-tight">
                                  <p className="font-semibold uppercase tracking-widest text-[8px] mb-1">REGULAMENTO DO TATAME</p>
                                  <p>O sorteio será efetuado pelo Sensei na presença de todos os interessados de forma 100% digital e auditável, eliminando cotas sem proprietário para que o prêmio seja entregue na primeira rodada. Todo valor é transferido para subsidiar despesas esportivas e operacionais. OSS!</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* MY RESERVED NUMBERS BOX */}
                            {myTickets.length > 0 && (
                              <div className="bg-blue-50/70 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/40 p-3.5 rounded-2xl space-y-1 rounded-xl">
                                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                  <span>🎟️ Minhas Cotas Reservadas ({myTickets.length})</span>
                                </p>
                                <p className="text-xs font-extrabold text-blue-900 dark:text-blue-105 font-mono">
                                  {myTickets.join(', ')}
                                </p>
                                <p className="text-[9px] text-slate-550 leading-tight">
                                  Valor total de apoio ao Dojo: <span className="font-bold font-mono text-xs">R$ {myCost.toFixed(2)}</span>
                                </p>
                              </div>
                            )}

                            {/* NUMBERS BOARD GRID */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                                <span>Selecione uma cota de apoio</span>
                                <span>{r.totalNumbers - totalSold} livres</span>
                              </div>

                              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                                {Array.from({ length: r.totalNumbers }, (_, idx) => {
                                  const numStr = (idx + 1).toString().padStart(2, '0');
                                  const ticket = r.tickets[numStr];
                                  const isReserved = !!ticket;
                                  const isMine = isReserved && ticket.studentId === student?.id;
                                  const isDrawnWinner = r.winnerNumber === (idx + 1);

                                  return (
                                    <button
                                      key={idx}
                                      disabled={isReserved || r.status === 'DRAWN'}
                                      onClick={() => {
                                        if (!student) {
                                          alert("Erro de autenticação: Aluno inválido.");
                                          return;
                                        }
                                        if (confirm(`🥋 Deseja reservar a Cota Nº ${numStr} no seu nome na rifa?\n\nValor: R$ ${r.ticketPrice.toFixed(2)}`)) {
                                          // Assign ticket on server
                                          const newTickets = { ...r.tickets };
                                          newTickets[numStr] = {
                                            studentId: student.id,
                                            studentName: student.name,
                                            soldAt: new Date().toISOString()
                                          };

                                          const updatedMeta: any = {
                                            descriptionText: r.descriptionText,
                                            status: r.status,
                                            totalNumbers: r.totalNumbers,
                                            ticketPrice: r.ticketPrice,
                                            winnerNumber: r.winnerNumber,
                                            winnerStudentId: r.winnerStudentId,
                                            winnerStudentName: r.winnerStudentName,
                                            drawnAt: r.drawnAt,
                                            tickets: newTickets
                                          };

                                          updateProduct(r.id, {
                                            description: JSON.stringify(updatedMeta)
                                          });
                                        }
                                      }}
                                      className={`p-2 py-3 text-xs font-bold font-mono rounded-xl border text-center transition-all ${
                                        isDrawnWinner
                                          ? 'bg-emerald-500 border-emerald-600 text-white font-black'
                                          : isMine
                                          ? 'bg-blue-600 border-blue-600 text-white font-black'
                                          : isReserved
                                          ? 'bg-slate-100 border-slate-150 text-slate-400 cursor-not-allowed dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-650'
                                          : 'bg-slate-50 border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'
                                      }`}
                                    >
                                      {numStr}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              {/* Legend explanation */}
                              <div className="flex items-center gap-4 text-[9px] font-semibold text-slate-450 pt-1.5 justify-start">
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded bg-slate-55 border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                                  Livre
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-150 dark:bg-slate-900 dark:border-slate-800" />
                                  Ocupado
                                </div>
                                <div className="flex items-center gap-1 text-blue-600">
                                  <span className="w-2.5 h-2.5 rounded bg-blue-600 border border-blue-600" />
                                  Sua Cota
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        )}
      </main>

      {showScanner && (
        <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm aspect-square bg-slate-900 border-4 border-blue-600 rounded-[3rem] relative overflow-hidden flex items-center justify-center">
            <div id="reader" className="w-full h-full object-cover"></div>
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-600 animate-[scan_2s_infinite] pointer-events-none" />
          </div>
          <div className="mt-8 text-center space-y-4">
            <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-50">{t('portal.qrInstructions')}</p>
            <button onClick={() => setShowScanner(false)} className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {showPix && student && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-sm w-full text-center space-y-6 relative">
            <button onClick={() => setShowPix(false)} className="absolute top-8 right-8 text-slate-400"><X /></button>
            <h3 className="text-xl font-black text-slate-900 uppercase">{t('portal.directPayment')}</h3>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatePixPayload(student.monthlyValue))}`} className="w-48 h-48 mx-auto" alt={t('portal.qrAlt')} referrerPolicy="no-referrer" />
            </div>
            <button onClick={() => { navigator.clipboard.writeText(generatePixPayload(student.monthlyValue)); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">{copied ? t('portal.copied').toUpperCase() : t('portal.copyPix').toUpperCase()}</button>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-sm w-full text-center space-y-6 relative">
            <button onClick={() => setShowReceipt(false)} className="absolute top-8 right-8 text-slate-400"><X /></button>
            <h3 className="text-xl font-black text-slate-900 uppercase">{t('portal.uploadReceipt')}</h3>
            
            {!paymentProcessing ? (
              <div className="space-y-6">
                <label className="block border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  {receiptFile ? (
                    <img src={receiptFile} className="w-full h-32 object-contain rounded-xl" alt="Visualização do comprovante" />
                  ) : (
                    <>
                      <ImageIcon size={48} className="text-slate-200" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('portal.uploadReceipt')}</p>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                </label>
                <button 
                  onClick={handleConfirmReceipt}
                  disabled={!receiptFile}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${receiptFile ? 'bg-blue-600 text-white shadow-xl active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  {t('common.confirm')}
                </button>
              </div>
            ) : (
              <div className="py-12 space-y-6">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{t('portal.paymentConfirmed')}</p>
                  <p className="text-[8px] font-bold text-blue-500 uppercase tracking-[0.3em] mt-2 animate-pulse">{t('portal.blockchainVerify')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liability Waiver Modal */}
      {showWaiver && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3rem] p-10 max-w-sm w-full space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
            <button onClick={() => setShowWaiver(false)} className="absolute top-8 right-8 text-slate-400 group">
              <X className="group-hover:rotate-90 transition-transform" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('medical.waiverTitle')}</h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                  "{t('medical.waiverModel')}"
                </p>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                Ao clicar em aceitar, você confirma que leu e concorda com os termos de responsabilidade para a prática de atividades físicas.
              </p>
              <button 
                onClick={handleAcceptWaiver}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                {t('medical.waiverAccept')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Medical Certificate Upload Modal */}
      {showMedicalUpload && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3rem] p-10 max-w-sm w-full space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-rose-600" />
            <button onClick={() => setShowMedicalUpload(false)} className="absolute top-8 right-8 text-slate-400 group">
              <X className="group-hover:rotate-90 transition-transform" />
            </button>
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('medical.certificate')}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{t('medical.certificateDesc')}</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('medical.receiptDate')}</label>
                  <input 
                    type="date" 
                    value={medicalIssueDate}
                    onChange={(e) => setMedicalIssueDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase"
                  />
                </div>

                <label className="block border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  {medicalFile ? (
                    <div className="relative">
                      <img src={medicalFile} className="w-full h-32 object-contain rounded-xl" alt="Visualização do atestado" />
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <RefreshCw className="text-white animate-spin-slow" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileText size={48} className="text-slate-100" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('medical.uploadBtn')}</p>
                    </>
                  )}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleMedicalUpload} />
                </label>
                
                <p className="text-[8px] font-bold text-rose-600 uppercase tracking-widest text-center">
                  * {t('medical.annualRenewal')}
                </p>

                <button 
                  onClick={handleConfirmMedical}
                  disabled={!medicalFile}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${medicalFile ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showAddVideo && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-sm w-full space-y-6 relative overflow-hidden text-left"
          >
            <button onClick={() => setShowAddVideo(false)} className="absolute top-8 right-8 text-slate-400 group">
              <X className="group-hover:rotate-90 transition-transform" />
            </button>
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('portal.addVideoTitle', 'Adicionar Vídeo')}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{t('portal.addVideoDesc', 'Compartilhe um vídeo do YouTube de estudos de posição')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('portal.videoTitle', 'Título da Posição')}</label>
                  <input 
                    type="text" 
                    placeholder="EX: Raspagem de Meia Guarda Profunda"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-black uppercase dark:text-white"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('portal.videoUrl', 'URL do Vídeo (YouTube)')}</label>
                  <input 
                    type="text" 
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newVideo.videoUrl}
                    onChange={(e) => setNewVideo(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold dark:text-white"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('portal.videoNotes', 'Descrição / Notas de Estudo')}</label>
                  <textarea 
                    placeholder="Detalhes sobre a passagem de guarda, esgrima, finta, etc..."
                    value={newVideo.description}
                    onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-[10px] font-medium dark:text-white min-h-[100px] resize-none"
                  />
                </div>

                <button 
                  onClick={handleAddVideo}
                  disabled={!newVideo.title || !newVideo.videoUrl}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${newVideo.title && newVideo.videoUrl ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 active:scale-95 hover:bg-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                >
                  {t('portal.addVideoBtn', 'Confirmar Envio')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-start sm:justify-around gap-6 sm:gap-0 z-50 overflow-x-auto no-scrollbar scrollbar-hide scroll-smooth">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}><Zap size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navHome')}</span></button>
        <button onClick={() => setActiveTab('training')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'training' ? 'text-blue-600' : 'text-slate-400'}`}><Play size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navTraining')}</span></button>
        <button onClick={() => setActiveTab('homeTraining')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'homeTraining' ? 'text-blue-600' : 'text-slate-400'}`}><Dumbbell size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navHomeTraining')}</span></button>
        <button onClick={() => setActiveTab('knowledge')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'knowledge' ? 'text-blue-600' : 'text-slate-400'}`}><BookOpen size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navKnowledge')}</span></button>
        <button onClick={() => setActiveTab('community')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'community' ? 'text-blue-600' : 'text-slate-400'}`}><Users size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navCommunity')}</span></button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'wallet' ? 'text-blue-600' : 'text-slate-400'}`}><CreditCard size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navWallet')}</span></button>
        <button onClick={() => setActiveTab('raffle')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'raffle' ? 'text-blue-600' : 'text-slate-400'}`}><Ticket size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">Rifas</span></button>
        <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'gallery' ? 'text-blue-600' : 'text-slate-400'}`}><ImageIcon size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navGallery')}</span></button>
        <button onClick={() => setActiveTab('timer')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'timer' ? 'text-blue-600' : 'text-slate-400'}`}><Timer size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navTimer')}</span></button>
        <button onClick={() => setActiveTab('rules')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'rules' ? 'text-blue-600' : 'text-slate-400'}`}><Shield size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navRules')}</span></button>
      </nav>

      <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } @keyframes scan { 0% { transform: translateY(-150px); } 100% { transform: translateY(150px); } } `}</style>
    </div>
  );
};

export default StudentPortal;
