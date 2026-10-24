function CategoryProgress({ topics }) {
  // Group topics by category, ignoring capital letters, so "css" and "CSS" count together
  const groups = new Map();

  topics.forEach((topic) => {
    const label = topic.category || "Uncategorized";
    const key = label.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { label, total: 0, done: 0 });
    }
    const group = groups.get(key);
    group.total += 1;
    if (topic.status === "Done") group.done += 1;
  });

  const rows = [...groups.values()]
    .sort((a, b) => {
      // Uncategorized always goes last, the rest A to Z
      if (a.label === "Uncategorized") return 1;
      if (b.label === "Uncategorized") return -1;
      return a.label.localeCompare(b.label);
    })
    .map((g) => ({
      ...g,
      percent: Math.round((g.done / g.total) * 100),
    }));

  const hasRealCategory = topics.some((t) => t.category);

  // Nothing useful to show until at least one topic has a category
  if (!hasRealCategory) return null;

  return (
    <section className="category-progress-card">
      <h4>Progress by category</h4>

      <div className="category-rows">
        {rows.map((row) => (
          <div key={row.label} className="category-row">
            <div className="category-row-top">
              <span className="category-name">{row.label}</span>
              <span className="category-count">
                {row.done}/{row.total} done · {row.percent}%
              </span>
            </div>
            <div
              className="progress-bar-track"
              role="progressbar"
              aria-label={`${row.label} progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={row.percent}
            >
              <div
                className={
                  row.percent === 100
                    ? "progress-bar-fill complete"
                    : "progress-bar-fill"
                }
                style={{ width: `${row.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategoryProgress;