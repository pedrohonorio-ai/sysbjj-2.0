
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProfessorProfile, BeltColor } from '../types';

interface ProfileContextType {
  profile: ProfessorProfile;
  updateProfile: (newProfile: Partial<ProfessorProfile>) => void;
}

const DEFAULT_PROFILE: ProfessorProfile = {
  name: 'Sensei PPH',
  academyName: 'PPH BJJ',
  belt: BeltColor.BLACK,
  stripes: 6,
  specialization: 'Jiu-Jitsu de Elite',
  pixKey: 'financeiro@pphbjj.com.br',
  pixName: 'PPH BJJ ACADEMY',
  pixCity: 'SAO PAULO',
  graduationRules: `# Critérios de Graduação da Equipe\n\nPara avançar em sua jornada, o aluno deve cumprir os seguintes requisitos:\n\n1. **Frequência Mínima**: Presença em pelo menos 3 aulas semanais.\n2. **Conhecimento Técnico**: Domínio das técnicas base de sua faixa atual.\n3. **Comportamento**: Disciplina, respeito aos colegas e professores (OSS).\n4. **Participação em Seminários**: Recomendado pelo menos 1 seminário técnico por ano.\n5. **Tempo de Faixa**: Seguir os tempos mínimos exigidos pela IBJJF.\n\n*A decisão final de graduação cabe sempre ao Professor Responsável.*`,
  customCriteria: [
    { id: '1', name: 'Comportamento & Disciplina', weight: 0.25 },
    { id: '2', name: 'Performance em Sparring', weight: 0.25 },
    { id: '3', name: 'Participação em Competições', weight: 0.20 },
    { id: '4', name: 'Dedicação aos Drills', weight: 0.30 }
  ]
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<ProfessorProfile>(() => {
    try {
      const saved = localStorage.getItem('professor_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  });

  const updateProfile = (newProfile: Partial<ProfessorProfile>) => {
    setProfileState(prev => {
      const updated = { ...prev, ...newProfile };
      localStorage.setItem('professor_profile', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};
