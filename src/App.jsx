import "./App.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProgressCard from "./components/ProgressCard";
import TaskList from "./components/TaskList";
import TopicList from "./components/TopicList";
import ProjectList from "./components/ProjectList";

function App() {
  const topics = [
    { id: 1, title: "HTML", status: "Done" },
    { id: 2, title: "CSS", status: "In Progress" },
    { id: 3, title: "JavaScript", status: "Not Started" },
  ];

  const projects = [
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

  return (
    <div className="app">
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <h2>Welcome back, Dawa 👋</h2>
          <p>Here is your learning progress today.</p>

          <section className="progress-section">
            <ProgressCard title="HTML" progress="100%" />
            <ProgressCard title="CSS" progress="80%" />
            <ProgressCard title="JavaScript" progress="40%" />
          </section>

          <TopicList topics={topics} />
          <ProjectList projects={projects} />
          <TaskList />
        </main>
      </div>
    </div>
  );
}

export default App;