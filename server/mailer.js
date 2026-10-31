require("dotenv").config();

// Sends one email through Brevo's HTTPS API.
// (Render's free plan blocks ordinary email ports, so we use HTTPS instead.)
async function sendMail({ to, subject, text, html }) {
  const { BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;

  if (!BREVO_API_KEY || !MAIL_FROM_EMAIL) {
    throw new Error("Email is not set up (BREVO_API_KEY or MAIL_FROM_EMAIL is missing)");
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: MAIL_FROM_NAME || "DevTrack", email: MAIL_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email service answered ${res.status}: ${detail.slice(0, 200)}`);
  }
}

module.exports = { sendMail };