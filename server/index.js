const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let topics = [
  { id: 1, title: "HTML", status: "Done" },
  { id: 2, title: "CSS", status: "In Progress" },
  { id: 3, title: "JavaScript", status: "Not Started" },
];

let projects = [
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

app.get("/", (req, res) => {
  res.send("DevTrack backend is running");
});

app.get("/topics", (req, res) => {
  res.json(topics);
});

app.post("/topics", (req, res) => {
  const { title } = req.body;
  const newTopic = {
    id: Date.now(),
    title,
    status: "Not Started",
  };
  topics.push(newTopic);
  res.status(201).json(newTopic);
});

app.delete("/topics/:id", (req, res) => {
  const id = Number(req.params.id);
  topics = topics.filter((topic) => topic.id !== id);
  res.status(204).send();
});

app.get("/projects", (req, res) => {
  res.json(projects);
});

app.post("/projects", (req, res) => {
  const { name, description } = req.body;
  const newProject = {
    id: Date.now(),
    name,
    description,
    status: "Not Started",
  };
  projects.push(newProject);
  res.status(201).json(newProject);
});

app.delete("/projects/:id", (req, res) => {
  const id = Number(req.params.id);
  projects = projects.filter((project) => project.id !== id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});