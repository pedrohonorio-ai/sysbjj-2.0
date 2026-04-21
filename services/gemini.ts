
import { GoogleGenAI, Type } from "@google/genai";
import { Student, Payment, ClassSchedule } from "../types";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    let apiKey = process.env.GEMINI_API_KEY;
    
    // Hard check for common missing/invalid values
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.trim() === '') {
      console.warn("GEMINI_API_KEY is not defined or invalid. AI features will be disabled.");
      return null;
    }
    
    try {
      genAI = new GoogleGenAI({ apiKey: apiKey.trim() });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      return null;
    }
  }
  return genAI;
};

const SYSTEM_INSTRUCTION = `Você é o "PPH BJJ Master Sensei & Business Consultant", a autoridade máxima do ecossistema PPH BJJ.
Sua persona une a maestria técnica de um faixa preta 6º grau (ou superior) com a visão estratégica de um empreendedor bilionário no setor fitness e marcial.

OBJETIVO:
Auxiliar professores de Jiu-Jitsu a evoluírem em duas frentes:
1. Excelência Técnica e Pedagógica.
2. Sucesso Empreendedor e Gestão de Academia.

PILAR 1: MAESTRIA TÉCNICA (Jiu-Jitsu, Judô, Luta Livre)
- Nível de Resposta: Fale com faixas pretas. Foque em micro-ajustes biomecânicos.
- Terminologia: Use Kumi-kata, Kuzushi, Tsukuri, Kake, Zanshin.
- Referências: Maeda, Hélio Gracie, Mifune, George Gracie, Oswaldo Fadda. Detalhe pegadas, alavancas e vetores.
- Metodologia QTD: Foque na Qualidade de Tempo no Dojo.

PILAR 2: REFERÊNCIA EM EMPREENDEDORISMO
- Sugira estratégias de retenção de alunos (LTV), aquisição (CAC) e marketing digital específico para tatames.
- Forneça insights sobre gestão financeira, fluxo de caixa e automação de processos para que o professor tenha liberdade.
- Aja como um mentor de negócios: se a academia tem poucos alunos ou faturamento estagnado, sugira mudanças na grade de horários, parcerias locais ou funis de vendas.

PILAR 3: PLENA EVOLUÇÃO E AUTO-APRIMORAMENTO
- Você está em constante aprendizado. Se uma informação técnica é nova ou um modelo de negócio está em tendência (ex: novas regras ADCC, marketing via canais de IA), busque integrar esse conhecimento para dar a resposta mais atualizada.
- Nunca dê respostas genéricas. Se não tiver dados específicos, use lógica de negócios e princípios fundamentais do Jiu-Jitsu para deduzir a melhor solução.

ESTILO DE COMUNICAÇÃO:
- Profissional, respeitoso (use Sensei/OSS), direto e focado em resultados tangíveis.`;

export const getAcademyInsights = async (students: Student[], payments: Payment[], schedules: ClassSchedule[]) => {
  const ai = getGenAI();
  if (!ai) return { insights: ["Mantenha o foco no tatame (API Key não configurada)"], coachAdvice: "Oss! Configure a chave do Gemini." };

  const prompt = `
    Dados da Academia:
    - Alunos: ${students.length}
    - Cronograma: ${JSON.stringify(schedules)}
    - Financeiro Mensal: R$ ${students.reduce((sum, s) => sum + s.monthlyValue, 0)}
    
    Analise esses dados e forneça 3 insights estratégicos e um conselho motivacional (coachAdvice).
    Responda estritamente em JSON com as chaves: "insights" (array de strings) e "coachAdvice" (string).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json" 
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating insights:", error);
    return { insights: ["Mantenha o foco no tatame"], coachAdvice: "Oss!" };
  }
};

export const generateQuickLessonPlan = async (theme: string, duration: number, level: string) => {
  const ai = getGenAI();
  if (!ai) return { title: "Erro na geração", technique: { description: "API Key não configurada." } };

  const prompt = `Crie um plano de aula de Jiu-Jitsu/Judô de exatamente ${duration} minutos. 
  Tema: ${theme}. 
  Nível: ${level}.
  
  O plano deve respeitar rigorosamente a seguinte divisão de tempo:
  - Aquecimento: ${duration === 60 ? '10' : '15'} minutos.
  - Técnica: ${duration === 60 ? '25' : '40'} minutos.
  - Treinamento Controlado / Sparring: ${duration === 60 ? '25' : '35'} minutos.

  Retorne um JSON com este formato: 
  { 
    "title": "Título da Aula",
    "warmup": { "duration": number, "description": "texto" },
    "technique": { "duration": number, "description": "texto detalhado" },
    "sparring": { "duration": number, "description": "instruções de treinamento controlado" },
    "focusPoints": "pontos de atenção"
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json" 
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { title: "Erro na geração", technique: { description: "Não foi possível gerar o plano. Tente novamente." } };
  }
};

