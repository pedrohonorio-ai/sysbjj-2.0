// Fila de sincronização offline
export interface SyncQueueItem {
  id: string;
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

let syncQueue: SyncQueueItem[] = [];

export function addToSyncQueue(endpoint: string, data: any): string {
  const id = Math.random().toString(36).substring(2, 9);
  syncQueue.push({
    id,
    endpoint,
    data,
    timestamp: Date.now(),
    retries: 0
  });
  console.log(`Adicionado à fila: ${endpoint}`, data);
  return id;
}

export function getSyncQueue(): SyncQueueItem[] {
  return [...syncQueue];
}

export function removeFromSyncQueue(id: string): void {
  syncQueue = syncQueue.filter(item => item.id !== id);
}

export function clearSyncQueue(): void {
  syncQueue = [];
  console.log('Fila de sincronização limpa');
}

export function processSyncQueue(): Promise<void> {
  console.log('Processando fila de sincronização...', syncQueue.length);
  return Promise.resolve();
}

export function triggerImmediateSync(): Promise<void> {
  console.log('Disparando sincronização imediata...');
  return processSyncQueue();
}
