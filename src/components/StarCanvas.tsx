import React, { useEffect, useRef } from 'react';

export const StarCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: Array<{ x: number; y: number; r: number; a: number; s: number }> = [];
    let W = window.innerWidth;
    let H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrameId: number;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: Math.min(180, Math.floor(W / 7)) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.7 + 0.2,
        s: Math.random() * 0.25 + 0.05,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        s.y += s.s;
        if (s.y > H) s.y = 0;
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#d9d1c2';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-40"
    />
  );
};
