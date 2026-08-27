"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; size: "invisible"; execution: "execute"; action: string; callback: (token: string) => void; "error-callback": () => void; "expired-callback": () => void }) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Cloudflare Turnstile."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function useTurnstile(action: string) {
  const [siteKey, setSiteKey] = useState(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const pendingRef = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null);
  const readyRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((response) => response.json())
      .then((settings) => setSiteKey(settings.turnstileSiteKey?.trim() || ""))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      pendingRef.current = null;
      readyRef.current = null;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  const ensureWidget = async () => {
    if (!siteKey || widgetIdRef.current) return;
    if (!readyRef.current) {
      readyRef.current = new Promise<void>((resolve, reject) => {
      loadTurnstile().then(() => {
        if (!containerRef.current || !window.turnstile) return reject(new Error("Cloudflare verification is unavailable."));
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey, size: "invisible", execution: "execute", action,
          callback: (token) => pendingRef.current?.resolve(token),
          "error-callback": () => pendingRef.current?.reject(new Error("Cloudflare verification failed.")),
          "expired-callback": () => pendingRef.current?.reject(new Error("Cloudflare verification expired.")),
        });
        resolve();
      }).catch(reject);
      });
    }
    await readyRef.current;
  };

  const execute = async () => {
    if (!siteKey) return Promise.resolve("");
    await ensureWidget();
    if (!widgetIdRef.current || !window.turnstile) return Promise.reject(new Error("Cloudflare verification is still loading."));
    return new Promise<string>((resolve, reject) => {
      const widgetId = widgetIdRef.current as string;
      const container = containerRef.current;
      if (!container || !window.turnstile) return reject(new Error("Cloudflare verification is unavailable."));
      pendingRef.current = { resolve, reject };
      window.turnstile.reset(widgetId);
      window.turnstile.execute(widgetId);
    });
  };

  return { containerRef, execute };
}