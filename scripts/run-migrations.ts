import "../init-env"; // 🥋 OSS SENSEI: Must be first to clean env and configure direct SSL
import { prisma } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

async function executeMigration() {
  console.log("🥋 OSS SENSEI: Iniciando migração manual do banco de dados no Neon...");

  const sqlStatements = [
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "graduationDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "blackBeltDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "blackBeltDegree" INTEGER DEFAULT 0;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "nextDegreeDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "estimatedCoralDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "estimatedRedDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "lastDegreeDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "graduationEligibleDate" TIMESTAMP;`
  ];

  for (const sql of sqlStatements) {
    try {
      console.log(`Executing: ${sql}`);
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ Success for: ${sql.substring(0, 40)}...`);
    } catch (err: any) {
      console.warn(`⚠️ Warning for: ${sql.substring(0, 40)}... -> ${err.message}`);
    }
  }

  // Validando colunas existentes
  try {
    console.log("🔍 Validando colunas da tabela Student...");
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Student';
    `;
    console.log("📊 Colunas encontradas:");
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
  } catch (err: any) {
    console.error("🚨 Falha ao validar colunas:", err.message);
  }

  console.log("🥋 OSS SENSEI: Migração concluída!");
  process.exit(0);
}

executeMigration().catch(err => {
  console.error("🚨 ERRO CRÍTICO NA MIGRAÇÃO:", err);
  process.exit(1);
});
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

async function executeMigration() {
  console.log("🥋 OSS SENSEI: Iniciando migração manual do banco de dados no Neon...");

  const sqlStatements = [
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "graduationDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "blackBeltDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "blackBeltDegree" INTEGER DEFAULT 0;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "nextDegreeDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "estimatedCoralDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "estimatedRedDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "lastDegreeDate" TIMESTAMP;`,
    `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "graduationEligibleDate" TIMESTAMP;`
  ];

  for (const sql of sqlStatements) {
    try {
      console.log(`Executing: ${sql}`);
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ Success for: ${sql.substring(0, 40)}...`);
    } catch (err: any) {
      console.warn(`⚠️ Warning for: ${sql.substring(0, 40)}... -> ${err.message}`);
    }
  }

  // Validando colunas existentes
  try {
    console.log("🔍 Validando colunas da tabela Student...");
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Student';
    `;
    console.log("📊 Colunas encontradas:");
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
  } catch (err: any) {
    console.error("🚨 Falha ao validar colunas:", err.message);
  }

  console.log("🥋 OSS SENSEI: Migração concluída!");
  process.exit(0);
}

executeMigration().catch(err => {
  console.error("🚨 ERRO CRÍTICO NA MIGRAÇÃO:", err);
  process.exit(1);
});

