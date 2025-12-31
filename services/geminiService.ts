import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simulation of a Database using LocalStorage
const DB_KEY = 'rcc_mega_virada_db_2025';

const getRegisteredTickets = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getAllUsedNumbers = () => {
  const tickets = getRegisteredTickets();
  const used = new Set();
  tickets.forEach(t => t.numbers.forEach(n => used.add(n)));
  return used;
};

const saveTicket = (nickname, numbers) => {
  const tickets = getRegisteredTickets();
  tickets.push({
    nickname,
    numbers,
    timestamp: Date.now()
  });
  localStorage.setItem(DB_KEY, JSON.stringify(tickets));
};

const generateUniqueRandom = (exclude) => {
  let num = Math.floor(Math.random() * 1000); // 0 to 999
  while (exclude.has(num)) {
    num = Math.floor(Math.random() * 1000);
    if (exclude.size >= 1000) return -1; 
  }
  return num;
};

export const generateLuckyNumbers = async (wish, nickname) => {
  try {
    const usedNumbers = getAllUsedNumbers();
    
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

    const finalNumbers = [];
    
    for (let num of candidates) {
        let cleanNum = Math.abs(Math.floor(Number(num))) % 1000;
        if (usedNumbers.has(cleanNum) || finalNumbers.includes(cleanNum)) {
            const replacement = generateUniqueRandom(new Set([...usedNumbers, ...finalNumbers]));
            if (replacement !== -1) {
                finalNumbers.push(replacement);
            }
        } else {
            finalNumbers.push(cleanNum);
        }
    }

    while (finalNumbers.length < 3) {
        const replacement = generateUniqueRandom(new Set([...usedNumbers, ...finalNumbers]));
        finalNumbers.push(replacement);
    }

    finalNumbers.sort((a, b) => a - b);
    saveTicket(nickname, finalNumbers);

    return {
      numbers: finalNumbers,
      message: data.message || `Boa sorte, ${nickname}! O universo conspira a seu favor.`,
      theme: data.theme || "Prosperidade"
    };

  } catch (error) {
    console.error("Erro ao gerar números:", error);
    
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