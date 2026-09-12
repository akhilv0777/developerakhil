"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function LiquidCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(pointer: coarse)").matches)
      return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const themeNode =
      document.querySelector<HTMLElement>(".admin-console, .dark, .light") ||
      document.documentElement;
    const computed = getComputedStyle(themeNode);
    const primary = computed.getPropertyValue("--primary").trim() || "24 95% 53%";
    const accent = computed.getPropertyValue("--accent").trim() || "190 80% 60%";
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark") ||
      computed.colorScheme === "dark";

    const glowColor = isDarkMode ? primary : "210 85% 60%";

    type Ripple = {
      x: number;
      y: number;
      radius: number;
      strength: number;
      hue: number;
      phase: number;
      spread: number;
    };
    const ripples: Ripple[] = [];
    let animationFrame = 0;
    let lastX = -1;
    let lastY = -1;
    let lastRippleAt = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
    };

    const addRipple = (x: number, y: number, strength: number) => {
      ripples.push({
        x,
        y,
        radius: 8,
        strength: Math.min(1.15, strength),
        hue: isDarkMode ? 186 : 198,
        phase: Math.random() * Math.PI,
        spread: isDarkMode ? 8 : 10,
      });
      if (ripples.length > 16) ripples.shift();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const distance =
        lastX < 0 ? Infinity : Math.hypot(event.clientX - lastX, event.clientY - lastY);
      if (distance > 12 && event.timeStamp - lastRippleAt > 42) {
        addRipple(
          event.clientX,
          event.clientY,
          Math.min(1.2, 0.18 + distance / 90),
        );
        lastRippleAt = event.timeStamp;
      }
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("input, button, a")) return;
      addRipple(event.clientX, event.clientY, 2);
    };
    const animate = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.globalCompositeOperation = "screen";
      context.filter = "blur(0.3px)";

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        ripple.radius += isDarkMode ? 1.6 : 1.9;
        ripple.strength *= 0.97;
        if (ripple.strength < 0.03) {
          ripples.splice(index, 1);
          continue;
        }

        const baseAlpha = Math.max(0.022, ripple.strength * (isDarkMode ? 0.38 : 0.46));
        const waveCount = isDarkMode ? 3 : 4;

        for (let ring = 0; ring < waveCount; ring += 1) {
          const radius = ripple.radius + ring * ripple.spread;
          const waveOffset = Math.sin(ripple.phase + ring * 0.85 + ripple.radius * 0.05) * 2.5;
          const x = ripple.x + waveOffset;
          const y = ripple.y + waveOffset * 0.3;
          const alpha = Math.max(0.018, baseAlpha - ring * 0.09);
          const stroke = `hsla(${ripple.hue + ring * 10} 90% 68% / ${alpha})`;

          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.lineWidth = ring === 0 ? 1.6 : ring === 1 ? 1.1 : 0.8;
          context.strokeStyle = stroke;
          context.shadowBlur = ring === 0 ? 9 : 6;
          context.shadowColor = `hsla(${ripple.hue + ring * 8} 90% 66% / ${Math.min(0.35, alpha + 0.08)})`;
          context.stroke();
        }

        const glow = context.createRadialGradient(
          ripple.x,
          ripple.y,
          0,
          ripple.x,
          ripple.y,
          ripple.radius * 1.1,
        );
        glow.addColorStop(0, `hsla(${ripple.hue} 90% 68% / ${Math.max(0.012, baseAlpha * 0.18)})`);
        glow.addColorStop(0.4, `hsla(${ripple.hue + 18} 92% 66% / ${Math.max(0.008, baseAlpha * 0.07)})`);
        glow.addColorStop(1, `hsla(${ripple.hue + 24} 90% 65% / 0)`);
        context.beginPath();
        context.fillStyle = glow;
        context.arc(ripple.x, ripple.y, ripple.radius * 1.2, 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = 0;
      context.filter = "none";
      context.globalCompositeOperation = "source-over";
      animationFrame = window.requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="liquid-water-canvas" aria-hidden="true" />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
      <LiquidCursor />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />
    </QueryClientProvider>
  );
}
