import React, { useState, useEffect, useCallback } from 'react';
import { generateVerificationCode, verifyHabboMission } from '../services/habboService.ts';
import { submitMissionToSheet, fetchTakenNumbers, fetchUserHistory, UserHistoryItem } from '../services/sheetService.ts';
import NumberSelector from './NumberSelector.tsx';
import Skeleton from './Skeleton.tsx';

// --- SVG ICONS ---
const Icons = {
  User: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  ArrowRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Copy: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Refresh: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Logout: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>,
  Fingerprint: () => <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.85.577-4.147l.156-.463c.615-1.817 1.88-3.35 3.523-4.226 1.436-.766 3.043-1.077 4.634-.897M6 21a21.974 21.974 0 01-1-4.5" /></svg>
};

const RCC_LOGO_URL = "https://i.imgur.com/YhONB12.jpeg";

type Stage = 'LOGIN' | 'VERIFICATION' | 'DASHBOARD';

interface MissionState {
  id: number;
  title: string;
  desc: string;
  status: 'LOCKED' | 'PENDING' | 'SUBMITTING' | 'COMPLETED' | 'REJECTED';
  statusLabel?: string;
  chosenNumber: string;
  proofLink: string;
}

interface TicketGeneratorProps {
  onGlobalRefresh?: () => void;
}

const MISSION_MAP: Record<number, string> = {
    1: "1 Hora em Função",
    2: "Rondas Ostensivas",
    3: "Recrutamento"
};

