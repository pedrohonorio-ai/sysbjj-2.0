import { prisma } from '../prisma/client.js';

export const PLANS = {
  FREE: { name: "FREE", maxStudents: 20, price: 0 },
  BRONZE: { name: "BRONZE", maxStudents: 50, price: 20 },
  SILVER: { name: "SILVER", maxStudents: 80, price: 30 },
  BLACK_BELT: { name: "BLACK_BELT", maxStudents: 999999, price: 50 },
};

export function getPlanByStudents(totalStudents: number) {
  if (totalStudents <= 20) {
    return PLANS.FREE;
  }

  if (totalStudents <= 50) {
    return PLANS.BRONZE;
  }

  if (totalStudents <= 80) {
    return PLANS.SILVER;
  }

  return PLANS.BLACK_BELT;
}

export async function updateSubscriptionPlan(userId: string) {
  if (!prisma) return;

  const studentCount = await prisma.student.count({
    where: { userId }
  });

  const planInfo = getPlanByStudents(studentCount);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planInfo.name,
      maxStudents: planInfo.maxStudents,
      monthlyPrice: planInfo.price,
      active: true
    },
    update: {
      plan: planInfo.name,
      maxStudents: planInfo.maxStudents,
      monthlyPrice: planInfo.price
    }
  });

  return planInfo;
}
