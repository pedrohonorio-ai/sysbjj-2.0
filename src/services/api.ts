import { enterpriseApi } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

/**
 * 🥋 API Service for SYSBJJ 2.0 (ENTERPRISE EDITION)
 * Fornece interface resiliente de comunicação entre o Frontend (Vite) e o Backend (Express/Prisma)
 */

export const api = {
  /**
   * Verifica a saúde e conexão do servidor
   */
  async checkHealth() {
    try {
      return await enterpriseApi.fetchWithEnterprise('/api/health', { retry: 1, useCache: false });
    } catch (error) {
      console.error("🥋 [HEALTH FAIL] API offline:", error);
      return { status: 'offline' };
    }
  },

  /**
   * Testa a conexão com o Banco de Dados PostgreSQL (Neon) via Prisma
   */
  async testDbConnection() {
    try {
      return await enterpriseApi.fetchWithEnterprise('/api/health-db', { retry: 1, useCache: false });
    } catch (error) {
       return { status: 'error', message: 'Servidor API não responde' };
    }
  },

  /**
   * Busca dados de uma coleção vinculada ao Sensei (userId)
   */
  async fetchData(collection: string, _userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return [];
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}`);
  },

  /**
   * Busca múltiplas coleções em uma única requisição para evitar rate limiting
   */
  async fetchBatchData(collections: string[], _userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return {};
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/batch?collections=${collections.join(',')}`);
  },

  /**
   * Salva ou atualiza um item em uma coleção com suporte offline e de resiliência integrada (IndexedDB)
   */
  async saveData(collection: string, _userId: string, data: any) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo_ok' };
    }
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("Estamos offline");
      }
      return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        useCache: false // Escrita não usa cache de leitura
      });
    } catch (error) {
      console.warn(`🥋 [OFFLINE SYNC ACTIVE] Falha de escrita de dados para '${collection}'. Gravando em IndexedDB.`, error);
      
      try {
        const entityId = data.id || undefined;
        const cleanData = { ...data };
        if (entityId) {
          delete cleanData.id;
        }

        const { enqueueOperation } = await import('../lib/sync-storage');
        await enqueueOperation({
          collection,
          operation: entityId ? 'update' : 'create',
          entityId,
          data: cleanData
        });

        // Disparar evento customizado de notificação offline
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('oss_offline_written', { 
            detail: { collection, name: data.name || data.title || 'Novo Item' } 
          }));
        }
      } catch (dbErr) {
        console.error('🚨 Falha crítica ao persistir operação no IndexedDB Fallback:', dbErr);
      }

      return { success: true, offline: true, id: data.id || `temp-id-${Date.now()}` };
    }
  },

  /**
   * Busca relatório de BI consolidado (Inteligência Sensei)
   */
  async fetchBI(_userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo' };
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/bi`, {
      retry: 2,
      useCache: false // BI deve ser sempre fresco
    });
  },

  /**
   * Busca dados da assinatura SaaS (SYSBJJ Subscription Sync)
   */
  async fetchSubscription() {
    return await enterpriseApi.fetchWithEnterprise(`/api/subscription/current`, {
      useCache: false
    });
  },

  /**
   * Remove um item de uma coleção com suporte offline e de resiliência integrada (IndexedDB)
   */
  async deleteData(collection: string, id: string, _userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo_ok' };
    }
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("Estamos offline");
      }
      return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}/${id}`, {
        method: 'DELETE',
        useCache: false
      });
    } catch (error) {
      console.warn(`🥋 [OFFLINE SYNC ACTIVE] Falha ao deletar dados de '${collection}/${id}'. Gravando em IndexedDB.`, error);
      
      try {
        const { enqueueOperation } = await import('../lib/sync-storage');
        await enqueueOperation({
          collection,
          operation: 'delete',
          entityId: id,
          data: null
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('oss_offline_deleted', { 
            detail: { collection, id } 
          }));
        }
      } catch (dbErr) {
        console.error('🚨 Falha crítica ao persistir exclusão no IndexedDB Fallback:', dbErr);
      }

      return { success: true, offline: true, count: 1 };
    }
  }
};

) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

