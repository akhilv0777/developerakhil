import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteContactMessages, listContactMessages } from "./_lib/db.js";
import { getSessionUser } from "./_lib/auth.js";

// ---------------------------------------------------------------------
// /api/messages — admin-only. Contact-form submissions live in Postgres
// (contact_messages table), not just email, so they're never lost even
// if the Resend send fails or isn't configured yet.
//
//   GET    /api/messages            -> list all messages, newest first
//   DELETE /api/messages?id=123     -> delete a single message
//   DELETE /api/messages  { ids: [1,2,3] }  -> bulk delete
// ---------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    if (req.method === "GET") {
      const messages = await listContactMessages();
      return res.status(200).json({ messages });
    }

    if (req.method === "DELETE") {
      const queryId =
        typeof req.query.id === "string" ? Number(req.query.id) : null;
      const bodyIds = Array.isArray(req.body?.ids)
        ? req.body.ids
            .map((value: unknown) => Number(value))
            .filter((value: number) => Number.isFinite(value))
        : [];
      const ids = queryId && Number.isFinite(queryId) ? [queryId] : bodyIds;

      if (ids.length === 0) {
        return res
          .status(400)
          .json({
            error: "Provide an id query param or a body of { ids: number[] }.",
          });
      }

      const deleted = await deleteContactMessages(ids);
      return res.status(200).json({ deleted });
    }

    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Messages API error:", error);
    return res
      .status(500)
      .json({ error: (error as Error).message || "Something went wrong." });
  }
}
