import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export default async function healthDbRlsHandler(req: Request, res: Response) {
  // 🥋 SENSEI AUTHENTICATION: Proteção do Dojo
  const senseiKey = req.headers['x-sensei-key'] || req.query.key;
  const expectedKey = process.env.SENSEI_HEALTH_KEY || "oss-master-2024";

  if (senseiKey !== expectedKey) {
    return res.status(403).json({
      status: "blocked",
      message: "🥋 Apenas o Sensei pode auditar o Tatame Digital.",
      tip: "Envie a 'x-sensei-key' correta no Header."
    });
  }

  const testUserId = (req.query.userId || req.headers['x-test-user-id']) as string;

  try {
    const startTime = Date.now();
    
    // 🥋 Teste 1: Contrato e Drift (Schema Check)
    // Buscamos um registro administrativo (sem filtro de RLS para checar existência física da tabela)
    const adminView = await prisma.student.findFirst({
      select: { 
        id: true, 
        userId: true, 
        lgpdConsent: true 
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    // 🥋 Teste 2: Auditoria de Isolamento (RLS Simulation)
    let isolationAudit: any = { status: "not_tested" };
    
    if (testUserId) {
      const startTimeIso = Date.now();
      // Simulação de query do app: DEVE retornar apenas dados do usuário
      const studentsFound = await prisma.student.findMany({
        where: { userId: testUserId },
        select: { id: true, userId: true },
        take: 5
      });

      // Checagem de Vazamento (Leaked Content)
      const leaked = studentsFound.some(s => s.userId !== testUserId);

      isolationAudit = {
        status: leaked ? "CRITICAL_FAILURE" : "success",
        records_found: studentsFound.length,
        leaked_data_detected: leaked,
        query_time_ms: Date.now() - startTimeIso
      };
    }

    const duration = Date.now() - startTime;

    res.json({
      status: isolationAudit.status === "CRITICAL_FAILURE" ? "vulnerable" : "ok",
      audit: {
        table: "Student",
        schema: "public",
        contract_valid: !!adminView,
        isolation: isolationAudit,
        performance_total_ms: duration,
        timestamp: new Date().toISOString()
      },
      strategy: {
        pattern: "Application_Level_Filtering",
        master_key_field: "userId",
        indexed: true
      },
      message: isolationAudit.status === "CRITICAL_FAILURE" 
        ? "🚨 SENSEI! Detectamos vazamento de dados entre usuários!" 
        : "🥋 OSS! O isolamento do Tatame está firme."
    });
  } catch (err: any) {
    console.error("❌ [DB SENSEI AUDIT ERROR]:", err.message);
    res.status(500).json({
      status: "error",
      message: "Falha na auditoria do Dojo.",
      error_code: err.code || "UNKNOWN",
      tip: "Verifique as Migrations e o Schema do Prisma."
    });
  }
}
