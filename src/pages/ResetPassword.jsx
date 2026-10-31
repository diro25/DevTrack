import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match");
      return;
    }

    setSubmitting(true);
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 4000);

    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setDone(true);
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

  // The link has no token at all (someone typed the address by hand)
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Reset link missing</h1>
          <p>
            This page needs the link from your reset email. You can ask for a new
            one.
          </p>
          <p className="auth-links">
            <Link to="/forgot-password">Send me a new link</Link>
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Password changed</h1>
          <p>Your password has been reset. You can log in with it now.</p>
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/login", { replace: true });
            }}
          >
            <button type="submit">Go to login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Choose a new password</h1>
        <p>Pick a password with at least 6 characters.</p>

        {error && <p className="auth-error">{error}</p>}
        {slow && (
          <p className="auth-notice">
            Still working... the free server may be waking up, which can take up
            to a minute.
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>New password</label>
          <input
            type="password"
            placeholder="Enter a new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label>Confirm new password</label>
          <input
            type="password"
            placeholder="Enter it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Reset password"}
          </button>
        </form>

        <p className="auth-links">
          <Link to="/forgot-password">Need a new link?</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;