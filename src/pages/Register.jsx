import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }
        return data;
      })
      .then((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.name);
        navigate("/dashboard");
      })
      .catch((err) => {
        setError(err.message);
      });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Register</h1>
        <p>Create your account to start tracking progress.</p>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;