import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Outbound email via SMTP. Configuration comes from environment variables:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, SMTP_FROM
 * When SMTP_HOST is not set, email sending is disabled and sendEmail()
 * returns false without throwing, so callers can treat email as best-effort.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Send a single email. Never throws: returns true when the message was
 * accepted by the SMTP server, false otherwise (unconfigured or failed).
 */
export async function sendEmail(mail: OutboundEmail): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(`Email not sent to ${mail.to} ("${mail.subject}"): SMTP is not configured (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)`);
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${mail.to} ("${mail.subject}"):`, err);
    return false;
  }
}
