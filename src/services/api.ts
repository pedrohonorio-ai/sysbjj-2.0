/**
 * API Service for SYSBJJ 2.0
 * Fornece interface de comunicação entre o Frontend (Vite) e o Backend (Express/Prisma)
 */

export const api = {
  /**
   * Verifica a saúde e conexão do servidor
   */
  async checkHealth() {
    try {
      const response = await fetch('/api/health');
      return await response.json();
    } catch (error) {
      console.error("API Health Check failed", error);
      return { status: 'offline' };
    }
  },

  /**
   * Testa a conexão com o Banco de Dados PostgreSQL (Supabase) via Prisma
   */
  async testDbConnection() {
    try {
      const response = await fetch('/api/test-db');
      return await response.json();
    } catch (error) {
       return { status: 'error', message: 'Servidor API não responde' };
    }
  },

  /**
   * Busca dados de uma coleção vinculada ao Sensei (userId)
   */
  async fetchData(collection: string, userId: string) {
    const response = await fetch(`/api/data/${collection}?userId=${userId}`);
    if (!response.ok) throw new Error(`Erro ao buscar ${collection} da API`);
    return await response.json();
  },

  /**
   * Salva ou atualiza um item em uma coleção
   */
  async saveData(collection: string, userId: string, data: any) {
    const response = await fetch(`/api/data/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId })
    });
    if (!response.ok) throw new Error(`Erro ao salvar ${collection} na API`);
    return await response.json();
  },

  /**
   * Remove um item de uma coleção
   */
  async deleteData(collection: string, id: string, userId: string) {
    const response = await fetch(`/api/data/${collection}/${id}?userId=${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`Erro ao remover ${collection} da API`);
    return await response.json();
  }
};
