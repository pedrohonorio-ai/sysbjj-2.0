
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProfessorProfile, BeltColor } from '../types';
import { db, auth } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

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

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<ProfessorProfile>(() => {
    const saved = localStorage.getItem('oss_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    // Use the UID for individual profiles
    const profileRef = doc(db, 'users', uid, 'settings', 'academy_profile');
    
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudProfile = docSnap.data() as ProfessorProfile;
        setProfile(cloudProfile);
        localStorage.setItem('oss_profile', JSON.stringify(cloudProfile));
      } else {
        // If it doesn't exist in cloud yet for this user, initialize it
        setDoc(profileRef, profile).catch(console.error);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Profile sync error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const updateProfile = async (updates: Partial<ProfessorProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem('oss_profile', JSON.stringify(newProfile));

    if (db && auth.currentUser) {
      const uid = auth.currentUser.uid;
      const profileRef = doc(db, 'users', uid, 'settings', 'academy_profile');
      await setDoc(profileRef, newProfile, { merge: true });
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
