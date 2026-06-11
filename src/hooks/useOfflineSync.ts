import { useEffect } from 'react';
import { processSyncQueue, triggerImmediateSync } from '../services/syncService';

export function useOfflineSync() {
  useEffect(() => {
    // Processa fila de sincronização quando o app volta a ficar online
    const handleOnline = () => {
      console.log('🔄 Conexão restaurada - sincronizando dados...');
      triggerImmediateSync();
    };

    window.addEventListener('online', handleOnline);
    
    // Processa fila ao iniciar o app (se estiver online)
    if (navigator.onLine) {
      processSyncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
