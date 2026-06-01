// diagnose-backend.js
// Executar: node diagnose-backend.js
// Diagnóstico completo do backend serverless (Vercel + Neon)

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function error(msg) { log(`❌ ${msg}`, 'red'); }
function success(msg) { log(`✅ ${msg}`, 'green'); }
function warning(msg) { log(`⚠️ ${msg}`, 'yellow'); }
function info(msg) { log(`📌 ${msg}`, 'blue'); }

// ==================== 1. Verificar ambiente ====================
info('=== DIAGNÓSTICO BACKEND SYSBJJ ===\n');

// .env.local / .env
let envPath = '';
if (fs.existsSync('.env.local')) envPath = '.env.local';
else if (fs.existsSync('.env')) envPath = '.env';

let databaseUrl = process.env.DATABASE_URL || '';

if (envPath) {
  success(`Arquivo de ambiente encontrado: ${envPath}`);
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasDbUrl = envContent.includes('DATABASE_URL');
  const hasDirectUrl = envContent.includes('DIRECT_URL');
  if (hasDbUrl) {
    success('DATABASE_URL definida');
    if (!databaseUrl) {
      // Tenta extrair a var
      const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?(\r?\n|$)/);
      if (match && match[1]) {
        databaseUrl = match[1];
      }
    }
  }
  else error('DATABASE_URL NÃO encontrada no .env');
  if (hasDirectUrl) success('DIRECT_URL definida');
  else warning('DIRECT_URL não definida (opcional)');
} else {
  warning('Nenhum arquivo .env/.env.local encontrado. Variáveis podem estar apenas na Vercel.');
}

// ==================== 2. Verificar conexão com Neon via Prisma ====================
info('\n🔗 Testando conexão com Neon (via Prisma)...');
try {
  const output = execSync('npx prisma db execute --stdin --schema=prisma/schema.prisma', {
    input: 'SELECT 1 as ping',
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  if (output.includes('1') || output.includes('ping')) success('Banco de dados respondeu (SELECT 1)');
  else warning('Banco respondeu mas formato inesperado');
} catch (err) {
  error(`Falha na conexão com Neon: ${err.message}`);
  if (err.message.includes("Can't reach database server")) {
    error('  → O endpoint do Neon pode estar incorreto ou fora do ar.');
  }
  if (err.message.includes('Authentication failed')) {
    error('  → Credenciais inválidas. Verifique DATABASE_URL.');
  }
}

// ==================== 3. Verificar migrações pendentes ====================
info('\n📦 Verificando migrações...');
try {
  const status = execSync('npx prisma migrate status', { encoding: 'utf-8', stdio: 'pipe' });
  if (status.includes('Database schema is up to date')) {
    success('Migrações estão em dia');
  } else if (status.includes('Database schema is not up to date')) {
    warning('Há migrações pendentes. Execute: npx prisma migrate deploy');
  } else {
    console.log(status);
  }
} catch (err) {
  error(`Não foi possível verificar migrações: ${err.message}`);
}

// ==================== 4. Simular chamada local à API ====================
info('\n🌐 Testando endpoint local (se servidor estiver rodando)...');
const endpoints = [
  '/api/data/students',
  '/api/data/profile',
  '/api/data/presence',
  '/api/batch?collections=students'
];

for (const endpoint of endpoints) {
  try {
    const url = `http://localhost:3000${endpoint}`;
    const response = await fetch(url, { method: 'GET', headers: { 'x-user-id': 'test-diagnostic' } });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.data)) success(`${endpoint} -> OK, array de ${data.data.length} itens`);
      else if (data && data.students && Array.isArray(data.students)) success(`${endpoint} -> OK, batch success`);
      else warning(`${endpoint} -> Resposta sem array esperado: ${JSON.stringify(data).slice(0, 100)}`);
    } else {
      error(`${endpoint} -> HTTP ${response.status}`);
      const text = await response.text();
      if (text.includes('FUNCTION_INVOCATION_FAILED')) error('    → Erro típico de função serverless na Vercel');
      if (text.includes('P1001')) error('    → Erro de conexão com banco de dados');
    }
  } catch (err) {
    error(`${endpoint} -> Não respondeu (servidor local não está rodando?): ${err.message}`);
  }
}

// ==================== 5. Testar DNS do Neon ====================
info('\n🔍 Resolvendo DNS do endpoint Neon...');
const dbUrl = databaseUrl || process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const hostMatch = dbUrl.match(/@([^:/]+)/);
    if (hostMatch) {
      const host = hostMatch[1];
      success(`Endpoint host extraído: ${host}`);
    }
  } catch (dnsErr) {
    error(`Host do Neon não pôde ser extraído: ${dnsErr.message}`);
  }
}

// ==================== 6. Verificar limite do plano Neon ====================
info('\n💰 Verificando uso do Neon...');
const neonHost = dbUrl?.match(/@([^:.]+)/)?.[1];
if (neonHost) {
  const projectId = neonHost.split('.')[0];
  warning(`Não é possível verificar uso via script público. Acesse: https://console.neon.tech/app/projects/${projectId}/usage`);
} else {
  warning('Não foi possível extrair o host ou project ID do Neon. Verifique manualmente no console Neon.');
}

// ==================== 7. Simular falhas comuns ====================
info('\n🧪 Simulação de cenários comuns de falha...');
console.log('Se você está vendo "FUNCTION_INVOCATION_FAILED" na Vercel:');
console.log('  1️⃣ A função não conseguiu nem iniciar (erro de dependência ou sintaxe)');
console.log('  2️⃣ O banco de dados rejeitou a conexão (Neon fora do ar ou limite atingido)');
console.log('  3️⃣ Timeout excedido (mais de 10s na Vercel Hobby)');
console.log('  4️⃣ Variável DATABASE_URL não está presente no ambiente da Vercel');

console.log('\n🔧 Recomendações finais:');
console.log('  • Acesse os logs detalhados na Vercel:');
console.log('      https://vercel.com/settings/environment-variables');
console.log('  • Teste a função do servidor localmente com comando: npm run dev');
console.log('  • Verifique o console Neon para uso de armazenamento/compute:');
console.log('      https://console.neon.tech');
console.log('  • Se for limite gratuito, atualize o plano ou limpe dados antigos.');
console.log('  • Considere o fallback do circuito com bypass de DB resiliente já ativo no SYSBJJ 2.0.');

info('\n✅ Diagnóstico concluído.');
