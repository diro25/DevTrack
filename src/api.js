import { API_URL } from "./config";
import { clearSession } from "./auth";

export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    // The login is missing, invalid, or expired: clear it and go to the login page
    clearSession();
    window.location.assign("/login?expired=1");
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    throw new Error((data && data.error) || "Something went wrong");
  }
  return data;
}