import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client.js';
import { handleApiError } from '../utils.js';
import { MASTER_ADMIN_EMAIL } from '../../server/config/masterAdmin.js';

const getCleanSecret = (secret: string | undefined): string => {
  if (!secret) return 'sysbjj-enterprise-oss-secret-2024';
  return secret
    .trim()
    .replace(/^['"'"`"']|['"''"'`]$/g, '')
    .replace(/[\r\n]/g, '')
    .replace(/\\n/g, '')
    .replace(/\\r/g, '')
    .trim();
};

const JWT_SECRET = getCleanSecret(process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.SESSION_SECRET);

const generateToken = (user: any) => {
  const isMasterAdmin = user.email === MASTER_ADMIN_EMAIL;
  return jwt.sign(
    { id: user.id, email: user.email, role: isMasterAdmin ? "MASTER" : "USER" },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ✉️ Envia email via Resend
const sendResetEmail = async (toEmail: string, resetToken: string): Promise<boolean> => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error('🥋 [EMAIL] BREVO_API_KEY não configurado');
    return false;
  }

  const appUrl = process.env.APP_URL || 'https://sysbjj2.vercel.app';
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'SYSBJJ', email: 'noreply@sender.brevo.com' },
        to: [{ email: toEmail }],
        subject: '🥋 OSS! Recuperação de senha - SYSBJJ',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 40px; border-radius: 16px;">
            <h1 style="color: #3b82f6; font-size: 24px; margin-bottom: 8px;">🥋 SYSBJJ</h1>
            <h2 style="font-size: 20px; margin-bottom: 24px;">Recuperação de Senha</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">OSS Sensei! Recebemos uma solicitação para redefinir sua senha.</p>
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 24px;">
              Redefinir Senha
            </a>
            <p style="color: #64748b; font-size: 14px;">Este link expira em 1 hora.</p>
            <p style="color: #64748b; font-size: 14px;">Se não solicitou isso, ignore este email.</p>
            <hr style="border-color: #1e293b; margin: 24px 0;">
            <p style="color: #475569; font-size: 12px;">SYSBJJ 2.0 — Sistema de Gestão de Academia BJJ</p>
          </div>
        `
      })
    });

    if (response.ok) {
      console.log(`🥋 [EMAIL] Enviado com sucesso para ${toEmail}`);
      return true;
    } else {
      const err = await response.json();
      console.error('🥋 [EMAIL] Erro Brevo:', err);
      return false;
    }
  } catch (error) {
    console.error('🥋 [EMAIL] Exceção ao enviar:', error);
    return false;
  }
};

  if (!apiKey) {
    console.error('🥋 [EMAIL] RESEND_API_KEY não configurado');
    return false;
  }

  const appUrl = process.env.APP_URL || 'https://sysbjj2.vercel.app';
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `SYSBJJ <${fromEmail}>`,
        to: [toEmail],
        subject: '🥋 OSS! Recuperação de senha - SYSBJJ',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 40px; border-radius: 16px;">
            <h1 style="color: #3b82f6; font-size: 24px; margin-bottom: 8px;">🥋 SYSBJJ</h1>
            <h2 style="font-size: 20px; margin-bottom: 24px;">Recuperação de Senha</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">OSS Sensei! Recebemos uma solicitação para redefinir sua senha.</p>
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 24px;">
              Redefinir Senha
            </a>
            <p style="color: #64748b; font-size: 14px;">Este link expira em 1 hora.</p>
            <p style="color: #64748b; font-size: 14px;">Se não solicitou isso, ignore este email.</p>
            <hr style="border-color: #1e293b; margin: 24px 0;">
            <p style="color: #475569; font-size: 12px;">SYSBJJ 2.0 — Sistema de Gestão de Academia BJJ</p>
          </div>
        `
      })
    });

    if (response.ok) {
      console.log(`🥋 [EMAIL] Enviado com sucesso para ${toEmail}`);
      return true;
    } else {
      const err = await response.json();
      console.error('🥋 [EMAIL] Erro Resend:', err);
      return false;
    }
  } catch (error) {
    console.error('🥋 [EMAIL] Exceção ao enviar:', error);
    return false;
  }
};

