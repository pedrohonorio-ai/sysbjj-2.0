import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma/client.js";

const SECRET = process.env.JWT_SECRET || "sysbjj-secret-2024";

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: "Email e senha obrigatorios." });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, error: "Credenciais invalidas." });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: "Credenciais invalidas." });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function registerHandler(req: Request, res: Response) {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: "Email e senha obrigatorios." });
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ success: false, error: "Email ja cadastrado." });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name: name || "" } });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "7d" });
    return res.status(201).json({ success: true, token, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  return res.json({ success: true, message: "Se o email existir, enviaremos instrucoes." });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  return res.json({ success: true, message: "Senha resetada." });
}
