import "./init-env"; // 🥋 OSS SENSEI: Deve ser o PRIMEIRO import
import express from "express";
import cors from "cors";
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
  console.log("OS SENSEI! Iniciando servidor...");
  const app = express();
  const PORT = 3000;

  // Helper para serialização segura de BigInt
  const serializeData = (data: any) => {
    return JSON.parse(JSON.stringify(data, (k, v) => 
      typeof v === 'bigint' 
        ? (Number(v) <= Number.MAX_SAFE_INTEGER ? Number(v) : v.toString()) 
        : v
    ));
  };

  // 🥋 Diagnostic for debugging
  console.log('🥋 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  const handleApiError = (res: any, error: any, collection: string) => {
    console.error(`🥋 🚨 OS SENSEI! Erro Crítico na API [${collection}]:`, error);
    
    // Extrair mensagem de erro do Prisma se possível
    let message = error.message;
    let status = 500;

    // 🥋 Tratamento Especializado Prisma (Enterprise Mode)
    if (message.includes("supabase.com:6543") && !message.includes("pooler.supabase.com")) {
      status = 503;
      message = "🚨 OSS SENSEI! Erro de Configuração: Você está usando o host genérico 'supabase.com'. Substitua por '[PROJECT-REF].pooler.supabase.com' no menu Settings > Secrets.";
    } else if (error.name === 'PrismaClientInitializationError' || error.name === 'PrismaClientConnectorError') {
      status = 503;
      message = "O Dojo Cloud (Banco de Dados) está temporariamente indisponível. Verifique a DATABASE_URL.";
    } else if (error.code === 'P2002') {
      message = `Erro de Unicidade: Já existe um registro com estes dados em ${collection}.`;
    } else if (error.code === 'P2025') {
      message = `Registro não encontrado em ${collection}.`;
    }
    
    res.status(status).json({ 
      error: message || "Erro interno no Dojo",
      code: error.code,
      operationType: ["batch", "students", "payments"].includes(collection) ? "list" : "write", 
      path: collection,
      sensei_tip: "OSS! Verifique se todos os campos obrigatórios foram enviados e se a DATABASE_URL está correta."
    });
  };

  // Body parser
  app.use(express.json());

  // 🥋 OSS SENSEI: Configuração de CORS para Enterprise
  app.use(cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (como ferramentas de teste ou server-to-server)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://sysbjj-2-0.vercel.app",
        "https://sysbjj.online"
      ];

      const isAllowed = !origin || 
                       allowedOrigins.includes(origin) || 
                       origin.includes("ais-dev") ||
                       origin.includes("ais-pre") ||
                       origin.includes(".run.app") ||
                       origin.includes(".vercel.app") ||
                       origin.includes("onrender.com");

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`🥋 [CORS BLOCKED] Origin: ${origin}`);
        callback(null, false); // No ambiente enterprise, somos restritos, mas flexíveis se necessário
      }
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }));

  // 🥋 OSS SENSEI: Rota de Health Check baseada em Padrão Cloud (Render/Railway)
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "🥋 OSS! Dojo Backend online.", 
      timestamp: new Date().toISOString() 
    });
  });

  // 🥋 OSS SENSEI: Rota de Health DB (User Connectivity Test)
  app.get("/api/health-db", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({
        status: "ok",
        database: "connected"
      });
    } catch (err: any) {
      return res.status(500).json({
        status: "error",
        message: err.message
      });
    }
  });

  // 🥋 OSS SENSEI: Middleware de Log para Depuração de Rotas
  app.use((req, res, next) => {
    // Log detalhado para diagnosticar 404
    if (req.path.startsWith("/api")) {
      console.log(`🥋 [API REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url} (Path: ${req.path})`);
    } else {
       // Log de ativos para ver se o favicon ou fontes estão causando barulho
       if (!req.path.includes("node_modules") && !req.path.includes("@vite")) {
         console.log(`🥋 [ASSET REQUEST] ${req.method} ${req.path}`);
       }
    }
    next();
  });

  // API Router
  const apiRouter = express.Router();

  // Middleware para garantir que o Router está operando corretamente
  apiRouter.use((req, res, next) => {
    console.log(`🥋 [ROUTER DEBUG] Request matching: ${req.method} ${req.path}`);
    next();
  });

  // Initialization middleware for the entire router
  apiRouter.use((req, res, next) => {
    if (!prisma) {
      // Except for health checks
      const exempt = ["/health", "/health-db", "/test-db"].includes(req.path);
      if (exempt) return next();
      
      return res.status(503).json({ error: "O sistema está inicializando. Por favor, aguarde alguns segundos." });
    }
    next();
  });

  // Diagnostic route
  apiRouter.get("/routes", (req, res) => {
    const routes = (apiRouter.stack as any[])
      .filter(r => r.route)
      .map(r => `${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    res.json({ mounted_at: "/api", routes });
  });

  // Health and Diagnostic Routes
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), platform: "Supabase + Prisma + Express" });
  });

  // Legacy diagnostic route for backward compatibility with some components
  apiRouter.get("/test-db", async (req, res) => {
    try {
      if (!prisma) return res.status(503).json({ status: "initializing" });
      await prisma.$connect();
      res.json({ status: "connected", message: "OSS! Sistema online." });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Generic Get Route
  apiRouter.get("/data/:collection", async (req, res) => {
    const { userId } = req.query;
    const { collection } = req.params;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      let data;
      const uid = String(userId);
      const anyPrisma = prisma as any;

      // Usar switch para coleções conhecidas, ou fallback para qualquer tabela do prisma
      switch(collection) {
        case 'students': data = await prisma.student.findMany({ where: { userId: uid }, orderBy: { joinedAt: 'desc' } }); break;
        case 'payments': data = await prisma.payment.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 200 }); break;
        case 'schedules': data = await prisma.classSchedule.findMany({ where: { userId: uid } }); break;
        case 'presence': data = await prisma.presence.findMany({ where: { userId: uid } }); break;
        case 'logs': data = await prisma.systemLog.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 100 }); break;
        case 'ledger': data = await prisma.transactionLedger.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 200 }); break;
        case 'receipts': data = await prisma.paymentReceipt.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' } }); break;
        case 'profile': data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); break;
        default: 
          if (anyPrisma[collection]) {
            data = await anyPrisma[collection].findMany({ where: { userId: uid } });
          } else {
            return res.status(404).json({ error: `Coleção não encontrada no Dojo: ${collection}` });
          }
      }
      res.json(serializeData(data));
    } catch (error: any) {
      handleApiError(res, error, collection);
    }
  });

  // Batch Route
  apiRouter.get("/batch", async (req, res) => {
    const { userId, collections } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (!collections || typeof collections !== 'string') return res.status(400).json({ error: "collections list required" });

    const collectionList = collections.split(',');
    const results: Record<string, any> = {};
    const uid = String(userId);

    try {
      await Promise.all(collectionList.map(async (collection) => {
        try {
          let data;
          switch(collection) {
            case 'students': data = await prisma.student.findMany({ where: { userId: uid }, orderBy: { joinedAt: 'desc' } }); break;
            case 'payments': data = await prisma.payment.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 50 }); break;
            case 'schedules': data = await prisma.classSchedule.findMany({ where: { userId: uid } }); break;
            case 'logs': data = await prisma.systemLog.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 50 }); break;
            case 'ledger': data = await prisma.transactionLedger.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' }, take: 50 }); break;
            case 'receipts': data = await prisma.paymentReceipt.findMany({ where: { userId: uid }, orderBy: { timestamp: 'desc' } }); break;
            case 'extra_revenue': data = await prisma.extraRevenue.findMany({ where: { userId: uid } }); break;
            case 'lesson_plans': data = await prisma.lessonPlan.findMany({ where: { userId: uid } }); break;
            case 'techniques': data = await prisma.libraryTechnique.findMany({ where: { userId: uid } }); break;
            case 'products': data = await prisma.product.findMany({ where: { userId: uid } }); break;
            case 'plans': data = await prisma.plan.findMany({ where: { userId: uid } }); break;
            case 'orders': data = await prisma.kimonoOrder.findMany({ where: { userId: uid } }); break;
            case 'batch_presence': data = await prisma.presence.findMany({ where: { userId: uid } }); break;
            case 'profile': data = await prisma.professorProfile.findUnique({ where: { userId: uid } }); break;
            default: 
              const anyPrisma = prisma as any;
              if (anyPrisma[collection]) {
                data = await anyPrisma[collection].findMany({ where: { userId: uid }, take: 100 });
              } else {
                data = [];
              }
          }
          results[collection] = data;
        } catch (e) {
          console.error(`🥋 [BATCH ERROR] Falha na coleção ${collection}:`, e);
          results[collection] = []; // Resiliência: retorna vazio em vez de quebrar o lote
        }
      }));

      res.json(serializeData(results));
    } catch (error: any) {
      handleApiError(res, error, "batch");
    }
  });

  // POST Upsert Route
  apiRouter.post("/data/:collection", async (req, res) => {
    const { collection } = req.params;
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      let result;
      const uid = String(userId);
      switch(collection) {
        case 'students':
          result = await prisma.student.upsert({
            where: { id: data.id || 'new-stu' },
            update: { ...data, userId: uid },
            create: { ...data, id: data.id || undefined, userId: uid }
          });
          break;
        case 'presence':
          result = await prisma.presence.upsert({
            where: { 
              email_deviceId: { 
                email: String(data.email || ''), 
                deviceId: String(data.deviceId || 'default-device') 
              } 
            },
            create: { 
              ...data, 
              userId: uid, 
              email: String(data.email || ''),
              deviceId: String(data.deviceId || 'default-device'),
              lastSeen: BigInt(Math.floor(Number(data.lastSeen || Date.now()))) 
            },
            update: { 
              ...data, 
              userId: uid, 
              lastSeen: BigInt(Math.floor(Number(data.lastSeen || Date.now()))) 
            }
          });
          break;
        case 'logs':
          result = await prisma.systemLog.create({ data: { ...data, userId: uid, timestamp: BigInt(data.timestamp || Date.now()) } });
          break;
        case 'ledger':
          result = await prisma.transactionLedger.create({ data: { ...data, userId: uid, timestamp: BigInt(data.timestamp || Date.now()) } });
          break;
        case 'profile':
          // Remove ID se vier do frontend para não conflitar com o CUID
          const { id: profileId, ...profileData } = data;
          result = await prisma.professorProfile.upsert({
            where: { userId: uid },
            update: { ...profileData, userId: uid },
            create: { ...profileData, userId: uid }
          });
          break;
        // Adicionar outros cases conforme necessário para as tabelas principais
        default:
          // Fallback genérico para tabelas que usam ID padrão
          const anyPrisma = prisma as any;
          if (anyPrisma[collection]) {
             result = await anyPrisma[collection].upsert({
                where: { id: data.id || 'new' },
                create: { ...data, userId: uid },
                update: { ...data, userId: uid }
             });
          } else {
             return res.status(404).json({ error: `Coleção não suportada para gravação: ${collection}` });
          }
      }
      res.json(serializeData(result));
    } catch (error: any) {
      handleApiError(res, error, collection);
    }
  });

  // DELETE Route
  apiRouter.delete("/data/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      const anyPrisma = prisma as any;
      if (anyPrisma[collection]) {
        const result = await anyPrisma[collection].deleteMany({ where: { id, userId: String(userId) } });
        res.json({ success: true, count: result.count });
      } else {
        res.status(404).json({ error: "Collection not found" });
      }
    } catch (error: any) {
      handleApiError(res, error, collection);
    }
  });

  // API 404 catch-all (inside the router!)
  apiRouter.use((req, res) => {
    console.warn(`🥋 [API 404] ${req.method} ${req.originalUrl} - Não casou em nenhuma rota do apiRouter.`);
    res.status(404).json({ 
      error: `API Route not found: ${req.method} ${req.originalUrl}`,
      tip: "OSS! Verifique se o endpoint existe no server.ts e se o prefixo /api está correto."
    });
  });

  // Mount API Router
  app.use("/api", apiRouter);

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
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // START LISTENING
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🥋 OSS SENSEI! Dojo Cloud ouvindo na porta ${PORT}`);
    console.log(`URL Local: http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error("OS SENSEI! ERRO FATAL NO STARTUP:", err);
});
