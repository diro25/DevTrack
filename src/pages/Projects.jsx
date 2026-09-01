import { useEffect, useState } from "react";
import ProjectList from "../components/ProjectList";

function Projects() {
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem("projects");
    return savedProjects
      ? JSON.parse(savedProjects)
      : [
          {
            id: 1,
            name: "DevTrack",
            description: "Full-stack learning progress tracker",
            status: "In Progress",
          },
          {
            id: 2,
            name: "Portfolio Website",
            description: "Personal portfolio for showing projects",
            status: "Done",
          },
          {
            id: 3,
            name: "Weather App",
            description: "Simple app using API data",
            status: "Not Started",
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  function deleteProject(id) {
    setProjects((prevProjects) =>
      prevProjects.filter((project) => project.id !== id)
    );
  }

  function addProject(name, description) {
    const newProject = {
      id: Date.now(),
      name,
      description,
      status: "Not Started",
    };
    setProjects((prevProjects) => [...prevProjects, newProject]);
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