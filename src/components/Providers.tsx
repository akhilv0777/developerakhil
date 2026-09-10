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
    const themeNode = document.querySelector<HTMLElement>(
      ".admin-console, .dark, .light",
    );
    const primary =
      getComputedStyle(themeNode || document.documentElement)
        .getPropertyValue("--primary")
        .trim() || "24 95% 53%";

    type Ripple = { x: number; y: number; radius: number; strength: number };
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
    };

    const addRipple = (x: number, y: number, strength: number) => {
      ripples.push({ x, y, radius: 2, strength });
      if (ripples.length > 28) ripples.shift();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const distance =
        lastX < 0 ? Infinity : Math.hypot(event.clientX - lastX, event.clientY - lastY);
      if (distance > 10 && event.timeStamp - lastRippleAt > 48) {
        addRipple(event.clientX, event.clientY, Math.min(1, 0.28 + distance / 80));
        lastRippleAt = event.timeStamp;
      }
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("input, button, a")) return;
      addRipple(event.clientX, event.clientY, 1.8);
    };
    const animate = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.globalCompositeOperation = "screen";
      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        ripple.radius += 1.55;
        ripple.strength *= 0.965;
        if (ripple.strength < 0.018) {
          ripples.splice(index, 1);
          continue;
        }
        for (let ring = 0; ring < 3; ring += 1) {
          const radius = ripple.radius + ring * 13;
          const opacity = ripple.strength * (0.3 - ring * 0.07);
          context.beginPath();
          context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
          context.strokeStyle = `hsl(${primary} / ${opacity})`;
          context.lineWidth = ring === 0 ? 1.8 : 1;
          context.stroke();
        }
      }
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
