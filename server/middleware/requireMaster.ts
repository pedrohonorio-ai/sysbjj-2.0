import { Response, NextFunction } from "express";
import { AuthRequest } 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

export const requireMaster = (req: AuthRequest, res: Response, next: NextFunction): any => {
  if (!req.user || req.user.role !== "MASTER") {
    return res.status(403).json({
      success: false,
      error: "Acesso restrito ao Sensei Master.",
      code: 403
    });
  }
  next();
};
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

export const requireMaster = (req: AuthRequest, res: Response, next: NextFunction): any => {
  if (!req.user || req.user.role !== "MASTER") {
    return res.status(403).json({
      success: false,
      error: "Acesso restrito ao Sensei Master.",
      code: 403
    });
  }
  next();
};

