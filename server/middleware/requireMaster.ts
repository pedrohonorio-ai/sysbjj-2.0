import { Response, NextFunction } from "express";
import { AuthRequest } from "../../api/authMiddleware.js";

export const requireMaster = (req: AuthRequest, res: Response, next: NextFunction): any => {
  if (!req.user || req.user.role !== "MASTER") {
    return res.status(403).json({
      success: false,
      error: "Acesso restrito ao Sensei Master."
    });
  }
  next();
};
