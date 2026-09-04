import { useEffect, useState } from "react";
import ProgressCard from "../components/ProgressCard";
import TaskList from "../components/TaskList";
import TopicList from "../components/TopicList";
import ProjectList from "../components/ProjectList";

function Dashboard() {
  const [topics, setTopics] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    const authHeaders = { Authorization: `Bearer ${token}` };

  async function loadData() {
  try {
    const [topicsRes, projectsRes, tasksRes] = await Promise.all([
      fetch("http://localhost:5000/topics", { headers: authHeaders }),
      fetch("http://localhost:5000/projects", { headers: authHeaders }),
      fetch("http://localhost:5000/tasks", { headers: authHeaders }),
    ]);

    const [topicsData, projectsData, tasksData] = await Promise.all([
      topicsRes.json(),
      projectsRes.json(),
      tasksRes.json(),
    ]);

    setTopics(topicsData);
    setProjects(projectsData);
    setTasks(tasksData);
  } catch (err) {
    setError("Could not load your data. Is the server running?");
  } finally {
    setLoading(false);
  }
}

    loadData();
  }, [token]);

  async function deleteTopic(id) {
    const authHeaders = { Authorization: `Bearer ${token}` };

    await fetch(`http://localhost:5000/topics/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    setTopics((prev) => prev.filter((topic) => topic.id !== id));
  }

  async function addTopic(title) {
    const jsonAuthHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch("http://localhost:5000/topics", {
      method: "POST",
      headers: jsonAuthHeaders,
      body: JSON.stringify({ title }),
    });

    const newTopic = await res.json();
    setTopics((prev) => [...prev, newTopic]);
  }

  async function toggleTopic(id) {
    const authHeaders = { Authorization: `Bearer ${token}` };

    const res = await fetch(`http://localhost:5000/topics/${id}`, {
      method: "PUT",
      headers: authHeaders,
    });

    const updatedTopic = await res.json();
    setTopics((prev) =>
      prev.map((topic) => (topic.id === updatedTopic.id ? updatedTopic : topic))
    );
  }

  async function deleteProject(id) {
    const authHeaders = { Authorization: `Bearer ${token}` };

    await fetch(`http://localhost:5000/projects/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    setProjects((prev) => prev.filter((project) => project.id !== id));
  }

  async function addProject(name, description) {
    const jsonAuthHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch("http://localhost:5000/projects", {
      method: "POST",
      headers: jsonAuthHeaders,
      body: JSON.stringify({ name, description }),
    });

    const newProject = await res.json();
    setProjects((prev) => [...prev, newProject]);
  }

  async function toggleProject(id) {
    const authHeaders = { Authorization: `Bearer ${token}` };

    const res = await fetch(`http://localhost:5000/projects/${id}`, {
      method: "PUT",
      headers: authHeaders,
    });

    const updatedProject = await res.json();
    setProjects((prev) =>
      prev.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  }

  async function toggleTask(id) {
    const authHeaders = { Authorization: `Bearer ${token}` };

    const res = await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "PUT",
      headers: authHeaders,
    });

    const updatedTask = await res.json();
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? updatedTask : task))
    );
  }

  async function addTask(title) {
    const jsonAuthHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch("http://localhost:5000/tasks", {
      method: "POST",
      headers: jsonAuthHeaders,
      body: JSON.stringify({ title }),
    });

    const newTask = await res.json();
    setTasks((prev) => [...prev, newTask]);
  }

  const totalTopics = topics.length;
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;
  if (loading) return <p className="loading-message">Loading your dashboard...</p>;
  if (error) return <p className="loading-message error">{error}</p>;
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

      <TopicList
        topics={topics}
        onDelete={deleteTopic}
        onAdd={addTopic}
        onToggle={toggleTopic}
      />
      <ProjectList
        projects={projects}
        onDelete={deleteProject}
        onAdd={addProject}
        onToggle={toggleProject}
      />
      <TaskList tasks={tasks} onToggle={toggleTask} onAdd={addTask} />
    </div>
  );
}

export default Dashboard;