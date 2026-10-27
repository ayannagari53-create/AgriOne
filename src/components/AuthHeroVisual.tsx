import React, { useEffect, useRef } from 'react';
import { Sprout, ShieldCheck, Radar, Droplets, Cpu } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  pulseSpeed: number;
  pulseOffset: number;
  type: 'nutrient' | 'spore' | 'leaf';
  rotation?: number;
  vRot?: number;
}

export const AuthHeroVisual: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize particles
    const particleCount = 45;
    const particles: Particle[] = [];
    const colors = ['#10B981', '#34D399', '#059669', '#6EE7B7', '#A7F3D0'];

    for (let i = 0; i < particleCount; i++) {
      const typeRand = Math.random();
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
        type: typeRand > 0.85 ? 'leaf' : typeRand > 0.6 ? 'nutrient' : 'spore',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Atmospheric Deep Radial Gradient
      const grad = ctx.createRadialGradient(
        width * 0.45,
        height * 0.45,
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      grad.addColorStop(0, '#0a2314');
      grad.addColorStop(0.4, '#06160d');
      grad.addColorStop(0.8, '#040d07');
      grad.addColorStop(1, '#020704');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Animated 3D Agricultural Contour Grid / Field Lines
      ctx.save();
      const horizonY = height * 0.62;
      const gridCols = 16;
      const gridRows = 12;

      for (let r = 0; r <= gridRows; r++) {
        const depth = r / gridRows;
        const rowY = horizonY + depth * depth * (height - horizonY);
        const rowAlpha = depth * 0.28;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(16, 185, 129, ${rowAlpha})`;
        ctx.lineWidth = 1;

        for (let c = 0; c <= gridCols; c++) {
          const colX = (c / gridCols) * width;
          const wave = Math.sin(c * 0.6 + time + r * 0.4) * 8 * depth;
          if (c === 0) {
            ctx.moveTo(colX, rowY + wave);
          } else {
            ctx.lineTo(colX, rowY + wave);
          }
        }
        ctx.stroke();
      }

      // Longitudinal perspective lines converging toward horizon
      for (let c = 0; c <= gridCols; c++) {
        const bottomX = (c / gridCols) * width;
        const horizonX = width * 0.5 + ((c / gridCols) - 0.5) * width * 0.25;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(5, 150, 105, 0.15)`;
        ctx.lineWidth = 1;
        ctx.moveTo(horizonX, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Floating spores/particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulseOffset += p.pulseSpeed;

        if (p.rotation !== undefined && p.vRot !== undefined) {
          p.rotation += p.vRot;
        }

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulseOffset));

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentOpacity;

        if (p.type === 'spore') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'nutrient') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#A7F3D0';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else if (p.type === 'leaf') {
          ctx.rotate(p.rotation || 0);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden select-none">
      {/* Background Interactive Animation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top: AgriOne Platform Badge */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t('app_full_name')}</span>
          <span className="text-emerald-700">•</span>
          <span>{t('core_online')}</span>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-800 p-0.5 shadow-xl shadow-emerald-950/80">
              <div className="w-full h-full bg-[#06140b] rounded-[14px] flex items-center justify-center">
                <Sprout className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-sans">
                AGRI<span className="text-emerald-400">ONE</span>
              </h1>
              <p className="text-xs font-mono uppercase tracking-widest text-emerald-400/80 font-bold">
                {t('tagline')}
              </p>
            </div>
          </div>
          
          <p className="text-sm sm:text-base text-emerald-100 font-medium mt-3 italic drop-shadow-md">
            &ldquo;{t('subtagline')}&rdquo;
          </p>
        </div>
      </div>

      {/* Middle: Floating Precision Telemetry Highlights */}
      <div className="relative z-10 my-8 space-y-3 max-w-md hidden md:block">
        <div className="p-3.5 rounded-2xl bg-[#06170d]/80 border border-emerald-500/30 backdrop-blur-md shadow-2xl flex items-center gap-3.5 transform hover:translate-x-1 transition-transform">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <span>{t('auth_feature_irrigation')}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">FAO-56</span>
            </div>
            <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
              Penman-Monteith daily gross depth & volumetric irrigation
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#06170d]/80 border border-emerald-500/30 backdrop-blur-md shadow-2xl flex items-center gap-3.5 transform hover:translate-x-1 transition-transform">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Radar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <span>{t('auth_feature_satellite')}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">NDVI / NDWI</span>
            </div>
            <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
              10-meter bottom-of-atmosphere canopy chlorophyll zonation
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#06170d]/80 border border-emerald-500/30 backdrop-blur-md shadow-2xl flex items-center gap-3.5 transform hover:translate-x-1 transition-transform">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <span>{t('auth_feature_cv')}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Gemini 3.8</span>
            </div>
            <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
              Evidence-based leaf pathology diagnosis & curative regimens
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Information */}
      <div className="relative z-10 pt-4 border-t border-emerald-950/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-emerald-400/80">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Enterprise Encrypted Agronomic Core</span>
        </div>
        <div className="text-[10px] text-emerald-600">
          Zero Plain-text Storage • PBKDF2-HMAC
        </div>
      </div>
    </div>
  );
};
