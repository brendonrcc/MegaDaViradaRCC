// Generates a random code like "RCC-1234"
export const generateVerificationCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
  return `RCC-${randomNum}`;
};

// Limpeza agressiva de strings para comparação (remove acentos, espaços extras, case insensitive)
const normalizeForComparison = (str) => {
  if (!str) return "";
  return str.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, "")    // Remove tudo que não é letra/número
    .toUpperCase();
};

export const verifyHabboMission = async (nickname, code) => {
  // 1. Bypass para testes/desenvolvimento
  if (nickname.toUpperCase() === "DEV") {
      return { success: true, message: "Modo Desenvolvedor: Acesso Permitido." };
  }

  const cleanNick = nickname.trim();
  const habboTargetUrl = `https://www.habbo.com.br/api/public/users?name=${encodeURIComponent(cleanNick)}`;

  // Definição dos Proxies com estratégias de parse diferentes
  const proxies = [
      {
          name: 'AllOrigins',
          // Adiciona timestamp para evitar cache do AllOrigins
          getUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&disableCache=true&_t=${Date.now()}`,
          parse: async (res) => {
              const json = await res.json();
              if (!json.contents) throw new Error("Conteúdo vazio do proxy");
              // AllOrigins retorna o conteúdo como string dentro de 'contents', precisamos fazer parse novamente
              return JSON.parse(json.contents);
          }
      },
      {
          name: 'CorsProxy',
          // CorsProxy direto
          getUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}&_bust=${Date.now()}`,
          parse: async (res) => await res.json()
      },
      {
          name: 'ThingProxy',
          // Fallback final
          getUrl: (url) => `https://thingproxy.freeboard.io/fetch/${url}?_=${Date.now()}`,
          parse: async (res) => await res.json()
      }
  ];

  let lastError = "";

  // Tenta cada proxy sequencialmente
  for (const proxy of proxies) {
      try {
          console.log(`[HabboService] Tentando conexão via ${proxy.name}...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

          const response = await fetch(proxy.getUrl(habboTargetUrl), { 
              signal: controller.signal,
              cache: 'no-store' // Força o browser a não cachear
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
              if (response.status === 404) {
                 // Se o proxy retornou 404, pode ser que o usuário não exista MESMO ou o proxy falhou.
                 // Vamos assumir que se o proxy respondeu, o Habbo respondeu.
                 throw new Error("Usuário não encontrado (404)");
              }
              throw new Error(`HTTP Error ${response.status}`);
          }

          const data = await proxy.parse(response);

          // Validações da API do Habbo
          if (data.error === 'not-found') {
              return { success: false, message: 'Policial não encontrado no Habbo BR. Verifique a digitação.' };
          }

          if (data.profileVisible === false) {
              // Mesmo oculto, às vezes a API traz o motto antigo.
              // Mas para segurança, pedimos para abrir o perfil.
              return { success: false, message: 'Seu perfil Habbo está oculto. Por favor, torne-o público nas configurações do jogo para validar.' };
          }

          const currentMotto = data.motto || "";
          console.log(`[HabboService] Missão lida via ${proxy.name}: "${currentMotto}"`);

          const cleanMotto = normalizeForComparison(currentMotto);
          const cleanCode = normalizeForComparison(code);

          if (cleanMotto.includes(cleanCode)) {
              return { success: true, message: 'Validado com sucesso!' };
          } else {
              // Leitura feita com sucesso, mas código incorreto. Não adianta tentar outro proxy.
              return { 
                  success: false, 
                  message: `Missão atual lida: "${currentMotto}". O código "${code}" não foi encontrado. Se alterou agora, aguarde 15s.` 
              };
          }

      } catch (err) {
          console.warn(`[HabboService] Falha no proxy ${proxy.name}:`, err.message);
          
          // Se o erro foi especificamente "Usuário não encontrado" vindo do Habbo (via proxy), paramos.
          if (err.message.includes('not-found') || err.message.includes('404')) {
               return { success: false, message: 'Usuário não encontrado no Habbo.' };
          }
          
          lastError = err.message;
          // Loop continua para o próximo proxy...
      }
  }

  return { success: false, message: `Não foi possível conectar à API do Habbo. (Erro: ${lastError})` };
};