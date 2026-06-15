import i18n from '../i18n/index.js';

// Priority fallback dict for mandatory keys in pt-BR
const MANDATORY_DICTIONARY: Record<string, string> = {
  // Navigation & Core Menus
  "common.dashboard": "Painel Principal",
  "dashboard": "Painel Principal",
  "dashboard.title": "Painel Principal",
  
  "common.students": "Alunos",
  "students": "Alunos",
  "dashboard.students": "Alunos",
  
  "common.teaching-hub": "Dojo de Ensino",
  "teaching-hub": "Dojo de Ensino",
  
  "common.performance": "Performance e Evolução",
  "performance": "Performance e Evolução",
  "dashboard.analytics": "Análises",
  
  "common.business": "Comercial & Financeiro",
  "business": "Comercial & Financeiro",
  
  "common.attendance": "Presença & Chamada",
  "attendance": "Presença & Chamada",
  "dashboard.attendance": "Presença",
  
  "common.finances": "Atividades Financeiras",
  "finances": "Atividades Financeiras",
  "dashboard.financial": "Financeiro",
  
  "common.history": "Registros Históricos",
  "history": "Registros Históricos",
  
  "common.promotions": "Graduação e Faixas",
  "promotions": "Graduação e Faixas",
  
  "common.plans": "Assinatura e Planos",
  "plans": "Assinatura e Planos",
  "dashboard.plans": "Planos",
  "plans.socialProject": "Projeto Social",
  "plans.requestGrant": "Solicitar Gratuidade",
  "plans.nonprofit": "Instituição sem fins lucrativos",
  
  "common.ibjjf-rules": "Regras Oficiais IBJJF",
  "ibjjf-rules": "Regras Oficiais IBJJF",
  
  "common.timer": "Cronômetro de Luta",
  "timer": "Cronômetro de Luta",
  
  "common.audit": "Governança & Auditoria",
  "audit": "Governança & Auditoria",
  
  "common.settings": "Configurações",
  "settings": "Configurações",
  "settings.system": "Sistema",
  "settings.language": "Idioma",
  "settings.theme": "Tema",
  
  "common.reports": "Relatórios",
  "reports": "Relatórios",
  "dashboard.reports": "Relatórios",
  
  "common.logs": "Registros",
  "logs": "Registros",
  "common.presence": "Presença",
  "presence": "Presença",
  "common.analytics": "Análises",
  "analytics": "Análises",

  "dashboard.recentActivities": "Atividades Recentes",
  "dashboard.syncStatus": "Status de Sincronização",
  "dashboard.totalStudents": "Total de Alunos",
  "subscription.current": "Plano Atual",
  "subscription.currentPlan": "Plano Atual",
  "subscription.upgrade": "Atualizar Plano",
  "subscription.active": "Ativo",
  "subscription.inactive": "Inativo",
  "system.protected": "Sistema Protegido",
  "system.online": "Sistema Online",
  "system.sync": "Sincronização Ativa",
  "system.securityNodeActive": "Sistema Protegido",
  "system.automaticSyncEnabled": "Sincronização Ativa",
  "system.hashAutomaticSyncEnabled": "Sincronização Ativa",
  "common.training": "Treinamento & Aulas",
  "common.tools": "Gestão e Ferramentas",
  "common.options": "Ajustes & Configurações",
  "common.logout": "Sair / Encerrar Sessão",
  "common.shieldedIntegrity": "Segurança Blindada",
  "settings.languageSelection": "Seleção de Idioma",
  "settings.languageUpdateNote": "O sistema está configurado de forma inteligente em Português do Brasil para conformidade operacional e de acordo com as diretrizes do Sensei SYSBJJ 2.0.",

  // Form fields & Common labels
  "common.civilStatus": "Estado Civil",
  "common.birthDate": "Data de Nascimento",
  "common.gender": "Gênero",
  "common.single": "Solteiro(a)",
  "common.married": "Casado(a)",
  "common.divorced": "Divorciado(a)",
  "common.widowed": "Viúvo(a)",
  "common.stableUnion": "União Estável",
  "common.occupation": "Profissão",
  "common.nationality": "Nacionalidade",
  "common.address": "Endereço",
  "common.city": "Cidade",
  "common.state": "Estado",
  "common.zipCode": "CEP",
  "common.phone": "Telefone de Contato",
  "common.email": "E-mail de Cadastro",
  "common.rg": "Documento de RG",
  "common.rgIssuer": "Órgão Emissor",
  "common.cpf": "CPF do Aluno",
  "students.status": "Status Operacional",
  "common.waitlist": "Lista de Espera",
  "common.yes": "Sim",
  "common.no": "Não",
  "common.type": "Tipo de Perfil",
  "common.instructor": "Professor Responsável",
  "common.kid": "Kids (Infantil)",
  "students.isCompetitor": "Atleta de Competição",
  "common.responsiblePerson": "Nome do Responsável Legal",
  "common.responsibleCpf": "CPF do Responsável",
  "common.responsibleEmail": "E-mail do Responsável",
  "common.responsiblePhone": "Telefone do Responsável",
  "common.lgpdConsent": "Aceite da LGPD (Segurança de Dados)",
  "common.lgpdConsentDesc": "Autorizo o armazenamento de dados de frequência e histórico de graduações sob as normas de segurança do sistema.",
  "common.documentsSection": "Anexos e Documentos",
  "common.addDocument": "Adicionar Novo Documento",
  "common.noDocuments": "Nenhum documento salvo para este aluno.",
  "common.emergencyContact": "Contato de Emergência",
  "common.emergencyPhone": "Telefone de Emergência",
  "common.bloodType": "Tipo Sanguíneo",
  "common.select": "Selecione uma opção",
  "common.medicalConditions": "Condições Médicas / Restrições",
  "common.medicalPlaceholder": "Ex: Hipertensão, asma, lesão crônica no joelho...",
  "common.cancel": "Voltar / Cancelar",
  "students.enrollBtn": "Matricular Guerreiro",

  // Tab views
  "students.overviewTab": "Visão Geral",
  "common.healthInfo": "Saúde & Restrições",
  "common.techAnalysisTab": "Ficha do Atleta",
  "common.evolutionTab": "Histórico Técnico",
  "students.financialTab": "Acesso e Anexos",
  "common.edit": "Editar Ficha",
  "common.integrityBadgeTab": "Segurança",
  "common.videos": "Vídeos de Estudo",
  "common.contract": "Termo Jurídico",
  "students.adminTab": "Controle Interno",
  "students.personalTab": "Dados Pessoais",
  "common.legalInfo": "Ficha Jurídica (LGPD)",
  "students.technicalTab": "Dados Técnicos",
  "common.uploadPhoto": "Enviar Foto",
  "common.useCamera": "Tirar Foto",
  "common.gallery": "Galeria",
  "common.name": "Nome Completo",
  "common.nickname": "Apelido no Tatame",
  "students.currentBelt": "Faixa Atual",
  "students.stripesCount": "Graus na Faixa",
  "students.lastPromotion": "Última Graduação",
  "common.class": "Turma / Horário",
  "common.noFixedClass": "Sem Turma Fixa",
  "students.technicalNotes": "Anotações Clínicas & Técnicas",
  "students.deleteConfirm": "Confirmar exclusão?",
  "students.deleteBtn": "Apagar Aluno Definitivamente",
  "common.professionalPerformance": "Rendimento Profissional",
  "common.maturity": "Maturidade de Faixa",
  "common.focusLevel": "Nível de Foco",
  "common.elite": "Elite do Tatame",
  "common.frequent": "Atleta Frequente",
  "analysis.proPotential": "Potencial Competitivo",
  "common.standard": "Membro Praticante",
  "common.personalInfo": "Informações Pessoais",
  "common.startDate": "Início das Atividades",
  "common.notRegistered": "Não registrado no sistema",
  "students.monthlyPlan": "Plano de Mensalidade",
  "financial.dueDay": "Dia de Vencimento",
  "students.attendanceMetrics": "Dados de Frequência",
  "students.totalClasses": "Treinos Totais",
  "students.streak": "Frequência Consecutiva",
  "portal.rulesAcademy": "Código de Ética do Dojo",
  "common.masteryLevel": "Índice de Mestria Técnica",
  "common.lifetimePoints": "XP Histórico Acumulado",
  "common.of": "de",
  "common.modulesCompleted": "Módulos Concluídos",
  "common.notInformed": "Não informado",
  "common.noMedicalCondition": "Nenhuma limitação relatada pelo aluno.",
  "medical.docsTitle": "Controle de Exames Médicos",
  "medical.waiverTitle": "Termo de Responsabilidade Técnica",
  "medical.accepted": "Assinado",
  "medical.notAccepted": "Pendente",
  "medical.acceptedOn": "Assinado digitalmente em",
  "medical.certificate": "Atestado Médico de Aptidão Física",
  "medical.missing": "Não Enviado",
  "medical.expired": "Vencido / Expirado",
  "medical.valid": "Válido e Regular",
  "medical.expiresOn": "Válido até",
  "common.view": "Visualizar",
  "common.signatureDate": "Data da Assinatura",
  "common.signed": "Assinado",
  "common.notSigned": "Pendente de Assinatura",
  "blockchain.certified": "Validado via Blockchain",
  "common.profession": "Profissão",
  "common.legalTab": "Dados Jurídicos",
  "common.years": "Anos",
  "common.year": "Ano",
  "common.age": "Idade",
  "common.category": "Categoria",
  "common.generate": "Gerar",
  "common.report": "Relatório",
  "common.profile": "Perfil",
  "common.technical": "Ficha Técnica",
  "common.evolution": "Evolução",
  "common.forecast": "Previsão",
  "common.guard": "Guarda",
  "common.passing": "Passagem",
  "common.submission": "Finalização",
  "common.takedowns": "Quedas & Projeções",
  "common.takedown": "Queda / Projeção",
  "common.master": "Sensei Master",
  "common.active": "Ativo",
  "common.next": "PRÓXIMO",
  "common.loading": "Carregando...",
  "common.search": "Pesquisar",
  "common.student": "Aluno",
  "common.export": "Exportar",
  "common.import": "Importar",
  "common.save": "Salvar",
  "common.delete": "Excluir",
  "common.editAction": "Editar",
  "common.create": "Criar",
  "common.update": "Atualizar",
  "common.success": "Sucesso",
  "common.error": "Erro",
  "common.warning": "Aviso",

  // Belts mapping definitions for absolute compliance
  "belts.White": "Branca",
  "belts.Blue": "Azul",
  "belts.Purple": "Roxa",
  "belts.Brown": "Marrom",
  "belts.Black": "Preta",
  "belts.Red-Black": "Coral Vermelha e Preta",
  "belts.Red-White": "Coral Vermelha e Branca",
  "belts.Red": "Vermelha",
  "belts.White-Gray": "Cinza e Branca",
  "belts.Gray": "Cinza",
  "belts.Gray-Black": "Cinza e Preta",
  "belts.White-Yellow": "Amarela e Branca",
  "belts.Yellow": "Amarela",
  "belts.Black-Yellow": "Amarela e Preta",
  "belts.White-Orange": "Laranja e Branca",
  "belts.Orange": "Laranja",
  "belts.Black-Orange": "Laranja e Preta",
  "belts.White-Green": "Verde e Branca",
  "belts.Green": "Verde",
  "belts.Black-Green": "Verde e Preta",

  "common.belts.White": "Branca",
  "common.belts.Blue": "Azul",
  "common.belts.Purple": "Roxa",
  "common.belts.Brown": "Marrom",
  "common.belts.Black": "Preta",
  "common.belts.Red-Black": "Coral Vermelha e Preta",
  "common.belts.Red-White": "Coral Vermelha e Branca",
  "common.belts.Red": "Vermelha",
  "common.belts.White-Gray": "Cinza e Branca",
  "common.belts.Gray": "Cinza",
  "common.belts.Gray-Black": "Cinza e Preta",
  "common.belts.White-Yellow": "Amarela e Branca",
  "common.belts.Yellow": "Amarela",
  "common.belts.Black-Yellow": "Amarela e Preta",
  "common.belts.White-Orange": "Laranja e Branca",
  "common.belts.Orange": "Laranja",
  "common.belts.Black-Orange": "Laranja e Preta",
  "common.belts.White-Green": "Verde e Branca",
  "common.belts.Green": "Verde",
  "common.belts.Black-Green": "Verde e Preta",

  "status.Waitlist": "Lista de Espera",
  "students.statusWaitlist": "Fila de Espera",
  "common.waitlistRank": "Posição na Fila",
  "waitlist": "Lista de Espera",
  "attendance.attendance": "Frequência",
  "common.granted": "Concedido",
  "granted": "Concedido",
  "analysis.technicalArchetype": "Arquétipo Técnico",
  "analysis.proAthlete": "Competidor / Atleta",
  "analysis.standardPractitioner": "Praticante Padrão",
  "audit.technicalIndex": "Índice Técnico",
  "technicalIndex": "Índice Técnico",
  "common.feedbackPlaceholder": "Digite observações técnicas gerais ou feedbacks do tatame...",
  "feedbackPlaceholder": "Digite observações técnicas gerais ou feedbacks do tatame...",
  
  // 🥋 Portal do Aluno Translations
  "portal.blockchainTitle": "Autenticidade Criptográfica",
  "portal.blockchainDesc": "Sua graduação e histórico são selados de forma descentralizada.",
  "portal.viewOnChain": "Verificar no Ledger",
  "portal.combatCore": "Núcleo de Combate",
  "portal.trainingRadar": "Radar de Competências",
  "portal.tacticalIntelligence": "Inteligência Tática",
  "portal.consistencyHeatmap": "Consistência de Presença",
  "portal.attendanceTitle": "Minha Frequência",
  "portal.student": "Aluno",
  "portal.studentPortal": "Portal do Aluno",
  "portal.navHome": "Portal",
  "portal.navTraining": "Treinos",
  "portal.navHomeTraining": "Home Treino",
  "portal.navKnowledge": "Dojo",
  "portal.navCommunity": "Social",
  "portal.navWallet": "Financeiro",
  "portal.navGallery": "Memórias",
  "portal.navTimer": "Cronômetro",
  "portal.navRules": "Regulamento",
  "portal.officialRegulation": "Regulamento Oficial",
  "portal.ibjjfClassification": "Classificação IBJJF/CBJJ",
  "portal.attendanceSystem": "Sistema de Presença",
  "portal.multiModes": "Multi-Modos",
  "portal.dailyCheckin": "Check-in Diário",
  "portal.rulesKnowledge": "Domínio das Regras",
  "portal.trainingCategory": "Categoria de Treino",
  "portal.noActivity": "Sem atividade registrada.",
  "portal.noDataHeatmap": "Treine para gerar dados de consistência.",
  "portal.biomechanics": "Biomecânica",
  "portal.defense": "Defesa de Passagem",
  "portal.offense": "Ataques de Guarda",
  "portal.physicalCondition": "Condicionamento Físico",
  "portal.technicalGrade": "Precisão Técnica",
  "portal.schoolAverage": "Média do Dojo"
};

