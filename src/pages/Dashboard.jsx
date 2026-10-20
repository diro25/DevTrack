import { useEffect, useState } from "react";
import TaskList from "../components/TaskList";
import TopicList from "../components/TopicList";
import ProjectList from "../components/ProjectList";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { dueStatus } from "../dates";

function Dashboard() {
  const { showToast } = useToast();
  const [topics, setTopics] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setError("Please log in to see your dashboard.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const [topicsData, projectsData, tasksData] = await Promise.all([
          api("/topics"),
          api("/projects"),
          api("/tasks"),
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
  }, []);

  // ---- Topics ----
  async function addTopic(title) {
    try {
      const newTopic = await api("/topics", { method: "POST", body: { title } });
      setTopics((prev) => [...prev, newTopic]);
      showToast("Topic added");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function toggleTopic(id) {
    try {
      const updated = await api(`/topics/${id}`, { method: "PUT" });
      setTopics((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast(`Status: ${updated.status}`, "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function editTopic(id, title) {
    try {
      const updated = await api(`/topics/${id}`, {
        method: "PATCH",
        body: { title },
      });
      setTopics((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast("Topic updated");
      return true;
    } catch (err) {
      showToast(err.message, "error");
      return false;
    }
  }

  async function deleteTopic(id) {
    try {
      await api(`/topics/${id}`, { method: "DELETE" });
      setTopics((prev) => prev.filter((t) => t.id !== id));
      showToast("Topic deleted", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // ---- Projects ----
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

  // ---- Tasks ----
  async function addTask(title, dueDate) {
    try {
      const newTask = await api("/tasks", {
        method: "POST",
        body: { title, dueDate: dueDate || null },
      });
      setTasks((prev) => [...prev, newTask]);
      showToast("Task added");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function toggleTask(id) {
    try {
      const updated = await api(`/tasks/${id}`, { method: "PUT" });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (updated.done) showToast("Task completed 🎉");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function editTask(id, title, dueDate) {
    try {
      const updated = await api(`/tasks/${id}`, {
        method: "PATCH",
        body: { title, dueDate: dueDate || null },
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast("Task updated");
      return true;
    } catch (err) {
      showToast(err.message, "error");
      return false;
    }
  }

  async function deleteTask(id) {
    try {
      await api(`/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Task deleted", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const totalTopics = topics.length;
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;
  const overdueTasks = tasks.filter(
    (task) => dueStatus(task.due_date, task.done) === "overdue"
  ).length;
  const doneTopics = topics.filter((topic) => topic.status === "Done").length;
  const topicsProgress =
    totalTopics === 0 ? 0 : Math.round((doneTopics / totalTopics) * 100);

  if (loading) return <p className="loading-message">Loading your dashboard...</p>;
  if (error) return <p className="loading-message error">{error}</p>;

  return (
    <div className="dashboard-page">
      <h2>Welcome back, {localStorage.getItem("userName") || "friend"} 👋</h2>
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
        <div className={overdueTasks > 0 ? "stat-box danger" : "stat-box"}>
          <span className="stat-number">{overdueTasks}</span>
          <span className="stat-label">Overdue</span>
        </div>
      </section>

      <section className="progress-section">
        <div className="progress-card">
          <h4>Topics Progress</h4>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${topicsProgress}%` }}
            ></div>
          </div>
          <p>
            {doneTopics} of {totalTopics} topics done ({topicsProgress}%)
          </p>
        </div>
      </section>

      <TopicList
        topics={topics}
        onDelete={deleteTopic}
        onAdd={addTopic}
        onToggle={toggleTopic}
        onEdit={editTopic}
      />
      <ProjectList
        projects={projects}
        onDelete={deleteProject}
        onAdd={addProject}
        onToggle={toggleProject}
        onEdit={editProject}
      />
      <TaskList
        tasks={tasks}
        onToggle={toggleTask}
        onAdd={addTask}
        onDelete={deleteTask}
        onEdit={editTask}
      />
    </div>
  );
}

export default Dashboard;