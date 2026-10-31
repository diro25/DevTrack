const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const sql = require("./db");
const mailer = require("./mailer");

const router = express.Router();

const GENERIC_ANSWER = {
  message:
    "If that email belongs to an account, we have sent a link to reset the password.",
};
const BAD_LINK = "This reset link is invalid or has expired. Please ask for a new one.";

// Sends any error inside an async route to the error handler in index.js
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// The limits are generous on purpose: many students share one campus network address
const limiterDefaults = { standardHeaders: "draft-7", legacyHeaders: false };

const forgotLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 60 * 60 * 1000,
  limit: 15,
  message: { error: "Too many reset requests. Please try again later." },
});

const resetLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

// Only this hash is stored, never the token itself
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resetLink(token) {
  const base = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  return `${base}/reset-password?token=${token}`;
}

function buildEmail(name, link) {
  const text = [
    `Hi ${name},`,
    "",
    "Someone asked to reset the password for your DevTrack account.",
    "To choose a new password, open this link. It works once and expires in 1 hour:",
    "",
    link,
    "",
    "If this was not you, you can ignore this email. Your password stays the same.",
  ].join("\n");

  const html =
    `<p>Hi ${escapeHtml(name)},</p>` +
    `<p>Someone asked to reset the password for your DevTrack account.</p>` +
    `<p><a href="${link}">Choose a new password</a></p>` +
    `<p>The link works once and expires in 1 hour.</p>` +
    `<p>If this was not you, you can ignore this email. Your password stays the same.</p>`;

  return { text, html };
}

// Creates a reset link for the account and emails it. Does nothing for unknown emails.
async function sendResetLink(email) {
  const users = await sql.query("SELECT id, name FROM users WHERE email = $1", [email]);
  if (users.length === 0) return;
  const user = users[0];

  // At most one reset email every 2 minutes per account
  const recent = await sql.query(
    `SELECT 1 FROM password_resets
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '2 minutes'
     LIMIT 1`,
    [user.id]
  );
  if (recent.length > 0) return;

  // A new link replaces any older ones, and old expired links are cleaned up
  await sql.query(
    "DELETE FROM password_resets WHERE user_id = $1 OR expires_at < NOW()",
    [user.id]
  );

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await sql.query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [user.id, tokenHash]
  );

  const { text, html } = buildEmail(user.name, resetLink(token));

  try {
    await mailer.sendMail({
      to: email,
      subject: "Reset your DevTrack password",
      text,
      html,
    });
  } catch (err) {
    // The email never left, so the link is useless: remove it
    await sql.query("DELETE FROM password_resets WHERE token_hash = $1", [tokenHash]);
    throw err;
  }
}

// ---- FORGOT PASSWORD ----
router.post(
  "/forgot-password",
  forgotLimiter,
  wrap(async (req, res) => {
    const body = req.body || {};
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Answer straight away, so neither the message nor its speed reveals
    // whether an account exists. The real work happens after the answer.
    res.json(GENERIC_ANSWER);

    try {
      await sendResetLink(email);
    } catch (err) {
      console.error("Password reset email failed:", err.message);
    }
  })
);

// ---- RESET PASSWORD ----
router.post(
  "/reset-password",
  resetLimiter,
  wrap(async (req, res) => {
    const body = req.body || {};
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^[0-9a-f]{64}$/.test(token)) {
      return res.status(400).json({ error: BAD_LINK });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const tokenHash = hashToken(token);

    const found = await sql.query(
      `SELECT user_id FROM password_resets
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    if (found.length === 0) {
      return res.status(400).json({ error: BAD_LINK });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use up the link in one step, so it can only ever work once
    const claimed = await sql.query(
      `UPDATE password_resets SET used_at = NOW()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash]
    );
    if (claimed.length === 0) {
      return res.status(400).json({ error: BAD_LINK });
    }

    const userId = claimed[0].user_id;
    await sql.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);
    await sql.query("DELETE FROM password_resets WHERE user_id = $1", [userId]);

    res.json({ message: "Your password has been reset. You can log in now." });
  })
);

module.exports = router;