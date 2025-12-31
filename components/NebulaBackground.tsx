import React, { useEffect, useRef } from 'react';

const NebulaBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    let time = 0;

    const handleResize = () => {
      if(canvas.parentElement) {
          width = canvas.parentElement.offsetWidth;
          height = canvas.parentElement.offsetHeight;
          canvas.width = width;
          canvas.height = height;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      time += 0.002;
      ctx.clearRect(0, 0, width, height);
      
      // Deep Space Base
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#050200'); 
      gradient.addColorStop(1, '#1a0f00'); 
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Liquid Gold Nebula Effect
      ctx.globalCompositeOperation = 'lighter';
      
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        const scale = i * 40;
        
        for (let x = 0; x <= width; x += 20) {
           // Complex wave math for organic movement
           const y = height / 2 + 
                     Math.sin(x / 300 + time * i) * scale + 
                     Math.cos(x / 400 - time * 2) * (scale * 0.5);
           
           if (x === 0) ctx.moveTo(x, y);
           else ctx.lineTo(x, y);
        }

        // Styles for different layers
        if (i % 2 === 0) {
            ctx.strokeStyle = `rgba(212, 175, 55, 0.15)`; // Gold
            ctx.lineWidth = 40;
        } else {
            ctx.strokeStyle = `rgba(184, 134, 11, 0.1)`; // Dark Gold
            ctx.lineWidth = 60;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#FFD700';
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default NebulaBackground;