import nodemailer from "nodemailer";
import { getContactSettings } from "./db.js";

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

  const contactToEmail = settings.contactToEmail?.trim();

  const gmailAppPassword = settings.gmailAppPassword?.replace(/\s/g, "");

  if (!contactToEmail) {
    throw new Error(
      "Missing Gmail address. Configure contactToEmail or GMAIL_USER.",
    );
  }

  if (!gmailAppPassword) {
    throw new Error(
      "Missing Gmail app password. Configure gmailAppPassword or GMAIL_APP_PASSWORD.",
    );
  }

  if (!settings.contactToEmail) {
    throw new Error("Missing recipient email. Configure contactToEmail.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: contactToEmail,
      pass: gmailAppPassword,
    },
  });

  await transporter.verify();

  const result = await transporter.sendMail({
    from: `"${input.name}" <${contactToEmail}>`,
    to: settings.contactToEmail,
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
