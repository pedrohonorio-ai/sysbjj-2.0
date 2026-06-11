import i18n 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts);

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
  "common.warning": "Aviso"
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

  const value = i18n.t(key);
  
  // 1. If key is missing (i18n returns the key name itself or is empty)
  if (!value || value === key) {
    if (fallback && fallback !== key) {
      return sanitizeText(fallback);
    }
    if (MANDATORY_DICTIONARY[key]) {
      return MANDATORY_DICTIONARY[key];
    }
    return normalizeLabel(key);
  }
  
  // 2. If retrieved value is suspicious (contains underscore, dot, or camelCase without space)
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
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
  ;

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
  "common.warning": "Aviso"
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

  const value = i18n.t(key);
  
  // 1. If key is missing (i18n returns the key name itself or is empty)
  if (!value || value === key) {
    if (fallback && fallback !== key) {
      return sanitizeText(fallback);
    }
    if (MANDATORY_DICTIONARY[key]) {
      return MANDATORY_DICTIONARY[key];
    }
    return normalizeLabel(key);
  }
  
  // 2. If retrieved value is suspicious (contains underscore, dot, or camelCase without space)
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

