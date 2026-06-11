import { prisma } from "../../prisma/client.js";

export const PLANS = {
  FREE: { name: "FREE", maxStudents: 20, price: 0 },
  BASIC: { name: "BASIC", maxStudents: 100, price: 49 },
  PRO: { name: "PRO", maxStudents: 500, price: 99 },
  ENTERPRISE: { name: "ENTERPRISE", maxStudents: 99999, price: 199 }
};

export async function getUserPlan(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return (user as any)?.plan || "FREE";
  } catch {
    return "FREE";
  }
}
