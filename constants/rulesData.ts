
export interface RuleLesson {
  id: string;
  title: string;
  category: 'Points' | 'Fouls' | 'Graduation' | 'Etiquette';
  content: string;
  points: number; // Merit points for completing
  icon: string;
}

export const IBJJF_LESSONS: RuleLesson[] = [
  {
    id: 'rule-1',
    title: 'Pontuação: Quedas (2 Pontos)',
    category: 'Points',
    content: 'Uma queda é contabilizada quando um atleta projeta o oponente ao solo e mantém o controle por 3 segundos. Se o oponente cair sentado e o controle for mantido, os pontos também são válidos.',
    points: 10,
    icon: 'Trophy'
  },
  {
    id: 'rule-2',
    title: 'Pontuação: Passagem de Guarda (3 Pontos)',
    category: 'Points',
    content: 'Ocorre quando o atleta que está por cima consegue transpor as pernas do oponente que está fazendo guarda, mantendo o controle lateral ou norte-sul por 3 segundos.',
    points: 15,
    icon: 'ArrowRight'
  },
  {
    id: 'rule-3',
    title: 'Pontuação: Montada (4 Pontos)',
    category: 'Points',
    content: 'Quando o atleta senta sobre o tronco do oponente, com os dois joelhos ou pés no solo. O oponente pode estar de frente ou de lado, mas não de costas (isso seria pegada de costas).',
    points: 20,
    icon: 'Shield'
  },
  {
    id: 'rule-4',
    title: 'Faltas: Bate-Estaca (Slam)',
    category: 'Fouls',
    content: 'É estritamente proibido projetar o oponente intencionalmente contra o solo quando este está com uma finalização encaixada (triângulo, armlock). Resulta em desclassificação imediata.',
    points: 10,
    icon: 'AlertTriangle'
  },
  {
    id: 'rule-5',
    title: 'Graduação: Tempo de Carência',
    category: 'Graduation',
    content: 'Para subir da faixa branca para a azul, a IBJJF não exige tempo mínimo, mas da azul para a roxa são necessários pelo menos 2 anos de registro oficial.',
    points: 5,
    icon: 'GraduationCap'
  },
  {
    id: 'rule-6',
    title: 'Etiquette: O Cumprimento (Oss)',
    category: 'Etiquette',
    content: 'O respeito é a base do Jiu-Jitsu. Sempre cumprimente o tatame ao entrar e sair, e seus parceiros de treino antes e depois de cada rola.',
    points: 5,
    icon: 'Users'
  }
];
