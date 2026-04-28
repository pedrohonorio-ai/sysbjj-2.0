
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProfessorProfile, BeltColor } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { compressImage } from '../services/imageUtils';

interface ProfileContextType {
  profile: ProfessorProfile;
  updateProfile: (newProfile: Partial<ProfessorProfile>) => void;
}

const DEFAULT_PROFILE: ProfessorProfile = {
  name: 'Sensei SYSBJJ',
  academyName: 'SYSBJJ 2.0',
  belt: BeltColor.BLACK,
  stripes: 6,
  specialization: 'Jiu-Jitsu de Elite',
  pixKey: 'financeiro@sysbjj.com.br',
  pixName: 'SYSBJJ ACADEMY',
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

  const saveProfileLocally = (data: ProfessorProfile) => {
    try {
      localStorage.setItem('professor_profile', JSON.stringify(data));
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.warn("Local Storage quota exceeded for professor_profile. Data safely synced to cloud but local cache may be stale.");
        // Try to clear some less critical data to make room
        try {
          localStorage.removeItem('oss_logs');
          localStorage.removeItem('oss_presence');
          localStorage.setItem('professor_profile', JSON.stringify(data));
        } catch (retryError) {
          console.error("Critical: Could not save profile even after clearing logs.");
        }
      }
    }
  };

  // Firestore Sync for Profile
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'profile'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ProfessorProfile;
        setProfileState(data);
        saveProfileLocally(data);
      }
    });
    return () => unsub();
  }, []);

  const updateProfile = async (newProfileUpdate: Partial<ProfessorProfile>) => {
    const finalUpdate = { ...newProfileUpdate };
    
    // Compress images if present
    if (finalUpdate.logoUrl && finalUpdate.logoUrl.startsWith('data:image')) {
      finalUpdate.logoUrl = await compressImage(finalUpdate.logoUrl);
    }
    if (finalUpdate.backgroundImageUrl && finalUpdate.backgroundImageUrl.startsWith('data:image')) {
      finalUpdate.backgroundImageUrl = await compressImage(finalUpdate.backgroundImageUrl, 1200, 0.6);
    }

    const updated = { ...profile, ...finalUpdate };
    setProfileState(updated);
    saveProfileLocally(updated);

    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'profile'), updated);
      } catch (e) {
        console.error("Erro ao salvar perfil no Firestore:", e);
      }
    }
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
