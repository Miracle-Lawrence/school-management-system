import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  id: string;
};

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = input.replyTo ?? process.env.EMAIL_REPLY_TO;

  if (!apiKey) {
    throw new Error(
      "Email service is not configured: RESEND_API_KEY is missing.",
    );
  }

  if (!from) {
    throw new Error("Email service is not configured: EMAIL_FROM is missing.");
  }

  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  if (
    recipients.length === 0 ||
    recipients.some((recipient) => !recipient.trim())
  ) {
    throw new Error("At least one valid email recipient is required.");
  }

  if (!input.subject.trim()) {
    throw new Error("Email subject is required.");
  }

  if (!input.text.trim() && !input.html?.trim()) {
    throw new Error("Email content is required.");
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject.trim(),
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    console.error("Email provider rejected the send request.", {
      name: error.name,
      statusCode: error.statusCode,
    });

    throw new Error("Unable to send email. Please try again later.");
  }

  if (!data?.id) {
    throw new Error("The email provider did not return a message ID.");
  }

  return { id: data.id };
}
