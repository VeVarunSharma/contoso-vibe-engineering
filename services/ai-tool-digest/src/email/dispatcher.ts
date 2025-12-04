import nodemailer from "nodemailer";
import { z } from "zod";
import { trackEvent, trackException } from "../logging.js";
import type { DigestConfig } from "../types.js";

const emailSchema = z.object({
  subject: z.string().min(5),
  htmlBody: z.string().min(1),
  textBody: z.string().min(1),
});

export interface EmailPayload {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export async function sendDigestEmail(
  config: DigestConfig,
  payload: EmailPayload
): Promise<void> {
  const parsed = emailSchema.parse(payload);

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
  });

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: config.recipients.join(","),
      subject: parsed.subject,
      text: parsed.textBody,
      html: parsed.htmlBody,
    });

    trackEvent("digest-email-sent", {
      recipientCount: config.recipients.length,
    });
  } catch (error) {
    const serialisableError =
      error instanceof Error ? error : new Error("Unknown email send error");
    trackException(serialisableError);
    throw serialisableError;
  }
}
