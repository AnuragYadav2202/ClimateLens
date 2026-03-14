"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const EARTH_DOTS_COUNT = 3000;
const ATMOSPHERE_PARTICLES = 100;

export function AnimatedGlobe({ isBackground = false }: { isBackground?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;
    const radius = isBackground ? 400 : 160;

    // Generate accurate-ish continental dots
    // We use a simplified map of earth's landmasses
    const earthDots: { lon: number; lat: number; opacity: number }[] = [];
    
    const continents = [
      { lat: [10, 70], lon: [-130, -60] },  // N America
      { lat: [-50, 10], lon: [-80, -35] },  // S America
      { lat: [35, 70], lon: [-10, 150] },   // Eurasia
      { lat: [-35, 35], lon: [-20, 50] },   // Africa
      { lat: [-45, -10], lon: [110, 155] }, // Australia
      { lat: [5, 35], lon: [60, 130] },     // S Asia
    ];

    for (let i = 0; i < EARTH_DOTS_COUNT; i++) {
      const c = continents[Math.floor(Math.random() * continents.length)];
      earthDots.push({
        lat: c.lat[0] + Math.random() * (c.lat[1] - c.lat[0]),
        lon: c.lon[0] + Math.random() * (c.lon[1] - c.lon[0]),
        opacity: 0.2 + Math.random() * 0.6,
      });
    }

    const atmosphere = Array.from({ length: ATMOSPHERE_PARTICLES }, () => ({
      phi: Math.acos(2 * Math.random() - 1),
      theta: Math.random() * Math.PI * 2,
      r: radius * (1.05 + Math.random() * 0.15),
      size: 0.5 + Math.random() * 1,
      speed: 0.0001 + Math.random() * 0.0002,
      opacity: 0.1 + Math.random() * 0.2,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    const draw = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;

      // 1. Atmosphere / Outer Glow
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.4);
      glow.addColorStop(0, "rgba(56, 189, 248, 0.1)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // 2. The Spherical Body (Dark base)
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      const sphereGrad = ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.3, 0, cx, cy, radius);
      sphereGrad.addColorStop(0, "#081b33");
      sphereGrad.addColorStop(1, "#020617");
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // 3. Render Earth Continent Dots with 3D projection
      earthDots.forEach(p => {
        // Convert lat/lon to 3D Cartesian coords
        const phi = (90 - p.lat) * (Math.PI / 180);
        const theta = (p.lon + 180 + rotation * 50) * (Math.PI / 180);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        // Z-culling (Front side only)
        if (z > 0) {
          const sx = cx + x;
          const sy = cy - y; // Canvas y is inverted
          
          // Shading based on 'z' (darker towards edges)
          const shade = Math.pow(z / radius, 0.8);
          // Night side simulation (darken if on left side)
          const nightFactor = Math.max(0.2, (x + radius) / (radius * 2));
          
          ctx.beginPath();
          ctx.arc(sx, sy, isBackground ? 1.2 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 240, 255, ${p.opacity * shade * nightFactor})`;
          ctx.fill();
        }
      });

      // 4. Atmosphere Particles
      atmosphere.forEach(p => {
        p.theta += p.speed;
        const x = p.r * Math.sin(p.phi) * Math.cos(p.theta);
        const z = p.r * Math.sin(p.phi) * Math.sin(p.theta);
        const y = p.r * Math.cos(p.phi);

        if (z > 0) {
          ctx.beginPath();
          ctx.arc(cx + x, cy - y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(50, 230, 255, ${p.opacity})`;
          ctx.fill();
        }
      });

      // 5. Final cinematic shading overlay
      const overlay = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
      overlay.addColorStop(0, "transparent");
      overlay.addColorStop(1, "rgba(2, 6, 23, 0.7)");
      ctx.fillStyle = overlay;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      rotation += 0.005;
      draw();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animate();

    gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 2, delay: 0.5 });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [isBackground]);

  return (
    <div ref={containerRef} className={`relative w-full h-full flex items-center justify-center ${isBackground ? "fixed inset-0 pointer-events-none" : ""}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
