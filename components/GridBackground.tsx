import React from 'react';

const GridBackground = () => {
  const canvasRef = React.useRef(null);
  const mouseRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;

    const handleResize = () => {
      if(canvas.parentElement) {
          width = canvas.parentElement.offsetWidth;
          height = canvas.parentElement.offsetHeight;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const gridSize = 40;

    let animationId;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Background Dark
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      const canvasRect = canvas.getBoundingClientRect();
      const relativeMouseY = mouseRef.current.y - canvasRect.top;

      ctx.lineWidth = 1;

      // Draw Grid
      for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
           // Calculate distance to mouse
           const dx = x - mouseRef.current.x;
           const dy = y - relativeMouseY;
           const dist = Math.sqrt(dx * dx + dy * dy);
           
           let alpha = 0.05; // Base visibility
           
           // Highlight near mouse
           if (dist < 150) {
               alpha = 0.4 * (1 - dist / 150);
           }

           ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`; // Gold color lines
           
           // Draw horizontal segment
           ctx.beginPath();
           ctx.moveTo(x, y);
           ctx.lineTo(x + gridSize, y);
           ctx.stroke();

           // Draw vertical segment
           ctx.beginPath();
           ctx.moveTo(x, y);
           ctx.lineTo(x, y + gridSize);
           ctx.stroke();

           // Small cross at intersection if close to mouse
           if (dist < 100) {
               ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 2})`;
               ctx.fillRect(x - 1, y - 1, 2, 2);
           }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default GridBackground;