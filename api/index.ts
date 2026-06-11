import express, { Response } from "express";
import { prisma } from "../prisma/client.js";
import healthHandler from "./handlers/health.js";
import healthDbHandler from "./handlers/health-db.js";
import healthDbRlsHandler from "./handlers/health-db-rls.js";
import biHandler from "./handlers/bi.js";
import { loginHandler, registerHandler, forgotPasswordHandler, resetPasswordHandler } from "./handlers/auth.js";
import { authenticate, AuthRequest } from "./authMiddleware.js";
import batchHandler from "./handlers/batch.js";
import { dataHandler } from "./handlers/data.js";
import subscriptionRouter from "./routes/subscription.js";
import { safeHandler } from "./safeHandler.js";
import neonStatusHandler from "./admin/neon-status.js";
import resetSystemMetricsHandler from "./admin/reset-system-metrics.js";
import systemMetricsHandler from "./admin/system-metrics.js";
import diagnoseHandler from "./admin/diagnose.js";

const app = express();
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ success: true, status: "OSS", timestamp: new Date().toISOString() }));
app.get("/api/health/db", safeHandler(healthDbHandler));
app.get("/api/health/db-rls", safeHandler(healthDbRlsHandler));
app.get("/api/health/full", safeHandler(healthHandler));
app.get("/api/diagnose", safeHandler(diagnoseHandler));
app.post("/api/auth/login", safeHandler(loginHandler));
app.post("/api/auth/register", safeHandler(registerHandler));
app.post("/api/auth/forgot-password", safeHandler(forgotPasswordHandler));
app.post("/api/auth/reset-password", safeHandler(resetPasswordHandler));
app.use("/api/subscriptions", subscriptionRouter);
app.get("/api/admin/neon-status", authenticate as any, safeHandler(neonStatusHandler));
app.post("/api/admin/reset-system-metrics", authenticate as any, safeHandler(resetSystemMetricsHandler));
app.get("/api/admin/system-metrics", authenticate as any, safeHandler(systemMetricsHandler));

export default app;