// Technical terminology replacement map
const technicalReplacements: Record<string, string> = {
  "Security_Node_Active": "Sistema Protegido",
  "Security Node Active": "Sistema Protegido",
  "securityNodeActive": "Sistema Protegido",
  "Hash_SHA": "Sincronização Ativa",
  "Hash SHA": "Sincronização Ativa",
  "Automatic_Sync_Enabled": "Sincronização Ativa",
  "Automatic Sync Enabled": "Sincronização Ativa",
  "automaticSyncEnabled": "Sincronização Ativa",
  "system.boot": "Sistema Operacional",
  "system boot": "Sistema Operacional",
  "render.chunk": "Atualização Concluída",
  "render chunk": "Atualização Concluída",
  "vite": "Central do Sistema",
  "hmr": "Central do Sistema",
  "debug": "Central do Sistema",
  "websocket": "Sincronização Ativa",
  "fallback": "Painel Administrativo",
  "api.batch": "Central do Sistema",
  "api batch": "Central do Sistema",
  "loading chunk": "Atualização Concluída",
  "loadingChunk": "Atualização Concluída",
  "hydration": "Central do Sistema",
  "build successful": "Atualização Concluída",
  "buildSuccessful": "Atualização Concluída",
  "terminal": "Central do Sistema",
  "runtime": "Central do Sistema",
  "internal error": "Central do Sistema",
  "internalError": "Central do Sistema"
};

