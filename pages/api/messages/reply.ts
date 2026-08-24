import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "@/lib/api-server/auth";
import { getContactSettings, listContactMessages, markMessageReplied } from "@/lib/api-server/db";
import nodemailer from "nodemailer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messageId, replyText } = req.body;

  if (!messageId || !replyText) {
    return res.status(400).json({ error: "Missing messageId or replyText" });
  }

  try {
    const username = getSessionUser(req);
    if (!username) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Get the original message
    const messages = await listContactMessages();
    const originalMessage = messages.find((m) => m.id === messageId);
    
    if (!originalMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    // 2. Get contact settings for Gmail setup
    const settings = await getContactSettings();
    const contactToEmail = settings.contactToEmail?.trim();
    const gmailAppPassword = settings.gmailAppPassword?.replace(/\s/g, "");

    if (!contactToEmail || !gmailAppPassword) {
      return res.status(400).json({ 
        error: "Gmail not configured. Please set it up in the Settings tab." 
      });
    }

    // 3. Send email reply
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: contactToEmail,
        pass: gmailAppPassword,
      },
    });

    await transporter.verify();

    const formattedReply = replyText.replace(/\n/g, "<br />");
    const formattedOriginal = originalMessage.message.replace(/\n/g, "<br />");

    await transporter.sendMail({
      from: `"${username} (Portfolio)" <${contactToEmail}>`,
      to: originalMessage.email,
      subject: `Re: New message from ${originalMessage.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
          <p>${formattedReply}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            On ${new Date(originalMessage.createdAt).toLocaleString()}, ${originalMessage.name} wrote:<br />
            <blockquote style="margin-left: 10px; padding-left: 10px; border-left: 3px solid #ccc; color: #555;">
              ${formattedOriginal}
            </blockquote>
          </p>
        </div>
      `,
      text: `${replyText}\n\n---\nOn ${new Date(originalMessage.createdAt).toLocaleString()}, ${originalMessage.name} wrote:\n> ${originalMessage.message}`,
    });

    // 4. Mark as replied in DB
    await markMessageReplied(messageId);

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Reply API error:", err);
    return res.status(500).json({ error: err.message || "Failed to send reply" });
  }
}
