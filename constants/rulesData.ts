
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
  aiSenseiTip?: string;
}

export interface RuleLesson {
  id: string;
  title: string;
  category: 'Points' | 'Fouls' | 'Graduation' | 'Etiquette' | 'Scenarios';
  content: string;
  points: number; // Merit points for completing
  icon: string;
  questions?: RuleQuestion[];
  scenarios?: RuleScenario[];
  aiSenseiPrompt?: string;
}

export const IBJJF_LESSONS: RuleLesson[] = [
  {
    id: 'rule-points-1',
    title: 'Pontuação: Domínio Estratégico',
    category: 'Points',
    content: 'No Jiu-Jitsu competitivo, os pontos são reflexos de posições de domínio. Quedas (2 pts), Passagem de Guarda (3 pts), Joelho na Barriga (2 pts), Montada (4 pts) e Pegada de Costas (4 pts). A estabilização por 3 segundos é o segredo do sucesso.',
    points: 50,
    icon: 'Trophy',
    aiSenseiPrompt: 'Explique por que a regra dos 3 segundos existe e como ela evita o jogo "sujo" de bater e sair.',
    questions: [
      {
        id: 'q1-1',
        question: 'Você projeta o oponente, ele cai sentado, e você o mantém ali por 3 segundos. Quantos pontos?',
        options: ['Vantagem apenas', '2 Pontos', '3 Pontos', 'Nada'],
        correctAnswer: 1,
        explanation: 'Quedas que resultam em oponente sentado ou de costas, com 3s de controle, valem 2 pontos.'
      }
    ]
  },
  {
    id: 'rule-scenarios-1',
    title: 'Casos Complexos: O Julgamento',
    category: 'Scenarios',
    content: 'Analise situações reais de luta. Aqui é onde o conhecimento teórico se torna instinto de Sensei.',
    points: 100,
    icon: 'ShieldCheck',
    scenarios: [
      {
        id: 'sc-1',
        title: 'A Raspagem Incompleta',
        description: 'Caso Real: Final de Campeonato',
        situation: 'O Atleta A está fazendo guarda de gancho. Ele desequilibra o Atleta B, que cai de quatro apoios. O Atleta A sobe, abraça a cintura por trás, mas antes de 3 segundos o Atleta B levanta e volta a ficar de pé em uma perna. O Atleta A continua grudado.',
        options: [
          '2 Pontos para o Atleta A',
          'Vantagem para o Atleta A',
          'O Árbitro manda parar e volta no meio',
          'Nada, a luta segue'
        ],
        correctAnswer: 1,
        explanation: 'Como não houve estabilização por 3 segundos na posição superior (mesmo que por trás), mas houve o desequilíbrio e a tentativa real de inversão, marca-se apenas Vantagem.',
        aiSenseiTip: 'Sensei diz: "Nunca solte antes de contar 3 na sua cabeça. A afobação mata o ponto."'
      },
      {
        id: 'sc-2',
        title: 'A "Cerca" na Montada',
        description: 'Caso Técnico: Escapada Técnica',
        situation: 'Atleta A monta no Atleta B. Atleta B coloca um "cotovelo" na virilha do Atleta A para evitar que o joelho encoste no chão completamente. Atleta A senta no peito, mas um joelho está "flutuando" sobre o braço do oponente.',
        options: [
          '4 Pontos (Montada validada)',
          'Vantagem apenas',
          'Nada, a posição não está estabilizada conforme a regra',
          '2 Pontos de Joelho na Barriga'
        ],
        correctAnswer: 2,
        explanation: 'Para validar a montada, o oponente não pode estar "cerceando" a posição com os braços. Se o joelho não está livre de bloqueios do braço/perna do oponente, os pontos não sobem.',
        aiSenseiTip: 'O detalhe técnico: "Montada é controle de tronco, não só estar por cima."'
      }
    ]
  },
  {
    id: 'rule-fouls-1',
    title: 'Faltas: A Linha Vermelha',
    category: 'Fouls',
    content: 'Faltas graves (Desclassificação), Faltas Médias (Punições). Conhecer o limite é para quem busca o nível de Professor.',
    points: 80,
    icon: 'AlertTriangle',
    questions: [
      {
        id: 'q4-1',
        question: 'Em que momento a 3ª punição se torna perigosa?',
        options: ['Na 3ª o oponente ganha 2 pontos', 'Na 3ª o oponente ganha 1 vantagem', 'Na 3ª o oponente ganha 3 pontos', 'Na 3ª você é desclassificado'],
        correctAnswer: 0,
        explanation: 'IBJJF: 1ª (Falta), 2ª (Vantagem p/ Op), 3ª (2 Pts p/ Op), 4ª (Desclassificação).'
      }
    ]
  }
];
