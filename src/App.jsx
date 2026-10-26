import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Topics from "./pages/Topics";
import Projects from "./pages/Projects";
import AnimatedBackground from "./AnimatedBackground";
import { ToastProvider, useToast } from "./ToastContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards";
import { isLoggedIn, clearSession } from "./auth";
import "./App.css";

function NavBar({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, [location]);

  function handleLogout() {
    clearSession();
    setLoggedIn(false);
    showToast("You have been logged out", "info");
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      {loggedIn ? (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/topics">Topics</Link>
          <Link to="/projects">Projects</Link>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
      <button
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label="Switch between light and dark theme"
      >
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>
    </nav>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <AnimatedBackground />
        <NavBar theme={theme} onToggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/topics"
            element={
              <ProtectedRoute>
                <Topics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;