
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, Flame, Calendar, BookOpen, 
  ArrowRight, Shield, Zap, Plus, LogOut, Scale,
  QrCode, Clock, Info, Camera, CheckCircle2, AlertTriangle, X, Copy, Image as ImageIcon, Download, Maximize2,
  RefreshCw, FileText, Upload, ShieldCheck, AlertCircle, ShieldAlert, ChevronRight
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { StudentStatus, GalleryImage } from '../types';
import { BELT_COLORS } from '../constants';
import { IBJJF_LESSONS } from '../constants/rulesData';
import ReactMarkdown from 'react-markdown';
import * as Icons from 'lucide-react';

const StudentPortal: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { students, recordAttendance, gallery, payments, addGalleryImage, addReceipt, completeRuleLesson } = useData();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'curriculum' | 'wallet' | 'gallery' | 'ranking' | 'rules'>('home');
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

  const monthlyBirthdays = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    return students.filter(s => {
      const bMonth = new Date(s.birthDate).getUTCMonth() + 1;
      return bMonth === currentMonth;
    }).sort((a, b) => new Date(a.birthDate).getUTCDate() - new Date(b.birthDate).getUTCDate());
  }, [students]);

  const rankingData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthly = students.map(s => {
      const count = s.attendanceHistory?.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length || 0;
      return { id: s.id, name: s.name, count };
    }).sort((a, b) => b.count - a.count).slice(0, 10);

    const annual = students.map(s => {
      const count = s.attendanceHistory?.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === currentYear;
      }).length || 0;
      return { id: s.id, name: s.name, count };
    }).sort((a, b) => b.count - a.count).slice(0, 10);

    return { monthly, annual };
  }, [students]);

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
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black border-4 border-white/10">{student.name[0]}</div>
                <div>
                  <h1 className="text-xl font-black tracking-tighter uppercase leading-none">{student.name}</h1>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${BELT_COLORS[student.belt]}`}>{t(`belts.${student.belt}`)}</span>
                    <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-white/10 text-white">
                      {calculateAge(student.birthDate)} ANOS
                    </span>
                    {student.isCompetitor && (
                      <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-yellow-500 text-slate-900 flex items-center gap-1">
                        <Trophy size={10} /> ATLETA
                      </span>
                    )}
                  </div>
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
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 dark:text-white">{t('portal.evolutionTitle')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{t('portal.milestones')}</span>
                  <span className="text-xs font-black text-blue-500">{Math.min(100, Math.round((student.attendanceCount / 50) * 100))}%</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(100, (student.attendanceCount / 50) * 100)}%` }} />
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
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 dark:text-white">{t('portal.monthlyRanking')}</h3>
              <div className="space-y-3">
                {rankingData.monthly.map((r, idx) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{idx + 1}</span>
                      <span className="text-xs font-bold dark:text-slate-200">{r.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-500">{r.count} {t('common.attendance')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 dark:text-white">{t('portal.annualRanking')}</h3>
              <div className="space-y-3">
                {rankingData.annual.map((r, idx) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{idx + 1}</span>
                      <span className="text-xs font-bold dark:text-slate-200">{r.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-500">{r.count} {t('common.attendance')}</span>
                  </div>
                ))}
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
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-blue-200 dark:border-blue-900 shadow-xl overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{profile.academyName}</h3>
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">Regras e Graduação</p>
                </div>
              </div>
              <div className="prose dark:prose-invert prose-slate max-w-none prose-sm prose-p:font-medium prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-black">
                <ReactMarkdown>{profile.graduationRules || 'As regras da academia serão exibidas aqui.'}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20" />
              <div className="relative z-10">
                <h3 className="text-xl font-black uppercase tracking-tighter leading-none mb-2">{t('portal.rulesAcademy')}</h3>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{t('portal.rulesAcademyDesc')}</p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${(student.completedRuleLessons?.length || 0) / IBJJF_LESSONS.length * 100}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    {student.completedRuleLessons?.length || 0}/{IBJJF_LESSONS.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {IBJJF_LESSONS.map((lesson) => {
                const isCompleted = student.completedRuleLessons?.includes(lesson.id);
                const IconComponent = (Icons as any)[lesson.icon] || Icons.BookOpen;

                return (
                  <div key={lesson.id} className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border transition-all ${isCompleted ? 'border-green-500/30 bg-green-50/10' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <IconComponent size={24} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{lesson.category}</span>
                          <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">+{lesson.points} PTS</span>
                        </div>
                        <h4 className="text-sm font-black dark:text-white uppercase tracking-tight leading-tight">{lesson.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{lesson.content}</p>
                        
                        {!isCompleted ? (
                          <button 
                            onClick={() => handleCompleteLesson(lesson.id, lesson.points)}
                            className="w-full mt-4 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            {t('portal.markAsStudied')}
                          </button>
                        ) : (
                          <div className="mt-4 flex items-center gap-2 text-green-600">
                            <CheckCircle2 size={16} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t('portal.lessonCompleted')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                          title: `Treino - ${student.name}`,
                          date: new Date().toISOString().split('T')[0],
                          category: 'Treino'
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
            <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-50">Posicione o QR Code da academia</p>
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
        <button onClick={() => setActiveTab('rules')} className={`flex flex-col items-center gap-1 ${activeTab === 'rules' ? 'text-blue-600' : 'text-slate-400'}`}><Scale size={22} /><span className="text-[7px] font-black uppercase">{t('portal.rulesAcademy')}</span></button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 ${activeTab === 'wallet' ? 'text-blue-600' : 'text-slate-400'}`}><Shield size={22} /><span className="text-[7px] font-black uppercase">{t('portal.navWallet')}</span></button>
        <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center gap-1 ${activeTab === 'gallery' ? 'text-blue-600' : 'text-slate-400'}`}><ImageIcon size={22} /><span className="text-[7px] font-black uppercase">{t('portal.navGallery')}</span></button>
      </nav>

      <style>{` @keyframes scan { 0% { transform: translateY(-150px); } 100% { transform: translateY(150px); } } `}</style>
    </div>
  );
};

export default StudentPortal;
