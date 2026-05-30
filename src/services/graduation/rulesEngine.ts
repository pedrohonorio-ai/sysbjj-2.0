import { Student, BeltColor, KidsBeltColor, CBJJCategory } from '../../types.js';
import { calculateCBJJCategory } from '../cbjj.js';
import { 
  BELT_RULES, 
  KIDS_BELT_SEQUENCE, 
  ADULT_BELT_SEQUENCE, 
  KIDS_BELT_LABELS, 
  ADULT_BELT_LABELS 
} from './beltRules.js';
import { getNextBlackBeltProgression } from '../../utils/graduation/blackBeltEngine.js';

export interface EligibilityResult {
  isEligible: boolean;
  nextBelt: string;
  isPromotionToDegree: boolean;
  targetDegree: number;
  monthsElapsed: number;
  minTimeRequiredMonths: number;
  progress: number;
  timeSpentStr: string;
  eligibleStr: string;
  reasons: string[];
  recommendedStripe?: number;
  nextPromotionDate?: Date;
  yearsRemaining?: number;
  monthsRemaining?: number;
  accumulatedStr?: string;
  nextTitle?: string;
  futureBeltType?: string;
  remainingStr?: string;
}

// Map para obter o rótulo legível de qualquer faixa
export const getBeltLabel = (belt: string, isKid: boolean = false): string => {
  if (isKid || KIDS_BELT_LABELS[belt]) {
    return KIDS_BELT_LABELS[belt] || ADULT_BELT_LABELS[belt] || belt;
  }
  return ADULT_BELT_LABELS[belt] || KIDS_BELT_LABELS[belt] || belt;
};

// Normalização inteligente de faixas para garantir que regras de negócio rodem corretamente em multi-idioma ou typos
export const normalizeBeltForRules = (belt: string): string => {
  const b = String(belt || '').trim().toLowerCase();
  if (b === 'preta' || b === 'black' || b.includes('preta') || b.includes('black')) return 'Black';
  if (b === 'red-black' || b === 'coral' || b.includes('coral') || b.includes('vermelha e preta') || b.includes('rojo y negro') || b.includes('red and black')) return 'Red-Black';
  if (b === 'red-white' || b.includes('vermelha e branca') || b.includes('rojo y blanco') || b.includes('red and white')) return 'Red-White';
  if (b === 'vermelha' || b === 'red' || b === 'rojo') return 'Red';
  if (b === 'branca' || b === 'white' || b === 'blanco') return 'White';
  if (b === 'azul' || b === 'blue') return 'Blue';
  if (b === 'roxa' || b === 'purple') return 'Purple';
  if (b === 'marrom' || b === 'brown') return 'Brown';
  
  // Kids
  if (b.includes('cinza') || b.includes('gray')) {
    if (b.includes('preta') || b.includes('black')) return 'Gray-Black';
    if (b.includes('branca') || b.includes('white')) return 'White-Gray';
    return 'Gray';
  }
  if (b.includes('amarela') || b.includes('yellow')) {
    if (b.includes('preta') || b.includes('black')) return 'Black-Yellow';
    if (b.includes('branca') || b.includes('white')) return 'White-Yellow';
    return 'Yellow';
  }
  if (b.includes('laranja') || b.includes('orange')) {
    if (b.includes('preta') || b.includes('black')) return 'Black-Orange';
    if (b.includes('branca') || b.includes('white')) return 'White-Orange';
    return 'Orange';
  }
  if (b.includes('verde') || b.includes('green')) {
    if (b.includes('preta') || b.includes('black')) return 'Black-Green';
    if (b.includes('branca') || b.includes('white')) return 'White-Green';
    return 'Green';
  }
  
  const capitalized = b.charAt(0).toUpperCase() + b.slice(1);
  return capitalized;
};

// Cache interno em memória para otimizar cálculos de elegibilidade repetitivos (Requisito: Cache de Elegibilidade)
const eligibilityCache = new Map<string, { timestamp: number; result: EligibilityResult }>();
const CACHE_TTL_MS = 15000; // 15 segundos de cache

