function ProjectList({ projects }) {
  return (
    <section className="project-list">
      <h3>Projects</h3>
      <div className="project-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h4>{project.name}</h4>
            <p>{project.description}</p>
            <span>{project.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProjectList;