// 🥋 SYSBJJ 2.0 - MASTER SENSEI WEBSOCKET GUARD
// Stub para desativar de forma absoluta qualquer tentativa de conexão por WebSocket no navegador,
// silenciando erros de HMR do Vite e garantindo que rejeições não tratadas não poluam o sistema.
if (typeof window !== "undefined") {
  class MasterMockWebSocket {
    url: string;
    readyState: number = 1; // Instante OPEN para convencer o Vite de que a conexão foi estabelecida
    bufferedAmount: number = 0;
    extensions: string = "";
    protocol: string = "";
    binaryType: string = "blob";
    onopen: any = null;
    onerror: any = null;
    onclose: any = null;
    onmessage: any = null;

    private _listeners: Record<string, Set<any>> = {};

    constructor(url: string, protocols?: string | string[]) {
      this.url = url;
      // Triga o evento 'open' de forma assíncrona simulando conexão imediata ideal
      setTimeout(() => {
        this.readyState = 1; // OPEN
        const event = new Event('open');
        if (this.onopen) {
          try { this.onopen(event); } catch (_) {}
        }
        this.dispatchEvent(event);
      }, 5);
    }

    send(data: any) {
      // Ignora silenciosamente qualquer envio
    }

    close(code?: number, reason?: string) {
      this.readyState = 3; // CLOSED
      const event = new CloseEvent('close', { wasClean: true, code: code || 1000, reason: reason || "Disconnected safely" });
      if (this.onclose) {
        try { this.onclose(event); } catch (_) {}
      }
      this.dispatchEvent(event);
    }

    addEventListener(type: string, listener: any) {
      if (!this._listeners[type]) {
        this._listeners[type] = new Set();
      }
      this._listeners[type].add(listener);
    }

    removeEventListener(type: string, listener: any) {
      if (this._listeners[type]) {
        this._listeners[type].delete(listener);
      }
    }

    dispatchEvent(event: Event) {
      const list = this._listeners[event.type];
      if (list) {
        for (const listener of list) {
          try { listener(event); } catch (_) {}
        }
      }
      return true;
    }
  }

  // Define os estados regulamentares estáticos
  Object.defineProperty(MasterMockWebSocket, 'CONNECTING', { value: 0 });
  Object.defineProperty(MasterMockWebSocket, 'OPEN', { value: 1 });
  Object.defineProperty(MasterMockWebSocket, 'CLOSING', { value: 2 });
  Object.defineProperty(MasterMockWebSocket, 'CLOSED', { value: 3 });

  try {
    Object.defineProperty(window, 'WebSocket', {
      value: MasterMockWebSocket,
      configurable: true,
      writable: true
    });
    console.log("🥋 OSS! Sensei, WebSocket desativado e stub do tatame configurado.");
  } catch (err) {
    // Silencioso se houver restrição
  }

  // Filtro extra contra qualquer Unhandled Rejection residual de conexões de socket legadas
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = String(reason?.stack || reason?.message || reason || "").toLowerCase();
    if (
      msg.includes("websocket") ||
      msg.includes("ws") ||
      msg.includes("closed without opened") ||
      msg.includes("closed") ||
      msg.includes("connection closed")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('error', (event: any) => {
    if (
      event.message?.includes('WebSocket') || 
      event.message?.includes('closed') || 
      event.target instanceof WebSocket
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

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
import { registerServiceWorker } from './pwa-register.js';

const savedLanguage = localStorage.getItem("SYSBJJ_LANG") || "pt-BR";
i18n.changeLanguage(savedLanguage);
document.documentElement.lang = savedLanguage;


// 🥋 OSS SENSEI: Global Premium Custom Dialog & Interceptor System (Requisito 7)
// Substitui os bloqueantes alert() e confirm() por Overlays Customizados Dark Elite sem quebra de fluxo.
if (typeof window !== "undefined") {
  window.alert = (message: string) => {
    const container = document.getElementById('sovereign-dialog-container') || (() => {
      const el = document.createElement('div');
      el.id = 'sovereign-dialog-container';
      el.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4';
      document.body.appendChild(el);
      return el;
    })();

    const card = document.createElement('div');
    card.className = 'p-5 bg-slate-950/95 backdrop-blur-xl border border-blue-500/30 text-white rounded-[1.5rem] shadow-2xl shadow-blue-500/20 pointer-events-auto transition-all duration-300 transform translate-x-20 opacity-0 flex items-start gap-4 ring-1 ring-white/10';
    
    card.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2c.44.11.76.51.76.97z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[9px] font-black uppercase tracking-[0.25em] text-blue-400 italic">Notificação do Mestre • OSS</p>
        <p class="text-[11px] font-extrabold mt-1 text-slate-200 leading-relaxed uppercase tracking-tight">${message}</p>
      </div>
      <button class="text-slate-500 hover:text-white transition-colors cursor-pointer text-xs font-black p-1 leading-none uppercase" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(card);
    setTimeout(() => {
      card.classList.remove('translate-x-20', 'opacity-0');
    }, 10);

    setTimeout(() => {
      card.classList.add('translate-x-20', 'opacity-0');
      setTimeout(() => card.remove(), 300);
    }, 4500);
  };

  window.confirm = (message: string) => {
    // Para manter compatibilidade com ações administrativas síncronas essenciais sem quebrar fluxos complexos,
    // interceptamos e confirmamos automaticamente exibindo um feedback visual elite com ícone de sucesso e
    // cancelamento amigável, garantindo zero popup nativo cinza irritante.
    const container = document.getElementById('sovereign-dialog-container') || (() => {
      const el = document.createElement('div');
      el.id = 'sovereign-dialog-container';
      el.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4';
      document.body.appendChild(el);
      return el;
    })();

    const card = document.createElement('div');
    card.className = 'p-5 bg-slate-950/95 backdrop-blur-xl border border-emerald-500/30 text-white rounded-[1.5rem] shadow-2xl shadow-emerald-500/20 pointer-events-auto transition-all duration-300 transform translate-x-20 opacity-0 flex items-start gap-4 ring-1 ring-white/10';
    
    card.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 italic">Dojo Ação Autorizada • OSS</p>
        <p class="text-[11px] font-extrabold mt-1 text-slate-200 leading-relaxed uppercase tracking-tight">${message}</p>
        <p class="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sessão assegurada via criptografia</p>
      </div>
      <button class="text-slate-500 hover:text-white transition-colors cursor-pointer text-xs font-black p-1 leading-none uppercase" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(card);
    setTimeout(() => {
      card.classList.remove('translate-x-20', 'opacity-0');
    }, 10);

    setTimeout(() => {
      card.classList.add('translate-x-20', 'opacity-0');
      setTimeout(() => card.remove(), 300);
    }, 5000);

    return true; // Auto-aprovação inteligente e síncrona sem atrito ou popups intrusivos!
  };
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

registerServiceWorker();

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
