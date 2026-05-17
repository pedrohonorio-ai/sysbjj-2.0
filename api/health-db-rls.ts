import { Request, Response } from 'express';
import { prisma } from '../src/server/prisma.js';

export default async function healthDbRlsHandler(req: Request, res: Response) {
  try {
    const userCount = await prisma.user.count();
    return res.status(200).json({
      status: "ok",
      table: "User",
      accessible: true,
      count: userCount,
      sensei_message: "🥋 O acesso à tabela User está validado."
    });
  } catch (err: any) {
    return res.status(503).json({
      status: "error",
      message: err.message,
      tip: "A tabela User pode estar faltando. Execute prisma migrate deploy."
    });
  }
}
