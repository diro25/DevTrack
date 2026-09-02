import { useEffect, useState } from "react";
import ProjectList from "../components/ProjectList";

function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data));
  }, []);

  function deleteProject(id) {
    fetch(`http://localhost:5000/projects/${id}`, {
      method: "DELETE",
    }).then(() => {
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== id)
      );
    });
  }

  function addProject(name, description) {
    fetch("http://localhost:5000/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    })
      .then((res) => res.json())
      .then((newProject) => {
        setProjects((prevProjects) => [...prevProjects, newProject]);
      });
  }

  return (
    <div className="dashboard-page">
      <h2>Projects</h2>
      <ProjectList
        projects={projects}
        onDelete={deleteProject}
        onAdd={addProject}
      />
    </div>
  );
}

export default Projects;