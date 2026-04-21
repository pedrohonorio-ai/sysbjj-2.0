
import { CBJJCategory, Gender } from '../types';

export const calculateCBJJCategory = (birthDate: string): CBJJCategory => {
  const birthYear = new Date(birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  if (age <= 6) return CBJJCategory.MIRIM_1; // Simplified
  if (age <= 9) return CBJJCategory.INFANTIL_1;
  if (age <= 12) return CBJJCategory.INFANTO_JUVENIL_1;
  if (age <= 15) return CBJJCategory.INFANTO_JUVENIL_3;
  if (age === 16) return CBJJCategory.JUVENIL_1;
  if (age === 17) return CBJJCategory.JUVENIL_2;
  if (age >= 18 && age < 30) return CBJJCategory.ADULTO;
  if (age >= 30 && age < 36) return CBJJCategory.MASTER_1;
  if (age >= 36 && age < 41) return CBJJCategory.MASTER_2;
  if (age >= 41 && age < 46) return CBJJCategory.MASTER_3;
  if (age >= 46 && age < 51) return CBJJCategory.MASTER_4;
  if (age >= 51 && age < 56) return CBJJCategory.MASTER_5;
  if (age >= 56 && age < 61) return CBJJCategory.MASTER_6;
  return CBJJCategory.MASTER_7;
};

export const calculateWeightClass = (weight: number, gender: Gender, category: CBJJCategory): string => {
  // Simplified Adult Male Gi Weight Classes
  if (category === CBJJCategory.ADULTO || category.startsWith('Master') || category.startsWith('Juvenil')) {
    if (gender === Gender.MALE) {
      if (weight <= 57.5) return 'Galo';
      if (weight <= 64.0) return 'Pluma';
      if (weight <= 70.0) return 'Pena';
      if (weight <= 76.0) return 'Leve';
      if (weight <= 82.3) return 'Médio';
      if (weight <= 88.3) return 'Meio-Pesado';
      if (weight <= 94.3) return 'Pesado';
      if (weight <= 100.5) return 'Super-Pesado';
      return 'Pesadíssimo';
    } else {
      // Simplified Adult Female Gi Weight Classes
      if (weight <= 48.5) return 'Galo';
      if (weight <= 53.5) return 'Pluma';
      if (weight <= 58.5) return 'Pena';
      if (weight <= 64.0) return 'Leve';
      if (weight <= 69.0) return 'Médio';
      if (weight <= 74.0) return 'Meio-Pesado';
      if (weight <= 79.3) return 'Pesado';
      return 'Super-Pesado';
    }
  }
  
  // For kids, it's much more complex, returning a generic placeholder or simplified
  return 'Peso de Categoria';
};
