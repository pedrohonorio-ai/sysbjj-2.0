import { Request, Response, NextFunction } from 'express';
export function safeHandler(fn: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      console.error("🛡️ [SAFE_HANDLER INTERCEPTED CRASH]:", err?.stack || err?.message || err);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: err?.message || "internal_error",
          code: 500,
          fallback: {}
        });
      }
    }
  };
}
export default safeHandler;
