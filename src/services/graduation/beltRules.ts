import { BeltColor, KidsBeltColor } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

export interface BeltRule {
  belt: string;
  isKid: boolean;
  minimumAge: number;
  maximumAge?: number;
  minimumTimeMonths: number;
  previousBelts: string[];
}

// 🥋 Sequência Oficial CBJJ/IBJJF para Infantil (4 a 15 anos)
export const KIDS_BELT_SEQUENCE: KidsBeltColor[] = [
  KidsBeltColor.WHITE,
  KidsBeltColor.WHITE_GRAY,
  KidsBeltColor.GRAY,
  KidsBeltColor.GRAY_BLACK,
  KidsBeltColor.WHITE_YELLOW,
  KidsBeltColor.YELLOW,
  KidsBeltColor.BLACK_YELLOW,
  KidsBeltColor.WHITE_ORANGE,
  KidsBeltColor.ORANGE,
  KidsBeltColor.BLACK_ORANGE,
  KidsBeltColor.WHITE_GREEN,
  KidsBeltColor.GREEN,
  KidsBeltColor.BLACK_GREEN
];

// Map dos nomes amigáveis em português das faixas infantis
export const KIDS_BELT_LABELS: Record<string, string> = {
  [KidsBeltColor.WHITE]: "Faixa Branca",
  [KidsBeltColor.WHITE_GRAY]: "Faixa Cinza e Branca",
  [KidsBeltColor.GRAY]: "Faixa Cinza",
  [KidsBeltColor.GRAY_BLACK]: "Faixa Cinza e Preta",
  [KidsBeltColor.WHITE_YELLOW]: "Faixa Amarela e Branca",
  [KidsBeltColor.YELLOW]: "Faixa Amarela",
  [KidsBeltColor.BLACK_YELLOW]: "Faixa Amarela e Preta",
  [KidsBeltColor.WHITE_ORANGE]: "Faixa Laranja e Branca",
  [KidsBeltColor.ORANGE]: "Faixa Laranja",
  [KidsBeltColor.BLACK_ORANGE]: "Faixa Laranja e Preta",
  [KidsBeltColor.WHITE_GREEN]: "Faixa Verde e Branca",
  [KidsBeltColor.GREEN]: "Faixa Verde",
  [KidsBeltColor.BLACK_GREEN]: "Faixa Verde e Preta"
};

// 🥋 Sequência Oficial Adulto/Master/Grand Masters (16+ anos)
export const ADULT_BELT_SEQUENCE: BeltColor[] = [
  BeltColor.WHITE,
  BeltColor.BLUE,
  BeltColor.PURPLE,
  BeltColor.BROWN,
  BeltColor.BLACK,
  BeltColor.RED_BLACK, // Coral Vermelha e Preta (7º Grau)
  BeltColor.RED_WHITE, // Coral Vermelha e Branca (8º Grau)
  BeltColor.RED        // Vermelha (9º e 10º Graus)
];

export const ADULT_BELT_LABELS: Record<string, string> = {
  [BeltColor.WHITE]: "Faixa Branca",
  [BeltColor.BLUE]: "Faixa Azul",
  [BeltColor.PURPLE]: "Faixa Roxa",
  [BeltColor.BROWN]: "Faixa Marrom",
  [BeltColor.BLACK]: "Faixa Preta",
  [BeltColor.RED_BLACK]: "Faixa Coral Vermelha e Preta",
  [BeltColor.RED_WHITE]: "Faixa Coral Vermelha e Branca",
  [BeltColor.RED]: "Faixa Vermelha"
};

