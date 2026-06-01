export interface QueuedOperation {
  id: string;
  collection: string;      // 'students', 'payments', 'receipts', etc.
  operation: 'create' | 'update' | 'delete';
  entityId?: string;       // target record ID if applicable
  data: any;
  timestamp: number;
  retryCount: number;
  lastRetry: number | null;
  conflictResolved?: boolean;
}

const DB_NAME = 'sysbjj-offline-db';
const STORE_NAME = 'sync-queue-store';
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'offline-id-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance && dbInstance.version === DB_VERSION) {
      return resolve(dbInstance);
    }
    
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_timestamp', 'timestamp');
        store.createIndex('by_retry', 'retryCount');
        store.createIndex('by_conflict', 'conflictResolved');
      } else {
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const store = transaction.objectStore(STORE_NAME);
          if (!store.indexNames.contains('by_conflict')) {
            store.createIndex('by_conflict', 'conflictResolved');
          }
        }
      }
    };
  });
}

export async function enqueueOperation(op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount' | 'lastRetry'>): Promise<string> {
  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = generateUUID();
    const fullOp: QueuedOperation = {
      ...op,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      lastRetry: null,
    };
    store.put(fullOp);
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    
    console.log(`🔌 [OFFLINE PERSISTENCE] Operação enfileirada: ${id} na coleção '${op.collection}'`);
    return id;
  } catch (err) {
    console.error('🚨 [INDEXEDDB ERROR] Erro ao enfileirar operação:', err);
    return 'temp-op-error';
  }
}

export async function getPendingOps(limit = 50): Promise<QueuedOperation[]> {
  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('by_timestamp');
    const request = index.getAll();
    
    const results = await new Promise<QueuedOperation[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return results.slice(0, limit);
  } catch (err) {
    console.error('🚨 [INDEXEDDB ERROR] Falha ao recuperar operações pendentes:', err);
    return [];
  }
}

export async function updateRetry(opId: string, nextRetryCount: number): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const op = await new Promise<QueuedOperation | undefined>((resolve, reject) => {
      const req = store.get(opId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    
    if (op) {
      op.retryCount = nextRetryCount;
      op.lastRetry = Date.now();
      store.put(op);
    }
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('🚨 [INDEXEDDB ERROR] Falha ao atualizar retentativas:', err);
  }
}

export async function removeOperation(opId: string): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(opId);
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    
    console.log(`🔌 [OFFLINE PERSISTENCE] Operação ${opId} concluída e removida da fila.`);
  } catch (err) {
    console.error('🚨 [INDEXEDDB ERROR] Falha ao remover operação:', err);
  }
}

export async function markConflictResolved(opId: string): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const op = await new Promise<QueuedOperation | undefined>((resolve, reject) => {
      const req = store.get(opId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    
    if (op) {
      op.conflictResolved = true;
      store.put(op);
    }
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('🚨 [INDEXEDDB ERROR] Falha ao marcar conflito como resolvido:', err);
  }
}
