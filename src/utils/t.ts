import i18n from '../i18n/index.js';

/**
 * 🥋 SYSBJJ 2.0 - SAFE TRANSLATION HELPER
 * Prevents internal keys, camelCase, or snake_case technical IDs from leaking to the UI.
 * Provides a seamless fallback chain for premium UX.
 */
export function tSafe(key: string, fallback?: string): string {
  const value = i18n.t(key);
  
  // 1. If key is missing (i18n returns the key name itself)
  if (!value || value === key) {
    return fallback || formatKey(key);
  }
  
  // 2. If retrieved value is suspicious (contains underscore, or is a raw dotted path/camelcase key without space)
  const isInternalKey = 
    value.includes('_') || 
    (value.includes('.') && !value.includes(' ')) || 
    (/^[a-z]+[A-Z]/.test(value) && !value.includes(' '));
    
  if (isInternalKey) {
    return fallback || formatKey(key);
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
