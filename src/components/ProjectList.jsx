import { useState } from "react";

const FILTERS = ["All", "Not Started", "In Progress", "Done"];

function ProjectList({ projects, onDelete, onAdd, onToggle, onEdit }) {
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim() || !newDescription.trim()) return;

    onAdd(newName, newDescription);
    setNewName("");
    setNewDescription("");
  }

  function startEdit(project) {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }

  async function saveEdit(e, project) {
    e.preventDefault();
    const name = editName.trim();
    const description = editDescription.trim();
    if (!name || !description) return;
    if (name === project.name && description === project.description) {
      cancelEdit();
      return;
    }
    const ok = await onEdit(project.id, name, description);
    if (ok) cancelEdit();
  }

  const visibleProjects = projects.filter((project) => {
    const text = `${project.name} ${project.description}`.toLowerCase();
    const matchesText = text.includes(query.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "All" || project.status === statusFilter;
    return matchesText && matchesStatus;
  });

  return (
    <section className="project-list">
      <h3>Projects</h3>

      <form onSubmit={handleSubmit} className="project-form">
        <input
          type="text"
          placeholder="Project name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Project description..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <div className="filter-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Search projects..."
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
        Showing {visibleProjects.length} of {projects.length} projects
      </p>

      {projects.length === 0 ? (
        <p className="empty-message">No projects yet. Add your first project above.</p>
      ) : visibleProjects.length === 0 ? (
        <p className="empty-message">No projects match your search or filter.</p>
      ) : (
        <div className="project-grid">
          {visibleProjects.map((project) =>
            editingId === project.id ? (
              <div key={project.id} className="project-card editing">
                <form className="edit-form" onSubmit={(e) => saveEdit(e, project)}>
                  <input
                    className="edit-input"
                    value={editName}
                    autoFocus
                    placeholder="Project name"
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                  <input
                    className="edit-input"
                    value={editDescription}
                    placeholder="Project description"
                    onChange={(e) => setEditDescription(e.target.value)}
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
                key={project.id}
                className="project-card"
                onClick={() => onToggle(project.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onToggle(project.id);
                }}
                role="button"
                tabIndex={0}
              >
                <h4>{project.name}</h4>
                <p>{project.description}</p>
                <span>{project.status}</span>
                <div className="card-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(project);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project.id);
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

export default ProjectList;