import i18n from '../i18n/index.js';

const MANDATORY_DICTIONARY: Record<string, string> = {
  "dashboard.recentActivities": "Atividades Recentes",
  "dashboard.syncStatus": "Status de Sincronização",
  "dashboard.students": "Alunos",
  "dashboard.analytics": "Análises",
  "settings.system": "Sistema",
  "subscription.current": "Plano Atual"
};

/**
 * 🥋 SYSBJJ 2.0 - SAFE TRANSLATION HELPER
 * Prevents internal keys, camelCase, or snake_case technical IDs from leaking to the UI.
 * Provides a seamless fallback chain for premium UX.
 */
export function tSafe(key: string, fallback?: string): string {
  // Priority fallback dict for mandatory keys in pt-BR
  const currentLang = i18n.language || 'pt-BR';
  if (currentLang.startsWith('pt') && MANDATORY_DICTIONARY[key]) {
    return MANDATORY_DICTIONARY[key];
  }

  const value = i18n.t(key);
  
  // 1. If key is missing (i18n returns the key name itself)
  if (!value || value === key) {
    if (fallback) return fallback;
    if (MANDATORY_DICTIONARY[key]) return MANDATORY_DICTIONARY[key];
    return formatKey(key);
  }
  
  // 2. If retrieved value is suspicious (contains underscore, or is a raw dotted path/camelcase key without space)
  const isInternalKey = 
    value.includes('_') || 
    (value.includes('.') && !value.includes(' ')) || 
    (/^[a-z]+[A-Z]/.test(value) && !value.includes(' '));
    
  if (isInternalKey) {
    if (fallback) return fallback;
    if (MANDATORY_DICTIONARY[key]) return MANDATORY_DICTIONARY[key];
    return formatKey(key);
  }
  
  return value;
}

function formatKey(key: string): string {
  const lastPart = key.split('.').pop() || '';
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^./, s => s.toUpperCase());
}
