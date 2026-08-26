import type { NextApiRequest, NextApiResponse } from "next";
import {
  deleteAdminNotifications,
  listAdminNotifications,
  markAdminNotificationsRead,
} from "@/lib/api-server/db";
import { getSessionUser } from "@/lib/api-server/auth";

function getIds(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    : [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!getSessionUser(req)) return res.status(401).json({ error: "Not authenticated" });

  try {
    if (req.method === "GET") {
      const notifications = await listAdminNotifications();
      return res.status(200).json({ notifications });
    }
    const ids = getIds(req.body?.ids);
    if (ids.length === 0) return res.status(400).json({ error: "Provide notification ids." });
    if (req.method === "PATCH") {
      await markAdminNotificationsRead(ids);
      return res.status(200).json({ ok: true });
    }
    if (req.method === "DELETE") {
      const deleted = await deleteAdminNotifications(ids);
      return res.status(200).json({ deleted });
    }
    res.setHeader("Allow", "GET, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Notifications API error:", error);
    return res.status(500).json({ error: (error as Error).message || "Something went wrong." });
  }
}