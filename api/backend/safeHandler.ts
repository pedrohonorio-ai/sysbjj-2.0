import { Request, Response, NextFunction } from "express";
export function safeHandler(fn: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      console.error("[SAFE HANDLER ERROR]:", err.message || err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message || "Erro interno." });
      }
    }
  };
}
