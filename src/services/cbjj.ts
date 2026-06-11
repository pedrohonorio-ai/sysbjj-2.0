export interface CBJJCategory {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  weightClasses: WeightClass[];
}

export interface WeightClass {
  name: string;
  minWeight?: number;
  maxWeight?: number;
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

// Categorias por idade da CBJJ/IBJJF
export const ageCategories: CBJJCategory[] = [
  {
    id: 'pre-infantil',
    name: 'Pré-Infantil',
    minAge: 4,
    maxAge: 7,
    weightClasses: [
      { name: 'Super-Leve', maxWeight: 25 },
      { name: 'Leve', minWeight: 25, maxWeight: 30 },
      { name: 'Pesado', minWeight: 30 }
    ]
  },
  {
    id: 'infantil',
    name: 'Infantil',
    minAge: 8,
    maxAge: 11,
    weightClasses: [
      { name: 'Super-Leve', maxWeight: 35 },
      { name: 'Leve', minWeight: 35, maxWeight: 40 },
      { name: 'Médio', minWeight: 40, maxWeight: 45 },
      { name: 'Meio-Pesado', minWeight: 45, maxWeight: 50 },
      { name: 'Pesado', minWeight: 50 }
    ]
  },
  {
    id: 'infanto-juvenil',
    name: 'Infanto-Juvenil',
    minAge: 12,
    maxAge: 15,
    weightClasses: [
      { name: 'Pluma', maxWeight: 44 },
      { name: 'Leve', minWeight: 44, maxWeight: 48 },
      { name: 'Médio', minWeight: 48, maxWeight: 52 },
      { name: 'Meio-Pesado', minWeight: 52, maxWeight: 57 },
      { name: 'Pesado', minWeight: 57, maxWeight: 62 },
      { name: 'Super-Pesado', minWeight: 62 }
    ]
  },
  {
    id: 'juvenil',
    name: 'Juvenil',
    minAge: 16,
    maxAge: 17,
    weightClasses: [
      { name: 'Pluma', maxWeight: 55.5 },
      { name: 'Leve', minWeight: 55.5, maxWeight: 61.5 },
      { name: 'Médio', minWeight: 61.5, maxWeight: 67.5 },
      { name: 'Meio-Pesado', minWeight: 67.5, maxWeight: 73.5 },
      { name: 'Pesado', minWeight: 73.5, maxWeight: 79.5 },
      { name: 'Super-Pesado', minWeight: 79.5 }
    ]
  },
  {
    id: 'adulto',
    name: 'Adulto',
    minAge: 18,
    maxAge: 29,
    weightClasses: [
      { name: 'Pluma', maxWeight: 57.5 },
      { name: 'Leve', minWeight: 57.5, maxWeight: 64 },
      { name: 'Médio', minWeight: 64, maxWeight: 70 },
      { name: 'Meio-Pesado', minWeight: 70, maxWeight: 76 },
      { name: 'Pesado', minWeight: 76, maxWeight: 82.3 },
      { name: 'Super-Pesado', minWeight: 82.3, maxWeight: 88.3 },
      { name: 'Pesadíssimo', minWeight: 88.3 }
    ]
  },
  {
    id: 'master',
    name: 'Master',
    minAge: 30,
    maxAge: 35,
    weightClasses: [
      { name: 'Pluma', maxWeight: 57.5 },
      { name: 'Leve', minWeight: 57.5, maxWeight: 64 },
      { name: 'Médio', minWeight: 64, maxWeight: 70 },
      { name: 'Meio-Pesado', minWeight: 70, maxWeight: 76 },
      { name: 'Pesado', minWeight: 76, maxWeight: 82.3 },
      { name: 'Super-Pesado', minWeight: 82.3 }
    ]
  }
];

export function getCategoryByAge(age: number): CBJJCategory | undefined {
  return ageCategories.find(cat => age >= cat.minAge && age <= cat.maxAge);
}

export function getWeightClass(weight: number, age: number): WeightClass | undefined {
  const category = getCategoryByAge(age);
  if (!category) return undefined;
  
  return category.weightClasses.find(wc => {
    if (wc.minWeight && wc.maxWeight) {
      return weight >= wc.minWeight && weight <= wc.maxWeight;
    } else if (wc.maxWeight) {
      return weight <= wc.maxWeight;
    } else if (wc.minWeight) {
      return weight >= wc.minWeight;
    }
    return false;
  });
}

export function calculateCBJJCategory(age: number, weight: number, gender: Gender): string {
  const category = getCategoryByAge(age);
  if (!category) return 'Sem Categoria';
  
  const weightClass = getWeightClass(weight, age);
  const weightClassName = weightClass ? weightClass.name : 'Peso Livre';
  
  return `${category.name} - ${weightClassName}`;
}

export function calculateWeightClass(weight: number, age: number): string {
  const weightClass = getWeightClass(weight, age);
  return weightClass ? weightClass.name : 'Sem Categoria';
}
