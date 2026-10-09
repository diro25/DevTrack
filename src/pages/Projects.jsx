import { useEffect, useState } from "react";
import ProjectList from "../components/ProjectList";
import { API_URL } from "../config";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => setError("Could not load your projects. Is the server running?"))
      .finally(() => setLoading(false));
  }, []);

  function deleteProject(id) {
    fetch(`${API_URL}/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setProjects((prev) => prev.filter((project) => project.id !== id));
    });
  }

  function addProject(name, description) {
    fetch(`${API_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    })
      .then((res) => res.json())
      .then((newProject) => setProjects((prev) => [...prev, newProject]));
  }

  function toggleProject(id) {
    fetch(`${API_URL}/projects/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((updatedProject) => {
        setProjects((prev) =>
          prev.map((project) => (project.id === id ? updatedProject : project))
        );
      });
  }

  if (loading) return <p className="loading-message">Loading projects...</p>;
  if (error) return <p className="loading-message error">{error}</p>;

  return (
    <div className="dashboard-page">
      <h2>Projects</h2>
      <ProjectList
        projects={projects}
        onDelete={deleteProject}
        onAdd={addProject}
        onToggle={toggleProject}
      />
    </div>
  );
}

export default Projects;