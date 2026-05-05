
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, Flame, Calendar, BookOpen, 
  ArrowRight, Shield, Zap, Plus, LogOut, Scale, Gamepad2, Award, Play,
  QrCode, Clock, Info, Camera, CheckCircle2, AlertTriangle, X, Copy, Image as ImageIcon, Download, Maximize2,
  RefreshCw, FileText, Upload, ShieldCheck, AlertCircle, ShieldAlert, ChevronRight,
  Map, Star, Users2, Medal, Presentation, ClipboardCheck, GraduationCap, Check,
  CreditCard, Video, ExternalLink, MessageSquare, Cake, TrendingUp, Users,
  Target, Dumbbell, Activity, ClipboardList, MapPin, Instagram
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { StudentStatus, GalleryImage, BeltColor, KidsBeltColor } from '../types';
import { BELT_COLORS, IBJJF_BELT_RULES } from '../constants';
import { IBJJF_LESSONS, RuleLesson, RuleScenario } from '../constants/rulesData';
import ReactMarkdown from 'react-markdown';

import { 
  ResponsiveContainer, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import CryptoJS from 'crypto-js';
import { calculateDistance, getCurrentLocation } from '../services/locationUtils';

const StudentPortal: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t, tObj } = useTranslation();
  const { students, recordAttendance, gallery, payments, addGalleryImage, addReceipt, completeRuleLesson, logs } = useData();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'training' | 'knowledge' | 'community' | 'wallet' | 'gallery' | 'homeTraining'>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [geofenceStatus, setGeofenceStatus] = useState<'idle' | 'verifying' | 'success' | 'fail'>('idle');
  const [copied, setCopied] = useState(false);
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
    alert(t('portal.workoutSaved'));
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

  const student = useMemo(() => students.find(s => s.portalAccessCode === code), [students, code]);

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
    // Simulate tactical data based on student points and attributes
    // In a real app this would come from pedagogical assessments
    const base = student.rewardPoints || 0;
    return [
      { subject: t('portal.technicalGrade'), A: Math.min(100, 40 + (base % 50)) },
      { subject: t('portal.tacticalIntelligence'), A: Math.min(100, 30 + (student.rulesKnowledge || 0)) },
      { subject: t('portal.physicalCondition'), A: Math.min(100, 50 + (student.currentStreak || 0) * 5) },
      { subject: t('portal.biomechanics'), A: Math.min(100, 45 + (student.attendanceCount % 40)) },
      { subject: t('portal.defense'), A: Math.min(100, 60 + (student.stripes * 5)) },
      { subject: t('portal.offense'), A: Math.min(100, 35 + (student.rewardPoints % 60)) },
    ];
  }, [student, t]);

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
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [code]);

  const handleScanSimulation = async () => {
    if (student) {
      // Geofencing Check
      if (profile.latitude && profile.longitude) {
        setGeofenceStatus('verifying');
        try {
          const position = await getCurrentLocation();
          const dist = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            profile.latitude,
            profile.longitude
          );
          
          if (dist > (profile.geofenceRadius || 100)) {
            setGeofenceStatus('fail');
            alert(`${t('attendance.geoFail')}: ${Math.round(dist)}m`);
            return;
          }
          setGeofenceStatus('success');
        } catch (error) {
          setGeofenceStatus('fail');
          alert(t('attendance.geoFail'));
          return;
        }
      }

      recordAttendance([student.id]);
      setCheckinSuccess(true);
      setShowScanner(false);
      setTimeout(() => setCheckinSuccess(false), 3000);
    }
  };

  const generatePixPayload = (amount: number) => {
    return `00020126580014br.gov.bcb.pix01${profile.pixKey.length}${profile.pixKey}52040000530398654${amount.toFixed(2).length}${amount.toFixed(2)}5802BR59${profile.pixName.length}${profile.pixName.slice(0, 25)}60${profile.pixCity.length}${profile.pixCity}62070503OSS6304D1BB`;
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
        
        scanner.render(async (decodedText) => {
          if (student) {
            // Geofencing Check
            if (profile.latitude && profile.longitude) {
              setGeofenceStatus('verifying');
              try {
                const position = await getCurrentLocation();
                const dist = calculateDistance(
                  position.coords.latitude,
                  position.coords.longitude,
                  profile.latitude,
                  profile.longitude
                );
                
                if (dist > (profile.geofenceRadius || 100)) {
                  setGeofenceStatus('fail');
                  alert(`${t('attendance.geoFail')}: ${Math.round(dist)}m`);
                  return;
                }
                setGeofenceStatus('success');
              } catch (error) {
                setGeofenceStatus('fail');
                alert(t('attendance.geoFail'));
                return;
              }
            }

            recordAttendance([student.id]);
            setCheckinSuccess(true);
            setShowScanner(false);
            setTimeout(() => setCheckinSuccess(false), 3000);
            if (scanner) scanner.clear().catch(e => console.error(e));
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
  }, [showScanner, student]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-8 text-center font-black uppercase tracking-tighter">{t('portal.invalidCode')}</div>;

  const isOverdue = student.status === StudentStatus.OVERDUE || (!hasPaidCurrentMonth && student.dueDay < new Date().getDate());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors">
      <main className="max-w-md mx-auto p-4 space-y-6">
        {activeTab === 'home' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
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
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[7px] font-black uppercase tracking-[0.2em] rounded border border-blue-500/20">{t('common.verifiedMember')}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[7px] font-black uppercase tracking-[0.2em] rounded border border-emerald-500/20">{t('common.blockchainIdLabel')}: {blockchainHash}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none mb-2">{student.name}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${BELT_COLORS[student.belt]}`}>
                      {t(`belts.${student.belt}`)}
                    </div>
                    <div className="flex gap-1">
                      {[...Array(student.stripes)].map((_, i) => (
                        <div key={i} className="w-1 h-4 bg-white rounded-full opacity-80" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockchain Badge Section */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
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
                      name="Student"
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
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star size={20} />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('portal.schoolAverage')}</p>
                <p className="text-lg font-black text-emerald-500 tabular-nums">{schoolAverageXP}</p>
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
                  className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-slate-50"
                >
                   Aceitar Desafio <ArrowRight size={14} />
                </button>
              </div>
              <Trophy className="absolute bottom-[-20px] right-[-20px] text-white/5 group-hover:scale-110 transition-transform duration-1000" size={180} />
            </div>

            {/* Next Check-in Action */}
            <div className="space-y-4">
              <button 
                onClick={() => setShowScanner(true)} 
                className="w-full py-7 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 hover:bg-black transition-all border border-white/5"
              >
                <Camera size={24} className="text-blue-500" /> {t('portal.checkinBtn')}
              </button>
              
              {geofenceStatus !== 'idle' && (
                <div className={`flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] ${geofenceStatus === 'success' ? 'text-emerald-500' : geofenceStatus === 'fail' ? 'text-red-500' : 'text-blue-500 animate-pulse'}`}>
                   <MapPin size={10} />
                   {geofenceStatus === 'verifying' && 'Verificando Localização...'}
                   {geofenceStatus === 'success' && 'Localização Validada'}
                   {geofenceStatus === 'fail' && 'Fora da Área Permitida'}
                </div>
              )}
              
              {checkinSuccess && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500 text-white p-4 rounded-3xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('portal.checkinSuccess')}</span>
                </motion.div>
              )}
            </div>

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
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('portal.evolutionTitle')}</h3>
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Caminho da Graduação</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <GraduationCap size={24} />
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('students.timeInBelt')}</p>
                    <p className="text-[10px] font-black dark:text-white leading-none">{graduationAnalysis?.monthsInBelt} / {graduationAnalysis?.minMonths}m</p>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${graduationAnalysis?.timeProgress}%` }}
                      className="h-full bg-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('students.studentReport')}</p>
                    <p className="text-[10px] font-black dark:text-white leading-none">{student.attendanceCount} / {graduationAnalysis?.attendanceThreshold}</p>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${graduationAnalysis?.attendanceProgress}%` }}
                      className="h-full bg-cyan-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Path Visualization */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Map size={14} className="text-blue-600" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.nextBelts')}</p>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2">
                  <div className="flex flex-col items-center gap-2 scale-90 opacity-60">
                    <div className={`w-12 h-1.5 rounded-full ${BELT_COLORS[student.belt]}`} />
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{t(`belts.${student.belt}`)}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-14 h-2 rounded-full ${BELT_COLORS[graduationAnalysis?.nextBelt || 'White']} shadow-sm ring-2 ring-blue-500/20`} />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">{t(`belts.${graduationAnalysis?.nextBelt}`)}</span>
                  </div>
                  {graduationAnalysis?.futurePath.slice(1).map((fb, idx) => (
                    <React.Fragment key={fb}>
                      <ChevronRight size={14} className="text-slate-200" />
                      <div className="flex flex-col items-center gap-2 scale-75 opacity-20">
                        <div className={`w-10 h-1.5 rounded-full ${BELT_COLORS[fb]}`} />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{t(`belts.${fb}`)}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Technical Exam Requirements */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={20} className="text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('common.examRequirements')}</h3>
                </div>
                <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full uppercase">
                  {Object.values(student.examRequirements || {}).filter(v => v).length} / {((tObj(`beltRequirements.${graduationAnalysis?.nextBelt || 'White'}`) as string[]) || []).length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {((tObj(`beltRequirements.${graduationAnalysis?.nextBelt || 'White'}`) as string[]) || []).map((req, idx) => (
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
                      src={video.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
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
                                  <CheckCircle2 size={8} /> MASTERED
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
        <div className="pt-12 pb-8 border-t border-slate-200 dark:border-white/5 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck size={24} className="text-blue-600" />
            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter italic text-center">SYSBJJ INTELLIGENCE SYSTEM 2.0</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center gap-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">© 2026 SYBJJ BY CT Pedro Honorio</p>
                <a href="https://instagram.com/sistemabjj" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-blue-600 hover:text-blue-500 transition-all uppercase tracking-widest italic flex items-center gap-1.5">
                  <Instagram size={10} />
                  <span>@SISTEMABJJ</span>
                </a>
              </div>
              <p className="text-[7px] font-bold text-slate-400 opacity-60 uppercase tracking-widest">Criado e Produzido por PPH e CT PH de JIU-JITSU</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] italic">SYSBJJ INTELLIGENCE SYSTEM 2.0</p>
              <span className="text-[6px] font-black text-blue-600 uppercase tracking-widest leading-none">Security_Node_Active</span>
              <span className="text-[6px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-40">Hash: SHA-256_Automatic_Sync_Enabled</span>
            </div>
          </div>
        </div>
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
                    <img src={receiptFile} className="w-full h-32 object-contain rounded-xl" alt="Receipt preview" />
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
                      <img src={medicalFile} className="w-full h-32 object-contain rounded-xl" alt="Certificate preview" />
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

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-start sm:justify-around gap-6 sm:gap-0 z-50 overflow-x-auto no-scrollbar scroll-smooth">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}><Zap size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navHome')}</span></button>
        <button onClick={() => setActiveTab('training')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'training' ? 'text-blue-600' : 'text-slate-400'}`}><Play size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navTraining')}</span></button>
        <button onClick={() => setActiveTab('homeTraining')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'homeTraining' ? 'text-blue-600' : 'text-slate-400'}`}><Dumbbell size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navHomeTraining')}</span></button>
        <button onClick={() => setActiveTab('knowledge')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'knowledge' ? 'text-blue-600' : 'text-slate-400'}`}><BookOpen size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navKnowledge')}</span></button>
        <button onClick={() => setActiveTab('community')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'community' ? 'text-blue-600' : 'text-slate-400'}`}><Users size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navCommunity')}</span></button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'wallet' ? 'text-blue-600' : 'text-slate-400'}`}><CreditCard size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navWallet')}</span></button>
        <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center gap-1 shrink-0 ${activeTab === 'gallery' ? 'text-blue-600' : 'text-slate-400'}`}><ImageIcon size={22} /><span className="text-[7px] font-black uppercase whitespace-nowrap">{t('portal.navGallery')}</span></button>
      </nav>

      <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } @keyframes scan { 0% { transform: translateY(-150px); } 100% { transform: translateY(150px); } } `}</style>
    </div>
  );
};

export default StudentPortal;
