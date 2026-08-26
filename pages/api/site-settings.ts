import type { NextApiRequest, NextApiResponse } from "next";
import { getContactSettings } from "@/lib/api-server/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const settings = await getContactSettings();
    const turnstileSiteKey = settings.turnstileSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
    const turnstileSecret = settings.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY || "";
    const turnstileHostnames = settings.turnstileHostnames || process.env.TURNSTILE_HOSTNAMES || "";
    return res.status(200).json({ siteName: settings.siteName, faviconUrl: settings.faviconUrl, turnstileSiteKey: turnstileSiteKey && turnstileSecret && turnstileHostnames ? turnstileSiteKey : "" });
  } catch {
    const hasEnvTurnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_HOSTNAMES;
    return res.status(200).json({ siteName: "Akhilesh Vishwakarma", faviconUrl: "", turnstileSiteKey: hasEnvTurnstile ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : "" });
  }
}