import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Animação de progresso suave baseada em tempo (não linear para parecer mais natural)
    const duration = 2500; 
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      
      // Easing function: easeOutQuart
      const ease = 1 - Math.pow(1 - t, 4);
      
      setProgress(ease * 100);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => setIsFading(true), 200);
        setTimeout(() => {
          setVisible(false);
          onComplete();
        }, 1200); // Tempo para o fade terminar
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative flex flex-col items-center gap-8">
        
        {/* Monolith Loader */}
        <div className="relative w-[2px] h-32 bg-white/10 overflow-hidden">
            {/* Fill Bar */}
            <div 
                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-amber-600 via-amber-400 to-white shadow-[0_0_20px_rgba(212,175,55,0.8)]"
                style={{ height: `${progress}%`, transition: 'height 0.1s linear' }}
            ></div>
        </div>

        {/* Text Status */}
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-editorial text-white tracking-[0.2em]">
                RCC <span className="text-amber-500">2026</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                    {progress < 100 ? `Carregando Módulos... ${Math.floor(progress)}%` : 'Inicialização Completa'}
                </span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LoadingScreen;