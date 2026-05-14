import { enterpriseApi } from './enterpriseApi';

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
   * Testa a conexão com o Banco de Dados PostgreSQL (Supabase) via Prisma
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
  async fetchData(collection: string, userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return [];
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}?userId=${userId}`);
  },

  /**
   * Busca múltiplas coleções em uma única requisição para evitar rate limiting
   */
  async fetchBatchData(collections: string[], userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return {};
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/batch?userId=${userId}&collections=${collections.join(',')}`);
  },

  /**
   * Salva ou atualiza um item em uma coleção
   */
  async saveData(collection: string, userId: string, data: any) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo_ok' };
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId }),
      useCache: false // Escrita não usa cache de leitura
    });
  },

  /**
   * Busca relatório de BI consolidado (Inteligência Sensei)
   */
  async fetchBI(userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo' };
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/bi?userId=${userId}`, {
      retry: 2,
      useCache: false // BI deve ser sempre fresco
    });
  },

  /**
   * Remove um item de uma coleção
   */
  async deleteData(collection: string, id: string, userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      return { status: 'demo_ok' };
    }
    return await enterpriseApi.fetchWithEnterprise(`/api/data/${collection}/${id}?userId=${userId}`, {
      method: 'DELETE',
      useCache: false
    });
  }
};

