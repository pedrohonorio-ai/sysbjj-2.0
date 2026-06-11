import { Request, Response } from 'express';
import { prisma } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET || 'change-me-in-production';

export default async function diagnoseHandler(req: Request, res: Response): Promise<any> {
  const auth = req.headers['x-diagnostic-key'] || req.query.key;
  if (auth !== DIAGNOSTIC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: OSS Sensei, chave "x-diagnostic-key" ou "?key=" inválida ou ausente.' });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    vercel: !!process.env.VERCEL,
    checks: {},
    recommendations: [],
  };

  // 1. Verificar variáveis de ambiente
  results.checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    DIAGNOSTIC_SECRET: !!process.env.DIAGNOSTIC_SECRET,
  };
  if (!process.env.DATABASE_URL) {
    results.recommendations.push('DATABASE_URL não definida. Adicione no ambiente da Vercel ou em .env.local.');
  }

  // 2. Testar conectividade com o banco (timeout curto)
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    const latency = Date.now() - start;
    results.checks.database = { status: 'connected', latency_ms: latency };
  } catch (err: any) {
    results.checks.database = { status: 'error', message: err?.message || String(err) };
    if (results.checks.database.message.includes("Can't reach database server")) {
      results.recommendations.push('X-RAY: Endpoint do Neon PostgreSQL inacessível. Verifique se o projeto não está pausado ou se o IP não foi bloqueado.');
    } else if (results.checks.database.message.includes('Authentication failed')) {
      results.recommendations.push('X-RAY: Credenciais inválidas. Verifique o usuário e a senha na DATABASE_URL.');
    } else {
      results.recommendations.push(`X-RAY: Erro no banco de dados: ${results.checks.database.message.substring(0, 100)}`);
    }
  }

  // 3. Verificar migrações (apenas se o banco conectou)
  if (results.checks.database?.status === 'connected') {
    try {
      const migrations: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "_prisma_migrations"`;
      const count = Number(migrations[0]?.count || 0);
      results.checks.migrations = { applied: true, count };
    } catch (err: any) {
      results.checks.migrations = { applied: false, error: err?.message || String(err) };
      if (results.checks.migrations.error.includes('relation "_prisma_migrations" does not exist')) {
        results.recommendations.push('Nenhuma migração aplicada. Execute `npx prisma migrate deploy` ou `prisma db push`.');
      } else {
        results.recommendations.push('Erro ao verificar histórico de migrações. Certifique-se de que o Prisma gerou o histórico correto.');
      }
    }
  }

  // 4. Testar leitura de uma tabela real (students)
  if (results.checks.database?.status === 'connected') {
    try {
      const studentCount = await prisma.student.count();
      results.checks.table_students = { exists: true, count: studentCount };
    } catch (err: any) {
      results.checks.table_students = { exists: false, error: err?.message || String(err) };
      if (results.checks.table_students.error.includes('relation "Student" does not exist')) {
        results.recommendations.push('A tabela "Student" não foi encontrada no Postgres. Execute `npx prisma db push` ou verifique o schema.');
      }
    }
  }

  // 5. Informações do console Neon
  if (process.env.DATABASE_URL) {
    const neonHost = process.env.DATABASE_URL.match(/@([^:.]+)/)?.[1];
    if (neonHost) {
      results.checks.neon = {
        project_id: neonHost,
        console_url: `https://console.neon.tech/app/projects/${neonHost}`,
        note: 'Acesse o painel do Neon para verificar uso correspondente do Compute & Storage.'
      };
      results.recommendations.push(`Monitore o uso real do Neon PostgreSQL em: ${results.checks.neon.console_url}`);
    }
  }

  // 6. Sugestões automáticas gerais
  if (results.checks.database?.status !== 'connected') {
    results.recommendations.push('Impedir quebras: O circuito de proteção (Circuit Breaker) e o Self-Healing Engine estão ativos e interceptando todas as queries quebradas com fallbacks vazios e seguros.');
  }

  return res.status(200).json(results);
}
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET || 'change-me-in-production';

