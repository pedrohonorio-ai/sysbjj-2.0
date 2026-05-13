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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: any;
    
    // 🥋 Lógica de Retry com Exponential Backoff
    for (let attempt = 0; attempt < retry; attempt++) {
      try {
        if (!navigator.onLine && useCache) {
          const cachedData = this.getCache(url);
          if (cachedData) {
            console.log(`🥋 [OFFLINE] Usando cache para: ${path}`);
            clearTimeout(timeoutId);
            return cachedData;
          }
        }

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        // 🥋 Atualiza Cache se for uma coleção importante
        if (useCache && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
          const isCacheable = COLLECTIONS_TO_CACHE.some(c => path.includes(c));
          if (isCacheable) {
            this.setCache(url, data);
          }
        }

        return data;
      } catch (error: any) {
        lastError = error;
        
        // Se for abortado por timeout, não adianta tentar de novo imediatamente sem esperar
        if (error.name === 'AbortError') {
          console.warn(`🥋 [TIMEOUT] Tentativa ${attempt + 1} falhou.`);
        } else {
          console.warn(`🥋 [API FAIL] Tentativa ${attempt + 1}:`, error.message);
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
        console.log(`🥋 [FALLBACK] Erro na API, servindo cache para: ${path}`);
        return cachedData;
      }
    }

    throw lastError || new Error('Unknown connection error');
  }
}

export const enterpriseApi = new EnterpriseApi();