// Configurações das regras de graduação da CBJJ/IBJJF
export const BELT_RULES: Record<string, BeltRule> = {
  // --- INFANTIS ---
  'White_Kid': {
    belt: KidsBeltColor.WHITE,
    isKid: true,
    minimumAge: 4,
    minimumTimeMonths: 0,
    previousBelts: []
  },
  [KidsBeltColor.WHITE_GRAY]: {
    belt: KidsBeltColor.WHITE_GRAY,
    isKid: true,
    minimumAge: 4,
    minimumTimeMonths: 0, // Kids can go directly depending on age & teacher
    previousBelts: [KidsBeltColor.WHITE]
  },
  [KidsBeltColor.GRAY]: {
    belt: KidsBeltColor.GRAY,
    isKid: true,
    minimumAge: 4,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.WHITE_GRAY]
  },
  [KidsBeltColor.GRAY_BLACK]: {
    belt: KidsBeltColor.GRAY_BLACK,
    isKid: true,
    minimumAge: 4,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.WHITE_GRAY, KidsBeltColor.GRAY]
  },
  [KidsBeltColor.WHITE_YELLOW]: {
    belt: KidsBeltColor.WHITE_YELLOW,
    isKid: true,
    minimumAge: 7,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.GRAY, KidsBeltColor.GRAY_BLACK]
  },
  [KidsBeltColor.YELLOW]: {
    belt: KidsBeltColor.YELLOW,
    isKid: true,
    minimumAge: 7,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.WHITE_YELLOW, KidsBeltColor.GRAY_BLACK]
  },
  [KidsBeltColor.BLACK_YELLOW]: {
    belt: KidsBeltColor.BLACK_YELLOW,
    isKid: true,
    minimumAge: 7,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.YELLOW]
  },
  [KidsBeltColor.WHITE_ORANGE]: {
    belt: KidsBeltColor.WHITE_ORANGE,
    isKid: true,
    minimumAge: 10,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.YELLOW, KidsBeltColor.BLACK_YELLOW]
  },
  [KidsBeltColor.ORANGE]: {
    belt: KidsBeltColor.ORANGE,
    isKid: true,
    minimumAge: 10,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE_ORANGE, KidsBeltColor.BLACK_YELLOW]
  },
  [KidsBeltColor.BLACK_ORANGE]: {
    belt: KidsBeltColor.BLACK_ORANGE,
    isKid: true,
    minimumAge: 10,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.ORANGE]
  },
  [KidsBeltColor.WHITE_GREEN]: {
    belt: KidsBeltColor.WHITE_GREEN,
    isKid: true,
    minimumAge: 13,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.ORANGE, KidsBeltColor.BLACK_ORANGE]
  },
  [KidsBeltColor.GREEN]: {
    belt: KidsBeltColor.GREEN,
    isKid: true,
    minimumAge: 13,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE_GREEN, KidsBeltColor.BLACK_ORANGE]
  },
  [KidsBeltColor.BLACK_GREEN]: {
    belt: KidsBeltColor.BLACK_GREEN,
    isKid: true,
    minimumAge: 13,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.GREEN]
  },

  // --- ADULTOS/MASTERS ---
  [BeltColor.WHITE]: {
    belt: BeltColor.WHITE,
    isKid: false,
    minimumAge: 16,
    minimumTimeMonths: 0,
    previousBelts: []
  },
  [BeltColor.BLUE]: {
    belt: BeltColor.BLUE,
    isKid: false,
    minimumAge: 16,
    minimumTimeMonths: 0, // se vier de branca não tem limite CBJJ oficial de carência na branca, mas exige carência na azul de 24 meses
    previousBelts: [BeltColor.WHITE]
  },
  [BeltColor.PURPLE]: {
    belt: BeltColor.PURPLE,
    isKid: false,
    minimumAge: 16, // com 16 pode, mas se tiver 17 e for roxa fica sob regras especiais
    minimumTimeMonths: 24, // 2 anos na Azul exigidos antes de graduar para Roxa
    previousBelts: [BeltColor.BLUE]
  },
  [BeltColor.BROWN]: {
    belt: BeltColor.BROWN,
    isKid: false,
    minimumAge: 18,
    minimumTimeMonths: 18, // 1 ano e meio (18 meses) exigidos na Roxa antes de graduar para Marrom
    previousBelts: [BeltColor.PURPLE]
  },
  [BeltColor.BLACK]: {
    belt: BeltColor.BLACK,
    isKid: false,
    minimumAge: 19,
    minimumTimeMonths: 12, // 1 ano exigido na Marrom antes de se graduar Preta
    previousBelts: [BeltColor.BROWN]
  }
};
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

