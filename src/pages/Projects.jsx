import { useEffect, useState } from "react";
import ProjectList from "../components/ProjectList";

function Projects() {
  const [projects, setProjects] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/projects", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProjects(data));
  }, []);

  function deleteProject(id) {
    fetch(`http://localhost:5000/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setProjects((prev) => prev.filter((project) => project.id !== id));
    });
  }

  function addProject(name, description) {
    fetch("http://localhost:5000/projects", {
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
  fetch(`http://localhost:5000/projects/${id}`, {
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

  return (
    <div className="dashboard-page">
      <h2>Projects</h2>
      <ProjectList projects={projects} onDelete={deleteProject} onAdd={addProject} onToggle={toggleProject} />
    </div>
  );
}

export default Projects;