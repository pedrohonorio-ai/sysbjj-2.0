
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
  videoUrl?: string;
  questions?: RuleQuestion[];
  scenarios?: RuleScenario[];
  aiSenseiPrompt?: string;
}

export interface RuleCourse {
  id: string;
  title: string;
  description: string;
  lessons: RuleLesson[];
  minBelt?: BeltColor | KidsBeltColor;
}

export const IBJJF_COURSES: RuleCourse[] = [
  {
    id: 'course-basics',
    title: 'Fundamentos da Arbitragem',
    description: 'O básico essencial para todo competidor e professor.',
    lessons: [
      {
        id: 'rule-points-1',
        title: 'Pontuação: Domínio Estratégico',
        category: 'Points',
        content: 'No Jiu-Jitsu competitivo, os pontos são reflexos de posições de domínio. Quedas (2 pts), Passagem de Guarda (3 pts), Joelho na Barriga (2 pts), Montada (4 pts) e Pegada de Costas (4 pts). A estabilização por 3 segundos é o segredo do sucesso.',
        points: 50,
        icon: 'Trophy',
        questions: [
          {
            id: 'q1-1',
            question: 'Você projeta o oponente, ele cai sentado, e você o mantém ali por 3 segundos. Quantos pontos?',
            options: ['Vantagem apenas', '2 Pontos', '3 Pontos', 'Nada'],
            correctAnswer: 1,
            explanation: 'Quedas que resultam em oponente sentado ou de costas, com 3s de controle, valem 2 pontos.'
          },
          {
            id: 'q1-2',
            question: 'O Atleta A passa a guarda, mas o Atleta B mantém a meia guarda. A pontuação é aplicada?',
            options: ['Sim, 3 pontos', 'Não, meia guarda é considerada guarda', 'Apenas vantagem', '2 pontos'],
            correctAnswer: 1,
            explanation: 'Para validar a passagem de guarda, é necessário transpor as pernas do oponente por completo. Meia guarda ainda é uma forma de guarda.'
          }
        ]
      },
      {
        id: 'rule-fouls-1',
        title: 'Faltas e Punições',
        category: 'Fouls',
        content: 'Faltas graves levam à desclassificação imediata. Punições acumuladas dão pontos ao adversário.',
        points: 80,
        icon: 'AlertTriangle',
        questions: [
          {
            id: 'q4-1',
            question: 'O que acontece na 3ª punição recebida?',
            options: ['O oponente ganha 2 pontos', 'O oponente ganha 1 vantagem', 'Você é desclassificado', 'A luta recomeça em pé'],
            correctAnswer: 0,
            explanation: 'IBJJF: 1ª (Falta), 2ª (Vantagem p/ Op), 3ª (2 Pts p/ Op), 4ª (Desclassificação).'
          }
        ]
      }
    ]
  },
  {
    id: 'course-advanced',
    title: 'Juiz de Tatame: Nível Pro',
    description: 'Situações complexas e interpretação de regras finas.',
    lessons: [
      {
        id: 'rule-scenarios-1',
        title: 'Casos Complexos: O Julgamento',
        category: 'Scenarios',
        content: 'Analise situações reais de luta onde a regra é testada ao limite.',
        points: 100,
        icon: 'ShieldCheck',
        scenarios: [
          {
            id: 'sc-1',
            title: 'A Raspagem Incompleta',
            description: 'Situação de final de campeonato.',
            situation: 'O Atleta A está fazendo guarda de gancho. Ele desequilibra o Atleta B, que cai de quatro apoios. O Atleta A sobe, abraça a cintura por trás, mas antes de 3 segundos o Atleta B levanta.',
            options: [
              '2 Pontos para o Atleta A',
              'Vantagem para o Atleta A',
              'Nada, a luta segue',
              'Punição por amarração'
            ],
            correctAnswer: 1,
            explanation: 'Sem controle por 3s em posição superior, mas com desequilíbrio real, marca-se vantagem.',
            aiSenseiTip: 'Sensei diz: "Controle é tudo. Não tenha pressa para que o árbitro veja a estabilização."'
          }
        ]
      }
    ]
  },
  {
    id: 'course-graduation',
    title: 'Sistema de Graduação Oficial',
    description: 'Entenda os tempos de carência, idades mínimas e requisitos para cada faixa.',
    lessons: [
      {
        id: 'rule-grad-1',
        title: 'Faixas Adultas: O Caminho do Guerreiro',
        category: 'Graduation',
        content: 'Branca (Sem carência), Azul (2 anos), Roxa (1.5 anos), Marrom (1 ano). Idades mínimas: Azul (16 anos), Roxa (16 anos), Marrom (18 anos), Preta (19 anos).',
        points: 40,
        icon: 'GraduationCap',
        questions: [
          {
            id: 'q-grad-1',
            question: 'Qual a idade mínima para ser graduado à faixa roxa pela IBJJF?',
            options: ['15 anos', '16 anos', '18 anos', '17 anos'],
            correctAnswer: 1,
            explanation: 'A idade mínima para a faixa roxa é 16 anos.'
          }
        ]
      },
      {
        id: 'rule-grad-2',
        title: 'Sistema Kids: Formação e Disciplina',
        category: 'Graduation',
        content: 'O sistema infantil possui faixas Cinza, Amarela, Laranja e Verde. Cada cor tem sub-divisões (Branca, Sólida, Preta). Idades: Cinza (4-15), Amarela (7-15), Laranja (10-15), Verde (13-15).',
        points: 40,
        icon: 'Baby',
        questions: [
          {
            id: 'q-grad-2',
            question: 'Até que idade um aluno pode usar a faixa verde kids?',
            options: ['Até os 12 anos', 'Até os 15 anos', 'Até os 18 anos', 'Até os 16 anos'],
            correctAnswer: 1,
            explanation: 'As faixas kids vão de 4 até os 15 anos de idade. Ao completar 16, o aluno migra para o sistema adulto (Azul ou Roxa dependendo da faixa anterior).'
          }
        ]
      }
    ]
  }
];

export const IBJJF_LESSONS: RuleLesson[] = IBJJF_COURSES.flatMap(c => c.lessons);
