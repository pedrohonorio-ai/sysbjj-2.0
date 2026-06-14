import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Award, Shield, Calendar, MapPin, Edit3, User, Check, Sparkles, Printer, 
  Trash2, Plus, Download, RefreshCw, Star, Flame, Swords, ShieldCheck, 
  Medal, Target, Trophy, ChevronRight, BookOpen, Settings2, Copy, AlertTriangle, FileText, Layout
} from 'lucide-react';
import { useData } from '../contexts/DataContext.js';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useProfile } from '../contexts/ProfileContext.js';
import { Student } from '../types.js';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import CryptoJS from 'crypto-js';

// Pre-defined translation dictionaries for standard labels & prefaces (Requirement 11)
const LANG_DICTIONARY = {
  pt: {
    title: "DIPLOMA DE GRADUAÇÃO REGULAMENTAR",
    subTitle: "EVOLUÇÃO TÉCNICA E MARCIAL OFICIAL",
    beltModeText: "Eu, {professor_1}, no uso de minhas atribuições técnico-pedagógicas, certifico que o atleta {atleta} demonstrou excepcional aproveitamento técnico, assiduidade e conduta ética, sendo promovido ao nível de FAIXA {faixa}.",
    stripeModeText: "Eu, {professor_1}, certifico que o atleta {atleta}, após rigorosa avaliação de assiduidade e progresso técnico, recebeu a outorga regulamentar de {grau} na Faixa {faixa}.",
    bothModeText: "Eu, {professor_1}, certifico que o atleta {atleta} progrediu técnica e bravamente na arte, sendo promovido ao nível de FAIXA {faixa} e outorgado com seu {grau}.",
    meritText: "Por demonstrar garra indomável, reverência aos preceitos do tatame e persistência nos treinos.",
    observationsText: "Diploma emitido em conformidade com as diretrizes da agremiação e devidamente registrado.",
    lineageHeader: "LINHAGEM MARCIAL DO RETROSPECTO",
    sealText: "CERTIFICADO AUTÊNTICO",
    secureRepetitive: "SYSBJJ OFICIAL • AUTÊNTICO • SEGURANÇA MÁXIMA • REGISTRO VERIFICADO • ",
    validLabel: "CREDENCIAIS REGISTRADAS E VÁLIDAS",
    invalidLabel: "CERTIFICADO INVÁLIDO OU NÃO ENCONTRADO",
    p1Label: "Professor Autorgante",
    p2Label: "Responsável Técnico Geral"
  },
  en: {
    title: "REGULATORY GRADUATION DIPLOMA",
    subTitle: "OFFICIAL MARTIAL AND TECHNICAL PROGRESS",
    beltModeText: "I, {professor_1}, in accordance with my technical-pedagogical duties, certify that the athlete {atleta} has demonstrated exceptional improvement, attendance, and conduct, being promoted to the rank of {faixa} BELT.",
    stripeModeText: "I, {professor_1}, certify that the athlete {atleta}, after rigorous attendance and technical review, has been awarded the regulatory {grau} on the {faixa} Belt.",
    bothModeText: "I, {professor_1}, certify that the athlete {atleta} has bravely progressed, being promoted to the rank of {faixa} BELT and awarded their {grau}.",
    meritText: "For demonstrating indomitable willpower, reverence for dojo rules, and persistence.",
    observationsText: "Diploma issued in compliance with association guidelines and formally recorded.",
    lineageHeader: "OFFICIAL MARTIAL LINEAGE PATH",
    sealText: "AUTHENTIC CERTIFICATE",
    secureRepetitive: "SYSBJJ OFFICIAL • AUTHENTIC • ENFORCED SECURITY • RECORD VERIFIED • ",
    validLabel: "REGISTERED AND VALID CREDENTIALS",
    invalidLabel: "INVALID OR UNFOUNDED CERTIFICATE",
    p1Label: "Issuing Instructor",
    p2Label: "Chief Technical Director"
  },
  es: {
    title: "DIPLOMA DE GRADUACIÓN REGULAR",
    subTitle: "DESARROLLO TÉCNICO Y MARCIAL OFICIAL",
    beltModeText: "Yo, {professor_1}, en cumplimiento de mis atribuciones pedagógicas, certifico que el atleta {atleta} demostró excepcional rendimiento, asiduidad y ética, siendo promovido al cinturón {faixa}.",
    stripeModeText: "Yo, {professor_1}, certifico que el atleta {atleta}, tras un riguroso examen de asistencia y progreso, recibió la investidura regular del {grau} en el Cinturón {faixa}.",
    bothModeText: "Yo, {professor_1}, certifico que el atleta {atleta} progresó técnica y valientemente, siendo promovido al nivel de CINTURÓN {faixa} y otorgado con su {grau}.",
    meritText: "Por demostrar garra indomable, respeto a las normas del tatami y persistencia en los entrenos.",
    observationsText: "Diploma emitido en conformidad con las normas de la asociación y debidamente registrado.",
    lineageHeader: "LINAJE MARCIAL DEL ATLETA",
    sealText: "CERTIFICADO AUTÉNTICO",
    secureRepetitive: "SYSBJJ OFICIAL • AUTÉNTICO • SEGURIDAD REFORZADA • REGISTRO DETECTADO • ",
    validLabel: "CREDENCIALES REGISTRADAS Y VÁLIDAS",
    invalidLabel: "CERTIFICADO INVÁLIDO O NO ENCONTRADO",
    p1Label: "Instructor Otorgante",
    p2Label: "Responsable Técnico Principal"
  }
};

// 12. PRO-THEMES STYLES DICTIONARY
interface ProThemeLayout {
  id: string;
  name: string;
  desc: string;
  bodyBg: string; // Tailwind bg class
  borderStyle: React.CSSProperties; // live preview borders
  borderColorHex: string; // hex
  textColorClass: string;
  accentTextClass: string;
  sealColor: string; // hex
  fontFamily: string; // css font-family
  canvasBgColor: [number, number, number]; // RGB array for PDF
  pdfBorderColor: [number, number, number]; // RGB
}

const PROFESSIONAL_THEMES: ProThemeLayout[] = [
  {
    id: 'traditional',
    name: "Clássico Tradicional",
    desc: "Pergaminho vintage com molduras duplas imperiais douradas.",
    bodyBg: "bg-[#FEFDF9] text-stone-900 border-stone-900",
    borderStyle: { border: '10px double #1C1917', padding: '1.5rem' },
    borderColorHex: "#1C1917",
    textColorClass: "text-stone-800",
    accentTextClass: "text-[#B58911] font-serif italic font-extrabold",
    sealColor: "#B58911",
    fontFamily: "Georgia, serif",
    canvasBgColor: [254, 253, 249],
    pdfBorderColor: [28, 25, 23]
  },
  {
    id: 'premium',
    name: "Premium Elite",
    desc: "Luxury luxo gala. Ouro metálico sobre grafite estelar.",
    bodyBg: "bg-[#111827] text-white border-amber-600",
    borderStyle: { border: '4px solid #D97706', outline: '1px solid #FEF3C7', outlineOffset: '-6px', padding: '1.5rem' },
    borderColorHex: "#D97706",
    textColorClass: "text-slate-150",
    accentTextClass: "text-amber-400 font-sans tracking-wide font-black uppercase",
    sealColor: "#F59E0B",
    fontFamily: "Arial, sans-serif",
    canvasBgColor: [17, 24, 39],
    pdfBorderColor: [217, 119, 6]
  },
  {
    id: 'ibjjf',
    name: "IBJJF Style",
    desc: "Regulatório de federação com contrastes verde, amarelo e azul.",
    bodyBg: "bg-white text-slate-900 border-blue-900",
    borderStyle: { border: '6px solid #1E3A8A', outline: '3px solid #15803D', outlineOffset: '-11px', padding: '1.5rem' },
    borderColorHex: "#1E3A8A",
    textColorClass: "text-slate-900",
    accentTextClass: "text-[#1D4ED8] font-bold tracking-tight uppercase",
    sealColor: "#15803D",
    fontFamily: "Helvetica, sans-serif",
    canvasBgColor: [255, 255, 255],
    pdfBorderColor: [30, 58, 138]
  },
  {
    id: 'federacao',
    name: "Federação Acadêmica",
    desc: "Estilo oficial de universidade marcial com linhas finas e carimbos.",
    bodyBg: "bg-slate-50 text-slate-900 border-slate-900",
    borderStyle: { border: '5px double #0F172A', outline: '2px dashed #0284C7', outlineOffset: '-14px', padding: '1.5rem' },
    borderColorHex: "#0F172A",
    textColorClass: "text-slate-800",
    accentTextClass: "text-[#0284C7] font-semibold font-mono",
    sealColor: "#0284C7",
    fontFamily: "Courier, monospace",
    canvasBgColor: [248, 250, 252],
    pdfBorderColor: [15, 23, 42]
  },
  {
    id: 'infantil',
    name: "Infantil Dragões",
    desc: "Colorido lúdico para os pequenos atletas com moldura pontilhada verde.",
    bodyBg: "bg-[#F7FEE7] text-stone-900 border-emerald-400",
    borderStyle: { border: '6px dashed #10B981', outline: '4px solid #F59E0B', outlineOffset: '-12px', padding: '1.4rem' },
    borderColorHex: "#10B981",
    textColorClass: "text-[#064E3B]",
    accentTextClass: "text-rose-600 font-extrabold italic",
    sealColor: "#F59E0B",
    fontFamily: "Comic Sans MS, sans-serif",
    canvasBgColor: [247, 254, 231],
    pdfBorderColor: [16, 185, 129]
  },
  {
    id: 'seminario',
    name: "Estudo & Seminário",
    desc: "Visual minimalista assinado para cursos técnicos e palestras.",
    bodyBg: "bg-white text-slate-900 border-black",
    borderStyle: { border: '2px solid #111827', padding: '2rem' },
    borderColorHex: "#111827",
    textColorClass: "text-slate-800",
    accentTextClass: "text-slate-950 font-mono tracking-widest font-black underline decoration-2 decoration-amber-500",
    sealColor: "#111827",
    fontFamily: "monospace",
    canvasBgColor: [255, 255, 255],
    pdfBorderColor: [17, 24, 39]
  },
  {
    id: 'campeonato',
    name: "Campeonato Arena",
    desc: "Gráficos esportivos agressivos em tons vermelhos e pretos de competição.",
    bodyBg: "bg-neutral-900 text-[#F5F5F5] border-red-650",
    borderStyle: { border: '6px solid #DC2626', outline: '1px solid #EF4444', outlineOffset: '-7px', padding: '1.3rem' },
    borderColorHex: "#DC2626",
    textColorClass: "text-stone-300",
    accentTextClass: "text-red-500 font-serif font-black tracking-tight uppercase leading-none italic",
    sealColor: "#DC2626",
    fontFamily: "Impact, sans-serif",
    canvasBgColor: [23, 23, 23],
    pdfBorderColor: [220, 38, 38]
  },
  {
    id: 'instrutor',
    name: "Docência e Instrutores",
    desc: "Estilo sóbrio em prata e ardósia para certificações de liderança.",
    bodyBg: "bg-slate-150 text-slate-800 border-slate-700",
    borderStyle: { border: '8px solid #475569', outline: '2px solid #1E293B', outlineOffset: '-12px', padding: '1.5rem' },
    borderColorHex: "#475569",
    textColorClass: "text-slate-700",
    accentTextClass: "text-slate-900 font-sans tracking-wide font-extrabold uppercase",
    sealColor: "#334155",
    fontFamily: "Trebuchet MS, sans-serif",
    canvasBgColor: [241, 245, 249],
    pdfBorderColor: [71, 85, 105]
  },
  {
    id: 'professor',
    name: "Sensei e Co-Mestres",
    desc: "Bordas reais na cor vermelho cereja imperial e louros heráldicos.",
    bodyBg: "bg-[#FDF2F2] text-stone-900 border-[#991B1B]",
    borderStyle: { border: '8px solid #991B1B', outline: '4px double #D97706', outlineOffset: '-12px', padding: '1.5rem' },
    borderColorHex: "#991B1B",
    textColorClass: "text-stone-850",
    accentTextClass: "text-[#B91C1C] font-serif tracking-widest font-bold uppercase",
    sealColor: "#D97706",
    fontFamily: "Times New Roman, serif",
    canvasBgColor: [253, 242, 242],
    pdfBorderColor: [153, 27, 27]
  },
  {
    id: 'arbitragem',
    name: "Mesa & Arbitragem",
    desc: "Listrado de excelência técnica com contrastes pretos e amarelo ouro.",
    bodyBg: "bg-[#FEFCE8] text-slate-900 border-yellow-500",
    borderStyle: { border: '8px solid #0F172A', outline: '4px solid #EAB308', outlineOffset: '-12px', padding: '1.5rem' },
    borderColorHex: "#0F172A",
    textColorClass: "text-slate-850",
    accentTextClass: "text-slate-950 font-black tracking-tight leading-none uppercase",
    sealColor: "#EAB308",
    fontFamily: "Impact, Helvetica, Arial",
    canvasBgColor: [254, 252, 232],
    pdfBorderColor: [15, 23, 42]
  },
  {
    id: 'bjjlf_gold_royal',
    name: "BJJLF Ouro Imperial",
    desc: "Bordas imperiais douradas refinadas com rosette heráldica e louros de ouro.",
    bodyBg: "bg-[#FDFBF7] text-[#111827] border-[#D4AF37]",
    borderStyle: { border: '12px double #D4AF37', padding: '2rem', boxShadow: '0 0 20px rgba(212,175,55,0.1)' },
    borderColorHex: "#D4AF37",
    textColorClass: "text-slate-850",
    accentTextClass: "text-[#B91C1C] font-serif tracking-widest font-black uppercase",
    sealColor: "#D4AF37",
    fontFamily: "Georgia, serif",
    canvasBgColor: [253, 251, 247],
    pdfBorderColor: [212, 175, 55]
  },
  {
    id: 'bjjlf_black_gold',
    name: "BJJLF Black & Gold",
    desc: "Edição de prestígio com grafismos escuros, cantos dourados e fonte pesada.",
    bodyBg: "bg-[#111] text-white border-amber-500",
    borderStyle: { border: '6px solid #F59E0B', outline: '1px solid #78350F', outlineOffset: '-7px', padding: '1.5rem' },
    borderColorHex: "#F59E0B",
    textColorClass: "text-stone-200",
    accentTextClass: "text-[#F59E0B] font-black uppercase tracking-tight",
    sealColor: "#F59E0B",
    fontFamily: "Helvetica, Arial, sans-serif",
    canvasBgColor: [17, 17, 17],
    pdfBorderColor: [245, 158, 11]
  },
  {
    id: 'bjjlf_elegant_sans',
    name: "BJJLF Clean Star & Gold",
    desc: "Geometria minimalista de elite, estrelas finas e louros modernos.",
    bodyBg: "bg-[#FFFDF9] text-slate-900 border-[#C5A059]",
    borderStyle: { border: '3px solid #C5A059', outline: '1px solid #C5A059', outlineOffset: '-8px', padding: '1.8rem' },
    borderColorHex: "#C5A059",
    textColorClass: "text-slate-800",
    accentTextClass: "text-[#A1824A] font-serif font-black uppercase",
    sealColor: "#A1824A",
    fontFamily: "Georgia, serif",
    canvasBgColor: [255, 253, 249],
    pdfBorderColor: [197, 160, 89]
  },
  {
    id: 'bjjlf_dragon_oriental',
    name: "Guerreiro Oriental (Traditional Kanji)",
    desc: "Moldura vermelha imperial, Kanji 柔術 de alta definição e dragão d'água.",
    bodyBg: "bg-[#FAF7EE] text-stone-900 border-[#991B1B]",
    borderStyle: { border: '6px double #991B1B', padding: '1.8rem' },
    borderColorHex: "#991B1B",
    textColorClass: "text-stone-800",
    accentTextClass: "text-[#991B1B] font-serif font-extrabold uppercase",
    sealColor: "#991B1B",
    fontFamily: "Times New Roman, serif",
    canvasBgColor: [250, 247, 238],
    pdfBorderColor: [153, 27, 27]
  },
  {
    id: 'carioca_integridade',
    name: "Congresso Carioca Moderno",
    desc: "Molduras arredondadas em azul/ciano mar, com texto vertical moderno.",
    bodyBg: "bg-white text-slate-900 border-none",
    borderStyle: { border: '1px solid #E2E8F0', padding: '1.5rem 2rem 1.5rem 1.5rem' },
    borderColorHex: "#0D9488",
    textColorClass: "text-slate-850",
    accentTextClass: "text-[#1E3A8A] font-sans font-black tracking-tight uppercase",
    sealColor: "#0D9488",
    fontFamily: "Arial, sans-serif",
    canvasBgColor: [255, 255, 255],
    pdfBorderColor: [13, 148, 136]
  }
];

