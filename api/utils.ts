import { Response } from 'express';

export const handleApiError = (res: Response, error: any, collection: string) => {
    const dbUrl = process.env.DATABASE_URL || "";
    const message = error.message || String(error);
    let status = 500;

    const isConnectionError = error.name === 'PrismaClientInitializationError' || 
                              error.name === 'PrismaClientConnectorError' ||
                              message.includes("Can't reach database server") ||
                              message.includes("Invalid `prisma.") ||
                              message.includes("Error validating datasource");

    if (dbUrl === "INVALID_PLACEHOLDER_ERROR" || message.includes("invalid_host")) {
      status = 503;
      res.status(status).json({
        error: "📡 DATABASE_URL INVÁLIDA: O sistema detectou um placeholder ou host incorreto.",
        details: "Vá em Settings > Secrets e insira a string de conexão real do seu Neon (ex: postgresql://...neon.tech/...).",
        operationType: "database",
        path: collection,
        troubleshooting: [
            "Certifique-se de que substituiu '[sua-senha]'.",
            "Remova aspas extras ou o prefixo DATABASE_URL= do valor colado."
        ]
      });
      return;
    }

    if (message.includes("provide a nonempty URL") || !dbUrl) {
      status = 503;
      res.status(status).json({
        error: "📡 Erro de Conexão: DATABASE_URL não encontrada!",
        details: "Vá em Settings > Secrets e adicione a variável DATABASE_URL.",
        path: collection
      });
      return;
    }

    if (isConnectionError) {
      status = 503;
      const hostMatch = message.match(/server at `([^`]+)`/);
      const host = hostMatch ? hostMatch[1].toLowerCase() : "";
      const hostInfo = host ? ` (Host detectado: ${host})` : "";
      
      let troubleshooting = [
          "Certifique-se de que a senha está correta.",
          "Verifique se o seu projeto de banco de dados não está pausado."
      ];

      if (host.includes("neon.tech")) {
          troubleshooting.push("Certifique-se de que a URL termina com '?sslmode=require'.");
          troubleshooting.push("Verifique se o Neon não está em modo de repouso (basta acessar o dashboard).");
      }

      res.status(status).json({
        error: `O Dojo Cloud (Banco de Dados) está inacessível${hostInfo}.`,
        details: "Verifique se o Host e a Senha estão corretos e se o servidor está aceitando conexões.",
        path: collection,
        troubleshooting
      });
      return;
    }

    res.status(status).json({
      error: message,
      code: error.code,
      path: collection
    });
};
