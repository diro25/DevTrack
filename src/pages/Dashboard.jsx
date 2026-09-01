import { useEffect, useState } from "react";
import ProgressCard from "../components/ProgressCard";
import TaskList from "../components/TaskList";
import TopicList from "../components/TopicList";
import ProjectList from "../components/ProjectList";

function Dashboard() {
  const [topics, setTopics] = useState(() => {
    const savedTopics = localStorage.getItem("topics");
    return savedTopics
      ? JSON.parse(savedTopics)
      : [
          { id: 1, title: "HTML", status: "Done" },
          { id: 2, title: "CSS", status: "In Progress" },
          { id: 3, title: "JavaScript", status: "Not Started" },
        ];
  });

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

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks
      ? JSON.parse(savedTasks)
      : [
          { id: 1, title: "CSS Grid", done: false },
          { id: 2, title: "JavaScript DOM", done: false },
          { id: 3, title: "HTML Review", done: true },
        ];
  });

  useEffect(() => {
    localStorage.setItem("topics", JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  function deleteTopic(id) {
    setTopics((prevTopics) => prevTopics.filter((topic) => topic.id !== id));
  }

  function addTopic(title) {
    const newTopic = { id: Date.now(), title, status: "Not Started" };
    setTopics((prevTopics) => [...prevTopics, newTopic]);
  }

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

  function toggleTask(id) {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function addTask(title) {
    const newTask = { id: Date.now(), title, done: false };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  }

  const totalTopics = topics.length;
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;

  return (
    <div className="dashboard-page">
      <h2>Welcome back, Dawa 👋</h2>
      <p>Here is your learning progress today.</p>

      <section className="stats-bar">
        <div className="stat-box">
          <span className="stat-number">{totalTopics}</span>
          <span className="stat-label">Topics</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{totalProjects}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">
            {completedTasks}/{totalTasks}
          </span>
          <span className="stat-label">Tasks Done</span>
        </div>
      </section>

      <section className="progress-section">
        <ProgressCard title="HTML" progress="100%" />
        <ProgressCard title="CSS" progress="80%" />
        <ProgressCard title="JavaScript" progress="40%" />
      </section>

      <TopicList topics={topics} onDelete={deleteTopic} onAdd={addTopic} />
      <ProjectList
        projects={projects}
        onDelete={deleteProject}
        onAdd={addProject}
      />
      <TaskList tasks={tasks} onToggle={toggleTask} onAdd={addTask} />
    </div>
  );
}

export default Dashboard;