const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requireAuth = require("./middleware");

const app = express();
const PORT = 5000;
const JWT_SECRET = "devtrack-dev-secret-change-later";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("DevTrack backend is running");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = db
    .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
    .run(name, email, hashedPassword);

  const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.status(201).json({ token, name, email });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, name: user.name, email: user.email });
});

// ---- TOPICS ----
app.get("/topics", requireAuth, (req, res) => {
  const topics = db.prepare("SELECT * FROM topics WHERE user_id = ?").all(req.userId);
  res.json(topics);
});

app.post("/topics", requireAuth, (req, res) => {
  const { title } = req.body;
  const result = db
    .prepare("INSERT INTO topics (user_id, title, status) VALUES (?, ?, 'Not Started')")
    .run(req.userId, title);
  const newTopic = db.prepare("SELECT * FROM topics WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newTopic);
});

app.delete("/topics/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM topics WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
  res.status(204).send();
});

// ---- PROJECTS ----
app.get("/projects", requireAuth, (req, res) => {
  const projects = db.prepare("SELECT * FROM projects WHERE user_id = ?").all(req.userId);
  res.json(projects);
});

app.post("/projects", requireAuth, (req, res) => {
  const { name, description } = req.body;
  const result = db
    .prepare("INSERT INTO projects (user_id, name, description, status) VALUES (?, ?, ?, 'Not Started')")
    .run(req.userId, name, description);
  const newProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newProject);
});

app.delete("/projects/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
  res.status(204).send();
});

// ---- TASKS ----
app.get("/tasks", requireAuth, (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ?").all(req.userId);
  res.json(tasks);
});

app.post("/tasks", requireAuth, (req, res) => {
  const { title } = req.body;
  const result = db
    .prepare("INSERT INTO tasks (user_id, title, done) VALUES (?, ?, 0)")
    .run(req.userId, title);
  const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newTask);
});

app.put("/tasks/:id", requireAuth, (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!task) return res.status(404).send();
  const newDone = task.done ? 0 : 1;
  db.prepare("UPDATE tasks SET done = ? WHERE id = ?").run(newDone, req.params.id);
  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  res.json(updated);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});