import { Resend } from 'resend';
import { env } from '../env';

export type Email = { to: string; subject: string; url: string };

// ponytail: unbounded, but only the capture transport fills it and that one never runs
// in production. Cap it if a long-lived dev server ever starts to matter.
const captured: Email[] = [];

export const capturedEmails = () => captured;

// Every message this API sends is a subject plus one link, so the transport takes that
// rather than a rendered body: the capture transport can then hand the link to a test.
export async function sendEmail(email: Email) {
  const { EMAIL_TRANSPORT, EMAIL_FROM, RESEND_API_KEY } = env();
  if (EMAIL_TRANSPORT === 'capture') {
    captured.push(email);
    return;
  }
  // env.ts refuses to boot without it, so this only guards the type.
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing');
  const { error } = await new Resend(RESEND_API_KEY).emails.send({
    from: EMAIL_FROM,
    to: email.to,
    subject: email.subject,
    text: `${email.subject}: ${email.url}`,
  });
  if (error) throw new Error(`Resend refused the message: ${error.message}`);
}
