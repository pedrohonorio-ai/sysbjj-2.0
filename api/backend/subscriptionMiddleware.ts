import { Response, NextFunction } from 'express';
import { prisma } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);
import { AuthRequest } from './authMiddleware';

export const checkStudentLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [studentCount, subscription] = await Promise.all([
      prisma.student.count({ where: { userId: String(userId) } }),
      prisma.subscription.findUnique({ where: { userId: String(userId) } })
    ]);

    const maxStudents = subscription?.maxStudents || 20;

    if (studentCount >= maxStudents) {
      return res.status(403).json({
        success: false,
        error: "Limite de alunos atingido para o seu plano atual.",
        upgrade_required: true,
        sensei_tip: `Sensei, você atingiu o limite de ${maxStudents} alunos. Hora de subir de faixa no seu plano!`,
        current_usage: studentCount,
        limit: maxStudents
      });
    }

    next();
  } catch (error: any) {
    console.error("🥋 [LIMIT CHECK ERROR]:", error.message);
    next(); // Fallback to allow if DB fails? Or block? Let's allow for now but log.
  }
};
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;
import { AuthRequest } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

export const checkStudentLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [studentCount, subscription] = await Promise.all([
      prisma.student.count({ where: { userId: String(userId) } }),
      prisma.subscription.findUnique({ where: { userId: String(userId) } })
    ]);

    const maxStudents = subscription?.maxStudents || 20;

    if (studentCount >= maxStudents) {
      return res.status(403).json({
        success: false,
        error: "Limite de alunos atingido para o seu plano atual.",
        upgrade_required: true,
        sensei_tip: `Sensei, você atingiu o limite de ${maxStudents} alunos. Hora de subir de faixa no seu plano!`,
        current_usage: studentCount,
        limit: maxStudents
      });
    }

    next();
  } catch (error: any) {
    console.error("🥋 [LIMIT CHECK ERROR]:", error.message);
    next(); // Fallback to allow if DB fails? Or block? Let's allow for now but log.
  }
};
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

export const checkStudentLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [studentCount, subscription] = await Promise.all([
      prisma.student.count({ where: { userId: String(userId) } }),
      prisma.subscription.findUnique({ where: { userId: String(userId) } })
    ]);

    const maxStudents = subscription?.maxStudents || 20;

    if (studentCount >= maxStudents) {
      return res.status(403).json({
        success: false,
        error: "Limite de alunos atingido para o seu plano atual.",
        upgrade_required: true,
        sensei_tip: `Sensei, você atingiu o limite de ${maxStudents} alunos. Hora de subir de faixa no seu plano!`,
        current_usage: studentCount,
        limit: maxStudents
      });
    }

    next();
  } catch (error: any) {
    console.error("🥋 [LIMIT CHECK ERROR]:", error.message);
    next(); // Fallback to allow if DB fails? Or block? Let's allow for now but log.
  }
};

