import { BeltColor, KidsBeltColor } from '../types';

export interface RuleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface RuleScenario {
  id: string;
  title: string;
  description: string;
  situation: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface RuleLesson {
  id: string;
  title: string;
  duration: number;
  description?: string;
}

export interface RuleCourse {
  id: string;
  title: string;
  description: string;
  lessons: RuleLesson[];
  duration: number;
}

export interface IBJJFRule {
  id: string;
  title: string;
  category: string;
  description: string;
  reference: string;
}

export const ruleQuestions: RuleQuestion[] = [
  {
    id: "q1",
    question: "Qual é a cor da faixa para um atleta de 16 anos que acabou de começar no Jiu-Jitsu?",
    options: ["Branca", "Azul", "Roxa", "Marrom"],
    correctAnswer: 0,
    explanation: "A faixa branca é a inicial para todos os praticantes."
  },
  {
    id: "q2",
    question: "Quanto tempo é necessário para permanecer na faixa azul antes de ir para a roxa?",
    options: ["1 ano", "2 anos", "3 anos", "4 anos"],
    correctAnswer: 1,
    explanation: "O mínimo é 2 anos na faixa azul."
  },
  {
    id: "q3",
    question: "Qual é a idade mínima para receber a faixa preta?",
    options: ["16 anos", "18 anos", "19 anos", "21 anos"],
    correctAnswer: 2,
    explanation: "A idade mínima para faixa preta é 19 anos."
  }
];

export const ruleScenarios: RuleScenario[] = [
  {
    id: "s1",
    title: "Guarda Fechada",
    description: "Atleta está na guarda fechada",
    situation: "Qual ação é válida?",
    options: ["Chave de braço", "Soco", "Pisar", "Cair"],
    correctAnswer: 0,
    explanation: "Chave de braço é válida."
  }
];

export const ibjjfRules: IBJJFRule[] = [
  {
    id: "r1",
    title: "Tempo por Faixa",
    category: "Graduação",
    description: "Tempo mínimo em cada faixa",
    reference: "IBJJF Rules"
  },
  {
    id: "r2",
    title: "Idade Mínima por Faixa",
    category: "Graduação",
    description: "Idades mínimas para cada faixa",
    reference: "IBJJF Graduation System"
  }
];

export const IBJJF_LESSONS: RuleLesson[] = [
  { id: 'basic-1', title: 'Posições Básicas', duration: 60 },
  { id: 'basic-2', title: 'Finalizações Essenciais', duration: 90 },
  { id: 'inter-1', title: 'Guarda Avançada', duration: 90 },
  { id: 'adv-1', title: 'Estratégias de Competição', duration: 120 }
];

export const IBJJF_COURSES: RuleCourse[] = [
  {
    id: 'course-1',
    title: 'Fundamentos do Jiu-Jitsu',
    description: 'Curso básico de fundamentos',
    duration: 360,
    lessons: [
      { id: 'lesson-1', title: 'Posições Básicas', duration: 60 },
      { id: 'lesson-2', title: 'Finalizações', duration: 90 }
    ]
  },
  {
    id: 'course-2',
    title: 'Regras IBJJF',
    description: 'Curso completo sobre as regras',
    duration: 240,
    lessons: [
      { id: 'lesson-3', title: 'Sistema de Pontuação', duration: 60 },
      { id: 'lesson-4', title: 'Penalidades', duration: 60 }
    ]
  }
];

export const IBJJF_REFERENCE = {
  version: '2024',
  lastUpdate: '2024-01-01',
  rules: ibjjfRules
};
