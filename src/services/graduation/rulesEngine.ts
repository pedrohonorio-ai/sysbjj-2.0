import { BeltColor } from '../../../types';
import { beltRules, validateBeltPromotion } from './beltRules';

export interface PromotionRequest {
  studentId: string;
  currentBelt: BeltColor;
  requestedBelt: BeltColor;
  age: number;
  timeInCurrentBeltMonths: number;
  attendanceRate?: number;
}

export interface PromotionResult {
  approved: boolean;
  reason: string;
  nextBelt?: BeltColor;
}

export interface StudentEligibility {
  eligible: boolean;
  reason: string;
  nextBelt?: BeltColor;
  requirements: {
    minAge: number;
    currentAge: number;
    minTimeMonths: number;
    currentTimeMonths: number;
    minAttendance?: number;
    currentAttendance?: number;
  };
}

export class BeltRulesEngine {
  static checkPromotion(request: PromotionRequest): PromotionResult {
    const validation = validateBeltPromotion(
      request.currentBelt,
      request.requestedBelt,
      request.age,
      request.timeInCurrentBeltMonths
    );
    
    if (!validation.valid) {
      return {
        approved: false,
        reason: validation.message || 'Não atende aos requisitos'
      };
    }
    
    // Verificar frequência mínima (opcional)
    if (request.attendanceRate && request.attendanceRate < 70) {
      return {
        approved: false,
        reason: 'Frequência mínima de 70% não atingida'
      };
    }
    
    return {
      approved: true,
      reason: 'Atende a todos os requisitos',
      nextBelt: request.requestedBelt
    };
  }
  
  static getTimeEstimate(currentBelt: BeltColor): number {
    const rule = beltRules.find(r => r.color === currentBelt);
    if (!rule) return 0;
    
    let totalMonths = 0;
    let found = false;
    
    for (const belt of beltRules) {
      if (found) {
        totalMonths += belt.minTimeInPreviousBelt;
      }
      if (belt.color === currentBelt) {
        found = true;
      }
    }
    
    return totalMonths;
  }
}

export function calculateStudentEligibility(
  currentBelt: BeltColor,
  age: number,
  timeInCurrentBeltMonths: number,
  attendanceRate?: number
): StudentEligibility {
  const targetBelt = getNextBelt(currentBelt);
  if (!targetBelt) {
    return {
      eligible: false,
      reason: 'Já está na faixa máxima',
      requirements: {
        minAge: 0,
        currentAge: age,
        minTimeMonths: 0,
        currentTimeMonths: timeInCurrentBeltMonths,
        minAttendance: 70,
        currentAttendance: attendanceRate
      }
    };
  }
  
  const validation = validateBeltPromotion(currentBelt, targetBelt, age, timeInCurrentBeltMonths);
  const targetRule = beltRules.find(r => r.color === targetBelt);
  
  return {
    eligible: validation.valid,
    reason: validation.message || (validation.valid ? 'Elegível para promoção' : 'Não elegível'),
    nextBelt: validation.valid ? targetBelt : undefined,
    requirements: {
      minAge: targetRule?.minAge || 0,
      currentAge: age,
      minTimeMonths: targetRule?.minTimeInPreviousBelt || 0,
      currentTimeMonths: timeInCurrentBeltMonths,
      minAttendance: 70,
      currentAttendance: attendanceRate
    }
  };
}

function getNextBelt(currentBelt: BeltColor): BeltColor | null {
  const order: BeltColor[] = ['white', 'blue', 'purple', 'brown', 'black'];
  const index = order.indexOf(currentBelt);
  if (index === -1 || index === order.length - 1) return null;
  return order[index + 1];
}
