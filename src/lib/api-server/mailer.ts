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

export async function sendPasswordResetEmail(input: { recipient: string; resetUrl: string }) {
  const settings = await getContactSettings();
  const gmailUser = (settings.contactFromEmail || settings.contactToEmail || process.env.GMAIL_USER || '').trim();
  const gmailAppPassword = (settings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (!gmailUser || !gmailAppPassword) throw new Error('Email settings are not configured.');

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailAppPassword } });
  await transporter.sendMail({
    from: gmailUser,
    to: input.recipient,
    subject: 'Reset your admin password | Portfolio Console',
    text: [
      'Reset your admin password',
      '',
      'We received a request to reset the password for your Portfolio Console.',
      'This link expires in 15 minutes:',
      input.resetUrl,
      '',
      'If you did not request this, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <div style="margin:0;background:#f4f7f6;padding:32px 16px;font-family:Arial,sans-serif;color:#17201d;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce7e2;border-radius:12px;overflow:hidden;">
          <div style="background:#173b35;padding:28px 32px;color:#ffffff;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#a9d8c7;">Portfolio Console</p>
            <h1 style="margin:0;font-size:26px;line-height:1.2;">Reset your password</h1>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">We received a request to reset your admin password.</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52615c;">Use the button below within 15 minutes to choose a new password.</p>
            <p style="margin:0 0 28px;"><a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;background:#1d8068;border-radius:7px;padding:13px 22px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Reset password</a></p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#71807a;">If you did not request this email, you can safely ignore it. Your password will remain unchanged.</p>
          </div>
        </div>
      </div>
    `,
  });
}
