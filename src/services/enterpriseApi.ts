import { cacheManager } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);
import { isJwtExpired } from '../utils/jwt';

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

const resilientDummyFallback: any = new Proxy({
  success: true,
  ok: true,
  _offline: true,
  status: "degraded",
  plan: { plan: "FREE", studentLimit: 20, active: true, usagePercent: 0, canAddStudents: true },
  subscription: { plan: "FREE", studentLimit: 20, active: true, usagePercent: 0, canAddStudents: true }
}, {
  get(target, prop) {
    if (prop in target) {
      return (target as any)[prop];
    }
    if (typeof prop === "string") {
      const pLower = prop.toLowerCase();
      if (pLower.endsWith('s') || pLower === 'history' || pLower === 'ledger' || pLower === 'presence') {
        return [];
      }
      if (pLower === 'count' || pLower === 'total' || pLower === 'value') {
        return 0;
      }
      if (pLower === 'profile' || pLower === 'user') {
        return null;
      }
    }
    return undefined;
  }
});

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

      // 🥋 OSS SENSEI: Valida expiração do token localmente ANTES de enviar a requisição
      if (token && isJwtExpired(token)) {
        console.warn("🥋 [API AUTH CLEANUP] Token expirado detectado antes de enviar, limpando credenciais locais e abortando requisição.");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('oss_auth');
          window.dispatchEvent(new Event('oss_unauthorized'));
        }
        throw new Error("Sua sessão expirou. Por favor, realize o login novamente.");
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
            credentials: 'same-origin',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorInfo = `HTTP Error: ${response.status}`;
            const contentType = response.headers.get('content-type');
            
            // 🥋 OSS SENSEI: Limpeza de token sob qualquer erro de acesso (401 ou 403)
            if (response.status === 401 || response.status === 403) {
              if (typeof window !== 'undefined') {
                console.warn(`🥋 [API AUTH CLEANUP] Resposta de negação ${response.status} detectada da API. Expirando credenciais locais para renovação.`);
                localStorage.removeItem('oss_auth');
                window.dispatchEvent(new Event('oss_unauthorized'));
              }
            }
            
            if (contentType && contentType.includes('application/json')) {
              try {
                const errorData = await response.json();
                
                // Força logout se for erro de assinatura, expiração ou privilégio ilegal
                if (response.status === 401 || response.status === 403) {
                  if (typeof window !== 'undefined') {
                    console.warn("🥋 [API AUTH CLEANUP] Token inválido ou expirado confirmado pela API, encerrando sessão.");
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
              console.error('🥋 [NON-JSON ERROR INTERCEPTED]', text.substring(0, 200));
              return resilientDummyFallback;
            }
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('🥋 [NON-JSON TYPE DEVIATION CONTENT-TYPE]', contentType);
            return resilientDummyFallback;
          }

          let data;
          try {
            data = await response.json();
          } catch (jsonErr) {
            console.error('🥋 [JSON PARSING CRASH]', jsonErr);
            return resilientDummyFallback;
          }

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
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;
import { isJwtExpired } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

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

const resilientDummyFallback: any = new Proxy({
  success: true,
  ok: true,
  _offline: true,
  status: "degraded",
  plan: { plan: "FREE", studentLimit: 20, active: true, usagePercent: 0, canAddStudents: true },
  subscription: { plan: "FREE", studentLimit: 20, active: true, usagePercent: 0, canAddStudents: true }
}, {
  get(target, prop) {
    if (prop in target) {
      return (target as any)[prop];
    }
    if (typeof prop === "string") {
      const pLower = prop.toLowerCase();
      if (pLower.endsWith('s') || pLower === 'history' || pLower === 'ledger' || pLower === 'presence') {
        return [];
      }
      if (pLower === 'count' || pLower === 'total' || pLower === 'value') {
        return 0;
      }
      if (pLower === 'profile' || pLower === 'user') {
        return null;
      }
    }
    return undefined;
  }
});

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

      // 🥋 OSS SENSEI: Valida expiração do token localmente ANTES de enviar a requisição
      if (token && isJwtExpired(token)) {
        console.warn("🥋 [API AUTH CLEANUP] Token expirado detectado antes de enviar, limpando credenciais locais e abortando requisição.");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('oss_auth');
          window.dispatchEvent(new Event('oss_unauthorized'));
        }
        throw new Error("Sua sessão expirou. Por favor, realize o login novamente.");
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
            credentials: 'same-origin',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorInfo = `HTTP Error: ${response.status}`;
            const contentType = response.headers.get('content-type');
            
            // 🥋 OSS SENSEI: Limpeza de token sob qualquer erro de acesso (401 ou 403)
            if (response.status === 401 || response.status === 403) {
              if (typeof window !== 'undefined') {
                console.warn(`🥋 [API AUTH CLEANUP] Resposta de negação ${response.status} detectada da API. Expirando credenciais locais para renovação.`);
                localStorage.removeItem('oss_auth');
                window.dispatchEvent(new Event('oss_unauthorized'));
              }
            }
            
            if (contentType && contentType.includes('application/json')) {
              try {
                const errorData = await response.json();
                
                // Força logout se for erro de assinatura, expiração ou privilégio ilegal
                if (response.status === 401 || response.status === 403) {
                  if (typeof window !== 'undefined') {
                    console.warn("🥋 [API AUTH CLEANUP] Token inválido ou expirado confirmado pela API, encerrando sessão.");
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
              console.error('🥋 [NON-JSON ERROR INTERCEPTED]', text.substring(0, 200));
              return resilientDummyFallback;
            }
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('🥋 [NON-JSON TYPE DEVIATION CONTENT-TYPE]', contentType);
            return resilientDummyFallback;
          }

          let data;
          try {
            data = await response.json();
          } catch (jsonErr) {
            console.error('🥋 [JSON PARSING CRASH]', jsonErr);
            return resilientDummyFallback;
          }

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
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

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

const resilientDummyFallback: any = new Proxy({
  success: true,
  ok: true,
  _offline: true,
  status: "degraded",
  plan: { plan: "FREE", studentLimit: 20, active: true, usagePercent: 0, canAddStudents: true },
  subscription: { plan: "FREE", studentLimit: 20, active: true, usagePercent: 0, canAddStudents: true }
}, {
  get(target, prop) {
    if (prop in target) {
      return (target as any)[prop];
    }
    if (typeof prop === "string") {
      const pLower = prop.toLowerCase();
      if (pLower.endsWith('s') || pLower === 'history' || pLower === 'ledger' || pLower === 'presence') {
        return [];
      }
      if (pLower === 'count' || pLower === 'total' || pLower === 'value') {
        return 0;
      }
      if (pLower === 'profile' || pLower === 'user') {
        return null;
      }
    }
    return undefined;
  }
});

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

      // 🥋 OSS SENSEI: Valida expiração do token localmente ANTES de enviar a requisição
      if (token && isJwtExpired(token)) {
        console.warn("🥋 [API AUTH CLEANUP] Token expirado detectado antes de enviar, limpando credenciais locais e abortando requisição.");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('oss_auth');
          window.dispatchEvent(new Event('oss_unauthorized'));
        }
        throw new Error("Sua sessão expirou. Por favor, realize o login novamente.");
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
            credentials: 'same-origin',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorInfo = `HTTP Error: ${response.status}`;
            const contentType = response.headers.get('content-type');
            
            // 🥋 OSS SENSEI: Limpeza de token sob qualquer erro de acesso (401 ou 403)
            if (response.status === 401 || response.status === 403) {
              if (typeof window !== 'undefined') {
                console.warn(`🥋 [API AUTH CLEANUP] Resposta de negação ${response.status} detectada da API. Expirando credenciais locais para renovação.`);
                localStorage.removeItem('oss_auth');
                window.dispatchEvent(new Event('oss_unauthorized'));
              }
            }
            
            if (contentType && contentType.includes('application/json')) {
              try {
                const errorData = await response.json();
                
                // Força logout se for erro de assinatura, expiração ou privilégio ilegal
                if (response.status === 401 || response.status === 403) {
                  if (typeof window !== 'undefined') {
                    console.warn("🥋 [API AUTH CLEANUP] Token inválido ou expirado confirmado pela API, encerrando sessão.");
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
              console.error('🥋 [NON-JSON ERROR INTERCEPTED]', text.substring(0, 200));
              return resilientDummyFallback;
            }
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('🥋 [NON-JSON TYPE DEVIATION CONTENT-TYPE]', contentType);
            return resilientDummyFallback;
          }

          let data;
          try {
            data = await response.json();
          } catch (jsonErr) {
            console.error('🥋 [JSON PARSING CRASH]', jsonErr);
            return resilientDummyFallback;
          }

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

