import type { NextApiRequest, NextApiResponse } from "next";
import { deleteContactMessages, listContactMessages } from "@/lib/api-server/db";
import { getSessionUser } from "@/lib/api-server/auth";

let inMemoryMessages: Array<{ id: number; name: string; email: string; message: string; createdAt: string; replied: boolean; repliedAt: string | null }> = [];

function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; errno?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const errno = typeof candidate.errno === "number" || typeof candidate.errno === "string" ? String(candidate.errno) : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ENOTFOUND" || errno === "-4078" || /ECONNREFUSED|ECONNRESET|connect/i.test(message);
}

// ---------------------------------------------------------------------
// /api/messages — admin-only. Contact-form submissions live in Postgres
// (contact_messages table), not just email, so they're never lost even
// if the Resend send fails or isn't configured yet.
//
//   GET    /api/messages            -> list all messages, newest first
//   DELETE /api/messages?id=123     -> delete a single message
//   DELETE /api/messages  { ids: [1,2,3] }  -> bulk delete
// ---------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    if (req.method === "GET") {
      try {
        const messages = await listContactMessages();
        inMemoryMessages = messages;
        return res.status(200).json({ messages });
      } catch (error) {
        if (isDatabaseUnavailableError(error)) {
          return res.status(200).json({ messages: inMemoryMessages });
        }
        throw error;
      }
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

      try {
        const deleted = await deleteContactMessages(ids);
        if (deleted > 0) {
          inMemoryMessages = inMemoryMessages.filter((message) => !ids.includes(message.id));
        }
        return res.status(200).json({ deleted });
      } catch (error) {
        if (isDatabaseUnavailableError(error)) {
          const deleted = inMemoryMessages.filter((message) => ids.includes(message.id)).length;
          inMemoryMessages = inMemoryMessages.filter((message) => !ids.includes(message.id));
          return res.status(200).json({ deleted });
        }
        throw error;
      }
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