export interface BeltRule {
  belt: string;
  isKid: boolean;
  minimumAge: number;
  maximumAge?: number;
  minimumTimeMonths: number;
  previousBelts: string[];
}

// 🥋 Sequência Oficial CBJJ/IBJJF para Infantil (4 a 15 anos)
export const KIDS_BELT_SEQUENCE: KidsBeltColor[] = [
  KidsBeltColor.WHITE,
  KidsBeltColor.WHITE_GRAY,
  KidsBeltColor.GRAY,
  KidsBeltColor.GRAY_BLACK,
  KidsBeltColor.WHITE_YELLOW,
  KidsBeltColor.YELLOW,
  KidsBeltColor.BLACK_YELLOW,
  KidsBeltColor.WHITE_ORANGE,
  KidsBeltColor.ORANGE,
  KidsBeltColor.BLACK_ORANGE,
  KidsBeltColor.WHITE_GREEN,
  KidsBeltColor.GREEN,
  KidsBeltColor.BLACK_GREEN
];

// Map dos nomes amigáveis em português das faixas infantis
export const KIDS_BELT_LABELS: Record<string, string> = {
  [KidsBeltColor.WHITE]: "Faixa Branca",
  [KidsBeltColor.WHITE_GRAY]: "Faixa Cinza e Branca",
  [KidsBeltColor.GRAY]: "Faixa Cinza",
  [KidsBeltColor.GRAY_BLACK]: "Faixa Cinza e Preta",
  [KidsBeltColor.WHITE_YELLOW]: "Faixa Amarela e Branca",
  [KidsBeltColor.YELLOW]: "Faixa Amarela",
  [KidsBeltColor.BLACK_YELLOW]: "Faixa Amarela e Preta",
  [KidsBeltColor.WHITE_ORANGE]: "Faixa Laranja e Branca",
  [KidsBeltColor.ORANGE]: "Faixa Laranja",
  [KidsBeltColor.BLACK_ORANGE]: "Faixa Laranja e Preta",
  [KidsBeltColor.WHITE_GREEN]: "Faixa Verde e Branca",
  [KidsBeltColor.GREEN]: "Faixa Verde",
  [KidsBeltColor.BLACK_GREEN]: "Faixa Verde e Preta"
};

// 🥋 Sequência Oficial Adulto/Master/Grand Masters (16+ anos)
export const ADULT_BELT_SEQUENCE: BeltColor[] = [
  BeltColor.WHITE,
  BeltColor.BLUE,
  BeltColor.PURPLE,
  BeltColor.BROWN,
  BeltColor.BLACK,
  BeltColor.RED_BLACK, // Coral Vermelha e Preta (7º Grau)
  BeltColor.RED_WHITE, // Coral Vermelha e Branca (8º Grau)
  BeltColor.RED        // Vermelha (9º e 10º Graus)
];

export const ADULT_BELT_LABELS: Record<string, string> = {
  [BeltColor.WHITE]: "Faixa Branca",
  [BeltColor.BLUE]: "Faixa Azul",
  [BeltColor.PURPLE]: "Faixa Roxa",
  [BeltColor.BROWN]: "Faixa Marrom",
  [BeltColor.BLACK]: "Faixa Preta",
  [BeltColor.RED_BLACK]: "Faixa Coral Vermelha e Preta",
  [BeltColor.RED_WHITE]: "Faixa Coral Vermelha e Branca",
  [BeltColor.RED]: "Faixa Vermelha"
};

