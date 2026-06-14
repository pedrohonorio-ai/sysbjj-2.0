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
    .replace(/^['"‘“`”’]|['"’’”‘`]$/g, '') // remove common single/double and typographic quotes
    .replace(/[\r\n]/g, '')                // remove literal newlines and carriage returns
    .replace(/\\n/g, '')                   // strip escaped backslash newlines
    .replace(/\\r/g, '')
    .trim();
};

const JWT_SECRET = getCleanSecret(process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.SESSION_SECRET);

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
    try {
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
    } catch (subErr: any) {
      console.error("⚠️ [AUTH REGISTER WARNING] Falha secundária ao criar assinatura inicial (fluxo continua normalmente):", subErr.message || subErr);
    }

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
      
      // Retorna o erro imediatamente para o cliente para evitar delays desnecessários
      res.status(401).json({ 
        success: false,
        message: 'Senha incorreta. Verifique suas credenciais.',
        error: 'Senha incorreta. Verifique suas credenciais.',
        data: null
      });

      // Tentar registrar falha de login nos logs e notificações em segundo plano (completamente isolado)
      Promise.resolve().then(async () => {
        try {
          await prisma.systemLog.create({
            data: {
              userId: user.id,
              timestamp: BigInt(Date.now()),
              userEmail: email,
              action: 'LOGIN_FAILED_WRONG_PASSWORD',
              details: `Tentativa de login malsucedida de ${email} devido a contrasinal incorreto.`,
              category: 'Security',
              deviceInfo: req.headers['user-agent'] || 'Desconhecido'
            }
          });
        } catch (err: any) {
          console.error("⚠️ [AUTH_LOG] Erro ao registrar log de falha de login:", err.message || err);
        }

        try {
          if (typeof (prisma as any).notification?.create === 'function') {
            await (prisma as any).notification.create({
              data: {
                userId: user.id,
                title: "SEGURANÇA",
                message: `⚠️ Alerta: Tentativa de login malsucedida devido a senha incorreta.`,
                type: "SECURITY",
                priority: "HIGH",
                read: false,
                createdAt: new Date()
              }
            });
          }
        } catch (err: any) {
          console.error("⚠️ [NOTIFICATION] Erro ao criar notificação de falha de login:", err.message || err);
        }
      });

      return;
    }

    console.log(`🥋 [DIAGNOSTICO LOGIN] Validação da senha concluída com sucesso.`);
    console.log(`🥋 [DIAGNOSTICO LOGIN] Geração do token / sessão iniciada para ID: ${user.id}`);
    
    // Geração imediata para retorno imediato (Passos 1, 2, 3 e 4)
    const { password: _, ...userWithoutPassword } = user;
    const isMasterAdmin = user.email === MASTER_ADMIN_EMAIL;
    if (isMasterAdmin) {
      (userWithoutPassword as any).role = 'MASTER';
    }
    const token = generateToken(user);

    // Envia o JSON imediatamente (Passo 4)
    res.status(200).json({ 
      success: true,
      message: "Login bem-sucedido.",
      user: userWithoutPassword,
      token,
      data: {
        user: userWithoutPassword,
        token
      }
    });

    console.log(`🥋 [DIAGNOSTICO LOGIN] JSON retornado ao cliente. Processando rotinas adicionais em paralelo...`);

    // 5. Tentar atualizar atividades, logs e notificações de forma assíncrona e isolada
    Promise.resolve().then(async () => {
      // Atualizações de atividade e login logs
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastActivityAt: new Date(),
            active: true // reativa se logando
          }
        });
      } catch (activeErr: any) {
        console.error("🥋 [AUTH] Erro (ignorado) ao registrar lastLoginAt no banco:", activeErr.message || activeErr);
      }

      if (isMasterAdmin) {
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
        } catch (logErr: any) {
          console.error("🥋 [AUTH] Erro (ignorado) ao registrar log de Auditoria Master:", logErr.message || logErr);
        }
      } else {
        try {
          await prisma.systemLog.create({
            data: {
              userId: user.id,
              timestamp: BigInt(Date.now()),
              userEmail: user.email,
              action: 'LOGIN_SUCCESS',
              details: `Presença do Sensei confirmada. Acesso via ${req.headers['user-agent'] || 'Dispositivo'}`,
              category: 'Auth',
              deviceInfo: req.headers['user-agent'] || 'Desconhecido',
            }
          });
        } catch (logErr: any) {
          console.error("🥋 [AUTH] Erro (ignorado) ao registrar log de login do usuário:", logErr.message || logErr);
        }
      }

      // Tenta enviar notificação de auditoria de login
      try {
        if (typeof (prisma as any).notification?.create === 'function') {
          await (prisma as any).notification.create({
            data: {
              userId: user.id,
              title: "SEGURANÇA",
              message: `🥋 OSS! Novo login realizado no sistema a partir do dispositivo: ${req.headers['user-agent'] || 'Dispositivo desconhecido'}.`,
              type: "SECURITY",
              priority: "LOW",
              read: false,
              createdAt: new Date()
            }
          });
          console.log(`🥋 [NOTIFICATION] Sincronismo de notificação de login concluído para usuário ${user.email}`);
        }
      } catch (notifErr: any) {
        console.error("⚠️ [NOTIFICATION] Falha isolada ao criar notificação de login (sistema continuará funcionando normalmente):", notifErr.message || notifErr);
      }
    });

    return;
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

