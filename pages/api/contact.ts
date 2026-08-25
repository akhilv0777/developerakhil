import type { NextApiRequest, NextApiResponse } from "next";
import { insertContactMessage } from "@/lib/api-server/db";
import { sendContactEmail } from "@/lib/api-server/mailer";

// ---------------------------------------------------------------------
// /api/contact — public endpoint. Saves the message to Postgres and then
// attempts to send an email if the configured Gmail details are available.
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    await insertContactMessage({ name: name.trim(), email: email.trim(), message: message.trim() });
  } catch (error) {
    console.error("Failed to save contact message:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }

  try {
    await sendContactEmail({ name: name.trim(), email: email.trim(), message: message.trim() });
  } catch (error) {
    console.error("Contact email delivery failed:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }

  return res.status(200).json({ ok: true, saved: true });
}
