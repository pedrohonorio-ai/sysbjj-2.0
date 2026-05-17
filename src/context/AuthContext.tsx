import React, { createContext, useContext, useEffect, useState } from 'react';

// 🥋 OSS SENSEI: Definindo tipo de usuário nativo para o ecossistema SYBJJ
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'student';
  is_anonymous?: boolean;
}

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
  loginDemo: () => void;
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

  const safeParse = (data: string | null) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn("🥋 OSS SENSEI: Falha ao parsear dados locais.");
      return null;
    }
  };

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem('oss_auth');
    const parsed = safeParse(saved);
    
    if (parsed && parsed.isLoggedIn) {
      if (parsed.role === 'admin') {
        setUser({
          id: parsed.userId || 'local-admin',
          email: parsed.email || 'admin@sysbjj.com',
          name: parsed.name || 'Professor Master',
          role: 'admin'
        });
        setRole('admin');
      } else if (parsed.role === 'student') {
        setRole('student');
        setStudentCode(parsed.studentCode);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer login');
      }

      const loggedUser = result.user;
      
      setUser(loggedUser);
      setRole('admin');
      localStorage.setItem('oss_auth', JSON.stringify({ 
        isLoggedIn: true, 
        role: 'admin', 
        email,
        userId: loggedUser.id 
      }));
      
      return { data: { user: loggedUser }, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao registrar');
      }

      const newUser = result.user;

      setUser(newUser);
      setRole('admin');
      localStorage.setItem('oss_auth', JSON.stringify({ 
        isLoggedIn: true, 
        role: 'admin', 
        email,
        name,
        userId: newUser.id 
      }));
      return { data: { user: newUser }, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const loginAnonymous = async () => {
    const mockUser: User = {
      id: 'anon-' + Math.random().toString(36).substr(2, 9),
      email: 'convidado@sysbjj.com',
      role: 'admin',
      is_anonymous: true
    };
    setUser(mockUser);
    setRole('admin');
    setIsAnonymous(true);
    localStorage.setItem('oss_auth', JSON.stringify({ 
      isLoggedIn: true, 
      role: 'admin', 
      isAnonymous: true,
      userId: mockUser.id 
    }));
    return mockUser;
  };

  const loginDemo = () => {
    localStorage.setItem('oss_demo_mode', 'true');
    const mockUser: User = {
      id: 'demo-user-id',
      email: 'demo@sysbjj.com',
      name: 'Professor Demo',
      role: 'admin',
      is_anonymous: true
    };
    
    setUser(mockUser);
    setRole('admin');
    setIsAnonymous(true);
    localStorage.setItem('oss_auth', JSON.stringify({ 
      isLoggedIn: true, 
      role: 'admin', 
      isDemo: true,
      email: 'demo@sysbjj.com',
      userId: mockUser.id
    }));
    
    window.location.reload(); 
  };

  const linkEmail = async (email: string, pass: string) => {
    return { success: true };
  };

  const updatePassword = async (newPass: string) => {
    setIsRecovering(false);
    return { success: true };
  };

  const logout = async () => {
    localStorage.removeItem('oss_auth');
    localStorage.removeItem('oss_demo_mode');
    setUser(null);
    setRole(null);
    setStudentCode(undefined);
  };

  const resetPassword = async (email: string) => {
    if (import.meta.env.DEV) {
      console.log("Reset password requested for", email);
    }
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
      isConfigured: true, // Always configured now!
      login, 
      register, 
      loginAnonymous,
      loginDemo,
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
