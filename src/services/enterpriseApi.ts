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
            credentials: 'include',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorInfo = `HTTP Error: ${response.status}`;
            const contentType = response.headers.get('content-type');
            
            // 🥋 OSS SENSEI: Autolimpeza de token de forma segura
            // Apenas remove a credencial se receber 401 (Não Autorizado) ou se o JSON indicar explicitamente Token Expirado.
            // Isso previne que alunos sejam desconectados ao encontrarem recursos restritos (403).
            if (response.status === 401) {
              if (typeof window !== 'undefined') {
                console.warn("🥋 [API AUTH CLEANUP] Sessão inválida (401), limpando credenciais locais de forma segura.");
                localStorage.removeItem('oss_auth');
                window.dispatchEvent(new Event('oss_unauthorized'));
              }
            }
            
            if (contentType && contentType.includes('application/json')) {
              try {
                const errorData = await response.json();
                
                // Se for um 403 indicando token expirado de verdade, limpa a sessão
                if (response.status === 403 && (errorData.error?.includes('expirado') || errorData.error?.includes('token') || errorData.error?.includes('Token') || errorData.error?.includes('Sessão'))) {
                  if (typeof window !== 'undefined') {
                    console.warn("🥋 [API AUTH CLEANUP] Token expirado confirmado via JSON (403), limpando credenciais.");
                    localStorage.removeItem('oss_auth');
                    window.dispatchEvent(new Event('oss_unauthorized'));
                  }
                }

                if (errorData.error) errorInfo = errorData.error;
                const error = new Error(errorInfo) as any;
                error.status = response.status;
                error.troubleshooting = errorData.troubleshooting;
                error.sensei_tip = errorData.sensei_tip || "OSS! Tente realizar a ação novamente.";
                throw error;
              } catch (e: any) {
                if (e.status) throw e;
                const error = new Error(errorInfo) as any;
                error.status = response.status;
                throw error;
              }
            } else {
              const text = await response.text();
              console.error('🥋 [NON-JSON ERROR]', text.substring(0, 200));
              const error = new Error(`Resposta do servidor não pôde ser lida como JSON (${response.status}).`) as any;
              error.status = response.status;
              throw error;
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
          
          // OSS SENSEI: Se for falha de autenticação (401) ou proibido (403), não repete a tentativa!
          if (error.status === 401 || error.status === 403) {
            console.error(`🥋 [AUTH/FORBIDDEN LIMIT] Status ${error.status} detectado. Abortando tentativas.`, error.message);
            
            // Aborda cache como fallback imediato para manter dojo operacional
            if (isGet && useCache) {
              const cachedData = this.getCache(url);
              if (cachedData) {
                console.log(`🥋 [CACHE RETRIEVED] Recuperado cache sob status ${error.status} para ${path}`);
                return cachedData;
              }
            }
            break;
          }
          
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
