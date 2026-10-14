import type { NextApiRequest, NextApiResponse } from "next";
import { getContactSettings } from "@/lib/api-server/db";
import {
  DEFAULT_TRANSLATION_LANGUAGES,
  normalizeTranslationLanguages,
  type TranslationLanguageCode,
} from "@/lib/portfolio-types";
import translationConfig from "@/lib/translation-config.json";

function getFirstHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function getPreferredLanguage(
  req: NextApiRequest,
  enabledLanguages: TranslationLanguageCode[],
): TranslationLanguageCode {
  const enabled = new Set<string>(enabledLanguages);
  const country = getFirstHeaderValue(
    req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"],
  ).toUpperCase();
  const countryMap = translationConfig.countryToLanguage as Record<
    string,
    string
  >;
  const countryLanguage = countryMap[country];
  if (countryLanguage && enabled.has(countryLanguage)) {
    return countryLanguage as TranslationLanguageCode;
  }

  const acceptLanguage = getFirstHeaderValue(req.headers["accept-language"]);
  const browserLanguage = acceptLanguage
    .split(",")
    .map((value) => value.split(";")[0].trim().split("-")[0].toLowerCase())
    .find((code) => enabled.has(code));

  return (browserLanguage || "en") as TranslationLanguageCode;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const settings = await getContactSettings();
    const translationLanguages = normalizeTranslationLanguages(
      settings.translationLanguages,
    );
    const turnstileSiteKey = settings.turnstileSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
    const turnstileSecret = settings.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY || "";
    const turnstileHostnames = settings.turnstileHostnames || process.env.TURNSTILE_HOSTNAMES || "";
    return res.status(200).json({
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      siteKeywords: settings.siteKeywords,
      translationLanguages,
      preferredLanguage: getPreferredLanguage(req, translationLanguages),
      siteUrl: settings.siteUrl,
      openGraphImage: settings.openGraphImage,
      faviconUrl: settings.faviconUrl,
      googleAdsenseAccount: settings.googleAdsenseAccount,
      twoFactorEnabled: Boolean(settings.twoFactorEnabled),
      turnstileSiteKey: turnstileSiteKey && turnstileSecret && turnstileHostnames ? turnstileSiteKey : "",
    });
  } catch {
    const translationLanguages = normalizeTranslationLanguages(
      DEFAULT_TRANSLATION_LANGUAGES,
    );
    const hasEnvTurnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_HOSTNAMES;
    return res.status(200).json({
      siteName: "Akhilesh Vishwakarma",
      siteDescription: "",
      siteKeywords: "",
      translationLanguages,
      preferredLanguage: getPreferredLanguage(req, translationLanguages),
      siteUrl: "https://www.akhilesh-vishwakarma.com",
      openGraphImage: "/og-image.svg",
      faviconUrl: "",
      googleAdsenseAccount: "",
      twoFactorEnabled: false,
      turnstileSiteKey: hasEnvTurnstile ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : "",
    });
  }
}