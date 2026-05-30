
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CalendarCheck, 
  Timer, 
  Trophy, 
  Settings,
  MessageSquare,
  BarChart3,
  BookOpenCheck,
  Calendar,
  Shield,
  BookOpen,
  Store,
  Clock,
  TrendingUp,
  ShieldCheck,
  Award
} from 'lucide-react';

export const MASTER_ADMINS = ['pedro.honorio@gm.rio'];

const MASTER_EMAIL = "pedro.honorio@gm.rio";

export const isMasterAdmin = (email?: string) => {
  return email?.toLowerCase() === MASTER_EMAIL.toLowerCase();
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} className="text-blue-500" /> },
  { id: 'students', label: 'Alunos', icon: <Users size={20} className="text-indigo-500" /> },
  { id: 'promotions', label: 'Graduação', icon: <Trophy size={20} className="text-yellow-500" /> },
  { id: 'dojo', label: 'Dojo de Ensino', icon: <BookOpenCheck size={20} className="text-purple-500" /> },
  { id: 'finances', label: 'Financeiro', icon: <CreditCard size={20} className="text-emerald-500" /> },
  { id: 'agenda', label: 'Agenda', icon: <CalendarCheck size={20} className="text-rose-500" /> },
  { id: 'reports', label: 'Relatórios', icon: <BarChart3 size={20} className="text-indigo-500" /> },
  { id: 'certificates', label: 'Certificados', icon: <Award size={20} className="text-amber-500" /> },
  { id: 'settings', label: 'Configurações', icon: <Settings size={20} className="text-slate-500" /> },
];

export const BELT_COLORS: Record<string, string> = {
  // Adulto (16+)
  'White': 'bg-white text-slate-800 border border-slate-200',
  'Blue': 'bg-blue-600 text-white shadow-sm',
  'Purple': 'bg-purple-700 text-white shadow-sm',
  'Brown': 'bg-amber-900 text-white shadow-sm',
  'Black': 'bg-slate-900 text-white border-r-8 border-red-600',
  'Red-Black': 'bg-gradient-to-r from-red-600 to-slate-900 text-white border border-slate-700', 
  'Red-White': 'bg-gradient-to-r from-red-600 to-white text-slate-900 border border-red-200', 
  'Red': 'bg-red-600 text-white shadow-lg border-r-8 border-yellow-500',
  
  // Português equivalents
  'Branca': 'bg-white text-slate-800 border border-slate-200',
  'Cinza': 'bg-slate-400 text-white shadow-sm',
  'Amarela': 'bg-yellow-400 text-slate-900 shadow-sm',
  'Laranja': 'bg-orange-500 text-white shadow-sm',
  'Verde': 'bg-green-600 text-white shadow-sm',
  'Azul': 'bg-blue-600 text-white shadow-sm',
  'Roxa': 'bg-purple-700 text-white shadow-sm',
  'Marrom': 'bg-amber-900 text-white shadow-sm',
  'Preta': 'bg-slate-900 text-white border-r-8 border-red-600',
  'Coral': 'bg-gradient-to-r from-red-600 to-slate-900 text-white border border-slate-700',
  'Vermelha': 'bg-red-600 text-white shadow-lg border-r-8 border-yellow-500',

  // Kids (Até 15 anos)
  'White-Gray': 'bg-white text-slate-600 border-x-8 border-slate-400',
  'Gray': 'bg-slate-400 text-white shadow-sm',
  'Gray-Black': 'bg-slate-400 text-white border-r-8 border-slate-900',
  'White-Yellow': 'bg-white text-yellow-600 border-x-8 border-yellow-400',
  'Yellow': 'bg-yellow-400 text-slate-900 shadow-sm',
  'Black-Yellow': 'bg-yellow-400 text-slate-900 border-r-8 border-slate-900',
  'White-Orange': 'bg-white text-orange-600 border-x-8 border-orange-400',
  'Orange': 'bg-orange-500 text-white shadow-sm',
  'Black-Orange': 'bg-orange-500 text-white border-r-8 border-slate-900',
  'White-Green': 'bg-white text-green-600 border-x-8 border-green-400',
  'Green': 'bg-green-600 text-white shadow-sm',
  'Black-Green': 'bg-green-600 text-white border-r-8 border-slate-900',
};

export const ADULT_BELTS = ['White', 'Blue', 'Purple', 'Brown', 'Black', 'Red-Black', 'Red-White', 'Red', 'Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'];
export const KIDS_BELTS = [
  'White', 'Branca',
  'White-Gray', 'Gray', 'Cinza', 'Gray-Black', 
  'White-Yellow', 'Yellow', 'Amarela', 'Black-Yellow', 
  'White-Orange', 'Orange', 'Laranja', 'Black-Orange', 
  'White-Green', 'Green', 'Verde', 'Black-Green'
];

export const PIX_CONFIG = {
  key: 'financeiro@sysbjj.com.br',
  name: 'SYSBJJ ACADEMY',
  city: 'SAO PAULO'
};

