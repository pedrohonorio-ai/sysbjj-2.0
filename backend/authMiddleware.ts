import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client.js';

// 🥋 SYSBJJ 2.0 - JWT_SECRET CLEANUP UTILITY
const getCleanSecret = (secret: string | undefined): string => {
  if (!secret) return 'sysbjj-enterprise-oss-secret-2024';
  return secret
    .trim()
    .replace(/^['"‘“`”’]|['"’’”‘`]$/g, '') // remove common single/double and typographic quotes
    .replace(/[\r\n]/g, '')                // remove literal newlines and carriage returns
    .replace(/\\n/g, '')                   // strip escaped backslash newlines
    .replace(/\\r/g, '')
    .trim();
};

const JWT_SECRET = getCleanSecret(process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.SESSION_SECRET);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  console.log(`🔐 [AUTH MIDDLEWARE] ${req.method} ${req.path}`);
  console.log('🔐 Auth header:', authHeader ? `${authHeader.substring(0, 25)}...` : 'undefined');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('❌ [AUTH MIDDLEWARE] Denied: Missing or malformed authorization header.');
    return res.status(401).json({ 
      success: false,
      error: 'Acesso negado. Token não fornecido.',
      code: 401,
      sensei_tip: 'OSS! Você precisa estar autenticado para acessar este recurso.' 
    });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔐 Token extraído:', token ? `${token.substring(0, 15)}...` : 'empty');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ [AUTH MIDDLEWARE] Token validado para:', decoded.email, 'Role:', decoded.role);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // 🥋 OSS SENSEI: Registra atividade em background sem bloquear a requisição principal
    if (prisma && decoded.id) {
      prisma.user.update({
        where: { id: decoded.id },
        data: { lastActivityAt: new Date(), active: true }
      }).catch(() => {});
    }

    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.warn(`🥋 [AUTH MIDDLEWARE] JWT validation failed: ${err.message}. Requiring re-authentication.`);
    } else {
      console.error('❌ [AUTH MIDDLEWARE] Unexpected error validating JWT:', err.message || err);
    }
    return res.status(401).json({ 
      success: false,
      error: 'Token inválido ou expirado.',
      code: 401,
      sensei_tip: 'Sua sessão expirou ou o token é inválido. Por favor, faça login novamente para continuar sua evolução.'
    });
  }
};
