import React, { useEffect, useRef } from 'react';

const GoldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    
    // Resize function specifically for the container size
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

    // Particles (Bubbles/Gold Dust)
    const particles: Particle[] = [];
    const PARTICLE_COUNT = 80;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 1 + 0.2; // Floating UP
        // Golden palette
        const colors = ['#FFD700', '#FBF5B7', '#D4AF37', '#DAA520'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.y -= this.speedY;

        // Interaction: Mouse repulsion
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - (mouseRef.current.y - (canvas.getBoundingClientRect().top)); // Adjust mouse Y relative to canvas
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
            this.x += dx * 0.05;
            this.y += dy * 0.05;
        }

        // Reset if out of bounds
        if (this.y < -10) {
            this.y = height + 10;
            this.x = Math.random() * width;
        }
      }

      draw() {
        ctx!.globalAlpha = this.alpha;
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
        
        // Shine effect
        ctx!.shadowBlur = 10;
        ctx!.shadowColor = this.color;
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw Gradient Background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#4a3b10'); // Dark Gold Top
      gradient.addColorStop(1, '#000000'); // Black Bottom
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.shadowBlur = 0;

      particles.forEach(p => {
          p.update();
          p.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
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

export default GoldBackground;