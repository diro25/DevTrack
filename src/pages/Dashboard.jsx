import { useEffect, useState } from "react";
import ProgressCard from "../components/ProgressCard";
import TaskList from "../components/TaskList";
import TopicList from "../components/TopicList";
import ProjectList from "../components/ProjectList";

function Dashboard() {
  const [topics, setTopics] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonAuthHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch("http://localhost:5000/topics", { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setTopics(data));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/projects", { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setProjects(data));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/tasks", { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  function deleteTopic(id) {
    fetch(`http://localhost:5000/topics/${id}`, { method: "DELETE", headers: authHeaders }).then(() => {
      setTopics((prev) => prev.filter((topic) => topic.id !== id));
    });
  }

  function addTopic(title) {
    fetch("http://localhost:5000/topics", {
      method: "POST",
      headers: jsonAuthHeaders,
      body: JSON.stringify({ title }),
    })
      .then((res) => res.json())
      .then((newTopic) => setTopics((prev) => [...prev, newTopic]));
  }

  function deleteProject(id) {
    fetch(`http://localhost:5000/projects/${id}`, { method: "DELETE", headers: authHeaders }).then(() => {
      setProjects((prev) => prev.filter((project) => project.id !== id));
    });
  }

  function addProject(name, description) {
    fetch("http://localhost:5000/projects", {
      method: "POST",
      headers: jsonAuthHeaders,
      body: JSON.stringify({ name, description }),
    })
      .then((res) => res.json())
      .then((newProject) => setProjects((prev) => [...prev, newProject]));
  }

  function toggleTask(id) {
    fetch(`http://localhost:5000/tasks/${id}`, { method: "PUT", headers: authHeaders })
      .then((res) => res.json())
      .then((updatedTask) => {
        setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      });
  }

  function addTask(title) {
    fetch("http://localhost:5000/tasks", {
      method: "POST",
      headers: jsonAuthHeaders,
      body: JSON.stringify({ title }),
    })
      .then((res) => res.json())
      .then((newTask) => setTasks((prev) => [...prev, newTask]));
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
          <span className="stat-number">{completedTasks}/{totalTasks}</span>
          <span className="stat-label">Tasks Done</span>
        </div>
      </section>

      <section className="progress-section">
        <ProgressCard title="HTML" progress="100%" />
        <ProgressCard title="CSS" progress="80%" />
        <ProgressCard title="JavaScript" progress="40%" />
      </section>

      <TopicList topics={topics} onDelete={deleteTopic} onAdd={addTopic} />
      <ProjectList projects={projects} onDelete={deleteProject} onAdd={addProject} />
      <TaskList tasks={tasks} onToggle={toggleTask} onAdd={addTask} />
    </div>
  );
}

export default Dashboard;