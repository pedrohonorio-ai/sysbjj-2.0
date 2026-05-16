
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProfessorProfile, BeltColor } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ProfileContextType {
  profile: ProfessorProfile;
  updateProfile: (updates: Partial<ProfessorProfile>) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_PROFILE: ProfessorProfile = {
  name: "Sensei SYSBJJ",
  academyName: "SYSBJJ 2.0",
  belt: BeltColor.BLACK,
  stripes: 1,
  specialization: "Brazilian Jiu-Jitsu Master",
  pixKey: "",
  pixName: "",
  pixCity: "",
  logoUrl: "",
  backgroundImageUrl: ""
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

import { handleApiError, OperationType, useData } from './DataContext';

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { setNotifications, setDbStatus, dbStatus } = useData() as any; // Safe cast as we know the structure
  
  const [profile, setProfile] = useState<ProfessorProfile>(() => {
    try {
      const saved = localStorage.getItem('oss_profile');
      if (!saved) return DEFAULT_PROFILE;
      return JSON.parse(saved);
    } catch (e) {
      console.warn("🥋 OSS SENSEI: Perfil local corrompido, usando padrão.");
      return DEFAULT_PROFILE;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || dbStatus?.isDemoMode) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const cloudProfile = await api.fetchData('profile', user.id);
        if (cloudProfile && !Array.isArray(cloudProfile)) {
          setProfile(cloudProfile);
          localStorage.setItem('oss_profile', JSON.stringify(cloudProfile));
        } else if (!cloudProfile || (Array.isArray(cloudProfile) && cloudProfile.length === 0)) {
           // Initialize if not exists
           await api.saveData('profile', user.id, profile);
        }
      } catch (error) {
        handleApiError(error, OperationType.GET, 'profile', setNotifications, setDbStatus);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, dbStatus?.isDemoMode]);

  const updateProfile = async (updates: Partial<ProfessorProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem('oss_profile', JSON.stringify(newProfile));

    if (user?.id && !dbStatus?.isDemoMode) {
      await api.saveData('profile', user.id, newProfile).catch(error => {
        handleApiError(error, OperationType.UPDATE, 'profile', setNotifications, setDbStatus);
      });
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
