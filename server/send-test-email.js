require("dotenv").config();

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: node send-test-email.js you@example.com");
    process.exit(1);
  }

  const { BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;
  if (!BREVO_API_KEY || !MAIL_FROM_EMAIL) {
    console.error("Set BREVO_API_KEY and MAIL_FROM_EMAIL in server/.env first.");
    process.exit(1);
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
      subject: "DevTrack test email",
      htmlContent: "<p>If you can read this, DevTrack can send email.</p>",
    }),
  });

  console.log("Status:", res.status);
  console.log(await res.text());
}

main().catch((err) => {
  console.error("Failed:", err.message, err.cause && err.cause.code);
});