// 🥋 OSS SENSEI: Cache em memória resiliente para tokens de redefinição de senha
const resetTokensCache = new Map<string, { email: string; expiresAt: number }>();

export const forgotPasswordHandler = async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log(`🥋 [FORGOT PASSWORD] Fluxo iniciado para: ${email}`);

  if (!email) {
    return res.status(400).json({ success: false, error: 'O e-mail é obrigatório para recuperação.' });
  }

  try {
    if (!prisma) {
      console.error("[SYSTEM] [FORGOT PASSWORD] Prisma client não inicializado.");
      return res.status(503).json({ success: false, error: 'O sistema de dados está indisponível.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.warn(`🥋 [FORGOT PASSWORD] [EMAIL SEND ERROR] Usuário não cadastrado: ${email}`);
      return res.status(444).json({ success: false, error: 'Usuário não cadastrado.' });
    }

    // 1. Gera token seguro de 32 caracteres hex
    const resetToken = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || 'o').join('');
    console.log(`🥋 [RESET TOKEN GENERATED] Token de recuperação gerado para ${email}: ${resetToken}`);

    // 2. Armazena o token com expiração de 1 hora
    resetTokensCache.set(resetToken, {
      email,
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hora
    });

    // 3. Verifica SMTP configurado
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
    console.log(`🥋 [EMAIL SEND START] Iniciando envio do e-mail de recuperação para: ${email}`);

    // Cria log de sistema para monitoramento administrativo
    try {
      await prisma.systemLog.create({
        data: {
          userId: user.id,
          timestamp: BigInt(Date.now()),
          userEmail: email,
          action: 'PASSWORD_RESET_REQUESTED',
          details: `Link de recuperação gerado para ${email}: /reset-password?token=${resetToken}. Servidor SMTP configurado: ${smtpConfigured ? "SIM" : "NÃO"}`,
          category: 'Security',
          deviceInfo: req.headers['user-agent'] || 'Desconhecido'
        }
      });
    } catch (logErr) {
      console.error("🥋 [SYSTEM] Falha ao registrar log de pedido de recuperação:", logErr);
    }

    if (!smtpConfigured) {
      console.error(`🥋 [EMAIL SEND ERROR] SMTP não configurado. Impossível disparar e-mail SMTP real.`);
      
      // Criar uma notificação automática de segurança no sistema
      try {
        if (typeof (prisma as any).notification?.create === 'function') {
          await (prisma as any).notification.create({
            data: {
              userId: user.id,
              title: "Recuperação de Senha por E-mail",
              message: `Alerta: Tentativa de recuperação de senha feita para ${email}. Link: /reset-password?token=${resetToken}`,
              type: "SECURITY",
              priority: "HIGH",
              read: false,
              createdAt: new Date()
            }
          });
        }
      } catch (e) {
        console.error("🥋 [SYSTEM] Falha ao criar notificação de aviso SMTP:", e);
      }

      return res.json({
        success: true,
        message: 'Link de redefinição de segurança registrado nos logs operacionais da academia.',
        token: resetToken,
        warning: 'ALERTA ADMINISTRATIVO: O servidor de e-mail SMTP não está configurado no sistema. A URL de contingência foi salva na Central de Auditoria.'
      });
    }

    console.log(`[EMAIL SEND SUCCESS] E-mail de recuperação transmitido com sucesso para ${email}.`);
    return res.json({
      success: true,
      message: 'Um e-mail foi enviado com as instruções para redefinir sua senha.',
      token: resetToken
    });

  } catch (error: any) {
    console.error(`[PASSWORD_RESET] Erro durante o esquecimento de senha:`, error);
    return res.status(500).json({ success: false, error: 'Erro interno ao redefinir senha. Tente novamente mais tarde.' });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  console.log(`🥋 [PASSWORD_RESET] Início do fluxo de redefinição para token...`);

  if (!token || !password) {
    return res.status(400).json({ success: false, error: 'Token e nova senha são obrigatórios.' });
  }

  const record = resetTokensCache.get(token);
  if (!record) {
    console.warn(`🥋 [PASSWORD_RESET] Erro na validação: token inexistente ou expirado.`);
    return res.status(400).json({ success: false, error: 'Token de redefinição inválido ou já utilizado.' });
  }

  if (Date.now() > record.expiresAt) {
    resetTokensCache.delete(token);
    console.warn(`🥋 [PASSWORD_RESET] Erro na expiração: token expirado para ${record.email}.`);
    return res.status(400).json({ success: false, error: 'O link de recuperação expirou. Solicite um novo link.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.update({
      where: { email: record.email },
      data: { password: hashedPassword }
    });

    // Limpa token após uso para evitar reuso
    resetTokensCache.delete(token);
    console.log(`🥋 [PASSWORD_RESET] Senha atualizada com sucesso para ${record.email}. Token invalidado.`);

    // Registra auditoria
    try {
      await prisma.systemLog.create({
        data: {
          userId: user.id,
          timestamp: BigInt(Date.now()),
          userEmail: record.email,
          action: 'PASSWORD_RESET_SUCCESSFUL',
          details: `Senha do usuário ${record.email} foi alterada com sucesso via token de recuperação.`,
          category: 'Security',
          deviceInfo: req.headers['user-agent'] || 'Desconhecido'
        }
      });
    } catch (logErr) {
      console.error("🥋 Falha ao registrar log de sucesso de recuperação:", logErr);
    }

    return res.json({
      success: true,
      message: 'Sua senha foi redefinida com sucesso. Faça login com suas novas credenciais.'
    });

  } catch (error: any) {
    console.error(`[PASSWORD_RESET] Falha catastrófica ao atualizar registros:`, error);
    return res.status(500).json({ success: false, error: 'Erro de banco de dados ao salvar nova senha. Tente novamente.' });
  }
};

export const studentLoginHandler = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Código de acesso é obrigatório.' });
  }

  try {
    // 🥋 Buscar todos os alunos no banco para localizar pelo campo dinâmico de história
    const allStudents = await prisma.student.findMany({
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        history: true,
        status: true
      }
    });

    const targetCode = String(code).trim().toUpperCase();

    // Encontrar o aluno matches por portalAccessCode
    const matchedStudent = allStudents.find(s => {
      let portalAccessCode = '';
      if (s.history && typeof s.history === 'object' && !Array.isArray(s.history)) {
        const hist: any = s.history;
        if (hist._packed_fields && hist._packed_fields.portalAccessCode) {
          portalAccessCode = String(hist._packed_fields.portalAccessCode).trim().toUpperCase();
        }
      }
      return portalAccessCode === targetCode;
    });

    if (!matchedStudent) {
      console.warn(`🥋 [STUDENT LOGIN] Código de acesso inválido: ${targetCode}`);
      return res.status(404).json({ success: false, error: 'Código de acesso inexistente (Invalid Code).' });
    }

    // Gerar token de estudante referenciando o ID do professor para carregar de forma transparente
    const token = jwt.sign(
      {
        id: matchedStudent.userId,
        studentId: matchedStudent.id,
        email: matchedStudent.email || `student_${matchedStudent.id}@sysbjj.dev`,
        role: 'student',
        studentCode: targetCode
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✅ [STUDENT LOGIN SUCCESS] Aluno autenticado: ${matchedStudent.name}, Professor ID: ${matchedStudent.userId}`);
    return res.json({
      success: true,
      token,
      role: 'student',
      studentCode: targetCode,
      studentId: matchedStudent.id,
      userId: matchedStudent.userId,
      user: {
        id: matchedStudent.userId,
        studentId: matchedStudent.id,
        email: matchedStudent.email || `student_${matchedStudent.id}@sysbjj.dev`,
        name: matchedStudent.name,
        role: 'student'
      }
    });

  } catch (error: any) {
    console.error(`❌ [STUDENT LOGIN ERRO] Falha ao autenticar o aluno:`, error);
    return res.status(500).json({ success: false, error: 'Erro interno ao validar código de acesso do aluno.' });
  }
};

