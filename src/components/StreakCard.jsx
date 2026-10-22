import { useEffect, useState } from "react";
import { api } from "../api";

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function StreakCard({ refreshKey }) {
  const [streak, setStreak] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    api(`/streak?tz=${encodeURIComponent(tz)}`)
      .then((data) => {
        if (!cancelled) {
          setStreak(data);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // If the streak can't load, show nothing rather than an error box
  if (failed) return null;

  if (!streak) {
    return (
      <section className="streak-card">
        <p className="empty-message">Loading streak...</p>
      </section>
    );
  }

  const { current, longest, activeToday } = streak;

  let message;
  if (current === 0) {
    message = "Finish a task or topic today to start your streak.";
  } else if (!activeToday) {
    message = "Finish something today to keep your streak alive.";
  } else if (current === 1) {
    message = "Great start! Come back tomorrow to keep it going.";
  } else {
    message = "You're on a roll. Keep it up!";
  }

  return (
    <section className={activeToday ? "streak-card hot" : "streak-card"}>
      <div className="streak-flame" aria-hidden="true">
        {current > 0 ? "🔥" : "🌱"}
      </div>

      <div className="streak-main">
        <div className="streak-number">{plural(current, "day")}</div>
        <div className="streak-label">current streak</div>
        <p className="streak-message">{message}</p>
      </div>

      <div className="streak-best">
        <span className="streak-best-number">{longest}</span>
        <span className="streak-best-label">
          longest
          <br />
          {longest === 1 ? "day" : "days"}
        </span>
      </div>
    </section>
  );
}

export default StreakCard;