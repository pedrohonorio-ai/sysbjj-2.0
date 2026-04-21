
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Shield, 
  X, 
  User, 
  Plus,
  ThumbsUp,
  ThumbsDown,
  Save,
  Baby,
  Medal,
  Trash2,
  Zap,
  Phone,
  Mail,
  Calendar,
  Clock,
  BookOpen,
  Camera,
  MapPin,
  HeartPulse,
  UserPlus
} from 'lucide-react';
import { Student, StudentStatus, BeltColor, KidsBeltColor, Gender, CBJJCategory } from '../types';
import { BELT_COLORS, IBJJF_BELT_RULES } from '../constants';
import { IBJJF_LESSONS } from '../constants/rulesData';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { calculateCBJJCategory, calculateWeightClass } from '../services/cbjj';

const NewStudentModal = ({ onClose, defaultIsKid }: { onClose: () => void, defaultIsKid: boolean }) => {
  const { t } = useTranslation();
  const { addStudent } = useData();
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    birthDate: '1990-01-01',
    gender: Gender.MALE,
    cpf: '',
    rg: '',
    weight: 70,
    height: 1.70,
    federationId: '',
    category: CBJJCategory.ADULTO,
    weightClass: 'Pena',
    lastPromotionDate: new Date().toISOString().split('T')[0],
    isInstructor: false,
    isKid: defaultIsKid,
    isCompetitor: false,
    technicalNotes: '',
    monthlyValue: 250,
    belt: defaultIsKid ? KidsBeltColor.WHITE : BeltColor.WHITE,
    dueDay: 10,
    status: StudentStatus.ACTIVE,
    pros: '',
    cons: '',
    photoUrl: '',
    emergencyContact: '',
    medicalConditions: '',
    address: '',
    bloodType: '',
    responsiblePerson: ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const category = calculateCBJJCategory(formData.birthDate);
    const weightClass = calculateWeightClass(formData.weight, formData.gender, category);
    setFormData(prev => ({
      ...prev,
      category,
      weightClass,
      belt: prev.isKid ? KidsBeltColor.WHITE : BeltColor.WHITE
    }));
  }, [formData.birthDate, formData.gender, formData.weight, formData.isKid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStudent({
      ...formData,
      stripes: 0,
      attendanceCount: 0,
      history: [],
      techniques: [],
      goals: [],
      feedbacks: [],
      currentStreak: 0,
      rewardPoints: 0,
      behaviorScore: 100,
      portalAccessCode: `PPH-${formData.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
            {formData.isKid ? t('students.newKidTitle') : t('students.newStudentTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
            <X size={28} />
          </button>
        </div>
        
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          {/* Photo Upload Section */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div 
              className="relative w-32 h-32 rounded-[2rem] bg-slate-200 dark:bg-slate-700 overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Camera size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{t('common.uploadPhoto')}</p>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">{t('common.photo')}</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.name')}</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.birthDate')}</label>
            <input 
              type="date" 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={formData.birthDate}
              onChange={e => setFormData({...formData, birthDate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.lastPromotion')}</label>
            <input 
              type="date" 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={formData.lastPromotionDate}
              onChange={e => setFormData({...formData, lastPromotionDate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.phone')}</label>
            <input 
              type="text" 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.gender')}</label>
            <select 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none font-bold"
              value={formData.gender}
              onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
            >
              {Object.values(Gender).map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
            <input 
              type="text" 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={formData.cpf}
              onChange={e => setFormData({...formData, cpf: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label>
            <input 
              type="text" 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={formData.rg}
              onChange={e => setFormData({...formData, rg: e.target.value})}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.address')}</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.emergencyContact')}</label>
            <div className="relative">
              <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                value={formData.emergencyContact}
                onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.medicalConditions')}</label>
            <div className="relative">
              <HeartPulse className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                value={formData.medicalConditions}
                onChange={e => setFormData({...formData, medicalConditions: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.bloodType')}</label>
            <input 
              type="text" 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={formData.bloodType}
              onChange={e => setFormData({...formData, bloodType: e.target.value})}
            />
          </div>

          {formData.isKid && (
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.responsiblePerson')}</label>
              <input 
                type="text" 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                value={formData.responsiblePerson}
                onChange={e => setFormData({...formData, responsiblePerson: e.target.value})}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.weight')} (kg)</label>
            <input 
              type="number" 
              step="0.1"
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={isNaN(formData.weight) ? '' : formData.weight}
              onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.height')} (m)</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={isNaN(formData.height) ? '' : formData.height}
              onChange={e => setFormData({...formData, height: parseFloat(e.target.value)})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.federationIdLabel')}</label>
            <input 
              type="text" 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={formData.federationId}
              onChange={e => setFormData({...formData, federationId: e.target.value})}
            />
          </div>

          <div className="md:col-span-2 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20 grid grid-cols-2 gap-4">
            <div>
               <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">{t('students.suggestedCategory')}</p>
               <p className="font-bold text-slate-900 dark:text-white">{formData.category}</p>
            </div>
            <div>
               <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">{t('students.suggestedWeight')}</p>
               <p className="font-bold text-slate-900 dark:text-white">{formData.weightClass}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.currentBelt')}</label>
            <select 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none font-bold"
              value={formData.belt}
              onChange={e => setFormData({...formData, belt: e.target.value as any})}
            >
              {formData.isKid ? (
                Object.values(KidsBeltColor).map(v => (
                  <option key={v} value={v}>{t(`belts.${v}`)}</option>
                ))
              ) : (
                Object.values(BeltColor).map(v => (
                  <option key={v} value={v}>{t(`belts.${v}`)}</option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.value')} ({t('common.currencySymbol')})</label>
            <input 
              type="number" 
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
              value={isNaN(formData.monthlyValue) ? '' : formData.monthlyValue}
              onChange={e => setFormData({...formData, monthlyValue: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
             <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isKid} 
                  onChange={e => setFormData({...formData, isKid: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-black uppercase dark:text-white">{t('common.kids')}</span>
             </label>
             <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isInstructor} 
                  onChange={e => setFormData({...formData, isInstructor: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-black uppercase dark:text-white">{t('common.instructor')}</span>
             </label>
             <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isCompetitor} 
                  onChange={e => setFormData({...formData, isCompetitor: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-black uppercase dark:text-white">{t('students.isCompetitor')}</span>
             </label>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.technicalNotes')}</label>
            <textarea 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold min-h-[100px]" 
              value={formData.technicalNotes}
              onChange={e => setFormData({...formData, technicalNotes: e.target.value})}
              placeholder="Ex: Pontos fortes, dificuldades, lesões, etc."
            />
          </div>

          <button type="submit" className={`md:col-span-2 w-full py-5 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 mt-4 ${formData.isKid ? 'bg-yellow-500 shadow-yellow-500/30' : 'bg-blue-600 shadow-blue-500/30'}`}>
            {t('students.enrollBtn').toUpperCase()}
          </button>
        </form>
      </div>
    </div>
  );
};

const StudentDetailsModal = ({ student, onClose }: { student: Student; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'edit' | 'admin'>('overview');
  const { t } = useTranslation();
  const { deleteStudent, updateStudent } = useData();
  const [editPros, setEditPros] = useState(student.pros || '');
  const [editCons, setEditCons] = useState(student.cons || '');
  const [showSuccess, setShowSuccess] = useState(false);

  const [editFormData, setEditFormData] = useState({ ...student });

  const getBeltTimeAnalysis = () => {
    let minTimeMonths = student.isKid ? 4 : (IBJJF_BELT_RULES[student.belt as string]?.minTimeMonths ?? 0);
    
    // IBJJF Exception: Purple belt minimum time is 12 months if the athlete is 17 years old
    if (!student.isKid && student.belt === BeltColor.PURPLE) {
      const age = calculateCBJJCategory(student.birthDate) === CBJJCategory.JUVENIL_2 ? 17 : 18; // Simplified age check
      if (age === 17) minTimeMonths = 12;
    }

    // Adult white belts don't have a minimum time requirement in IBJJF rules
    if (!student.isKid && student.belt === BeltColor.WHITE) return null;

    const lastPromotion = new Date(student.lastPromotionDate + 'T12:00:00');
    const today = new Date();
    
    let diffMonths = (today.getFullYear() - lastPromotion.getFullYear()) * 12 + (today.getMonth() - lastPromotion.getMonth());
    if (today.getDate() < lastPromotion.getDate()) {
      diffMonths--;
    }
    diffMonths = Math.max(0, diffMonths);
    
    const progress = minTimeMonths > 0 ? Math.min(100, (diffMonths / minTimeMonths) * 100) : 100;
    const isEligible = diffMonths >= minTimeMonths;

    return { diffMonths, minTime: minTimeMonths, progress, isEligible };
  };

  const beltAnalysis = useMemo(() => getBeltTimeAnalysis(), [student]);

  useEffect(() => {
    const category = calculateCBJJCategory(editFormData.birthDate);
    const weightClass = calculateWeightClass(editFormData.weight || 0, editFormData.gender || Gender.MALE, category);
    if (category !== editFormData.category || weightClass !== editFormData.weightClass) {
      setEditFormData(prev => ({
        ...prev,
        category,
        weightClass
      }));
    }
  }, [editFormData.birthDate, editFormData.gender, editFormData.weight]);

  const handleUpdateAnalysis = () => {
    updateStudent(student.id, { pros: editPros, cons: editCons });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleUpdateRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudent(student.id, editFormData);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setActiveTab('overview');
    }, 2000);
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

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-5xl flex flex-col animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className={`relative overflow-hidden p-6 sm:p-8 shrink-0 text-white ${student.isKid ? 'bg-yellow-500' : 'bg-slate-900'}`}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="flex items-center gap-4 sm:gap-8">
              <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2.2rem] flex items-center justify-center text-2xl sm:text-4xl font-black shadow-2xl overflow-hidden ${student.isKid ? 'bg-white text-yellow-600' : 'bg-blue-600 text-white'}`}>
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  student.name[0]
                )}
              </div>
              <div className="text-left space-y-1 sm:space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                   <h2 className="text-xl sm:text-3xl font-black tracking-tighter uppercase leading-none truncate max-w-[200px] sm:max-w-none">{student.name}</h2>
                   {student.nickname && <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 rounded-lg text-[8px] sm:text-xs font-bold uppercase tracking-widest italic w-fit">"{student.nickname}"</span>}
                   <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/10 rounded-lg text-[8px] sm:text-xs font-bold uppercase tracking-widest w-fit">
                     {calculateAge(student.birthDate)} {t('students.athleteAge').split(' ')[1].toLowerCase()}
                   </span>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-lg ${BELT_COLORS[student.belt] || 'bg-slate-100 text-slate-600'}`}>
                    {t(`belts.${student.belt}`)}
                  </span>
                  <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/10 text-white">
                    {student.isKid ? t('common.kids').toUpperCase() : t(`status.${student.status}`).toUpperCase()}
                  </span>
                  {student.isCompetitor && (
                    <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white flex items-center gap-2">
                      <Medal size={12} /> {t('students.isCompetitor').toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="absolute top-0 right-0 sm:relative p-2 sm:p-3 bg-white/10 rounded-xl sm:rounded-2xl hover:bg-white/20 transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="flex px-4 sm:px-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide shrink-0">
          <button onClick={() => setActiveTab('overview')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('students.overviewTab')}</button>
          <button onClick={() => setActiveTab('edit')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'edit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('common.edit').toUpperCase()}</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('students.analysisTab')}</button>
          <button onClick={() => setActiveTab('admin')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('students.adminTab')}</button>
        </div>

        <div className="p-4 sm:p-10 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          {activeTab === 'edit' && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2" onSubmit={handleUpdateRegistration}>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.name')}</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  required 
                  value={editFormData.name}
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.nickname') || 'Apelido'}</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  value={editFormData.nickname || ''}
                  onChange={e => setEditFormData({...editFormData, nickname: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.phone')}</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  value={editFormData.phone}
                  onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.birthDate')}</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  value={editFormData.birthDate}
                  onChange={e => setEditFormData({...editFormData, birthDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.lastPromotion')}</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  value={editFormData.lastPromotionDate}
                  onChange={e => setEditFormData({...editFormData, lastPromotionDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.value')} ({t('common.currencySymbol')})</label>
                <input 
                  type="number" 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  value={isNaN(editFormData.monthlyValue) ? '' : editFormData.monthlyValue}
                  onChange={e => setEditFormData({...editFormData, monthlyValue: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('financial.dueDay') || 'Dia de Vencimento'}</label>
                <input 
                  type="number" 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  value={isNaN(editFormData.dueDay) ? '' : editFormData.dueDay}
                  onChange={e => setEditFormData({...editFormData, dueDay: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.currentBelt')}</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none font-bold"
                  value={editFormData.belt}
                  onChange={e => setEditFormData({...editFormData, belt: e.target.value as any})}
                >
                  {editFormData.isKid ? (
                    Object.values(KidsBeltColor).map(v => (
                      <option key={v} value={v}>{t(`belts.${v}`)}</option>
                    ))
                  ) : (
                    Object.values(BeltColor).map(v => (
                      <option key={v} value={v}>{t(`belts.${v}`)}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.stripesCount')}</label>
                <input 
                  type="number" 
                  min="0"
                  max="4"
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  value={isNaN(editFormData.stripes) ? '' : editFormData.stripes}
                  onChange={e => setEditFormData({...editFormData, stripes: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.status')}</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none font-bold"
                  value={editFormData.status}
                  onChange={e => setEditFormData({...editFormData, status: e.target.value as StudentStatus})}
                >
                  {Object.values(StudentStatus).map(v => (
                    <option key={v} value={v}>{t(`status.${v}`)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.type')}</label>
                <div className="flex flex-wrap items-center gap-4 h-auto min-h-[54px] px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editFormData.isInstructor} 
                      onChange={e => setEditFormData({...editFormData, isInstructor: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-black uppercase dark:text-white">{t('common.instructor')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editFormData.isKid} 
                      onChange={e => setEditFormData({...editFormData, isKid: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-black uppercase dark:text-white">{t('common.kid')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editFormData.isCompetitor} 
                      onChange={e => setEditFormData({...editFormData, isCompetitor: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-black uppercase dark:text-white">{t('students.isCompetitor')}</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.technicalNotes')}</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold min-h-[100px]" 
                  value={editFormData.technicalNotes || ''}
                  onChange={e => setEditFormData({...editFormData, technicalNotes: e.target.value})}
                  placeholder="Ex: Pontos fortes, dificuldades, etc."
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.address')}</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                  value={editFormData.address || ''}
                  onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                />
              </div>

              <button type="submit" className="md:col-span-2 w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                {showSuccess ? (
                  <>
                    <ThumbsUp size={20} />
                    {t('common.saveSuccess').toUpperCase()}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {t('common.save').toUpperCase()}
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
              <div className="lg:col-span-7 space-y-6 sm:space-y-10">
                {/* Performance & Analysis Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 sm:p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl sm:rounded-3xl border border-green-100 dark:border-green-900/20">
                    <p className="text-[8px] sm:text-[9px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-2"><ThumbsUp size={14}/> {t('students.pros')}</p>
                    <p className="text-xs sm:text-sm font-medium dark:text-slate-200">{student.pros || '--'}</p>
                  </div>
                  <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl sm:rounded-3xl border border-red-100 dark:border-red-900/20">
                    <p className="text-[8px] sm:text-[9px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2"><ThumbsDown size={14}/> {t('students.cons')}</p>
                    <p className="text-xs sm:text-sm font-medium dark:text-slate-200">{student.cons || '--'}</p>
                  </div>
                </div>

                <section className="space-y-4">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14} /> {t('students.technicalNotes')}</h3>
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs sm:text-sm font-medium dark:text-slate-200 whitespace-pre-wrap">{student.technicalNotes || 'Nenhuma observação técnica registrada.'}</p>
                  </div>
                </section>

                {/* Personal & Contact Group */}
                <section className="space-y-4">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14} /> {t('students.personalInfo') || 'Informações Pessoais'}</h3>
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                       <p className="font-bold text-slate-900 dark:text-white">+{student.phone}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.birthDate')}</p>
                       <p className="font-bold text-slate-900 dark:text-white">{new Date(student.birthDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('students.portalCode')}</p>
                       <p className="font-bold text-slate-900 dark:text-white">{student.portalAccessCode}</p>
                    </div>
                    <div className="col-span-2">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.address')}</p>
                       <p className="font-bold text-slate-900 dark:text-white">{student.address || '--'}</p>
                    </div>
                  </div>
                </section>

                {/* Health & Emergency Group */}
                <section className="space-y-4">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HeartPulse size={14} /> {t('common.healthInfo') || 'Saúde & Emergência'}</h3>
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.bloodType')}</p>
                       <p className="font-bold text-red-600">{student.bloodType || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.emergencyContact')}</p>
                       <p className="font-bold text-red-600">{student.emergencyContact || '--'}</p>
                    </div>
                    <div className="col-span-2">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.medicalConditions')}</p>
                       <p className="font-bold text-orange-600">{student.medicalConditions || '--'}</p>
                    </div>
                    {student.isKid && (
                      <div className="col-span-2">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.responsiblePerson')}</p>
                         <p className="font-bold text-slate-900 dark:text-white">{student.responsiblePerson || '--'}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Federation & Competition Group */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shield size={14} /> {t('students.federationInfo')}</h3>
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('students.category')}</p>
                       <p className="font-bold text-slate-900 dark:text-white">{student.category || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.weight')} ({t('students.weightClass')})</p>
                       <p className="font-bold text-slate-900 dark:text-white">{student.weightClass || '--'} ({student.weight}kg)</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.gender')}</p>
                       <p className="font-bold text-slate-900 dark:text-white">{student.gender || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                       <p className="font-bold text-slate-900 dark:text-white">{student.cpf || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">RG</p>
                       <p className="font-bold text-slate-900 dark:text-white">{student.rg || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('students.federationId')}</p>
                       <p className="font-bold text-blue-600">{student.federationId || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('students.lastPromotion')}</p>
                       <p className="font-bold text-slate-900 dark:text-white">{new Date(student.lastPromotionDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </section>

                {beltAnalysis && (
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> {t('students.beltAnalysis')}</h3>
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('students.timeInBelt')}</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{beltAnalysis.diffMonths} <span className="text-sm text-slate-400">/ {beltAnalysis.minTime} {t('common.months')}</span></p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${beltAnalysis.isEligible ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {beltAnalysis.isEligible ? t('students.eligible') : t('students.inGracePeriod')}
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${beltAnalysis.isEligible ? 'bg-green-500' : 'bg-blue-600'}`}
                          style={{ width: `${beltAnalysis.progress}%` }}
                        />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest">
                        {beltAnalysis.isEligible 
                          ? t('students.eligibleMsg') 
                          : t('students.inGracePeriodMsg').replace('{months}', (beltAnalysis.minTime - beltAnalysis.diffMonths).toString())}
                      </p>
                    </div>
                  </section>
                )}
              </div>

              <div className="lg:col-span-5 space-y-6">
                 <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl">
                     <p className="text-[9px] font-black uppercase tracking-widest text-blue-100 mb-4">{t('students.monthlyPlan')}</p>
                     <p className="text-4xl font-black tracking-tighter leading-none tabular-nums">{t('common.currencySymbol')} {student.monthlyValue}</p>
                     <p className="text-[10px] font-bold mt-4 uppercase opacity-80 tracking-widest">{t('financial.dueDay')}: Dia {student.dueDay}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('students.attendanceMetrics')}</p>
                     <div className="flex justify-between items-center">
                        <div>
                           <p className="text-2xl font-black dark:text-white leading-none tabular-nums">{student.attendanceCount}</p>
                           <p className="text-[8px] font-bold uppercase text-slate-400">{t('students.totalClasses')}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
                        <div>
                           <p className="text-2xl font-black text-orange-500 leading-none tabular-nums">{student.currentStreak || 0}</p>
                           <p className="text-[8px] font-bold uppercase text-slate-400">{t('students.streak')}</p>
                        </div>
                     </div>
                  </div>

                  {/* Rules Academy Progress */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('portal.rulesAcademy')}</p>
                     <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-2xl font-black text-blue-500 leading-none tabular-nums">{student.rulesKnowledge || 0}%</p>
                             <p className="text-[8px] font-bold uppercase text-slate-400">{t('portal.rulesKnowledge')}</p>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {student.completedRuleLessons?.length || 0} / {IBJJF_LESSONS.length} {t('common.lessons') || 'Lições'}
                          </p>
                       </div>
                       <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${student.rulesKnowledge || 0}%` }} 
                          />
                       </div>
                     </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="max-w-2xl mx-auto space-y-8">
               <div className="space-y-4">
                 <label className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2"><ThumbsUp size={18}/> {t('students.pros')}</label>
                 <textarea 
                   value={editPros} 
                   onChange={e => setEditPros(e.target.value)}
                   className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] min-h-[150px] outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
                   placeholder={t('students.prosPlaceholder')}
                 />
               </div>
               <div className="space-y-4">
                 <label className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2"><ThumbsDown size={18}/> {t('students.cons')}</label>
                 <textarea 
                   value={editCons} 
                   onChange={e => setEditCons(e.target.value)}
                   className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] min-h-[150px] outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                   placeholder={t('students.consPlaceholder')}
                 />
               </div>
               <button 
                 onClick={handleUpdateAnalysis}
                 className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 transition-all"
               >
                 {showSuccess ? (
                   <>
                     <ThumbsUp size={20} />
                     {t('common.saveSuccess').toUpperCase()}
                   </>
                 ) : (
                   <>
                     <Save size={20} />
                     {t('students.updateAnalysisBtn').toUpperCase()}
                   </>
                 )}
               </button>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border-2 border-dashed border-blue-100 dark:border-blue-900/30 text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto text-blue-600"><Zap size={32}/></div>
                  <div>
                    <h3 className="text-xl font-black text-blue-600 uppercase tracking-tighter">{t('common.manualPayment')}</h3>
                    <p className="text-[10px] text-blue-400 mt-1 uppercase font-bold tracking-widest">Registrar pagamento manualmente</p>
                  </div>
                  <button 
                    onClick={() => {
                      updateStudent(student.id, { status: StudentStatus.ACTIVE });
                      // In a real app, we'd add a payment record here
                      setShowSuccess(true);
                      setTimeout(() => setShowSuccess(false), 2000);
                    }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-xl transition-all"
                  >
                    {t('common.confirm').toUpperCase()}
                  </button>
                </div>

                <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] border-2 border-dashed border-amber-100 dark:border-amber-900/30 text-center space-y-6">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-600"><Clock size={32}/></div>
                  <div>
                    <h3 className="text-xl font-black text-amber-600 uppercase tracking-tighter">{t('common.pauseBilling')}</h3>
                    <p className="text-[10px] text-amber-400 mt-1 uppercase font-bold tracking-widest">Pausar cobranças por evasão</p>
                  </div>
                  <button 
                    onClick={() => {
                      updateStudent(student.id, { status: StudentStatus.INACTIVE });
                      setShowSuccess(true);
                      setTimeout(() => setShowSuccess(false), 2000);
                    }}
                    className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-700 shadow-xl transition-all"
                  >
                    {student.status === StudentStatus.INACTIVE ? t('common.approved').toUpperCase() : t('common.pauseBilling').toUpperCase()}
                  </button>
                </div>
              </div>

              <div className="p-12 bg-red-50 dark:bg-red-900/10 rounded-[3rem] border-2 border-dashed border-red-100 dark:border-red-900/30 text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto text-red-600"><Trash2 size={40}/></div>
                <div>
                  <h3 className="text-2xl font-black text-red-600 uppercase tracking-tighter">{t('students.deleteTitle')}</h3>
                  <p className="text-sm text-red-400 mt-1">{t('students.deleteWarning')}</p>
                </div>
                <button 
                  onClick={() => { if(confirm(t('students.deleteConfirm'))) { deleteStudent(student.id); onClose(); } }} 
                  className="px-12 py-5 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-red-700 shadow-2xl flex items-center gap-3 mx-auto transition-all"
                >
                  <Trash2 size={20} /> {t('students.deleteBtn').toUpperCase()}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CompetitorSelectorModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { students, updateStudent } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter students who ARE NOT competitors yet
  const availableStudents = useMemo(() => {
    return students.filter(s => 
      !s.isCompetitor && 
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.nickname?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [students, searchTerm]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    
    // Batch update (handled sequentially for now as useData provides updateStudent)
    for (const id of selectedIds) {
      await updateStudent(id, { isCompetitor: true });
    }
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-2">{t('students.selectCompetitors')}</h2>
            <p className="text-slate-500 font-medium italic text-sm">{t('students.selectCompetitorsSubtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t('students.searchStudents')} 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none dark:text-white font-bold transition-all text-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-3">
          {availableStudents.map(student => (
            <div 
              key={student.id}
              onClick={() => toggleSelection(student.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                selectedIds.has(student.id) 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600' 
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${student.isKid ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                  {student.name[0]}
                </div>
                <div>
                  <p className={`font-black uppercase tracking-tight ${selectedIds.has(student.id) ? 'text-blue-600' : 'dark:text-white text-slate-900'}`}>{student.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${BELT_COLORS[student.belt]}`}>{t(`belts.${student.belt}`)}</span>
                    {student.nickname && <span className="text-[9px] text-slate-400 font-bold italic truncate">"{student.nickname}"</span>}
                  </div>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedIds.has(student.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200 dark:border-slate-700'
              }`}>
                {selectedIds.has(student.id) && <Plus size={14} className="text-white rotate-45" />}
              </div>
            </div>
          ))}
          {availableStudents.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
              {t('students.noNewCompetitors')}
            </div>
          )}
        </div>

        <div className="p-8 pt-4">
          <button 
            onClick={handleSave}
            disabled={selectedIds.size === 0 || showSuccess}
            className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
              selectedIds.size === 0 
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                : showSuccess 
                  ? 'bg-green-500 text-white shadow-green-500/20'
                  : 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {showSuccess ? (
              <>
                <Zap className="animate-pulse" size={20} />
                {t('students.selectionSuccess')}
              </>
            ) : (
              <>
                <Plus size={20} />
                {t('students.addSelectedCompetitors')} ({selectedIds.size})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Students: React.FC = () => {
  const { t } = useTranslation();
  const { students } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'adult' | 'kids' | 'competitors'>('adult');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isSelectingCompetitors, setIsSelectingCompetitors] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const nicknameMatch = s.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || nicknameMatch;
      
      if (activeView === 'competitors') return matchesSearch && s.isCompetitor;
      const matchesView = activeView === 'kids' ? s.isKid : !s.isKid;
      return matchesSearch && matchesView;
    });
  }, [searchTerm, students, activeView]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 w-full animate-in fade-in duration-700 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('students.title')}</h1>
          <p className="text-slate-500 font-medium italic mt-1 text-sm">{t('students.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          {activeView === 'competitors' && (
            <button 
              onClick={() => setIsSelectingCompetitors(true)} 
              className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">{t('students.selectCompetitors')}</span>
            </button>
          )}
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t('students.searchPlaceholder')} 
              className="w-full sm:w-64 pl-12 pr-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none shadow-lg dark:text-white font-medium transition-all text-sm" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => setIsAddingStudent(true)} 
            className={`p-4 text-white rounded-xl hover:rotate-6 transition-all shadow-xl active:scale-95 ${activeView === 'kids' ? 'bg-yellow-500 shadow-yellow-500/30' : 'bg-blue-600 shadow-blue-500/30'}`}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl w-full max-w-[450px] shadow-sm border border-slate-100 dark:border-slate-700">
        <button 
          onClick={() => setActiveView('adult')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'adult' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600'}`}
        >
          <User size={14}/> {t('common.adult')}
        </button>
        <button 
          onClick={() => setActiveView('kids')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'kids' ? 'bg-yellow-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600'}`}
        >
          <Baby size={14}/> {t('common.kid')}
        </button>
        <button 
          onClick={() => setActiveView('competitors')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'competitors' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          <Medal size={14}/> {t('students.isCompetitor')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 sm:px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('common.name')}</th>
                <th className="px-6 sm:px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('students.currentBelt')}</th>
                <th className="px-6 sm:px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('students.status')} / {t('students.performance')}</th>
                <th className="px-6 sm:px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">{t('students.totalClasses')}</th>
                <th className="px-6 sm:px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group" 
                  onClick={() => setSelectedStudent(student)}
                >
                  <td className="px-6 sm:px-8 py-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-black transition-all group-hover:rotate-12 shrink-0 overflow-hidden ${student.isKid ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          student.name[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight uppercase leading-none truncate group-hover:text-blue-600 transition-colors uppercase">{student.name}</p>
                          {student.isCompetitor && <Medal size={12} className="text-blue-600 shrink-0" />}
                        </div>
                        {student.nickname && <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black mt-0.5 italic truncate">"{student.nickname}"</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 sm:px-8 py-4">
                    <span className={`px-2.5 sm:px-3 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-sm border whitespace-nowrap ${BELT_COLORS[student.belt] || 'bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                      {t(`belts.${student.belt}`)}
                    </span>
                  </td>
                  <td className="px-6 sm:px-8 py-4">
                    {activeView === 'kids' ? (
                      <div className="flex items-center gap-1.5">
                        <Medal size={12} className="text-yellow-500 shrink-0" />
                        <span className="font-black text-slate-900 dark:text-white whitespace-nowrap tabular-nums text-[10px]">{student.rewardPoints || 0} OSS PTS</span>
                      </div>
                    ) : (
                      <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] shadow-sm whitespace-nowrap ${
                        student.status === StudentStatus.ACTIVE ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-500' : 
                        student.status === StudentStatus.OVERDUE ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-500' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {t(`status.${student.status}`)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 sm:px-8 py-4 text-center">
                     <p className="font-black text-base sm:text-lg leading-none dark:text-white tabular-nums">{student.attendanceCount || 0}</p>
                     <p className="text-[7px] uppercase font-bold text-slate-400 mt-0.5">{t('students.totalClasses')}</p>
                  </td>
                  <td className="px-6 sm:px-8 py-4 text-right">
                    <MoreVertical size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors ml-auto" />
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">
                    {t('students.noStudents')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedStudent && <StudentDetailsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
      {isAddingStudent && <NewStudentModal defaultIsKid={activeView === 'kids'} onClose={() => setIsAddingStudent(false)} />}
      {isSelectingCompetitors && <CompetitorSelectorModal onClose={() => setIsSelectingCompetitors(false)} />}
    </div>
  );
};

export default Students;
