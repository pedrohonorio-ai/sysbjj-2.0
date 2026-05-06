
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MoreVertical, 
  Shield, 
  X, 
  User, 
  Plus,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Save,
  Baby,
  Medal,
  Trophy,
  Brain,
  Trash2,
  Zap,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Clock,
  BookOpen,
  Camera,
  MapPin,
  HeartPulse,
  UserPlus,
  Download,
  FileText,
  ShieldCheck,
  ShieldAlert,
  FileWarning,
  AlertCircle,
  FileCheck,
  Filter,
  ArrowRight,
  LayoutList,
  UserCheck
} from 'lucide-react';
import Webcam from 'react-webcam';
import { Student, StudentStatus, BeltColor, KidsBeltColor, Gender, CBJJCategory } from '../types';
import { BELT_COLORS, IBJJF_BELT_RULES } from '../constants';
import { IBJJF_LESSONS } from '../constants/rulesData';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { calculateCBJJCategory, calculateWeightClass } from '../services/cbjj';
import { compressImage } from '../services/imageUtils';

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const CameraCapture = ({ onCapture, onClose }: { onCapture: (img: string) => void, onClose: () => void }) => {
  const webcamRef = React.useRef<Webcam>(null);
  const { t } = useTranslation();

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
      onClose();
    }
  }, [webcamRef, onCapture, onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('settings.capturePhoto')}</h3>
          <button onClick={onClose} className="p-2 bg-white dark:bg-slate-900 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-inner aspect-[4/3] bg-black">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode: "user" }}
            />
            <div className="absolute inset-0 border-[1.5rem] border-blue-600/10 pointer-events-none rounded-[1.8rem]" />
          </div>
          <button 
            onClick={capture}
            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Camera size={20} /> {t('settings.takePhotoNow')}
          </button>
        </div>
      </div>
    </div>
  );
};

