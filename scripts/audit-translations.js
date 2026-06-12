/**
 * 🥋 SYSBJJ 2.0 - TRANSLATION AUDITOR
 * Valida chaves faltando, labels vazias e inglês residual em pt-BR.json.
 */
import fs from 'fs';
import path from 'path';

const ptBRPath = './src/i18n/locales/pt-BR.json';
const enPath = './src/i18n/locales/en-US.json';

console.log(`🥋 OSS! Iniciando auditoria dos arquivos de tradução...`);

if (!fs.existsSync(ptBRPath)) {
  console.log(`❌ pt-BR.json não encontrado em ${ptBRPath}`);
  process.exit(1);
}

try {
  const ptData = JSON.parse(fs.readFileSync(ptBRPath, 'utf8'));
  const enData = fs.existsSync(enPath) ? JSON.parse(fs.readFileSync(enPath, 'utf8')) : {};

  let errors = 0;
  let warnings = 0;

  // 1. Validar chaves e detectar valores vazios/nulos
  function auditKeys(obj, prefix = '') {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value === null || value === undefined) {
        console.log(`❌ [NULO] Chave "${fullKey}" está nula/indefinida.`);
        errors++;
      } else if (typeof value === 'object') {
        auditKeys(value, fullKey);
      } else if (typeof value === 'string') {
        if (value.trim() === '') {
          console.log(`❌ [VAZIA] Chave "${fullKey}" contém string vazia.`);
          errors++;
        }
        
        // 2. Detectar residual English em valores pt-BR
        if (fullKey.includes('pt-BR') || !prefix.includes('en-US')) {
          const lowerValue = value.toLowerCase();
          const suspiciousWords = ['welcome to', 'sign out', 'settings page', 'loading data'];
          suspiciousWords.forEach((word) => {
            if (lowerValue.includes(word)) {
              console.log(`⚠️  [INGLÊS RESIDUAL] Chave "${fullKey}" contém termo suspeito em inglês: "${value}"`);
              warnings++;
            }
          });
        }
      }
    }
  }

  auditKeys(ptData);

  // 2. Comparar chaves entre Inglês e Português para detectar chaves ausentes
  function findKeys(obj, prefix = '', list = []) {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        findKeys(obj[key], fullKey, list);
      } else {
        list.push(fullKey);
      }
    }
    return list;
  }

  const ptKeysList = findKeys(ptData);
  const enKeysList = findKeys(enData);

  const missingInPt = enKeysList.filter((k) => !ptKeysList.includes(k));
  if (missingInPt.length > 0) {
    console.log(`\n⚠️  [CHAVES FALTANDO NO PT-BR] Detectadas chaves existentes no inglês mas ausentes no português:`);
    missingInPt.forEach((k) => {
      console.log(`   - ${k}`);
      warnings++;
    });
  }

  console.log(`\n==========================================`);
  console.log(`AUDITORIA CONCLUÍDA:`);
  console.log(`❌ Erros Críticos (impede produção): ${errors}`);
  console.log(`⚠️  Alertas de Qualidade (auditado): ${warnings}`);
  console.log(`==========================================`);

  if (errors > 0) {
    process.exit(1);
  } else {
    console.log(`🥋 OSS! Todos os arquivos estão perfeitamente saudáveis!`);
    process.exit(0);
  }
} catch (ex) {
  console.error(`❌ Falha geral na leitura do JSON de traduções:`, ex);
  process.exit(1);
}
