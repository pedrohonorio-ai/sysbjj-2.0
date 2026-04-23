
export interface RuleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface RuleLesson {
  id: string;
  title: string;
  category: 'Points' | 'Fouls' | 'Graduation' | 'Etiquette' | 'Scenarios';
  content: string;
  points: number; // Merit points for completing
  icon: string;
  questions?: RuleQuestion[];
}

export const IBJJF_LESSONS: RuleLesson[] = [
  {
    id: 'rule-1',
    title: 'Pontuação: Quedas (2 Pontos)',
    category: 'Points',
    content: 'Uma queda é contabilizada quando um atleta projeta o oponente ao solo e mantém o controle por 3 segundos. Se o oponente cair sentado e o controle for mantido, os pontos também são válidos.',
    points: 10,
    icon: 'Trophy',
    questions: [
      {
        id: 'q1-1',
        question: 'Quanto tempo o atleta deve manter o controle após a queda para validar os 2 pontos?',
        options: ['1 Segundo', '3 Segundos', '5 Segundos', 'Não precisa manter controle'],
        correctAnswer: 1,
        explanation: 'A regra da IBJJF exige a estabilização da posição por 3 segundos para que os pontos sejam computados.'
      }
    ]
  },
  {
    id: 'rule-2',
    title: 'Pontuação: Passagem de Guarda (3 Pontos)',
    category: 'Points',
    content: 'Ocorre quando o atleta que está por cima consegue transpor as pernas do oponente que está fazendo guarda, mantendo o controle lateral ou norte-sul por 3 segundos.',
    points: 15,
    icon: 'ArrowRight',
    questions: [
      {
        id: 'q2-1',
        question: 'Se você passar a guarda mas o oponente repor as pernas antes de 3 segundos, você ganha os 3 pontos?',
        options: ['Sim', 'Não, ganha apenas vantagem', 'Não ganha nada', 'Ganha 1 ponto'],
        correctAnswer: 1,
        explanation: 'Para os 3 pontos, é necessária a estabilização. Se não estabilizar mas houver progresso, o árbitro pode marcar uma vantagem.'
      }
    ]
  },
  {
    id: 'rule-3',
    title: 'Pontuação: Montada (4 Pontos)',
    category: 'Points',
    content: 'Quando o atleta senta sobre o tronco do oponente, com os dois joelhos ou pés no solo. O oponente pode estar de frente ou de lado, mas não de costas (isso seria pegada de costas).',
    points: 20,
    icon: 'Shield',
    questions: [
      {
        id: 'q3-1',
        question: 'Qual a pontuação para a Montada pelas costas?',
        options: ['2 Pontos', '3 Pontos', '4 Pontos', 'Não existe montada pelas costas, são os 4 pontos de "Pegada de Costas"'],
        correctAnswer: 3,
        explanation: 'Apesar de serem 4 pontos também, a regra diferencia Montada de Pegada de Costas.'
      }
    ]
  },
  {
    id: 'rule-7',
    title: 'Pontuação: Raspagem (2 Pontos)',
    category: 'Points',
    content: 'Quando o atleta que está por baixo (em guarda) consegue inverter a posição, ficando por cima e mantendo o controle por 3 segundos.',
    points: 15,
    icon: 'Zap',
    questions: [
      {
        id: 'q7-1',
        question: 'Para validar os pontos de raspagem, de onde o atleta deve partir?',
        options: ['De pé', 'Da guarda', 'Do controle lateral', 'Da montada'],
        correctAnswer: 1,
        explanation: 'A raspagem obrigatoriamente deve partir de uma situação de guarda.'
      }
    ]
  },
  {
    id: 'rule-4',
    title: 'Faltas: Bate-Estaca (Slam)',
    category: 'Fouls',
    content: 'É estritamente proibido projetar o oponente intencionalmente contra o solo quando este está com uma finalização encaixada (triângulo, armlock). Resulta em desclassificação imediata.',
    points: 25,
    icon: 'AlertTriangle',
    questions: [
      {
        id: 'q4-1',
        question: 'Qual a penalidade para um Bate-Estaca (Slam) intencional?',
        options: ['1 Punição', '2 Pontos para o oponente', 'Vantagem para o oponente', 'Desclassificação Imediata'],
        correctAnswer: 3,
        explanation: 'O Slam é considerado falta gravíssima devido ao alto risco de lesão cervical.'
      }
    ]
  },
  {
    id: 'rule-8',
    title: 'Faltas: Cruzar a perna (Reaping)',
    category: 'Fouls',
    content: 'Cruzar a perna por cima da coxa do oponente em direção ao umbigo (colheita/reaping) é proibido para faixas brancas a marrom em competições de kimono da IBJJF.',
    points: 20,
    icon: 'XCircle',
    questions: [
      {
        id: 'q8-1',
        question: 'A regra de "Colheita de perna" (Reaping) é aplicada igualmente no No-Gi da IBJJF para faixas pretas adultos?',
        options: ['Sim, é sempre proibido', 'Não, é permitido no No-Gi para Adultos Faixa Marrom e Preta', 'Só é permitido se o oponente deixar', 'É permitido apenas em treinos'],
        correctAnswer: 1,
        explanation: 'Desde 2021, a IBJJF permite ataques de chave de calcanhar e reaping para marrom e preta adulto no No-Gi.'
      }
    ]
  },
  {
    id: 'rule-9',
    title: 'Pontuação: Joelho na Barriga (2 Pontos)',
    category: 'Points',
    content: 'Ocorre quando o atleta que está por cima coloca o joelho na barriga do oponente (o outro pé deve estar no solo) e mantém o controle por 3 segundos.',
    points: 10,
    icon: 'Activity',
    questions: [
      {
        id: 'q9-1',
        question: 'Se o atleta colocar os dois joelhos no abdômen do oponente, ele ganha os 2 pontos de joelho na barriga?',
        options: ['Sim', 'Não, vira montada se o joelho atravessar', 'Não ganha nada', 'Ganha 4 pontos'],
        correctAnswer: 1,
        explanation: 'A regra exige apenas um joelho no abdômen. Se os dois estiverem e houve a transição, pode ser considerado montada, mas a pontuação de joelho na barriga requer a postura específica com um pé no solo.'
      }
    ]
  },
  {
    id: 'rule-10',
    title: 'Pontuação: Pegada de Costas (4 Pontos)',
    category: 'Points',
    content: 'Ocorre quando o atleta coloca os dois ganchos nas coxas do oponente (por dentro), mantendo o controle por 3 segundos. O oponente pode estar de joelhos, sentado ou deitado.',
    points: 20,
    icon: 'UserPlus',
    questions: [
      {
        id: 'q10-1',
        question: 'Cruzar os pés na frente do quadril do oponente invalida os 4 pontos de pegada de costas?',
        options: ['Sim, não ganha os pontos', 'Não, ganha os pontos mas é perigoso por causa da chave de pé', 'Ganha apenas 2 pontos', 'Só ganha se o oponente bater'],
        correctAnswer: 1,
        explanation: 'Você ganha os pontos, mas cruzar os pés nas costas é um erro técnico que permite ao oponente aplicar uma chave de pé (estrangulamento de tornozelo).'
      }
    ]
  },
  {
    id: 'rule-11',
    title: 'Vantagens: Quase Pontuação',
    category: 'Scenarios',
    content: 'Vantagens são dadas quando um atleta chega muito próximo de completar uma pontuação (como uma queda ou passagem) mas o oponente consegue escapar ou repor antes dos 3 segundos de estabilização.',
    points: 10,
    icon: 'Zap',
    questions: [
      {
        id: 'q11-1',
        question: 'Vantagens servem como critério de desempate se os pontos estiverem iguais?',
        options: ['Sim, ganha quem tiver mais vantagens', 'Não, vai para a decisão do árbitro direto', 'Não, conta apenas as punições', 'Vantagem vale 1 ponto'],
        correctAnswer: 0,
        explanation: 'No Jiu-Jitsu, o placar segue a ordem: Pontos > Vantagens > Punições (menor número). Se os pontos empatarem, as vantagens decidem.'
      }
    ]
  },
  {
    id: 'rule-12',
    title: 'Punições: Falta de Combatividade (Stalling)',
    category: 'Fouls',
    content: 'Quando o atleta não busca a evolução da luta ou trava a posição sem intenção de progredir. O árbitro sinaliza com um gesto de círculo com as mãos.',
    points: 10,
    icon: 'Clock',
    questions: [
      {
        id: 'q12-1',
        question: 'O que acontece na 4ª punição por falta de combatividade?',
        options: ['O oponente ganha 2 pontos', 'O oponente ganha 3 pontos', 'O atleta é desclassificado', 'Não acontece nada além de mais uma punição'],
        correctAnswer: 2,
        explanation: 'Pelas regras da IBJJF: 1ª punição (advertência), 2ª (vantagem para oponente), 3ª (2 pontos para oponente), 4ª (Desclassificação).'
      }
    ]
  },
  {
    id: 'rule-5',
    title: 'Graduação: Tempo de Carência',
    category: 'Graduation',
    content: 'Para subir da faixa branca para a azul, a IBJJF não exige tempo mínimo, mas da azul para a roxa são necessários pelo menos 2 anos de registro oficial.',
    points: 10,
    icon: 'GraduationCap',
    questions: [
      {
        id: 'q5-1',
        question: 'Qual o tempo mínimo de permanência na faixa roxa antes de ir para a marrom?',
        options: ['6 meses', '1 ano', '1 ano e meio', '2 anos'],
        correctAnswer: 2,
        explanation: 'A CBJJ/IBJJF exige 1 ano e meio de permanência na faixa roxa antes da graduação para marrom.'
      }
    ]
  },
  {
    id: 'rule-6',
    title: 'Etiquette: O Cumprimento (Oss)',
    category: 'Etiquette',
    content: 'O respeito é a base do Jiu-Jitsu. Sempre cumprimente o tatame ao entrar e sair, e seus parceiros de treino antes e depois de cada rola.',
    points: 5,
    icon: 'Users',
    questions: [
      {
        id: 'q6-1',
        question: 'O que significa o cumprimento "OSS" no contexto do tatame?',
        options: ['Ataque agora', 'Sim senhor', 'Resiliência, respeito e perseverança', 'Terminei o treino'],
        correctAnswer: 2,
        explanation: 'Originalmente das artes marciais japonesas, OSS simboliza perseverança sob pressão e respeito mútuo.'
      }
    ]
  }
];