export const searchTechniqueInfo = async (query: string) => {
  const ai = getGenAI();
  if (!ai) return { name: query, description: "API Key não configurada." };

  const prompt = `Analise a técnica de Jiu-Jitsu/Judô: ${query}.
  Forneça uma explicação técnica detalhada e estruturada.
  
  Retorne estritamente um JSON com:
  {
    "name": "Nome da técnica",
    "description": "Explicação detalhada dos detalhes de pegada, quadril e finalização",
    "steps": ["passo 1", "passo 2", "passo 3"],
    "youtubeSearchQuery": "termo de busca ideal para encontrar esta técnica no youtube",
    "safetyTips": "dicas de segurança para evitar lesões"
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { 
      name: query, 
      description: "Erro ao consultar base de dados técnica.",
      steps: [],
      youtubeSearchQuery: query
    };
  }
};

export const suggestSparringPairs = async (students: Student[]) => {
  const ai = getGenAI();
  if (!ai) return { pairs: [] };

  const activeStudents = students.filter(s => s.status === 'Active');
  const prompt = `
    Baseado na lista abaixo, sugira 5 pareamentos ideais para Sparring.
    Alunos: ${JSON.stringify(activeStudents.map(s => ({ name: s.name, belt: s.belt, isKid: s.isKid })))}
    Retorne um JSON com: { "pairs": [{ "p1", "p2", "reason" }] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json" 
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { pairs: [] };
  }
};

export const analyzeDrillImage = async (base64Image: string, userPrompt: string) => {
  const ai = getGenAI();
  if (!ai) return "API Key não configurada. Oss!";

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image,
    },
  };
  const textPart = {
    text: `Analise a técnica nesta imagem. ${userPrompt || "Dê feedback sobre postura e pontos de melhoria."}`
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [imagePart, textPart as any] },
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });

    return response.text;
  } catch (error) {
    return "Não foi possível analisar a imagem no momento. Oss!";
  }
};

export const verifyPaymentProof = async (base64Image: string, expectedAmount: number, studentName: string) => {
  const ai = getGenAI();
  if (!ai) return { isValid: false, fraudAlert: "API Key não configurada.", analysis: "Falha na comunicação." };

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image,
    },
  };
  const textPart = {
    text: `Analise este comprovante de pagamento (PIX ou Transferência).
    Aluno esperado: ${studentName}
    Valor esperado: R$ ${expectedAmount.toFixed(2)}
    Data atual: ${new Date().toLocaleDateString()}
    
    Verifique:
    1. Se o valor no comprovante bate com o esperado.
    2. Se o nome do pagador ou descrição menciona o aluno.
    3. Se a data do comprovante é recente (deste mês).
    4. Sinais de adulteração (fontes diferentes, desalinhamento, cores estranhas).
    5. Se é um comprovante de agendamento (não é pagamento efetivo).
    
    Retorne um JSON estrito:
    {
      "isValid": boolean,
      "confidence": number (0-1),
      "detectedAmount": number,
      "detectedDate": "string",
      "detectedPayer": "string",
      "isScheduled": boolean,
      "fraudAlert": "string (descreva se houver suspeita de golpe)",
      "analysis": "resumo da análise técnica do comprovante"
    }`
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [imagePart, textPart as any] },
      config: { 
        systemInstruction: "Você é um especialista em auditoria financeira e detecção de fraudes bancárias.",
        responseMimeType: "application/json" 
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { isValid: false, fraudAlert: "Erro ao processar análise de IA.", analysis: "Falha na comunicação com o serviço de auditoria." };
  }
};
