/**
 * 🥋 SYSBJJ 2.0 - AUTOMATIC I18N FIXER
 * Substitui automaticamente termos estáticos na interface de usuário por chamadas de tradução.
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

const files = getFilesRecursively('./src', (f) => f.endsWith('.tsx'));

console.log(`🥋 OSS! Iniciando auto-fixer em ${files.length} arquivos...`);
let replacementsCount = 0;

const replacements = [
  { search: '>Dashboard</', replace: '>{t("dashboard.title")}</' },
  { search: '>"Dashboard"</', replace: '>"{t("dashboard.title")}"</' },
  { search: '>Settings</', replace: '>{t("settings.title")}</' },
  { search: '>"Settings"</', replace: '>"{t("settings.title")}"</' },
  { search: '>Perfil</', replace: '>{t("profile.title")}</' },
  { search: '>Idioma</', replace: '>{t("settings.language")}</' },
  { search: 'Security_Node_Active', replace: 'Sistema Protegido' },
  { search: 'Automatic_Sync_Enabled', replace: 'Sincronização Ativa' },
  { search: 'Hash_SHA', replace: 'Segurança Operacional' }
];

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach((rep) => {
    while (content.includes(rep.search)) {
      content = content.replace(rep.search, rep.replace);
      replacementsCount++;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✏️  Arquivo corrigido com sucesso: ${file}`);
  }
});

console.log(`\n✅ Correção automática concluída. Total de termos substituídos: ${replacementsCount}`);
process.exit(0);
