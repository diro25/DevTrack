# DevTrack

A full-stack learning progress tracker for developers. Track what you're learning, manage side projects, and stay on top of daily tasks — all backed by a real database and user accounts.

Built as a hands-on project to learn the complete full-stack flow: React frontend → REST API → Express backend → SQLite database, with real authentication end to end.

## Features

- **User accounts** — register and log in with a hashed, securely stored password
- **Per-user data** — every account has its own private topics, projects, and tasks
- **Learning Topics** — add topics you're studying, click to cycle status (Not Started → In Progress → Done)
- **Projects** — track side projects with a name, description, and status
- **Daily Tasks** — a simple to-do list with add, complete, and delete
- **Real progress bar** — calculated live from how many of your topics are marked Done, not hardcoded
- **Protected routes** — the backend rejects any request without a valid login token

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- Plain CSS

**Backend**
- Node.js + Express
- SQLite (via `better-sqlite3`)
- `bcryptjs` for password hashing
- `jsonwebtoken` for authentication tokens

## Architecture

```
React (localhost:5173)
       │
       │  fetch() with Authorization: Bearer <token>
       ▼
Express API (localhost:5000)
       │
       │  requireAuth middleware verifies the token
       ▼
SQLite database (devtrack.db)
       │
users ──┬── topics
        ├── tasks
        └── projects
```

Every topic, task, and project row is linked to a `user_id`, so each account only ever sees its own data.

## API Endpoints

| Method | Route            | Description                       | Auth required |
|--------|-------------------|-----------------------------------|----------------|
| POST   | `/register`       | Create a new account              | No             |
| POST   | `/login`          | Log in, returns a token           | No             |
| GET    | `/topics`         | List your topics                  | Yes            |
| POST   | `/topics`         | Add a topic                       | Yes            |
| PUT    | `/topics/:id`     | Cycle a topic's status             | Yes            |
| DELETE | `/topics/:id`     | Delete a topic                    | Yes            |
| GET    | `/projects`       | List your projects                | Yes            |
| POST   | `/projects`       | Add a project                     | Yes            |
| PUT    | `/projects/:id`   | Cycle a project's status           | Yes            |
| DELETE | `/projects/:id`   | Delete a project                  | Yes            |
| GET    | `/tasks`          | List your tasks                   | Yes            |
| POST   | `/tasks`          | Add a task                        | Yes            |
| PUT    | `/tasks/:id`      | Toggle a task done/not done        | Yes            |
| DELETE | `/tasks/:id`      | Delete a task                     | Yes            |

## Running it locally

You'll need two terminal windows — one for the backend, one for the frontend.

**1. Backend**

```bash
cd server
npm install
node index.js
```

Runs on `http://localhost:5000`. A `devtrack.db` file will be created automatically on first run.

**2. Frontend**

In a separate terminal, from the project root:

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`.

**3. Use it**

Open `http://localhost:5173`, register an account, and start adding topics, projects, and tasks.

## Known limitations

- The JWT secret is currently hardcoded in `server/index.js` — in a production deployment this would move to an environment variable.
- No password reset flow.
- No editing of existing topics/projects (only add, cycle status, and delete).
- Not yet deployed — runs locally only.

## What this project demonstrates

The full request lifecycle of a real web app: a click in React triggers a `fetch` call, which travels to Express, gets authenticated by middleware, reads or writes to a SQL database, and returns JSON that updates the UI — with every piece of data correctly scoped to the logged-in user.