
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
  TrendingUp
} from 'lucide-react';

export const MASTER_ADMINS = ['dashfire@gmail.com'];

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} className="text-blue-500" /> },
  { id: 'students', label: 'Alunos', icon: <Users size={20} className="text-indigo-500" /> },
  { id: 'teaching-hub', label: 'Hube de Ensino', icon: <BookOpenCheck size={20} className="text-purple-500" /> },
  { id: 'performance', label: 'HUB de Performance', icon: <TrendingUp size={20} className="text-blue-600" /> },
  { id: 'business', label: 'Hub de Negócios', icon: <Store size={20} className="text-amber-500" /> },
  { id: 'attendance', label: 'Chamada', icon: <CalendarCheck size={20} className="text-rose-500" /> },
  { id: 'finances', label: 'Financeiro', icon: <CreditCard size={20} className="text-emerald-400" /> },
  { id: 'history', label: 'Histórico', icon: <Clock size={20} className="text-gray-500" /> },
  { id: 'promotions', label: 'Graduação', icon: <Trophy size={20} className="text-yellow-500" /> },
  { id: 'ibjjf-rules', label: 'Regras IBJJF', icon: <Shield size={20} className="text-slate-500" /> },
  { id: 'timer', label: 'Cronômetro', icon: <Timer size={20} className="text-red-500" /> },
  { id: 'audit', label: 'Auditoria', icon: <BarChart3 size={20} className="text-cyan-500" /> },
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

export const ADULT_BELTS = ['White', 'Blue', 'Purple', 'Brown', 'Black', 'Red-Black', 'Red-White', 'Red'];
export const KIDS_BELTS = [
  'White', 
  'White-Gray', 'Gray', 'Gray-Black', 
  'White-Yellow', 'Yellow', 'Black-Yellow', 
  'White-Orange', 'Orange', 'Black-Orange', 
  'White-Green', 'Green', 'Black-Green'
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
  
  // Kids (Orientativo IBJJF)
  'White-Gray': { minTimeMonths: 0, minAge: 4 },
  'Gray': { minTimeMonths: 12, minAge: 4 },
  'Gray-Black': { minTimeMonths: 12, minAge: 4 },
  'White-Yellow': { minTimeMonths: 12, minAge: 7 },
  'Yellow': { minTimeMonths: 12, minAge: 7 },
  'Black-Yellow': { minTimeMonths: 12, minAge: 7 },
  'White-Orange': { minTimeMonths: 12, minAge: 10 },
  'Orange': { minTimeMonths: 12, minAge: 10 },
  'Black-Orange': { minTimeMonths: 12, minAge: 10 },
  'White-Green': { minTimeMonths: 12, minAge: 13 },
  'Green': { minTimeMonths: 12, minAge: 13 },
  'Black-Green': { minTimeMonths: 12, minAge: 13 },
};
