export type BeltRank =
  | "white"
  | "blue"
  | "purple"
  | "brown"
  | "black";

export type BlackBeltDegree =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9;

export const BLACK_BELT_RULES = {
  0: 36,
  1: 36,
  2: 36,
  3: 60,
  4: 60,
  5: 60,
  6: 84,
  7: 84,
  8: 120,
};

export function getNextBlackBeltProgression(degree: number) {
  switch (degree) {
    case 0:
      return {
        nextDegree: 1,
        nextTitle: "Faixa Preta 1º Grau",
        monthsRequired: 36,
      };

    case 1:
      return {
        nextDegree: 2,
        nextTitle: "Faixa Preta 2º Grau",
        monthsRequired: 36,
      };

    case 2:
      return {
        nextDegree: 3,
        nextTitle: "Faixa Preta 3º Grau",
        monthsRequired: 36,
      };

    case 3:
      return {
        nextDegree: 4,
        nextTitle: "Faixa Preta 4º Grau",
        monthsRequired: 60,
      };

    case 4:
      return {
        nextDegree: 5,
        nextTitle: "Faixa Preta 5º Grau",
        monthsRequired: 60,
      };

    case 5:
      return {
        nextDegree: 6,
        nextTitle: "Faixa Preta 6º Grau",
        monthsRequired: 60,
      };

    case 6:
      return {
        nextDegree: 7,
        nextTitle: "Coral Vermelha e Preta",
        monthsRequired: 84,
      };

    case 7:
      return {
        nextDegree: 8,
        nextTitle: "Coral Vermelha e Branca",
        monthsRequired: 84,
      };

    case 8:
      return {
        nextDegree: 9,
        nextTitle: "Faixa Vermelha",
        monthsRequired: 120,
      };

    default:
      return null;
  }
}

export function canPromoteBlackBelt(
  lastPromotionDate: Date | string,
  currentDegree: number
) {
  const progression = getNextBlackBeltProgression(currentDegree);

  if (!progression) return false;

  const promoDate = typeof lastPromotionDate === 'string' ? new Date(lastPromotionDate) : lastPromotionDate;
  if (!promoDate || isNaN(promoDate.getTime())) return false;

  const now = new Date();

  const diffMonths =
    (now.getFullYear() - promoDate.getFullYear()) * 12 +
    (now.getMonth() - promoDate.getMonth());

  return diffMonths >= progression.monthsRequired;
}

export function getBlackBeltTitle(degree: number) {
  switch (degree) {
    case 0:
      return "Faixa Preta";

    case 1:
      return "Faixa Preta 1º Grau";

    case 2:
      return "Faixa Preta 2º Grau";

    case 3:
      return "Faixa Preta 3º Grau";

    case 4:
      return "Faixa Preta 4º Grau";

    case 5:
      return "Faixa Preta 5º Grau";

    case 6:
      return "Faixa Preta 6º Grau";

    case 7:
      return "Coral Vermelha e Preta";

    case 8:
      return "Coral Vermelha e Branca";

    case 9:
      return "Faixa Vermelha";

    default:
      return "Faixa Preta";
  }
}

