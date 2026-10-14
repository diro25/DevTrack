import { useEffect, useState } from "react";
import ProjectList from "../components/ProjectList";
import { api } from "../api";
import { useToast } from "../ToastContext";

function Projects() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/projects")
      .then(setProjects)
      .catch(() => setError("Could not load your projects. Is the server running?"))
      .finally(() => setLoading(false));
  }, []);

  async function addProject(name, description) {
    try {
      const newProject = await api("/projects", {
        method: "POST",
        body: { name, description },
      });
      setProjects((prev) => [...prev, newProject]);
      showToast("Project added");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function toggleProject(id) {
    try {
      const updated = await api(`/projects/${id}`, { method: "PUT" });
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Status: ${updated.status}`, "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function editProject(id, name, description) {
    try {
      const updated = await api(`/projects/${id}`, {
        method: "PATCH",
        body: { name, description },
      });
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast("Project updated");
      return true;
    } catch (err) {
      showToast(err.message, "error");
      return false;
    }
  }

  async function deleteProject(id) {
    try {
      await api(`/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast("Project deleted", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
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
        onEdit={editProject}
      />
    </div>
  );
}

export default Projects;