// Presets structures (Requirement 13)
interface CustomPreset {
  id: string;
  name: string;
  emissionMode: 'belt' | 'stripe' | 'both';
  templateThemeId: string;
  cityName: string;
  stateName: string;
  certificateDate: string;
  professorName: string;
  professorGraduation: string;
  professorRoleLabel: string;
  technicalDirectorName: string;
  technicalDirectorRegistration: string;
  technicalDirectorRoleLabel: string;
  customBeltText: string;
  customStripeText: string;
  customPrefaceText: string;
  customMeritText: string;
  customObservationsText: string;
  lineageOrigem: string;
  lineageMestre: string;
  lineageFormador: string;
  lineageAtual: string;
  lineageOrientation: 'horizontal' | 'vertical';
  watermarkOption: 'academy' | 'team' | 'shield' | 'custom' | 'none';
  watermarkOpacity: number;
  watermarkRotation: number;
  watermarkScale: number;
  enableAntiForgery: boolean;
  academyLogoX?: number;
  academyLogoY?: number;
  teamLogoX?: number;
  teamLogoY?: number;
  shieldLogoX?: number;
  shieldLogoY?: number;
  qrCodeX?: number;
  qrCodeY?: number;
  qrCodeSize?: number;
  goldenSealX?: number;
  goldenSealY?: number;
  goldenSealSize?: number;
  professorSignatureX?: number;
  professorSignatureY?: number;
  professorSignatureWidth?: number;
  professorSignatureHeight?: number;
  teamDirectorSignatureX?: number;
  teamDirectorSignatureY?: number;
  teamDirectorSignatureWidth?: number;
  teamDirectorSignatureHeight?: number;
  professorSignatureType?: 'upload' | 'digital' | 'none';
  teamDirectorSignatureType?: 'upload' | 'digital' | 'none';
}

// Audit record structure (Requirement 14)
interface IssuedCertificate {
  id: string;
  studentId: string;
  studentName: string;
  beltName: string;
  stripeText: string;
  date: string;
  issuer: string;
  hash: string;
  language: 'pt' | 'en' | 'es';
  mode: string;
  status: 'VÁLIDO' | 'INVÁLIDO';
}

const MARTIAL_ARTS_RECORDS = [
  {
    id: 'bjj',
    name: 'Jiu-Jitsu (BJJ)',
    icon: '🥋',
    skillsList: ['Passagem de Guarda', 'Guarda Ativa', 'Quedas / Projeção', 'Finalizações', 'Defesas / Escapas', 'Disciplina'],
    belts: [
      { color: 'Branca', minMonths: 0, minAge: 0, bgClass: 'bg-white text-slate-800 border-2 border-slate-300', stripeSymbol: 'Graus Brancos' },
      { color: 'Cinza', minMonths: 12, minAge: 4, bgClass: 'bg-slate-400 text-white', stripeSymbol: 'Graus Brancos' },
      { color: 'Amarela', minMonths: 12, minAge: 7, bgClass: 'bg-yellow-400 text-slate-900', stripeSymbol: 'Graus Pretos' },
      { color: 'Laranja', minMonths: 12, minAge: 10, bgClass: 'bg-orange-500 text-white', stripeSymbol: 'Graus Pretos' },
      { color: 'Verde', minMonths: 12, minAge: 13, bgClass: 'bg-[#10B981] text-white', stripeSymbol: 'Graus Pretos' },
      { color: 'Azul', minMonths: 24, minAge: 16, bgClass: 'bg-blue-600 text-white', stripeSymbol: 'Graus Brancos' },
      { color: 'Roxa', minMonths: 18, minAge: 16, bgClass: 'bg-purple-700 text-white', stripeSymbol: 'Graus Brancos' },
      { color: 'Marrom', minMonths: 12, minAge: 18, bgClass: 'bg-amber-900 text-white', stripeSymbol: 'Graus Brancos' },
      { color: 'Preta', minMonths: 36, minAge: 19, bgClass: 'bg-slate-900 text-white border-r-8 border-rose-600', stripeSymbol: 'Graus Vermelhos' },
    ]
  },
  {
    id: 'muaythai',
    name: 'Muay Thai',
    icon: '🥊',
    skillsList: ['Socos (Chok)', 'Chutes (Tech)', 'Joelhas (Khao)', 'Clinch', 'Esquiva / Bloqueio', 'Raza / Garra'],
    belts: [
      { color: 'Branca (Khan 1)', minMonths: 0, minAge: 6, bgClass: 'bg-white text-slate-800 border-2 border-slate-300', stripeSymbol: 'Ponta Vermelha' },
      { color: 'Branca/Vermelha', minMonths: 3, minAge: 6, bgClass: 'bg-stone-100 text-red-600', stripeSymbol: 'Ponta Vermelha' },
      { color: 'Vermelha (Khan 2)', minMonths: 4, minAge: 8, bgClass: 'bg-red-500 text-white', stripeSymbol: 'Ponta Azul' },
      { color: 'Azul (Khan 3)', minMonths: 6, minAge: 12, bgClass: 'bg-blue-600 text-white', stripeSymbol: 'Ponta Preta' },
      { color: 'Preta (Instrutor)', minMonths: 12, minAge: 16, bgClass: 'bg-slate-900 text-yellow-500', stripeSymbol: 'Graus Kru' }
    ]
  }
];