export const registerHandler = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || null, role: 'admin' }
    });

    try {
      await prisma.subscription.create({
        data: { userId: user.id, plan: "FREE", studentLimit: 20, maxStudents: 20, monthlyPrice: 0, paymentStatus: "ACTIVE", active: true }
      });
    } catch (subErr: any) {
      console.error("⚠️ Falha ao criar assinatura inicial:", subErr.message);
    }

    const { password: _, ...userWithoutPassword } = user;
    if (user.email === MASTER_ADMIN_EMAIL) userWithoutPassword.role = 'MASTER';
    const token = generateToken(user);
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ success: false, error: 'Usuário não cadastrado.' });
    if (user.active === false || user.deletedAt !== null) return res.status(401).json({ success: false, error: 'Sua conta está desativada.' });
    if (!user.password) return res.status(401).json({ success: false, error: 'Senha incorreta.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Senha incorreta. Verifique suas credenciais.' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    const isMasterAdmin = user.email === MASTER_ADMIN_EMAIL;
    if (isMasterAdmin) (userWithoutPassword as any).role = 'MASTER';
    const token = generateToken(user);

    res.status(200).json({ success: true, user: userWithoutPassword, token, data: { user: userWithoutPassword, token } });

    // Background tasks
    Promise.resolve().then(async () => {
      try {
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastActivityAt: new Date(), active: true } });
      } catch (_) {}
      try {
        await prisma.systemLog.create({
          data: { userId: user.id, timestamp: BigInt(Date.now()), userEmail: user.email, action: isMasterAdmin ? 'LOGIN_MASTER' : 'LOGIN_SUCCESS', details: `Login via ${req.headers['user-agent'] || 'Dispositivo'}`, category: 'Auth', deviceInfo: req.headers['user-agent'] || 'Desconhecido' }
        });
      } catch (_) {}
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 🥋 Cache de tokens de reset (em memória)
const resetTokensCache = new Map<string, { email: string; expiresAt: number }>();

export const forgotPasswordHandler = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'O e-mail é obrigatório.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não cadastrado.' });

    const resetToken = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || 'o').join('');
    resetTokensCache.set(resetToken, { email, expiresAt: Date.now() + 60 * 60 * 1000 });

    const emailSent = await sendResetEmail(email, resetToken);

    try {
      await prisma.systemLog.create({
        data: { userId: user.id, timestamp: BigInt(Date.now()), userEmail: email, action: 'PASSWORD_RESET_REQUESTED', details: `Email enviado: ${emailSent}. Token: ${resetToken}`, category: 'Security', deviceInfo: req.headers['user-agent'] || 'Desconhecido' }
      });
    } catch (_) {}

    if (emailSent) {
      return res.json({ success: true, message: 'Email de recuperação enviado! Verifique sua caixa de entrada.' });
    } else {
      return res.json({
        success: true,
        message: 'Link gerado. Configure o RESEND_API_KEY no Vercel para envio automático.',
        token: resetToken // só retorna token se email falhou
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ success: false, error: 'Token e nova senha são obrigatórios.' });

  const record = resetTokensCache.get(token);
  if (!record) return res.status(400).json({ success: false, error: 'Token inválido ou já utilizado.' });
  if (Date.now() > record.expiresAt) {
    resetTokensCache.delete(token);
    return res.status(400).json({ success: false, error: 'Link expirado. Solicite um novo.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { email: record.email }, data: { password: hashedPassword } });
    resetTokensCache.delete(token);

    try {
      await prisma.systemLog.create({
        data: { userId: user.id, timestamp: BigInt(Date.now()), userEmail: record.email, action: 'PASSWORD_RESET_SUCCESSFUL', details: `Senha redefinida com sucesso.`, category: 'Security', deviceInfo: req.headers['user-agent'] || 'Desconhecido' }
      });
    } catch (_) {}

    return res.json({ success: true, message: 'Senha redefinida com sucesso! Faça login com suas novas credenciais.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
