"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useState } from "react";

type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  accepted: boolean;
  timestamp: string;
};

const STORAGE_KEY = "portfolio-cookie-consent";
const COOKIE_NAME = "portfolio_cookie_consent";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return value ? decodeURIComponent(value.split("=").slice(1).join("=")) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
}

function getDefaultConsent(): ConsentState {
  return {
    essential: true,
    analytics: false,
    marketing: false,
    accepted: false,
    timestamp: new Date().toISOString(),
  };
}

function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      accepted: Boolean(parsed.accepted || parsed.analytics || parsed.marketing),
      timestamp:
        typeof parsed.timestamp === "string"
          ? parsed.timestamp
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(() => {
    if (typeof window === "undefined") return null;

    const existingFromStorage = parseConsent(localStorage.getItem(STORAGE_KEY));
    const existingFromCookie = parseConsent(readCookie(COOKIE_NAME));
    return existingFromStorage ?? existingFromCookie ?? getDefaultConsent();
  });

  const updateConsent = (nextConsent: ConsentState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConsent));
    } catch {
      // Ignore storage quota issues silently.
    }
    writeCookie(COOKIE_NAME, JSON.stringify(nextConsent));
    setConsent(nextConsent);
  };

  const handleAcceptAll = () => {
    updateConsent({
      essential: true,
      analytics: true,
      marketing: true,
      accepted: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleReject = () => {
    updateConsent({
      essential: true,
      analytics: false,
      marketing: false,
      accepted: true,
      timestamp: new Date().toISOString(),
    });
  };

  const showBanner = consent && !consent.accepted;

  return (
    <>
      {showBanner && (
        <div className="fixed inset-x-4 bottom-4 z-[80] sm:left-auto sm:right-4 sm:w-[min(92vw,560px)]">
          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,140,68,0.22),_transparent_30%),linear-gradient(135deg,_rgba(12,14,20,0.96),_rgba(20,23,30,0.9))] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-orange-300">
                  Cookie consent
                </p>
                <p className="max-w-[34ch] text-sm leading-6 text-zinc-200">
                  We use essential cookies for security and session handling. Analytics cookies improve performance, and they only run after you accept them.
                </p>
              </div>

              <div className="flex gap-2 sm:flex-col">
                <button
                  type="button"
                  onClick={handleReject}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-100 transition-colors hover:border-orange-300/60 hover:text-orange-200"
                >
                  Only essential
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {consent?.analytics ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
    </>
  );
}
