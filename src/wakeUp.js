import { API_URL } from "./config";

// Wakes the free backend (it sleeps when idle) by asking it one tiny question.
export async function wakeBackend() {
  const res = await fetch(`${API_URL}/`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Backend answered ${res.status}`);
  }
}