export const IBJJF_BELT_RULES: Record<string, { minTimeMonths: number, minAge: number }> = {
  // Adulto
  'White': { minTimeMonths: 0, minAge: 0 },
  'Blue': { minTimeMonths: 24, minAge: 16 },
  'Purple': { minTimeMonths: 18, minAge: 16 }, 
  'Brown': { minTimeMonths: 12, minAge: 18 },
  'Black': { minTimeMonths: 36, minAge: 19 },
  'Red-Black': { minTimeMonths: 84, minAge: 50 },
  'Red-White': { minTimeMonths: 84, minAge: 57 },
  'Red': { minTimeMonths: 120, minAge: 67 },
  
  // Português equivalents
  'Branca': { minTimeMonths: 0, minAge: 0 },
  'Azul': { minTimeMonths: 24, minAge: 16 },
  'Roxa': { minTimeMonths: 18, minAge: 16 },
  'Marrom': { minTimeMonths: 12, minAge: 18 },
  'Preta': { minTimeMonths: 36, minAge: 19 },
  'Coral': { minTimeMonths: 84, minAge: 50 },
  'Vermelha': { minTimeMonths: 120, minAge: 67 },

  // Kids (Orientativo IBJJF)
  'White-Gray': { minTimeMonths: 0, minAge: 4 },
  'Gray': { minTimeMonths: 12, minAge: 4 },
  'Cinza': { minTimeMonths: 12, minAge: 4 },
  'Gray-Black': { minTimeMonths: 12, minAge: 4 },
  'White-Yellow': { minTimeMonths: 12, minAge: 7 },
  'Yellow': { minTimeMonths: 12, minAge: 7 },
  'Amarela': { minTimeMonths: 12, minAge: 7 },
  'Black-Yellow': { minTimeMonths: 12, minAge: 7 },
  'White-Orange': { minTimeMonths: 12, minAge: 10 },
  'Orange': { minTimeMonths: 12, minAge: 10 },
  'Laranja': { minTimeMonths: 12, minAge: 10 },
  'Black-Orange': { minTimeMonths: 12, minAge: 10 },
  'White-Green': { minTimeMonths: 12, minAge: 13 },
  'Green': { minTimeMonths: 12, minAge: 13 },
  'Verde': { minTimeMonths: 12, minAge: 13 },
  'Black-Green': { minTimeMonths: 12, minAge: 13 },
};

export const SUBSCRIPTION_PLANS = [
  {
    id: "FREE",
    name: "Plano Gratuito",
    students: 20,
    price: 0,
    nonprofit: false,
    tagline: "Ideal para professores iniciando seu primeiro dojo.",
    features: [
      "Até 20 alunos ativos",
      "Gestão de treinos & chamada",
      "Grade de horários básica",
      "Presença em tempo real",
      "Visualização estática"
    ]
  },
  {
    id: "BRONZE",
    name: "Plano Bronze",
    students: 50,
    price: 20,
    nonprofit: false,
    tagline: "Para academias em consolidação e crescimento constante.",
    features: [
      "Até 50 alunos ativos",
      "Relatórios de caixa básicos",
      "Controle financeiro integrado",
      "Biblioteca completa de técnicas",
      "Selo bronze de integridade"
    ]
  },
  {
    id: "SILVER",
    name: "Plano Silver",
    students: 80,
    price: 30,
    nonprofit: false,
    tagline: "Para grandes dojos que exigem escala e gestão sólida.",
    features: [
      "Até 80 alunos ativos",
      "Business Hub (LTV & Churn)",
      "Notificações adicionais",
      "Suporte prioritário do Sensei",
      "Indicadores de presença reais"
    ]
  },
  {
    id: "BLACK_BELT",
    name: "Plano Black Belt",
    students: 999999,
    price: 50,
    nonprofit: false,
    tagline: "Acesso total sem restrições. O ápice do ecossistema.",
    features: [
      "Alunos e cadastros ILIMITADOS",
      "Certificação SYSBJJ inclusa",
      "Inteligência Preditiva IA ativa",
      "Suporte VIP via WhatsApp",
      "Sistema multi-professor completo"
    ]
  },
  {
    id: "SOCIAL_PROJECT",
    name: "Projeto Social",
    students: 999999,
    price: 0,
    nonprofit: true,
    tagline: "Sistema gratuito para projetos sociais e instituições sem fins lucrativos.",
    features: [
      "Cadastro ilimitado de atletas sociais",
      "Isenção total de pagamentos do software",
      "Relatórios e declarações de presença públicas",
      "Dojo inclusivo e transformador",
      "Suporte exclusivo"
    ]
  }
];

export const BILLING_CYCLES = [
  {
    id: "MONTHLY",
    label: "Mensal",
    months: 1
  },
  {
    id: "QUARTERLY",
    label: "Trimestral",
    months: 3
  },
  {
    id: "SEMIANNUAL",
    label: "Semestral",
    months: 6
  },
  {
    id: "YEARLY",
    label: "Anual",
    months: 12
  }
];

