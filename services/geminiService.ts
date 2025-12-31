import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedNumbers } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simulation of a Database using LocalStorage
const DB_KEY = 'rcc_mega_virada_db_2025';

interface RegisteredTicket {
  nickname: string;
  numbers: number[];
  timestamp: number;
}

const getRegisteredTickets = (): RegisteredTicket[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getAllUsedNumbers = (): Set<number> => {
  const tickets = getRegisteredTickets();
  const used = new Set<number>();
  tickets.forEach(t => t.numbers.forEach(n => used.add(n)));
  return used;
};

const saveTicket = (nickname: string, numbers: number[]) => {
  const tickets = getRegisteredTickets();
  tickets.push({
    nickname,
    numbers,
    timestamp: Date.now()
  });
  localStorage.setItem(DB_KEY, JSON.stringify(tickets));
};

const generateUniqueRandom = (exclude: Set<number>): number => {
  let num = Math.floor(Math.random() * 1000); // 0 to 999
  // Simple collision resolution: Linear probe or random retry
  // Since 1000 is small, we can just find a free one easily
  while (exclude.has(num)) {
    num = Math.floor(Math.random() * 1000);
    // Safety break for full database (unlikely in demo)
    if (exclude.size >= 1000) return -1; 
  }
  return num;
};

export const generateLuckyNumbers = async (wish: string, nickname: string): Promise<GeneratedNumbers> => {
  try {
    // 1. Get currently used numbers from "Database"
    const usedNumbers = getAllUsedNumbers();

    // 2. Check if this user already played (Optional rule, usually strictly 1 ticket per person)
    // For this demo, we allow re-rolls but warn in console.
    
    const prompt = `
      O usuário é um policial da RCC participando da Mega da Virada.
      Nick do Policial: "${nickname}".
      Desejo/Intenção: "${wish}".
      
      Gere 3 números da sorte únicos entre 0 e 999.
      Escreva uma frase curta motivando-o, mencionando o nome dele se possível.
      Escolha uma "palavra-chave" para o ano dele.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            numbers: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "Lista de 3 números inteiros únicos entre 0 e 999.",
            },
            message: {
              type: Type.STRING,
              description: "Uma mensagem curta e inspiradora.",
            },
            theme: {
              type: Type.STRING,
              description: "Uma palavra representando a cor ou tema da energia do ano.",
            }
          },
          required: ["numbers", "message", "theme"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);

    let candidates = data.numbers || [];
    
    // Fallback if AI fails format
    if (!Array.isArray(candidates) || candidates.length < 3) {
        candidates = [
            generateUniqueRandom(usedNumbers),
            generateUniqueRandom(usedNumbers),
            generateUniqueRandom(usedNumbers)
        ];
    }

    // 3. ENFORCE UNIQUENESS (The "Logic Check")
    const finalNumbers: number[] = [];
    
    for (let num of candidates) {
        // Force number to be integer 0-999
        let cleanNum = Math.abs(Math.floor(Number(num))) % 1000;

        // Check against Global DB (usedNumbers) AND Local Duplicates (finalNumbers)
        if (usedNumbers.has(cleanNum) || finalNumbers.includes(cleanNum)) {
            // Collision detected! Find a replacement.
            const replacement = generateUniqueRandom(new Set([...usedNumbers, ...finalNumbers]));
            if (replacement !== -1) {
                finalNumbers.push(replacement);
            }
        } else {
            finalNumbers.push(cleanNum);
        }
    }

    // Ensure we have exactly 3
    while (finalNumbers.length < 3) {
        const replacement = generateUniqueRandom(new Set([...usedNumbers, ...finalNumbers]));
        finalNumbers.push(replacement);
    }

    // Sort for display
    finalNumbers.sort((a, b) => a - b);

    // 4. Save to "Database"
    saveTicket(nickname, finalNumbers);

    return {
      numbers: finalNumbers,
      message: data.message || `Boa sorte, ${nickname}! O universo conspira a seu favor.`,
      theme: data.theme || "Prosperidade"
    };

  } catch (error) {
    console.error("Erro ao gerar números:", error);
    
    // Fallback in case of API error, still ensuring uniqueness locally
    const usedNumbers = getAllUsedNumbers();
    const fallbackNumbers = [
        generateUniqueRandom(usedNumbers),
        generateUniqueRandom(usedNumbers),
        generateUniqueRandom(usedNumbers)
    ].sort((a, b) => a - b);
    
    saveTicket(nickname, fallbackNumbers);

    return {
      numbers: fallbackNumbers,
      message: "O sistema blindou sua sorte manualmente. Avante!",
      theme: "Resiliência"
    };
  }
};