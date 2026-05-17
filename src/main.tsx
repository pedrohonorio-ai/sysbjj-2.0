import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { LanguageProvider } from './contexts/LanguageContext.js';
import { ProfileProvider } from './contexts/ProfileContext.js';
import { DataProvider } from './contexts/DataContext.js';
import { AuthProvider } from './context/AuthContext.js';

// 🥋 OSS SENSEI: Global Production Guard
// Limpa ruídos de WebSocket e HMR em produção antes de iniciar o React
if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
  // 1. Silencia logs do Vite que tentam se conectar ao HMR desabilitado
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('[vite]') || args[0].includes('WebSocket'))) return;
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('[vite]') || args[0].includes('WebSocket'))) return;
    originalError.apply(console, args);
  };

  // 2. Intercepta erros de rede/websocket globais
  window.addEventListener('error', (e: any) => {
    if (e.message?.includes('WebSocket') || e.target instanceof WebSocket || (e.error && e.error.message?.includes('WebSocket'))) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  // 3. Intercepta Rejeições Não Tratadas (comum em erros de WebSocket fechado prematuramente)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : (reason?.message || '');
    if (message.includes('WebSocket')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

  const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{ 
    padding: '40px', 
    color: '#fff', 
    backgroundColor: '#020617', 
    height: '100vh', 
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  }}>
    <div style={{ 
      width: '80px', 
      height: '80px', 
      backgroundColor: '#ef4444', 
      borderRadius: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginBottom: '24px',
      boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)'
    }}>
      <span style={{ fontSize: '40px', fontWeight: 'bold' }}>!</span>
    </div>
    <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.05em', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: '16px' }}>
      SISTEMA INTERROMPIDO
    </h1>
    <p style={{ fontSize: '18px', fontWeight: '500', color: '#94a3b8', marginBottom: '32px', maxWidth: '500px' }}>
      OSS! Sensei, ocorreu um erro técnico que impediu a evolução do sistema. O tatame está sendo limpo.
    </p>
    <div style={{ 
      backgroundColor: '#1e293b', 
      padding: '24px', 
      borderRadius: '24px', 
      border: '1px solid rgba(255,255,255,0.1)',
      textAlign: 'left',
      maxWidth: '600px',
      width: '100%',
      marginBottom: '32px'
    }}>
      <p style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Log de Erro:</p>
      <pre style={{ margin: 0, fontSize: '13px', overflow: 'auto', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>{error.message}</pre>
    </div>
    <button 
      onClick={() => window.location.reload()}
      style={{ 
        padding: '16px 40px', 
        backgroundColor: '#2563eb', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '20px', 
        fontWeight: '900', 
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        cursor: 'pointer',
        boxShadow: '0 20px 40px rgba(37, 99, 235, 0.3)',
        transition: 'all 0.2s'
      }}
    >
      REINICIAR SISTEMA
    </button>
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DataProvider>
                <ProfileProvider>
                  <App />
                </ProfileProvider>
              </DataProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
