import React from 'react';
import BackgroundEffects from './components/BackgroundEffects';
import Countdown from './components/Countdown';
import NebulaBackground from './components/NebulaBackground';
import TicketGenerator from './components/TicketGenerator';
import GridBackground from './components/GridBackground';
import PublicRegistry from './components/PublicRegistry';
import LoadingScreen from './components/LoadingScreen';

// --- Global Constants ---
const RCC_LOGO_URL = "https://i.imgur.com/YhONB12.jpeg";

// --- Custom Cursor Component ---
const CustomCursor = () => {
    const dotRef = React.useRef(null);
    const outlineRef = React.useRef(null);

    React.useEffect(() => {
        const moveCursor = (e) => {
            if (dotRef.current && outlineRef.current) {
                dotRef.current.style.left = `${e.clientX}px`;
                dotRef.current.style.top = `${e.clientY}px`;
                
                // Slight delay for the outline for organic feel
                outlineRef.current.animate({
                    left: `${e.clientX}px`,
                    top: `${e.clientY}px`
                }, { duration: 500, fill: "forwards" });
            }
        };
        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, []);

    // Only render on desktop to avoid touch issues
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;

    return (
        <React.Fragment>
            <div ref={dotRef} className="cursor-dot hidden md:block" />
            <div ref={outlineRef} className="cursor-outline hidden md:block" />
        </React.Fragment>
    );
};

const App = () => {
  const [globalRefreshTrigger, setGlobalRefreshTrigger] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isScrolled, setIsScrolled] = React.useState(false);
  
  // Hero Interaction State
  const heroRef = React.useRef(null);
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 });

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGlobalRefresh = React.useCallback(() => {
    setGlobalRefreshTrigger(prev => prev + 1);
  }, []);

  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <React.Fragment>
      <LoadingScreen onComplete={() => setIsLoading(false)} />
      <CustomCursor />
      
      {/* Main Container */}
      <div className={`min-h-screen relative flex flex-col selection:bg-amber-500 selection:text-black overflow-x-hidden transition-opacity duration-1000 bg-black ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Global Stars (Visible mostly in Hero and Transitions) */}
        <BackgroundEffects />

        {/* Navigation */}
        <nav 
            className={`fixed top-0 left-0 w-full p-6 md:px-12 md:py-6 z-50 flex justify-between items-center transition-all duration-700 ${
                isScrolled 
                ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
                : 'bg-transparent py-8'
            }`}
        >
          <div className="flex flex-col cursor-pointer group interactive-hover" onClick={() => scrollToSection('hero')}>
              <h1 className="text-xl font-bold tracking-[0.2em] text-white uppercase font-ritual group-hover:text-amber-400 transition-colors">MEGA DA VIRADA</h1>
              <div className="h-[1px] w-0 bg-amber-500 group-hover:w-full transition-all duration-500"></div>
          </div>

          <ul className="hidden md:flex items-center gap-10">
              {['Início', 'Tempo', 'Missões', 'Livro', 'Regras'].map((item, idx) => {
                  const ids = ['hero', 'countdown', 'missions', 'registry', 'rules'];
                  return (
                      <li key={idx}>
                          <button 
                            onClick={() => scrollToSection(ids[idx])}
                            className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-all relative group py-2 font-medium interactive-hover"
                          >
                              {item}
                              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_10px_#f59e0b]"></span>
                          </button>
                      </li>
                  )
              })}
          </ul>
        </nav>

        {/* Content Wrapper */}
        <main className="flex-grow w-full relative z-10">
          
          {/* Section 1: HERO */}
          <section 
            id="hero"
            ref={heroRef}
            onMouseMove={handleHeroMouseMove}
            className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden pt-20 bg-transparent"
          >
              {/* Background Ambient Glow (Interactive) */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vh] h-[120vh] rounded-full opacity-30 pointer-events-none transition-transform duration-100 ease-out blur-[120px]"
                style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(0,0,0,0) 70%)',
                    transform: `translate(-50%, -50%) translate(${(mousePos.x - 50) * 0.15}px, ${(mousePos.y - 50) * 0.15}px)`
                }}
              ></div>

              {/* Giant Year Background Parallax */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none z-0 mix-blend-overlay opacity-20"
                   style={{ transform: `translate(-50%, -50%) translate(${(mousePos.x - 50) * -0.05}px, ${(mousePos.y - 50) * -0.05}px)` }}>
                  <span className="text-[40vw] font-bold text-white font-editorial tracking-tighter leading-none block scale-y-110 blur-sm">RCC</span>
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center px-6">
                  
                  {/* Badge & Logo Container */}
                  <div className="mb-8 flex flex-col items-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                       {/* Floating Official Logo */}
                       <div className="relative mb-6 group interactive-hover">
                           <div className="absolute inset-0 bg-amber-500/20 blur-[50px] rounded-full animate-pulse pointer-events-none"></div>
                           <img 
                              src={RCC_LOGO_URL} 
                              alt="RCC Brasão Oficial" 
                              className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] animate-float"
                           />
                       </div>

                       <div className="relative flex items-center gap-4 group">
                           <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-500 group-hover:w-20 transition-all duration-500"></div>
                           <span className="text-[10px] font-mono text-amber-300 uppercase tracking-[0.4em] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                               Prêmio Acumulado: 18 HCs
                           </span>
                           <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-500 group-hover:w-20 transition-all duration-500"></div>
                       </div>
                  </div>
                  
                  {/* Main Title - Diamond/Crystal Text */}
                  <div className="relative mb-8 animate-fade-in-up group cursor-default" style={{animationDelay: '0.4s'}}>
                      <h2 className="text-6xl md:text-8xl lg:text-9xl font-editorial font-normal leading-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-all duration-700 hover:scale-[1.02] interactive-hover">
                          MEGA DA VIRADA
                      </h2>
                      {/* Reflection/Shine overlay on text */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none mix-blend-overlay"></div>
                  </div>

                  {/* Subtitle */}
                  <h3 className="text-2xl md:text-4xl font-ritual text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 tracking-[0.5em] mb-12 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                      RCC <span className="text-white font-light">2026</span>
                  </h3>

                  {/* Quote */}
                  <p className="max-w-lg text-gray-400 text-xs md:text-sm font-light tracking-wide leading-relaxed mb-20 animate-fade-in-up border-l border-amber-500/30 pl-6 text-left md:text-center md:border-l-0 md:pl-0" style={{animationDelay: '0.8s'}}>
                      Um novo ciclo se inicia. Onde a fortuna encontra a bravura nos corredores da Revolução.
                  </p>
              </div>
              
              {/* Scroll Indicator */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 cursor-pointer group interactive-hover" onClick={() => scrollToSection('countdown')}>
                  <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-gray-500 to-transparent group-hover:via-amber-500 transition-all duration-500 group-hover:h-24"></div>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-gray-600 group-hover:text-amber-500 transition-colors animate-pulse">Explorar</span>
              </div>
          </section>

          {/* Section 2: Timeline - Backdrop Blur */}
          <section id="countdown" className="relative border-t border-white/5 bg-black/40 backdrop-blur-md z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              <Countdown />
          </section>

          {/* Section 3: GOLD SECTION (Missions) */}
          <section id="missions" className="min-h-screen flex items-center justify-center relative overflow-hidden py-20">
               {/* Nebula Background Component */}
               <NebulaBackground />
               
               {/* Content */}
               <div className="relative z-10 w-full">
                    {/* Decorative Ring */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/10 rounded-full pointer-events-none opacity-50 mix-blend-overlay"></div>
                    <TicketGenerator onGlobalRefresh={handleGlobalRefresh} />
               </div>
          </section>

          {/* Section 4: GRID SECTION (Registry) */}
          <div id="registry" className="relative min-h-screen">
            {/* Grid Background Component */}
            <GridBackground />
            
            <div className="relative z-10">
                <PublicRegistry refreshTrigger={globalRefreshTrigger} />
            </div>
          </div>

          {/* Section 5: Rules & Missions - Darker background with pattern */}
          <section id="rules" className="py-32 px-6 md:px-20 bg-[#080808] text-white relative overflow-hidden border-t border-white/5">
              {/* Background: Blueprint Grid */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="absolute inset-0" 
                       style={{
                           backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.1) 1px, transparent 1px)',
                           backgroundSize: '40px 40px'
                       }}>
                  </div>
              </div>

              <div className="max-w-7xl mx-auto relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-20 pb-8 border-b border-white/10">
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500">Documento Confidencial</span>
                          </div>
                          <h3 className="text-4xl md:text-5xl font-editorial text-white">Condições & Premiação</h3>
                      </div>
                      <div className="text-right hidden md:block opacity-30">
                           <span className="block text-6xl font-mono font-bold text-white/5 tracking-tighter">OP-2026</span>
                      </div>
                  </div>

                  <div className="grid lg:grid-cols-12 gap-16">
                      
                      {/* Left Column: Timeline */}
                      <div className="lg:col-span-4 relative">
                          <div className="sticky top-32">
                              <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-10 text-white/50 flex items-center gap-3">
                                  <span className="w-8 h-[1px] bg-white/20"></span> Cronograma
                              </h4>
                              
                              <div className="relative pl-8 border-l border-white/10 space-y-16">
                                  {/* Event 1 */}
                                  <div className="relative group interactive-hover">
                                      <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-black border-2 border-white/20 group-hover:border-amber-500 group-hover:bg-amber-900 transition-all z-10"></div>
                                      <span className="text-[10px] text-amber-500 uppercase tracking-widest block mb-1">Abertura</span>
                                      <p className="text-2xl font-editorial text-white mb-1">31 Dezembro</p>
                                  </div>

                                  {/* Event 2 */}
                                  <div className="relative group interactive-hover">
                                      <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-black border-2 border-white/20 group-hover:border-amber-500 group-hover:bg-amber-900 transition-all z-10"></div>
                                      <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Fechamento</span>
                                      <p className="text-2xl font-editorial text-white mb-1">10 Janeiro</p>
                                  </div>

                                  {/* Event 3 */}
                                  <div className="relative group interactive-hover">
                                      <div className="absolute -left-[39px] top-0 w-5 h-5 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(212,175,55,0.6)] z-10"></div>
                                      <div className="absolute -left-[39px] top-0 w-5 h-5 rounded-full bg-white animate-ping opacity-20"></div>

                                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block mb-1">O Grande Sorteio</span>
                                      <p className="text-3xl font-editorial text-white mb-1 text-gold-shimmer">11 Janeiro</p>
                                      <p className="text-xs text-gray-400 leading-relaxed">Transmissão ao vivo.</p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Right Column: Mission Briefing Cards */}
                      <div className="lg:col-span-8 space-y-6">
                           <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 text-white/50 flex items-center gap-3">
                               <span className="w-8 h-[1px] bg-white/20"></span> Diretrizes da Missão
                           </h4>

                           <div className="grid md:grid-cols-2 gap-6">
                               {/* Card 1 */}
                               <div className="glass-panel p-8 holographic-hover transition-all duration-500 hover:border-amber-500/30 group">
                                   <div className="flex justify-between items-start mb-6">
                                       <span className="text-[10px] border border-white/10 px-2 py-1 uppercase tracking-widest text-gray-400 group-hover:text-white group-hover:border-white/30 transition-colors">Fácil</span>
                                   </div>
                                   <h3 className="text-xl text-white font-light mb-2">01 hora em função</h3>
                                   <div className="w-full h-[1px] bg-white/10 mb-4 group-hover:bg-amber-500/50 transition-colors"></div>
                                   <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                       Necessário completar <strong className="text-white">01 hora</strong> em função (Exige rotação no batalhão).
                                   </p>
                                   <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-500/70">
                                       <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_#f59e0b]"></span> Recompensa: 1 Ticket
                                   </div>
                               </div>

                               {/* Card 2 */}
                               <div className="glass-panel p-8 holographic-hover transition-all duration-500 hover:border-amber-500/30 group">
                                   <div className="flex justify-between items-start mb-6">
                                       <span className="text-[10px] border border-white/10 px-2 py-1 uppercase tracking-widest text-gray-400 group-hover:text-white group-hover:border-white/30 transition-colors">Fácil</span>
                                   </div>
                                   <h3 className="text-xl text-white font-light mb-2">Realizar 3 Rondas</h3>
                                   <div className="w-full h-[1px] bg-white/10 mb-4 group-hover:bg-amber-500/50 transition-colors"></div>
                                   <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                       Realizar <strong className="text-white">03 rondas</strong> (Divulgação/Recrutamento).
                                   </p>
                                   <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-500/70">
                                       <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_#f59e0b]"></span> Recompensa: 1 Ticket
                                   </div>
                               </div>

                               {/* Card 3 - Featured */}
                               <div className="md:col-span-2 glass-panel relative p-8 hover:border-amber-500/50 transition-all duration-500 group overflow-hidden">
                                   {/* Animated Gradient Background */}
                                   <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                                   <div className="flex justify-between items-start mb-6 relative z-10">
                                       <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">Intermediária</span>
                                   </div>
                                   <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
                                       <div>
                                           <h3 className="text-2xl text-white mb-3">Recrutamento</h3>
                                           <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                               Recrutar <strong className="text-white">01 novo policial</strong> à RCC com perfil ativo no System.
                                           </p>
                                           <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                                               <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span> Recompensa: 1 Ticket
                                           </div>
                                       </div>
                                       <div className="h-full bg-black/40 backdrop-blur-md rounded-lg p-4 border border-white/5 flex flex-col justify-center transform group-hover:scale-[1.02] transition-transform duration-500">
                                           <p className="text-[10px] text-gray-500 italic text-center">"Todo novo ciclo é uma oportunidade de recomeçar, é uma nova chance de reaprender e refazer."</p>
                                       </div>
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          </section>

        </main>

        <footer className="py-8 border-t border-white/5 bg-black text-center relative z-10">
          <p className="text-gray-600 text-[10px] uppercase tracking-[0.4em] flex justify-center items-center gap-4">
            <span>RCC &copy; 2026</span>
            <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
            <span className="text-amber-500/50">Dev .Brendon</span>
          </p>
        </footer>
      </div>
    </React.Fragment>
  );
};

export default App;