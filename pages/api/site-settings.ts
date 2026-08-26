import type { NextApiRequest, NextApiResponse } from "next";
import { getContactSettings } from "@/lib/api-server/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const settings = await getContactSettings();
    return res.status(200).json({ siteName: settings.siteName, faviconUrl: settings.faviconUrl });
  } catch {
    return res.status(200).json({ siteName: "Akhilesh Vishwakarma", faviconUrl: "" });
  }
}