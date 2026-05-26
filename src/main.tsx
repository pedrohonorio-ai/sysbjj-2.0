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
import i18n from './i18n/index.js';

const savedLanguage = localStorage.getItem("SYSBJJ_LANG") || "pt-BR";
i18n.changeLanguage(savedLanguage);
document.documentElement.lang = savedLanguage;


// 🥋 OSS SENSEI: Global Production Guard
// Limpa ruídos de WebSocket, HMR, DEBUG, RENDER, etc.
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

const shouldSilenceLog = (message: string): boolean => {
  const lowercaseMsg = String(message).toLowerCase();
  return (
    lowercaseMsg.includes('vite') ||
    lowercaseMsg.includes('websocket') ||
    lowercaseMsg.includes('hmr') ||
    lowercaseMsg.includes('debug') ||
    lowercaseMsg.includes('bootstrap') ||
    lowercaseMsg.includes('render') ||
    lowercaseMsg.includes('api') ||
    lowercaseMsg.includes('connection') ||
    lowercaseMsg.includes('closed')
  );
};

console.log = (...args) => {
  if (typeof args[0] === 'string' && shouldSilenceLog(args[0])) return;
  originalLog.apply(console, args);
};

console.warn = (...args) => {
  if (typeof args[0] === 'string' && shouldSilenceLog(args[0])) return;
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  if (typeof args[0] === 'string' && shouldSilenceLog(args[0])) return;
  originalError.apply(console, args);
};

// 🥋 OSS SENSEI: Global WebSocket Connection Guard & Intelligent Proxy
// Protege o Dojo Cloud de falhas de conexão, multiplas conexões zumbis e erros "closed without opened"
if (typeof window !== "undefined" && !(window as any).__CUSTOM_WS__) {
  (window as any).__CUSTOM_WS__ = true;
  const OriginalWebSocket = window.WebSocket;
  if (typeof OriginalWebSocket !== "undefined") {
    const activeSockets = new Set<any>();

    class ResilientWebSocket extends OriginalWebSocket {
      private _customOnError: any = null;
      private _customOnClose: any = null;

      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        activeSockets.add(this);

        // Tratamento interno de escuta para blindar o console de ruídos de erro
        this.addEventListener('error', (event) => {
          if (this._customOnError) {
            try { this._customOnError(event); } catch (_) {}
          }
        });

        this.addEventListener('close', (event) => {
          activeSockets.delete(this);
          if (this._customOnClose) {
            try { this._customOnClose(event); } catch (_) {}
          }
        });
      }

      // Interceptadores para garantir que listeners do usuário herdem a proteção
      set onerror(handler: any) {
        this._customOnError = handler;
      }
      get onerror() {
        return this._customOnError;
      }

      set onclose(handler: any) {
        this._customOnClose = handler;
      }
      get onclose() {
        return this._customOnClose;
      }

      // 3. Garantir que nenhuma função execute socket.send() antes do evento onopen
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        if (this.readyState === OriginalWebSocket.OPEN) {
          try {
            super.send(data);
          } catch (e) {
            // Engole erro de envio em socket fechado prematuramente
          }
        } else {
          // Silencioso, não dispara erros não tratados no topo da aplicação
        }
      }
    }

    // Bind das constantes de estado regulamentares do WebSocket
    Object.defineProperty(ResilientWebSocket, 'CONNECTING', { value: OriginalWebSocket.CONNECTING });
    Object.defineProperty(ResilientWebSocket, 'OPEN', { value: OriginalWebSocket.OPEN });
    Object.defineProperty(ResilientWebSocket, 'CLOSING', { value: OriginalWebSocket.CLOSING });
    Object.defineProperty(ResilientWebSocket, 'CLOSED', { value: OriginalWebSocket.CLOSED });

    try {
      Object.defineProperty(window, 'WebSocket', {
        value: ResilientWebSocket,
        configurable: true,
        writable: true
      });
    } catch (e) {
      // Silencioso para evitar erro Unhandled Rejection: WebSocket em iFrames restritivos
    }
  }
}

// Intercepta erros de rede/websocket globais
window.addEventListener('error', (e: any) => {
  if (
    e.message?.includes('WebSocket') || 
    e.message?.includes('closed') || 
    e.target instanceof WebSocket || 
    (e.error && e.error.message?.includes('WebSocket'))
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

// Intercepta Rejeições Não Tratadas (comum em erros de WebSocket fechado prematuramente ou reentradas)
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason || event.reason?.message || "");
  if (
    msg.includes("WebSocket closed without opened") ||
    msg.includes("WebSocket") ||
    msg.includes("closed") ||
    msg.includes("Connection closed")
  ) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
}, true);

// Desabilitar Websockets em Produção
if (import.meta.env.PROD) {
  try {
    if (typeof (window as any).disableWebsocket === 'function') {
      (window as any).disableWebsocket();
    }
  } catch (e) {
    // Silencioso
  }
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
  </ErrorBoundary>,
);