/**
 * Retorna as regras oficiais CBJJ/IBJJF e calcula a elegibilidade e tempos de faixa de um estudante.
 */
export const calculateStudentEligibility = (student: Student, forceRefresh = false): EligibilityResult => {
  const cacheKey = `${student.id}-${student.belt}-${student.stripes || 0}-${student.degrees || 0}-${student.lastPromotionDate || ''}`;
  
  if (!forceRefresh) {
    const cached = eligibilityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  const today = new Date();
  const birthYear = student.birthDate ? new Date(student.birthDate).getFullYear() : today.getFullYear() - 25;
  const currentYear = today.getFullYear();
  const age = currentYear - birthYear;
  
  // Forçar definição de se é criança com base na idade se não definido
  const isKid = student.isKid !== undefined ? student.isKid : (age < 16);
  const currentBelt = String(student.belt || 'Branca');
  const normalizedBelt = normalizeBeltForRules(currentBelt);
  const currentStripes = Number(student.blackBeltDegree !== undefined ? student.blackBeltDegree : (student.degrees || student.stripes || 0));

  // 1. Determinação da Próxima Faixa / Grau
  let nextBelt = '';
  let isPromotionToDegree = false;
  let targetDegree = 0;
  
  const isBlackBeltBelt = normalizedBelt === 'Black';
  const isCoralBeltBelt = normalizedBelt === 'Red-Black' || normalizedBelt === 'Red-White';
  const isRedBeltBelt = normalizedBelt === 'Red';

  if (isBlackBeltBelt) {
    // Para faixa preta, até 6º grau, ganha graus adicionais (6º para 7º é Coral)
    if (currentStripes < 6) {
      isPromotionToDegree = true;
      targetDegree = currentStripes + 1;
      nextBelt = 'Black';
    } else {
      isPromotionToDegree = false;
      nextBelt = 'Red-Black'; // Promoves to Coral
    }
  } else if (isCoralBeltBelt) {
    if (normalizedBelt === 'Red-Black' && currentStripes < 7) {
      isPromotionToDegree = true;
      targetDegree = 7;
      nextBelt = 'Red-Black';
    } else if (normalizedBelt === 'Red-Black' && currentStripes === 7) {
      isPromotionToDegree = false;
      nextBelt = 'Red-White';
    } else if (normalizedBelt === 'Red-White' && currentStripes < 8) {
      isPromotionToDegree = true;
      targetDegree = 8;
      nextBelt = 'Red-White';
    } else if (normalizedBelt === 'Red-White' && currentStripes === 8) {
      isPromotionToDegree = false;
      nextBelt = 'Red';
    } else {
      isPromotionToDegree = true;
      targetDegree = currentStripes + 1;
      nextBelt = normalizedBelt;
    }
  } else if (currentStripes < 4 && normalizedBelt !== 'Red') {
    // É uma promoção de Grau/Listra dentro da faixa atual
    isPromotionToDegree = true;
    targetDegree = currentStripes + 1;
    nextBelt = normalizedBelt;
  } else {
    // É uma promoção de FAIXA
    isPromotionToDegree = false;
    if (isKid) {
      const currentIdx = KIDS_BELT_SEQUENCE.indexOf(normalizedBelt as any);
      if (currentIdx !== -1 && currentIdx < KIDS_BELT_SEQUENCE.length - 1) {
        nextBelt = KIDS_BELT_SEQUENCE[currentIdx + 1];
      } else {
        // Se já chegou no topo do infantil ou fez 16 anos, vai para a azul
        nextBelt = BeltColor.BLUE;
      }
    } else {
      const currentIdx = ADULT_BELT_SEQUENCE.indexOf(normalizedBelt as any);
      if (currentIdx !== -1 && currentIdx < ADULT_BELT_SEQUENCE.length - 1) {
        nextBelt = ADULT_BELT_SEQUENCE[currentIdx + 1];
      } else {
        nextBelt = BeltColor.RED; // Limite
      }
    }
  }

  // 2. Cálculo do Tempo Oficial decorrido na faixa
  let lastPromoDate: Date;
  
  if (isBlackBeltBelt || isCoralBeltBelt || isRedBeltBelt) {
    let baseDateStr = student.blackBeltDate || student.lastPromotionDate || student.beltSince;
    if (baseDateStr instanceof Date) {
      baseDateStr = baseDateStr.toISOString().split('T')[0];
    } else if (baseDateStr) {
      baseDateStr = String(baseDateStr).split('T')[0];
    }
    
    let baseDate = baseDateStr ? new Date(baseDateStr + 'T12:00:00') : new Date();
    if (isNaN(baseDate.getTime())) {
      baseDate = new Date();
    }
    
    lastPromoDate = baseDate;
    if (student.lastDegreeDate) {
      const dDate = new Date(student.lastDegreeDate);
      if (!isNaN(dDate.getTime())) {
        lastPromoDate = dDate;
      }
    } else if (student.lastPromotionDate) {
      const pDate = new Date(student.lastPromotionDate);
      if (!isNaN(pDate.getTime())) {
        lastPromoDate = pDate;
      }
    }
  } else {
    let lastPromoDateStr = student.lastPromotionDate;
    if (!lastPromoDateStr && student.beltSince) {
      if (student.beltSince instanceof Date) {
        lastPromoDateStr = student.beltSince.toISOString().split('T')[0];
      } else {
        lastPromoDateStr = String(student.beltSince).split('T')[0];
      }
    }
    if (!lastPromoDateStr) {
      lastPromoDateStr = new Date().toISOString().split('T')[0]; // Safe fallback
    }

    lastPromoDate = new Date(lastPromoDateStr + 'T12:00:00');
    if (isNaN(lastPromoDate.getTime())) {
      lastPromoDate = new Date();
    }
  }

  const diffYears = today.getFullYear() - lastPromoDate.getFullYear();
  const diffMonths = (today.getFullYear() - lastPromoDate.getFullYear()) * 12 + (today.getMonth() - lastPromoDate.getMonth());
  const monthsElapsed = Math.max(0, diffMonths);

  // 3. Determinação de Carência Mínima (Tempos CBJJ/IBJJF oficiais)
  let minTimeMonths = 0;
  if (isPromotionToDegree && !isBlackBeltBelt && !isCoralBeltBelt && !isRedBeltBelt) {
    // Entre graus infantis ou adultos normais: 3-4 meses recomendados
    minTimeMonths = isKid ? 3 : 4;
  } else {
    if (isBlackBeltBelt) {
      // Carência de graus (0 a 6º grau)
      const currentDegree = currentStripes;
      const progression = getNextBlackBeltProgression(currentDegree);
      minTimeMonths = progression ? progression.monthsRequired : 36;
    } else if (isCoralBeltBelt) {
      // Coral Vermelha e Preta ou Vermelha e Branca: carência de 7 anos (84 meses)
      const currentDegree = currentStripes;
      const progression = getNextBlackBeltProgression(currentDegree);
      minTimeMonths = progression ? progression.monthsRequired : 84;
    } else if (isRedBeltBelt) {
      // Vermelha (9º/10º graus): carência de 10 anos (120 meses)
      minTimeMonths = 120;
    } else {
      // Carência oficial de Faixa para Faixa (Tratamento especial para White_Kid)
      const ruleKey = (normalizedBelt === 'White') && isKid ? 'White_Kid' : normalizedBelt;
      const rule = BELT_RULES[ruleKey];
      if (rule) {
        minTimeMonths = rule.minimumTimeMonths;
      } else {
        minTimeMonths = isKid ? 4 : 12; // Geral
      }
    }

    // Exceção oficial IBJJF: Faixa roxa com 17 anos possui carência reduzida para 12 meses
    if (!isKid && normalizedBelt === 'Purple' && age === 17) {
      minTimeMonths = 12;
    }
  }

  // Se for Branca Adulto, não há carência oficial regulamentar CBJJ por idade para Azul
  if (!isKid && normalizedBelt === 'White' && !isPromotionToDegree) {
    minTimeMonths = 0;
  }

  // 4. Verificação de Idade Mínima CBJJ/IBJJF
  let isAgeOk = true;
  const reasons: string[] = [];
  
  if (!isPromotionToDegree || isBlackBeltBelt || isCoralBeltBelt || isRedBeltBelt) {
    const nextRule = BELT_RULES[nextBelt];
    if (nextRule && !isBlackBeltBelt && !isCoralBeltBelt && !isRedBeltBelt) {
      if (age < nextRule.minimumAge) {
        isAgeOk = false;
        reasons.push(`Idade mínima para ${getBeltLabel(nextBelt, isKid)} é de ${nextRule.minimumAge} anos (Atleta possui ${age} anos).`);
      }
    } else {
      // Regras de idade para Preta, Coral e Vermelha
      const nextDegreeNum = targetDegree || (currentStripes + 1);
      const ageSpecs: Record<number, number> = {
        1: 22, 2: 25, 3: 28, 4: 33, 5: 38, 6: 43, 7: 50, 8: 57, 9: 67
      };
      const minAgeRequired = ageSpecs[nextDegreeNum] || 19;
      if (age < minAgeRequired) {
        isAgeOk = false;
        reasons.push(`Idade mínima exigida pela CBJJ para o ${nextDegreeNum}º Grau / Faixa correspondente é de ${minAgeRequired} anos (Atleta possui ${age} anos).`);
      }
    }
  }

  // Verificar tempo mínimo
  const isTimeOk = monthsElapsed >= minTimeMonths;
  if (!isTimeOk) {
    const missing = minTimeMonths - monthsElapsed;
    reasons.push(`Tempo de carência pendente: faltam ${missing} ${missing === 1 ? 'mês' : 'meses'} na graduação atual.`);
  }

  // Professor criteria
  if (student.professorCriteria === false) {
    reasons.push('Bloqueado técnica ou administrativamente pelo Professor.');
  }

  // Elegibilidade Final
  const isEligible = isTimeOk && isAgeOk && student.professorCriteria !== false;

  // Visuals: tempo decorrido string
  let timeSpentStr = '';
  const yearsSpent = Math.floor(monthsElapsed / 12);
  const remMonthsSpent = monthsElapsed % 12;
  if (yearsSpent === 0) {
    timeSpentStr = `${monthsElapsed} ${monthsElapsed === 1 ? 'mês' : 'meses'}`;
  } else {
    timeSpentStr = `${yearsSpent} ${yearsSpent === 1 ? 'ano' : 'anos'}${remMonthsSpent > 0 ? ` e ${remMonthsSpent} ${remMonthsSpent === 1 ? 'mês' : 'meses'}` : ''}`;
  }

  // Visuals: elegibilidade status string
  let eligibleStr = '';
  if (isEligible) {
    eligibleStr = 'Elegível para graduação ✔';
  } else if (!isAgeOk) {
    eligibleStr = `Abaixo da idade mínima permitida pela CBJJ`;
  } else if (!isTimeOk) {
    const remaining = minTimeMonths - monthsElapsed;
    const remYears = Math.floor(remaining / 12);
    const remMonths = remaining % 12;
    if (remYears === 0) {
      eligibleStr = `Carência pendente: elegível em ${remMonths} ${remMonths === 1 ? 'mês' : 'meses'}`;
    } else {
      eligibleStr = `Carência pendente: elegível em ${remYears} ${remYears === 1 ? 'ano' : 'anos'}${remMonths > 0 ? ` e ${remMonths} ${remMonths === 1 ? 'mês' : 'meses'}` : ''}`;
    }
  } else {
    eligibleStr = 'Critérios pendentes (Avaliação de Professor)';
  }

  // Progresso em porcentagem
  const progress = minTimeMonths > 0 ? Math.min(100, Math.round((monthsElapsed / minTimeMonths) * 100)) : 100;
  
  // Data prevista de conclusão de carência
  const nextPromotionDate = new Date(lastPromoDate);
  nextPromotionDate.setMonth(nextPromotionDate.getMonth() + minTimeMonths);

  // Black belt custom properties
  let yearsRemaining = 0;
  let monthsRemaining = 0;
  let accumulatedStr = '';
  let nextTitle = '';
  let futureBeltType = 'Preta';
  let remainingStr = '';

  if (isBlackBeltBelt || isCoralBeltBelt || isRedBeltBelt) {
    const remainingMonths = Math.max(0, minTimeMonths - monthsElapsed);
    monthsRemaining = remainingMonths;
    yearsRemaining = Math.floor(remainingMonths / 12);
    
    if (yearsRemaining === 0) {
      remainingStr = `${monthsRemaining} ${monthsRemaining === 1 ? 'mês' : 'meses'}`;
    } else {
      const remMonths = monthsRemaining % 12;
      remainingStr = `${yearsRemaining} ${yearsRemaining === 1 ? 'ano' : 'anos'}${remMonths > 0 ? ` e ${remMonths} ${remMonths === 1 ? 'mês' : 'meses'}` : ''}`;
    }

    let baseDateStr = student.blackBeltDate || student.lastPromotionDate || student.beltSince;
    if (baseDateStr instanceof Date) {
      baseDateStr = baseDateStr.toISOString().split('T')[0];
    } else if (baseDateStr) {
      baseDateStr = String(baseDateStr).split('T')[0];
    }
    const baseDate = baseDateStr ? new Date(baseDateStr + 'T12:00:00') : new Date();
    const monthsAccumulated = Math.max(0, (today.getFullYear() - baseDate.getFullYear()) * 12 + (today.getMonth() - baseDate.getMonth()));
    const yearsAccumulated = Math.floor(monthsAccumulated / 12);
    const remMonthsAccumulated = monthsAccumulated % 12;
    accumulatedStr = yearsAccumulated === 0
      ? `${monthsAccumulated} ${monthsAccumulated === 1 ? 'mês' : 'meses'}`
      : `${yearsAccumulated} ${yearsAccumulated === 1 ? 'ano' : 'anos'}${remMonthsAccumulated > 0 ? ` e ${remMonthsAccumulated} ${remMonthsAccumulated === 1 ? 'mês' : 'meses'}` : ''}`;

    const progression = getNextBlackBeltProgression(currentStripes);
    if (progression) {
      nextTitle = progression.nextTitle;
      const nextDeg = progression.nextDegree;
      if (nextDeg === 7) futureBeltType = 'Coral (Vermelha e Preta)';
      else if (nextDeg === 8) futureBeltType = 'Coral (Vermelha e Branca)';
      else if (nextDeg === 9) futureBeltType = 'Vermelha';
      else futureBeltType = 'Preta';
    } else {
      nextTitle = 'Graduação Máxima';
      futureBeltType = 'Vermelha';
    }
  }

  const result: EligibilityResult = {
    isEligible,
    nextBelt,
    isPromotionToDegree,
    targetDegree,
    monthsElapsed,
    minTimeRequiredMonths: minTimeMonths,
    progress,
    timeSpentStr,
    eligibleStr,
    reasons,
    nextPromotionDate,
    yearsRemaining,
    monthsRemaining,
    accumulatedStr,
    nextTitle,
    futureBeltType,
    remainingStr
  };

  // Salvar no cache antes de retornar
  eligibilityCache.set(cacheKey, { timestamp: Date.now(), result });
  return result;
};

/**
 * Cria uma estrutura de log para auditoria de graduações e overrides administrativos.
 */
export const createGraduationAuditLog = (
  student: Student, 
  newBelt: string, 
  newStripe: number, 
  professorName: string, 
  isOverride = false, 
  justification = ''
) => {
  return {
    studentId: student.id,
    oldBelt: student.belt,
    newBelt: newBelt,
    oldStripe: student.stripes || 0,
    newStripe: newStripe,
    promotedBy: professorName,
    promotedAt: new Date().toISOString(),
    isOverride,
    justification: justification || (isOverride ? "Graduação sob override administrativo do Diretor do Dojô." : "Graduação homologada conforme regras da CBJJ/IBJJF."),
    rulesSnapshot: `CBJJ_V2026.1_AGE-${student.birthDate ? 'OK' : 'DEFAULT'}`
  };
};
