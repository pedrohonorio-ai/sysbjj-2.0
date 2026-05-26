import { Request, Response } from 'express';

export default function healthHandler(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    status: "OSS",
    timestamp: new Date().toISOString()
  });
}
