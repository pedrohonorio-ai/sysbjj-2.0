
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, Flame, Calendar, BookOpen, 
  ArrowRight, Shield, Zap, Plus, LogOut, Scale, Gamepad2, Award, Play,
  QrCode, Clock, Info, Camera, CheckCircle2, AlertTriangle, X, Copy, Image as ImageIcon, Download, Maximize2,
  RefreshCw, FileText, Upload, ShieldCheck, AlertCircle, ShieldAlert, ChevronRight,
  Map, Star, Users2, Medal, Presentation, ClipboardCheck, GraduationCap, Check
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { StudentStatus, GalleryImage, BeltColor, KidsBeltColor } from '../types';
import { BELT_COLORS, IBJJF_BELT_RULES } from '../constants';
import { IBJJF_LESSONS, RuleLesson, RuleScenario } from '../constants/rulesData';
import ReactMarkdown from 'react-markdown';
import * as Icons from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const StudentPortal: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t, tObj } = useTranslation();
  const { students, recordAttendance, gallery, payments, addGalleryImage, addReceipt, completeRuleLesson } = useData();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'curriculum' | 'wallet' | 'gallery' | 'ranking' | 'rules' | 'videos'>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryImage | null>(null);
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [showWaiver, setShowWaiver] = useState(false);
  const [showMedicalUpload, setShowMedicalUpload] = useState(false);
  const [medicalFile, setMedicalFile] = useState<string | null>(null);
  const [medicalIssueDate, setMedicalIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const { updateStudent } = useData();

  const student = useMemo(() => students.find(s => s.portalAccessCode === code), [students, code]);

  const graduationAnalysis = useMemo(() => {
    if (!student) return null;
    const age = calculateAge(student.birthDate);
    const isKid = student.isKid || age < 16;
    const isBlackBelt = student.belt === BeltColor.BLACK || student.belt === BeltColor.RED_BLACK || student.belt === BeltColor.RED_WHITE || student.belt === BeltColor.RED;
    const chain = (isKid ? Object.values(KidsBeltColor) : Object.values(BeltColor)) as any[];
    const currentIdx = chain.indexOf(student.belt);
    const nextBelt = currentIdx !== -1 && currentIdx < chain.length - 1 ? chain[currentIdx + 1] : (isKid ? 'Adulto' : 'Mestre');
    const futurePath = currentIdx !== -1 ? chain.slice(currentIdx + 1, currentIdx + 4) : [];
    
    let minMonths = 4;
    let attendanceThreshold = 30;
    let maxStripes = 4;
    
    if (!isKid) {
      const rule = IBJJF_BELT_RULES[student.belt as string];
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
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const currentLesson = useMemo(() => 
    IBJJF_LESSONS.find(l => l.id === currentRuleLessonId), 
  [currentRuleLessonId]);

  const currentScenario = useMemo(() => 
    currentLesson?.scenarios?.[currentScenarioIdx],
  [currentLesson, currentScenarioIdx]);

  const getAISenseiTip = async (prompt?: string) => {
    if (!prompt) return;
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: t('ibjjfRules.aiSystemInstruction')
        }
      });
      setAiTip(response.text);
    } catch (error) {
      console.error("Erro AI Sensei:", error);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (currentRuleLessonId && currentLesson?.aiSenseiPrompt) {
      getAISenseiTip(currentLesson.aiSenseiPrompt);
    } else {
      setAiTip(null);
    }
  }, [currentRuleLessonId, currentLesson]);

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
    setAiTip(null);
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
      return { id: s.id, name: s.name, count, belt: s.belt };
    }).sort((a, b) => b.count - a.count).slice(0, 50);

    const annual = filteredStudents.map(s => {
      const count = s.attendanceHistory?.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === rankingYearFilter;
      }).length || 0;
      return { id: s.id, name: s.name, count, belt: s.belt };
    }).sort((a, b) => b.count - a.count).slice(0, 50);

    return { monthly, annual };
  }, [students, rankingBeltFilter, rankingClassFilter, rankingMonthFilter, rankingYearFilter]);

  const hasPaidCurrentMonth = useMemo(() => {
    if (!student) return false;
    const currentMonth = new Date().toISOString().substring(0, 7);
    return payments.some(p => p.name === student.name && p.date.startsWith(currentMonth));
  }, [payments, student]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [code]);

  const handleScanSimulation = () => {
    if (student) {
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
          if (student) {
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
          <>
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative shadow-2xl overflow-hidden">
              {/* Background Stripe Effect */}
              <div className="absolute top-0 right-0 w-32 h-full opacity-10 pointer-events-none">
                 <div className="w-full h-full bg-blue-600 rotate-12 transform translate-x-16" />
              </div>

              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black border-4 border-white/10">{student.name[0]}</div>
                <div className="flex-1">
                  <h1 className="text-xl font-black tracking-tighter uppercase leading-none">{student.name}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${BELT_COLORS[student.belt]}`}>{t(`belts.${student.belt}`)}</span>
                    <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-white/10 text-white">
                      {calculateAge(student.birthDate)} {t('common.years').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stripes Indicator for Home */}
              <div className="mt-6 flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {graduationAnalysis?.isBlackBelt ? 'Graus de Maestria' : 'Graus de Evolução'}
                   </span>
                   <div className="flex gap-1">
                     {[...Array(graduationAnalysis?.maxStripes || 4)].map((_, i) => (
                       <div 
                         key={i} 
                         className={`w-4 h-6 rounded-sm transition-all ${i < student.stripes ? (graduationAnalysis?.isBlackBelt ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-white') : 'bg-white/10'}`} 
                       />
                     ))}
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
                   <p className={`text-[10px] font-black uppercase ${student.status === StudentStatus.ACTIVE ? 'text-green-400' : 'text-amber-400'}`}>
                      {t(`status.${student.status.toLowerCase()}`)}
                   </p>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {isOverdue && (
              <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                <AlertTriangle size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('portal.overdueAlert')}</span>
              </div>
            )}

            {!student.liabilityWaiverAccepted && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                onClick={() => setShowWaiver(true)}
                className="bg-amber-500 text-white p-5 rounded-3xl flex items-center justify-between cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <ShieldAlert size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tighter leading-none mb-1">{t('medical.waiverTitle')}</h4>
                    <p className="text-[10px] font-bold opacity-80 uppercase leading-none">{t('medical.notAccepted')}</p>
                  </div>
                </div>
                <ChevronRight size={20} />
              </motion.div>
            )}

            {(!student.medicalCertificateExpiration || new Date(student.medicalCertificateExpiration) < new Date()) && (
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                onClick={() => setShowMedicalUpload(true)}
                className="bg-rose-600 text-white p-5 rounded-3xl flex items-center justify-between cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <AlertCircle size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tighter leading-none mb-1">{t('medical.certificate')}</h4>
                    <p className="text-[10px] font-bold opacity-80 uppercase leading-none">
                      {!student.medicalCertificateExpiration ? t('medical.notAccepted') : t('medical.expired')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} />
              </motion.div>
            )}

            {student.medicalCertificateExpiration && new Date(student.medicalCertificateExpiration) < new Date(new Date().setDate(new Date().getDate() + 30)) && new Date(student.medicalCertificateExpiration) >= new Date() && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => setShowMedicalUpload(true)}
                className="bg-orange-500 text-white p-5 rounded-3xl flex items-center justify-between cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <Clock size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tighter leading-none mb-1">{t('medical.certificate')}</h4>
                    <p className="text-[10px] font-bold opacity-80 uppercase leading-none">{t('medical.expiresSoon')}</p>
                  </div>
                </div>
                <ChevronRight size={20} />
              </motion.div>
            )}

            {/* Birthdays Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-amber-500" size={18} />
                <h3 className="text-[10px] font-black uppercase tracking-widest dark:text-white">{t('portal.birthdaysTitle')}</h3>
              </div>
              <div className="space-y-3">
                {monthlyBirthdays.slice(0, 3).map(b => (
                  <div key={b.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">{b.name[0]}</div>
                      <span className="text-xs font-bold dark:text-slate-300">{b.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-amber-600">{new Date(b.birthDate).getUTCDate()}/{new Date(b.birthDate).getUTCMonth() + 1}</span>
                  </div>
                ))}
                {monthlyBirthdays.length === 0 && <p className="text-[10px] text-slate-400 italic">{t('reports.noBirthdays')}</p>}
              </div>
            </div>

            {checkinSuccess && <div className="bg-green-600 text-white p-4 rounded-2xl flex items-center justify-center gap-3 animate-bounce"><CheckCircle2 size={20} /><span className="text-[10px] font-black uppercase tracking-widest">{t('portal.checkinSuccess')}</span></div>}

            <button onClick={() => setShowScanner(true)} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Camera size={24} /> {t('portal.checkinBtn').toUpperCase()}</button>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('common.attendance')}</p>
                 <p className="text-2xl font-black dark:text-white tabular-nums">{student.attendanceCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('kids.streak')}</p>
                 <p className="text-2xl font-black text-orange-500 tabular-nums">{student.currentStreak || 0} 🔥</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center col-span-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('portal.rulesKnowledge')}</p>
                 <div className="flex items-center gap-4">
                   <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500" style={{ width: `${student.rulesKnowledge || 0}%` }} />
                   </div>
                   <p className="text-lg font-black text-blue-500 tabular-nums">{student.rulesKnowledge || 0}%</p>
                 </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
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
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tempo Mínimo na Faixa</p>
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
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compromisso (Aulas)</p>
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

              {graduationAnalysis?.isBlackBelt && graduationAnalysis?.nextDegreeDate && (
                <div className="p-6 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/10 dark:border-blue-600/20 rounded-[2rem] space-y-3 mt-6">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                       <Calendar size={14} /> Previsão Próxima Graduação
                     </p>
                     <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-tighter">{Math.round(graduationAnalysis.timeProgress)}% Tempo</span>
                   </div>
                   <p className="text-xl font-black dark:text-white uppercase tracking-tighter">
                     {graduationAnalysis.nextDegreeDate}
                   </p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                     Tempo de permanência mínima: {Math.floor(graduationAnalysis.minMonths / 12)} anos no {student.stripes}º Grau (IBJJF)
                   </p>
                </div>
              )}

              {/* Path Visualization */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Map size={14} className="text-blue-600" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximos Passos</p>
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

              {/* Technical Exam Requirements */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={14} className="text-amber-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requisitos Técnicos (Exame)</p>
                  </div>
                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded uppercase">
                    {Object.values(student.examRequirements || {}).filter(v => v).length} / {((tObj(`beltRequirements.${graduationAnalysis?.nextBelt || 'White'}`) as string[]) || []).length}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {((tObj(`beltRequirements.${graduationAnalysis?.nextBelt || 'White'}`) as string[]) || []).map((req, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
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
                  {((tObj(`beltRequirements.${graduationAnalysis?.nextBelt || 'White'}`) as string[]) || []).length === 0 && (
                     <p className="text-[9px] text-slate-400 italic col-span-2">Nenhum requisito técnico definido para esta faixa.</p>
                  )}
                </div>
              </div>

              {/* Requirements & Milestones */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-amber-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requisitos Extras Concluídos</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {student.milestones?.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      {m.type === 'Seminar' && <Users2 size={12} className="text-amber-500" />}
                      {m.type === 'Competition' && <Medal size={12} className="text-blue-500" />}
                      {m.type === 'Course' && <Presentation size={12} className="text-purple-500" />}
                      {m.type === 'Other' && <Star size={12} className="text-slate-400" />}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase leading-none">{m.title}</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{m.date}</span>
                      </div>
                    </div>
                  ))}
                  {(!student.milestones || student.milestones.length === 0) && (
                    <div className="flex flex-col items-center justify-center w-full py-4 space-y-2 opacity-50">
                       <Info size={20} className="text-slate-300" />
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">{t('portal.noAcademyRules')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 dark:text-white">{t('portal.techniquesTitle')}</h3>
              <div className="space-y-3">
                {student.techniques?.map((tech, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold dark:text-slate-200">{tech.name}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{tech.category}</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Zap key={star} size={10} className={star <= tech.proficiency ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                      ))}
                    </div>
                  </div>
                ))}
                {(!student.techniques || student.techniques.length === 0) && (
                  <p className="text-[10px] text-slate-400 italic text-center py-4">{t('portal.noPhotos')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtros de Ranking</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Faixa</label>
                    <select 
                      value={rankingBeltFilter}
                      onChange={(e) => setRankingBeltFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-3 appearance-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Sempre</option>
                      {Object.values(BeltColor).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Turma</label>
                    <select 
                      value={rankingClassFilter}
                      onChange={(e) => setRankingClassFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-3 appearance-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todas</option>
                      {Array.from(new Set(students.map(s => s.classId).filter(Boolean))).map(classId => {
                        return <option key={classId} value={classId}>{classId}</option>
                      })}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Mês</label>
                    <select 
                      value={rankingMonthFilter}
                      onChange={(e) => setRankingMonthFilter(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-3 appearance-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Ano</label>
                    <select 
                      value={rankingYearFilter}
                      onChange={(e) => setRankingYearFilter(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-3 appearance-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 dark:text-white">{t('portal.monthlyRanking')}</h3>
              <div className="space-y-3">
                {rankingData.monthly.map((r, idx) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{idx + 1}</span>
                      <div>
                        <span className="text-xs font-bold dark:text-slate-200 block leading-none">{r.name}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{r.belt}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-blue-500">{r.count} {t('common.attendance')}</span>
                  </div>
                ))}
                {rankingData.monthly.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-4">{t('portal.noRankingResults')}</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 dark:text-white">{t('portal.annualRanking')}</h3>
              <div className="space-y-3">
                {rankingData.annual.map((r, idx) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{idx + 1}</span>
                      <div>
                        <span className="text-xs font-bold dark:text-slate-200 block leading-none">{r.name}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{r.belt}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-blue-500">{r.count} {t('common.attendance')}</span>
                  </div>
                ))}
                {rankingData.annual.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-4">{t('portal.noRankingResults')}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl ${isOverdue ? 'bg-red-900' : 'bg-slate-900'}`}>
               <p className="text-[10px] font-black uppercase text-white/50 mb-1">{t('financial.monthlyFee')}</p>
               <h3 className="text-3xl font-black uppercase tracking-tighter">{isOverdue ? t('financial.statusOverdue') : t('financial.statusPaid')}</h3>
               <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold opacity-60">{t('financial.monthlyValue')}</span>
                  <span className="text-lg font-black tabular-nums">{t('common.currencySymbol')} {student.monthlyValue.toFixed(2)}</span>
               </div>
            </div>
            <button onClick={() => setShowPix(true)} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"><QrCode size={20} /> {t('portal.payPix').toUpperCase()}</button>
            <button onClick={() => setShowReceipt(true)} className="w-full py-5 bg-slate-800 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border border-white/10"><Download size={20} /> {t('portal.uploadReceipt').toUpperCase()}</button>
          </div>
        )}

        {activeTab === 'rules' && (
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
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-blue-200 dark:border-blue-900 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-10 group-hover:scale-150 transition-transform duration-1000" />
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{profile.academyName}</h3>
                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">{t('portal.conductManual')}</p>
                      </div>
                    </div>
                    <div className="prose dark:prose-invert prose-slate max-w-none prose-sm prose-p:font-medium prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-black relative z-10">
                      <ReactMarkdown>{profile.graduationRules || t('portal.noAcademyRules')}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 bg-blue-600/20 border border-blue-600/30 rounded-full text-[8px] font-black uppercase tracking-widest text-blue-400">IBJJF & CBJJ</div>
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-3">{t('portal.rulesAcademy')}</h3>
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed mb-8 italic">"{t('portal.rulesAcademyMotto')}"</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{t('portal.totalPoints')}</p>
                            <p className="text-xl font-black text-blue-400">{student.rewardPoints || 0}</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{t('portal.modules')}</p>
                            <p className="text-xl font-black text-blue-400">{student.completedRuleLessons?.length || 0}/{IBJJF_LESSONS.length}</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('portal.masteryProgress')}</span>
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
                      const isCompleted = student.completedRuleLessons?.includes(lesson.id);
                      const IconComponent = (Icons as any)[lesson.icon] || Icons.BookOpen;

                      return (
                        <motion.button 
                          key={lesson.id}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCurrentRuleLessonId(lesson.id)}
                          className={`flex items-center gap-5 p-5 rounded-[2rem] border text-left transition-all relative overflow-hidden group ${
                            isCompleted 
                              ? 'bg-green-50/10 border-green-500/20 shadow-lg shadow-green-500/5' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/30'
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
                                  <CheckCircle2 size={8} /> {t('portal.mastered')}
                                </span>
                              )}
                              {lesson.scenarios && (
                                <span className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full">
                                  <Gamepad2 size={8} /> {t('portal.caseMode')}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black dark:text-white uppercase tracking-tight truncate leading-none mb-1">{lesson.title}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate opacity-60 italic">+{lesson.points} {t('portal.lifelongPoints')}</p>
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

                      {aiTip && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 bg-blue-600/5 dark:bg-blue-600/10 rounded-3xl border border-blue-600/10 flex gap-4"
                        >
                           <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                              <Icons.Cpu size={20} />
                           </div>
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{t('portal.aiSenseiTip')}</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                "{aiTip}"
                              </p>
                           </div>
                        </motion.div>
                      )}

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
                              {quizMode ? <Shield size={16} /> : <Icons.Target size={16} />}
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
        {activeTab === 'videos' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Play size={32} className="text-blue-500" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{t('portal.videosTitle')}</h3>
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed mb-6">{t('portal.videosDesc')}</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowAddVideo(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Plus size={14} /> {t('portal.newVideo')}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.positionVideos?.map((video) => (
                <div key={video.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative group">
                    <iframe 
                      src={video.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                      className="w-full h-full border-none"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{video.date}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('portal.by')}: {video.authorName}</span>
                    </div>
                    <h4 className="text-sm font-black dark:text-white uppercase tracking-tight">{video.title}</h4>
                    {video.description && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2">{video.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!student.positionVideos || student.positionVideos.length === 0) && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                    <Play size={32} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{t('portal.noVideos')}</p>
                </div>
              )}
            </div>

            {showAddVideo && (
              <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-sm w-full space-y-6 relative"
                >
                  <button onClick={() => setShowAddVideo(false)} className="absolute top-8 right-8 text-slate-400 group">
                    <X className="group-hover:rotate-90 transition-transform" />
                  </button>
                  <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('portal.shareVideo')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{t('portal.postVideoLink')}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('portal.videoTitle')}</label>
                      <input 
                        type="text" 
                        value={newVideo.title}
                        onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                        placeholder={t('portal.videoTitlePlaceholder')}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('portal.videoUrl')}</label>
                      <input 
                        type="text" 
                        value={newVideo.videoUrl}
                        onChange={(e) => setNewVideo({...newVideo, videoUrl: e.target.value})}
                        placeholder="https://youtube.com/..."
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('portal.descriptionOptional')}</label>
                      <textarea 
                        value={newVideo.description}
                        onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold dark:text-white h-24 resize-none"
                      />
                    </div>
                    
                    <button 
                      onClick={handleAddVideo}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                    >
                      {t('portal.postVideo')}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
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

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-around z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}><Zap size={22} /><span className="text-[7px] font-black uppercase">{t('portal.navHome')}</span></button>
        <button onClick={() => setActiveTab('curriculum')} className={`flex flex-col items-center gap-1 ${activeTab === 'curriculum' ? 'text-blue-600' : 'text-slate-400'}`}><BookOpen size={22} /><span className="text-[7px] font-black uppercase">{t('common.curriculum')}</span></button>
        <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1 ${activeTab === 'ranking' ? 'text-blue-600' : 'text-slate-400'}`}><Trophy size={22} /><span className="text-[7px] font-black uppercase">{t('portal.rankings')}</span></button>
        <button onClick={() => setActiveTab('videos')} className={`flex flex-col items-center gap-1 ${activeTab === 'videos' ? 'text-blue-600' : 'text-slate-400'}`}><Play size={22} /><span className="text-[7px] font-black uppercase">{t('portal.navVideos')}</span></button>
        <button onClick={() => setActiveTab('rules')} className={`flex flex-col items-center gap-1 ${activeTab === 'rules' ? 'text-blue-600' : 'text-slate-400'}`}><Scale size={22} /><span className="text-[7px] font-black uppercase">{t('portal.rulesAcademy')}</span></button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 ${activeTab === 'wallet' ? 'text-blue-600' : 'text-slate-400'}`}><Shield size={22} /><span className="text-[7px] font-black uppercase">{t('portal.navWallet')}</span></button>
        <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center gap-1 ${activeTab === 'gallery' ? 'text-blue-600' : 'text-slate-400'}`}><ImageIcon size={22} /><span className="text-[7px] font-black uppercase">{t('portal.navGallery')}</span></button>
      </nav>

      <style>{` @keyframes scan { 0% { transform: translateY(-150px); } 100% { transform: translateY(150px); } } `}</style>
    </div>
  );
};

export default StudentPortal;
