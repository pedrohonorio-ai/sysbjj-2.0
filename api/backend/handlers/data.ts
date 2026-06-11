import { Response } from "express";
import { prisma } from "../../prisma/client.js";
import { AuthRequest } from "../authMiddleware.js";

export const serializeData = (data: any) =>
  JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? Number(v) : v));

export const SAFE_STUDENT_SELECT = {
  id: true, name: true, email: true, belt: true,
  joinedAt: true, userId: true, status: true
};

export const enrichStudentsList = (list: any[]) => list;

export async function dataHandler(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: "Nao autenticado." });

  try {
    await prisma.$queryRaw`SELECT 1`;
    const students = await prisma.student.findMany({
      where: { userId: String(userId) },
      select: SAFE_STUDENT_SELECT,
      take: 200
    });
    return res.json({ success: true, data: serializeData(students) });
  } catch (err: any) {
    return res.status(503).json({ success: false, error: err.message });
  }
}
