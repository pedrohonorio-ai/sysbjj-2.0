-- SQL para configurar o banco de dados SYSBJJ 2.0 no Supabase PostgreSQL
-- Cole este código no SQL Editor do seu dashboard Supabase e clique em RUN.

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Alunos (Students)
CREATE TABLE IF NOT EXISTS "Student" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" TEXT,
    "belt" TEXT DEFAULT 'Branca',
    "degrees" INTEGER DEFAULT 0,
    "photoUrl" TEXT,
    "monthlyValue" DOUBLE PRECISION DEFAULT 0,
    "active" BOOLEAN DEFAULT true,
    "lastPaymentDate" TEXT,
    "attendanceCount" INTEGER DEFAULT 0,
    "currentStreak" INTEGER DEFAULT 0,
    "lastSeen" BIGINT,
    "observations" TEXT,
    "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Pagamentos (Payments)
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "studentId" TEXT,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Paid',
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Cronograma (ClassSchedule)
CREATE TABLE IF NOT EXISTS "ClassSchedule" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "days" TEXT[] NOT NULL,
    "active" BOOLEAN DEFAULT true
);

-- 4. Tabela de Logs (SystemLog)
CREATE TABLE IF NOT EXISTS "SystemLog" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "deviceInfo" TEXT NOT NULL,
    "previousHash" TEXT,
    "hash" TEXT
);

-- 5. Tabela de Ledger (TransactionLedger)
CREATE TABLE IF NOT EXISTS "TransactionLedger" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "studentId" TEXT,
    "timestamp" BIGINT NOT NULL,
    "previousHash" TEXT NOT NULL,
    "hash" TEXT NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "student_userid_idx" ON "Student"("userId");
CREATE INDEX IF NOT EXISTS "payment_userid_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "schedule_userid_idx" ON "ClassSchedule"("userId");
CREATE INDEX IF NOT EXISTS "log_userid_idx" ON "SystemLog"("userId");

-- Configuração de RLS (Row Level Security) - OPCIONAL se usar Prisma do lado do Servidor com bypass
-- Se quiser usar o cliente direto do Supabase no front, precisa configurar políticas.
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own students" ON "Student"
    FOR ALL USING (auth.uid()::text = "userId");

OSS! O banco está pronto para a evolução.
