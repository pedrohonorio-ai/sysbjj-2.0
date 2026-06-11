import { useEffect } from 'react';

export function useOfflineSync() {
  useEffect(() => {
    // Sincronização offline desativada temporariamente
    console.log('Offline sync hook loaded');
  }, []);
}
