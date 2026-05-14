import { Request, Response } from 'express';

export default function healthHandler(req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    message: "🥋 OSS! Dojo Backend online [V2.5.5].",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
}
