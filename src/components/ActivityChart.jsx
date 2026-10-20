import { useEffect, useState } from "react";
import { api } from "../api";

const DAYS = 7;

// "2026-10-20" becomes "Tue" (in the user's own language)
function dayLabel(dayString) {
  const [y, m, d] = dayString.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function ActivityChart({ refreshKey }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    api(`/activity?days=${DAYS}&tz=${encodeURIComponent(tz)}`)
      .then((rows) => {
        if (!cancelled) {
          setData(rows);
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

  if (failed) {
    return (
      <section className="activity-card">
        <h4>Your activity</h4>
        <p className="empty-message">Could not load your activity chart.</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="activity-card">
        <h4>Your activity</h4>
        <p className="empty-message">Loading chart...</p>
      </section>
    );
  }

  const total = data.reduce((sum, row) => sum + row.tasks + row.topics, 0);
  const max = Math.max(4, ...data.map((row) => row.tasks + row.topics));

  return (
    <section className="activity-card">
      <div className="activity-header">
        <h4>Last {DAYS} days</h4>
        <div className="chart-legend">
          <span>
            <i className="dot dot-task" />
            Tasks
          </span>
          <span>
            <i className="dot dot-topic" />
            Topics
          </span>
        </div>
      </div>

      <div className="chart">
        {data.map((row, i) => {
          const isToday = i === data.length - 1;
          const sum = row.tasks + row.topics;
          return (
            <div
              key={row.day}
              className={isToday ? "chart-col today" : "chart-col"}
              title={`${row.day}: ${plural(row.tasks, "task")}, ${plural(
                row.topics,
                "topic"
              )}`}
            >
              <span className="chart-count">{sum > 0 ? sum : ""}</span>
              <div className="chart-bar-area">
                <div
                  className="chart-seg seg-task"
                  style={{ height: `${(row.tasks / max) * 100}%` }}
                />
                <div
                  className="chart-seg seg-topic"
                  style={{ height: `${(row.topics / max) * 100}%` }}
                />
              </div>
              <span className="chart-day">{isToday ? "Today" : dayLabel(row.day)}</span>
            </div>
          );
        })}
      </div>

      <p className="results-count">
        {total === 0
          ? "Finish a task or a topic and it will show up here."
          : `${plural(total, "item")} finished in the last ${DAYS} days.`}
      </p>
    </section>
  );
}

export default ActivityChart;