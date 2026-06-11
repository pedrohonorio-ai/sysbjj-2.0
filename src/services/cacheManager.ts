/**
 * 🥋 SYSBJJ 2.0 - CACHE MANAGER ENTERPRISE
 * Lida com economia de requests, deduplicação de chamadas simultâneas (in-flight),
 * invalidação de cache inteligente e agrupamento por debounce.
 */

interface CacheEntry {
  data: any;
  expiry: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, any>();

  /**
   * Obtém um item do cache se não tiver expirado
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Armazena um item no cache por um determinado tempo de vida (TTL)
   */
  set(key: string, data: any, ttlMs: number = 60000): void {
    if (data === undefined || data === null) return;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Remove itens do cache que começam com um determinado prefixo (Invalidação Inteligente)
   */
  invalidate(prefix: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(prefix) || key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
    for (const timer of Array.from(this.debounceTimers.values())) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Deduplica requisições idênticas em andamento (In-Flight Coalescing)
   */
  async deduplicate(key: string, fetchFn: () => Promise<any>): Promise<any> {
    const existingPromise = this.inFlight.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = fetchFn().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Agrupa chamadas idênticas em lote usando debounce
   */
  debounce(key: string, fn: () => void, delayMs: number = 500): void {
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      fn();
    }, delayMs);

    this.debounceTimers.set(key, timer);
  }
}

export const cacheManager = new CacheManager();