/**
 * 🥋 SYSBJJ 2.0 - DYNAMIC KEY NORMALIZATION
 * Normalizes camelCase, snake_case, and dot.notation keys into clean, readable labels.
 */
export function normalizeLabel(text: string): string {
  // If the text contains known technical phrases, swap them
  for (const [tech, clean] of Object.entries(technicalReplacements)) {
    if (text.toLowerCase().includes(tech.toLowerCase())) {
      return clean;
    }
  }

  // Check mandatory dictionary first
  if (MANDATORY_DICTIONARY[text]) {
    return MANDATORY_DICTIONARY[text];
  }

  let formatted = String(text)
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/([A-Z])/g, " $1")
    .trim();

  // Remove duplicate spaces and capitalize first letter
  formatted = formatted.replace(/\s+/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Clean any output text from technical leakage
 */
export function sanitizeText(text: string): string {
  let result = text;
  for (const [tech, clean] of Object.entries(technicalReplacements)) {
    // Case-insensitive match replacement
    const regex = new RegExp(tech, 'gi');
    result = result.replace(regex, clean);
  }
  return result;
}

/**
 * 🥋 SYSBJJ 2.0 - SAFE TRANSLATION HELPER
 * Prevents internal keys, camelCase, or snake_case technical IDs from leaking to the UI.
 * Provides a seamless fallback chain for premium UX.
 */
export function tSafe(key: string, fallback?: string): string {
  const currentLang = i18n.language || 'pt-BR';
  
  // NUNCA usar undefined, null ou empty key
  if (!key) {
    return "OS SENSEI!";
  }

  // Priority fallback dict for pt-BR
  if (currentLang.startsWith('pt') && MANDATORY_DICTIONARY[key]) {
    return MANDATORY_DICTIONARY[key];
  }

  let value = i18n.t(key);
  const keyLastPart = key.split('.').pop() || '';

  // 1. If key is missing or is falling back to English because it's only nested under "common." in locales
  if (!value || value === key || value === keyLastPart) {
    if (!key.startsWith("common.")) {
      const commonVal = i18n.t("common." + key);
      if (commonVal && commonVal !== "common." + key && commonVal !== keyLastPart) {
        value = commonVal;
      }
    }
  }

  // 2. If key is still missing (i18n returns the key name itself or is empty)
  if (!value || value === key) {
    if (fallback && fallback !== key) {
      return sanitizeText(fallback);
    }
    if (MANDATORY_DICTIONARY[key]) {
      return MANDATORY_DICTIONARY[key];
    }
    return normalizeLabel(key);
  }
  
  // 3. If retrieved value is suspicious (contains underscore, dot, or camelCase without space)
  const isInternalKey = 
    value.includes('_') || 
    (value.includes('.') && !value.includes(' ')) || 
    (/^[a-z]+[A-Z]/.test(value) && !value.includes(' '));
    
  if (isInternalKey) {
    if (fallback && fallback !== key) {
      return sanitizeText(fallback);
    }
    if (MANDATORY_DICTIONARY[key]) {
      return MANDATORY_DICTIONARY[key];
    }
    return normalizeLabel(key);
  }
  
  return sanitizeText(value);
}
