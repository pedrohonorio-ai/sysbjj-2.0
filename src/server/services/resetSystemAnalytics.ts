import { prisma } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

export const resetSystemAnalytics = async (userId: string) => {
  // 1. Purge financial records, logs and historic metrics
  await prisma.payment.deleteMany({
    where: { userId }
  });

  await prisma.transactionLedger.deleteMany({
    where: { userId }
  });

  await prisma.paymentReceipt.deleteMany({
    where: { userId }
  });

  await prisma.systemLog.deleteMany({
    where: { userId }
  });

  await prisma.presence.deleteMany({
    where: { userId }
  });

  await prisma.extraRevenue.deleteMany({
    where: { userId }
  });

  await prisma.kimonoOrder.deleteMany({
    where: { userId }
  });

  // 2. Reset student performance counters
  await prisma.student.updateMany({
    where: { userId },
    data: {
      attendanceCount: 0,
      currentStreak: 0,
      rewardPoints: 0,
      behaviorScore: 0,
      performanceRatings: [],
      technicalMetrics: {},
      attendanceHistory: [],
      history: [],
      feedbacks: [],
      goals: [],
      milestones: [],
      sparringLogs: [],
      competitions: [],
      completedRuleLessons: [],
      techniques: [],
    },
  });
};
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

export const resetSystemAnalytics = async (userId: string) => {
  // 1. Purge financial records, logs and historic metrics
  await prisma.payment.deleteMany({
    where: { userId }
  });

  await prisma.transactionLedger.deleteMany({
    where: { userId }
  });

  await prisma.paymentReceipt.deleteMany({
    where: { userId }
  });

  await prisma.systemLog.deleteMany({
    where: { userId }
  });

  await prisma.presence.deleteMany({
    where: { userId }
  });

  await prisma.extraRevenue.deleteMany({
    where: { userId }
  });

  await prisma.kimonoOrder.deleteMany({
    where: { userId }
  });

  // 2. Reset student performance counters
  await prisma.student.updateMany({
    where: { userId },
    data: {
      attendanceCount: 0,
      currentStreak: 0,
      rewardPoints: 0,
      behaviorScore: 0,
      performanceRatings: [],
      technicalMetrics: {},
      attendanceHistory: [],
      history: [],
      feedbacks: [],
      goals: [],
      milestones: [],
      sparringLogs: [],
      competitions: [],
      completedRuleLessons: [],
      techniques: [],
    },
  });
};

