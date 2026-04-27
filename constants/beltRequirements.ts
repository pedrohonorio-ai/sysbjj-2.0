
import { BeltColor, KidsBeltColor } from '../types';

export const BELT_REQUIREMENTS: Record<string, string[]> = {
  [BeltColor.WHITE]: [
    "Rolamento frontal e lateral",
    "Fuga de quadril (Shrimping) e Ponte",
    "Postura na guarda fechada",
    "Passagem de guarda 'Toureada'",
    "Passagem de guarda 'Knee Slide'",
    "Finalização: Armlock da guarda",
    "Finalização: Estrangulamento cruzado",
    "Defesa pessoal: Saída de gravata",
    "Conhecimento das regras básicas (pontuação)"
  ],
  [BeltColor.BLUE]: [
    "Guarda De La Riva básica",
    "Berimbolo básico",
    "Triângulo e Omoplata combinados",
    "Defesas de pé-no-bíceps",
    "Passagem de meia-guarda profunda",
    "Transição Joelho no barriga - Montada",
    "Ataques de costas (Mata-leão e Arco e flecha)",
    "Quedas: Single leg e Double leg",
    "Domínio do tempo de luta (Estratégia)"
  ],
  [BeltColor.PURPLE]: [
    "Guarda Spider e Lasso avançada",
    "Inversões de guarda X e Single Leg X",
    "Passagens de pressão (Over-under)",
    "Ataques de perna (Botinha e Toe Hold)",
    "Conexão entre ataques (Loops)",
    "Escapes de situações críticas (Montada alta)",
    "Refinamento de transições sem pegada",
    "Conhecimento tático (Vantagens e punições)",
    "Capacidade de instruir iniciantes"
  ],
  [BeltColor.BROWN]: [
    "Domínio total de leg locks",
    "Contra-ataques de passagens modernas",
    "Guarda 50/50 e Lapel Guards",
    "Refinamento de quedas de judô (Uchi Mata/Osoto Gari)",
    "Pressão de passagem 'Smash Pass'",
    "Gestão de energia e 'Mindset' de luta",
    "Filosofia do Jiu-Jitsu e Linhagem",
    "Habilidades pedagógicas (Dar aula)"
  ],
  [BeltColor.BLACK]: [
    "Maestria em todos os fundamentos",
    "Personalidade técnica (Estilo próprio)",
    "Ética e conduta de mestre",
    "Conhecimento profundo das regras IBJJF",
    "Capacidade de formar faixas pretas",
    "Contribuição para o crescimento da academia",
    "Certificações federativas ativas"
  ]
};

// Kids Belts (Simplified)
export const KIDS_BELT_REQUIREMENTS: Record<string, string[]> = {
  [KidsBeltColor.WHITE_GRAY]: ["Base de luta", "Queda de quadril", "Imobilização lateral", "Abraço do urso"],
  [KidsBeltColor.GRAY]: ["Fuga de quadril", "Cadeado (Guarda)", "Virada do tatu", "Montada"],
  [KidsBeltColor.GRAY_BLACK]: ["Passagem de guarda", "Cata-vaca", "Chave de braço", "Mata-leão"],
  [KidsBeltColor.WHITE_YELLOW]: ["Single leg", "Triângulo", "Guarda sentada", "Postura"],
  [KidsBeltColor.YELLOW]: ["Kimura", "Guarda De La Riva", "Pegada de costas", "Sprawl"],
  [KidsBeltColor.BLACK_YELLOW]: ["Inversão de raspagem", "Guarda aranha", "Guilhotina", "Estratégia"],
  // Repeat patterns for ORANGE and GREEN
  [KidsBeltColor.WHITE_ORANGE]: ["Técnicas de competição", "Resiliência", "Combinações"],
  [KidsBeltColor.ORANGE]: ["Controle de distância", "Finalizações rápidas"],
  [KidsBeltColor.BLACK_ORANGE]: ["Estratégia de torneio", "Defesa de quedas"],
  [KidsBeltColor.WHITE_GREEN]: ["Preparação para adulto", "Flow rolling"],
  [KidsBeltColor.GREEN]: ["Liderança", "Maestria infantil"],
  [KidsBeltColor.BLACK_GREEN]: ["Candidato à faixa azul", "Excellence"]
};
