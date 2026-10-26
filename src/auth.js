// Small helpers for the login session stored in the browser

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
}

// Reads the expiry time out of the token. This is only used to avoid showing
// pages to someone whose login has clearly expired; the server still checks
// every request and is the real protection.
function tokenExpiry(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json).exp || null;
  } catch (err) {
    return null;
  }
}

export function isLoggedIn() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  const exp = tokenExpiry(token);
  if (exp && exp * 1000 < Date.now()) {
    clearSession();
    return false;
  }
  return true;
}