/**
 * 🥋 SYSBJJ 2.0 - I18N HARDCODED TEXT SCANNER
 * Escaneia src/**/*.tsx buscando strings fixas, palavras em inglês e labels hardcoded.
 */
import fs from 'fs';
import path from 'path';

function getFilesRecursively(dir, filter) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, filter));
    } else if (filter(filePath)) {
      results.push(filePath);
    }
  });
  return results;
}

const files = getFilesRecursively('./src', (f) => f.endsWith('.tsx') || f.endsWith('.ts'));

console.log(`🥋 OSS! Iniciando varredura em ${files.length} arquivos...`);
let issuesFound = 0;

// Palavras-chave em inglês ou padrões que sugerem strings hardcoded
const englishWords = [
  'Dashboard', 'Settings', 'Profile', 'Billing', 'User Management',
  'Connected', 'Debug', 'Trace', 'Terminal', 'Loading'
];

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Evitar varrer arquivos de definições de tipos ou locales
    if (file.includes('locales') || file.includes('index.ts') || file.includes('logger.ts')) return;

    // Verificar palavras em inglês
    englishWords.forEach((word) => {
      if (line.includes(`>${word}<`) || line.includes(`"${word}"`) || line.includes(`'${word}'`)) {
        console.log(`⚠️  [HARDCODED EN/UI] ${file}:${idx + 1} -> Encontrado "${word}" na linha: ${line.trim()}`);
        issuesFound++;
      }
    });

    // Detectar padrões como <h1>Dashboard</h1> ou <h2>Settings</h2> sem usar t()
    const tagMatch = line.match(/<h[1-6]>(.*?)<\/h[1-6]>/);
    if (tagMatch && tagMatch[1] && !tagMatch[1].includes('{') && !tagMatch[1].match(/^\s*$/)) {
      console.log(`⚠️  [HARDCODED TAG] ${file}:${idx + 1} -> Tag hX estática: "${tagMatch[1].trim()}"`);
      issuesFound++;
    }
  });
});

console.log(`\n✅ Varredura concluída. Total de ocorrências suspeitas encontradas: ${issuesFound}`);
process.exit(0);
