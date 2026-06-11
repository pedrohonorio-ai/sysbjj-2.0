import { BeltColor, KidsBeltColor } from '../../../types';

export interface BeltRule {
  color: BeltColor | KidsBeltColor;
  minAge: number;
  minTimeInPreviousBelt: number;
  stripeRequirements: number;
  canSkip?: boolean;
  name: string;
  description: string;
  order: number;
}

export const beltRules: BeltRule[] = [
  { color: 'white', minAge: 4, minTimeInPreviousBelt: 0, stripeRequirements: 0, name: 'Branca', description: 'Faixa inicial', order: 1 },
  { color: 'blue', minAge: 16, minTimeInPreviousBelt: 24, stripeRequirements: 4, name: 'Azul', description: 'Conhecimento básico', order: 2 },
  { color: 'purple', minAge: 16, minTimeInPreviousBelt: 18, stripeRequirements: 3, name: 'Roxa', description: 'Nível intermediário', order: 3 },
  { color: 'brown', minAge: 18, minTimeInPreviousBelt: 18, stripeRequirements: 3, name: 'Marrom', description: 'Avançado', order: 4 },
  { color: 'black', minAge: 19, minTimeInPreviousBelt: 12, stripeRequirements: 0, name: 'Preta', description: 'Mestria', order: 5 }
];

export const BELT_RULES = beltRules;

export function validateBeltPromotion(
  currentBelt: BeltColor,
  targetBelt: BeltColor,
  age: number,
  timeInCurrentBelt: number
): { valid: boolean; message?: string } {
  const currentRule = beltRules.find(r => r.color === currentBelt);
  const targetRule = beltRules.find(r => r.color === targetBelt);
  
  if (!targetRule) {
    return { valid: false, message: 'Faixa inválida' };
  }
  
  if (age < targetRule.minAge) {
    return { valid: false, message: `Idade mínima para ${targetRule.name} é ${targetRule.minAge} anos` };
  }
  
  if (currentRule && timeInCurrentBelt < targetRule.minTimeInPreviousBelt) {
    return { valid: false, message: `Tempo mínimo na faixa anterior: ${targetRule.minTimeInPreviousBelt} meses` };
  }
  
  return { valid: true, message: 'Promoção válida' };
}

export function getBeltLabel(belt: BeltColor): string {
  const rule = beltRules.find(r => r.color === belt);
  return rule ? rule.name : belt;
}
