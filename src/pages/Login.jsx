import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const expired = new URLSearchParams(location.search).get("expired") === "1";
  const destination = (location.state && location.state.from) || "/dashboard";

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }
        return data;
      })
      .then((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.name);
        navigate(destination, { replace: true });
      })
      .catch((err) => {
        setError(err.message);
      });
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

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;