import React, { useEffect, useRef } from 'react';

const BackgroundEffects: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Setup Canvas Resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Particle Configuration
    const PARTICLE_COUNT = 150;
    const particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      density: number;
      color: string;
      alpha: number;
      pulseSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 2 + 0.5;
        this.density = (Math.random() * 30) + 1;
        
        // Cores de Ouro e Luz
        const colors = ['#FFD700', '#FBF5B7', '#D4AF37', '#FFFFFF', '#B8860B'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.alpha = Math.random() * 0.5 + 0.1;
        this.pulseSpeed = 0.02;
      }

      draw() {
        if (!ctx) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      update() {
        // Mouse Interaction (Parallax / Avoidance)
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        
        // Normaliza posição do mouse (-1 a 1)
        const mouseNormX = (mouseRef.current.x / width) * 2 - 1;
        const mouseNormY = (mouseRef.current.y / height) * 2 - 1;

        // Move a base levemente contra o mouse (Parallax Effect)
        const moveX = mouseNormX * this.density * 2; 
        const moveY = mouseNormY * this.density * 2;

        this.x += (this.baseX - moveX - this.x) * 0.05;
        this.y += (this.baseY - moveY - this.y) * 0.05;

        // Twinkle effect
        this.alpha += this.pulseSpeed;
        if (this.alpha > 0.8 || this.alpha < 0.1) this.pulseSpeed = -this.pulseSpeed;
      }
    }

    // Initialize
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      if (!ctx || !canvas) return;
      
      // Draw Gradient Background Layer (Deep Space Gold) - COBRE A TELA
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      gradient.addColorStop(0, '#0f0800'); // Centro levemente marrom/dourado escuro
      gradient.addColorStop(0.6, '#050200');
      gradient.addColorStop(1, '#000000'); // Bordas pretas
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
          p.update();
          p.draw();
      });
      
      // Draw connection lines for constellations
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 0.5;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 80) {
            ctx.globalAlpha = 0.1 * (1 - distance / 80);
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Event Listeners
    const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Re-init particles on resize to avoid clustering
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(new Particle());
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }} 
    />
  );
};

export default BackgroundEffects;