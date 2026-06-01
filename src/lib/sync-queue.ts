import { api } from '../services/api.js';
import { getPendingOps, updateRetry, removeOperation, QueuedOperation } from './sync-storage.js';

const BASE_DELAY = 1500;    // 1.5s
const MAX_DELAY = 30000;    // 30s
const MAX_RETRIES = 5;

let isSyncing = false;

function getActiveUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('oss_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.user?.id || parsed.id || null;
    }
  } catch (e) {
    console.error('🥋 [SYNC QUEUE AUTH EXTRACT FAIL]:', e);
  }
  return null;
}

async function executeOperation(op: QueuedOperation, userId: string): Promise<boolean> {
  try {
    if (op.operation === 'delete') {
      if (!op.entityId) {
        console.error(`🚨 [SYNC ERROR] ID da entidade ausente para exclusão na fila: ${op.id}`);
        return true; // Considerar concluído para tirar da fila (evitar travamento)
      }
      const response = await api.deleteData(op.collection, op.entityId, userId);
      return !!response;
    } else {
      // both create and update operations are processed via standard UPSERT endpoint (saveData)
      const payload = { ...op.data };
      if (op.entityId && !payload.id) {
        payload.id = op.entityId;
      }
      const response = await api.saveData(op.collection, userId, payload);
      
      // Se a resposta contém erro de RLS ou conflito, lidamos de forma graciosa
      if (response && response.error && response.status === 409) {
        console.warn(`🥋 [CONFLICT] Conflito detectado na mesclagem offline-first para '${op.collection}/${op.entityId}':`, response.error);
        return true; // Mark as processed to prevent queue blockage
      }
      return !!response;
    }
  } catch (err: any) {
    console.error(`🚨 [SYNC OPERATION CRASH] Falha ao sincronizar operação ${op.id}:`, err);
    
    // Se o erro indicar explicitamente invalidação irrecuperável de payload ou 400/404,
    // removemos da fila para não travar toda a fila sequencial do Sensei
    if (err && (err.status === 400 || err.status === 404)) {
      console.warn(`🥋 [SYNC DISMISS] Cancelando operação inválida/obsoleta '${op.id}' (HTTP ${err.status})`);
      return true;
    }
    return false;
  }
}

function getDelay(retryCount: number): number {
  const exponential = BASE_DELAY * Math.pow(2, retryCount);
  const capped = Math.min(exponential, MAX_DELAY);
  const jitter = Math.random() * 300;
  return capped + jitter;
}

/**
 * 🥋 processSyncQueue: O mecanismo de esvaziamento da fila de sincronização
 */
export async function processSyncQueue(): Promise<number> {
  if (isSyncing) {
    return 0;
  }

  const userId = getActiveUserId();
  if (!userId) {
    return 0;
  }

  isSyncing = true;
  let processedCount = 0;

  try {
    const pending = await getPendingOps(15); // processa em lotes de 15 por ciclo
    
    if (pending.length === 0) {
      isSyncing = false;
      return 0;
    }

    console.log(`🔌 [OFFLINE SYNC] Iniciando sincronização de ${pending.length} operações em cache...`);

    for (const op of pending) {
      if (op.retryCount >= MAX_RETRIES) {
        console.error(`🚨 [SYNC DEPLETION] Operação ${op.id} excedeu o limite máximo de ${MAX_RETRIES} tentativas. Removendo de forma segura.`);
        await removeOperation(op.id);
        continue;
      }

      // Verifica status de rede
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log('🔌 [OFFLINE SYNC] Navegador offline de verdade. Abortando ciclo.');
        break;
      }

      const success = await executeOperation(op, userId);
      
      if (success) {
        await removeOperation(op.id);
        processedCount++;
      } else {
        const nextRetry = op.retryCount + 1;
        await updateRetry(op.id, nextRetry);
        const delayMs = getDelay(op.retryCount);
        console.log(`🔌 [RETRY BJJ BACKOFF] Tentativa falhou. Agendando retry ${nextRetry}/${MAX_RETRIES} em ${Math.round(delayMs)}ms`);
        
        // Em caso de erro sequencial, aguardamos para não sobrecarregar
        await new Promise(r => setTimeout(r, Math.min(delayMs, 3000)));
      }
    }
  } catch (err) {
    console.error('🚨 [SYNC QUEUE ERROR] Falha grave no processamento da fila:', err);
  } finally {
    isSyncing = false;
  }

  return processedCount;
}

/**
 * 🥋 Força um processamento imediato se online
 */
export function triggerImmediateSync(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    processSyncQueue().catch(err => {
      console.error('🚨 [SYNC TRIGGER FAIL] Falha no disparo imediato:', err);
    });
  }
}
