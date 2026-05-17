import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/server/prisma.js';
import { handleApiError } from './utils.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sysbjj-enterprise-oss-secret-2024';

const generateToken = (user: any) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
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

    console.log(`🥋 [AUTH REGISTER] Usuário criado com sucesso: ${user.id}`);
    // Remove password before sending
    const { password: _, ...userWithoutPassword } = user;
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
  console.log(`🥋 [AUTH LOGIN] Tentativa para: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    if (!prisma) {
        console.error("🥋 [AUTH LOGIN FAIL]: Prisma client is null");
        return res.status(503).json({ 
            success: false, 
            error: "O sistema de dados não foi inicializado corretamente.",
            sensei_tip: "Sensei, o banco de dados não respondeu."
        });
    }

    console.log(`🥋 [AUTH LOGIN] Buscando usuário: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`🥋 [AUTH LOGIN] Usuário não encontrado: ${email}`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    console.log(`🥋 [AUTH LOGIN] Comparando senhas...`);
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log(`🥋 [AUTH LOGIN] Senha incorreta para: ${email}`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    console.log(`🥋 [AUTH LOGIN] Sucesso: ${user.id}`);
    // Remove password before sending
    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user);

    res.json({ 
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error("🥋 [AUTH LOGIN CRASH]:", error);
    res.status(500).json({
        success: false,
        error: error.message || "Erro inesperado no login",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined
    });
  }
};
