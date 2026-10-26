import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "../auth";

// Private pages: logged-out visitors are sent to the login page,
// and brought back to the page they wanted after they log in.
export function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

// Login and register pages: logged-in users go straight to the dashboard.
export function PublicOnlyRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}