import { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";

export default async function healthDbHandler(req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch (err: any) {
    return res.status(503).json({ status: "error", database: "disconnected", error: err.message });
  }
}
