import "./init-env"; // 🥋 OSS SENSEI: Deve ser o PRIMEIRO import
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./prisma/client";

// GLOBAL ERROR HANDLERS
process.on('uncaughtException', (err) => {
  console.error("🥋 OS SENSEI! UNCAUGHT EXCEPTION:", err);
});

process.on('unhandledRejection', (reason) => {
  console.error("🥋 OS SENSEI! UNHANDLED REJECTION:", reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("OS SENSEI! Iniciando startServer...");
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Initialization middleware - must be above all API routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") && !prisma) {
      // Except for health check and test-db
      const exempt = ["/api/health", "/api/test-db"].includes(req.path);
      if (exempt) return next();
      
      return res.status(503).json({ error: "O sistema está inicializando os serviços de banco de dados. Por favor, aguarde alguns segundos e tente novamente." });
    }
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), platform: "Supabase + Prisma + Express" });
  });

  // DB Diagnostic
  app.get("/api/test-db", async (req, res) => {
    try {
      if (!prisma) {
        return res.status(503).json({ 
          status: "initializing", 
          message: "O motor Prisma ainda está aquecendo. Aguarde alguns segundos." 
        });
      }

      const dbUrl = process.env.DATABASE_URL || "";
      const isHttps = dbUrl.startsWith("https://");
      const isPooler = dbUrl.includes(":6543");
      const isLocalhost = dbUrl.includes("localhost:5432");

      if (!dbUrl || isLocalhost) {
        return res.status(500).json({ 
          status: "error", 
          message: "OSS! DATABASE_URL não configurada ou inválida nos Segredos (Secrets).",
          suggestion: "Vá em Settings > Secrets e adicione DATABASE_URL com a URI do Supabase."
        });
      }

      if (isHttps) {
        return res.status(500).json({ 
          status: "error", 
          message: "OSS! URL detectada como HTTPS. O Prisma exige protocolo postgresql://",
          action: "Vá no Supabase > Settings > Database > URI (Connection String)"
        });
      }

      console.log("🥋 OSS! Testando conexão com o DB...");
      await prisma.$connect();
      res.json({ 
        status: "connected", 
        message: "OSS! Sistema online e conectado ao Dojo Cloud (Supabase).",
        details: { pooler: isPooler, protocol: dbUrl.split('://')[0] }
      });
    } catch (error: any) {
      console.error("Erro de conexão DB:", error);
      
      const troubleshooting = [
        "1. Verifique se trocou [YOUR-PASSWORD] pela senha real.",
        "2. IMPORTANTE: Use URL Encoding para símbolos (@ = %40, # = %23, ! = %21).",
        "3. Estabilidade: Tente usar a porta 6543 (Transaction Pooler).",
        "4. Supabase Status: Verifique se o projeto não está pausado por inatividade."
      ];

      res.status(500).json({ 
        status: "error", 
        message: "Falha ao conectar no banco.",
        troubleshooting,
        error: error.message 
      });
    }
  });

  // Central error handler for API routes
  const handleApiError = (res: any, error: any, collection: string) => {
    console.error(`OS SENSEI! Erro na API [${collection}]:`, error);
    
    const dbUrl = process.env.DATABASE_URL || "";
    const isHttps = dbUrl.startsWith("https://");
    const isLocalhostFallback = dbUrl.includes("localhost:5432");
    const hasPlaceholder = dbUrl.includes("[YOUR-PASSWORD]");
    const isPort5432 = dbUrl.includes(":5432") && !dbUrl.includes(":6543");

    // Proactive detection of unencoded symbols in password
    const passwordPart = dbUrl.includes('@') ? dbUrl.split('@')[0].split(':').pop() : "";
    const hasUnencodedSymbols = passwordPart && /[@#$!%&*]/.test(passwordPart);

    let customMessage = error.message;
    let troubleshooting = [];
    let senseiTip = "OSS SENSEI! O 'cinto de segurança' (DATABASE_URL) deve estar bem apertado.";

    if (isHttps) {
      customMessage = "OSS! Erro de Configuração: URL do Supabase incorreta (HTTPS).";
      troubleshooting.push("Use a 'String de Conexão' (URI) que começa com 'postgresql://'.");
    } else if (hasPlaceholder) {
      customMessage = "OSS! Senha do banco não configurada.";
      troubleshooting.push("Substitua [YOUR-PASSWORD] pela senha real no menu Settings > Secrets.");
    } else if (isLocalhostFallback) {
      customMessage = "OSS! O sistema está em modo REVISÃO (DATABASE_URL inválida).";
      troubleshooting.push("A URL do banco detectada é inválida ou aponta para localhost.");
      troubleshooting.push("Isso acontece quando você não configurou os Segredos (Secrets) corretamente.");
    } else if (error.message && (error.message.includes("Authentication failed") || error.message.includes("Invalid database password") || error.message.includes("P1017") || error.message.includes("credentials for 'postgres' are not valid"))) {
      customMessage = "OSS! Falha de Autenticação: Senha incorreta ou formato inválido.";
      troubleshooting.push("⚠️ DICA DE OURO: Se sua senha tem símbolos (@, #, !, :), você PRECISA usar URL Encoding.");
      if (hasUnencodedSymbols) {
        troubleshooting.push("🥋 ATENÇÃO: Detectamos símbolos não codificados na sua senha atual.");
      }
      troubleshooting.push("Exemplo: 'MinhaSenha@123' deve ser escrita como 'MinhaSenha%40123' na DATABASE_URL.");
      troubleshooting.push("No Supabase, você pode resetar a senha do projeto em Settings > Database.");
      troubleshooting.push("Certifique-se de que não há espaços extras antes ou depois da URL no menu Secrets.");
    } else if (error.message && (error.message.includes("Can't reach database server") || error.message.includes("Timed out") || error.message.includes("P1001") || error.message.includes("P1003"))) {
      customMessage = "OSS! Não foi possível alcançar o servidor do banco.";
      if (isPort5432) {
        troubleshooting.push("Aviso: Você está usando a porta 5432 (direta).");
        troubleshooting.push("Para maior estabilidade, use a porta 6543 (Pooler) com pgbouncer=true.");
      }
      if (dbUrl.includes("localhost:5432")) {
        troubleshooting.push("CUIDADO: O sistema está tentando conectar no localhost.");
        troubleshooting.push("Isso acontece se a DATABASE_URL for inválida ou não começar com 'postgresql://'.");
        troubleshooting.push("Verifique os Segredos (Secrets) no AI Studio.");
      }
      troubleshooting.push("Verifique se o projeto no Supabase não foi 'Pausado' por inatividade.");
      troubleshooting.push("Confirme se o IP da aplicação não está bloqueado no Supabase.");
    }

    res.status(500).json({ 
      error: customMessage,
      operationType: collection === "batch" ? "list" : "write", 
      path: collection,
      troubleshooting: troubleshooting.length > 0 ? troubleshooting : ["Tente recarregar a página ou use o Modo Demo no topo."],
      sensei_tip: senseiTip,
      diagnostic: {
        code: error.code || 'P-INIT',
        has_symbols: hasUnencodedSymbols
      }
    });
  };

  // Health Check Route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // DB Diagnostic Route
  app.get("/api/health-db", async (req, res) => {
    const rawUrl = process.env.DATABASE_URL || "";
    // Mascara a senha para segurança: postgres://USER:PASSWORD@HOST:PORT/DB
    const maskedUrl = rawUrl.replace(/(:\/\/)([^:]+):([^@]+)(@)/, "$1$2:****$4");
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ 
        status: "connected", 
        timestamp: new Date().toISOString(),
        info: "OSS! Banco de dados respondendo corretamente.",
        diagnostic: {
          url_preview: maskedUrl.substring(0, 60) + "...",
          is_pooler: rawUrl.includes(':6543'),
          has_pgbouncer: rawUrl.includes('pgbouncer=true')
        }
      });
    } catch (error: any) {
      console.error("❌ FALHA NO TESTE DE CONEXÃO DB:", error.message);
      res.status(500).json({ 
        status: "error", 
        message: error.message,
        diagnostic: {
          url_preview: maskedUrl.substring(0, 60) + "...",
          error_code: error.code || 'UNKNOWN'
        },
        suggestion: "OSS! Verifique se a DATABASE_URL está correta no menu Settings > Secrets. Se sua senha tem símbolos, use URL Encoding."
      });
    }
  });

  // Generic Get Route for User Collections
  app.get("/api/data/:collection", async (req, res) => {
    const { userId } = req.query;
    const { collection } = req.params;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      let data;
      const uid = String(userId);
      switch(collection) {
        case 'students': data = await prisma.student.findMany({ where: { userId: uid }, orderBy: { joinedAt: 'desc' } }); break;
        case 'payments': data = await prisma.payment.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
        case 'schedules': data = await prisma.classSchedule.findMany({ where: { userId: uid } }); break;
        case 'logs': data = await prisma.systemLog.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 50 }); break;
        case 'ledger': data = await prisma.transactionLedger.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
        case 'receipts': data = await prisma.paymentReceipt.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' } }); break;
        case 'extra_revenue': data = await prisma.extraRevenue.findMany({ where: { userId: uid } }); break;
        case 'lesson_plans': data = await prisma.lessonPlan.findMany({ where: { userId: uid } }); break;
        case 'techniques': data = await prisma.libraryTechnique.findMany({ where: { userId: uid } }); break;
        case 'products': data = await prisma.product.findMany({ where: { userId: uid } }); break;
        case 'plans': data = await prisma.plan.findMany({ where: { userId: uid } }); break;
        case 'orders': data = await prisma.kimonoOrder.findMany({ where: { userId: uid } }); break;
        case 'profile': data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); break;
        default: return res.status(404).json({ error: "Collection not found" });
      }
      
      // JSON BigInt handling applied to GET as well to prevent "Do not know how to serialize a BigInt"
      res.json(JSON.parse(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
    } catch (error: any) {
      handleApiError(res, error, collection);
    }
  });

  // Batch Get Route to prevent platform rate-limiting from parallel fetches
  app.get("/api/batch", async (req, res) => {
    const { userId, collections } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (!collections || typeof collections !== 'string') return res.status(400).json({ error: "collections query param is required as comma-separated string" });

    const collectionList = collections.split(',');
    const results: Record<string, any> = {};
    const uid = String(userId);

    try {
      // Execute all prisma calls in parallel on the server (which is fine)
      await Promise.all(collectionList.map(async (collection) => {
        let data;
        switch(collection) {
          case 'students': data = await prisma.student.findMany({ where: { userId: uid }, orderBy: { joinedAt: 'desc' } }); break;
          case 'payments': data = await prisma.payment.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
          case 'schedules': data = await prisma.classSchedule.findMany({ where: { userId: uid } }); break;
          case 'logs': data = await prisma.systemLog.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 50 }); break;
          case 'ledger': data = await prisma.transactionLedger.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
          case 'receipts': data = await prisma.paymentReceipt.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' } }); break;
          case 'extra_revenue': data = await prisma.extraRevenue.findMany({ where: { userId: uid } }); break;
          case 'lesson_plans': data = await prisma.lessonPlan.findMany({ where: { userId: uid } }); break;
          case 'techniques': data = await prisma.libraryTechnique.findMany({ where: { userId: uid } }); break;
          case 'products': data = await prisma.product.findMany({ where: { userId: uid } }); break;
          case 'plans': data = await prisma.plan.findMany({ where: { userId: uid } }); break;
          case 'orders': data = await prisma.kimonoOrder.findMany({ where: { userId: uid } }); break;
          case 'profile': data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); break;
          default: data = { error: "Collection not found" };
        }
        results[collection] = data;
      }));

      res.json(JSON.parse(JSON.stringify(results, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
    } catch (error: any) {
      handleApiError(res, error, "batch");
    }
  });

  // Generic Upsert Route
  app.post("/api/data/:collection", async (req, res) => {
    const { collection } = req.params;
    const body = req.body;
    const { userId, ...data } = body;

    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      let result;
      const uid = String(userId);
      
      switch(collection) {
        case 'students':
          result = await prisma.student.upsert({
            where: { id: data.id || 'new' },
            update: { ...data, userId: uid },
            create: { ...data, id: data.id || undefined, userId: uid }
          });
          break;
        case 'payments':
          result = await prisma.payment.create({ data: { ...data, userId: uid } });
          break;
        case 'logs':
          result = await prisma.systemLog.create({ data: { ...data, userId: uid, timestamp: BigInt(data.timestamp || Date.now()) } });
          break;
        case 'ledger':
          result = await prisma.transactionLedger.create({ data: { ...data, userId: uid, timestamp: BigInt(data.timestamp || Date.now()) } });
          break;
        case 'receipts':
          result = await prisma.paymentReceipt.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid, timestamp: BigInt(data.timestamp || Date.now()) },
            update: { ...data, userId: uid }
          });
          break;
        case 'schedules':
          result = await prisma.classSchedule.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'extra_revenue':
          result = await prisma.extraRevenue.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'lesson_plans':
          result = await prisma.lessonPlan.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'techniques':
          result = await prisma.libraryTechnique.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'products':
          result = await prisma.product.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'plans':
          result = await prisma.plan.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'orders':
          result = await prisma.kimonoOrder.upsert({
            where: { id: data.id || 'new' },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        case 'presence':
          result = await prisma.presence.upsert({
            where: { email_deviceId: { email: data.email, deviceId: data.deviceId } },
            create: { ...data, userId: uid, lastSeen: BigInt(data.lastSeen || Date.now()) },
            update: { ...data, userId: uid, lastSeen: BigInt(data.lastSeen || Date.now()) }
          });
          break;
        case 'profile':
          result = await prisma.professorProfile.upsert({
            where: { userId: uid },
            create: { ...data, userId: uid },
            update: { ...data, userId: uid }
          });
          break;
        default: return res.status(404).json({ error: "Collection not supported for POST" });
      }
      
      // JSON BigInt handling
      res.json(JSON.parse(JSON.stringify(result, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
    } catch (error: any) {
      handleApiError(res, error, collection);
    }
  });

  // Delete Route
  app.delete("/api/data/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      const uid = String(userId);
      let result;
      switch(collection) {
        case 'students': result = await prisma.student.deleteMany({ where: { id, userId: uid } }); break;
        case 'payments': result = await prisma.payment.deleteMany({ where: { id, userId: uid } }); break;
        case 'schedules': result = await prisma.classSchedule.deleteMany({ where: { id, userId: uid } }); break;
        case 'extra_revenue': result = await prisma.extraRevenue.deleteMany({ where: { id, userId: uid } }); break;
        case 'lesson_plans': result = await prisma.lessonPlan.deleteMany({ where: { id, userId: uid } }); break;
        case 'techniques': result = await prisma.libraryTechnique.deleteMany({ where: { id, userId: uid } }); break;
        case 'products': result = await prisma.product.deleteMany({ where: { id, userId: uid } }); break;
        case 'plans': result = await prisma.plan.deleteMany({ where: { id, userId: uid } }); break;
        case 'orders': result = await prisma.kimonoOrder.deleteMany({ where: { id, userId: uid } }); break;
        default: return res.status(404).json({ error: "Collection not supported for DELETE" });
      }
      res.json({ success: true, count: result.count });
    } catch (error: any) {
      handleApiError(res, error, collection);
    }
  });

  // API Routes ended. Final 404 for API.
  // Using a middleware for catch-all API to avoid path-to-regexp string issues in Express 5
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
    }
    next();
  });

  // Start listening immediately
  const dbUrl = process.env.DATABASE_URL || "";
  const maskedStartUrl = dbUrl.replace(/(:\/\/)([^:]+):([^@]+)(@)/, "$1$2:****$4");
  console.log(`🥋 OSS SENSEI: Iniciando com DATABASE_URL=${maskedStartUrl.substring(0, 60)}...`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OS SENSEI! Servidor ouvindo na porta ${PORT}`);
    console.log(`URL Local: http://localhost:${PORT}`);
  });

  // Lazy load/init prisma is handled by the singleton import
  console.log("OS SENSEI! Prisma Singleton pronto.");

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("OS SENSEI! Iniciando Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("OS SENSEI! Vite pronto.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback: Use a middleware that serves index.html for non-API requests
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }
}

startServer().catch(err => {
  console.error("OS SENSEI! ERRO FATAL NO STARTUP:", err);
});
