
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
  Medal,
  Store,
  Calendar,
  Shield,
  BookOpen,
  Radio
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} /> },
  { id: 'students', label: 'Alunos', icon: <Users size={20} /> },
  { id: 'classes', label: 'Turmas', icon: <Calendar size={20} /> },
  { id: 'business', label: 'Hub de Negócios', icon: <Store size={20} /> },
  { id: 'curriculum', label: 'Quadro de Trabalho do Dia (QTD)', icon: <BookOpenCheck size={20} /> },
  { id: 'attendance', label: 'Chamada', icon: <CalendarCheck size={20} /> },
  { id: 'promotions', label: 'Graduação', icon: <Trophy size={20} /> },
  { id: 'kids', label: 'Pequenos Guerreiros', icon: <Medal size={20} /> },
  { id: 'kimonos', label: 'Loja PPH', icon: <Store size={20} /> },
  { id: 'music', label: 'Som do Tatame', icon: <Radio size={20} /> },
  { id: 'ibjjf-rules', label: 'Regras IBJJF', icon: <Shield size={20} /> },
  { id: 'timer', label: 'Cronômetro', icon: <Timer size={20} /> },
  { id: 'assistant', label: 'Coach IA', icon: <MessageSquare size={20} /> },
  { id: 'audit', label: 'Auditoria', icon: <BarChart3 size={20} /> },
  { id: 'settings', label: 'Sistema', icon: <Settings size={20} /> },
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

export const PIX_CONFIG = {
  key: 'financeiro@pphbjj.com.br',
  name: 'PPH BJJ ACADEMY',
  city: 'SAO PAULO'
};

export const IBJJF_BELT_RULES: Record<string, { minTimeMonths: number, minAge: number }> = {
  'White': { minTimeMonths: 0, minAge: 0 },
  'Blue': { minTimeMonths: 24, minAge: 16 },
  'Purple': { minTimeMonths: 18, minAge: 16 }, // 18 months for 18+, 12 months for 17
  'Brown': { minTimeMonths: 12, minAge: 18 },
  'Black': { minTimeMonths: 36, minAge: 19 }, // Time for 1st degree
  'Red-Black': { minTimeMonths: 84, minAge: 50 }, // 7 years in 6th degree
  'Red-White': { minTimeMonths: 84, minAge: 57 }, // 7 years in 7th degree
  'Red': { minTimeMonths: 120, minAge: 67 }, // 10 years in 8th degree
};
