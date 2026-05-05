import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { DataProvider } from './contexts/DataContext';

const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{ padding: '20px', color: 'red', backgroundColor: '#fff', height: '100vh', fontFamily: 'sans-serif' }}>
    <h1>SYSTEM ERROR: ABIERTO EL TATAME PERO ALGO FALLÓ</h1>
    <p>OSS! Sensei, o sistema detectou um erro crítico:</p>
    <pre style={{ backgroundColor: '#eee', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>{error.message}</pre>
    <details style={{ marginTop: '10px' }}>
      <summary>Detalhes do Erro</summary>
      <pre style={{ fontSize: '12px' }}>{error.stack}</pre>
    </details>
    <button 
      onClick={() => window.location.reload()}
      style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0051FF', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
    >
      Recarregar Sistema
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
            <ProfileProvider>
              <DataProvider>
                <App />
              </DataProvider>
            </ProfileProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
