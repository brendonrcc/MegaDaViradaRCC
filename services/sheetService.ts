// URL do seu Google Apps Script implantado (Web App) - Para Envio (POST)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxY-i50jk_xfHVLW3YitGoRup4Ije_UvVxKTeubFuofYodMalJNZF1vv4NyXt9-XfueOw/exec'; 

// URL do Worker (Proxy para Leitura TSV)
const BASE_SHEET_URL = "https://rccapi.brendon-goncalves.workers.dev/";

// IDs das abas (GIDs)
// GID_HISTORY é a única fonte da verdade agora (1872953189)
const GID_HISTORY = "1872953189"; 

export interface MissionSubmission {
  nickname: string;
  missionId: number;
  chosenNumber: number;
  proofLink: string;
}

export interface UserHistoryItem {
  timestamp?: string;
  missionId: string;
  chosenNumber: string;
  proofLink: string;
  status: string; 
}

export interface RegistryItem {
    number: number;
    nickname: string;
}

// Limpa células que podem vir com aspas ou espaços extras do formato TSV/CSV
const cleanData = (data: string) => {
    if (!data) return "";
    return data.replace(/^["']|["']$/g, '').trim();
};

// Função auxiliar para analisar TSV de forma robusta
const parseTSV = (text: string): string[][] => {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  return lines.map(line => line.split('\t').map(cleanData));
};

// Helper para gerar string aleatória de cache
const getCacheBuster = () => `cb=${Math.floor(Date.now() / 1000)}`;

// ============================================================================
// 1. BUSCAR REGISTRO PÚBLICO (QUEM PEGOU O QUÊ)
// ============================================================================
export const fetchApprovedRegistry = async (): Promise<RegistryItem[]> => {
    try {
        // Worker espera: ?gid=...
        const url = `${BASE_SHEET_URL}?gid=${GID_HISTORY}&${getCacheBuster()}`;
        
        const response = await fetch(url); 

        if (!response.ok) return [];
        const text = await response.text();
        if (text.trim().startsWith('<')) return []; 

        const rows = parseTSV(text);
        const registry: RegistryItem[] = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            // B=Nick(1), D=Num(3), F=Status(5)
            if (row.length > 5) {
                const statusStr = (row[5] || '').toLowerCase().trim();
                if (statusStr.includes('aprovado')) {
                    const num = parseInt(row[3]);
                    const nick = cleanData(row[1]);
                    
                    if (!isNaN(num) && nick) {
                        registry.push({ number: num, nickname: nick });
                    }
                }
            }
        }
        
        return registry.sort((a, b) => a.number - b.number);

    } catch (e) {
        console.error("Erro ao buscar registro público:", e);
        return [];
    }
}

// ============================================================================
// 2. BUSCAR NÚMEROS OCUPADOS (GRID GLOBAL)
// Fonte única: Histórico (1872953189)
// ============================================================================
export const fetchTakenNumbers = async (): Promise<Set<number>> => {
  const blockedNumbers = new Set<number>();

  try {
    // Worker espera: ?gid=...
    const urlHistory = `${BASE_SHEET_URL}?gid=${GID_HISTORY}&${getCacheBuster()}`;

    const response = await fetch(urlHistory);

    if (response && response.ok) {
        const textHistory = await response.text();
        if (!textHistory.trim().startsWith('<')) {
            const rows = parseTSV(textHistory);
            
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length > 5) {
                    const numberStr = row[3]; 
                    const statusStr = (row[5] || '').toLowerCase().trim(); 

                    // Verifica apenas as linhas preenchidas onde o status é 'aprovado'
                    if (numberStr && statusStr.includes('aprovado')) {
                        const num = parseInt(numberStr);
                        if (!isNaN(num)) blockedNumbers.add(num);
                    }
                }
            }
        }
    }
    return blockedNumbers;

  } catch (e) {
    console.error("Erro fatal ao buscar números ocupados:", e);
    return blockedNumbers;
  }
};

// ============================================================================
// 3. BUSCAR HISTÓRICO E STATUS (USUÁRIO ESPECÍFICO)
// ============================================================================
export const fetchUserHistory = async (nickname: string): Promise<UserHistoryItem[]> => {
  try {
    // Worker espera: ?gid=...
    const url = `${BASE_SHEET_URL}?gid=${GID_HISTORY}&${getCacheBuster()}`;
    const response = await fetch(url);

    if (!response.ok) return [];
    const text = await response.text();
    if (text.trim().startsWith('<')) return [];

    const rows = parseTSV(text);
    const history: UserHistoryItem[] = [];
    const searchNick = nickname.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) { 
        const rowNick = cleanData(row[1]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (rowNick === searchNick) {
          let statusRaw = 'Análise';
          if (row.length > 5) {
             const cellVal = cleanData(row[5]);
             if (cellVal !== "") {
                 statusRaw = cellVal;
             }
          }

          history.push({
            timestamp: row[0] ? cleanData(row[0]) : undefined,
            missionId: cleanData(row[2]),
            chosenNumber: cleanData(row[3]),
            proofLink: cleanData(row[4]),
            status: statusRaw
          });
        }
      }
    }
    return history;
  } catch (e) {
    console.error("Erro ao buscar histórico:", e);
    return [];
  }
};

export const submitMissionToSheet = async (data: MissionSubmission): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new URLSearchParams();
    formData.append('nickname', data.nickname);
    
    let missionName = "";
    if(data.missionId === 1) missionName = "1 Hora em Função";
    if(data.missionId === 2) missionName = "Ronda de Recrutamento";
    if(data.missionId === 3) missionName = "Recrutamento";

    formData.append('missionId', missionName);
    formData.append('chosenNumber', data.chosenNumber.toString());
    formData.append('proofLink', data.proofLink);
    formData.append('timestamp', new Date().toISOString());

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    return { success: true, message: 'Comprovação enviada com sucesso! Aguarde a atualização da tabela.' };

  } catch (error) {
    console.error("Erro no envio:", error);
    return { success: false, message: 'Erro de conexão. Tente novamente.' };
  }
};