const normalizeText = (text: string) => {
    return (text || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
};

const TicketGenerator: React.FC<TicketGeneratorProps> = ({ onGlobalRefresh }) => {
  const [stage, setStage] = useState<Stage>('LOGIN');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nickname, setNickname] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [takenNumbers, setTakenNumbers] = useState<Set<number>>(new Set());
  const [userHistory, setUserHistory] = useState<UserHistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'success'>('idle');
  
  const [missions, setMissions] = useState<MissionState[]>([
    { id: 1, title: MISSION_MAP[1], desc: '1h em Função', status: 'PENDING', chosenNumber: '', proofLink: '' },
    { id: 2, title: MISSION_MAP[2], desc: '03 Rondas de Recrutamento ou Divulgação', status: 'PENDING', chosenNumber: '', proofLink: '' },
    { id: 3, title: MISSION_MAP[3], desc: 'Recrutar 01 Civil', status: 'PENDING', chosenNumber: '', proofLink: '' },
  ]);
  const [activeMissionId, setActiveMissionId] = useState<number | null>(null);

  const changeStage = (newStage: Stage) => {
    setIsTransitioning(true);
    setTimeout(() => {
        setStage(newStage);
        requestAnimationFrame(() => setIsTransitioning(false));
    }, 600); 
  };

  useEffect(() => {
    const storedSession = localStorage.getItem('rcc_mega_session');
    if (storedSession) {
        try {
            const session = JSON.parse(storedSession);
            if (session.nickname) {
                setNickname(session.nickname);
                setStage('DASHBOARD');
            }
        } catch (e) {
            localStorage.removeItem('rcc_mega_session');
        }
    }
  }, []);

  const saveSession = (nick: string) => {
      localStorage.setItem('rcc_mega_session', JSON.stringify({ nickname: nick }));
  };

  const refreshData = useCallback(() => {
    if (!nickname) return;
    if (onGlobalRefresh) onGlobalRefresh();
    setLoadingData(true);
    setRefreshStatus('idle');

    Promise.all([fetchTakenNumbers(), fetchUserHistory(nickname)]).then(([blockedSet, rawHistory]) => {
        setTakenNumbers(blockedSet);
        const historyInSheetOrder = [...rawHistory];

        setMissions(prevMissions => prevMissions.map(mission => {
            const targetNameNormalized = normalizeText(MISSION_MAP[mission.id]);
            const missionEntries = historyInSheetOrder.filter(entry => normalizeText(entry.missionId) === targetNameNormalized);
            const lastEntry = missionEntries.length > 0 ? missionEntries[missionEntries.length - 1] : null;

            if (lastEntry) {
                 const statusRaw = normalizeText(lastEntry.status);
                 if (statusRaw.includes('reprovado')) return { ...mission, status: 'REJECTED', statusLabel: 'Reprovado', chosenNumber: lastEntry.chosenNumber, proofLink: lastEntry.proofLink };
                 if (statusRaw.includes('aprovado')) return { ...mission, status: 'COMPLETED', statusLabel: 'Aprovado', chosenNumber: lastEntry.chosenNumber, proofLink: lastEntry.proofLink }
                 return { ...mission, status: 'LOCKED', statusLabel: 'Análise', chosenNumber: lastEntry.chosenNumber, proofLink: lastEntry.proofLink };
            }
            return { ...mission, status: 'PENDING', statusLabel: 'Pendente', chosenNumber: '', proofLink: '' };
        }));

        setUserHistory([...historyInSheetOrder].reverse());
        setLoadingData(false);
        setRefreshStatus('success');
        setTimeout(() => setRefreshStatus('idle'), 2000);
    });
  }, [nickname, onGlobalRefresh]);

  useEffect(() => {
    if (stage === 'DASHBOARD' && nickname) refreshData();
  }, [stage, nickname, refreshData]);

  const handleStartVerification = () => {
    if (!nickname.trim()) return;
    const code = generateVerificationCode();
    setVerificationCode(code);
    setVerifyError(null);
    changeStage('VERIFICATION');
  };

  const handleCancelVerification = () => {
      setVerifyError(null);
      changeStage('LOGIN');
  };

  const handleVerifyMission = async () => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await verifyHabboMission(nickname, verificationCode);
      if (result.success) {
        saveSession(nickname);
        changeStage('DASHBOARD');
      } else {
        setVerifyError(result.message);
      }
    } catch (e) {
      setVerifyError("Erro inesperado na conexão.");
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('rcc_mega_session');
      setNickname('');
      changeStage('LOGIN');
      setMissions(missions.map(m => ({ ...m, status: 'PENDING', chosenNumber: '', proofLink: '' })));
  };

  const handleSubmitMission = async (id: number) => {
    const mission = missions.find(m => m.id === id);
    if (!mission) return;

    const num = parseInt(mission.chosenNumber);
    if (isNaN(num) || mission.chosenNumber === '') { alert("Por favor, selecione um número na tabela."); return; }
    if (takenNumbers.has(num)) { alert("Este número consta como OCUPADO. Por favor, escolha outro."); refreshData(); return; }
    if (!mission.proofLink || mission.proofLink.length < 5) { alert("Link de comprovação inválido."); return; }

    setMissions(prev => prev.map(m => m.id === id ? { ...m, status: 'SUBMITTING' } : m));
    const result = await submitMissionToSheet({ nickname: nickname, missionId: id, chosenNumber: num, proofLink: mission.proofLink });

    if (result.success) {
        alert(`Missão enviada! A tabela será atualizada em instantes.`);
        setActiveMissionId(null);
        setTimeout(() => refreshData(), 3000);
    } else {
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status: 'PENDING' } : m));
        alert(result.message);
    }
  };

  const updateMissionField = (id: number, field: 'chosenNumber' | 'proofLink', value: string) => {
    setMissions(prev => prev.map(m => m.id !== id ? m : { ...m, [field]: value }));
  };

  // --- ICONIC LOGIN ---
  const renderLogin = () => (
    <div className="w-full max-w-md mx-auto flex items-center justify-center min-h-[50vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
         <div className="w-full relative group perspective-1000">
            {/* Holographic Border Container */}
            <div className="relative bg-[#050505]/90 border-t border-b border-amber-500/20 backdrop-blur-xl p-1 overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_150px_rgba(212,175,55,0.25)] transition-all duration-700 transform hover:scale-[1.02]">
                
                {/* Scanner Light Effect */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500 shadow-[0_0_20px_#FFD700] animate-[scan_3s_ease-in-out_infinite] opacity-50 z-20 pointer-events-none"></div>

                <div className="bg-black/80 p-10 relative z-10 flex flex-col items-center">
                    
                    {/* Iconic Fingerprint/Logo */}
                    <div className="mb-10 relative interactive-hover">
                         <div className="w-32 h-32 border border-amber-500/30 rounded-full flex items-center justify-center relative bg-black/50 overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                             {/* Circular Scan Effect */}
                             <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin"></div>
                             
                             <img 
                                src={RCC_LOGO_URL} 
                                alt="RCC System Access" 
                                className="w-24 h-24 object-contain opacity-90 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                             />
                             
                             {/* Laser Scanner Overlay */}
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-amber-500/10 to-transparent animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                         </div>
                    </div>

                    <h2 className="text-3xl font-editorial text-white tracking-[0.2em] mb-2 text-center text-gold-shimmer">RCC <span className="text-amber-500">LOG</span></h2>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-gray-500 mb-8 border-b border-amber-500/20 pb-2">Acesso Restrito</p>

                    <div className="w-full space-y-8 relative">
                         {/* Input with Side Markers */}
                        <div className="relative group/input interactive-hover">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-500/50 transition-all group-focus-within/input:h-full group-focus-within/input:bg-amber-500"></div>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="block w-full py-4 px-6 bg-white/[0.02] border-r border-white/10 text-center text-xl text-white focus:bg-white/[0.05] outline-none transition-all font-mono uppercase tracking-[0.2em] placeholder-gray-700 focus:shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]"
                                placeholder="IDENTIFICAÇÃO"
                            />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-500/50 transition-all group-focus-within/input:h-full group-focus-within/input:bg-amber-500"></div>
                        </div>

                        <button
                            onClick={handleStartVerification}
                            disabled={!nickname.trim()}
                            className="w-full relative overflow-hidden bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase text-xs py-5 tracking-[0.3em] transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] disabled:opacity-30 disabled:cursor-not-allowed group/btn interactive-hover"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Autenticar <Icons.ArrowRight />
                            </span>
                            {/* Button Hover Shine */}
                            <div className="absolute top-0 left-0 w-full h-full bg-white/40 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500 ease-out skew-x-12"></div>
                        </button>
                    </div>
                </div>
            </div>
         </div>
    </div>
  );

  // --- ICONIC VERIFICATION ---
  const renderVerify = () => (
    <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-[#050505] border-l-2 border-r-2 border-amber-500/40 p-1 relative shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            
            {/* Header */}
            <div className="bg-black/90 p-8 text-center border-b border-white/5">
                <h2 className="text-xs text-amber-500 uppercase tracking-[0.4em] mb-2 animate-pulse">Protocolo de Segurança</h2>
                <h1 className="text-3xl text-white font-editorial tracking-widest text-gold-shimmer">VERIFICAÇÃO</h1>
            </div>

            <div className="p-8 space-y-8 bg-black/60 backdrop-blur-md">
                {/* The Code Vault */}
                <div 
                    className="relative bg-gradient-to-r from-amber-900/20 to-black border border-amber-500/30 p-8 text-center cursor-pointer group hover:border-amber-500 transition-colors interactive-hover"
                    onClick={() => {navigator.clipboard.writeText(verificationCode); alert('Token copiado!');}}
                >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-500"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500"></div>

                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-4">Token Gerado</p>
                    <div className="text-4xl md:text-5xl font-mono text-white tracking-widest font-bold group-hover:text-amber-400 transition-colors drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                        {verificationCode}
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-amber-600 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                         [ COPIAR ] <Icons.Copy />
                    </div>
                </div>
                
                {verifyError && (
                     <div className="p-4 bg-red-950/30 border-l-2 border-red-500 text-center animate-in shake">
                         <p className="text-red-500 text-xs uppercase tracking-wide font-bold animate-pulse">{verifyError}</p>
                     </div>
                )}

                <div className="flex gap-4">
                    <button 
                        onClick={handleCancelVerification}
                        className="flex-1 bg-transparent border border-white/10 hover:bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest py-4 transition-colors interactive-hover"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleVerifyMission} 
                        disabled={verifying} 
                        className="flex-[2] bg-white hover:bg-gray-200 text-black font-bold uppercase text-[10px] py-4 tracking-[0.3em] transition-all flex items-center justify-center gap-2 interactive-hover relative overflow-hidden"
                    >
                        <span className="relative z-10">{verifying ? 'Validando...' : 'Confirmar'}</span>
                        {verifying && <div className="absolute inset-0 bg-amber-500/20 animate-pulse"></div>}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  // --- ICONIC DASHBOARD ---
  const renderDashboard = () => {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Tactical HUD Header */}
            <div className="relative mb-16">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent blur-3xl pointer-events-none"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border-t border-b border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    
                    <div className="flex items-center gap-8">
                         {/* Avatar with Rotating Ring */}
                         <div className="relative w-20 h-20 flex-shrink-0 interactive-hover group">
                            <div className="absolute inset-0 rounded-full border border-dashed border-amber-500/50 animate-[spin_10s_linear_infinite] group-hover:border-amber-400"></div>
                            <div className="absolute inset-1 rounded-full border border-white/10"></div>
                            <img 
                                src={`https://www.habbo.com.br/habbo-imaging/avatarimage?user=${nickname}&direction=2&head_direction=3&gesture=sml&size=l&headonly=1`} 
                                alt={nickname}
                                className="w-full h-full rounded-full object-cover p-2 transition-transform group-hover:scale-110"
                             />
                             {/* Small RCC Logo Badge */}
                             <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border border-black bg-black p-0.5 shadow-lg">
                                <img src={RCC_LOGO_URL} alt="Badge" className="w-full h-full object-contain" />
                             </div>
                         </div>
                         
                         <div>
                            <h2 className="text-4xl font-editorial text-white tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{nickname}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[9px] text-amber-500 uppercase tracking-widest font-bold animate-pulse">
                                    FELIZ ANO NOVO
                                </div>
                                <div className="h-[1px] w-12 bg-white/10"></div>
                            </div>
                         </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={refreshData} 
                            disabled={loadingData}
                            className="group relative px-6 py-3 overflow-hidden border border-white/10 hover:border-amber-500/50 transition-colors interactive-hover"
                        >
                            <span className="relative z-10 text-[10px] uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                <Icons.Refresh /> {loadingData ? 'Sincronizando...' : 'Sincronizar'}
                            </span>
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        </button>

                        <button onClick={handleLogout} className="text-[10px] uppercase tracking-[0.2em] text-red-500 hover:text-red-400 px-6 py-3 border border-transparent hover:border-red-900/30 transition-all interactive-hover">
                            Encerrar Sessão
                        </button>
                    </div>
                </div>
            </div>

            {/* Mission Files Grid - IMPROVED CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {loadingData && missions.every(m => m.status === 'PENDING') ? (
                     [1, 2, 3].map((i) => <Skeleton key={i} className="h-96 w-full opacity-10" />)
                ) : (
                    missions.map((mission) => {
                        let statusColor = 'text-gray-500';
                        let borderColor = 'border-white/5';
                        let glow = '';
                        let statusBg = 'bg-black/50';
                        
                        if (mission.status === 'REJECTED') {
                            statusColor = 'text-red-500';
                            borderColor = 'border-red-900';
                            statusBg = 'bg-red-900/20';
                        } else if (mission.status === 'COMPLETED') {
                            statusColor = 'text-green-500';
                            borderColor = 'border-green-900';
                            glow = 'shadow-[0_0_30px_rgba(20,83,45,0.2)]';
                            statusBg = 'bg-green-900/20';
                        } else if (mission.status === 'LOCKED') { 
                            statusColor = 'text-amber-500';
                            borderColor = 'border-amber-500/50';
                            glow = 'shadow-[0_0_30px_rgba(212,175,55,0.15)]';
                            statusBg = 'bg-amber-900/20';
                        }

                        const isOpen = activeMissionId === mission.id;
                        const canInteract = mission.status === 'PENDING' || mission.status === 'REJECTED';
                        
                        return (
                            <div 
                                key={mission.id} 
                                className={`
                                    relative bg-[#080808]/80 backdrop-blur-xl border ${borderColor} transition-all duration-500 flex flex-col group interactive-hover
                                    ${isOpen ? 'lg:col-span-3 z-20 min-h-[500px]' : 'min-h-[300px] hover:border-amber-500/30 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]'}
                                    ${glow}
                                    overflow-hidden
                                `}
                            >
                                {/* Holographic Tech Pattern Overlay */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/circuit.png')]"></div>
                                
                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-amber-500 transition-colors"></div>
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 group-hover:border-amber-500 transition-colors"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 group-hover:border-amber-500 transition-colors"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-amber-500 transition-colors"></div>

                                <div className="p-8 flex flex-col h-full relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-600 mb-1 group-hover:text-amber-500 transition-colors">Arquivo 00{mission.id}</span>
                                            <h3 className="text-xl md:text-2xl text-white font-editorial tracking-wide group-hover:text-gold-shimmer transition-colors">{mission.title}</h3>
                                        </div>
                                        <div className={`px-2 py-1 text-[8px] uppercase tracking-[0.2em] font-bold border ${borderColor} ${statusColor} ${statusBg} rounded`}>
                                            {mission.statusLabel || 'Pendente'}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-400 font-light mb-8 border-l border-white/10 pl-4 group-hover:border-amber-500/50 transition-colors">{mission.desc}</p>

                                    <div className="mt-auto flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">Protocolo Nº</p>
                                            <div className="h-10 px-4 flex items-center bg-white/5 border border-white/5 min-w-[100px] group-hover:bg-white/10 transition-colors">
                                                <span className={`font-mono text-lg ${mission.chosenNumber ? 'text-amber-500' : 'text-gray-600'}`}>
                                                    {mission.chosenNumber ? `#${mission.chosenNumber}` : '---'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {canInteract && (
                                            <button 
                                                onClick={() => setActiveMissionId(isOpen ? null : mission.id)}
                                                className={`w-10 h-10 border flex items-center justify-center transition-all rounded-full ${isOpen ? 'bg-amber-500 border-amber-500 text-black rotate-180' : 'border-white/10 text-gray-400 hover:text-white hover:border-amber-500 hover:bg-amber-500/10'}`}
                                            >
                                                <Icons.ChevronDown />
                                            </button>
                                        )}
                                    </div>

                                    {/* SMOOTH ACCORDION EXPANSION */}
                                    <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen && canInteract ? 'grid-rows-[1fr] mt-8 pt-8 border-t border-white/5' : 'grid-rows-[0fr]'}`}>
                                        <div className="overflow-hidden">
                                            <div className="grid lg:grid-cols-2 gap-16 animate-in fade-in slide-in-from-top-2 duration-500">
                                                
                                                {/* Left: Matrix Selection */}
                                                <div>
                                                    <NumberSelector 
                                                        takenNumbers={takenNumbers} 
                                                        selectedNumber={mission.chosenNumber} 
                                                        onSelect={(n) => updateMissionField(mission.id, 'chosenNumber', n)} 
                                                        loading={loadingData} 
                                                    />
                                                </div>

                                                {/* Right: Data Submission */}
                                                <div className="flex flex-col justify-center space-y-8 p-6 bg-white/[0.02] border border-white/5 rounded-xl">
                                                    <div>
                                                        <h4 className="text-xs text-white uppercase tracking-[0.2em] mb-6 font-bold flex items-center gap-2 border-b border-white/10 pb-2">
                                                            <Icons.Lock /> Comprovações
                                                        </h4>
                                                        
                                                        <div className="relative group/input mb-2">
                                                            <input 
                                                                type="text"
                                                                placeholder="URL DA IMAGEM (IMGUR)..."
                                                                value={mission.proofLink}
                                                                onChange={(e) => updateMissionField(mission.id, 'proofLink', e.target.value)}
                                                                className="w-full bg-black/50 border border-white/10 px-6 py-4 text-white text-xs font-mono focus:border-amber-500 outline-none transition-colors placeholder-gray-700"
                                                            />
                                                        </div>
                                                        <p className="text-[9px] text-gray-500">
                                                            * O registro deve conter data, hora e o cumprimento explícito da missão.
                                                        </p>
                                                    </div>

                                                    <button 
                                                        onClick={() => handleSubmitMission(mission.id)}
                                                        disabled={mission.status === 'SUBMITTING'}
                                                        className="w-full bg-white hover:bg-amber-500 hover:text-black text-black font-bold uppercase text-xs py-5 tracking-[0.3em] transition-all flex justify-center gap-2 items-center interactive-hover shadow-lg"
                                                    >
                                                        {mission.status === 'SUBMITTING' ? 'Processando...' : (
                                                            <>Enviar <Icons.ArrowRight /></>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="w-full relative z-10 flex flex-col justify-center">
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isTransitioning ? 'opacity-0 blur-lg scale-95 translate-y-12' : 'opacity-100 blur-0 scale-100 translate-y-0'}`}>
            {stage === 'LOGIN' && renderLogin()}
            {stage === 'VERIFICATION' && renderVerify()}
            {stage === 'DASHBOARD' && renderDashboard()}
        </div>
    </div>
  );
};

export default TicketGenerator;