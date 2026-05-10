import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  role: 'admin' | 'student' | null;
  studentCode?: string;
  isAnonymous: boolean;
}

interface AuthContextType extends AuthState {
  isConfigured: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, name?: string) => Promise<any>;
  loginAnonymous: () => Promise<any>;
  linkEmail: (email: string, pass: string) => Promise<any>;
  updatePassword: (newPass: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setStudentAuth: (code: string) => void;
  isRecovering: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'student' | null>(null);
  const [studentCode, setStudentCode] = useState<string | undefined>(undefined);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Restore session from localStorage for initial state
    const saved = localStorage.getItem('oss_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'student') {
          setRole('student');
          setStudentCode(parsed.studentCode);
        }
      } catch (e) {
        console.error("Auth context restore error", e);
      }
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAnonymous(session?.user?.is_anonymous ?? false);
      if (session?.user) {
        setRole('admin');
      } else if (role !== 'student') {
        const saved = localStorage.getItem('oss_auth');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.role !== 'student') {
          setRole(null);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAnonymous(session?.user?.is_anonymous ?? false);
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }

      if (session?.user) {
        setRole('admin');
      } else {
        // If no session, check if we are in student mode
        const saved = localStorage.getItem('oss_auth');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.role === 'student') {
          setRole('student');
          setStudentCode(parsed.studentCode);
        } else {
          setRole(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    return supabase.auth.signInWithPassword({ email, password: pass });
  };

  const register = async (email: string, pass: string, name?: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    return supabase.auth.signUp({ 
      email, 
      password: pass,
      options: {
        data: {
          full_name: name
        }
      }
    });
  };

  const loginAnonymous = async () => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  };

  const linkEmail = async (email: string, pass: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data: emailData, error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) throw emailError;
    
    const { data: passData, error: passError } = await supabase.auth.updateUser({ password: pass });
    if (passError) throw passError;
    
    return { emailData, passData };
  };

  const updatePassword = async (newPass: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
    setIsRecovering(false);
    return data;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('oss_auth');
    setRole(null);
    setStudentCode(undefined);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  };

  const setStudentAuth = (code: string) => {
    setRole('student');
    setStudentCode(code);
    localStorage.setItem('oss_auth', JSON.stringify({ isLoggedIn: true, role: 'student', studentCode: code }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      role, 
      studentCode, 
      isAnonymous,
      isConfigured: !!supabase,
      login, 
      register, 
      loginAnonymous,
      linkEmail,
      updatePassword,
      logout,
      resetPassword,
      setStudentAuth,
      isRecovering
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
