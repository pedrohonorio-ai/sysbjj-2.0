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
  if (!prisma) {
    console.warn('🥋 [SUBSCRIPTION] Prisma não inicializado.');
    return null;
  }

  try {
    const [subscription, studentCount] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId }
      }),
      prisma.student.count({
        where: { userId }
      })
    ]);

    // Preserva planos especiais administrados manualmente
    if (
      subscription &&
      (
        subscription.grantedByAdmin === true ||
        subscription.isSocialProject === true ||
        subscription.billingCycle === 'LIFETIME' ||
        subscription.billingCycle === 'CUSTOM'
      )
    ) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          currentStudents: studentCount
        }
      });

      console.log(
        `🥋 [SUBSCRIPTION] Plano especial preservado para ${userId}. Alunos: ${studentCount}`
      );

      return subscription;
    }

    const planInfo = getPlanByStudents(studentCount);

    const updatedSubscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: planInfo.name,
        studentLimit: planInfo.maxStudents,
        maxStudents: planInfo.maxStudents,
        currentStudents: studentCount,
        monthlyPrice: planInfo.price,
        paymentStatus: 'ACTIVE',
        active: true,
      },
      update: {
        plan: planInfo.name,
        studentLimit: planInfo.maxStudents,
        maxStudents: planInfo.maxStudents,
        currentStudents: studentCount,
        monthlyPrice: planInfo.price,
      }
    });

    console.log(
      `🥋 [SUBSCRIPTION UPDATED] User: ${userId} | Plano: ${planInfo.name} | Alunos: ${studentCount}`
    );

    return updatedSubscription;

  } catch (error: any) {
    console.error(
      '🥋 [SUBSCRIPTION ERROR]',
      error?.message || error
    );

    return null;
  }
}
