type EmailParams = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, text, replyTo }: EmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email not sent: RESEND_API_KEY missing] To: ${to}\nSubject: ${subject}\n\n${text}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "Exo Zilton <onboarding@resend.dev>",
      to: [to],
      reply_to: replyTo,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.status}`);
  }
}