const validateStudent = (student: Partial<Student>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!student.name || student.name.trim().length < 3) {
    errors.push('Nome deve ter pelo menos 3 caracteres.');
  }

  if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    errors.push('Formato de e-mail inválido.');
  }

  if (student.cpf && student.cpf.replace(/\D/g, '').length !== 11) {
    errors.push('CPF deve ter 11 dígitos.');
  }

  if (student.phone && student.phone.replace(/\D/g, '').length < 10) {
    errors.push('Telefone inválido.');
  }

  if (!student.birthDate) {
    errors.push('Data de nascimento é obrigatória.');
  }

  if (student.monthlyValue !== undefined && student.monthlyValue < 0) {
    errors.push('Valor mensal não pode ser negativo.');
  }

  if (student.dueDay !== undefined && (student.dueDay < 1 || student.dueDay > 31)) {
    errors.push('Dia de vencimento deve ser entre 1 e 31.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const NewStudentModal = ({ onClose, defaultIsKid }: { onClose: () => void, defaultIsKid: boolean }) => {
  const { t } = useTranslation();
  const { addStudent, schedules } = useData();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basics' | 'legal' | 'technical' | 'health' | 'security'>('basics');
  
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    birthDate: new Date(new Date().getFullYear() - (defaultIsKid ? 10 : 25), 0, 1).toISOString().split('T')[0],
    gender: Gender.MALE,
    cpf: '',
    rg: '',
    rgIssuer: '',
    weight: defaultIsKid ? 40 : 75,
    height: defaultIsKid ? 1.40 : 1.75,
    federationId: '',
    category: CBJJCategory.ADULTO,
    weightClass: 'rooster',
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
    emergencyPhone: '',
    medicalConditions: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bloodType: '',
    responsiblePerson: '',
    responsibleCpf: '',
    civilStatus: '',
    occupation: '',
    nationality: t('common.brazilian'),
    lgpdConsent: true,
    classId: '',
    responsibleEmail: '',
    responsiblePhone: '',
    waitlistRank: 0,
    documents: [] as { id: string; name: string; url: string; type: string; size: number; uploadDate: string; }[]
  });

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          setError(t('common.fileTooLarge') || "Arquivo muito grande (máx 5MB)");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const newDoc = {
            id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: reader.result as string,
            type: file.type,
            size: file.size,
            uploadDate: new Date().toISOString()
          };
          setFormData(prev => ({
            ...prev,
            documents: [...(prev.documents || []), newDoc]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeDocument = (id: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter(doc => doc.id !== id) || []
    }));
  };

  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 0.7);
        setFormData(prev => ({ ...prev, photoUrl: compressed }));
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
      weightClass
    }));
  }, [formData.birthDate, formData.gender, formData.weight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = validateStudent(formData);
    if (!validation.isValid) {
      setError(validation.errors.join(' '));
      return;
    }
    
    if (!formData.lgpdConsent) {
      setError("O consentimento LGPD é obrigatório para o cadastro.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError("Email inválido. Por favor, verifique.");
      return;
    }

    try {
      await addStudent({
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
        portalAccessCode: `SYS-${formData.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
      });
      onClose();
    } catch (err) {
      console.error("Error submitting student form:", err);
      setError(t('common.errorOccurred') || 'Ocorreu um erro ao cadastrar o aluno.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden">
        <div className="p-8 sm:p-10 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                {formData.isKid ? t('students.newKidTitle') : t('students.newStudentTitle')}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                {activeTab.toUpperCase()} | {formData.isKid ? 'Kids' : 'Adult'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
              <X size={28} />
            </button>
          </div>

            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
              <button 
                onClick={() => setActiveTab('basics')}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'basics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                {t('students.overviewTab')}
              </button>
              <button 
                onClick={() => setActiveTab('technical')}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'technical' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                {t('students.technicalTab')}
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                SEGURANÇA & INTEGRIDADE
              </button>
              <button 
                onClick={() => setActiveTab('legal')}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'legal' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                {t('common.legalInfo')}
              </button>
              <button 
                onClick={() => setActiveTab('health')}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'health' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                {t('common.healthInfo')}
              </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-10 pt-0 scrollbar-hide">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {activeTab === 'basics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div 
                    className="relative w-32 h-32 rounded-[2rem] bg-slate-200 dark:bg-slate-700 overflow-hidden cursor-pointer group shadow-xl"
                  >
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" onClick={() => fileInputRef.current?.click()} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400" onClick={() => fileInputRef.current?.click()}>
                        <Camera size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{t('common.uploadPhoto')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button 
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                      <Camera size={14} /> Usar Câmera
                    </button>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 shadow-sm"
                    >
                      <Plus size={14} /> Galeria
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>

                {showCamera && (
                  <CameraCapture 
                    onCapture={(img) => setFormData(prev => ({ ...prev, photoUrl: img }))} 
                    onClose={() => setShowCamera(false)} 
                  />
                )}

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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.nickname')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.nickname}
                    onChange={e => setFormData({...formData, nickname: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.phone')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                  <input 
                    type="email" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.birthDate')}</label>
                  <input 
                    type="date" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.birthDate}
                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.gender')}</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                  >
                    <option value={Gender.MALE}>{t('common.male') || 'Masculino'}</option>
                    <option value={Gender.FEMALE}>{t('common.female') || 'Feminino'}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.civilStatus')}</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                    value={formData.civilStatus}
                    onChange={e => setFormData({...formData, civilStatus: e.target.value})}
                  >
                    <option value="">{t('common.select')}</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.occupation')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.occupation}
                    onChange={e => setFormData({...formData, occupation: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.nationality')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.nationality}
                    onChange={e => setFormData({...formData, nationality: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.address')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                  />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 text-center">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-6">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-xl font-black text-indigo-900 dark:text-white uppercase tracking-tighter">Blockchain Registry</h3>
                  <p className="text-xs text-indigo-500 mt-2 font-medium">Os dados deste aluno serão selados criptograficamente. Toda alteração gerará um novo hash de integridade irreversível.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400"><Zap size={20}/></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hash de Entrada</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">SYSBJJ_GENESIS_NODE_STATIC</p>
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase text-center tracking-[0.2em]">O sistema irá assinar digitalmente o registro ao salvar.</p>
                </div>
              </div>
            )}

            {activeTab === 'technical' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.currentBelt')}</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.lastPromotion')}</label>
                  <input 
                    type="date" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.lastPromotionDate}
                    onChange={e => setFormData({...formData, lastPromotionDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.weight')} (kg)</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.height')} (m)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.height}
                    onChange={e => setFormData({...formData, height: parseFloat(e.target.value)})}
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.class')}</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                    value={formData.classId}
                    onChange={e => setFormData({...formData, classId: e.target.value})}
                  >
                    <option value="">{t('students.noFixedClass')}</option>
                    {schedules.map(s => (
                      <option key={s.id} value={s.id}>{s.title} ({s.time})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.value')} ({t('common.currencySymbol')})</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.monthlyValue}
                    onChange={e => setFormData({...formData, monthlyValue: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.status')}</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as StudentStatus})}
                  >
                    <option value={StudentStatus.ACTIVE}>{t('students.statusActive')}</option>
                    <option value={StudentStatus.WAITLIST}>{t('students.statusWaitlist')}</option>
                  </select>
                </div>

                {formData.status === StudentStatus.WAITLIST && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.waitlistRank')}</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                      value={formData.waitlistRank}
                      onChange={e => setFormData({...formData, waitlistRank: parseInt(e.target.value)})}
                    />
                  </div>
                )}

                <div className="md:col-span-2 space-y-4 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.isKid} onChange={e => setFormData({...formData, isKid: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600" />
                      <span className="text-[10px] font-black uppercase dark:text-white">{t('common.kids')}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.isInstructor} onChange={e => setFormData({...formData, isInstructor: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600" />
                      <span className="text-[10px] font-black uppercase dark:text-white">{t('common.instructor')}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.isCompetitor} onChange={e => setFormData({...formData, isCompetitor: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600" />
                      <span className="text-[10px] font-black uppercase dark:text-white">{t('students.isCompetitor')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.cpf}
                    onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.rg}
                    onChange={e => setFormData({...formData, rg: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Órgão Emissor</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.rgIssuer}
                    onChange={e => setFormData({...formData, rgIssuer: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.zipCode}
                    onChange={e => setFormData({...formData, zipCode: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.address')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Rua, Número, Complemento"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.city')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.state')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    placeholder="Ex: RJ"
                  />
                </div>

                {formData.isKid && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.responsiblePerson')}</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={formData.responsiblePerson}
                        onChange={e => setFormData({...formData, responsiblePerson: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.responsibleCpf')}</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={formData.responsibleCpf}
                        onChange={e => setFormData({...formData, responsibleCpf: formatCPF(e.target.value)})}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.responsibleEmail')}</label>
                      <input 
                        type="email" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={formData.responsibleEmail || ''}
                        onChange={e => setFormData({...formData, responsibleEmail: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.responsiblePhone')}</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={formData.responsiblePhone || ''}
                        onChange={e => setFormData({...formData, responsiblePhone: formatPhone(e.target.value)})}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.lgpdConsent} 
                      onChange={e => setFormData({...formData, lgpdConsent: e.target.checked})} 
                      className="w-6 h-6 rounded border-slate-300 text-emerald-600" 
                    />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">{t('common.lgpdConsent')}</p>
                      <p className="text-[9px] text-slate-500 font-medium">Concordo com o armazenamento e processamento dos meus dados pessoais conforme a Lei Geral de Proteção de Dados.</p>
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t('common.documentsSection') || 'Documentos & Anexos'}
                    </label>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('new-student-docs')?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all"
                    >
                      <Plus size={14} /> {t('common.addDocument')}
                    </button>
                    <input 
                      id="new-student-docs"
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={handleDocumentUpload}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {formData.documents && formData.documents.length > 0 ? (
                      formData.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group animate-in slide-in-from-left-2 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-blue-600 shadow-sm">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate max-w-[180px]">{doc.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{(doc.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('common.noDocuments')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'health' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.emergencyContact')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.emergencyContact}
                    onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.emergencyPhone')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                    value={formData.emergencyPhone}
                    onChange={e => setFormData({...formData, emergencyPhone: formatPhone(e.target.value)})}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.bloodType')}</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                    value={formData.bloodType}
                    onChange={e => setFormData({...formData, bloodType: e.target.value})}
                  >
                    <option value="">Selecione</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.medicalConditions')}</label>
                  <textarea 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold min-h-[120px]" 
                    value={formData.medicalConditions}
                    onChange={e => setFormData({...formData, medicalConditions: e.target.value})}
                    placeholder="Ex: Alergias, asma, problemas cardíacos, cirurgias recentes, etc."
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 mt-auto">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-5 text-slate-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className={`flex-[2] py-5 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all active:scale-95 ${formData.isKid ? 'bg-yellow-500 shadow-yellow-500/30' : 'bg-blue-600 shadow-blue-500/30'}`}>
                {t('students.enrollBtn').toUpperCase()}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const StudentDetailsModal = ({ student, onClose }: { student: Student; onClose: () => void }) => {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'progress' | 'edit' | 'admin' | 'videos' | 'financial' | 'security' | 'contract' | 'health' | 'documents'>('overview');
  const [editTab, setEditTab] = useState<'basics' | 'legal' | 'technical' | 'health'>('basics');
  const { t } = useTranslation();
  const { deleteStudent, updateStudent, schedules } = useData();
  const [editPros, setEditPros] = useState(student.pros || '');
  const [editCons, setEditCons] = useState(student.cons || '');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: '', videoUrl: '', description: '' });

  const handleAddPositionVideo = () => {
    if (newVideo.title && newVideo.videoUrl) {
      const videoData = {
        id: `VID-${Date.now()}`,
        ...newVideo,
        date: new Date().toISOString().split('T')[0],
        authorId: 'professor',
        authorName: 'Professor'
      };
      const updatedVideos = [...(student.positionVideos || []), videoData];
      updateStudent(student.id, { positionVideos: updatedVideos });
      setShowAddVideo(false);
      setNewVideo({ title: '', videoUrl: '', description: '' });
    }
  };

  const [showCamera, setShowCamera] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...student });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(t('common.fileTooLarge') || "Arquivo muito grande (máx 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 0.7);
        setEditFormData(prev => ({ ...prev, photoUrl: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(t('common.fileTooLarge') || "Arquivo muito grande (máx 5MB)");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const newDoc = {
            id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: reader.result as string,
            type: file.type,
            size: file.size,
            uploadDate: new Date().toISOString()
          };
          setEditFormData(prev => ({
            ...prev,
            documents: [...(prev.documents || []), newDoc]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeDocument = (id: string) => {
    setEditFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter(doc => doc.id !== id) || []
    }));
  };

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
    
    const validation = validateStudent(editFormData);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

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
                  (student?.name || '?')[0]
                )}
              </div>
              <div className="text-left space-y-1 sm:space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none truncate max-w-[200px] sm:max-w-none">{student.name}</h2>
                   {student.nickname && <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-white/20 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest italic w-fit">"{student.nickname}"</span>}
                   <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-white/10 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest w-fit">
                     {calculateAge(student.birthDate)} {t('common.years')}
                   </span>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <span className={`px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest shadow-2xl ${BELT_COLORS[student.belt] || 'bg-slate-100 text-slate-600'}`}>
                    {t(`belts.${student.belt}`)}
                  </span>
                  <span className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest bg-white/10 text-white">
                    {student.isKid ? t('common.kids').toUpperCase() : t(`status.${student.status}`).toUpperCase()}
                  </span>
                  {student.isCompetitor && (
                    <span className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest bg-blue-600 text-white flex items-center gap-2">
                      <Medal size={14} /> {t('students.isCompetitor').toUpperCase()}
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
          <button onClick={() => setActiveTab('health')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'health' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400'}`}>{t('common.healthInfo')}</button>
          <button onClick={() => setActiveTab('documents')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>{t('common.documentsSection') || 'Documentos'}</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('common.techAnalysisTab')}</button>
          <button onClick={() => setActiveTab('progress')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'progress' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400'}`}>{t('common.evolutionTab')}</button>
          <button onClick={() => setActiveTab('financial')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'financial' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>{t('students.financialTab')}</button>
          <button onClick={() => setActiveTab('edit')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'edit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('common.edit').toUpperCase()}</button>
          <button onClick={() => setActiveTab('security')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>{t('common.integrityBadgeTab')}</button>
          <button onClick={() => setActiveTab('videos')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'videos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('common.videos')}</button>
          <button onClick={() => setActiveTab('contract')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'contract' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('common.contract')}</button>
          <button onClick={() => setActiveTab('admin')} className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t('students.adminTab')}</button>
        </div>

        <div className="p-4 sm:p-10 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          {activeTab === 'edit' && (
            <div className="space-y-6">
              <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                <button onClick={() => setEditTab('basics')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editTab === 'basics' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{t('students.personalTab')}</button>
                <button onClick={() => setEditTab('legal')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editTab === 'legal' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{t('common.legalInfo')}</button>
                <button onClick={() => setEditTab('technical')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editTab === 'technical' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{t('students.technicalTab')}</button>
                <button onClick={() => setEditTab('health')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editTab === 'health' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{t('common.healthInfo')}</button>
              </div>

              <form className="animate-in fade-in slide-in-from-right-4" onSubmit={handleUpdateRegistration}>
                {editTab === 'basics' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <div 
                        className="relative w-32 h-32 rounded-[2rem] bg-slate-200 dark:bg-slate-700 overflow-hidden cursor-pointer group shadow-xl"
                      >
                        {editFormData.photoUrl ? (
                          <img src={editFormData.photoUrl} alt="Preview" className="w-full h-full object-cover" onClick={() => fileInputRef.current?.click()} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400" onClick={() => fileInputRef.current?.click()}>
                            <Camera size={40} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{t('common.uploadPhoto')}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-6">
                        <button 
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                          <Camera size={14} /> {t('common.useCamera')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 shadow-sm"
                        >
                          <Plus size={14} /> {t('common.gallery')}
                        </button>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>

                    {showCamera && (
                      <CameraCapture 
                        onCapture={(img) => setEditFormData(prev => ({ ...prev, photoUrl: img }))} 
                        onClose={() => setShowCamera(false)} 
                      />
                    )}

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

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                      <input 
                        type="email" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        required 
                        value={editFormData.email}
                        onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.nickname')}</label>
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
                        onChange={e => setEditFormData({...editFormData, phone: formatPhone(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.civilStatus')}</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none font-bold"
                        value={editFormData.civilStatus || ''}
                        onChange={e => setEditFormData({...editFormData, civilStatus: e.target.value})}
                      >
                        <option value="">{t('common.select')}</option>
                        <option value="single">{t('common.single')}</option>
                        <option value="married">{t('common.married')}</option>
                        <option value="divorced">{t('common.divorced')}</option>
                        <option value="widowed">{t('common.widowed')}</option>
                        <option value="stableUnion">{t('common.stableUnion')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.occupation')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.occupation || ''}
                        onChange={e => setEditFormData({...editFormData, occupation: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.nationality')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.nationality || ''}
                        onChange={e => setEditFormData({...editFormData, nationality: e.target.value})}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.address')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.address || ''}
                        onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                        placeholder={t('common.addressPlaceholder')}
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.gender')}</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none font-bold"
                        value={editFormData.gender}
                        onChange={e => setEditFormData({...editFormData, gender: e.target.value as Gender})}
                      >
                        {Object.values(Gender).map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.waitlist')}</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none font-bold"
                        value={editFormData.status === StudentStatus.WAITLIST ? 'Yes' : 'No'}
                        onChange={e => setEditFormData({...editFormData, status: e.target.value === 'Yes' ? StudentStatus.WAITLIST : StudentStatus.ACTIVE})}
                      >
                        <option value="No">{t('common.no')}</option>
                        <option value="Yes">{t('common.yes')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.type')}</label>
                      <div className="flex flex-wrap items-center gap-4 h-auto min-h-[54px] px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={editFormData.isInstructor} onChange={e => setEditFormData({...editFormData, isInstructor: e.target.checked})} className="w-4 h-4 text-blue-600" />
                          <span className="text-[10px] font-black uppercase dark:text-white">{t('common.instructor')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={editFormData.isKid} onChange={e => setEditFormData({...editFormData, isKid: e.target.checked})} className="w-4 h-4 text-blue-600" />
                          <span className="text-[10px] font-black uppercase dark:text-white">{t('common.kid')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={editFormData.isCompetitor} onChange={e => setEditFormData({...editFormData, isCompetitor: e.target.checked})} className="w-4 h-4 text-blue-600" />
                          <span className="text-[10px] font-black uppercase dark:text-white">{t('students.isCompetitor')}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {editTab === 'legal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.cpf')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.cpf || ''}
                        onChange={e => setEditFormData({...editFormData, cpf: formatCPF(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.rg')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.rg || ''}
                        onChange={e => setEditFormData({...editFormData, rg: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.rgIssuer')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.rgIssuer || ''}
                        onChange={e => setEditFormData({...editFormData, rgIssuer: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.zipCode')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.zipCode || ''}
                        onChange={e => setEditFormData({...editFormData, zipCode: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.address')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.address || ''}
                        onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.city')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.city || ''}
                        onChange={e => setEditFormData({...editFormData, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.state')}</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                        value={editFormData.state || ''}
                        onChange={e => setEditFormData({...editFormData, state: e.target.value})}
                      />
                    </div>
                    {editFormData.isKid && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.responsiblePerson')}</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                            value={editFormData.responsiblePerson || ''}
                            onChange={e => setEditFormData({...editFormData, responsiblePerson: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.responsibleCpf')}</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" 
                            value={editFormData.responsibleCpf || ''}
                            onChange={e => setEditFormData({...editFormData, responsibleCpf: formatCPF(e.target.value)})}
                          />
                        </div>
                      </>
                    )}
                    <div className="md:col-span-2 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editFormData.lgpdConsent} 
                          onChange={e => setEditFormData({...editFormData, lgpdConsent: e.target.checked})} 
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600" 
                        />
                        <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">{t('common.lgpdConsent')}</span>
                      </label>
                    </div>

                    <div className="md:col-span-2 space-y-4 mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {t('common.documentsSection') || 'Documentos & Anexos'}
                        </label>
                        <button 
                          type="button"
                          onClick={() => document.getElementById('edit-student-docs')?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all"
                        >
                          <Plus size={14} /> {t('common.addDocument')}
                        </button>
                        <input 
                          id="edit-student-docs"
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={handleDocumentUpload}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {editFormData.documents && editFormData.documents.length > 0 ? (
                          editFormData.documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group transition-all">
                              <div className="flex items-center gap-3">
                                <FileText size={16} className="text-blue-600" />
                                <div className="max-w-[150px]">
                                  <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase truncate">{doc.name}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">{(doc.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeDocument(doc.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('common.noDocuments')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {editTab === 'technical' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <input type="number" min="0" max="4" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" value={editFormData.stripes} onChange={e => setEditFormData({...editFormData, stripes: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.lastPromotion')}</label>
                      <input type="date" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold" value={editFormData.lastPromotionDate} onChange={e => setEditFormData({...editFormData, lastPromotionDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma (Classe)</label>
                      <select className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none font-bold" value={editFormData.classId || ''} onChange={e => setEditFormData({...editFormData, classId: e.target.value})}>
                        <option value="">Sem Turma Fixa</option>
                        {schedules.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('students.technicalNotes')}</label>
                      <textarea className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold min-h-[100px]" value={editFormData.technicalNotes || ''} onChange={e => setEditFormData({...editFormData, technicalNotes: e.target.value})} />
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full mt-6 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                  {showSuccess ? <><ThumbsUp size={20} />{t('common.saveSuccess').toUpperCase()}</> : <><Save size={20} />{t('common.save').toUpperCase()}</>}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
              <div className="lg:col-span-12 space-y-6 sm:space-y-10">
                {/* Professional Performance Card */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Trophy size={14} className="text-blue-600"/> {t('students.professionalPerformance') || 'Performance Profissional (KPIs)'}</h3>
                  <div className="p-8 rounded-[2.5rem] bg-slate-950 text-white border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                      <div className="text-center">
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Assiduidade</p>
                        <p className="text-2xl font-black">{Math.min(100, (student.attendanceCount / 100) * 100).toFixed(0)}%</p>
                        <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                           <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (student.attendanceCount / 100) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Maturidade</p>
                        <p className="text-2xl font-black">{beltAnalysis?.progress.toFixed(0) || 0}%</p>
                        <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                           <div className="h-full bg-amber-500 rounded-full" style={{ width: `${beltAnalysis?.progress || 0}%` }} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Nível de Foco</p>
                        <p className="text-xl font-black uppercase text-emerald-400">{student.status === StudentStatus.ACTIVE ? 'Elite' : 'Frequente'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Potencial Pro</p>
                        <p className="text-xl font-black uppercase text-blue-400">{student.isCompetitor ? 'High Perf' : 'Standard'}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-7 space-y-6 sm:space-y-10">
                {/* Personal Summary */}
                <section className="space-y-4">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14} /> {t('students.personalInfo') || 'Informações Pessoais'}</h3>
                  <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                        <p className="font-bold text-slate-900 dark:text-white break-all">+{student.phone}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail</p>
                        <p className="font-bold text-slate-900 dark:text-white break-all">{student.email || '--'}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.birthDate')}</p>
                        <p className="font-bold text-slate-900 dark:text-white">{new Date(student.birthDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Data de Início</p>
                        <p className="font-bold text-blue-600 uppercase italic">{student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : 'Não registrado'}</p>
                    </div>
                    <div className="sm:col-span-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.address')}</p>
                        <p className="font-bold text-slate-900 dark:text-white">{student.address || '--'}, {student.city || '--'} - {student.state || '--'}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-5 space-y-6 sm:space-y-10">
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

                  {/* Evolution & Rules Mastery */}
                  <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20" />
                     <div className="relative z-10">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Shield size={14} /> {t('portal.rulesAcademy') || 'ACADEMIA DE REGRAS'}
                        </p>
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-3xl font-black text-white leading-none tabular-nums">{student.rulesKnowledge || 0}%</p>
                                <p className="text-[8px] font-bold uppercase text-blue-400 mt-1">NÍVEL DE MESTRIA</p>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-black text-white tabular-nums">{student.rewardPoints || 0}</p>
                                <p className="text-[8px] font-bold uppercase text-slate-400">PONTOS VITALÍCIOS</p>
                             </div>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000" 
                               style={{ width: `${student.rulesKnowledge || 0}%` }} 
                             />
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                             {student.completedRuleLessons?.length || 0} de {IBJJF_LESSONS?.length || 10} módulos concluídos.
                          </p>
                        </div>
                     </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HeartPulse size={14} /> {t('common.healthInfo') || 'Saúde & Emergência'}</h3>
                <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.bloodType')}</p>
                      <p className="text-xl font-black text-red-600">{student.bloodType || 'Não informado'}</p>
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.emergencyContact')}</p>
                      <p className="text-xl font-black text-red-600">{student.emergencyContact || '--'}</p>
                      {student.emergencyPhone && <p className="text-sm font-bold text-slate-500 mt-1">WA: {student.emergencyPhone}</p>}
                  </div>
                  <div className="col-span-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('common.medicalConditions')}</p>
                      <p className="text-base font-bold text-orange-600 italic whitespace-pre-wrap">{student.medicalConditions || 'Nenhuma condição médica registrada.'}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> {t('medical.docsTitle') || 'Documentação Médica'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className={`p-8 rounded-[2.5rem] border-2 ${student.liabilityWaiverAccepted ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${student.liabilityWaiverAccepted ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {student.liabilityWaiverAccepted ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('medical.waiverTitle')}</p>
                        <p className={`text-sm font-black uppercase ${student.liabilityWaiverAccepted ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {student.liabilityWaiverAccepted ? t('medical.accepted') : t('medical.notAccepted')}
                        </p>
                      </div>
                    </div>
                    {student.liabilityWaiverDate && (
                      <p className="text-[10px] font-bold text-slate-500 uppercase italic">
                        {t('medical.acceptedOn')}: {new Date(student.liabilityWaiverDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className={`p-8 rounded-[2.5rem] border-2 ${
                    !student.medicalCertificateUrl ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/20' :
                    new Date(student.medicalCertificateExpiration!) < new Date() ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20' :
                    'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20'
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        !student.medicalCertificateUrl ? 'bg-rose-100 text-rose-600' :
                        new Date(student.medicalCertificateExpiration!) < new Date() ? 'bg-red-100 text-red-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {!student.medicalCertificateUrl ? <FileWarning size={24} /> :
                         new Date(student.medicalCertificateExpiration!) < new Date() ? <AlertCircle size={24} /> : <FileCheck size={24} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('medical.certificate')}</p>
                        <p className={`text-sm font-black uppercase ${
                          !student.medicalCertificateUrl ? 'text-rose-600' :
                          new Date(student.medicalCertificateExpiration!) < new Date() ? 'text-red-600' :
                          'text-emerald-600'
                        }`}>
                          {!student.medicalCertificateUrl ? t('medical.missing') :
                           new Date(student.medicalCertificateExpiration!) < new Date() ? t('medical.expired') : t('medical.valid')}
                        </p>
                      </div>
                    </div>
                    {student.medicalCertificateExpiration && (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase italic">
                          {t('medical.expiresOn')}: {new Date(student.medicalCertificateExpiration).toLocaleDateString()}
                        </p>
                        {student.medicalCertificateUrl && (
                          <a 
                            href={student.medicalCertificateUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 transition-all font-bold"
                          >
                            {t('common.view').toUpperCase()}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <section className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} /> {t('common.legalInfo') || 'Informações Legais & LGPD'}</h3>
                 <div className="p-10 rounded-[3rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex items-center gap-5 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${student.lgpdConsent ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100/50' : 'bg-slate-100 text-slate-400 shadow-inner'}`}>
                       <ShieldCheck size={28} />
                     </div>
                     <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Consentimento LGPD</p>
                       <p className={`text-lg font-black uppercase tracking-tighter ${student.lgpdConsent ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {student.lgpdConsent ? 'CONCEDIDO' : 'PENDENTE'}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-5 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-400 opacity-50 grayscale shadow-sm">
                     <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-blue-100/50">
                       <FileText size={28} />
                     </div>
                     <div>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">Assinatura Digital</p>
                       <p className="text-lg font-black uppercase tracking-tighter text-blue-600">ATIVO</p>
                     </div>
                   </div>
                   <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                         <p className="font-bold text-slate-900 dark:text-white uppercase">{student.cpf || '--'}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">RG</p>
                         <p className="font-bold text-slate-900 dark:text-white uppercase">{student.rg || '--'}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado Civil</p>
                         <p className="font-bold text-slate-900 dark:text-white uppercase">{student.civilStatus || '--'}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Profissão</p>
                         <p className="font-bold text-slate-900 dark:text-white uppercase">{student.occupation || '--'}</p>
                      </div>
                   </div>
                 </div>
               </section>

               <section className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Download size={14} /> {t('common.documentsSection') || 'Repositório de Documentos'}
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {student.documents && student.documents.length > 0 ? (
                     student.documents.map(doc => (
                       <div key={doc.id} className="flex flex-col p-6 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 group hover:border-blue-500 hover:shadow-2xl transition-all h-full">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                              <FileText size={24} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{doc.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                                {new Date(doc.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                         </div>
                         <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                            <span className="text-[9px] font-black text-slate-300">{(doc.size / 1024).toFixed(0)} KB</span>
                            <a 
                              href={doc.url} 
                              download={doc.name}
                              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                            >
                              BAIXAR
                            </a>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-800/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                       <FileWarning size={48} className="mx-auto text-slate-200 mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum documento anexado.</p>
                     </div>
                   )}
                 </div>
               </section>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-all" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-100 mb-4">{t('students.monthlyPlan')}</p>
                    <p className="text-4xl font-black tracking-tighter leading-none tabular-nums">{t('common.currencySymbol')} {student.monthlyValue}</p>
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest flex items-center gap-2"><Clock size={14}/> {t('financial.dueDay')}: Dia {student.dueDay}</p>
                    </div>
                 </div>
                 <div className="md:col-span-2 p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                         <ShieldCheck size={24} className="text-emerald-500"/>
                         {t('financial.statusTitle')}
                       </h3>
                       <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${student.status === StudentStatus.ACTIVE ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                         {student.status === StudentStatus.ACTIVE ? t('financial.statusPaid') : t('financial.statusOverdue')}
                       </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{t('financial.lastPayment')}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-black dark:text-white">{student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString() : '--'}</p>
                            <p className="font-black text-emerald-500">{t('common.currencySymbol')} {student.monthlyValue}</p>
                          </div>
                       </div>
                       <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{t('financial.nextPayment')}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-black dark:text-white">{student.dueDay}/{new Date().getMonth() + 2}/{new Date().getFullYear()}</p>
                            <p className="font-black text-blue-500">{t('common.currencySymbol')} {student.monthlyValue}</p>
                          </div>
                       </div>
                    </div>
                 </div>
               </div>
               
               <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white min-h-[300px]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <FileText size={24} className="text-blue-400"/>
                      {t('financial.historyTitle')}
                    </h3>
                  </div>
                  
                  {(!student.billingPaused) ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 hidden md:grid">
                        <div className="col-span-4">{t('financial.description')}</div>
                        <div className="col-span-3">{t('financial.date')}</div>
                        <div className="col-span-3 text-right">{t('financial.value')}</div>
                        <div className="col-span-2 text-right">{t('financial.status')}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                           <div className="md:col-span-4 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                               <Plus size={18}/>
                             </div>
                             <div>
                               <p className="text-sm font-black uppercase tracking-tight">{t('financial.activeMonthly')}</p>
                               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('financial.proPlan')}</p>
                             </div>
                           </div>
                           <div className="md:col-span-3">
                             <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest md:hidden mb-1">{t('financial.date')}</p>
                             <p className="text-xs font-bold text-slate-400">{student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString() : t('financial.checkStatement')}</p>
                           </div>
                           <div className="md:col-span-3 text-right">
                             <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest md:hidden mb-1">{t('financial.value')}</p>
                             <p className="text-sm font-black">{t('common.currencySymbol')} {student.monthlyValue}</p>
                           </div>
                           <div className="md:col-span-2 text-right">
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                {t('financial.liquidated')}
                              </span>
                           </div>
                        </div>
                      </div>
                      <div className="pt-8 text-center opacity-40">
                         <p className="text-[9px] font-black uppercase tracking-[0.3em]">{t('financial.endOfHistory')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center py-20 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10">
                      <Zap size={40} className="mx-auto text-amber-500" />
                      <div>
                        <p className="text-lg font-black uppercase italic tracking-tighter">{t('financial.billingPaused')}</p>
                        <p className="text-xs font-bold text-slate-500 max-w-xs mx-auto mt-2">{t('financial.billingPausedDesc')}</p>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Technical Pulse Visualizer */}
               <div className="p-8 bg-slate-900 rounded-[3rem] text-white border border-slate-800 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-10" />
                 <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 w-full space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2"> Technical Archetype </p>
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic">{student.isCompetitor ? 'High Performance Athlete' : 'Standard Practitioner'}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Quedas', val: 45, color: 'bg-orange-500' },
                          { label: 'Passagem', val: 75, color: 'bg-emerald-500' },
                          { label: 'Guarda', val: 92, color: 'bg-blue-500' },
                          { label: 'Finalização', val: 68, color: 'bg-red-500' }
                        ].map((stat, i) => (
                          <div key={i} className="space-y-2">
                             <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                               <span>{stat.label}</span>
                               <span>{stat.val}%</span>
                             </div>
                             <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${stat.val}%` }}
                                 className={`h-full ${stat.color} shadow-[0_0_8px_rgba(255,255,255,0.1)]`}
                               />
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="w-full md:w-64 h-64 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center relative p-6">
                       <HeartPulse className="absolute text-blue-500/20 w-48 h-48" />
                       <div className="relative text-center">
                          <p className="text-5xl font-black tabular-nums tracking-tighter">{(student.attendanceCount / 10).toFixed(1)}</p>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-2">{t('audit.technicalIndex')}</p>
                       </div>
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <label className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2"><ThumbsUp size={18}/> {t('students.pros')}</label>
                   <textarea 
                     className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] min-h-[150px] outline-none focus:ring-2 focus:ring-green-500 dark:text-white transition-all font-medium"
                     value={editPros}
                     onChange={e => setEditPros(e.target.value)}
                     placeholder={t('students.prosPlaceholder')}
                   />
                 </div>
                 <div className="space-y-4">
                   <label className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2"><ThumbsDown size={18}/> {t('students.cons')}</label>
                   <textarea 
                     className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] min-h-[150px] outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition-all font-medium"
                     value={editCons}
                     onChange={e => setEditCons(e.target.value)}
                     placeholder={t('students.consPlaceholder')}
                   />
                 </div>
               </div>

               <div className="p-8 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><BookOpen size={18} /> {t('students.technicalNotes')}</h4>
                  <textarea 
                    className="w-full min-h-[200px] p-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-sm font-medium outline-none focus:border-blue-600 transition-all dark:text-white"
                    defaultValue={student.technicalNotes || ''}
                    onBlur={(e) => updateStudent(student.id, { technicalNotes: e.target.value })}
                    placeholder="Registre aqui o feedback técnico detalhado..."
                  />
               </div>

               <button 
                 onClick={handleUpdateAnalysis}
                 className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
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

           {activeTab === 'progress' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Timeline de Graduação */}
               <section className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Trophy size={14} className="text-amber-500" /> Jornada de Mestria
                 </h3>
                 <div className="relative pt-12 pb-8 px-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-x-auto">
                   <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2" />
                   <div className="relative flex justify-between min-w-[600px] gap-8">
                     {(student.graduationHistory && student.graduationHistory.length > 0 ? student.graduationHistory : [
                       { belt: 'BRANCA', date: student.joinedAt || 'Jan 2024', instructor: 'Sistema' },
                       { belt: student.belt.toUpperCase(), date: student.lastPromotionDate || 'Jan 2025', instructor: 'Sensei Master' }
                     ]).map((step, i) => (
                       <div key={i} className="flex flex-col items-center gap-4 relative z-10 group">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 shadow-xl transition-all ${
                           i === (student.graduationHistory?.length || 1) ? 'bg-blue-600 border-white text-white scale-110' : 
                           'bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-700 text-slate-600 dark:text-slate-300'
                         }`}>
                           <Medal size={24} />
                         </div>
                         <div className="text-center">
                           <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">{step.belt}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{step.date}</p>
                           <p className="text-[7px] text-blue-500 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Prof. {step.instructor}</p>
                         </div>
                       </div>
                     ))}
                     
                     <div className="flex flex-col items-center gap-4 relative z-10 opacity-30">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-4 border-dashed border-slate-300 dark:border-slate-600 text-slate-400">
                           <Zap size={24} />
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">NEXT</p>
                        </div>
                     </div>
                   </div>
                 </div>
               </section>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Federation & Technical Details */}
                  <div className="lg:col-span-12 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shield size={14} /> {t('students.federationInfo')}</h3>
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-8">
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('students.category')}</p>
                         <p className="text-lg font-black text-slate-900 dark:text-white">{student.category || '--'}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('students.weightClass')}</p>
                         <p className="text-lg font-black text-slate-900 dark:text-white">{student.weightClass || '--'} ({student.weight}kg)</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('students.federationId')}</p>
                         <p className="text-lg font-black text-blue-600">{student.federationId || '--'}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('students.lastPromotion')}</p>
                         <p className="text-lg font-black text-slate-900 dark:text-white">{new Date(student.lastPromotionDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-6">
                    {beltAnalysis && (
                      <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> {t('students.beltAnalysis')}</h3>
                        <div className="p-8 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('students.timeInBelt')}</p>
                              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{beltAnalysis.diffMonths} <span className="text-base text-slate-400">/ {beltAnalysis.minTime} {t('common.months')}</span></p>
                            </div>
                            <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${beltAnalysis.isEligible ? 'bg-emerald-100 text-emerald-700 shadow-emerald-100/50 shadow-lg' : 'bg-orange-100 text-orange-700 shadow-orange-100/50 shadow-lg'}`}>
                              {beltAnalysis.isEligible ? t('students.eligible') : t('students.inGracePeriod')}
                            </div>
                          </div>
                          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${beltAnalysis.progress}%` }}
                              className={`h-full transition-all duration-1000 ${beltAnalysis.isEligible ? 'bg-emerald-500' : 'bg-blue-600'} shadow-[0_0_12px_rgba(59,130,246,0.3)]`}
                            />
                          </div>
                          <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                              {beltAnalysis.isEligible 
                                ? 'Status: Aluno apto para avaliação técnica de mudança de faixa/grau.' 
                                : `Faltam aproximadamente ${(beltAnalysis.minTime - beltAnalysis.diffMonths)} meses de carência técnica.`}
                            </p>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="lg:col-span-5">
                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between group h-full relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-10" />
                       <div className="relative z-10">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white/20 rounded-[1.2rem] flex items-center justify-center">
                                <Zap size={24} className="text-white" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Previsão Evolutiva (AI)</p>
                                <p className="text-sm font-black uppercase tracking-tight">Potencial Pró-Atleta</p>
                             </div>
                          </div>
                          <div className="mt-8">
                             <p className="text-sm font-medium leading-relaxed opacity-90 italic">
                               "Baseado na assiduidade de {student.attendanceCount} treinos, o aluno demonstra maturidade acima da média para o tempo de faixa."
                             </p>
                          </div>
                       </div>
                       <button className="relative z-10 w-full mt-10 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                          Gerar Relatório de Evolução
                       </button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-10 rounded-[3rem] border-2 border-dashed text-center space-y-6 ${
                  student.securityAuditStatus === 'Verified' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' :
                  student.securityAuditStatus === 'Compromised' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' :
                  'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30'
                }`}>
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto ${
                    student.securityAuditStatus === 'Verified' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                    student.securityAuditStatus === 'Compromised' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                  }`}><ShieldCheck size={40}/></div>
                  <div>
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${
                      student.securityAuditStatus === 'Verified' ? 'text-emerald-900 dark:text-white' :
                      student.securityAuditStatus === 'Compromised' ? 'text-red-900 dark:text-white' :
                      'text-indigo-900 dark:text-white'
                    }`}>
                      {student.securityAuditStatus === 'Verified' ? t('audit.blockchainVerified') : 
                       student.securityAuditStatus === 'Compromised' ? t('audit.integrityCompromised') : 
                       t('audit.identitySealPending')}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium max-w-md mx-auto mt-2">
                       {student.securityAuditStatus === 'Verified' ? 'Este aluno possui histórico imutável verificado e carimbado na blockchain SYSBJJ.' : 
                        student.securityAuditStatus === 'Compromised' ? 'Foram detectadas inconsistências nos registros deste aluno. Auditoria manual obrigatória.' : 
                        'Aguardando verificação biométrica e documental para carimbo de integridade.'}
                    </p>
                  </div>
                  <div className="flex justify-center gap-4">
                     <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all">
                        {student.securityAuditStatus === 'Verified' ? 'Re-Verificar' : 'Solicitar Verificação'}
                     </button>
                     <button className="px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-800">Ver Ledger</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14}/> {t('audit.forensicLogs')}</p>
                    <div className="space-y-4">
                      {[
                        { action: 'Acesso ao Portal', color: 'bg-emerald-400', date: 'Hoje, 14:20' },
                        { action: 'Upload de Documento', color: 'bg-blue-400', date: 'Ontem, 09:15' },
                        { action: 'Login Suspeito Bloqueado', color: 'bg-red-400', date: '3 dias atrás' }
                      ].map((log, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm group">
                          <div className={`w-3 h-3 rounded-full ${log.color} group-hover:scale-125 transition-transform`} />
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{log.action}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.date}</p>
                          </div>
                          <div className="text-[8px] font-mono text-slate-300 dark:text-slate-600">#hash_{i}f82</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col justify-between border border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-400 mb-4">
                        <ShieldCheck size={24} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Master Seal</span>
                      </div>
                      <h4 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Certificado Digital</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Emissão e Assinatura via Trust-Protocol</p>
                    </div>
                    <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20">
                      <FileCheck size={18} /> {t('audit.downloadCertificate')}
                    </button>
                  </div>
                </div>
             </div>
           )}
          {activeTab === 'videos' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                 <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Galeria de Posições</h3>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Vídeos de técnicas para estudo</p>
                 </div>
                 <button 
                   onClick={() => setShowAddVideo(true)}
                   className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                 >
                   <Plus size={16} /> NOVO VÍDEO
                 </button>
               </div>

               {(!student.positionVideos || student.positionVideos.length === 0) ? (
                 <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                   <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                     <BookOpen size={40} />
                   </div>
                   <h4 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Nenhum vídeo cadastrado</h4>
                   <p className="text-xs text-slate-500 mt-2">Clique em "Novo Vídeo" para começar a tutorar o aluno.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {student.positionVideos.map((video) => (
                     <div key={video.id} className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden group shadow-sm hover:shadow-xl transition-all">
                       <div className="aspect-video bg-black relative">
                          <iframe
                            src={video.videoUrl.includes('youtube.com') ? video.videoUrl.replace('watch?v=', 'embed/') : video.videoUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                       </div>
                       <div className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm leading-tight">{video.title}</h4>
                            <button 
                              onClick={() => {
                                if(confirm('Excluir este vídeo?')) {
                                  const updated = student.positionVideos?.filter(v => v.id !== video.id);
                                  updateStudent(student.id, { positionVideos: updated });
                                }
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed italic">{video.description}</p>
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                             <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[8px] uppercase">
                                 {video.authorName?.[0]}
                               </div>
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{video.authorName}</span>
                             </div>
                             <span className="text-[8px] font-black text-slate-300 uppercase">{video.date}</span>
                          </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               {showAddVideo && (
                 <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                       <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Novo Vídeo</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Adicionar técnica de estudo</p>
                          </div>
                          <button onClick={() => setShowAddVideo(false)} className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                            <X size={20} />
                          </button>
                       </div>
                       <div className="p-8 space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Posição</label>
                             <input 
                               type="text" 
                               value={newVideo.title}
                               onChange={e => setNewVideo({...newVideo, title: e.target.value})}
                               placeholder="Ex: Passagem de Guarda Toureando"
                               className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL do Vídeo (Youtube/Vimeo)</label>
                             <input 
                               type="text" 
                               value={newVideo.videoUrl}
                               onChange={e => setNewVideo({...newVideo, videoUrl: e.target.value})}
                               placeholder="https://www.youtube.com/watch?v=..."
                               className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Breve Descrição / Foco</label>
                             <textarea 
                               value={newVideo.description}
                               onChange={e => setNewVideo({...newVideo, description: e.target.value})}
                               placeholder="Foque na pegada da calça e na pressão do ombro..."
                               className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold min-h-[100px]"
                             />
                          </div>
                          <button 
                            onClick={handleAddPositionVideo}
                            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                          >
                            SALVAR VÍDEO NA GALERIA
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                 <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('common.contract')}</h3>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Contrato de Prestação de Serviços</p>
                 </div>
                 <button 
                   onClick={() => window.print()}
                   className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-all shadow-xl"
                 >
                   <Download size={16} /> GERAR PDF / IMPRIMIR
                 </button>
               </div>

               <div className="p-12 sm:p-20 bg-white dark:bg-white text-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 font-serif leading-relaxed max-w-4xl mx-auto overflow-y-auto max-h-[80vh] scrollbar-hide">
                  <div className="text-center mb-16 space-y-4">
                     <h2 className="text-3xl font-black uppercase tracking-tighter">CONTRATO DE ADESÃO & PRESTAÇÃO DE SERVIÇOS</h2>
                     <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Unidade: {profile.academyName}</p>
                  </div>

                  <div className="space-y-8 text-sm italic">
                    <p>
                      <strong>I. DAS PARTES:</strong> Pelo presente instrumento, a academia <strong>{profile.academyName}</strong>, doravante denominada ACADEMIA, e <strong>{student.name}</strong>, portador do CPF <strong>{student.cpf || '____.____.____-___'}</strong>, doravante denominado ALUNO(A).
                    </p>

                    <p>
                      <strong>II. DO OBJETO:</strong> O presente contrato tem por objeto a prestação de serviços de ensino e treinamento de Jiu-Jitsu Brasileiro (BJJ), conforme a modalidade escolhida e os horários estabelecidos pela ACADEMIA.
                    </p>

                    <p>
                      <strong>III. DO VALOR E PAGAMENTO:</strong> O ALUNO(A) compromete-se ao pagamento da mensalidade no valor de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(student.monthlyValue)}</strong>, com vencimento todo dia <strong>{student.dueDay}</strong> de cada mês.
                    </p>

                    <p>
                      <strong>IV. DA ÉTICA E CONDUTA:</strong> O ALUNO(A) declara estar ciente do código de conduta (OSS!) da academia, comprometendo-se a zelar pela integridade física dos colegas e pela disciplina no tatame.
                    </p>

                    <p>
                      <strong>V. DA LGPD:</strong> O ALUNO(A) autoriza o tratamento de seus dados pessoais para fins exclusivos de gestão administrativa e técnica, conforme a Lei Geral de Proteção de Dados.
                    </p>
                  </div>

                  <div className="mt-24 grid grid-cols-2 gap-20">
                     <div className="border-t border-slate-300 pt-4 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400">Assinatura do Aluno / Responsável</p>
                        <p className="mt-2 font-bold text-xs">{student.name}</p>
                     </div>
                     <div className="border-t border-slate-300 pt-4 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400">Pela Academia</p>
                        <p className="mt-2 font-bold text-xs">{profile.name || 'Diretoria Tática'}</p>
                     </div>
                  </div>

                  <div className="mt-16 text-center">
                     <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">Documento gerado digitalmente via protocolo SYSBJJ Blockchain</p>
                     <p className="text-[8px] font-mono text-slate-300 mt-1">HASH ID: {student.id}-signed-{Date.now()}</p>
                  </div>
               </div>
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
  const { students, schedules } = useData();
  const { profile } = useProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [beltFilter, setBeltFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [activeView, setActiveView] = useState<'adult' | 'kids' | 'competitors' | 'waitlist'>('adult');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const handleExportCSV = () => {
    const headers = ['ID', 'Nome', 'Apelido', 'Email', 'Telefone', 'Faixa', 'Graus', 'Status', 'Mensalidade'];
    const rows = students.map(s => [
      s.id,
      s.name,
      s.nickname || '',
      s.email,
      s.phone,
      s.belt,
      s.stripes,
      s.status,
      s.monthlyValue
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sysbjj_estudantes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isSelectingCompetitors, setIsSelectingCompetitors] = useState(false);

  const [instructorFilter, setInstructorFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const lowerSearch = searchTerm.toLowerCase();
      const name = s?.name || '';
      const nickname = s?.nickname || '';
      
      const isSearchingBelt = ['branca', 'azul', 'roxa', 'marrom', 'preta', 'white', 'blue', 'purple', 'brown', 'black'].some(b => lowerSearch.includes(b));
      const matchesBeltKeyword = isSearchingBelt && s.belt.toLowerCase().includes(lowerSearch);
      
      const isSearchingStatus = ['ativo', 'inativo', 'suspenso', 'active', 'inactive', 'suspended'].some(st => lowerSearch.includes(st));
      const matchesStatusKeyword = isSearchingStatus && s.status.toLowerCase().includes(lowerSearch);

      const nameMatch = name.toLowerCase().includes(lowerSearch);
      const nicknameMatch = nickname.toLowerCase().includes(lowerSearch);
      
      const matchesSearch = nameMatch || nicknameMatch || matchesBeltKeyword || matchesStatusKeyword;
      
      const matchesClass = classFilter === '' || s.classId === classFilter;
      const matchesBelt = beltFilter === '' || s.belt === beltFilter;
      const matchesStatus = statusFilter === '' || s.status === statusFilter;

      // Filter by instructor (matching class instructor)
      const studentClass = schedules.find(sc => sc.id === s.classId);
      const matchesInstructor = instructorFilter === '' || studentClass?.instructor === instructorFilter;
      
      if (activeView === 'competitors') return matchesSearch && s.isCompetitor && matchesClass && matchesBelt && matchesStatus && matchesInstructor;
      if (activeView === 'waitlist') return matchesSearch && s.status === StudentStatus.WAITLIST && matchesClass && matchesBelt && matchesInstructor;
      const matchesView = activeView === 'kids' ? s.isKid : !s.isKid;
      return matchesSearch && matchesView && matchesClass && matchesBelt && matchesStatus && matchesInstructor;
    });
  }, [searchTerm, students, activeView, classFilter, beltFilter, statusFilter, instructorFilter, schedules]);

  const uniqueInstructors = useMemo(() => {
    const insts = new Set<string>();
    schedules.forEach(s => {
      if (s.instructor) insts.add(s.instructor);
    });
    return Array.from(insts);
  }, [schedules]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 w-full animate-in fade-in duration-700 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('students.title')}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <p className="text-slate-500 font-bold italic text-xs opacity-70 tracking-widest uppercase">{filteredStudents.length} Alunos sob sua guarda</p>
          </div>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center w-full lg:w-auto">
          {activeView === 'competitors' && (
            <button 
              onClick={() => setIsSelectingCompetitors(true)} 
              className="flex-1 lg:flex-none px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">{t('students.selectCompetitors')}</span>
            </button>
          )}
          <div className="relative group flex-[2] lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t('students.searchPlaceholder')} 
              className="w-full pl-12 pr-6 py-3.5 bg-slate-100/50 dark:bg-slate-800 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shadow-xl">
             <button 
               onClick={() => setViewMode('table')}
               className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
             >
               <LayoutList size={20} />
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
             >
               <Plus size={20} className="rotate-45" /> {/* Using Plus as a grid-like icon placeholder if Grid not imported, though Lucide has Grid */}
             </button>
          </div>

          <button 
            onClick={handleExportCSV}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-50 transition-all shadow-xl active:scale-95"
            title="Exportar CSV"
          >
            <Download size={24} />
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="p-4 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-all shadow-xl active:scale-95 group"
            title="Sincronizar Manualmente"
          >
            <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
          </button>
          <button 
            onClick={() => setIsAddingStudent(true)} 
            className={`p-4 text-white rounded-2xl hover:rotate-6 transition-all shadow-2xl active:scale-95 ${activeView === 'kids' ? 'bg-yellow-500 shadow-yellow-500/30' : 'bg-blue-600 shadow-blue-500/30'}`}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full">
        <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl w-full lg:max-w-md shadow-sm border border-slate-100 dark:border-slate-700">
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
          <button 
            onClick={() => setActiveView('waitlist')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'waitlist' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            <Clock size={14}/> {t('status.Waitlist')}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <select 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white appearance-none"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">{t('common.allClasses') || 'Todas as Turmas'}</option>
              {schedules.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[140px]">
             <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
             <select 
               className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white appearance-none"
               value={instructorFilter}
               onChange={(e) => setInstructorFilter(e.target.value)}
             >
               <option value="">Professores</option>
               {uniqueInstructors.map(inst => (
                 <option key={inst} value={inst}>{inst}</option>
               ))}
             </select>
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <Medal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <select 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white appearance-none"
              value={beltFilter}
              onChange={(e) => setBeltFilter(e.target.value)}
            >
              <option value="">{t('common.allBelts') || 'Todas as Faixas'}</option>
              {Object.keys(BELT_COLORS).map((belt) => (
                 <option key={belt} value={belt}>{belt}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <select 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StudentStatus)}
            >
              <option value="">Status</option>
              {Object.values(StudentStatus).map(status => (
                <option key={status} value={status}>{t(`status.${status}`)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Desktop View Table */}
          <div className="hidden lg:block overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            <table className="w-full text-left border-collapse lg:min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('common.name')}</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('students.currentBelt')}</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{activeView === 'waitlist' ? 'Fila / Rank' : 'Status / Mestria'}</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Frequência</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                <AnimatePresence mode='popLayout'>
                  {filteredStudents.map((student, idx) => (
                    <motion.tr 
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group" 
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black transition-all group-hover:rotate-12 shrink-0 overflow-hidden ${student.isKid ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                            ) : (
                              (student?.name || '?')[0]
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-900 dark:text-white text-base tracking-tighter uppercase leading-none truncate group-hover:text-blue-600 transition-colors">{student.name}</p>
                              {student.isCompetitor && <Medal size={12} className="text-blue-600 shrink-0" />}
                            </div>
                            {student.nickname && <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mt-0.5 italic truncate">"{student.nickname}"</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border whitespace-nowrap ${BELT_COLORS[student.belt] || 'bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                          {t(`belts.${student.belt}`)}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                              student.status === StudentStatus.ACTIVE ? 'bg-green-100 text-green-700' : 
                              student.status === StudentStatus.OVERDUE ? 'bg-red-100 text-red-700' : 
                              student.status === StudentStatus.WAITLIST ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {t(`status.${student.status}`)}
                              {student.status === StudentStatus.WAITLIST && student.waitlistRank && ` #${student.waitlistRank}`}
                            </span>
                            <div className="flex items-center gap-1">
                              <Shield size={10} className="text-blue-500" />
                              <span className="text-[10px] font-black text-blue-600">{student.rulesKnowledge || 0}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-60">
                            <Medal size={10} className="text-yellow-500" />
                            <span className="text-[8px] font-black tabular-nums tracking-widest uppercase">{student.rewardPoints || 0} PTS MÉRITO</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <p className="font-black text-lg leading-none dark:text-white tabular-nums">{student.attendanceCount || 0}</p>
                        <p className="text-[7px] uppercase font-bold text-slate-400 mt-0.5 tracking-widest">{t('students.totalClasses')}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <MoreVertical size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors ml-auto" />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Mobile View remains unchanged but integrated into this logic */}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredStudents.map((student, idx) => (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedStudent(student)}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl group hover:border-blue-600 transition-all cursor-pointer flex flex-col items-center text-center space-y-4"
              >
                <div className="relative">
                  <div className={`w-28 h-28 rounded-3xl p-1 shrink-0 ${BELT_COLORS[student.belt]?.includes('bg-white') ? 'bg-slate-200' : BELT_COLORS[student.belt]?.split(' ')[0]}`}>
                    <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 overflow-hidden relative">
                      {student.photoUrl ? (
                         <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-4xl text-slate-300">
                           {student.name[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  {student.isCompetitor && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                      <Medal size={16} />
                    </div>
                  )}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700 shadow-md">
                     {[...Array(4)].map((_, i) => (
                       <div key={i} className={`w-1.5 h-3 rounded-sm ${i < (student.stripes || 0) ? (student.belt === 'Black' ? 'bg-red-600' : 'bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]') : 'bg-slate-100 dark:bg-slate-700'}`} />
                     ))}
                  </div>
                </div>

                <div className="w-full">
                   <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors uppercase">{student.name}</h3>
                   {student.nickname && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">"{student.nickname}"</p>}
                </div>

                <div className="w-full grid grid-cols-2 gap-3 pt-2">
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequência</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{student.attendanceCount || 0}</p>
                   </div>
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Mestria</p>
                      <p className="text-lg font-black text-blue-600 tabular-nums">{student.rulesKnowledge || 0}%</p>
                   </div>
                </div>

                <div className="w-full pt-2 flex items-center justify-between">
                   <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     student.status === StudentStatus.ACTIVE ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 
                     student.status === StudentStatus.OVERDUE ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 
                     'bg-slate-200 text-slate-600'
                   }`}>
                     {t(`status.${student.status}`)}
                   </span>
                   <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Zap size={14} className="text-yellow-500" />
                      {student.rewardPoints || 0}
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
          <AnimatePresence mode='popLayout'>
            {filteredStudents.map((student, idx) => (
              <motion.div 
                key={student.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.02 }}
                className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group active:bg-slate-100 dark:active:bg-slate-800"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all group-hover:rotate-6 shrink-0 overflow-hidden ${student.isKid ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                      ) : (
                        <span className="text-xl">{(student?.name || '?')[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900 dark:text-white text-base tracking-tight uppercase leading-none truncate uppercase">{student.name}</p>
                        {student.isCompetitor && <Medal size={14} className="text-blue-600 shrink-0" />}
                      </div>
                      {student.nickname && <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black mt-1 italic">"{student.nickname}"</p>}
                    </div>
                  </div>
                  <MoreVertical size={18} className="text-slate-300" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border ${BELT_COLORS[student.belt] || 'bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                    {t(`belts.${student.belt}`)}
                  </span>
                  
                  {activeView === 'kids' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                      <Medal size={12} className="text-yellow-600" />
                      <span className="font-black text-yellow-700 dark:text-yellow-500 text-[9px] uppercase tracking-wider">{student.rewardPoints || 0} OSS PTS</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm border ${
                        student.status === StudentStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900/30' : 
                        student.status === StudentStatus.OVERDUE ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-900/30' : 
                        student.status === StudentStatus.WAITLIST ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/30' :
                        'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                      }`}>
                        {t(`status.${student.status}`)}
                        {student.status === StudentStatus.WAITLIST && student.waitlistRank && ` #${student.waitlistRank}`}
                      </span>
                      {!student.liabilityWaiverAccepted && <ShieldAlert size={14} className="text-amber-500" />}
                      {(!student.medicalCertificateUrl || (student.medicalCertificateExpiration && new Date(student.medicalCertificateExpiration) < new Date())) && (
                        <FileWarning size={14} className="text-rose-500" />
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <p className="text-[10px] font-black dark:text-white tabular-nums">{student.attendanceCount || 0}</p>
                    <p className="text-[8px] uppercase font-bold text-slate-400">{t('students.totalClasses')}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredStudents.length === 0 && (
          <div className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">
            {t('students.noStudents')}
          </div>
        )}
      
      {selectedStudent && <StudentDetailsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
      {isAddingStudent && <NewStudentModal defaultIsKid={activeView === 'kids'} onClose={() => setIsAddingStudent(false)} />}
      {isSelectingCompetitors && <CompetitorSelectorModal onClose={() => setIsSelectingCompetitors(false)} />}
    </div>
  );
};

export default Students;
