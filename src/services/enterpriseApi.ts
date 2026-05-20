import { cacheManager } from './cacheManager.js';

/**
 * 🥋 SYSBJJ 2.0 - ENTERPRISE API CLIENT
 * Resiliência, Cache Local e Modo Offline
 */

const RETRY_ATTEMPTS = 3;
const TIMEOUT_MS = 10000;
const CACHE_PREFIX = 'sysbjj_cache_';
const COLLECTIONS_TO_CACHE = ['profile', 'batch', 'students', 'payments'];

interface FetchOptions extends RequestInit {
  timeout?: number;
  retry?: number;
  useCache?: boolean;
}

class EnterpriseApi {
  private baseUrl: string;

  constructor() {
    // 🥋 OSS SENSEI: Prioriza VITE_API_URL, mas mantém fallback para o mesmo host por segurança
    this.baseUrl = import.meta.env.VITE_API_URL || '';
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  private async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(url: string): string {
    return `${CACHE_PREFIX}${btoa(url)}`;
  }

  private setCache(url: string, data: any) {
    try {
      localStorage.setItem(this.getCacheKey(url), JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('🥋 [CACHE ERROR] Falha ao salvar no localStorage:', e);
    }
  }

  private getCache(url: string) {
    try {
      const cached = localStorage.getItem(this.getCacheKey(url));
      if (!cached) return null;
      return JSON.parse(cached).data;
    } catch (e) {
      return null;
    }
  }

  /**
   * 🥋 fetchWithEnterprise: O "Cinto Preto" das requisições
   */
  async fetchWithEnterprise(path: string, options: FetchOptions = {}): Promise<any> {
    const { 
      timeout = TIMEOUT_MS, 
      retry = RETRY_ATTEMPTS, 
      useCache = true,
      ...fetchOptions 
    } = options;

    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const method = fetchOptions.method || 'GET';
    const isGet = method.toUpperCase() === 'GET';

    // 1. Memory Cache lookup first (Enterprise optimization)
    if (isGet && useCache) {
      const memoryCached = cacheManager.get(url);
      if (memoryCached) {
        return memoryCached;
      }
    }

    // 2. Wrap request inside deduplicator to coalesce concurrent calls
    const executeFetch = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // OSS SENSEI: Injeta Token JWT se existir no LocalStorage
      const authData = localStorage.getItem('oss_auth');
      let token = '';
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          token = parsed.token || '';
        } catch (e) {}
      }

      const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      let lastError: any;
      
      for (let attempt = 0; attempt < retry; attempt++) {
        try {
          if (!navigator.onLine && useCache) {
            const cachedData = this.getCache(url);
            if (cachedData) {
              clearTimeout(timeoutId);
              return cachedData;
            }
          }

          const response = await fetch(url, {
            ...fetchOptions,
            headers,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorInfo = `HTTP Error: ${response.status}`;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              try {
                const errorData = await response.json();
                if (errorData.error) errorInfo = errorData.error;
                const error = new Error(errorInfo) as any;
                error.status = response.status;
                error.troubleshooting = errorData.troubleshooting;
                error.sensei_tip = errorData.sensei_tip;
                throw error;
              } catch (e) {
                throw new Error(errorInfo);
              }
            } else {
              const text = await response.text();
              console.error('🥋 [NON-JSON ERROR]', text.substring(0, 200));
              throw new Error(`Erro inesperado do servidor (${response.status}). Verifique sua conexão.`);
            }
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
             throw new Error("Resposta inválida do servidor. Esperado JSON.");
          }

          const data = await response.json();

          // 🥋 Atualiza Cache se for uma coleção importante
          if (useCache && isGet) {
            const isCacheable = COLLECTIONS_TO_CACHE.some(c => path.includes(c));
            if (isCacheable) {
              this.setCache(url, data);
            }
          }

          return data;
        } catch (error: any) {
          lastError = error;
          
          if (attempt < retry - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            await this.wait(delay);
          }
        }
      }

      // 🥋 FALLBACK FINAL: Tenta cache se tudo der errado
      if (useCache) {
        const cachedData = this.getCache(url);
        if (cachedData) {
          return cachedData;
        }
      }

      throw lastError || new Error('Connection error');
    };

    if (isGet) {
      // Deduplicate overlapping GET requests
      const data = await cacheManager.deduplicate(url, executeFetch);
      if (useCache) {
        cacheManager.set(url, data, 15000); // Cache in memory for 15 seconds
      }
      return data;
    } else {
      // Non-GET requests (mutations) invalidate corresponding cache namespaces
      cacheManager.invalidate('batch');
      cacheManager.invalidate('students');
      cacheManager.invalidate('payments');
      cacheManager.invalidate('profile');
      
      return await executeFetch();
    }
  }
}

export const enterpriseApi = new EnterpriseApi();
