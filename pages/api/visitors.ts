import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";
import {
  deleteVisitorEvents,
  listVisitorEvents,
  recordVisitorEvent,
} from "@/lib/api-server/db";
import { getSessionUser } from "@/lib/api-server/auth";
import { getVisitorMetadata } from "@/lib/visitor-utils";

const VISITOR_SESSION_COOKIE = "visitor_session";

function getCookieValue(req: NextApiRequest, name: string): string {
  const cookies = req.headers.cookie?.split(";") ?? [];
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : "";
}

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

  if (req.method === "DELETE") {
    const queryId = typeof req.query.id === "string" ? Number(req.query.id) : null;
    const bodyIds = Array.isArray(req.body?.ids)
      ? req.body.ids.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value))
      : [];
    const ids = queryId && Number.isFinite(queryId) ? [queryId] : bodyIds;
    if (ids.length === 0) {
      return res.status(400).json({ error: "Provide an id query param or a body of { ids: number[] }." });
    }
    try {
      const deleted = await deleteVisitorEvents(ids);
      return res.status(200).json({ deleted });
    } catch (error) {
      console.error("Visitor delete error:", error);
      return res.status(500).json({ error: (error as Error).message || "Could not delete visitors." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const payloadSessionId = typeof payload.sessionId === "string" && /^[a-f0-9-]{36}$/i.test(payload.sessionId)
      ? payload.sessionId
      : "";
    const sessionId = payloadSessionId || getCookieValue(req, VISITOR_SESSION_COOKIE) || randomUUID();
    res.setHeader(
      "Set-Cookie",
      `${VISITOR_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Max-Age=1800; Path=/; HttpOnly; SameSite=Lax`,
    );
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
    metadata.pathname = "";
    metadata.referrer = "";

    await recordVisitorEvent({ ...metadata, sessionId });
    return res.status(200).json({ ok: true, saved: true });
  } catch (error) {
    console.error("Visitor tracking failed:", error);
    return res.status(500).json({ ok: false, message: "Failed to save visitor information" });
  }
}
