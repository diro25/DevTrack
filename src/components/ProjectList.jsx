import { useState } from "react";

function ProjectList({ projects, onDelete, onAdd }) {
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim() || !newDescription.trim()) return;

    onAdd(newName, newDescription);
    setNewName("");
    setNewDescription("");
  }

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

      <div className="project-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h4>{project.name}</h4>
            <p>{project.description}</p>
            <span>{project.status}</span>
            <button onClick={() => onDelete(project.id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProjectList;