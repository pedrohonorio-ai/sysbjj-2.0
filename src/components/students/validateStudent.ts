import { Student } from '../../types';

export const validateStudent = (student: Partial<Student>, t: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!student.name || student.name.trim().length < 3) {
    errors.push(t('students.validation.nameLength') || 'O nome precisa ter pelo menos 3 caracteres');
  }

  if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    errors.push(t('students.validation.invalidEmail') || 'Email inválido');
  }

  if (student.cpf && student.cpf.replace(/\D/g, '').length !== 11) {
    errors.push(t('students.validation.cpfLength') || 'Dígitos do CPF incorretos');
  }

  if (student.phone && student.phone.replace(/\D/g, '').length < 10) {
    errors.push(t('students.validation.invalidPhone') || 'Telefone inválido');
  }

  if (!student.birthDate) {
    errors.push(t('students.validation.birthDateRequired') || 'Data de nascimento obrigatória');
  }

  if (student.monthlyValue !== undefined && student.monthlyValue < 0) {
    errors.push(t('students.validation.negativeMonthly') || 'Valor da mensalidade não pode ser negativo');
  }

  if (student.dueDay !== undefined && (student.dueDay < 1 || student.dueDay > 31)) {
    errors.push(t('students.validation.dueDayRange') || 'Dia de vencimento inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
