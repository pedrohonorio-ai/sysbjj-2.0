import express from "express";
import { prisma } from "../prisma/client.js";
import healthHandler from "./backend/handlers/health.js";
import healthDbHandler from "./backend/handlers/health-db.js";
import healthDbRlsHandler from "./backend/handlers/health-db-rls.js";
import { loginHandler, registerHandler, forgotPasswordHandler, resetPasswordHandler } from "./backend/handlers/auth.js";
import { authenticate, AuthRequest } from "./backend/authMiddleware.js";
import batchHandler from "./backend/handlers/batch.js";
import { dataHandler } from "./backend/handlers/data.js";
import { safeHandler } from "./backend/safeHandler.js";

const app = express();
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ success: true, status: "OSS", timestamp: new Date().toISOString() }));
app.get("/api/health/db", safeHandler(healthDbHandler));
app.get("/api/health/db-rls", safeHandler(healthDbRlsHandler));
app.get("/api/health/full", safeHandler(healthHandler));
app.post("/api/auth/login", safeHandler(loginHandler));
app.post("/api/auth/register", safeHandler(registerHandler));
app.post("/api/auth/forgot-password", safeHandler(forgotPasswordHandler));
app.post("/api/auth/reset-password", safeHandler(resetPasswordHandler));
app.use("/api/data", authenticate as any, safeHandler(dataHandler));
app.use("/api/batch", authenticate as any, safeHandler(batchHandler));

export default app;
