import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sysbjj-enterprise-oss-secret-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Acesso negado. Token não fornecido.',
      sensei_tip: 'OSS! Você precisa estar autenticado para acessar este recurso.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(403).json({ 
      error: 'Token inválido ou expirado.',
      sensei_tip: 'Sua sessão expirou. Por favor, faça login novamente para continuar sua evolução.'
    });
  }
};