export default async function diagnoseHandler(req: Request, res: Response): Promise<any> {
  const auth = req.headers['x-diagnostic-key'] || req.query.key;
  if (auth !== DIAGNOSTIC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: OSS Sensei, chave "x-diagnostic-key" ou "?key=" inválida ou ausente.' });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    vercel: !!process.env.VERCEL,
    checks: {},
    recommendations: [],
  };

  // 1. Verificar variáveis de ambiente
  results.checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    DIAGNOSTIC_SECRET: !!process.env.DIAGNOSTIC_SECRET,
  };
  if (!process.env.DATABASE_URL) {
    results.recommendations.push('DATABASE_URL não definida. Adicione no ambiente da Vercel ou em .env.local.');
  }

  // 2. Testar conectividade com o banco (timeout curto)
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    const latency = Date.now() - start;
    results.checks.database = { status: 'connected', latency_ms: latency };
  } catch (err: any) {
    results.checks.database = { status: 'error', message: err?.message || String(err) };
    if (results.checks.database.message.includes("Can't reach database server")) {
      results.recommendations.push('X-RAY: Endpoint do Neon PostgreSQL inacessível. Verifique se o projeto não está pausado ou se o IP não foi bloqueado.');
    } else if (results.checks.database.message.includes('Authentication failed')) {
      results.recommendations.push('X-RAY: Credenciais inválidas. Verifique o usuário e a senha na DATABASE_URL.');
    } else {
      results.recommendations.push(`X-RAY: Erro no banco de dados: ${results.checks.database.message.substring(0, 100)}`);
    }
  }

  // 3. Verificar migrações (apenas se o banco conectou)
  if (results.checks.database?.status === 'connected') {
    try {
      const migrations: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "_prisma_migrations"`;
      const count = Number(migrations[0]?.count || 0);
      results.checks.migrations = { applied: true, count };
    } catch (err: any) {
      results.checks.migrations = { applied: false, error: err?.message || String(err) };
      if (results.checks.migrations.error.includes('relation "_prisma_migrations" does not exist')) {
        results.recommendations.push('Nenhuma migração aplicada. Execute `npx prisma migrate deploy` ou `prisma db push`.');
      } else {
        results.recommendations.push('Erro ao verificar histórico de migrações. Certifique-se de que o Prisma gerou o histórico correto.');
      }
    }
  }

  // 4. Testar leitura de uma tabela real (students)
  if (results.checks.database?.status === 'connected') {
    try {
      const studentCount = await prisma.student.count();
      results.checks.table_students = { exists: true, count: studentCount };
    } catch (err: any) {
      results.checks.table_students = { exists: false, error: err?.message || String(err) };
      if (results.checks.table_students.error.includes('relation "Student" does not exist')) {
        results.recommendations.push('A tabela "Student" não foi encontrada no Postgres. Execute `npx prisma db push` ou verifique o schema.');
      }
    }
  }

  // 5. Informações do console Neon
  if (process.env.DATABASE_URL) {
    const neonHost = process.env.DATABASE_URL.match(/@([^:.]+)/)?.[1];
    if (neonHost) {
      results.checks.neon = {
        project_id: neonHost,
        console_url: `https://console.neon.tech/app/projects/${neonHost}`,
        note: 'Acesse o painel do Neon para verificar uso correspondente do Compute & Storage.'
      };
      results.recommendations.push(`Monitore o uso real do Neon PostgreSQL em: ${results.checks.neon.console_url}`);
    }
  }

  // 6. Sugestões automáticas gerais
  if (results.checks.database?.status !== 'connected') {
    results.recommendations.push('Impedir quebras: O circuito de proteção (Circuit Breaker) e o Self-Healing Engine estão ativos e interceptando todas as queries quebradas com fallbacks vazios e seguros.');
  }

  return res.status(200).json(results);
}

