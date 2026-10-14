import { useState } from "react";

const FILTERS = ["All", "Not Started", "In Progress", "Done"];

function ProjectList({ projects, onDelete, onAdd, onToggle }) {
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim() || !newDescription.trim()) return;

    onAdd(newName, newDescription);
    setNewName("");
    setNewDescription("");
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
          {visibleProjects.map((project) => (
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProjectList;