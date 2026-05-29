import { Student, BeltColor, KidsBeltColor, CBJJCategory } from '../../types.js';
import { calculateCBJJCategory } from '../cbjj.js';
import { 
  BELT_RULES, 
  KIDS_BELT_SEQUENCE, 
  ADULT_BELT_SEQUENCE, 
  KIDS_BELT_LABELS, 
  ADULT_BELT_LABELS 
} from './beltRules.js';

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
}

// Map para obter o rótulo legível de qualquer faixa
export const getBeltLabel = (belt: string, isKid: boolean = false): string => {
  if (isKid || KIDS_BELT_LABELS[belt]) {
    return KIDS_BELT_LABELS[belt] || ADULT_BELT_LABELS[belt] || belt;
  }
  return ADULT_BELT_LABELS[belt] || KIDS_BELT_LABELS[belt] || belt;
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
  const currentStripes = student.stripes || student.degrees || 0;

  // 1. Determinação da Próxima Faixa
  let nextBelt = '';
  let isPromotionToDegree = false;
  let targetDegree = 0;
  
  // Se o aluno já tem listras acumuladas, até 4, antes de ir para a próxima faixa ele pode estar ganhando listras
  if (currentStripes < 4 && currentBelt !== 'Preta' && currentBelt !== 'Black' && currentBelt !== 'Red-Black' && currentBelt !== 'Red-White' && currentBelt !== 'Red') {
    // É uma promoção de Grau/Listra dentro da faixa atual
    isPromotionToDegree = true;
    targetDegree = currentStripes + 1;
    nextBelt = currentBelt;
  } else {
    // É uma promoção de FAIXA
    isPromotionToDegree = false;
    if (isKid) {
      const currentIdx = KIDS_BELT_SEQUENCE.indexOf(currentBelt as any);
      if (currentIdx !== -1 && currentIdx < KIDS_BELT_SEQUENCE.length - 1) {
        nextBelt = KIDS_BELT_SEQUENCE[currentIdx + 1];
      } else {
        // Se já chegou no topo do infantil ou fez 16 anos, vai para a azul
        nextBelt = BeltColor.BLUE;
      }
    } else {
      const currentIdx = ADULT_BELT_SEQUENCE.indexOf(currentBelt as any);
      if (currentIdx !== -1 && currentIdx < ADULT_BELT_SEQUENCE.length - 1) {
        nextBelt = ADULT_BELT_SEQUENCE[currentIdx + 1];
      } else {
        nextBelt = BeltColor.RED; // Limite
      }
    }
  }

  // 2. Cálculo do Tempo Oficial decorrido na faixa
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

  let lastPromoDate = new Date(lastPromoDateStr + 'T12:00:00');
  if (isNaN(lastPromoDate.getTime())) {
    lastPromoDate = new Date();
  }

  const diffYears = today.getFullYear() - lastPromoDate.getFullYear();
  const diffMonths = (today.getFullYear() - lastPromoDate.getFullYear()) * 12 + (today.getMonth() - lastPromoDate.getMonth());
  const monthsElapsed = Math.max(0, diffMonths);

  // 3. Determinação de Carência Mínima (Tempos CBJJ/IBJJF oficiais)
  let minTimeMonths = 0;
  if (isPromotionToDegree) {
    // Entre graus infantis ou adultos normais: 3-4 meses recomendados
    minTimeMonths = isKid ? 3 : 4;
  } else {
    // Carência oficial de Faixa para Faixa (Tratamento especial para White_Kid)
    const ruleKey = (currentBelt === 'White' || currentBelt === 'Branca') && isKid ? 'White_Kid' : currentBelt;
    const rule = BELT_RULES[ruleKey];
    if (rule) {
      minTimeMonths = rule.minimumTimeMonths;
    } else {
      // Regras para faixa preta e coral (Baseado em Graus)
      if (currentBelt === 'Preta' || currentBelt === 'Black') {
        minTimeMonths = 36; // 3 anos (36 meses) para graus da faixa preta
      } else if (currentBelt === 'Red-Black' || currentBelt === 'Red-White') {
        minTimeMonths = 84; // 7 anos (84 meses) para graus avançados / Coral
      } else if (currentBelt === 'Red') {
        minTimeMonths = 120; // 10 anos (120 meses) para grandes mestres
      } else {
        minTimeMonths = isKid ? 4 : 12; // Geral
      }
    }

    // Exceção oficial IBJJF: Faixa roxa com 17 anos possui carência reduzida para 12 meses
    if (!isKid && currentBelt === 'Purple' && age === 17) {
      minTimeMonths = 12;
    }
  }

  // Se for Branca Adulto, não há carência oficial regulamentar CBJJ por idade para Azul (embora o professor exija exames/atrito)
  if (!isKid && (currentBelt === 'White' || currentBelt === 'Branca') && !isPromotionToDegree) {
    minTimeMonths = 0;
  }

  // 4. Verificação de Idade Mínima CBJJ/IBJJF
  let isAgeOk = true;
  const reasons: string[] = [];
  
  if (!isPromotionToDegree) {
    const nextRule = BELT_RULES[nextBelt];
    if (nextRule) {
      if (age < nextRule.minimumAge) {
        isAgeOk = false;
        reasons.push(`Idade mínima para ${getBeltLabel(nextBelt, isKid)} é de ${nextRule.minimumAge} anos (Atleta possui ${age} anos).`);
      }
    } else {
      // Regras de idade para Preta, Coral e Vermelha
      if (nextBelt === 'Black' && age < 19) {
        isAgeOk = false;
        reasons.push('Idade mínima exigida pela CBJJ para outorga de Faixa Preta é de 19 anos.');
      } else if (nextBelt === 'Red-Black' && age < 50) {
        isAgeOk = false;
        reasons.push('Idade mínima para a Faixa Coral Vermelha e Preta (7º Grau) é de 50 anos.');
      } else if (nextBelt === 'Red-White' && age < 60) {
        isAgeOk = false;
        reasons.push('Idade mínima para a Faixa Coral Vermelha e Branca (8º Grau) é de 60 anos.');
      } else if (nextBelt === 'Red' && age < 67) {
        isAgeOk = false;
        reasons.push('Idade mínima para a Faixa Vermelha (9º Grau Grande Mestre) é de 67 anos.');
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
    nextPromotionDate
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
