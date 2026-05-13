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
      const response = await fetch('/api/health-db');
      return await response.json();
    } catch (error) {
       return { status: 'error', message: 'Servidor API não responde' };
    }
  },

  /**
   * Busca dados de uma coleção vinculada ao Sensei (userId)
   */
  async fetchData(collection: string, userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      console.log(`[Demo] Ignorando fetchData para ${collection}`);
      return [];
    }
    const response = await fetch(`/api/data/${collection}?userId=${userId}`);
    
    // Safety check for HTML responses in API routes
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      console.error(`API Error: Recebeu HTML ao buscar ${collection}. Primeiros 100 caracteres:`, text.substring(0, 100));
      
      let message = `O servidor retornou uma página HTML em vez de dados JSON ao buscar ${collection}.`;
      if (text.includes("Rate exceeded") || text.includes("too many requests")) {
        message = "🥋 PLATFORM RATE LIMIT: Muitos acessos simultâneos. Aguarde 30s e tente recarregar.";
      } else if (text.includes("Error") || text.includes("Failed")) {
        message = "🥋 ERRO DE SERVIDOR: O backend falhou catastróficamente. Verifique os Segredos (DATABASE_URL).";
      }
      
      throw new Error(message);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `Erro ao buscar ${collection} da API (${response.status})`) as any;
      if (errorData.troubleshooting) error.troubleshooting = errorData.troubleshooting;
      if (errorData.sensei_tip) error.sensei_tip = errorData.sensei_tip;
      throw error;
    }
    return await response.json();
  },

  /**
   * Busca múltiplas coleções em uma única requisição para evitar rate limiting
   */
  async fetchBatchData(collections: string[], userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      console.log(`[Demo] Ignorando fetchBatchData`);
      return {};
    }
    const response = await fetch(`/api/batch?userId=${userId}&collections=${collections.join(',')}`);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      console.error(`API Error: Recebeu HTML ao buscar batch. Primeiros 100 caracteres:`, text.substring(0, 100));
      
      let message = "O servidor retornou uma página HTML em vez de dados JSON no batch.";
      if (text.includes("Rate exceeded") || text.includes("too many requests")) {
        message = "PLATFORM RATE LIMIT: Muitos acessos simultâneos ao servidor. Por favor, aguarde 30 segundos e recarregue.";
      } else if (text.includes("Error") || text.includes("Failed")) {
        message = "ERRO DE SERVIDOR: O backend está falhando. Isso geralmente é por causa de DATABASE_URL incorreta no dashboard.";
      }
      
      throw new Error(message);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `Erro ao carregar dados em lote (${response.status})`) as any;
      if (errorData.troubleshooting) error.troubleshooting = errorData.troubleshooting;
      if (errorData.sensei_tip) error.sensei_tip = errorData.sensei_tip;
      throw error;
    }
    return await response.json();
  },

  /**
   * Salva ou atualiza um item em uma coleção
   */
  async saveData(collection: string, userId: string, data: any) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      console.log(`[Demo] Ignorando saveData para ${collection}`);
      return { status: 'demo_ok' };
    }
    const response = await fetch(`/api/data/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId })
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      console.error(`API Error: Recebeu HTML ao salvar ${collection}. Primeiros 100 caracteres:`, text.substring(0, 100));
      throw new Error(`O servidor retornou uma página HTML em vez de dados JSON ao tentar salvar.`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `Erro ao salvar ${collection} na API (${response.status})`) as any;
      if (errorData.troubleshooting) error.troubleshooting = errorData.troubleshooting;
      if (errorData.sensei_tip) error.sensei_tip = errorData.sensei_tip;
      throw error;
    }
    return await response.json();
  },

  /**
   * Remove um item de uma coleção
   */
  async deleteData(collection: string, id: string, userId: string) {
    if (typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true') {
      console.log(`[Demo] Ignorando deleteData para ${collection}`);
      return { status: 'demo_ok' };
    }
    const response = await fetch(`/api/data/${collection}/${id}?userId=${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `Erro ao remover ${collection} da API (${response.status})`) as any;
      if (errorData.troubleshooting) error.troubleshooting = errorData.troubleshooting;
      if (errorData.sensei_tip) error.sensei_tip = errorData.sensei_tip;
      throw error;
    }
    return await response.json();
  }
};
