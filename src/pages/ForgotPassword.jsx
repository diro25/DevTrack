import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 4000);

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setSent(true);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Could not reach the server. Please try again in a moment."
          : err.message
      );
    } finally {
      clearTimeout(slowTimer);
      setSubmitting(false);
      setSlow(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p>
            If <strong>{email}</strong> belongs to an account, we have sent a
            link to reset the password. It works once and expires in 1 hour.
          </p>
          <p className="auth-hint">
            Nothing yet? Check your spam folder, and wait a minute or two.
          </p>
          <p className="auth-links">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot password?</h1>
        <p>Enter your email and we will send you a link to choose a new one.</p>

        {error && <p className="auth-error">{error}</p>}
        {slow && (
          <p className="auth-notice">
            Still working... the free server may be waking up, which can take up
            to a minute.
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="auth-links">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;