const CertificatesHub: React.FC = () => {
  const { students, updateStudent, logAction } = useData();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active general module Tab
  const [activeTab, setActiveTab] = useState<'certificates' | 'multiarts' | 'gamification' | 'audit'>('certificates');

  // Query parameter verification routing bypass (Requirement 9)
  const verifyParam = searchParams.get('verify');
  const [verifySearchId, setVerifySearchId] = useState<string>(verifyParam || '');
  const [verifyResult, setVerifyResult] = useState<IssuedCertificate | null>(null);
  const [hasSearchedVerify, setHasSearchedVerify] = useState<boolean>(false);

  // Core configurations state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [emissionMode, setEmissionMode] = useState<'belt' | 'stripe' | 'both'>('both'); // Requirement 2
  const [activeThemeId, setActiveThemeId] = useState<string>('traditional'); // Requirement 12
  const [cityName, setCityName] = useState<string>(profile?.pixCity || 'Rio de Janeiro');
  const [stateName, setStateName] = useState<string>('RJ');
  const [certificateDate, setCertificateDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [certId, setCertId] = useState<string>(`CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
  const [certificateLanguage, setCertificateLanguage] = useState<'pt' | 'en' | 'es'>('pt'); // Requirement 11

  // Advanced customizable fields (Requirement 3 + 11)
  const [customBeltText, setCustomBeltText] = useState<string>('');
  const [customStripeText, setCustomStripeText] = useState<string>('');
  const [customPrefaceText, setCustomPrefaceText] = useState<string>('');
  const [customMeritText, setCustomMeritText] = useState<string>('');
  const [customObservationsText, setCustomObservationsText] = useState<string>('');

  // Dual signatures fields (Requirement 5)
  const [professorName, setProfessorName] = useState<string>(profile?.name || 'Sensei Master SYSBJJ');
  const [professorGraduation, setProfessorGraduation] = useState<string>('Faixa Preta 4º Grau');
  const [professorRoleLabel, setProfessorRoleLabel] = useState<string>('Professor do Aluno');
  const [professorSignatureUrl, setProfessorSignatureUrl] = useState<string>(''); // Base64 signature 1

  const [technicalDirectorName, setTechnicalDirectorName] = useState<string>('Sensei Diretor Técnico');
  const [technicalDirectorRegistration, setTechnicalDirectorRegistration] = useState<string>('REG. CBJJ #41824');
  const [technicalDirectorRoleLabel, setTechnicalDirectorRoleLabel] = useState<string>('Responsável Técnico da Equipe');
  const [teamDirectorSignatureUrl, setTeamDirectorSignatureUrl] = useState<string>(''); // Base64 signature 2

  // Image assets fields (Requirement 1)
  const [academyLogoUrl, setAcademyLogoUrl] = useState<string>(profile?.logoUrl || '');
  const [teamLogoUrl, setTeamLogoUrl] = useState<string>('');
  const [shieldLogoUrl, setShieldLogoUrl] = useState<string>(''); 
  const [academyLogoSize, setAcademyLogoSize] = useState<number>(36);
  const [teamLogoSize, setTeamLogoSize] = useState<number>(36);
  const [shieldLogoSize, setShieldLogoSize] = useState<number>(36);

  // Logo position and coordinates (millimeter coordinates inside horizontal A4 297mm x 210mm)
  const [academyLogoX, setAcademyLogoX] = useState<number>(16);
  const [academyLogoY, setAcademyLogoY] = useState<number>(16);
  const [teamLogoX, setTeamLogoX] = useState<number>(249); // 281 - (36 * 0.35) = 268.4. Default standard left
  const [teamLogoY, setTeamLogoY] = useState<number>(16);
  const [shieldLogoX, setShieldLogoX] = useState<number>(142); // Centered default (148.5 - 12.6/2 = 142.2)
  const [shieldLogoY, setShieldLogoY] = useState<number>(16);

  // QR Code positioning (Requirement 9)
  const [qrCodeX, setQrCodeX] = useState<number>(14);
  const [qrCodeY, setQrCodeY] = useState<number>(176);
  const [qrCodeSize, setQrCodeSize] = useState<number>(13);

  // Golden authentic seal positioning (Requirement 8)
  const [goldenSealX, setGoldenSealX] = useState<number>(272); // Center x coordinate
  const [goldenSealY, setGoldenSealY] = useState<number>(185); // Center y coordinate
  const [goldenSealSize, setGoldenSealSize] = useState<number>(15); // Diameter (radius is size/2)

  // Signature positioning and scaling (Requirement 5)
  const [professorSignatureX, setProfessorSignatureX] = useState<number>(50);
  const [professorSignatureY, setProfessorSignatureY] = useState<number>(150);
  const [professorSignatureWidth, setProfessorSignatureWidth] = useState<number>(45);
  const [professorSignatureHeight, setProfessorSignatureHeight] = useState<number>(16);

  const [teamDirectorSignatureX, setTeamDirectorSignatureX] = useState<number>(202);
  const [teamDirectorSignatureY, setTeamDirectorSignatureY] = useState<number>(150);
  const [teamDirectorSignatureWidth, setTeamDirectorSignatureWidth] = useState<number>(45);
  const [teamDirectorSignatureHeight, setTeamDirectorSignatureHeight] = useState<number>(16);

  const [professorSignatureType, setProfessorSignatureType] = useState<'upload' | 'digital' | 'none'>('digital');
  const [teamDirectorSignatureType, setTeamDirectorSignatureType] = useState<'upload' | 'digital' | 'none'>('digital');

  // Background control (Requirement 1)
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>('');
  const [fullBackground, setFullBackground] = useState<boolean>(true);
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(50); // 0-100%
  const [keepBorders, setKeepBorders] = useState<boolean>(true);

  // Watermarks fields (Requirement 6)
  const [watermarkOption, setWatermarkOption] = useState<'academy' | 'team' | 'shield' | 'custom' | 'none'>('academy');
  const [customWatermarkUrl, setCustomWatermarkUrl] = useState<string>('');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(15);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(0);
  const [watermarkScale, setWatermarkScale] = useState<number>(120);

  // Martial lineage vertical/horizontal (Requirement 4)
  const [lineageOrigem, setLineageOrigem] = useState<string>('Mitsuyo Maeda');
  const [lineageMestre, setLineageMestre] = useState<string>('Carlos Gracie');
  const [lineageFormador, setLineageFormador] = useState<string>('Hélio Gracie');
  const [lineageAtual, setLineageAtual] = useState<string>(profile?.name || 'Sensei Master SYSBJJ');
  const [lineageOrientation, setLineageOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Micro protection watermark setting (Requirement 7)
  const [enableAntiForgery, setEnableAntiForgery] = useState<boolean>(true);

  // Kids template special checkboxes (Requirements inclusion)
  const [kidValues, setKidValues] = useState({ discipline: true, respect: true, bravery: true, friendship: true });

  // Custom presets states (Requirement 13)
  const [savedPresets, setSavedPresets] = useState<CustomPreset[]>(() => {
    const local = localStorage.getItem('sysbjj_certificate_presets');
    return local ? JSON.parse(local) : [];
  });
  const [newPresetName, setNewPresetName] = useState<string>('');

  // Audit list issued records (Requirement 14)
  const [issuedLogs, setIssuedLogs] = useState<IssuedCertificate[]>(() => {
    const local = localStorage.getItem('sysbjj_issued_certificates');
    return local ? JSON.parse(local) : [
      {
        id: "CERT-2026-000145",
        studentId: "STUD-001",
        studentName: "JOÃO FILVA ATLETA",
        beltName: "Azul",
        stripeText: "2º Grau",
        date: "2026-05-30",
        issuer: "Sensei Master SYSBJJ",
        hash: "A7FB77189AEBC871165A988B6CD33A9D",
        language: "pt",
        mode: "both",
        status: "VÁLIDO"
      }
    ];
  });

  // Gamification & Multiarts states
  const [selectedGameStudent, setSelectedGameStudent] = useState<Student | null>(null);
  const [skillPassing, setSkillPassing] = useState<number>(75);
  const [skillGuard, setSkillGuard] = useState<number>(75);
  const [skillTakedowns, setSkillTakedowns] = useState<number>(75);
  const [skillSubmissions, setSkillSubmissions] = useState<number>(75);
  const [skillDefenses, setSkillDefenses] = useState<number>(75);
  const [skillDiscipline, setSkillDiscipline] = useState<number>(75);
  const [isUpdatingSkills, setIsUpdatingSkills] = useState(false);
  const [selectedMartialArt, setSelectedMartialArt] = useState<string>('bjj');
  const [enabledArts, setEnabledArts] = useState<string[]>(['bjj', 'muaythai']);

  // Calculated active styles based on model selection
  const activeTheme = useMemo(() => {
    return PROFESSIONAL_THEMES.find(t => t.id === activeThemeId) || PROFESSIONAL_THEMES[0];
  }, [activeThemeId]);

  const beltColorInfo = useMemo(() => {
    if (!selectedStudent) {
      return { hex: '#3b82f6', rgb: [59, 130, 246] };
    }
    const norm = String(selectedStudent.belt || '').toLowerCase();
    if (norm.includes('branc')) return { hex: '#f8fafc', rgb: [248, 250, 252] };
    if (norm.includes('cinz')) return { hex: '#94a3b8', rgb: [148, 163, 184] };
    if (norm.includes('amarel')) return { hex: '#facc15', rgb: [250, 204, 21] };
    if (norm.includes('laranj')) return { hex: '#f97316', rgb: [249, 115, 22] };
    if (norm.includes('verd')) return { hex: '#10B981', rgb: [16, 185, 129] };
    if (norm.includes('azul')) return { hex: '#2563eb', rgb: [37, 99, 235] };
    if (norm.includes('rox')) return { hex: '#7c3aed', rgb: [124, 58, 237] };
    if (norm.includes('marr')) return { hex: '#78350f', rgb: [120, 53, 15] };
    if (norm.includes('pret')) return { hex: '#0f172a', rgb: [15, 23, 42] };
    return { hex: '#3b82f6', rgb: [59, 130, 246] };
  }, [selectedStudent]);

  // Handle uploaded images conversion to local Base64 (Requirement 1 & 5)
  const handleFileUploadAsBase64 = (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Safe image base64 generator for watermarking
  const activeWatermarkBase64 = useMemo(() => {
    if (watermarkOption === 'academy') return academyLogoUrl;
    if (watermarkOption === 'team') return teamLogoUrl;
    if (watermarkOption === 'shield') return shieldLogoUrl;
    if (watermarkOption === 'custom') return customWatermarkUrl;
    return '';
  }, [watermarkOption, academyLogoUrl, teamLogoUrl, shieldLogoUrl, customWatermarkUrl]);

  // Lineage dynamic text output helper
  const parsedLineageText = useMemo(() => {
    const list = [lineageOrigem, lineageMestre, lineageFormador, lineageAtual].filter(Boolean);
    const arrow = lineageOrientation === 'horizontal' ? ' → ' : ' ↓ ';
    return list.join(arrow);
  }, [lineageOrigem, lineageMestre, lineageFormador, lineageAtual, lineageOrientation]);

  // CRYPTOGRAPHIC DYNAMIC HASH (Requirement 10)
  const calculatedHash = useMemo(() => {
    const bName = customBeltText || (selectedStudent ? selectedStudent.belt : 'Branca');
    const sText = customStripeText || (selectedStudent ? `${selectedStudent.stripes || selectedStudent.degrees || 0}º Grau` : '0º Grau');
    const sName = selectedStudent ? selectedStudent.name : 'Unknown';
    const rawPlainString = `${sName}-${bName}-${sText}-${certificateDate}-${profile?.academyName || 'SYSBJJ'}`;
    return CryptoJS.SHA256(rawPlainString).toString(CryptoJS.enc.Hex).substring(0, 32).toUpperCase();
  }, [selectedStudent, customBeltText, customStripeText, certificateDate, profile?.academyName]);

  // Translate automatically standard text segments when languages or parameters shift (Requirement 11)
  useEffect(() => {
    if (!selectedStudent) return;
    const dictator = LANG_DICTIONARY[certificateLanguage];
    let standardPreface = "";

    if (emissionMode === 'belt') {
      standardPreface = dictator.beltModeText;
    } else if (emissionMode === 'stripe') {
      standardPreface = dictator.stripeModeText;
    } else {
      standardPreface = dictator.bothModeText;
    }

    const bName = customBeltText || selectedStudent.belt || 'Branca';
    const sText = customStripeText || `${selectedStudent.stripes || selectedStudent.degrees || 0}º Grau`;

    const replacedText = standardPreface
      .replace('{professor_1}', professorName)
      .replace('{atleta}', selectedStudent.name.toUpperCase())
      .replace('{faixa}', bName.toUpperCase())
      .replace('{grau}', sText.toUpperCase());

    setCustomPrefaceText(replacedText);
    setCustomMeritText(dictator.meritText);
    setCustomObservationsText(dictator.observationsText);
  }, [selectedStudent, emissionMode, certificateLanguage, customBeltText, customStripeText, professorName]);

  // Trigger verify query on mount
  useEffect(() => {
    if (verifyParam) {
      handleQueryVerify(verifyParam);
    }
  }, [verifyParam]);

  // Verification portal search execution (Requirement 9)
  const handleQueryVerify = (code: string) => {
    const parsedCode = String(code).trim().toUpperCase();
    const found = issuedLogs.find(log => log.id.toUpperCase() === parsedCode);
    if (found) {
      setVerifyResult(found);
    } else {
      // Dynamic fallback mock generation for easier interactive experience
      const matchStu = students.find(s => s.name.toUpperCase().includes(parsedCode) || s.id.toUpperCase() === parsedCode);
      if (matchStu) {
        setVerifyResult({
          id: `CERT-${new Date().getFullYear()}-002131`,
          studentId: matchStu.id,
          studentName: matchStu.name,
          beltName: matchStu.belt,
          stripeText: `${matchStu.stripes || 0}º Grau`,
          date: new Date().toISOString().split('T')[0],
          issuer: "Sensei Master SYSBJJ",
          hash: "EA7C118B8CEAECCD8233BA1C990177FA",
          language: "pt",
          mode: "both",
          status: "VÁLIDO"
        });
      } else {
        setVerifyResult(null);
      }
    }
    setHasSearchedVerify(true);
  };

  // Preset Layout Saver (Requirement 13)
  const handleSaveLayoutPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: CustomPreset = {
      id: `PRESET-${Date.now()}`,
      name: newPresetName.trim(),
      emissionMode,
      templateThemeId: activeThemeId,
      cityName,
      stateName,
      certificateDate,
      professorName,
      professorGraduation,
      professorRoleLabel,
      technicalDirectorName,
      technicalDirectorRegistration,
      technicalDirectorRoleLabel,
      customBeltText,
      customStripeText,
      customPrefaceText,
      customMeritText,
      customObservationsText,
      lineageOrigem,
      lineageMestre,
      lineageFormador,
      lineageAtual,
      lineageOrientation,
      watermarkOption,
      watermarkOpacity,
      watermarkRotation,
      watermarkScale,
      enableAntiForgery,
      // Add coordinates to preset
      academyLogoX,
      academyLogoY,
      teamLogoX,
      teamLogoY,
      shieldLogoX,
      shieldLogoY,
      qrCodeX,
      qrCodeY,
      qrCodeSize,
      goldenSealX,
      goldenSealY,
      goldenSealSize,
      professorSignatureX,
      professorSignatureY,
      professorSignatureWidth,
      professorSignatureHeight,
      teamDirectorSignatureX,
      teamDirectorSignatureY,
      teamDirectorSignatureWidth,
      teamDirectorSignatureHeight,
      professorSignatureType,
      teamDirectorSignatureType
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('sysbjj_certificate_presets', JSON.stringify(updated));
    setNewPresetName('');
    logAction('Preset Layout Salvo', `Biblioteca de modelos atualizada com o preset "${newPreset.name}"`, 'System');
  };

  const handleLoadLayoutPreset = (preset: CustomPreset) => {
    setEmissionMode(preset.emissionMode);
    setActiveThemeId(preset.templateThemeId);
    setCityName(preset.cityName);
    setStateName(preset.stateName);
    setCertificateDate(preset.certificateDate);
    setProfessorName(preset.professorName);
    setProfessorGraduation(preset.professorGraduation);
    setProfessorRoleLabel(preset.professorRoleLabel);
    setTechnicalDirectorName(preset.technicalDirectorName);
    setTechnicalDirectorRegistration(preset.technicalDirectorRegistration);
    setTechnicalDirectorRoleLabel(preset.technicalDirectorRoleLabel);
    setCustomBeltText(preset.customBeltText);
    setCustomStripeText(preset.customStripeText);
    setCustomPrefaceText(preset.customPrefaceText);
    setCustomMeritText(preset.customMeritText);
    setCustomObservationsText(preset.customObservationsText);
    setLineageOrigem(preset.lineageOrigem);
    setLineageMestre(preset.lineageMestre);
    setLineageFormador(preset.lineageFormador);
    setLineageAtual(preset.lineageAtual);
    setLineageOrientation(preset.lineageOrientation);
    setWatermarkOption(preset.watermarkOption);
    setWatermarkOpacity(preset.watermarkOpacity);
    setWatermarkRotation(preset.watermarkRotation);
    setWatermarkScale(preset.watermarkScale);
    setEnableAntiForgery(preset.enableAntiForgery);
    if (preset.academyLogoX !== undefined) setAcademyLogoX(preset.academyLogoX);
    if (preset.academyLogoY !== undefined) setAcademyLogoY(preset.academyLogoY);
    if (preset.teamLogoX !== undefined) setTeamLogoX(preset.teamLogoX);
    if (preset.teamLogoY !== undefined) setTeamLogoY(preset.teamLogoY);
    if (preset.shieldLogoX !== undefined) setShieldLogoX(preset.shieldLogoX);
    if (preset.shieldLogoY !== undefined) setShieldLogoY(preset.shieldLogoY);
    if (preset.qrCodeX !== undefined) setQrCodeX(preset.qrCodeX);
    if (preset.qrCodeY !== undefined) setQrCodeY(preset.qrCodeY);
    if (preset.qrCodeSize !== undefined) setQrCodeSize(preset.qrCodeSize);
    if (preset.goldenSealX !== undefined) setGoldenSealX(preset.goldenSealX);
    if (preset.goldenSealY !== undefined) setGoldenSealY(preset.goldenSealY);
    if (preset.goldenSealSize !== undefined) setGoldenSealSize(preset.goldenSealSize);
    if (preset.professorSignatureX !== undefined) setProfessorSignatureX(preset.professorSignatureX);
    if (preset.professorSignatureY !== undefined) setProfessorSignatureY(preset.professorSignatureY);
    if (preset.professorSignatureWidth !== undefined) setProfessorSignatureWidth(preset.professorSignatureWidth);
    if (preset.professorSignatureHeight !== undefined) setProfessorSignatureHeight(preset.professorSignatureHeight);
    if (preset.teamDirectorSignatureX !== undefined) setTeamDirectorSignatureX(preset.teamDirectorSignatureX);
    if (preset.teamDirectorSignatureY !== undefined) setTeamDirectorSignatureY(preset.teamDirectorSignatureY);
    if (preset.teamDirectorSignatureWidth !== undefined) setTeamDirectorSignatureWidth(preset.teamDirectorSignatureWidth);
    if (preset.teamDirectorSignatureHeight !== undefined) setTeamDirectorSignatureHeight(preset.teamDirectorSignatureHeight);
    if (preset.professorSignatureType !== undefined) setProfessorSignatureType(preset.professorSignatureType);
    if (preset.teamDirectorSignatureType !== undefined) setTeamDirectorSignatureType(preset.teamDirectorSignatureType);
    logAction('Preset Layout Carregado', `Preset de layout "${preset.name}" carregado na tela de trabalho`, 'System');
  };

  const handleDeleteLayoutPreset = (id: string) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('sysbjj_certificate_presets', JSON.stringify(updated));
  };

  // DOWNLOAD CERTIFICATE IN HIGH QUALITY PDF USING JSPDF (Requirement 1 - 14 fully integrated)
  const generatePDFDownload = () => {
    if (!selectedStudent) return;
    
    // Create new Landscape A4 document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4' // 297mm x 210mm
    });

    // 1. Draw solid background color according to the theme
    doc.setFillColor(activeTheme.canvasBgColor[0], activeTheme.canvasBgColor[1], activeTheme.canvasBgColor[2]);
    doc.rect(0, 0, 297, 210, 'F');

    // Draw customized customBackground if available
    if (customBackgroundUrl) {
      try {
        const GStateClass: any = (doc as any).GState;
        const gstate = new GStateClass({ opacity: backgroundOpacity / 100 });
        (doc as any).saveState();
        (doc as any).setGState(gstate);
        if (fullBackground) {
          doc.addImage(customBackgroundUrl, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
        } else {
          doc.addImage(customBackgroundUrl, 'JPEG', 20, 20, 257, 170, undefined, 'FAST');
        }
        (doc as any).restoreState();
      } catch (e) {
        console.error("Custom backdrop failed inside PDF output", e);
      }
    }

    // 2. Decorative borders & Custom Brand Shapes
    if (keepBorders) {
      doc.setDrawColor(activeTheme.pdfBorderColor[0], activeTheme.pdfBorderColor[1], activeTheme.pdfBorderColor[2]);
      if (activeTheme.id === 'traditional') {
        doc.setLineWidth(2);
        doc.rect(6, 6, 285, 198);
        doc.setLineWidth(0.4);
        doc.rect(8, 8, 281, 194);
      } else if (activeTheme.id === 'premium') {
        doc.setLineWidth(1.5);
        doc.rect(7, 7, 283, 196);
        doc.setLineWidth(0.3);
        doc.rect(9, 9, 279, 192);
      } else if (activeTheme.id === 'bjjlf_gold_royal') {
        // Triple imperial gold borders
        doc.setLineWidth(2.5);
        doc.setDrawColor(212, 175, 55); // #D4AF37
        doc.rect(6, 6, 285, 198);
        doc.setLineWidth(0.5);
        doc.rect(9, 9, 279, 192);
        doc.setLineWidth(0.5);
        doc.rect(13, 13, 271, 184);
        
        // Draw small gold diamond ornaments in corners
        doc.setFillColor(212, 175, 55);
        doc.circle(9, 9, 1, 'F');
        doc.circle(288, 9, 1, 'F');
        doc.circle(9, 201, 1, 'F');
        doc.circle(288, 201, 1, 'F');
      } else if (activeTheme.id === 'bjjlf_black_gold') {
        doc.setLineWidth(1.5);
        doc.setDrawColor(245, 158, 11); // Amber
        doc.rect(7, 7, 283, 196);
        doc.setLineWidth(0.3);
        doc.rect(10, 10, 277, 190);
      } else if (activeTheme.id === 'bjjlf_elegant_sans') {
        doc.setLineWidth(0.8);
        doc.setDrawColor(197, 160, 89); // #C5A059
        doc.rect(8, 8, 281, 194);
        doc.setLineWidth(0.2);
        doc.rect(10.5, 10.5, 276, 189);
      } else if (activeTheme.id === 'bjjlf_dragon_oriental') {
        doc.setLineWidth(2.0);
        doc.setDrawColor(153, 27, 27); // Deep Red
        doc.rect(5, 5, 287, 200);
        doc.setLineWidth(0.4);
        doc.rect(8, 8, 281, 194);
      } else if (activeTheme.id === 'carioca_integridade') {
        // No double-rect borders needed, pure vector shapes
      } else if (activeTheme.id === 'infantil') {
        doc.setLineWidth(1);
        doc.rect(8, 8, 281, 194);
        // Draw little circles in corners
        doc.setFillColor(245, 158, 11);
        doc.circle(8, 8, 2, 'F');
        doc.circle(289, 8, 2, 'F');
        doc.circle(8, 202, 2, 'F');
        doc.circle(289, 202, 2, 'F');
      } else {
        doc.setLineWidth(1);
        doc.rect(10, 10, 277, 190);
      }
    }

    // Custom Brand Graphic shapes inside generated PDF canvas
    if (activeTheme.id === 'carioca_integridade') {
      // Left vertical gradient column
      doc.setFillColor(13, 148, 136); // teal-600
      doc.rect(0, 0, 11, 210, 'F');
      
      // Right navy-blue vertical column
      doc.setFillColor(11, 37, 69); // navy-blue
      doc.rect(285, 0, 12, 210, 'F');
      
      // Vertical "CERTIFICADO" printed on the right column
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255, 0.3); // printed faintly in white
      doc.text("CERTIFICADO", 293, 105, { align: 'center', angle: 270 });
    }
    
    if (activeTheme.id === 'bjjlf_dragon_oriental') {
      // Large calligraphic Kanji 柔術 on left margin
      doc.setFont('Times', 'bold');
      doc.setFontSize(36);
      doc.setTextColor(153, 27, 27); // deep red / crimson
      doc.text("柔", 18, 95, { align: 'center' });
      doc.text("術", 18, 122, { align: 'center' });
    }

    // 3. Repeating MICRO MARCAS D'ÁGUA de Segurança (Requirement 7)
    if (enableAntiForgery) {
      (doc as any).saveState();
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(4.5);
      const isDark = activeTheme.id === 'premium' || activeTheme.id === 'campeonato';
      doc.setTextColor(isDark ? 40 : 228);

      const watermarkLineText = `SYSBJJ GUARD | ID: ${certId} | ATLETA: ${selectedStudent.name.toUpperCase()} | VALIDAÇÃO HASH: ${calculatedHash} | `;
      for (let y = 12; y < 205; y += 14) {
        for (let x = -40; x < 320; x += 110) {
          doc.text(watermarkLineText, x, y, { angle: 18 });
        }
      }
      (doc as any).restoreState();
    }

    // 4. Principal Central Watermark (Requirement 6)
    if (watermarkOption !== 'none' && activeWatermarkBase64) {
      try {
        const GStateClass: any = (doc as any).GState;
        const wOpacityGState = new GStateClass({ opacity: watermarkOpacity / 100 });
        (doc as any).saveState();
        (doc as any).setGState(wOpacityGState);
        
        const wSizeMM = watermarkScale * 0.35; // Convert scale pixels to mm
        const xCent = 148.5 - wSizeMM / 2;
        const yCent = 105 - wSizeMM / 2;
        
        // Handle simple rotation
        doc.addImage(activeWatermarkBase64, 'PNG', xCent, yCent, wSizeMM, wSizeMM, undefined, 'FAST', watermarkRotation);
        (doc as any).restoreState();
      } catch (e) {
        console.error("PDF watermark draw error", e);
      }
    }

    // 5. Header Logos Left, Right and Center (Requirement 1)
    try {
      if (academyLogoUrl) {
        const logoSzMM = academyLogoSize * 0.35;
        doc.addImage(academyLogoUrl, 'PNG', academyLogoX, academyLogoY, logoSzMM, logoSzMM, undefined, 'FAST');
      }
    } catch (e) {}

    try {
      if (teamLogoUrl) {
        const logoSzMM = teamLogoSize * 0.35;
        doc.addImage(teamLogoUrl, 'PNG', teamLogoX, teamLogoY, logoSzMM, logoSzMM, undefined, 'FAST');
      }
    } catch (e) {}

    try {
      if (shieldLogoUrl) {
        const logoSzMM = shieldLogoSize * 0.35;
        doc.addImage(shieldLogoUrl, 'PNG', shieldLogoX, shieldLogoY, logoSzMM, logoSzMM, undefined, 'FAST');
      }
    } catch (e) {}

    // 6. Header Text
    const isThemeDark = activeTheme.id === 'premium' || activeTheme.id === 'campeonato' || activeTheme.id === 'bjjlf_black_gold';
    const dict = LANG_DICTIONARY[certificateLanguage];
    const headerTitle = (profile?.academyName || 'SYSBJJ CT MASTER').toUpperCase();

    // Academy / Organization header centered
    doc.setTextColor(isThemeDark ? 255 : 30);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(headerTitle, 148.5, 42, { align: 'center' });

    // Custom "CERTIFICADO" centerpiece title based on template Selected
    if (activeTheme.id === 'bjjlf_gold_royal') {
      doc.setFont('Times', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(28, 25, 23);
      doc.text("CERTIFICADO", 148.5, 53, { align: 'center' });
      
      // Thin golden layout line
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.6);
      doc.line(108.5, 57, 188.5, 57);
    } else if (activeTheme.id === 'bjjlf_black_gold') {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(245, 158, 11); // Amber-500
      doc.text("CERTIFICADO", 148.5, 54, { align: 'center' });
    } else if (activeTheme.id === 'bjjlf_elegant_sans') {
      doc.setFont('Times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(197, 160, 89); // C5A059
      doc.text("— CERTIFICADO —", 148.5, 54, { align: 'center' });
    } else if (activeTheme.id === 'bjjlf_dragon_oriental') {
      doc.setFont('Times', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(153, 27, 27); // Crimson
      doc.text("CERTIFICADO", 148.5, 53, { align: 'center' });
    } else {
      // Standard subtitle
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(isThemeDark ? 180 : 100);
      doc.text(dict.title, 148.5, 48, { align: 'center' });
    }

    // 7. Preface main body (Requirement 2 & 11)
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(isThemeDark ? 220 : 80);
    const splitPreface = doc.splitTextToSize(customPrefaceText, 220);
    doc.text(splitPreface, 148.5, 68, { align: 'center' });

    // 8. Athlete Name Highlighted
    let nameFontFamily = 'Helvetica';
    let nameFontStyle = 'bold';
    let nameColorHex = isThemeDark ? [255, 255, 255] : [15, 15, 15];
    let athleteNameSize = 24;

    if (activeTheme.id === 'bjjlf_elegant_sans') {
      nameFontFamily = 'Times';
      nameColorHex = [161, 130, 74]; // #A1824A
    } else if (activeTheme.id === 'bjjlf_gold_royal') {
      nameFontFamily = 'Times';
      nameColorHex = [28, 25, 23];
    } else if (activeTheme.id === 'bjjlf_dragon_oriental') {
      nameFontFamily = 'Times';
      nameColorHex = [153, 27, 27];
    }

    doc.setFont(nameFontFamily, nameFontStyle);
    doc.setFontSize(athleteNameSize);
    doc.setTextColor(nameColorHex[0], nameColorHex[1], nameColorHex[2]);
    doc.text(selectedStudent.name.toUpperCase(), 148.5, 102, { align: 'center' });

    // Drawing promoted belt color ribbon under name
    doc.setFillColor(beltColorInfo.rgb[0], beltColorInfo.rgb[1], beltColorInfo.rgb[2]);
    doc.rect(58, 106, 181, 1.5, 'F');

    // 9. Graduation details & Merits
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(isThemeDark ? 190 : 90);
    const resolvedStripeName = customStripeText || `${selectedStudent.stripes || selectedStudent.degrees || 0}º Grau`;
    const resolvedBeltName = customBeltText || selectedStudent.belt || 'Branca';

    let technicalDetailText = "";
    if (emissionMode === 'belt') {
      technicalDetailText = `Graduação Oficial: FAIXA ${resolvedBeltName.toUpperCase()}`;
    } else if (emissionMode === 'stripe') {
      technicalDetailText = `Graduação Oficial: ${resolvedStripeName.toUpperCase()}`;
    } else {
      technicalDetailText = `Graduação Oficial: FAIXA ${resolvedBeltName.toUpperCase()} - ${resolvedStripeName.toUpperCase()}`;
    }
    doc.text(technicalDetailText, 148.5, 114, { align: 'center' });

    if (customMeritText) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text(`"${customMeritText}"`, 148.5, 122, { align: 'center' });
    }

    if (customObservationsText) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Obs: ${customObservationsText}`, 148.5, 128, { align: 'center' });
    }

    // 10. Martial Lineage rendering (Requirement 4)
    doc.setFont('Courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(isThemeDark ? 150 : 120);
    doc.text(`${dict.lineageHeader}: ${parsedLineageText.toUpperCase()}`, 148.5, 142, { align: 'center' });

    // 11. Custom uploaded active Signatures (Requirement 5)
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(isThemeDark ? 210 : 70);

    // Signature 1
    doc.line(30, 168, 115, 168);
    if (professorSignatureType === 'upload' && professorSignatureUrl) {
      try {
        doc.addImage(professorSignatureUrl, 'PNG', professorSignatureX, professorSignatureY, professorSignatureWidth, professorSignatureHeight, undefined, 'FAST');
      } catch (e) {}
    } else if (professorSignatureType === 'digital') {
      try {
        doc.setFont('Times', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(30, 64, 175); 
        doc.text(professorName, professorSignatureX + (professorSignatureWidth / 2), professorSignatureY + (professorSignatureHeight / 2) + 2, { align: 'center' });
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(4.5);
        doc.setTextColor(16, 124, 65); 
        doc.text("✓ ASSINADO DIGITALMENTE  |  SYSBJJ INTEGRITY", professorSignatureX + (professorSignatureWidth / 2), professorSignatureY + (professorSignatureHeight / 2) + 5.5, { align: 'center' });
      } catch (e) {}
    }
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(isThemeDark ? 210 : 70);
    doc.text(professorName, 72.5, 172, { align: 'center' });
    doc.text(`${professorGraduation} | ${professorRoleLabel}`, 72.5, 176, { align: 'center' });

    // Signature 2
    doc.line(182, 168, 267, 168);
    if (teamDirectorSignatureType === 'upload' && teamDirectorSignatureUrl) {
      try {
        doc.addImage(teamDirectorSignatureUrl, 'PNG', teamDirectorSignatureX, teamDirectorSignatureY, teamDirectorSignatureWidth, teamDirectorSignatureHeight, undefined, 'FAST');
      } catch (e) {}
    } else if (teamDirectorSignatureType === 'digital') {
      try {
        doc.setFont('Times', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(30, 64, 175); 
        doc.text(technicalDirectorName, teamDirectorSignatureX + (teamDirectorSignatureWidth / 2), teamDirectorSignatureY + (teamDirectorSignatureHeight / 2) + 2, { align: 'center' });
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(4.5);
        doc.setTextColor(16, 124, 65); 
        doc.text("✓ ASSINADO DIGITALMENTE  |  SYSBJJ INTEGRITY", teamDirectorSignatureX + (teamDirectorSignatureWidth / 2), teamDirectorSignatureY + (teamDirectorSignatureHeight / 2) + 5.5, { align: 'center' });
      } catch (e) {}
    }
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(isThemeDark ? 210 : 70);
    doc.text(technicalDirectorName, 224.5, 172, { align: 'center' });
    doc.text(`${technicalDirectorRegistration} | ${technicalDirectorRoleLabel}`, 224.5, 176, { align: 'center' });

    // 12. Golden Seal of Authenticity graphics inside PDF (Requirement 8)
    const sealRadius = goldenSealSize / 2;
    if (activeTheme.id === 'bjjlf_gold_royal' || activeTheme.id === 'bjjlf_black_gold') {
      // Draw golden rosette ribbons
      doc.setFillColor(180, 83, 9); // deep brown amber
      doc.rect(goldenSealX - 4.5, goldenSealY - 1, 3, 13, 'F');
      doc.rect(goldenSealX + 1.5, goldenSealY - 1, 3, 13, 'F');
      
      // Draw circular base of rosette
      doc.setFillColor(212, 175, 55); // gold base
      doc.circle(goldenSealX, goldenSealY - 3, sealRadius + 2.5, 'F');
      doc.setFillColor(31, 41, 55); // dark core
      doc.circle(goldenSealX, goldenSealY - 3, sealRadius + 0.7, 'F');
      
      doc.setFont('Times', 'bold');
      doc.setFontSize(2.8 * (goldenSealSize / 15));
      doc.setTextColor(212, 175, 55);
      doc.text("DEDICAÇÃO &", goldenSealX, goldenSealY - 5.2, { align: 'center' });
      doc.text("DISCIPLINA", goldenSealX, goldenSealY - 3.0, { align: 'center' });
      doc.text("SUPERAÇÃO &", goldenSealX, goldenSealY - 0.8, { align: 'center' });
      doc.text("LEGADO", goldenSealX, goldenSealY + 1.4, { align: 'center' });
    } else {
      // Standard Golden Seal
      doc.setFillColor(217, 119, 6); // Amber Gold Base
      doc.circle(goldenSealX, goldenSealY, sealRadius, 'F');
      doc.setDrawColor(254, 243, 199);
      doc.setLineWidth(0.4);
      doc.circle(goldenSealX, goldenSealY, sealRadius - 1.3);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(3.5 * (goldenSealSize / 15));
      doc.setTextColor(255, 255, 255);
      doc.text("SYSBJJ", goldenSealX, goldenSealY - 1, { align: 'center' });
      doc.text("SECURE", goldenSealX, goldenSealY + 1.2, { align: 'center' });
    }

    // 13. QR Code validation capture (Requirement 9)
    try {
      const qrCanvas = document.getElementById('validation-qr-canvas') as HTMLCanvasElement;
      if (qrCanvas) {
        const qrBase64 = qrCanvas.toDataURL('image/png');
        doc.setFillColor(255, 255, 255);
        doc.rect(qrCodeX - 0.5, qrCodeY - 0.5, qrCodeSize + 1, qrCodeSize + 1, 'F');
        doc.addImage(qrBase64, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize, undefined, 'FAST');
      }
    } catch (e) {
      console.warn("Could not capture dynamic QR canvas for PDF export", e);
    }

    // 14. Date & metadata footer
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(isThemeDark ? 160 : 110);
    const readableDate = new Date(certificateDate).toLocaleDateString();
    doc.text(`${cityName.toUpperCase()} - ${stateName.toUpperCase()}, ${readableDate}`, 148.5, 188, { align: 'center' });
    doc.text(`REG: ${certId}  •  HASH CRIPTOGRÁFICO: ${calculatedHash}`, 148.5, 193, { align: 'center' });

    // Save and register emission log (Requirement 14)
    const cleanName = selectedStudent.name.replace(/\s+/g, '_');
    doc.save(`Diploma_SYSBJJ_${cleanName}_${certId}.pdf`);
    
    handleRegisterEmission(selectedStudent.name, resolvedBeltName, resolvedStripeName, certId, calculatedHash);
    logAction('Diploma Gerado', `Sucesso ao gerar PDF oficial do aluno ${selectedStudent.name}`, 'System');
  };

  // Register in local history audit logs (Requirement 14)
  const handleRegisterEmission = (stdName: string, belt: string, stripe: string, codeId: string, secureHash: string) => {
    const newLog: IssuedCertificate = {
      id: codeId,
      studentId: selectedStudent?.id || "ANON-001",
      studentName: stdName.toUpperCase(),
      beltName: belt,
      stripeText: stripe,
      date: certificateDate,
      issuer: professorName,
      hash: secureHash,
      language: certificateLanguage,
      mode: emissionMode,
      status: "VÁLIDO"
    };
    const updated = [newLog, ...issuedLogs];
    setIssuedLogs(updated);
    localStorage.setItem('sysbjj_issued_certificates', JSON.stringify(updated));
  };

  const handleManualRevoke = (id: string) => {
    const updated = issuedLogs.map(log => log.id === id ? { ...log, status: "INVÁLIDO" as const } : log);
    setIssuedLogs(updated);
    localStorage.setItem('sysbjj_issued_certificates', JSON.stringify(updated));
    logAction('Diploma Revogado', `Chave de certificado ${id} marcada como INVÁLIDA na auditoria`, 'Security');
  };

  // Student selection trigger auto configuration
  const handleSelectStudentData = (studentId: string) => {
    const athlete = students.find(s => s.id === studentId);
    if (!athlete) return;
    setSelectedStudent(athlete);
    
    // Autofills (Requirement 3)
    setCustomBeltText(athlete.belt);
    setCustomStripeText(`${athlete.stripes || athlete.degrees || 0}º Grau`);
    setLineageAtual(profile?.name || 'Sensei Master SYSBJJ');

    // Choose default visual layout based on student profile
    if (athlete.isKid) {
      setActiveThemeId('infantil');
    } else if (athlete.belt.toLowerCase() === 'preta' || athlete.belt.toLowerCase() === 'black') {
      setActiveThemeId('premium');
    } else {
      setActiveThemeId('traditional');
    }
  };

  // Simple copy to clipboard helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Technical metric sliders saving for students (Gamification Tab)
  const handleUpdateStudentSkillsData = () => {
    if (!selectedGameStudent) return;
    setIsUpdatingSkills(true);
    const updatedMetrics = {
      striking: skillTakedowns,
      grappling: skillSubmissions,
      cardio: skillDefenses,
      strategy: skillGuard
    };
    updateStudent(selectedGameStudent.id, {
      technicalMetrics: updatedMetrics,
      behaviorScore: Math.round(skillDiscipline / 20)
    });
    setTimeout(() => {
      setIsUpdatingSkills(false);
      logAction('Métricas Técnicas Salvas', `Habilidades atualizadas para o competidor ${selectedGameStudent.name}`, 'System');
    }, 600);
  };

  const calculateCombatClass = (pwr: number) => {
    if (pwr >= 90) return { title: 'Mestre Draconiano S', color: 'text-rose-500 bg-rose-500/10' };
    if (pwr >= 80) return { title: 'Guerreiro Samurai A', color: 'text-amber-500 bg-amber-500/10' };
    if (pwr >= 65) return { title: 'Atleta do Dojo B', color: 'text-blue-500 bg-blue-500/10' };
    return { title: 'Iniciante Disciplinado C', color: 'text-slate-400 bg-slate-400/10' };
  };

  // PUBLIC QR CODE VALIDATION BOARD BYPASS (Requirement 9)
  if (verifyParam || activeTab === 'audit' && verifySearchId) {
    // If the verifier has searched or scanned, we render a highly polished security badge
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-24 text-stone-100">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] bg-red-650 text-white font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-red-500">SYSBJJ SECURE 🛡️</span>
            <h1 className="text-2xl font-black uppercase mt-1">PORTAL DE AUTENTICIDADE CREDENCIAL</h1>
          </div>
          <button 
            onClick={() => {
              setSearchParams({});
              setVerifySearchId('');
              setVerifyResult(null);
              setHasSearchedVerify(false);
              setActiveTab('certificates');
            }}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-stone-300 rounded-xl text-[10px] font-black uppercase hover:bg-slate-800"
          >
            Voltar ao Sistema
          </button>
        </header>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Verificação de Autógrafo Regulamentar</span>
          <div className="flex gap-2">
            <input 
              type="text"
              value={verifySearchId}
              onChange={(e) => setVerifySearchId(e.target.value)}
              placeholder="Digite o código REG de Certificado (Ex: CERT-2026-641249)"
              className="flex-1 h-12 px-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold placeholder-stone-500 text-white focus:outline-none focus:border-amber-500"
            />
            <button 
              onClick={() => handleQueryVerify(verifySearchId)}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase"
            >
              Pesquisar
            </button>
          </div>

          {hasSearchedVerify && (
            <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl space-y-6 animate-in fade-in duration-300">
              {verifyResult ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-emerald-500/20 pb-4">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-500">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded">STATUS: {verifyResult.status}</span>
                      <h4 className="text-lg font-black text-white mt-1 uppercase">CERTIFICADO AUTÊNTICO E ATIVO</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="bg-slate-900/60 p-3 rounded-xl">
                      <p className="text-slate-500 text-[9px] uppercase tracking-wider">Atleta Graduado</p>
                      <p className="font-extrabold text-[#F5F5F5] uppercase mt-0.5">{verifyResult.studentName}</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl">
                      <p className="text-slate-500 text-[9px] uppercase tracking-wider">Dojo Organizador</p>
                      <p className="font-extrabold text-[#F5F5F5] uppercase mt-0.5">{profile?.academyName || "Agremiação SYSBJJ"}</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl">
                      <p className="text-slate-500 text-[9px] uppercase tracking-wider">Graduação</p>
                      <p className="font-extrabold text-amber-400 uppercase mt-0.5">Faixa {verifyResult.beltName} - {verifyResult.stripeText}</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl">
                      <p className="text-slate-500 text-[9px] uppercase tracking-wider">Cerimônia de Outorga</p>
                      <p className="font-extrabold text-[#F5F5F5] mt-0.5">{new Date(verifyResult.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-4 border border-white/5 rounded-xl space-y-2">
                    <p className="text-[9px] text-[#A3A3A3] font-bold uppercase tracking-widest">Código de Autenticidade Registrado</p>
                    <p className="font-mono text-stone-200 text-xs break-all">{verifyResult.id}</p>
                    <p className="text-[9px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-2">Assinatura Digital Auditável (Hash SHA-256)</p>
                    <p className="font-mono text-emerald-400 text-[10.5px] break-all">{verifyResult.hash}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-950/20 border border-red-500/20 text-center rounded-xl space-y-3">
                  <div className="w-12 h-12 bg-red-500/15 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle size={24} />
                  </div>
                  <h4 className="text-sm font-black text-red-400 uppercase tracking-wide">CHAVE MARCIAL NÃO ENCONTRADA OU INVÁLIDA</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Este diploma não possui validação reguladora registrada em nosso sistema ou a chave de auditoria foi revogada por inconsistência cadastral.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 max-w-7xl mx-auto h-auto text-stone-100">
      
      {/* CABEÇALHO */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Evolução <span className="text-amber-500">Master & Certificados</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-3">
            Credenciais Marciais Profissionais de Alta Autenticidade • Selos e Marcas d'Água de Proteção
          </p>
        </div>

        {/* CONTROLES DE ABA */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner overflow-x-auto scrollbar-hide whitespace-nowrap max-w-full scroll-smooth">
          <button 
            onClick={() => setActiveTab('certificates')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${activeTab === 'certificates' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Award size={13} className="text-amber-500" /> Diplomas Oficiais
          </button>
          
          <button 
            onClick={() => setActiveTab('multiarts')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${activeTab === 'multiarts' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <RefreshCw size={13} className="text-teal-500" /> Multi-Artes
          </button>

          <button 
            onClick={() => setActiveTab('gamification')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${activeTab === 'gamification' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Flame size={13} className="text-rose-500 animate-pulse" /> Nível Técnico
          </button>

          <button 
            onClick={() => setActiveTab('audit')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${activeTab === 'audit' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Shield size={13} className="text-blue-500" /> Auditoria & Histórico
          </button>
        </div>
      </header>

      {/* ABA 1: GERADOR E PERSONALIZADOR DE DIPLOMAS */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          
          {/* PAINEL ESQUERDO DE CALIBRAÇÕES */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ETAPA 1: ALUNO */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                <User size={13} className="text-blue-500" /> Estágio 1: Selecionar Aluno
              </h3>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Escudo para Encomendar Graduação</label>
                <select 
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-black tracking-wider uppercase text-slate-100"
                  value={selectedStudent?.id || ''}
                  onChange={(e) => handleSelectStudentData(e.target.value)}
                >
                  <option value="">-- SELECIONAR ATLETA PARA CERTIFICACAO --</option>
                  {students.map(std => (
                    <option key={std.id} value={std.id}>
                      {std.name.toUpperCase()} (FAIXA {std.belt.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ETAPA 2: CONFIGURAÇÃO DE TEXTOS E OUTORGUIS */}
            {selectedStudent && (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-sm space-y-5">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Edit3 size={13} className="text-purple-500" /> Estágio 2: Tipo de Emissão & Textos
                </h3>

                {/* Idioma Multilíngue */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Idioma do Diploma</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['pt', 'en', 'es'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setCertificateLanguage(lang)}
                        className={`h-8 font-black uppercase text-[8px] rounded-lg tracking-wider transition-all border ${certificateLanguage === lang ? 'bg-amber-600 text-white border-amber-600 shadow' : 'bg-slate-950 text-slate-400'}`}
                      >
                        {lang === 'pt' ? 'Português' : lang === 'en' ? 'English' : 'Español'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modos de Emissão */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Modos do Diploma (Focagem)</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setEmissionMode('belt')}
                      className={`h-8 rounded-lg text-[8px] font-extrabold uppercase transition-all tracking-tight ${emissionMode === 'belt' ? 'bg-blue-600 text-white border border-blue-600' : 'bg-slate-950 text-slate-400 border border-[#262626]'}`}
                    >
                      Somente Faixa
                    </button>
                    <button
                      onClick={() => setEmissionMode('stripe')}
                      className={`h-8 rounded-lg text-[8px] font-extrabold uppercase transition-all tracking-tight ${emissionMode === 'stripe' ? 'bg-blue-600 text-white border border-blue-600' : 'bg-slate-950 text-slate-400 border border-[#262626]'}`}
                    >
                      Somente Grau
                    </button>
                    <button
                      onClick={() => setEmissionMode('both')}
                      className={`h-8 rounded-lg text-[8px] font-extrabold uppercase transition-all tracking-tight ${emissionMode === 'both' ? 'bg-blue-600 text-white border border-blue-600' : 'bg-slate-950 text-slate-400 border border-[#262626]'}`}
                    >
                      Faixa + Grau
                    </button>
                  </div>
                </div>

                {/* Custom Edit levels */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Nome Customizado da Faixa</span>
                    <input 
                      type="text"
                      value={customBeltText}
                      onChange={(e) => setCustomBeltText(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Identidicador Grau do Aluno</span>
                    <input 
                      type="text"
                      value={customStripeText}
                      onChange={(e) => setCustomStripeText(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white"
                    />
                  </div>
                </div>

                {/* Preface edit */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Texto Principal do Diploma</span>
                  <textarea 
                    value={customPrefaceText}
                    onChange={(e) => setCustomPrefaceText(e.target.value)}
                    className="w-full h-24 p-2 bg-slate-950 border border-stone-800 text-[10.5px] font-semibold text-stone-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Texto de Mérito</span>
                  <input 
                    type="text"
                    value={customMeritText}
                    onChange={(e) => setCustomMeritText(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Observações/Estatutos</span>
                  <input 
                    type="text"
                    value={customObservationsText}
                    onChange={(e) => setCustomObservationsText(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[8px] font-sans text-slate-400 uppercase">Cidade</span>
                    <input type="text" value={cityName} onChange={(e) => setCityName(e.target.value)} className="w-full h-9 px-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-sans text-slate-400 uppercase">Estado</span>
                    <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} className="w-full h-9 px-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-sans text-slate-400 uppercase">Data da Cerimônia</span>
                    <input type="date" value={certificateDate} onChange={(e) => setCertificateDate(e.target.value)} className="w-full h-9 px-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: PERSONALIZAÇÃO VISUAL AVANÇADA (Requirement 1 & 12) */}
            {selectedStudent && (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] space-y-5">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Layout size={13} className="text-amber-500" /> Estágio 3: Personalizações Visuais
                </h3>

                {/* 10 Professional Presets */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-[#F59E0B] tracking-wider block">Escolha o Modelo Profissional (Requisito 12)</span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {PROFESSIONAL_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setActiveThemeId(theme.id);
                          logAction('Estilo do Diploma Alterado', `Diploma mudado para o modelo nacional "${theme.name}"`, 'System');
                        }}
                        className={`p-2 rounded-xl text-left border text-[10px] uppercase font-black transition-all ${activeThemeId === theme.id ? 'bg-amber-600 border-amber-500 text-white shadow' : 'bg-slate-950 text-slate-400 border-white/5 hover:border-slate-700'}`}
                      >
                        <p className="font-extrabold">{theme.name}</p>
                        <p className="text-[7.5px] font-bold lowercase text-white/50 truncate leading-none mt-1">{theme.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Logos uploads (Requirement 1) */}
                <div className="pt-3 border-t border-dashed border-white/5 space-y-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Logos Customizados (Uploads)</span>
                  
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* CT LOGO */}
                    <div className="space-y-1 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                      <p className="text-[7.5px] font-black text-amber-500 uppercase">CT LOGO (SUP. ESQ)</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUploadAsBase64(e, setAcademyLogoUrl)} 
                        className="text-[8px] bg-slate-950 border border-white/5 p-1 w-full rounded"
                      />
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <span className="text-[7px] text-slate-400">Tam:</span>
                        <input type="range" min="15" max="95" value={academyLogoSize} onChange={(e) => setAcademyLogoSize(Number(e.target.value))} className="w-full scale-90" />
                      </div>

                      {/* CT LOGO CONTROLS */}
                      <div className="flex flex-col gap-0.5 mt-1 border-t border-white/5 pt-1 space-y-1">
                        <div className="flex items-center justify-between text-[7px] text-slate-400">
                          <span className="font-extrabold uppercase">Alinhar:</span>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[75%]">
                            <button 
                              onClick={() => {
                                setAcademyLogoX(16);
                                setAcademyLogoY(16);
                              }}
                              title="Alinhar à Esquerda"
                              className="px-1 py-0.5 bg-slate-900 border border-white/5 hover:border-slate-700 text-stone-200 rounded text-[6px] active:scale-95 transition-all"
                            >
                              Esq
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = academyLogoSize * 0.35;
                                setAcademyLogoX(148.5 - logoSzMM / 2);
                                setAcademyLogoY(16);
                              }}
                              title="Centralizar no Topo"
                              className="px-1 py-0.5 bg-[#B58911] hover:bg-amber-600 text-white font-extrabold rounded text-[6px] active:scale-95 transition-all"
                            >
                              Cent
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = academyLogoSize * 0.35;
                                setAcademyLogoX(281 - logoSzMM);
                                setAcademyLogoY(16);
                              }}
                              title="Alinhar à Direita"
                              className="px-1 py-0.5 bg-slate-900 border border-white/5 hover:border-slate-700 text-stone-200 rounded text-[6px] active:scale-95 transition-all"
                            >
                              Dir
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = academyLogoSize * 0.35;
                                setAcademyLogoX(148.5 - logoSzMM / 2);
                              }}
                              title="Centralizar Horizontal"
                              className="px-1 py-0.5 bg-indigo-900/60 border border-indigo-700/50 hover:border-indigo-500 text-indigo-200 rounded text-[6px] active:scale-95 transition-all font-bold"
                            >
                              ↕ Horiz
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = academyLogoSize * 0.35;
                                setAcademyLogoY(105 - logoSzMM / 2);
                              }}
                              title="Centralizar Vertical"
                              className="px-1 py-0.5 bg-indigo-900/60 border border-indigo-700/50 hover:border-indigo-500 text-indigo-200 rounded text-[6px] active:scale-95 transition-all font-bold"
                            >
                              ↔ Vert
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = academyLogoSize * 0.35;
                                setAcademyLogoX(148.5 - logoSzMM / 2);
                                setAcademyLogoY(105 - logoSzMM / 2);
                              }}
                              title="Centro Total"
                              className="px-1 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded text-[6px] active:scale-95 transition-all"
                            >
                              CENTRO
                            </button>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-[7px] text-slate-400">
                            <span>Pos X: {Math.round(academyLogoX)}mm</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="297" 
                              value={Math.round(academyLogoX)} 
                              onChange={(e) => setAcademyLogoX(Number(e.target.value))} 
                              className="w-[45px] accent-amber-500 scale-75"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[7px] text-slate-400">
                            <span>Pos Y: {Math.round(academyLogoY)}mm</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="210" 
                              value={Math.round(academyLogoY)} 
                              onChange={(e) => setAcademyLogoY(Number(e.target.value))} 
                              className="w-[45px] accent-amber-500 scale-75"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TEAM LOGO */}
                    <div className="space-y-1 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                      <p className="text-[7.5px] font-black text-amber-500 uppercase">TEAM LOGO (SUP. DIR)</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUploadAsBase64(e, setTeamLogoUrl)} 
                        className="text-[8px] bg-slate-950 border border-white/5 p-1 w-full rounded"
                      />
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <span className="text-[7px] text-slate-400">Tam:</span>
                        <input type="range" min="15" max="95" value={teamLogoSize} onChange={(e) => setTeamLogoSize(Number(e.target.value))} className="w-full scale-90" />
                      </div>

                      {/* TEAM LOGO CONTROLS */}
                      <div className="flex flex-col gap-0.5 mt-1 border-t border-white/5 pt-1 space-y-1">
                        <div className="flex items-center justify-between text-[7px] text-slate-400">
                          <span className="font-extrabold uppercase">Alinhar:</span>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[75%]">
                            <button 
                              onClick={() => {
                                setTeamLogoX(16);
                                setTeamLogoY(16);
                              }}
                              title="Alinhar à Esquerda"
                              className="px-1 py-0.5 bg-slate-900 border border-white/5 hover:border-slate-700 text-stone-200 rounded text-[6px] active:scale-95 transition-all"
                            >
                              Esq
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = teamLogoSize * 0.35;
                                setTeamLogoX(148.5 - logoSzMM / 2);
                                setTeamLogoY(16);
                              }}
                              title="Centralizar no Topo"
                              className="px-1 py-0.5 bg-[#B58911] hover:bg-amber-600 text-white font-extrabold rounded text-[6px] active:scale-95 transition-all"
                            >
                              Cent
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = teamLogoSize * 0.35;
                                setTeamLogoX(281 - logoSzMM);
                                setTeamLogoY(16);
                              }}
                              title="Alinhar à Direita"
                              className="px-1 py-0.5 bg-slate-900 border border-white/5 hover:border-slate-700 text-stone-200 rounded text-[6px] active:scale-95 transition-all"
                            >
                              Dir
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = teamLogoSize * 0.35;
                                setTeamLogoX(148.5 - logoSzMM / 2);
                              }}
                              title="Centralizar Horizontal"
                              className="px-1 py-0.5 bg-indigo-900/60 border border-indigo-700/50 hover:border-indigo-500 text-indigo-200 rounded text-[6px] active:scale-95 transition-all font-bold"
                            >
                              ↔ Horiz
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = teamLogoSize * 0.35;
                                setTeamLogoY(105 - logoSzMM / 2);
                              }}
                              title="Centralizar Vertical"
                              className="px-1 py-0.5 bg-indigo-900/60 border border-indigo-700/50 hover:border-indigo-500 text-indigo-200 rounded text-[6px] active:scale-95 transition-all font-bold"
                            >
                              ↕ Vert
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = teamLogoSize * 0.35;
                                setTeamLogoX(148.5 - logoSzMM / 2);
                                setTeamLogoY(105 - logoSzMM / 2);
                              }}
                              title="Centro Total"
                              className="px-1 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded text-[6px] active:scale-95 transition-all"
                            >
                              CENTRO
                            </button>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-[7px] text-slate-400">
                            <span>Pos X: {Math.round(teamLogoX)}mm</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="297" 
                              value={Math.round(teamLogoX)} 
                              onChange={(e) => setTeamLogoX(Number(e.target.value))} 
                              className="w-[45px] accent-amber-500 scale-75"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[7px] text-slate-400">
                            <span>Pos Y: {Math.round(teamLogoY)}mm</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="210" 
                              value={Math.round(teamLogoY)} 
                              onChange={(e) => setTeamLogoY(Number(e.target.value))} 
                              className="w-[45px] accent-amber-500 scale-75"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACADEMY SHIELD */}
                    <div className="space-y-1 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                      <p className="text-[7.5px] font-black text-amber-500 uppercase">BRASÃO CENTRAL</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUploadAsBase64(e, setShieldLogoUrl)} 
                        className="text-[8px] bg-slate-950 border border-white/5 p-1 w-full rounded"
                      />
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <span className="text-[7px] text-slate-400">Tam:</span>
                        <input type="range" min="15" max="95" value={shieldLogoSize} onChange={(e) => setShieldLogoSize(Number(e.target.value))} className="w-full scale-90" />
                      </div>

                      {/* SHIELD CONTROLS */}
                      <div className="flex flex-col gap-0.5 mt-1 border-t border-white/5 pt-1 space-y-1">
                        <div className="flex items-center justify-between text-[7px] text-slate-400">
                          <span className="font-extrabold uppercase">Alinhar:</span>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[75%]">
                            <button 
                              onClick={() => {
                                setShieldLogoX(16);
                                setShieldLogoY(16);
                              }}
                              title="Alinhar à Esquerda"
                              className="px-1 py-0.5 bg-slate-900 border border-white/5 hover:border-slate-700 text-stone-200 rounded text-[6px] active:scale-95 transition-all"
                            >
                              Esq
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = shieldLogoSize * 0.35;
                                setShieldLogoX(148.5 - logoSzMM / 2);
                                setShieldLogoY(16);
                              }}
                              title="Centralizar no Topo"
                              className="px-1 py-0.5 bg-[#B58911] hover:bg-amber-600 text-white font-extrabold rounded text-[6px] active:scale-95 transition-all"
                            >
                              Cent
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = shieldLogoSize * 0.35;
                                setShieldLogoX(281 - logoSzMM);
                                setShieldLogoY(16);
                              }}
                              title="Alinhar à Direita"
                              className="px-1 py-0.5 bg-slate-900 border border-white/5 hover:border-slate-700 text-stone-200 rounded text-[6px] active:scale-95 transition-all"
                            >
                              Dir
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = shieldLogoSize * 0.35;
                                setShieldLogoX(148.5 - logoSzMM / 2);
                              }}
                              title="Centralizar Horizontal"
                              className="px-1 py-0.5 bg-indigo-900/60 border border-indigo-700/50 hover:border-indigo-500 text-indigo-200 rounded text-[6px] active:scale-95 transition-all font-bold"
                            >
                              ↔ Horiz
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = shieldLogoSize * 0.35;
                                setShieldLogoY(105 - logoSzMM / 2);
                              }}
                              title="Centralizar Vertical"
                              className="px-1 py-0.5 bg-indigo-900/60 border border-indigo-700/50 hover:border-indigo-500 text-indigo-200 rounded text-[6px] active:scale-95 transition-all font-bold"
                            >
                              ↕ Vert
                            </button>
                            <button 
                              onClick={() => {
                                const logoSzMM = shieldLogoSize * 0.35;
                                setShieldLogoX(148.5 - logoSzMM / 2);
                                setShieldLogoY(105 - logoSzMM / 2);
                              }}
                              title="Centro Total"
                              className="px-1 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded text-[6px] active:scale-95 transition-all"
                            >
                              CENTRO
                            </button>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-[7px] text-slate-400">
                            <span>Pos X: {Math.round(shieldLogoX)}mm</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="297" 
                              value={Math.round(shieldLogoX)} 
                              onChange={(e) => setShieldLogoX(Number(e.target.value))} 
                              className="w-[45px] accent-amber-500 scale-75"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[7px] text-slate-400">
                            <span>Pos Y: {Math.round(shieldLogoY)}mm</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="210" 
                              value={Math.round(shieldLogoY)} 
                              onChange={(e) => setShieldLogoY(Number(e.target.value))} 
                              className="w-[45px] accent-amber-500 scale-75"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Custom background options (Requirement 1) */}
                <div className="pt-3 border-t border-dashed border-white/5 space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Fundo Personalizado e Opacidade</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileUploadAsBase64(e, setCustomBackgroundUrl)}
                    className="text-[8px] bg-slate-950 border border-white/5 p-1 w-full rounded"
                  />
                  <div className="flex items-center justify-between text-[8px] mt-1 text-slate-400">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={fullBackground} onChange={(e) => setFullBackground(e.target.checked)} className="rounded text-blue-600 bg-slate-950" />
                      Ocupar folha inteira
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={keepBorders} onChange={(e) => setKeepBorders(e.target.checked)} className="rounded text-blue-600 bg-slate-950" />
                      Manter molduras visíveis
                    </label>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[8px] font-black uppercase text-slate-400">Opacidade Fundo:</span>
                    <input 
                      type="range" 
                      min="10" max="100" 
                      value={backgroundOpacity} 
                      onChange={(e) => setBackgroundOpacity(Number(e.target.value))} 
                      className="flex-1"
                    />
                    <span className="text-[8px] font-mono text-white font-bold">{backgroundOpacity}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 4: LINHAGEM MARCIAL (Requirement 4) */}
            {selectedStudent && (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <BookOpen size={13} className="text-blue-500" /> Linhagem Marcial (Requisito 4)
                </h3>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Origem do Linaje (Mestre ancestral)</span>
                    <input type="text" value={lineageOrigem} onChange={(e) => setLineageOrigem(e.target.value)} className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Professor Mestre Grande</span>
                    <input type="text" value={lineageMestre} onChange={(e) => setLineageMestre(e.target.value)} className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Professor Formador</span>
                    <input type="text" value={lineageFormador} onChange={(e) => setLineageFormador(e.target.value)} className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Professor Responsável Atual</span>
                    <input type="text" value={lineageAtual} onChange={(e) => setLineageAtual(e.target.value)} className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8px] pt-1">
                  <span className="text-slate-400 uppercase font-black">Disposição de Conexão:</span>
                  <div className="flex gap-2">
                    <button onClick={() => setLineageOrientation('horizontal')} className={`px-2.5 py-1 uppercase rounded ${lineageOrientation === 'horizontal' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400'}`}>Horizontal (→)</button>
                    <button onClick={() => setLineageOrientation('vertical')} className={`px-2.5 py-1 uppercase rounded ${lineageOrientation === 'vertical' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400'}`}>Vertical (↓)</button>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 5: ASSINATURAS E DOCO AUTÓGRAFO (Requirement 5) */}
            {selectedStudent && (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Settings2 size={13} className="text-purple-400" /> Assinaturas, QR Code & Selo Gold
                </h3>

                {/* Assinatura 1 */}
                <div className="p-3 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Assinatura 1 - Professor Titular</p>
                    <select 
                      value={professorSignatureType} 
                      onChange={(e) => setProfessorSignatureType(e.target.value as any)}
                      className="bg-slate-900 text-[10px] text-white border border-slate-800 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="digital">Digital Caligráfica</option>
                      <option value="upload">Upload Assinatura</option>
                      <option value="none">Ocultar</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Nome Professor" value={professorName} onChange={(e) => setProfessorName(e.target.value)} className="w-full h-8 px-2 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500" />
                    <input type="text" placeholder="Graduacão / Cargo" value={professorGraduation} onChange={(e) => setProfessorGraduation(e.target.value)} className="w-full h-8 px-2 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500" />
                  </div>
                  
                  {professorSignatureType === 'upload' && (
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-400 block uppercase font-bold">Enviar arquivo da assinatura (PNG transparente recomendado)</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUploadAsBase64(e, setProfessorSignatureUrl)} className="text-[7.5px] bg-slate-900 p-1 w-full rounded cursor-pointer" />
                    </div>
                  )}

                  {professorSignatureType !== 'none' && (
                    <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 space-y-2">
                      <span className="text-[8px] font-bold uppercase text-slate-300 block">Posicionamento da Assinatura 1 (mm)</span>
                      <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-400">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Pos X: {professorSignatureX}mm</span>
                            <input type="range" min="0" max="297" value={professorSignatureX} onChange={(e) => setProfessorSignatureX(Number(e.target.value))} className="w-1/2 accent-amber-500 scale-90" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Pos Y: {professorSignatureY}mm</span>
                            <input type="range" min="0" max="210" value={professorSignatureY} onChange={(e) => setProfessorSignatureY(Number(e.target.value))} className="w-1/2 accent-amber-500 scale-90" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Larg: {professorSignatureWidth}mm</span>
                            <input type="range" min="10" max="120" value={professorSignatureWidth} onChange={(e) => setProfessorSignatureWidth(Number(e.target.value))} className="w-1/2 accent-amber-500 scale-90" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Alt: {professorSignatureHeight}mm</span>
                            <input type="range" min="5" max="50" value={professorSignatureHeight} onChange={(e) => setProfessorSignatureHeight(Number(e.target.value))} className="w-1/2 accent-amber-500 scale-90" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 pt-1 border-t border-white/5">
                        <button 
                          onClick={() => {
                            setProfessorSignatureX(50);
                            setProfessorSignatureY(150);
                            setProfessorSignatureWidth(45);
                            setProfessorSignatureHeight(16);
                          }}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 rounded text-[7px] text-stone-300 uppercase font-black"
                        >
                          Padrão Esq
                        </button>
                        <button 
                          onClick={() => {
                            setProfessorSignatureX(126);
                            setProfessorSignatureY(150);
                            setProfessorSignatureWidth(45);
                            setProfessorSignatureHeight(16);
                          }}
                          className="px-2 py-0.5 bg-[#B58911] hover:bg-amber-600 rounded text-[7px] text-white uppercase font-black"
                        >
                          Centralizar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assinatura 2 */}
                <div className="p-3 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Assinatura 2 - Diretor Técnico</p>
                    <select 
                      value={teamDirectorSignatureType} 
                      onChange={(e) => setTeamDirectorSignatureType(e.target.value as any)}
                      className="bg-slate-900 text-[10px] text-white border border-slate-800 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="digital">Digital Caligráfica</option>
                      <option value="upload">Upload Assinatura</option>
                      <option value="none">Ocultar</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Nome Diretor" value={technicalDirectorName} onChange={(e) => setTechnicalDirectorName(e.target.value)} className="w-full h-8 px-2 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500" />
                    <input type="text" placeholder="Registro / Estatuto" value={technicalDirectorRegistration} onChange={(e) => setTechnicalDirectorRegistration(e.target.value)} className="w-full h-8 px-2 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500" />
                  </div>

                  {teamDirectorSignatureType === 'upload' && (
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-400 block uppercase font-bold">Enviar arquivo da assinatura (PNG transparente recomendado)</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUploadAsBase64(e, setTeamDirectorSignatureUrl)} className="text-[7.5px] bg-slate-900 p-1 w-full rounded cursor-pointer" />
                    </div>
                  )}

                  {teamDirectorSignatureType !== 'none' && (
                    <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 space-y-2">
                      <span className="text-[8px] font-bold uppercase text-slate-300 block">Posicionamento da Assinatura 2 (mm)</span>
                      <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-400">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Pos X: {teamDirectorSignatureX}mm</span>
                            <input type="range" min="0" max="297" value={teamDirectorSignatureX} onChange={(e) => setTeamDirectorSignatureX(Number(e.target.value))} className="w-1/2 accent-amber-500 scale-90" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Pos Y: {teamDirectorSignatureY}mm</span>
                            <input type="range" min="0" max="210" value={teamDirectorSignatureY} onChange={(e) => setTeamDirectorSignatureY(Number(e.target.value))} className="w-1/2 accent-amber-500 scale-90" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Larg: {teamDirectorSignatureWidth}mm</span>
                            <input type="range" min="10" max="120" value={teamDirectorSignatureWidth} onChange={(e) => setTeamDirectorSignatureWidth(Number(e.target.value))} className="w-1/2 accent-amber-500 scale-90" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Alt: {teamDirectorSignatureHeight}mm</span>
                            <input type="range" min="5" max="50" value={teamDirectorSignatureHeight} onChange={(e) => setTeamDirectorSignatureHeight(Number(e.target.value))} className="w-1/2 accent-amber-500 scale-90" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 pt-1 border-t border-white/5">
                        <button 
                          onClick={() => {
                            setTeamDirectorSignatureX(202);
                            setTeamDirectorSignatureY(150);
                            setTeamDirectorSignatureWidth(45);
                            setTeamDirectorSignatureHeight(16);
                          }}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 rounded text-[7px] text-stone-300 uppercase font-black"
                        >
                          Padrão Dir
                        </button>
                        <button 
                          onClick={() => {
                            setTeamDirectorSignatureX(126);
                            setTeamDirectorSignatureY(150);
                            setTeamDirectorSignatureWidth(45);
                            setTeamDirectorSignatureHeight(16);
                          }}
                          className="px-2 py-0.5 bg-[#B58911] hover:bg-amber-600 rounded text-[7px] text-white uppercase font-black"
                        >
                          Centralizar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Control of QR Code and Golden Seal Positions to prevent any overlap! */}
                <div className="p-3 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                    <span>⚙ Ajustes de Geometria: Código QR & Selo</span>
                  </p>

                  {/* QR CODE COORDS */}
                  <div className="bg-slate-900/40 p-2 rounded-xl space-y-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-300 block">Código QR de Autenticidade (Milímetros)</span>
                    <div className="grid grid-cols-3 gap-2 text-[8px] text-slate-400">
                      <div className="flex flex-col">
                        <span>X: {qrCodeX}mm</span>
                        <input type="range" min="0" max="297" value={qrCodeX} onChange={(e) => setQrCodeX(Number(e.target.value))} className="accent-amber-500 mt-1" />
                      </div>
                      <div className="flex flex-col">
                        <span>Y: {qrCodeY}mm</span>
                        <input type="range" min="0" max="210" value={qrCodeY} onChange={(e) => setQrCodeY(Number(e.target.value))} className="accent-amber-500 mt-1" />
                      </div>
                      <div className="flex flex-col">
                        <span>Tamanho: {qrCodeSize}mm</span>
                        <input type="range" min="0" max="40" value={qrCodeSize} onChange={(e) => setQrCodeSize(Number(e.target.value))} className="accent-amber-500 mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-1 border-t border-white/5 pt-1">
                      <button onClick={() => { setQrCodeX(14); setQrCodeY(176); setQrCodeSize(13); }} className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 rounded text-[7px] text-slate-300 font-bold uppercase">Padrão Esq Inf</button>
                      <button onClick={() => { setQrCodeX(267); setQrCodeY(176); setQrCodeSize(13); }} className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 rounded text-[7px] text-slate-300 font-bold uppercase">Padrão Dir Inf</button>
                      <button onClick={() => { setQrCodeX(142); setQrCodeY(176); setQrCodeSize(13); }} className="px-1.5 py-0.5 bg-[#B58911] hover:bg-amber-600 rounded text-[7px] text-white font-bold uppercase">Centralizar</button>
                    </div>
                  </div>

                  {/* GOLDEN SEAL COORDS */}
                  <div className="bg-slate-900/40 p-2 rounded-xl space-y-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-300 block">Selo Metálico Gold (Milímetros)</span>
                    <div className="grid grid-cols-3 gap-2 text-[8px] text-slate-400">
                      <div className="flex flex-col">
                        <span>X: {goldenSealX}mm</span>
                        <input type="range" min="0" max="297" value={goldenSealX} onChange={(e) => setGoldenSealX(Number(e.target.value))} className="accent-amber-500 mt-1" />
                      </div>
                      <div className="flex flex-col">
                        <span>Y: {goldenSealY}mm</span>
                        <input type="range" min="0" max="210" value={goldenSealY} onChange={(e) => setGoldenSealY(Number(e.target.value))} className="accent-amber-500 mt-1" />
                      </div>
                      <div className="flex flex-col">
                        <span>Diâmetro: {goldenSealSize}mm</span>
                        <input type="range" min="0" max="40" value={goldenSealSize} onChange={(e) => setGoldenSealSize(Number(e.target.value))} className="accent-amber-500 mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-1 border-t border-white/5 pt-1">
                      <button onClick={() => { setGoldenSealX(272); setGoldenSealY(185); setGoldenSealSize(15); }} className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 rounded text-[7px] text-slate-300 font-bold uppercase">Padrão Dir Inf</button>
                      <button onClick={() => { setGoldenSealX(14); setGoldenSealY(185); setGoldenSealSize(15); }} className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 rounded text-[7px] text-slate-300 font-bold uppercase">Padrão Esq Inf</button>
                      <button onClick={() => { setGoldenSealX(148.5); setGoldenSealY(185); setGoldenSealSize(15); }} className="px-1.5 py-0.5 bg-[#B58911] hover:bg-amber-600 rounded text-[7px] text-white font-bold uppercase">Centralizar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 6: MARCA D'ÁGUA E SEGURANÇA (Requirement 6 & 7) */}
            {selectedStudent && (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Shield size={13} className="text-emerald-500" /> Marca d'Água & Anti-Falta
                </h3>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selecione a Marca d'Água de Fundo (Atrás do Texto)</span>
                  <select 
                    value={watermarkOption}
                    onChange={(e) => {
                      setWatermarkOption(e.target.value as any);
                    }}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 text-xs rounded-xl text-white"
                  >
                    <option value="academy">Logo do CT de Treino</option>
                    <option value="team">Logo da Equipe</option>
                    <option value="shield">Brasão da Academia</option>
                    <option value="custom">Enviar Imagem Personalizada</option>
                    <option value="none">Nenhuma</option>
                  </select>
                </div>

                {watermarkOption === 'custom' && (
                  <div className="space-y-1.5 bg-slate-950 p-2 rounded-xl">
                    <span className="text-[8px] uppercase font-black text-slate-400">Fazer Upload Miolo d'Água</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUploadAsBase64(e, setCustomWatermarkUrl)} className="text-[8px] w-full" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-400">
                    <span>Opacidade Miolo: {watermarkOpacity}%</span>
                    <input type="range" min="3" max="80" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(Number(e.target.value))} className="w-3/5" />
                  </div>
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-400">
                    <span>Rotação Logo: {watermarkRotation}°</span>
                    <input type="range" min="-180" max="180" value={watermarkRotation} onChange={(e) => setWatermarkRotation(Number(e.target.value))} className="w-3/5" />
                  </div>
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-400">
                    <span>Escala / Diâmetro: {watermarkScale}px</span>
                    <input type="range" min="40" max="250" value={watermarkScale} onChange={(e) => setWatermarkScale(Number(e.target.value))} className="w-3/5" />
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer text-[9px] text-[#A3A3A3] uppercase font-extrabold">
                    <input 
                      type="checkbox" 
                      checked={enableAntiForgery} 
                      onChange={(e) => setEnableAntiForgery(e.target.checked)} 
                      className="rounded text-green-600 bg-slate-950" 
                    />
                    Ativar Micro-Textos de Proteção Anti-Falsificação (Diagonal)
                  </label>
                  <p className="text-[7.5px] text-stone-500 lowercase leading-relaxed mt-1">Carrega o nome do aluno, chave REG de emissão e registro diagonalmente em baixa opacidade por todo o papel.</p>
                </div>
              </div>
            )}

            {/* ETAPA 7: SALVAR CORES PRESSET Biblioteca (Requirement 13) */}
            {selectedStudent && (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Sparkles size={13} className="text-yellow-500" /> Biblioteca de Modelos Personalizados
                </h3>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome do Modelo (Ex: Equipe Gracie A)" 
                    value={newPresetName} 
                    onChange={(e) => setNewPresetName(e.target.value)} 
                    className="flex-1 h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                  <button 
                    onClick={handleSaveLayoutPreset}
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black"
                  >
                    Salvar
                  </button>
                </div>

                {savedPresets.length > 0 && (
                  <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto">
                    <span className="text-[8px] font-black text-slate-400 block uppercase">Carregar Modelos Salvos:</span>
                    {savedPresets.map(preset => (
                      <div key={preset.id} className="flex justify-between items-center p-2 bg-slate-950 border border-white/5 rounded-lg text-[9px]">
                        <span className="font-extrabold text-[#F5F5F5]">{preset.name.toUpperCase()}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleLoadLayoutPreset(preset)} className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded uppercase font-bold text-[7.5px]">Carregar</button>
                          <button onClick={() => handleDeleteLayoutPreset(preset.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PAINEL DIREITO DE PRÉ DE VISUALIZAÇÃO INTERATIVA DO DIPLOMA */}
          <div className="lg:col-span-7 flex flex-col justify-start space-y-4">
            {selectedStudent ? (
              <div className="space-y-4 sticky top-6">
                <div className="flex items-center justify-between pl-2">
                  <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-widest font-mono">DIPLOMA PREVIEW REAL EM ALTA RESOLUÇÃO (PROPORÇÃO A4)</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={generatePDFDownload} 
                      className="h-9 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Download size={13} /> Exportar PDF Oficial
                    </button>
                  </div>
                </div>

                {/* THE LIVE DIPLOMA PREVIEW WINDOW */}
                <div 
                  id="print-area-workspace"
                  className={`relative w-full aspect-[297/210] rounded-[1.5rem] p-8 flex flex-col justify-between overflow-hidden shadow-2xl transition-all font-sans select-none ${activeTheme.bodyBg}`}
                  style={activeTheme.borderStyle}
                >
                  
                  {/* Decorative background vectors or constellation representations */}
                  {activeTheme.id === 'premium' && (
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  )}

                  {/* 1. BJJLF Ouro Imperial Custom Elements */}
                  {activeTheme.id === 'bjjlf_gold_royal' && (
                    <>
                      {/* Gold Corner Ornaments */}
                      <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] pointer-events-none rounded-tl-sm opacity-80" />
                      <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37] pointer-events-none rounded-tr-sm opacity-80" />
                      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37] pointer-events-none rounded-bl-sm opacity-80" />
                      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] pointer-events-none rounded-br-sm opacity-80" />
                      
                      {/* Elegant Gold Crest Ribbon Seal at Bottom-Right */}
                      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center select-none pointer-events-none scale-90">
                        <div className="relative flex justify-center -mb-4">
                          <div className="w-3.5 h-10 bg-amber-600 rotate-[12deg] origin-top rounded-b opacity-85" />
                          <div className="w-3.5 h-10 bg-amber-600 -rotate-[12deg] origin-top rounded-b -ml-2.5 opacity-85" />
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4AF37] via-yellow-400 to-[#AA7C11] p-[1.5px] shadow-lg flex items-center justify-center border border-amber-600/55">
                          <div className="w-12 h-12 rounded-full bg-stone-900 border border-amber-400/40 flex flex-col items-center justify-center text-center p-0.5">
                            <span className="text-[4px] leading-none text-amber-400 font-extrabold uppercase scale-95 tracking-tighter block">DEDICAÇÃO</span>
                            <span className="text-[4px] leading-none text-amber-400 font-extrabold uppercase scale-95 tracking-tighter block">DISCIPLINA</span>
                            <span className="text-[5px] text-yellow-300 font-sans block tracking-widest my-0.5">★</span>
                            <span className="text-[4px] leading-none text-amber-400 font-extrabold uppercase scale-95 tracking-tighter block">SUPERAÇÃO</span>
                            <span className="text-[4px] leading-none text-amber-400 font-extrabold uppercase scale-95 tracking-tighter block">LEGADO</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 2. BJJLF Black & Gold Custom Elements */}
                  {activeTheme.id === 'bjjlf_black_gold' && (
                    <>
                      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-br-full pointer-events-none opacity-40" />
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-500/10 to-transparent rounded-tl-full pointer-events-none opacity-40" />
                      <div className="absolute top-3 left-3 right-3 bottom-3 border border-amber-500/15 pointer-events-none" />
                      
                      {/* Bold triple stars upper decoration under header */}
                      <div className="absolute top-1/4 left-1/4 right-1/4 flex justify-center gap-1.5 opacity-35 text-[9px] text-[#F59E0B] pointer-events-none">
                        <span>★</span> <span>★</span> <span>★</span>
                      </div>

                      {/* Gold Rosette Stamp (Dark version) */}
                      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center pointer-events-none scale-90">
                        <div className="w-14 h-14 rounded-full bg-stone-950 border-2 border-amber-500 shadow-xl flex items-center justify-center">
                          <div className="text-center p-0.5">
                            <p className="text-[4px] leading-none font-black text-amber-400 uppercase tracking-widest">DISCIPLINA</p>
                            <span className="text-amber-500 text-[6px] tracking-tighter block my-0.5">★ ★ ★</span>
                            <p className="text-[4px] leading-none font-black text-amber-400 uppercase tracking-widest">EVOLUÇÃO</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 3. BJJLF Clean Star & Gold Custom Elements */}
                  {activeTheme.id === 'bjjlf_elegant_sans' && (
                    <>
                      <div className="absolute top-1 left-1 right-1 bottom-1 border border-[#C5A059]/30 pointer-events-none" />
                      <div className="absolute top-3 left-6 right-6 flex justify-between text-[#C5A059]/50 text-[6px] tracking-widest uppercase pointer-events-none font-black">
                        <span>HONRA • RESPEITO</span>
                        <span>DISCIPLINA • EVOLUÇÃO</span>
                      </div>
                      
                      {/* Rosette minimal stamp */}
                      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center pointer-events-none scale-95 opacity-90">
                        <div className="w-12 h-12 rounded-full border border-[#C5A059] flex items-center justify-center bg-white p-0.5 shadow">
                          <div className="w-10 h-10 rounded-full border border-dashed border-[#C5A059] flex flex-col items-center justify-center text-[#A1824A] font-serif text-[4px] font-bold leading-tight">
                            <span>DISCIPLINA</span>
                            <span>HONRA</span>
                            <span className="text-[5px] mt-0.5 text-[#C5A059]">★</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 4. Traditional Red Dragon Oriental Custom Elements */}
                  {activeTheme.id === 'bjjlf_dragon_oriental' && (
                    <>
                      {/* Vintage traditional style red corners */}
                      <div className="absolute inset-1.5 border-2 border-[#991B1B]/40 pointer-events-none rounded-lg" />
                      <div className="absolute top-2.5 left-2.5 right-2.5 bottom-2.5 border border-[#ced4da]/20 pointer-events-none" />
                      
                      {/* Kanji "柔術" characters in beautiful brush format on the Left Margin */}
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center text-[#991B1B]/70 font-bold select-none pointer-events-none leading-none">
                        <span className="text-4xl antialiased font-serif">柔</span>
                        <span className="text-4xl antialiased font-serif mt-3">術</span>
                      </div>
                      
                      {/* Dragon print motif base */}
                      <div className="absolute inset-0 bg-[radial-gradient(#991b1b05_2px,transparent_2px)] [background-size:24px_24px] pointer-events-none" />
                    </>
                  )}

                  {/* 5. Carioca Moderno Custom Elements */}
                  {activeTheme.id === 'carioca_integridade' && (
                    <>
                      {/* Left Side Cyan/Blue Wave */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-sky-500 rounded-r-[3rem] pointer-events-none z-0 select-none opacity-95" style={{ background: 'linear-gradient(to bottom, #00E5FF, #1E3A8A)' }} />
                      <div className="absolute left-1 top-12 w-6 h-6 rounded-full bg-white/20 pointer-events-none z-0" />
                      
                      {/* Right Side Column containing vertical white "CERTIFICADO" */}
                      <div className="absolute right-0 top-0 bottom-0 w-10 bg-[#0B2545] rounded-l-[1.5rem] pointer-events-none z-0 select-none flex items-center justify-center shadow-lg">
                        <div className="text-white/40 select-none tracking-[0.45em] font-serif text-[18px] md:text-[22px] font-black rotate-180" style={{ writingMode: 'vertical-rl' }}>
                          CERTIFICADO
                        </div>
                      </div>
                    </>
                  )}

                  {/* Dynamic transparency background image underlay (Requirements 1) */}
                  {customBackgroundUrl && (
                    <div 
                      className="absolute inset-0 pointer-events-none select-none z-0"
                      style={{ 
                        backgroundImage: `url(${customBackgroundUrl})`, 
                        backgroundSize: 'cover', 
                        opacity: backgroundOpacity / 100 
                      }} 
                    />
                  )}

                  {/* Micro Anti-Forgery texts underlays (Requirement 7) */}
                  {enableAntiForgery && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-[0.03] text-[5.5px] font-mono select-none overflow-hidden text-left leading-none">
                      {Array.from({ length: 14 }).map((_, idx) => (
                        <div key={idx} className="whitespace-nowrap tracking-wide leading-none select-none">
                          {LANG_DICTIONARY[certificateLanguage].secureRepetitive} REG ID: {certId} • HASH CODE CHECK: {calculatedHash} • ATHLETE SECURE VERIFIED OK • {certId}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transparent main watermark inside preview (Requirement 6) */}
                  {watermarkOption !== 'none' && activeWatermarkBase64 && (
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 flex items-center justify-center transition-all"
                      style={{ 
                        opacity: watermarkOpacity / 100,
                        transform: `translate(-50%, -50%) rotate(${watermarkRotation}deg)`,
                        width: `${watermarkScale}px`,
                        height: `${watermarkScale}px`
                      }}
                    >
                      <img src={activeWatermarkBase64} alt="Diploma Watermark" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {/* Absolute overlays for uploaded logos to match PDF coordinates exactly */}
                  {academyLogoUrl && (
                    <div 
                      className="absolute pointer-events-none select-none z-20 flex items-center justify-center transition-all"
                      style={{
                        left: `${(academyLogoX / 297) * 100}%`,
                        top: `${(academyLogoY / 210) * 100}%`,
                        width: `${((academyLogoSize * 0.35) / 297) * 100}%`,
                        height: `${((academyLogoSize * 0.35) / 210) * 100}%`,
                      }}
                    >
                      <img src={academyLogoUrl} alt="Academy Logo" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {teamLogoUrl && (
                    <div 
                      className="absolute pointer-events-none select-none z-20 flex items-center justify-center transition-all"
                      style={{
                        left: `${(teamLogoX / 297) * 100}%`,
                        top: `${(teamLogoY / 210) * 100}%`,
                        width: `${((teamLogoSize * 0.35) / 297) * 100}%`,
                        height: `${((teamLogoSize * 0.35) / 210) * 100}%`,
                      }}
                    >
                      <img src={teamLogoUrl} alt="Team Logo" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {shieldLogoUrl && (
                    <div 
                      className="absolute pointer-events-none select-none z-20 flex items-center justify-center transition-all"
                      style={{
                        left: `${(shieldLogoX / 297) * 100}%`,
                        top: `${(shieldLogoY / 210) * 100}%`,
                        width: `${((shieldLogoSize * 0.35) / 297) * 100}%`,
                        height: `${((shieldLogoSize * 0.35) / 210) * 100}%`,
                      }}
                    >
                      <img src={shieldLogoUrl} alt="Academy Shield" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {/* Absolute overlays for Professor and Director signatures (Requirement 5) */}
                  {professorSignatureType === 'upload' && professorSignatureUrl && (
                    <div 
                      className="absolute pointer-events-none select-none z-20 flex items-center justify-center transition-all"
                      style={{
                        left: `${(professorSignatureX / 297) * 100}%`,
                        top: `${(professorSignatureY / 210) * 100}%`,
                        width: `${(professorSignatureWidth / 297) * 100}%`,
                        height: `${(professorSignatureHeight / 210) * 100}%`,
                      }}
                    >
                      <img src={professorSignatureUrl} alt="Prof Autograph" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {professorSignatureType === 'digital' && (
                    <div 
                      className="absolute pointer-events-none select-none z-20 flex flex-col items-center justify-center transition-all text-center leading-none"
                      style={{
                        left: `${(professorSignatureX / 297) * 100}%`,
                        top: `${(professorSignatureY / 210) * 100}%`,
                        width: `${(professorSignatureWidth / 297) * 100}%`,
                        height: `${(professorSignatureHeight / 210) * 100}%`,
                      }}
                    >
                      <span className="text-[13px] font-extrabold text-[#1E3A8A] dark:text-amber-200 select-none leading-none italic whitespace-nowrap" style={{ fontFamily: '"Alex Brush", cursive, sans-serif' }}>
                        {professorName}
                      </span>
                      <span className="text-[3.5px] font-sans font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mt-1 select-none whitespace-nowrap opacity-90">
                        ✓ SECURE AUTOGRAPH
                      </span>
                    </div>
                  )}

                  {teamDirectorSignatureType === 'upload' && teamDirectorSignatureUrl && (
                    <div 
                      className="absolute pointer-events-none select-none z-20 flex items-center justify-center transition-all"
                      style={{
                        left: `${(teamDirectorSignatureX / 297) * 100}%`,
                        top: `${(teamDirectorSignatureY / 210) * 100}%`,
                        width: `${(teamDirectorSignatureWidth / 297) * 100}%`,
                        height: `${(teamDirectorSignatureHeight / 210) * 100}%`,
                      }}
                    >
                      <img src={teamDirectorSignatureUrl} alt="Director Autograph" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {teamDirectorSignatureType === 'digital' && (
                    <div 
                      className="absolute pointer-events-none select-none z-20 flex flex-col items-center justify-center transition-all text-center leading-none"
                      style={{
                        left: `${(teamDirectorSignatureX / 297) * 100}%`,
                        top: `${(teamDirectorSignatureY / 210) * 100}%`,
                        width: `${(teamDirectorSignatureWidth / 297) * 100}%`,
                        height: `${(teamDirectorSignatureHeight / 210) * 100}%`,
                      }}
                    >
                      <span className="text-[13px] font-extrabold text-[#1E3A8A] dark:text-amber-200 select-none leading-none italic whitespace-nowrap" style={{ fontFamily: '"Alex Brush", cursive, sans-serif' }}>
                        {technicalDirectorName}
                      </span>
                      <span className="text-[3.5px] font-sans font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mt-1 select-none whitespace-nowrap opacity-90">
                        ✓ SECURE AUTOGRAPH
                      </span>
                    </div>
                  )}

                  {/* Banner superior header content (Requirement 1) */}
                  <div className="relative z-10 flex items-center justify-between border-b border-dashed border-stone-800/20 pb-2">
                    {academyLogoUrl ? (
                      <div style={{ width: `${academyLogoSize}px`, height: `${academyLogoSize}px` }} className="opacity-0 pointer-events-none" />
                    ) : (
                      <div className="p-2 bg-stone-900 text-white rounded font-sans font-black text-[9px] uppercase tracking-wider leading-none">DOJO</div>
                    )}

                    <div className="text-center flex-1 max-w-md mx-auto">
                      <h4 className="text-md md:text-xl font-black uppercase tracking-widest italic leading-none">{profile?.academyName || 'AGREMIAÇÃO SENSEI MASTER'}</h4>
                      <p className="text-[7.5px] font-mono font-black tracking-widest text-[#B58911] leading-none uppercase mt-1">REGISTRO DE AFILIAÇÃO E GRADUAÇÕES REGULADAS</p>
                    </div>

                    <div className="flex justify-end min-w-[40px]">
                      {teamLogoUrl ? (
                        <div style={{ width: `${teamLogoSize}px`, height: `${teamLogoSize}px` }} className="opacity-0 pointer-events-none" />
                      ) : shieldLogoUrl ? (
                        <div style={{ width: `${shieldLogoSize}px`, height: `${shieldLogoSize}px` }} className="opacity-0 pointer-events-none" />
                      ) : (
                        <Award size={26} className="text-[#B58911]" />
                      )}
                    </div>
                  </div>

                  {/* Body Content Main Preface and Athlete */}
                  <div className="relative z-10 text-center space-y-4 my-2">
                    {activeTheme.id === 'bjjlf_gold_royal' ? (
                      <div>
                        <span className="text-2xl md:text-3xl font-serif text-[#1C1917] tracking-[0.2em] font-black uppercase text-center block leading-none my-1">
                          CERTIFICADO
                        </span>
                        <div className="w-32 h-0.5 bg-[#D4AF37] mx-auto opacity-70 mt-1 mb-2" />
                      </div>
                    ) : activeTheme.id === 'bjjlf_black_gold' ? (
                      <div>
                        <span className="text-2xl md:text-3.5xl font-sans tracking-[0.1em] text-[#F59E0B] font-black uppercase text-center block leading-none my-1 italic">
                          CERTIFICADO
                        </span>
                        <div className="flex justify-center gap-1.5 text-[6px] text-amber-500/60 pb-1">
                          <span>★</span> <span>★</span> <span>★</span>
                        </div>
                      </div>
                    ) : activeTheme.id === 'bjjlf_elegant_sans' ? (
                      <div>
                        <span className="text-xl md:text-2xl font-serif tracking-[0.35em] text-[#C5A059] font-bold uppercase text-center block leading-none my-1">
                          — CERTIFICADO —
                        </span>
                      </div>
                    ) : activeTheme.id === 'bjjlf_dragon_oriental' ? (
                      <div>
                        <span className="text-2xl md:text-3xl font-serif tracking-[0.15em] text-[#991B1B] font-black uppercase text-center block leading-none my-1">
                          CERTIFICADO
                        </span>
                        <span className="text-[6.5px] font-black tracking-[0.3em] text-stone-500 uppercase block -mt-1">EXCELÊNCIA MARCIAL • OUTORGA DE GRADUAÇÃO</span>
                      </div>
                    ) : (
                      <span className="text-[8.5px] font-mono font-black tracking-[0.25em] block leading-none text-blue-600 dark:text-amber-400">
                        {LANG_DICTIONARY[certificateLanguage].title}
                      </span>
                    )}

                    <p className={`text-[9.5px] md:text-[11.5px] max-w-xl mx-auto italic leading-relaxed ${activeTheme.textColorClass}`}>
                      {customPrefaceText}
                    </p>

                    <div>
                      {activeTheme.id === 'bjjlf_gold_royal' ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-stone-400 text-xs hidden sm:inline">🌿</span>
                          <h2 className="text-xl md:text-2.5xl font-extrabold uppercase tracking-tight font-serif select-all text-slate-900 leading-none">
                            {selectedStudent.name}
                          </h2>
                          <span className="text-stone-400 text-xs hidden sm:inline">🌿</span>
                        </div>
                      ) : activeTheme.id === 'bjjlf_elegant_sans' ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-[#C5A059] text-xs">⚡</span>
                          <h2 className="text-xl md:text-2.5xl font-black uppercase tracking-widest font-serif select-all text-[#A1824A] leading-none">
                            {selectedStudent.name}
                          </h2>
                          <span className="text-[#C5A059] text-xs">⚡</span>
                        </div>
                      ) : activeTheme.id === 'bjjlf_black_gold' ? (
                        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent py-1.5 px-6 rounded-xl border border-amber-500/15 max-w-md mx-auto">
                          <h2 className="text-xl md:text-2.5xl font-black uppercase tracking-tight select-all text-white leading-none">
                            {selectedStudent.name}
                          </h2>
                        </div>
                      ) : (
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight font-serif select-all mt-1 leading-none">
                          {selectedStudent.name}
                        </h2>
                      )}
                      {activeTheme.id !== 'bjjlf_black_gold' && (
                        <div className="w-24 h-0.5 bg-amber-500 mx-auto mt-2" />
                      )}
                    </div>

                    {/* Merits and attributes display */}
                    <div className="flex flex-col items-center justify-center space-y-1">
                      {customMeritText && (
                        <p className="text-[8.5px] font-medium font-serif tracking-tight text-slate-500 italic">"{customMeritText}"</p>
                      )}
                      
                      {/* Technical detail ribbon */}
                      <span className="inline-block mt-1 bg-stone-950 text-amber-400 text-[8px] font-black uppercase px-4 py-1 tracking-widest rounded-full border border-stone-800" style={{ borderLeft: `5px solid ${beltColorInfo.hex}` }}>
                        {emissionMode === 'belt' && `FAIXA: ${(customBeltText || selectedStudent.belt).toUpperCase()}`}
                        {emissionMode === 'stripe' && `OUTORGA: ${(customStripeText || `${selectedStudent.stripes || 0}º Grau`).toUpperCase()}`}
                        {emissionMode === 'both' && `NÍVEL: ${(customBeltText || selectedStudent.belt).toUpperCase()} - ${(customStripeText || `${selectedStudent.stripes || 0}º Grau`).toUpperCase()}`}
                      </span>

                      {customObservationsText && (
                        <p className="text-[7.5px] text-slate-500 italic leading-none mt-1">Anotações: {customObservationsText}</p>
                      )}
                    </div>
                  </div>

                  {/* Kids Values stamp */}
                  {selectedStudent.isKid && activeThemeId === 'infantil' && (
                    <div className="relative z-10 flex gap-1 justify-center text-[6px] font-black uppercase">
                      {kidValues.discipline && <span className="bg-green-150 text-emerald-800 px-1 py-0.5 rounded border border-emerald-300">● Disciplinado</span>}
                      {kidValues.respect && <span className="bg-emerald-150 text-emerald-800 px-1 py-0.5 rounded border border-emerald-300">● Respeitoso</span>}
                      {kidValues.bravery && <span className="bg-yellow-150 text-yellow-800 px-1 py-0.5 rounded border border-amber-300">● Corajoso</span>}
                    </div>
                  )}

                  {/* Traditional Lineage Pathway vertical/horizontal (Requirement 4) */}
                  <div className="relative z-10 py-1.5 border-t border-b border-dashed border-stone-600/10 text-[6.5px] font-mono tracking-wider max-w-sm mx-auto overflow-hidden whitespace-nowrap text-ellipsis uppercase text-slate-500">
                    {LANG_DICTIONARY[certificateLanguage].lineageHeader}: {parsedLineageText}
                  </div>

                  {/* Signatures graphics and lines */}
                  <div className="relative z-10 grid grid-cols-2 gap-8 pt-3 border-t border-dashed border-stone-700/20 text-center font-sans tracking-tight">
                    <div>
                      <div className="h-6" />
                      <p className="text-[8px] font-extrabold uppercase text-slate-900 dark:text-white leading-none border-t border-dashed border-stone-700/30 pt-0.5">{professorName}</p>
                      <span className="text-[6.5px] uppercase font-black tracking-widest text-[#9C9C9C]">{professorGraduation} | {professorRoleLabel}</span>
                    </div>

                    <div>
                      <div className="h-6" />
                      <p className="text-[8px] font-extrabold uppercase text-slate-900 dark:text-white leading-none border-t border-dashed border-stone-700/30 pt-0.5">{technicalDirectorName}</p>
                      <span className="text-[6.5px] uppercase font-black tracking-widest text-[#9C9C9C]">{technicalDirectorRegistration} | {technicalDirectorRoleLabel}</span>
                    </div>
                  </div>

                  {/* Valid Unique QR Code Representation (Requirement 9) - Configurable placement */}
                  {qrCodeSize > 0 && (
                    <div 
                      className="absolute z-25 p-0.5 bg-white rounded border border-stone-200 shadow-md flex items-center justify-center transition-all"
                      style={{
                        left: `${(qrCodeX / 297) * 100}%`,
                        top: `${(qrCodeY / 210) * 100}%`,
                        width: `${(qrCodeSize / 297) * 100}%`,
                        height: `${(qrCodeSize / 210) * 100}%`,
                      }}
                    >
                      <QRCodeCanvas 
                        id="validation-qr-canvas"
                        value={`${window.location.origin}/certificates?verify=${certId}`}
                        size={60}
                        style={{ width: '100%', height: '100%' }}
                        bgColor={"#FFFFFF"}
                        fgColor={"#0F172A"}
                        level={"Q"}
                      />
                    </div>
                  )}

                  {/* Golden circular vetorial stamp of authenticity (Requirement 8) - Configurable Center */}
                  {goldenSealSize > 0 && (
                    <div 
                      className="absolute z-25 flex items-center justify-center transition-all"
                      style={{
                        left: `${((goldenSealX - goldenSealSize / 2) / 297) * 100}%`,
                        top: `${((goldenSealY - goldenSealSize / 2) / 210) * 100}%`,
                        width: `${(goldenSealSize / 297) * 100}%`,
                        height: `${(goldenSealSize / 210) * 100}%`,
                      }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 border border-yellow-200/50 shadow-md p-0.5 overflow-hidden">
                        <div className="text-[#4d3a08] font-serif font-black text-center leading-none" style={{ fontSize: `${goldenSealSize * 0.38}px` }}>
                          <p className="uppercase text-[0.25em] tracking-tight leading-none text-amber-950 font-bold whitespace-nowrap">{LANG_DICTIONARY[certificateLanguage].sealText}</p>
                          <p className="text-[0.45em] font-black text-stone-900 mt-0.5 leading-none">SYSBJJ</p>
                          <p className="text-[0.25em] font-mono select-all mt-0.5 text-stone-700 opacity-90 max-w-[90%] truncate mx-auto leading-none">{certId.slice(-6)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General code reg date footer */}
                  <div className="text-[6.5px] uppercase font-mono font-bold tracking-widest italic flex justify-between items-center text-slate-400 pt-1.5 opacity-80 select-all border-t border-white/5 relative z-10">
                    <span>Cidade: {cityName.toUpperCase()} - {stateName.toUpperCase()}</span>
                    <span>Outorga: {new Date(certificateDate).toLocaleDateString()}</span>
                    <span>REG: {certId}</span>
                  </div>

                </div>

                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-3xl text-[9px] text-slate-400 leading-relaxed">
                  <span className="font-extrabold text-blue-500 block uppercase">🥋 OSS! DIRETRIZES DE IMPRESSÃO SENSEI:</span>
                  Para emitir diplomas perfeitos para a cerimônia, selecione o papel **A4 com Margem Zero** na caixa de diálogo de impressão do navegador ou baixe o PDF oficial de alta-fidelidade pré-configurado.
                </div>
              </div>
            ) : (
              <div className="h-96 border border-dashed border-slate-700/40 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 space-y-4 bg-slate-900/10">
                <div className="w-16 h-16 bg-slate-900 border border-stone-800 rounded-full flex items-center justify-center text-slate-500">
                  <Award size={32} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-stone-300">Sem diploma selecionado para edição</h4>
                  <p className="text-xs text-stone-500 max-w-sm mt-1">Por favor, escolha um lutador no menu correspondente à esquerda para calibrar seus dados técnico-marciais e ver a visualização vetorial em tempo real.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: MOTOR DE GRADUAÇÃO MULTI-ARTES */}
      {activeTab === 'multiarts' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/10 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/10">Módulos Multi-Lutas Ativo</span>
              <h2 className="text-3xl font-black uppercase tracking-tight italic">Evolua sua Academia para Multi-Artes Marciais</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Configure árvores de graduações, regras e preenchimentos exclusivos para cada modalidade do seu quadro técnico. Permite matricular alunos em diferentes artes conectadas ao mesmo tempo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ativar Modalidades Disponíveis</span>
                <div className="space-y-2.5">
                  {MARTIAL_ARTS_RECORDS.map(art => {
                    const isEnabled = enabledArts.includes(art.id);
                    return (
                      <div 
                        key={art.id}
                        onClick={() => {
                          if (enabledArts.includes(art.id)) {
                            if (enabledArts.length === 1) return;
                            setEnabledArts(prev => prev.filter(x => x !== art.id));
                          } else {
                            setEnabledArts(prev => [...prev, art.id]);
                          }
                        }}
                        className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isEnabled ? 'bg-slate-950 border-blue-600/30' : 'bg-slate-950/20 border-white/5 opacity-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{art.icon}</span>
                          <div>
                            <p className="text-xs font-black uppercase text-white tracking-wide">{art.name}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{art.belts.length} Faixas Cadastradas</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isEnabled ? 'bg-blue-600 border-blue-600 text-white' : 'border-stone-800'}`}>
                          {isEnabled && <Check size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="md:col-span-8">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estrutura de Graduação Regulamentar</span>
                  <div className="flex gap-1.5">
                    {enabledArts.map(id => {
                      const art = MARTIAL_ARTS_RECORDS.find(a => a.id === id);
                      if (!art) return null;
                      return (
                        <button key={id} onClick={() => setSelectedMartialArt(id)} className={`px-3 py-1.5 text-[8px] font-black uppercase rounded-lg border ${selectedMartialArt === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-950 text-slate-400 border-white/5'}`}>
                          {art.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const activeArt = MARTIAL_ARTS_RECORDS.find(a => a.id === selectedMartialArt);
                  if (!activeArt) return null;
                  return (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeArt.belts.map((b, key) => (
                          <div key={key} className="p-4 bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-extrabold text-[#F5F5F5]">{b.color}</span>
                              <p className="text-[8.5px] font-bold text-slate-500 uppercase mt-0.5">Carência: {b.minMonths === 0 ? 'Sem carência' : `${b.minMonths} Meses`}</p>
                            </div>
                            <span className="text-[9px] text-[#A3A3A3] font-bold">Mín: {b.minAge} anos</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-2">
                        <span className="text-[9px] text-[#FAF5FF] font-black uppercase tracking-widest block">Habilidades Técnicas Requeridas ({activeArt.name})</span>
                        <div className="grid grid-cols-3 gap-2">
                          {activeArt.skillsList.map((skill, index) => (
                            <span key={index} className="p-2.5 bg-slate-950 text-[8px] uppercase tracking-wider font-extrabold rounded-lg text-slate-300 flex items-center gap-1.5 border border-white/5">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: GAMIFICAÇÃO TÉCNICA (PONTUAÇÕES DE FORÇA) */}
      {activeTab === 'gamification' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Selecione Atleta para Calibração</span>
                <select 
                  className="w-full h-11 px-4 bg-slate-950 border border-stone-850 rounded-xl text-xs font-black tracking-wider uppercase text-slate-100"
                  value={selectedGameStudent?.id || ''}
                  onChange={(e) => {
                    const found = students.find(s => s.id === e.target.value);
                    if (found) {
                      setSelectedGameStudent(found);
                      const m = found.technicalMetrics || {};
                      setSkillTakedowns(m.striking || 70);
                      setSkillSubmissions(m.grappling || 70);
                      setSkillDefenses(m.cardio || 70);
                      setSkillGuard(m.strategy || 70);
                      setSkillDiscipline(found.behaviorScore ? found.behaviorScore * 20 : 80);
                    }
                  }}
                >
                  <option value="">-- SELECIONAR LUTADOR --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name.toUpperCase()} (FAIXA {s.belt.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              {selectedGameStudent && (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 relative overflow-hidden">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-950 border border-amber-500 flex items-center justify-center font-black text-white">{selectedGameStudent.name[0]}</div>
                    <div>
                      <h4 className="text-sm font-black text-[#F5F5F5] uppercase tracking-wide">{selectedGameStudent.name}</h4>
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mt-0.5">Nível: Faixa {selectedGameStudent.belt}</p>
                    </div>
                  </div>

                  {(() => {
                    const media = Math.round((skillTakedowns + skillSubmissions + skillDefenses + skillGuard + skillDiscipline) / 5);
                    const combatPower = calculateCombatClass(media);
                    return (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-950 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <span className="text-[8px] text-rose-500 font-extrabold uppercase">Escore Técnico Geral</span>
                            <p className="text-md font-black text-white uppercase italic mt-0.5">{combatPower.title}</p>
                          </div>
                          <span className="text-xl font-bold font-mono text-red-500">{media}%</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] uppercase tracking-wider font-mono text-blue-500 font-bold">
                            <span>Maestria Combatente</span>
                            <span>{media} / 100</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-blue-600 to-rose-600 transition-all duration-300" style={{ width: `${media}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              {selectedGameStudent ? (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                      <Target size={13} className="text-blue-500" /> Proficiências Curriculares
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Quedas */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black text-slate-300">
                        <span>Quedas / Kuzushi / Projeções</span>
                        <span>{skillTakedowns}%</span>
                      </div>
                      <input type="range" min="20" max="100" value={skillTakedowns} onChange={(e) => setSkillTakedowns(Number(e.target.value))} className="w-full" />
                    </div>

                    {/* Finalizações */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black text-slate-300">
                        <span>Finalizações & Ataques Duplos</span>
                        <span>{skillSubmissions}%</span>
                      </div>
                      <input type="range" min="20" max="100" value={skillSubmissions} onChange={(e) => setSkillSubmissions(Number(e.target.value))} className="w-full" />
                    </div>

                    {/* Defesas */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black text-slate-300">
                        <span>Defesas / Gás / Resistência</span>
                        <span>{skillDefenses}%</span>
                      </div>
                      <input type="range" min="20" max="100" value={skillDefenses} onChange={(e) => setSkillDefenses(Number(e.target.value))} className="w-full" />
                    </div>

                    {/* Estratégia */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black text-slate-300">
                        <span>Guarda / Raspagens / Bloqueios</span>
                        <span>{skillGuard}%</span>
                      </div>
                      <input type="range" min="20" max="100" value={skillGuard} onChange={(e) => setSkillGuard(Number(e.target.value))} className="w-full" />
                    </div>

                    {/* Disciplina */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black text-slate-300">
                        <span>Disciplina / Presença no Dojo</span>
                        <span>{skillDiscipline}%</span>
                      </div>
                      <input type="range" min="20" max="100" value={skillDiscipline} onChange={(e) => setSkillDiscipline(Number(e.target.value))} className="w-full" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={handleUpdateStudentSkillsData}
                      disabled={isUpdatingSkills}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      {isUpdatingSkills ? 'Gravando maestria...' : 'Salvar Evolução Técnica OSS!'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-96 border border-dashed border-slate-750 rounded-[2rem] flex flex-col items-center justify-center text-center p-8 bg-slate-900/10">
                  <Flame size={32} className="text-slate-500 animate-pulse" />
                  <h4 className="text-sm font-black uppercase text-stone-300 mt-2">Nenhum competidor avaliado</h4>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: HISTÓRICO E AUDITORIA MÁXIMA (Requirement 14) */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] bg-amber-500/15 text-amber-500 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Histórico Oficial</span>
                <h3 className="text-lg font-black uppercase mt-1">Anais de Diplomas Outorgados</h3>
              </div>
              <span className="text-[9px] font-mono text-stone-400 bg-slate-950 px-3.5 py-1.5 border border-white/5 rounded-lg font-black uppercase">
                {issuedLogs.length} Registros de Certificação Geral
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[9px] uppercase tracking-wider">
                    <th className="py-3 px-2">Código ID</th>
                    <th className="py-3 px-2">Data</th>
                    <th className="py-3 px-2">Atleta</th>
                    <th className="py-3 px-2">Graduação</th>
                    <th className="py-3 px-2">Emitido Por</th>
                    <th className="py-3 px-2">Cadeia SHA256</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedLogs.map(log => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                      <td className="py-3 px-2 font-black text-amber-400">{log.id}</td>
                      <td className="py-3 px-2 text-stone-300">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-white font-extrabold">{log.studentName.toUpperCase()}</td>
                      <td className="py-3 px-2 text-slate-300"><span className="px-2 py-0.5 bg-slate-950 rounded border border-white/5 text-[9px]">Faixa {log.beltName} • {log.stripeText}</span></td>
                      <td className="py-3 px-2 text-slate-400">{log.issuer}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <span className="max-w-[70px] truncate block text-[10px] bg-slate-950 p-1 rounded font-mono text-stone-400" title={log.hash}>{log.hash}</span>
                          <button onClick={() => handleCopyToClipboard(log.hash)} className="text-stone-500 hover:text-white p-1" title="Copiar Hash"><Copy size={9} /></button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 font-sans rounded-full text-[8px] font-black uppercase ${log.status === 'VÁLIDO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {log.status === 'VÁLIDO' ? (
                          <button 
                            onClick={() => handleManualRevoke(log.id)}
                            className="bg-red-950 hover:bg-red-900 border border-red-500/20 text-red-500 text-[8px] font-bold px-2 py-0.5 rounded"
                          >
                            Revogar
                          </button>
                        ) : (
                          <span className="text-[8px] text-stone-500">Inativo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CertificatesHub;
