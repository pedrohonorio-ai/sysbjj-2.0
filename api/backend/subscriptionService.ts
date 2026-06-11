import { prisma } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);
export const PLANS = {
  FREE: { name: "FREE", maxStudents: 20, price: 0 },
  BRONZE: { name: "BRONZE", maxStudents: 50, price: 20 },
  SILVER: { name: "SILVER", maxStudents: 80, price: 30 },
  BLACK_BELT: { name: "BLACK_BELT", maxStudents: 999999, price: 50 },
  LIBERADO: { name: "LIBERADO", maxStudents: 999999, price: 0 },
};
export function getPlanByStudents(totalStudents: number) {
  if (totalStudents <= 20) return PLANS.FREE;
  if (totalStudents <= 50) return PLANS.BRONZE;
  if (totalStudents <= 80) return PLANS.SILVER;
  return PLANS.BLACK_BELT;
}
export async function updateSubscriptionPlan(userId: string) {
  if (!prisma) return;
  const existingSub = await prisma.subscription.findUnique({ where: { userId } });
  if (existingSub && (existingSub.plan === "LIBERADO" || existingSub.plan === "SOCIAL_PROJECT" || existingSub.grantedByAdmin)) {
    return {
      name: existingSub.plan,
      maxStudents: existingSub.studentLimit || existingSub.maxStudents || 999999,
      price: existingSub.customPrice ?? existingSub.monthlyPrice ?? 0
    };
  }
  const studentCount = await prisma.student.count({ where: { userId } });
  const planInfo = getPlanByStudents(studentCount);
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planInfo.name,
      studentLimit: planInfo.maxStudents,
      maxStudents: planInfo.maxStudents,
      monthlyPrice: planInfo.price,
      active: true
    },
    update: {
      plan: planInfo.name,
      studentLimit: planInfo.maxStudents,
      maxStudents: planInfo.maxStudents,
      monthlyPrice: planInfo.price
    }
  });
  return planInfo;
}
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;
export const PLANS = {
  FREE: { name: "FREE", maxStudents: 20, price: 0 },
  BRONZE: { name: "BRONZE", maxStudents: 50, price: 20 },
  SILVER: { name: "SILVER", maxStudents: 80, price: 30 },
  BLACK_BELT: { name: "BLACK_BELT", maxStudents: 999999, price: 50 },
  LIBERADO: { name: "LIBERADO", maxStudents: 999999, price: 0 },
};
export function getPlanByStudents(totalStudents: number) {
  if (totalStudents <= 20) return PLANS.FREE;
  if (totalStudents <= 50) return PLANS.BRONZE;
  if (totalStudents <= 80) return PLANS.SILVER;
  return PLANS.BLACK_BELT;
}
export async function updateSubscriptionPlan(userId: string) {
  if (!prisma) return;
  const existingSub = await prisma.subscription.findUnique({ where: { userId } });
  if (existingSub && (existingSub.plan === "LIBERADO" || existingSub.plan === "SOCIAL_PROJECT" || existingSub.grantedByAdmin)) {
    return {
      name: existingSub.plan,
      maxStudents: existingSub.studentLimit || existingSub.maxStudents || 999999,
      price: existingSub.customPrice ?? existingSub.monthlyPrice ?? 0
    };
  }
  const studentCount = await prisma.student.count({ where: { userId } });
  const planInfo = getPlanByStudents(studentCount);
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planInfo.name,
      studentLimit: planInfo.maxStudents,
      maxStudents: planInfo.maxStudents,
      monthlyPrice: planInfo.price,
      active: true
    },
    update: {
      plan: planInfo.name,
      studentLimit: planInfo.maxStudents,
      maxStudents: planInfo.maxStudents,
      monthlyPrice: planInfo.price
    }
  });
  return planInfo;
}

