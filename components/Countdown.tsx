import React from 'react';

const Countdown = () => {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  React.useEffect(() => {
    const targetDate = new Date(`January 1, ${new Date().getFullYear() + 1} 00:00:00`).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full py-40 overflow-hidden flex flex-col items-center justify-center bg-transparent border-t border-b border-white/5">
        
        {/* Background Elements (Local spins) */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full opacity-20 animate-[spin_120s_linear_infinite]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full opacity-30 animate-[spin_80s_linear_infinite_reverse]"></div>
        </div>

        <div className="relative z-10 mb-20 text-center">
             <div className="inline-flex items-center gap-2 border border-amber-500/30 px-4 py-1 rounded-full bg-black/50 backdrop-blur-md mb-6">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                 <span className="text-[10px] text-amber-500 uppercase tracking-[0.3em]">Sincronização Global</span>
             </div>
             <h3 className="text-4xl md:text-6xl text-white font-editorial tracking-wide">
                 Contagem <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600">Final</span>
             </h3>
        </div>

        <div className="flex flex-wrap justify-center items-center relative z-10 gap-4 md:gap-0">
            {/* Simple layout without complex SVG math for stability, focusing on Typography */}
            
            <div className="flex flex-col items-center mx-4 group cursor-default">
                 <span className="text-6xl md:text-9xl font-editorial text-white group-hover:text-amber-400 transition-colors duration-500 drop-shadow-2xl">
                     {timeLeft.days.toString().padStart(2, '0')}
                 </span>
                 <span className="text-[10px] uppercase tracking-[0.5em] text-gray-500 mt-4 border-t border-white/10 pt-2 w-full text-center">Dias</span>
            </div>

            <span className="text-4xl md:text-6xl text-amber-500/20 font-light -mt-8">:</span>

            <div className="flex flex-col items-center mx-4 group cursor-default">
                 <span className="text-6xl md:text-9xl font-editorial text-white group-hover:text-amber-400 transition-colors duration-500 drop-shadow-2xl">
                     {timeLeft.hours.toString().padStart(2, '0')}
                 </span>
                 <span className="text-[10px] uppercase tracking-[0.5em] text-gray-500 mt-4 border-t border-white/10 pt-2 w-full text-center">Horas</span>
            </div>

            <span className="text-4xl md:text-6xl text-amber-500/20 font-light -mt-8">:</span>

            <div className="flex flex-col items-center mx-4 group cursor-default">
                 <span className="text-6xl md:text-9xl font-editorial text-white group-hover:text-amber-400 transition-colors duration-500 drop-shadow-2xl">
                     {timeLeft.minutes.toString().padStart(2, '0')}
                 </span>
                 <span className="text-[10px] uppercase tracking-[0.5em] text-gray-500 mt-4 border-t border-white/10 pt-2 w-full text-center">Min</span>
            </div>

            <span className="text-4xl md:text-6xl text-amber-500/20 font-light -mt-8">:</span>

            <div className="flex flex-col items-center mx-4 group cursor-default relative">
                 <span className="text-6xl md:text-9xl font-editorial text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 drop-shadow-[0_0_30px_rgba(212,175,55,0.4)] animate-pulse">
                     {timeLeft.seconds.toString().padStart(2, '0')}
                 </span>
                 <span className="text-[10px] uppercase tracking-[0.5em] text-amber-500 mt-4 border-t border-amber-500/30 pt-2 w-full text-center font-bold">Seg</span>
            </div>
        </div>
    </div>
  );
};

export default Countdown;