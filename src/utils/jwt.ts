/**
 * 🥋 SYSBJJ 2.0 - JWT UTILITY
 * Utilitários para análise e validação de tokens JWT no Frontend sem dependências externas.
 */

export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  
  // Ignora tokens de simulação (ex: "Bearer ...dummy" ou tokens que não seguem o formato de 3 partes)
  const parts = token.split('.');
  if (parts.length !== 3) {
    // Se o token for literal ou de simulação curta, não o trata como expirado para fins de teste local
    if (token.startsWith('local-') || token === 'dummy' || token.includes('dummy')) {
      return false;
    }
    return true;
  }
  
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decodifica base64 preservando caracteres UTF-8
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    if (typeof payload.exp !== 'number') return false;
    
    // Retorna true se a hora atual for maior ou igual à de expiração (com margem de segurança de 30 segundos)
    return (Date.now() / 1000) >= (payload.exp - 30);
  } catch (e) {
    console.warn("🥋 [JWT UTILS] Falha ao analisar payload do token:", e);
    return true; // Se estiver corrompido, trata como expirado (inválido)
  }
}
