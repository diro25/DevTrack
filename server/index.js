const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 5000;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());


// TEMPORARY: no login yet, so everything belongs to a single placeholder user.
// This will be replaced with the real logged-in user's id once auth is built.
const TEMP_USER_ID = 1;
  const JWT_SECRET = "devtrack-dev-secret-change-later";
db.prepare(
  `INSERT OR IGNORE INTO users (id, name, email, password) VALUES (1, 'Temp User', 'temp@example.com', 'placeholder')`
).run();

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
app.get("/topics", (req, res) => {
  const topics = db
    .prepare("SELECT * FROM topics WHERE user_id = ?")
    .all(TEMP_USER_ID);
  res.json(topics);
});

app.post("/topics", (req, res) => {
  const { title } = req.body;
  const result = db
    .prepare("INSERT INTO topics (user_id, title, status) VALUES (?, ?, 'Not Started')")
    .run(TEMP_USER_ID, title);
  const newTopic = db.prepare("SELECT * FROM topics WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newTopic);
});

app.delete("/topics/:id", (req, res) => {
  db.prepare("DELETE FROM topics WHERE id = ? AND user_id = ?").run(req.params.id, TEMP_USER_ID);
  res.status(204).send();
});

// ---- PROJECTS ----
app.get("/projects", (req, res) => {
  const projects = db
    .prepare("SELECT * FROM projects WHERE user_id = ?")
    .all(TEMP_USER_ID);
  res.json(projects);
});

app.post("/projects", (req, res) => {
  const { name, description } = req.body;
  const result = db
    .prepare(
      "INSERT INTO projects (user_id, name, description, status) VALUES (?, ?, ?, 'Not Started')"
    )
    .run(TEMP_USER_ID, name, description);
  const newProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newProject);
});

app.delete("/projects/:id", (req, res) => {
  db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(req.params.id, TEMP_USER_ID);
  res.status(204).send();
});

// ---- TASKS (new — wasn't in the backend before) ----
app.get("/tasks", (req, res) => {
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE user_id = ?")
    .all(TEMP_USER_ID);
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const { title } = req.body;
  const result = db
    .prepare("INSERT INTO tasks (user_id, title, done) VALUES (?, ?, 0)")
    .run(TEMP_USER_ID, title);
  const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newTask);
});

app.put("/tasks/:id", (req, res) => {
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, TEMP_USER_ID);
  if (!task) return res.status(404).send();
  const newDone = task.done ? 0 : 1;
  db.prepare("UPDATE tasks SET done = ? WHERE id = ?").run(newDone, req.params.id);
  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  res.json(updated);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});