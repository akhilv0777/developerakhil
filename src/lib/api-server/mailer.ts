import nodemailer from "nodemailer";
import { getContactSettings } from "@/lib/api-server/db";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendContactEmail(input: {
  name: string;
  email: string;
  message: string;
}) {
  const settings = await getContactSettings();

  const gmailUser = (settings.contactFromEmail || settings.contactToEmail || process.env.GMAIL_USER || "").trim();
  const recipient = (settings.contactToEmail || process.env.GMAIL_USER || "").trim();
  const gmailAppPassword = (settings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");

  if (!gmailUser) {
    throw new Error("Missing sender Gmail address. Configure contactFromEmail or GMAIL_USER.");
  }

  if (!recipient) {
    throw new Error("Missing recipient email. Configure contactToEmail.");
  }

  if (!gmailAppPassword) {
    throw new Error("Missing Gmail app password. Configure gmailAppPassword or GMAIL_APP_PASSWORD.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.verify();

  const result = await transporter.sendMail({
    from: `"${input.name}" <${gmailUser}>`,
    to: recipient,
    replyTo: input.email,
    subject: `New message from ${input.name}`,

    html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
        <p>
          <strong>Name:</strong>
          ${escapeHtml(input.name)}
        </p>

        <p>
          <strong>Email:</strong>
          ${escapeHtml(input.email)}
        </p>

        <p><strong>Message:</strong></p>

        <p>
          ${escapeHtml(input.message).replace(/\n/g, "<br />")}
        </p>
      </div>
    `,

    text: [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      "",
      input.message,
    ].join("\n"),
  });

  console.log("Gmail email sent:", {
    messageId: result.messageId,
    response: result.response,
    accepted: result.accepted,
    rejected: result.rejected,
  });

  return result;
}
export { sendContactEmail };
