import type { NextApiRequest, NextApiResponse } from "next";
import {
  listVisitorEvents,
  recordVisitorEvent,
} from "@/lib/api-server/db";
import { getSessionUser } from "@/lib/api-server/auth";
import { getVisitorMetadata } from "@/lib/visitor-utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAuthenticated = await getSessionUser(req);
  if (!isAuthenticated && req.method !== "POST") {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.method === "GET") {
    try {
      const visitors = await listVisitorEvents(100);
      return res.status(200).json({ visitors });
    } catch (error) {
      console.error("Visitors list error:", error);
      return res.status(500).json({ error: (error as Error).message || "Something went wrong." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const metadata = getVisitorMetadata(req, {
      ipAddress: typeof payload.ipAddress === "string" ? payload.ipAddress : "",
      country: typeof payload.country === "string" ? payload.country : "",
      region: typeof payload.region === "string" ? payload.region : "",
      city: typeof payload.city === "string" ? payload.city : "",
      timezone: typeof payload.timezone === "string" ? payload.timezone : "",
      language: typeof payload.language === "string" ? payload.language : "",
      referrer: typeof payload.referrer === "string" ? payload.referrer : "",
      pathname: typeof payload.pathname === "string" ? payload.pathname : "",
      hostname: typeof payload.hostname === "string" ? payload.hostname : "",
      screenResolution: typeof payload.screenResolution === "string" ? payload.screenResolution : "",
      pageTitle: typeof payload.pageTitle === "string" ? payload.pageTitle : "",
      userAgent: typeof payload.userAgent === "string" ? payload.userAgent : "",
      isBot: typeof payload.isBot === "boolean" ? payload.isBot : undefined,
    });

    await recordVisitorEvent(metadata);
    return res.status(200).json({ ok: true, saved: true });
  } catch (error) {
    console.error("Visitor tracking failed:", error);
    return res.status(500).json({ ok: false, message: "Failed to save visitor information" });
  }
}
