import { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";

export default async function biHandler(req: Request, res: Response) {
  return res.json({ success: true, data: [] });
}