// Configurações das regras de graduação da CBJJ/IBJJF
export const BELT_RULES: Record<string, BeltRule> = {
  // --- INFANTIS ---
  'White_Kid': {
    belt: KidsBeltColor.WHITE,
    isKid: true,
    minimumAge: 4,
    minimumTimeMonths: 0,
    previousBelts: []
  },
  [KidsBeltColor.WHITE_GRAY]: {
    belt: KidsBeltColor.WHITE_GRAY,
    isKid: true,
    minimumAge: 4,
    minimumTimeMonths: 0, // Kids can go directly depending on age & teacher
    previousBelts: [KidsBeltColor.WHITE]
  },
  [KidsBeltColor.GRAY]: {
    belt: KidsBeltColor.GRAY,
    isKid: true,
    minimumAge: 4,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.WHITE_GRAY]
  },
  [KidsBeltColor.GRAY_BLACK]: {
    belt: KidsBeltColor.GRAY_BLACK,
    isKid: true,
    minimumAge: 4,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.WHITE_GRAY, KidsBeltColor.GRAY]
  },
  [KidsBeltColor.WHITE_YELLOW]: {
    belt: KidsBeltColor.WHITE_YELLOW,
    isKid: true,
    minimumAge: 7,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.GRAY, KidsBeltColor.GRAY_BLACK]
  },
  [KidsBeltColor.YELLOW]: {
    belt: KidsBeltColor.YELLOW,
    isKid: true,
    minimumAge: 7,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.WHITE_YELLOW, KidsBeltColor.GRAY_BLACK]
  },
  [KidsBeltColor.BLACK_YELLOW]: {
    belt: KidsBeltColor.BLACK_YELLOW,
    isKid: true,
    minimumAge: 7,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.YELLOW]
  },
  [KidsBeltColor.WHITE_ORANGE]: {
    belt: KidsBeltColor.WHITE_ORANGE,
    isKid: true,
    minimumAge: 10,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.YELLOW, KidsBeltColor.BLACK_YELLOW]
  },
  [KidsBeltColor.ORANGE]: {
    belt: KidsBeltColor.ORANGE,
    isKid: true,
    minimumAge: 10,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE_ORANGE, KidsBeltColor.BLACK_YELLOW]
  },
  [KidsBeltColor.BLACK_ORANGE]: {
    belt: KidsBeltColor.BLACK_ORANGE,
    isKid: true,
    minimumAge: 10,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.ORANGE]
  },
  [KidsBeltColor.WHITE_GREEN]: {
    belt: KidsBeltColor.WHITE_GREEN,
    isKid: true,
    minimumAge: 13,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE, KidsBeltColor.ORANGE, KidsBeltColor.BLACK_ORANGE]
  },
  [KidsBeltColor.GREEN]: {
    belt: KidsBeltColor.GREEN,
    isKid: true,
    minimumAge: 13,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.WHITE_GREEN, KidsBeltColor.BLACK_ORANGE]
  },
  [KidsBeltColor.BLACK_GREEN]: {
    belt: KidsBeltColor.BLACK_GREEN,
    isKid: true,
    minimumAge: 13,
    minimumTimeMonths: 0,
    previousBelts: [KidsBeltColor.GREEN]
  },

  // --- ADULTOS/MASTERS ---
  [BeltColor.WHITE]: {
    belt: BeltColor.WHITE,
    isKid: false,
    minimumAge: 16,
    minimumTimeMonths: 0,
    previousBelts: []
  },
  [BeltColor.BLUE]: {
    belt: BeltColor.BLUE,
    isKid: false,
    minimumAge: 16,
    minimumTimeMonths: 0, // se vier de branca não tem limite CBJJ oficial de carência na branca, mas exige carência na azul de 24 meses
    previousBelts: [BeltColor.WHITE]
  },
  [BeltColor.PURPLE]: {
    belt: BeltColor.PURPLE,
    isKid: false,
    minimumAge: 16, // com 16 pode, mas se tiver 17 e for roxa fica sob regras especiais
    minimumTimeMonths: 24, // 2 anos na Azul exigidos antes de graduar para Roxa
    previousBelts: [BeltColor.BLUE]
  },
  [BeltColor.BROWN]: {
    belt: BeltColor.BROWN,
    isKid: false,
    minimumAge: 18,
    minimumTimeMonths: 18, // 1 ano e meio (18 meses) exigidos na Roxa antes de graduar para Marrom
    previousBelts: [BeltColor.PURPLE]
  },
  [BeltColor.BLACK]: {
    belt: BeltColor.BLACK,
    isKid: false,
    minimumAge: 19,
    minimumTimeMonths: 12, // 1 ano exigido na Marrom antes de se graduar Preta
    previousBelts: [BeltColor.BROWN]
  }
};

