require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sql = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requireAuth = require("./middleware");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in server/.env");

const STATUS_CYCLE = ["Not Started", "In Progress", "Done"];

function nextStatus(current) {
  const index = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
}

// Sends any error inside an async route to the error handler at the bottom
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.use(cors());
app.use(express.json());

// Checks that :id in the URL is a real number
app.param("id", (req, res, next, value) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  req.itemId = id;
  next();
});

app.get("/", (req, res) => {
  res.send("DevTrack backend is running");
});

// ---- AUTH ----
app.post(
  "/register",
  wrap(async (req, res) => {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existing = await sql.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rows = await sql.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      [name, email, hashedPassword]
    );

    const token = jwt.sign({ userId: rows[0].id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, name, email });
  })
);

app.post(
  "/login",
  wrap(async (req, res) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const rows = await sql.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, name: user.name, email: user.email });
  })
);

// ---- TOPICS ----
app.get(
  "/topics",
  requireAuth,
  wrap(async (req, res) => {
    const rows = await sql.query(
      "SELECT * FROM topics WHERE user_id = $1 ORDER BY id",
      [req.userId]
    );
    res.json(rows);
  })
);

app.post(
  "/topics",
  requireAuth,
  wrap(async (req, res) => {
    const title = (req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const rows = await sql.query(
      "INSERT INTO topics (user_id, title, status) VALUES ($1, $2, 'Not Started') RETURNING *",
      [req.userId, title]
    );
    res.status(201).json(rows[0]);
  })
);

app.put(
  "/topics/:id",
  requireAuth,
  wrap(async (req, res) => {
    const found = await sql.query(
      "SELECT * FROM topics WHERE id = $1 AND user_id = $2",
      [req.itemId, req.userId]
    );
    if (found.length === 0) return res.status(404).send();

    const rows = await sql.query(
      "UPDATE topics SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [nextStatus(found[0].status), req.itemId, req.userId]
    );
    res.json(rows[0]);
  })
);

app.delete(
  "/topics/:id",
  requireAuth,
  wrap(async (req, res) => {
    await sql.query("DELETE FROM topics WHERE id = $1 AND user_id = $2", [
      req.itemId,
      req.userId,
    ]);
    res.status(204).send();
  })
);

// ---- PROJECTS ----
app.get(
  "/projects",
  requireAuth,
  wrap(async (req, res) => {
    const rows = await sql.query(
      "SELECT * FROM projects WHERE user_id = $1 ORDER BY id",
      [req.userId]
    );
    res.json(rows);
  })
);

app.post(
  "/projects",
  requireAuth,
  wrap(async (req, res) => {
    const name = (req.body.name || "").trim();
    const description = (req.body.description || "").trim();
    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are required" });
    }

    const rows = await sql.query(
      "INSERT INTO projects (user_id, name, description, status) VALUES ($1, $2, $3, 'Not Started') RETURNING *",
      [req.userId, name, description]
    );
    res.status(201).json(rows[0]);
  })
);

app.put(
  "/projects/:id",
  requireAuth,
  wrap(async (req, res) => {
    const found = await sql.query(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [req.itemId, req.userId]
    );
    if (found.length === 0) return res.status(404).send();

    const rows = await sql.query(
      "UPDATE projects SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [nextStatus(found[0].status), req.itemId, req.userId]
    );
    res.json(rows[0]);
  })
);

app.delete(
  "/projects/:id",
  requireAuth,
  wrap(async (req, res) => {
    await sql.query("DELETE FROM projects WHERE id = $1 AND user_id = $2", [
      req.itemId,
      req.userId,
    ]);
    res.status(204).send();
  })
);

// ---- TASKS ----
app.get(
  "/tasks",
  requireAuth,
  wrap(async (req, res) => {
    const rows = await sql.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id",
      [req.userId]
    );
    res.json(rows);
  })
);

app.post(
  "/tasks",
  requireAuth,
  wrap(async (req, res) => {
    const title = (req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const rows = await sql.query(
      "INSERT INTO tasks (user_id, title, done) VALUES ($1, $2, FALSE) RETURNING *",
      [req.userId, title]
    );
    res.status(201).json(rows[0]);
  })
);

app.put(
  "/tasks/:id",
  requireAuth,
  wrap(async (req, res) => {
    const rows = await sql.query(
      "UPDATE tasks SET done = NOT done WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.itemId, req.userId]
    );
    if (rows.length === 0) return res.status(404).send();
    res.json(rows[0]);
  })
);

app.delete(
  "/tasks/:id",
  requireAuth,
  wrap(async (req, res) => {
    await sql.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [
      req.itemId,
      req.userId,
    ]);
    res.status(204).send();
  })
);

// Catches any error that happens inside a route
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});