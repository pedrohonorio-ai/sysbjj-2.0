import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { handleApiError } from './utils';

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

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: 'admin'
      }
    });

    // Remove password before sending
    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user);

    res.status(201).json({ 
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    handleApiError(res, error, 'auth/register');
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Remove password before sending
    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user);

    res.json({ 
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    handleApiError(res, error, 'auth/login');
  }
};
