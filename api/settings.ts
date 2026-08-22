import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getContactSettings,
  saveContactSettings,
  type ContactSettings,
} from "./_lib/db.js";
import { getSessionUser } from "./_lib/auth.js";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    if (req.method === "GET") {
      const settings = await getContactSettings();
      return res.status(200).json({ settings });
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
      await saveContactSettings(next);
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
