
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

export interface WeightClass {
  category: string;
  weight: string; // e.g. "57.5 kg / 126.5 lbs"
}

export interface IBJJFReference {
  points: { position: string; value: number; description: string }[];
  fouls: { serious: string[]; technical: string[] };
  illegalMoves: { belt: string; moves: string[] }[];
  matchDurations: { belt: string; time: string }[];
  ageCategories: { name: string; age: string }[];
  graduationChart: {
    adult: { belt: string; age: string; time: string; color: string }[];
    kids: { belt: string; age: string; color: string }[];
  };
  weightClasses: {
    male: WeightClass[];
    female: WeightClass[];
  };
}

export const IBJJF_REFERENCE: IBJJFReference = {
  points: [
    { position: 'Montada (Mount)', value: 4, description: 'Sentar sobre o tronco do oponente com joelhos no chão.' },
    { position: 'Costas (Back Control)', value: 4, description: 'Controle com ganchos nas pernas e braços envolvendo o tronco.' },
    { position: 'Passagem de Guarda (Guard Pass)', value: 3, description: 'Transpor a guarda e estabilizar por 3 segundos na lateral.' },
    { position: 'Queda (Takedown)', value: 2, description: 'Levar o oponente ao solo e estabilizar por 3 segundos.' },
    { position: 'Raspagem (Sweep)', value: 2, description: 'Inverter a posição partindo da guarda e estabilizar no topo.' },
    { position: 'Joelho na Barriga (Knee on Belly)', value: 2, description: 'Estabilizar o oponente com o joelho no plexo ou abdômen.' },
  ],
  fouls: {
    serious: [
      'Bate-estaca (Slam)',
      'Dedo no olho ou boca',
      'Puxar dedos individualmente',
      'Golpes traumáticos (Soco, chute, etc)',
      'Escarrar ou morder',
      'Conduta antidesportiva grave'
    ],
    technical: [
      'Fugir da área de luta',
      'Amarrar o jogo (Stalling)',
      'Despir-se do Kimono durante a luta',
      'Pisar fora da área para evitar queda'
    ]
  },
  illegalMoves: [
    { 
      belt: 'Branca (White)', 
      moves: [
        'Mão de Vaca (Wrist lock)', 
        'Pular na Guarda (Jumping guard)', 
        'Triângulo puxando a cabeça', 
        'Qualquer chave de perna exceto Botinha reta',
        'Cervical',
        'Ezequiel por dentro da manga'
      ] 
    },
    { 
      belt: 'Azul / Roxa (Blue / Purple)', 
      moves: [
        'Chave de Rim e Tesoura', 
        'Pular na guarda (Juvenil)', 
        'Qualquer chave de perna exceto Botinha reta',
        'Bíceps e Panturrilha (Slicers)'
      ] 
    },
    { 
      belt: 'Marrom / Preta (Brown / Black)', 
      moves: [
        'Crucifixação (Cervical)',
        'Rasteira de Calcanhar (Heel hold - No Gi apenas em categorias Pro)',
        'Qualquer técnica que pressione a coluna vertebral'
      ] 
    }
  ],
  matchDurations: [
    { belt: 'Branca', time: '5 min' },
    { belt: 'Azul', time: '6 min' },
    { belt: 'Roxa', time: '7 min' },
    { belt: 'Marrom', time: '8 min' },
    { belt: 'Preta', time: '10 min' },
  ],
  ageCategories: [
    { name: 'Kids', age: '4 a 15 anos' },
    { name: 'Juvenil', age: '16 e 17 anos' },
    { name: 'Adulto', age: '18 a 29 anos' },
    { name: 'Master 1', age: '30 a 35 anos' },
    { name: 'Master 2', age: '36 a 40 anos' },
    { name: 'Master 3+', age: 'Acima de 41 anos' },
  ],
  graduationChart: {
    adult: [
      { belt: 'Branca (White)', age: 'Iniciante', time: 'Sem mínimo', color: 'White' },
      { belt: 'Azul (Blue)', age: '16 anos', time: '2 anos', color: 'Blue' },
      { belt: 'Roxa (Purple)', age: '16 anos', time: '1.5 anos', color: 'Purple' },
      { belt: 'Marrom (Brown)', age: '18 anos', time: '1 ano', color: 'Brown' },
      { belt: 'Preta (Black)', age: '19 anos', time: '31 anos (Diplomado)', color: 'Black' },
      { belt: 'Coral (Red/Black)', age: '50 anos', time: '31 anos de Preta', color: 'Red-Black' },
      { belt: 'Vermelha (Red)', age: '67 anos', time: 'Termo de Vida', color: 'Red' },
    ],
    kids: [
      { belt: 'Branca', age: '4 a 15 anos', color: 'White' },
      { belt: 'Cinza / Branca', age: '4 a 15 anos', color: 'White-Gray' },
      { belt: 'Cinza', age: '4 a 15 anos', color: 'Gray' },
      { belt: 'Cinza / Preta', age: '4 a 15 anos', color: 'Gray-Black' },
      { belt: 'Amarela / Branca', age: '7 a 15 anos', color: 'White-Yellow' },
      { belt: 'Amarela', age: '8 a 15 anos', color: 'Yellow' },
      { belt: 'Amarela / Preta', age: '9 a 15 anos', color: 'Black-Yellow' },
      { belt: 'Laranja / Branca', age: '10 a 15 anos', color: 'White-Orange' },
      { belt: 'Laranja', age: '11 a 15 anos', color: 'Orange' },
      { belt: 'Laranja / Preta', age: '12 a 15 anos', color: 'Black-Orange' },
      { belt: 'Verde / Branca', age: '13 a 15 anos', color: 'White-Green' },
      { belt: 'Verde', age: '14 a 15 anos', color: 'Green' },
      { belt: 'Verde / Preta', age: '15 a 15 anos', color: 'Black-Green' },
    ]
  },
  weightClasses: {
    male: [
      { category: 'Galo (Rooster)', weight: 'Até 57.5 kg / 126.8 lb' },
      { category: 'Pluma (Light Feather)', weight: 'Até 64.0 kg / 141.1 lb' },
      { category: 'Pena (Feather)', weight: 'Até 70.0 kg / 154.3 lb' },
      { category: 'Leve (Light)', weight: 'Até 76.0 kg / 167.6 lb' },
      { category: 'Médio (Middle)', weight: 'Até 82.3 kg / 181.4 lb' },
      { category: 'Meio-Pesado (Medium Heavy)', weight: 'Até 88.3 kg / 194.7 lb' },
      { category: 'Pesado (Heavy)', weight: 'Até 94.3 kg / 207.9 lb' },
      { category: 'Super-Pesado (Super Heavy)', weight: 'Até 100.5 kg / 221.6 lb' },
      { category: 'Pesadíssimo (Ultra Heavy)', weight: 'Sem Limite Máximo' },
    ],
    female: [
      { category: 'Galo (Rooster)', weight: 'Até 48.5 kg / 107 lb' },
      { category: 'Pluma (Light Feather)', weight: 'Até 53.5 kg / 118 lb' },
      { category: 'Pena (Feather)', weight: 'Até 58.5 kg / 129 lb' },
      { category: 'Leve (Light)', weight: 'Até 64.0 kg / 141.1 lb' },
      { category: 'Médio (Middle)', weight: 'Até 69.0 kg / 152.1 lb' },
      { category: 'Meio-Pesado (Medium Heavy)', weight: 'Até 74.0 kg / 163.1 lb' },
      { category: 'Pesado (Heavy)', weight: 'Até 79.3 kg / 174.8 lb' },
      { category: 'Super-Pesado (Super Heavy)', weight: 'Sem Limite Máximo' },
    ]
  }
};

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
        content: 'No Jiu-Jitsu competitivo, os pontos são reflexos de posições de domínio. Quedas (2 pts), Passagem de Guarda (3 pts), Joelho na Barriga (2 pts), Montada (4 pts) e Pegada de Costas (4 pts). A estabilização por 3 segundos é o segredo do sucesso. Vantagens são concedidas por quase chegar a uma dessas posições ou por finalizações quase concretizadas.',
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
        content: 'Faltas graves levam à desclassificação imediata. Punições acumuladas dão pontos ao adversário. 1ª punição: Advertência; 2ª punição: Vantagem para o oponente; 3ª punição: 2 pontos para o oponente; 4ª punição: Desclassificação.',
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
    id: 'course-master-sensei',
    title: 'Master Sensei: Estratégia de Competição',
    description: 'Aprenda a ganhar lutas no placar e a orientar seus alunos.',
    lessons: [
      {
        id: 'rule-strategy-1',
        title: 'Gestão de Placar e Tempo',
        category: 'Etiquette',
        content: 'Ganhar por uma vantagem é tão legítimo quanto ganhar por finalização em termos de campeonato. Aprenda quando arriscar e quando manter a posição. O uso estratégico do tempo é crucial, especialmente nos últimos 2 minutos da luta.',
        points: 120,
        icon: 'ShieldCheck',
        questions: [
          {
            id: 'qs-1',
            question: 'Se a luta terminar empatada em pontos e vantagens, quem decide o vencedor?',
            options: ['Sorteio', 'O árbitro central', 'Os 3 árbitros por decisão lateral', 'Quem atacou por último'],
            correctAnswer: 2,
            explanation: 'Em caso de empate total, a decisão cabe aos três árbitros (um central e dois laterais).'
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
        title: 'Faixas Adultas: Tempos e Idades',
        category: 'Graduation',
        content: 'O sistema IBJJF exige tempos mínimos em cada faixa antes da promoção: Branca (Sem tempo mínimo), Azul (2 anos), Roxa (1,5 anos), Marrom (1 ano). Idades mínimas: Azul e Roxa (16 anos), Marrom (18 anos), Preta (19 anos). Para a faixa preta, o atleta deve estar devidamente registrado na confederação e ter curso de arbitragem atualizado.',
        points: 40,
        icon: 'GraduationCap',
        questions: [
          {
            id: 'q-grad-1',
            question: 'Qual o tempo mínimo que um atleta deve permanecer na faixa azul antes de ir para a roxa?',
            options: ['1 ano', '2 anos', '1.5 anos', '6 meses'],
            correctAnswer: 1,
            explanation: 'A IBJJF exige que o atleta permaneça no mínimo 2 anos na faixa azul.'
          },
          {
            id: 'q-grad-1-2',
            question: 'Um atleta de 17 anos pode ser graduado à faixa marrom?',
            options: ['Sim, se for competidor', 'Sim, com autorização', 'Não, a idade mínima é 18 anos', 'Sim, se já tiver 2 anos de roxa'],
            correctAnswer: 2,
            explanation: 'A idade mínima para a faixa marrom é 18 anos, independente do tempo de praticante.'
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
