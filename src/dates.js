// Today's date as text like 2026-10-20, in the user's own time zone
export function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Returns "overdue", "today", "upcoming", or null (no date, or task already done)
export function dueStatus(dueDate, done) {
  if (!dueDate || done) return null;
  const today = todayString();
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  return "upcoming";
}

// "2026-10-20" becomes "Oct 20, 2026"
export function formatDue(dueDate) {
  const [y, m, d] = dueDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}