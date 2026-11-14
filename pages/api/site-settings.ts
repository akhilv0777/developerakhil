import type { NextApiRequest, NextApiResponse } from "next";
import { getContactSettings } from "@/lib/api-server/db";
import {
  DEFAULT_TRANSLATION_LANGUAGES,
  normalizeTranslationLanguages,
  type TranslationLanguageCode,
} from "@/lib/portfolio-types";
import { normalizeGoogleAnalyticsMeasurementId } from "@/lib/google-analytics";
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
    return countryLanguage;
  }

  const acceptLanguage = getFirstHeaderValue(req.headers["accept-language"]);
  const browserLanguages = acceptLanguage
    .split(",")
    .map((value) => value.split(";")[0].trim())
    .filter(Boolean);
  const browserLanguage = browserLanguages
    .map((locale) => {
      const exactMatch = enabledLanguages.find(
        (code) => code.toLowerCase() === locale.toLowerCase(),
      );
      if (exactMatch) return exactMatch;

      const baseLanguage = locale.split("-")[0].toLowerCase();
      return enabledLanguages.find(
        (code) => code.split("-")[0].toLowerCase() === baseLanguage,
      );
    })
    .find((code): code is TranslationLanguageCode => Boolean(code));

  return browserLanguage || "en";
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
      seoTitle: settings.seoTitle,
      siteDescription: settings.siteDescription,
      siteKeywords: settings.siteKeywords,
      openGraphTitle: settings.openGraphTitle,
      openGraphDescription: settings.openGraphDescription,
      translationLanguages,
      preferredLanguage: getPreferredLanguage(req, translationLanguages),
      siteUrl: settings.siteUrl,
      openGraphImage: settings.openGraphImage,
      faviconUrl: settings.faviconUrl,
      twitterHandle: settings.twitterHandle,
      allowIndexing: settings.allowIndexing,
      googleAdsenseAccount: settings.googleAdsenseAccount,
      googleAnalyticsMeasurementId: normalizeGoogleAnalyticsMeasurementId(
        settings.googleAnalyticsMeasurementId,
      ),
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
      seoTitle: "",
      siteDescription: "",
      siteKeywords: "",
      openGraphTitle: "",
      openGraphDescription: "",
      translationLanguages,
      preferredLanguage: getPreferredLanguage(req, translationLanguages),
      siteUrl: "https://developerakhil.site/",
      openGraphImage: "/og-image.svg",
      faviconUrl: "",
      twitterHandle: "@akhilesh",
      allowIndexing: true,
      googleAdsenseAccount: "",
      googleAnalyticsMeasurementId: "",
      twoFactorEnabled: false,
      turnstileSiteKey: hasEnvTurnstile ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : "",
    });
  }
}