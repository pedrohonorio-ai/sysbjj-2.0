// Serviço de sincronização offline
let syncQueue: Array<{ endpoint: string; data: any }> = [];

export function processSyncQueue() {
  console.log('Processando fila de sincronização...', syncQueue.length);
  // Implementação real pode ser adicionada depois
  syncQueue = [];
}

export function triggerImmediateSync() {
  console.log('Disparando sincronização imediata...');
  processSyncQueue();
}

export function addToSyncQueue(endpoint: string, data: any) {
  syncQueue.push({ endpoint, data });
  console.log('Adicionado à fila de sincronização:', endpoint);
}
