# DevTrack

A full-stack learning progress tracker for developers. Create an account, list the topics you're studying, track your side projects, and keep a daily task list with due dates. Every account has its own private data.

**Live app:** https://dev-track-vert.vercel.app

> The backend runs on a free hosting plan that goes to sleep when idle. The first request after a quiet period can take 30-50 seconds. After that it responds normally.

## Features

- **User accounts**: register and log in, with passwords stored as bcrypt hashes
- **Private data**: each account only ever sees its own topics, projects, and tasks
- **Learning topics**: add, rename, delete, and click a topic to cycle its status (Not Started → In Progress → Done)
- **Projects**: track side projects with a name, description, and status, and edit them in place
- **Daily tasks**: add, edit, complete, and delete tasks, with To do / Done / Overdue filters
- **Due dates**: give tasks an optional due date and get Overdue, Due today, and upcoming labels, plus an Overdue counter on the dashboard
- **Activity chart**: a 7-day bar chart of the tasks and topics you finished each day, grouped by your own time zone
- **Search and filters**: search topics and projects by text and narrow them by status
- **Inline editing**: edit any item directly on its card, with Enter to save and Esc to cancel
- **Light and dark theme**: a toggle that remembers your choice and starts from your system preference
- **Interactive background**: slowly drifting color shapes and a glow that follows the mouse (turned off for users who prefer reduced motion)
- **Instant feedback**: toast messages confirm every action and explain any error
- **Real progress bar**: calculated from how many of your topics are marked Done
- **Loading and error states**: clear messages while data loads or if the server can't be reached
- **Protected API**: the backend rejects any request without a valid login token

## Tech stack

| Layer | Technology | Hosted on |
|---|---|---|
| Frontend | React (Vite), React Router, plain CSS | Vercel |
| Backend | Node.js, Express | Render |
| Database | PostgreSQL | Neon |
| Auth | bcryptjs (password hashing), jsonwebtoken (JWT) | |

## Architecture

```
React app (Vercel)
      │  fetch() with  Authorization: Bearer <token>
      ▼
Express API (Render)
      │  requireAuth middleware verifies the token
      ▼
PostgreSQL (Neon)
      users ─┬─ topics  (status, completed_at)
             ├─ tasks   (done, due_date, completed_at)
             └─ projects
```

Every topic, task, and project row has a `user_id` linking it to its owner, and every query filters by the logged-in user's id.

The backend talks to Postgres through Neon's serverless driver (`@neondatabase/serverless`), which sends queries over HTTPS instead of a direct TCP connection. This works on networks that block the standard Postgres port.

On the frontend, a small `api()` helper in `src/api.js` attaches the login token to every request and turns server errors into readable messages, and a `ToastContext` shows them to the user.

The activity chart reads `completed_at` timestamps. The browser sends its time zone with the request, so a task finished late in the evening is counted on the correct local day.

## API endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/register` | Create an account, returns a token | No |
| POST | `/login` | Log in, returns a token | No |
| GET | `/topics` | List your topics | Yes |
| POST | `/topics` | Add a topic | Yes |
| PUT | `/topics/:id` | Cycle a topic's status | Yes |
| PATCH | `/topics/:id` | Rename a topic | Yes |
| DELETE | `/topics/:id` | Delete a topic | Yes |
| GET | `/projects` | List your projects | Yes |
| POST | `/projects` | Add a project | Yes |
| PUT | `/projects/:id` | Cycle a project's status | Yes |
| PATCH | `/projects/:id` | Edit a project's name and description | Yes |
| DELETE | `/projects/:id` | Delete a project | Yes |
| GET | `/tasks` | List your tasks | Yes |
| POST | `/tasks` | Add a task (optional `dueDate`) | Yes |
| PUT | `/tasks/:id` | Toggle a task done / not done | Yes |
| PATCH | `/tasks/:id` | Edit a task's title and/or due date | Yes |
| DELETE | `/tasks/:id` | Delete a task | Yes |
| GET | `/activity?days=7&tz=...` | Tasks and topics finished per day, for the chart | Yes |

## Run it locally

You need Node.js and a free PostgreSQL database (for example from [Neon](https://neon.com)).

**1. Backend**

```bash
cd server
npm install
```

Create a file named `server/.env` containing:

```
JWT_SECRET=a_long_random_string
DATABASE_URL=your_postgres_connection_string
```

Generate a random secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create the tables (run once on a new database), then start the server:

```bash
node setup-db.js
node index.js
```

The API runs on `http://localhost:5000`.

If you already have a database from an earlier version of this project, add the newer columns instead of running the setup again:

```bash
node migrate-due-dates.js
node migrate-completed-at.js
```

**2. Frontend**

In a second terminal, from the project root:

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `JWT_SECRET` | Backend | Signs and verifies login tokens |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `FRONTEND_URL` | Backend (production) | The only website allowed to call the API |
| `VITE_API_URL` | Frontend (production) | Address of the backend API |

Secrets are never committed. `server/.env` is listed in `.gitignore`.

## Known limitations

- The free backend sleeps when idle, so the first request can be slow.
- No password reset or email verification.
- The login token is stored in the browser's `localStorage`.
- No rate limiting on the API.
- The activity chart only counts items finished after completion tracking was added, so older items don't appear.
- Items can't be reordered.

## What this project demonstrates

The complete request lifecycle of a real web application: a click in React becomes a `fetch` call, travels to Express, is authenticated by middleware, reads or writes a SQL database, and returns JSON that updates the UI, with all data scoped to the logged-in user and the whole stack deployed online.