import { useState } from "react";

const FILTERS = ["All", "Not Started", "In Progress", "Done"];

function TopicList({ topics, onDelete, onAdd, onToggle, onEdit }) {
  const [newTopic, setNewTopic] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newTopic.trim()) return;
    onAdd(newTopic);
    setNewTopic("");
  }

  function startEdit(topic) {
    setEditingId(topic.id);
    setEditTitle(topic.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function saveEdit(e, topic) {
    e.preventDefault();
    const title = editTitle.trim();
    if (!title) return;
    if (title === topic.title) {
      cancelEdit();
      return;
    }
    const ok = await onEdit(topic.id, title);
    if (ok) cancelEdit();
  }

  const visibleTopics = topics.filter((topic) => {
    const matchesText = topic.title
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "All" || topic.status === statusFilter;
    return matchesText && matchesStatus;
  });

  return (
    <section className="topic-list">
      <h3>Learning Topics</h3>

      <form onSubmit={handleSubmit} className="topic-form">
        <input
          type="text"
          placeholder="Add a new topic..."
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <div className="filter-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Search topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-chips">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f}
              className={statusFilter === f ? "filter-chip active" : "filter-chip"}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="results-count">
        Showing {visibleTopics.length} of {topics.length} topics
      </p>

      {topics.length === 0 ? (
        <p className="empty-message">No topics yet. Add your first topic above.</p>
      ) : visibleTopics.length === 0 ? (
        <p className="empty-message">No topics match your search or filter.</p>
      ) : (
        <div className="topic-grid">
          {visibleTopics.map((topic) =>
            editingId === topic.id ? (
              <div key={topic.id} className="topic-card editing">
                <form className="edit-form" onSubmit={(e) => saveEdit(e, topic)}>
                  <input
                    className="edit-input"
                    value={editTitle}
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                  <div className="card-actions">
                    <button type="submit" className="save-btn">Save</button>
                    <button type="button" className="cancel-btn" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                key={topic.id}
                className="topic-card"
                onClick={() => onToggle(topic.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onToggle(topic.id);
                }}
                role="button"
                tabIndex={0}
              >
                <h4>{topic.title}</h4>
                <p>{topic.status}</p>
                <div className="card-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(topic);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(topic.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

export default TopicList;