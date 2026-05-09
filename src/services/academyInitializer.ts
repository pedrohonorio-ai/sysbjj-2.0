import { Student, ClassSchedule, Plan, PaymentReceipt, BeltColor, StudentStatus } from '../types';

export const INITIAL_STUDENTS: Omit<Student, 'id'>[] = [
  {
    name: "Mestre Exemplo",
    belt: BeltColor.BLACK,
    isKid: false,
    status: StudentStatus.ACTIVE,
    attendanceCount: 150,
    rulesKnowledge: 100,
    rewardPoints: 500,
    planId: "PLAN-BLACK",
    lastPromotionDate: "2023-01-01",
    currentStreak: 5,
    email: "mestre@exemplo.com",
    phone: "(11) 99999-9999",
    stripes: 4,
    monthlyValue: 120,
    dueDay: 10,
    birthDate: "1980-05-15",
    isInstructor: true
  },
  {
    name: "Aluno Iniciante",
    belt: BeltColor.WHITE,
    isKid: false,
    status: StudentStatus.ACTIVE,
    attendanceCount: 15,
    rulesKnowledge: 20,
    rewardPoints: 50,
    planId: "PLAN-FLEX",
    lastPromotionDate: "2024-03-01",
    currentStreak: 2,
    email: "aluno@exemplo.com",
    phone: "(11) 88888-8888",
    stripes: 0,
    monthlyValue: 150,
    dueDay: 5,
    birthDate: "1995-10-20",
    isInstructor: false
  }
];

export const INITIAL_SCHEDULES: Omit<ClassSchedule, 'id'>[] = [
  {
    title: "Fundamentos BJJ",
    time: "07:00",
    days: ["Seg", "Qua", "Sex"],
    instructor: "Sensei",
    category: "Iniciante"
  },
  {
    title: "No-Gi Avançado",
    time: "19:00",
    days: ["Ter", "Qui"],
    instructor: "Sensei",
    category: "Avançado"
  },
  {
    title: "Jiu-Jitsu Kids",
    time: "17:30",
    days: ["Seg", "Qua", "Sex"],
    instructor: "Sensei",
    category: "Infantil"
  }
];

export const INITIAL_PLANS: Omit<Plan, 'id'>[] = [
  {
    name: "Mensal Flex",
    price: 150,
    description: "Acesso a 3 aulas por semana",
    benefits: ["3 Aulas Semanais", "Acesso ao App", "Material Didático"]
  },
  {
    name: "Black Belt (Anual)",
    price: 120,
    description: "Aulas ilimitadas com desconto anual",
    benefits: ["Aulas Ilimitadas", "Acesso VIP", "Workshop Grátis", "Desconto em Kimonos"]
  },
  {
    name: "Kids Warriors",
    price: 130,
    description: "Plano especial para crianças de 4 a 15 anos",
    benefits: ["Aulas Focadas", "Sistema de Selos", "Monitoramento de Disciplina"]
  }
];