/**
 * 🥋 API Service for SYSBJJ 2.0 (ENTERPRISE EDITION)
 * Fornece interface resiliente de comunicação entre o Frontend (Vite) e o Backend (Express/Prisma)
 */

export const api = {
  /**
   * Verifica a saúde e conexão do servidor
   */
  async checkHealth() {
    try {
      return await enterpriseApi.fetchWithEnterprise('/api/health', { retry: 1, useCache: false });
    } catch (error) {
      console.error("🥋 [HEALTH FAIL] API offline:", error);
      return { status: 'offline' };
    }
  },

  /**
   * Testa a conexão com o Banco de Dados PostgreSQL (Neon) via Prisma
   */
  async testDbConnection() {
    try {
      return await enterpriseApi.fetchWithEnterprise('/api/health-db', { retry: 1, useCache: false });
    } catch (error) {
       return { status: 'error', message: 'Servidor API não responde' };
    }
  },

  /**
   * Busca dados de uma coleção vinculada ao Sensei (userId)
   */
  async fetchData(collection: string, _userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return [];
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}`);
  },

  /**
   * Busca múltiplas coleções em uma única requisição para evitar rate limiting
   */
  async fetchBatchData(collections: string[], _userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return {};
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/batch?collections=${collections.join(',')}`);
  },

  /**
   * Salva ou atualiza um item em uma coleção com suporte offline e de resiliência integrada (IndexedDB)
   */
  async saveData(collection: string, _userId: string, data: any) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo_ok' };
    }
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("Estamos offline");
      }
      return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        useCache: false // Escrita não usa cache de leitura
      });
    } catch (error) {
      console.warn(`🥋 [OFFLINE SYNC ACTIVE] Falha de escrita de dados para '${collection}'. Gravando em IndexedDB.`, error);
      
      try {
        const entityId = data.id || undefined;
        const cleanData = { ...data };
        if (entityId) {
          delete cleanData.id;
        }

        const { enqueueOperation } = await import('../lib/sync-storage');
        await enqueueOperation({
          collection,
          operation: entityId ? 'update' : 'create',
          entityId,
          data: cleanData
        });

        // Disparar evento customizado de notificação offline
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('oss_offline_written', { 
            detail: { collection, name: data.name || data.title || 'Novo Item' } 
          }));
        }
      } catch (dbErr) {
        console.error('🚨 Falha crítica ao persistir operação no IndexedDB Fallback:', dbErr);
      }

      return { success: true, offline: true, id: data.id || `temp-id-${Date.now()}` };
    }
  },

  /**
   * Busca relatório de BI consolidado (Inteligência Sensei)
   */
  async fetchBI(_userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo' };
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/bi`, {
      retry: 2,
      useCache: false // BI deve ser sempre fresco
    });
  },

  /**
   * Busca dados da assinatura SaaS (SYSBJJ Subscription Sync)
   */
  async fetchSubscription() {
    return await enterpriseApi.fetchWithEnterprise(`/api/subscription/current`, {
      useCache: false
    });
  },

  /**
   * Remove um item de uma coleção com suporte offline e de resiliência integrada (IndexedDB)
   */
  async deleteData(collection: string, id: string, _userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo_ok' };
    }
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("Estamos offline");
      }
      return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}/${id}`, {
        method: 'DELETE',
        useCache: false
      });
    } catch (error) {
      console.warn(`🥋 [OFFLINE SYNC ACTIVE] Falha ao deletar dados de '${collection}/${id}'. Gravando em IndexedDB.`, error);
      
      try {
        const { enqueueOperation } = await import('../lib/sync-storage');
        await enqueueOperation({
          collection,
          operation: 'delete',
          entityId: id,
          data: null
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('oss_offline_deleted', { 
            detail: { collection, id } 
          }));
        }
      } catch (dbErr) {
        console.error('🚨 Falha crítica ao persistir exclusão no IndexedDB Fallback:', dbErr);
      }

      return { success: true, offline: true, count: 1 };
    }
  }
};


