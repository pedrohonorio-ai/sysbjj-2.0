import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

const SECRET = process.env.JWT_SECRET || "sysbjj-secret-2024";

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, error: "Token ausente." });
  const token = header.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, SECRET) as any;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Token invalido." });
  }
}
