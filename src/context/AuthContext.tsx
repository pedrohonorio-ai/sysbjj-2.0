import React, { createContext, useContext, useEffect, useState } from 'react';

// 🥋 OSS SENSEI: Definindo tipo de usuário nativo para o ecossistema SYBJJ
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'student' | 'MASTER';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  role: 'admin' | 'student' | null;
  studentCode?: string;
}

interface AuthContextType extends AuthState {
  isConfigured: boolean;
  isMasterAdmin: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, name?: string) => Promise<any>;
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

  const safeParse = (data: string | null) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      if (import.meta.env.DEV) console.warn("🥋 OSS SENSEI: Falha ao parsear dados locais.");
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

    // 🥋 OSS SENSEI: Registra listener de autolimpeza para sessões expiradas/403
    const handleUnauthorized = () => {
      setUser(null);
      setRole(null);
      setStudentCode(undefined);
    };

    window.addEventListener('oss_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('oss_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('🥋 [AUTH LOGIN FAIL] Resposta não-JSON:', text.substring(0, 100));
        throw new Error('O servidor de autenticação respondeu em um formato inválido. Tente novamente.');
      }

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
        userId: loggedUser.id,
        token: result.token
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('🥋 [AUTH REGISTER FAIL] Resposta não-JSON:', text.substring(0, 100));
        throw new Error('O servidor de registro respondeu em um formato inválido. Tente novamente.');
      }

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
        userId: newUser.id,
        token: result.token
      }));
      return { data: { user: newUser }, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
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

  const isMasterAdmin = React.useMemo(() => {
    if (!user) return false;
    if (user.email === "pedro.honorio@gm.rio") return true;
    if (user.role === 'MASTER') return true;

    try {
      const saved = localStorage.getItem('oss_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === "pedro.honorio@gm.rio") return true;
        
        if (parsed.token) {
          const parts = parsed.token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.role === 'MASTER' || payload.email === "pedro.honorio@gm.rio") {
              return true;
            }
          }
        }
      }
    } catch (e) {
      // safe fallback
    }
    return false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      role, 
      studentCode, 
      isConfigured: true, // Always configured now!
      isMasterAdmin,
      login, 
      register, 
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
