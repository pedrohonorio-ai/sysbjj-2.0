import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client.js';
import { handleApiError } from '../utils.js';
import { MASTER_ADMIN_EMAIL } from '../../server/config/masterAdmin.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'sysbjj-enterprise-oss-secret-2024';

const generateToken = (user: any) => {
  const isMasterAdmin = user.email === MASTER_ADMIN_EMAIL;
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: isMasterAdmin ? "MASTER" : "USER" 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const registerHandler = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  console.log(`🥋 [AUTH REGISTER] Iniciando para: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    if (!prisma) {
      console.error("🥋 [AUTH REGISTER FAIL]: Prisma client is null");
      return res.status(503).json({ 
          success: false, 
          error: "O sistema de dados não foi inicializado corretamente.",
          sensei_tip: "Sensei, verifique as variáveis de ambiente no Vercel."
      });
    }

    console.log(`🥋 [AUTH REGISTER] Verificando se usuário existe: ${email}`);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    console.log(`🥋 [AUTH REGISTER] Gerando hash da senha...`);
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`🥋 [AUTH REGISTER] Criando usuário no banco...`);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: 'admin'
      }
    });

    console.log(`🥋 [AUTH REGISTER] Criando assinatura FREE inicial...`);
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        studentLimit: 20,
        maxStudents: 20,
        monthlyPrice: 0,
        paymentStatus: "ACTIVE",
        active: true
      }
    });

    console.log(`🥋 [AUTH REGISTER] Usuário criado com sucesso: ${user.id}`);
    // Remove password before sending
    const { password: _, ...userWithoutPassword } = user;
    const isMasterAdmin = user.email === MASTER_ADMIN_EMAIL;
    if (isMasterAdmin) {
      userWithoutPassword.role = 'MASTER';
    }
    const token = generateToken(user);

    res.status(201).json({ 
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error("🥋 [AUTH REGISTER CRASH]:", error);
    res.status(500).json({
        success: false,
        error: error.message || "Erro inesperado no registro",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined
    });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`🥋 [DIAGNOSTICO LOGIN] Início da autenticação para: ${email}`);

  // 1. Mandatory validation of email and password before querying
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email e senha são obrigatórios',
      error: 'Email e senha são obrigatórios',
      data: null
    });
  }

  // 2. Environment variables audit during runtime
  const missingEnvVars = [];
  if (!process.env.DATABASE_URL) missingEnvVars.push('DATABASE_URL');
  if (!process.env.JWT_SECRET && !process.env.AUTH_SECRET && !process.env.SESSION_SECRET) missingEnvVars.push('JWT_SECRET/AUTH_SECRET/SESSION_SECRET');
  if (missingEnvVars.length > 0) {
    console.error(`🚨 [DIAGNOSTICO CONFIG ERRO] Segredos de ambiente ausentes: ${missingEnvVars.join(', ')}`);
  }

  try {
    if (!prisma) {
        console.error("🥋 [DIAGNOSTICO LOGIN FAIL] [AUTH LOGIN FAIL]: Prisma client is null");
        return res.status(503).json({ 
            success: false, 
            message: "O sistema de dados não foi inicializado corretamente.",
            error: "O sistema de dados não foi inicializado corretamente.",
            sensei_tip: "Sensei, o banco de dados não respondeu.",
            data: null
        });
    }

    // Ensure connection is established before querying
    try {
      await prisma.$connect();
    } catch (connErr: any) {
      console.error("🥋 [DIAGNOSTICO LOGIN FAIL] Prisma connection error:", connErr);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor.",
        error: "Erro de rede com o banco de dados: " + connErr.message,
        data: null
      });
    }

    console.log(`🥋 [DIAGNOSTICO LOGIN] Buscando usuário: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`🥋 [DIAGNOSTICO LOGIN FAIL] Usuário não encontrado no banco: ${email}`);
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não cadastrado.',
        error: 'Usuário não cadastrado.',
        data: null
      });
    }

    if (user.active === false || user.deletedAt !== null) {
      console.log(`🥋 [DIAGNOSTICO LOGIN FAIL] Conta desativada/excluída para: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Sua conta está desativada.',
        error: 'Sua conta está desativada.',
        data: null
      });
    }

    console.log(`🥋 [DIAGNOSTICO LOGIN] Usuário localizado com sucesso: ${email}`);

    if (!user.password) {
      console.log(`🥋 [DIAGNOSTICO LOGIN FAIL] Hash de senha ausente para: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Senha incorreta. Verifique suas credenciais.',
        error: 'Senha incorreta. Verifique suas credenciais.',
        data: null
      });
    }

    console.log(`🥋 [DIAGNOSTICO LOGIN] Validação da senha iniciada...`);
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log(`🥋 [DIAGNOSTICO LOGIN FAIL] Senha incorreta para o usuário: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Senha incorreta. Verifique suas credenciais.',
        error: 'Senha incorreta. Verifique suas credenciais.',
        data: null
      });
    }

    console.log(`🥋 [DIAGNOSTICO LOGIN] Validação da senha concluída com sucesso.`);
    console.log(`🥋 [DIAGNOSTICO LOGIN] Criação da sessão / Geração de token iniciada para usuário ID: ${user.id}`);
    
    // Atualiza controle de atividade real
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
          active: true // reactivate if logging back in
        }
      });
    } catch (activeErr) {
      console.error("🥋 Falha ao registrar lastLoginAt:", activeErr);
    }

    // Remove password before sending
    const { password: _, ...userWithoutPassword } = user;
    const isMasterAdmin = user.email === MASTER_ADMIN_EMAIL;
    if (isMasterAdmin) {
      (userWithoutPassword as any).role = 'MASTER';
      try {
        await prisma.systemLog.create({
          data: {
            userId: user.id,
            timestamp: BigInt(Date.now()),
            userEmail: user.email,
            action: 'LOGIN_MASTER',
            details: 'Sensei Master fez login no sistema de administração.',
            category: 'Auth',
            deviceInfo: req.headers['user-agent'] || 'Desconhecido',
          }
        });
      } catch (logErr) {
        console.error("🥋 Falha ao registrar log de Auditoria Master:", logErr);
      }
    }
    const token = generateToken(user);
    console.log(`🥋 [DIAGNOSTICO LOGIN] Criação da sessão concluída com sucesso.`);

    return res.status(200).json({ 
      success: true,
      message: "Login bem-sucedido.",
      user: userWithoutPassword,
      token,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error: any) {
    console.error("🥋 [DIAGNOSTICO LOGIN FAIL] Erro crítico com stack trace completo durante login:", error.stack || error.message || error);
    return res.status(500).json({
        success: false,
        message: "Erro interno do servidor.",
        error: error.message || "Erro inesperado no login",
        stack: error.stack,
        data: null
    });
  }
};
