import type { NextApiRequest, NextApiResponse } from "next";
import {
  getContactSettings,
  saveContactSettings,
  type ContactSettings,
} from "@/lib/api-server/db";
import { getSessionUser } from "@/lib/api-server/auth";

let inMemorySettings: ContactSettings = {
  gmailAppPassword: "",
  contactToEmail: "",
  contactFromEmail: "",
};

function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; errno?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const errno = typeof candidate.errno === "number" || typeof candidate.errno === "string" ? String(candidate.errno) : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ENOTFOUND" || errno === "-4078" || /ECONNREFUSED|ECONNRESET|connect/i.test(message);
}

// ---------------------------------------------------------------------
// /api/settings — admin-only. Contact-form delivery settings (Resend API
// key + addresses), stored in Postgres instead of environment variables
// so they're editable from the admin UI without a redeploy.
//
//   GET /api/settings -> current settings (resendApiKey is masked)
//   PUT /api/settings -> save settings
// ---------------------------------------------------------------------

function isValidSettings(value: unknown): value is ContactSettings {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.gmailAppPassword === "string" &&
    typeof record.contactToEmail === "string" &&
    typeof record.contactFromEmail === "string"
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    if (req.method === "GET") {
      try {
        const settings = await getContactSettings();
        inMemorySettings = settings;
        return res.status(200).json({ settings });
      } catch (error) {
        if (isDatabaseUnavailableError(error)) {
          return res.status(200).json({ settings: inMemorySettings });
        }
        throw error;
      }
    }

    if (req.method === "PUT") {
      if (!isValidSettings(req.body)) {
        return res.status(400).json({ error: "Invalid settings payload." });
      }
      const next: ContactSettings = {
        gmailAppPassword: req.body.gmailAppPassword.trim(),
        contactToEmail: req.body.contactToEmail.trim(),
        contactFromEmail: req.body.contactFromEmail.trim(),
      };

      try {
        await saveContactSettings(next);
      } catch (error) {
        if (isDatabaseUnavailableError(error)) {
          inMemorySettings = next;
          return res.status(200).json({ settings: inMemorySettings });
        }
        throw error;
      }

      inMemorySettings = next;
      return res.status(200).json({ settings: next });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Settings API error:", error);
    return res
      .status(500)
      .json({ error: (error as Error).message || "Something went wrong." });
  }
}
