import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const expired = new URLSearchParams(location.search).get("expired") === "1";
  const destination = (location.state && location.state.from) || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 4000);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);
      navigate(destination, { replace: true });
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <p>Welcome back. Please enter your details.</p>

        {expired && !error && (
          <p className="auth-notice">Your session expired. Please log in again.</p>
        )}
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
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;