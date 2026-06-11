import { Response } from "express";
import { prisma } from "../../prisma/client.js";
import { AuthRequest } from "../authMiddleware.js";

const BATCH_COOLDOWN = 500;
const userBatchCooldowns = new Map<string, number>();

export default async function batchHandler(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: "Nao autenticado." });

  const now = Date.now();
  const uid = String(userId);
  if (now - (userBatchCooldowns.get(uid) || 0) < BATCH_COOLDOWN) {
    return res.status(429).json({ success: false, error: "Cooldown ativo." });
  }
  userBatchCooldowns.set(uid, now);

  const { collections } = req.query;
  if (!collections || typeof collections !== "string") {
    return res.status(400).json({ success: false, error: "Colecoes obrigatorias." });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    const fallbacks: any = {};
    for (const c of collections.split(",")) fallbacks[c.trim()] = c.trim() === "profile" ? null : [];
    return res.status(200).json({ success: true, ...fallbacks, _offline: true });
  }

  const results: Record<string, any> = {};
  const serialize = (d: any) => JSON.parse(JSON.stringify(d, (_, v) => typeof v === "bigint" ? Number(v) : v));

  const collList = collections.split(",").map(c => c.trim()).filter(Boolean);

  await Promise.all(collList.map(async (coll) => {
    try {
      const p = prisma as any;
      if (p[coll]) {
        results[coll] = serialize(await p[coll].findMany({ where: { userId: uid }, take: 200 }));
      } else {
        results[coll] = [];
      }
    } catch {
      results[coll] = [];
    }
  }));

  return res.status(200).json({ success: true, ...results });
}
