/**
 * 🥋 SYSBJJ 2.0 - JWT UTILITY
 * Utilitários robustos para análise e validação de tokens JWT no Frontend sem dependências externas.
 */

export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  
  // Limpa o token e remove o prefixo 'Bearer ' se ele estiver misturado no valor
  let cleanToken = token.trim();
  if (cleanToken.startsWith('Bearer ')) {
    cleanToken = cleanToken.substring(7).trim();
  }
  
  // Ignora tokens de simulação de forma segura
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    if (cleanToken.startsWith('local-') || cleanToken === 'dummy' || cleanToken.includes('dummy')) {
      return false;
    }
    return true;
  }
  
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decodifica base64 de forma segura para UTF-8
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    if (typeof payload.exp !== 'number') return false;
    
    // Retorna true se o token expirou (com margem de segurança de 30 segundos)
    return (Date.now() / 1000) >= (payload.exp - 30);
  } catch (e) {
    console.warn("🥋 [JWT UTILS] Falha ao analisar payload do token:", e);
    return true; // Se o token estiver malformado, considera-o expirado (inválido)
  }
}
