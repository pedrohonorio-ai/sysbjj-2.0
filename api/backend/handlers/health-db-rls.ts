import { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";

export default async function healthDbRlsHandler(req: Request, res: Response) {
  try {
    const userCount = await prisma.user.count();
    return res.status(200).json({ status: "ok", table: "User", count: Number(userCount) });
  } catch (err: any) {
    return res.status(503).json({ status: "error", error: err.message });
  }
}
