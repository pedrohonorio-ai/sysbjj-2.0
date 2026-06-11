import { useEffect } from 'react';
import { processSyncQueue, triggerImmediateSync } from '../lib/sync-queue';

/**
 * 🥋 useOfflineSync: Hook global do ecossistema SYSBJJ para sincronização secundária automática.
 * Monitora rede em tempo real no dispositivo do Professor e esvazia a fila IndexedDB de forma resiliente.
 */
export function useOfflineSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🥋 [NETWORK SENSEI ONLINE] Conexão restabelecida! Disparando sincronização imediata.');
      triggerImmediateSync();
    };

    const handleOffline = () => {
      console.warn('🥋 [NETWORK SENSEI OFFLINE] Dispositivo desconectado do tatame da internet.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Primeira execução do sincronizador ao abrir o app
    processSyncQueue();

    // Loop periódico silencioso a cada 25 segundos
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        processSyncQueue();
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);
}
