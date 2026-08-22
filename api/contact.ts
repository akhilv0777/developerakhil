import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendContactEmail } from "./_lib/mailer.js";

// ---------------------------------------------------------------------
// /api/contact — public endpoint. Called by the public site's contact
// form. Emails the message via Gmail.
//
//   POST /api/contact  { name, email, message } -> { ok: true }
//
// NOTE: messages.ts (GET/DELETE /api/messages) implies submissions are
// also expected to persist in Postgres. If you have a save function in
// _lib/db.js (e.g. saveContactMessage), import it here and call it
// before sendContactEmail so messages aren't lost when the email send
// fails. Check _lib/db.js for the exact function name/signature.
// ---------------------------------------------------------------------

function isValidPayload(
  value: unknown,
): value is { name: string; email: string; message: string } {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    record.name.trim().length > 0 &&
    typeof record.email === "string" &&
    record.email.trim().length > 0 &&
    typeof record.message === "string" &&
    record.message.trim().length > 0
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!isValidPayload(req.body)) {
    return res
      .status(400)
      .json({ message: "Please fill in your name, email, and message." });
  }

  const { name, email, message } = req.body;

  try {
    await sendContactEmail({ name, email, message });
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return res.status(500).json({
      message:
        (error as Error).message ||
        "Could not send your message. Please try again.",
    });
  }

  return res.status(200).json({ ok: true });
}