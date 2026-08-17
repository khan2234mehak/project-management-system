# Pulseboard — Enterprise Project Management System

A full-stack project management platform (Jira/Trello/Asana-style) built with **React + Redux Toolkit** on the frontend and **Node.js + Express + MySQL** on the backend, with real-time updates via **Socket.IO**.

This README covers setup, architecture, what's fully implemented, and what's intentionally scoped down from the original spec (and why).

---
🌐 **[Live Demo](pulseboard-ten-khaki.vercel.app)**

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Redux Toolkit, React Router 6, Tailwind CSS 3, Axios, React DnD, Recharts, Socket.IO client |
| Backend | Node.js, Express, SQLite (`better-sqlite3`), JWT, bcrypt, Multer, Socket.IO |
| Database | SQLite — zero setup, single file at `backend/database/pms.sqlite` |
| File storage | Local disk by default, swappable to Cloudinary via one env var |
| Reports | ExcelJS (.xlsx), PDFKit (.pdf) |

---

## 2. Project Structure

```
project-management-system/
├── backend/
│   ├── database/
│   │   ├── schema.sql       # Full MySQL schema (12 tables, FKs, indexes)
│   │   └── seed.sql         # Roles + a default admin account
│   ├── src/
│   │   ├── config/          # DB pool, app-wide constants/enums
│   │   ├── controllers/     # Business logic per module
│   │   ├── middleware/      # auth, validation, upload, error handling
│   │   ├── routes/          # Express routers
│   │   ├── sockets/         # Socket.IO server + room logic
│   │   ├── utils/           # JWT, mailer, storage adapter, activity logger...
│   │   └── server.js        # Entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/store.js     # Redux store
    │   ├── features/        # One folder per domain: auth, projects, tasks...
    │   ├── pages/            # Route-level page components
    │   ├── layouts/          # AuthLayout, DashboardLayout
    │   ├── components/       # Shared UI (Avatar, Modal, badges, layout chrome)
    │   └── hooks/             # useAuth, useSocket, useDebouncedValue
    └── .env.example
```

---

## 3. Getting Started

### Prerequisites
- Node.js 18+
- **No database server needed** — SQLite is a local file, created automatically

### Backend

```bash
cd backend
cp .env.example .env       # edit JWT secrets; all other defaults work out of the box
npm install
npm run setup              # runs migrate + seed in one step
npm run dev                # starts the API on http://localhost:5007
```

**Default admin login:** `admin@pms.local` / `Admin@123` — change this password after first login.

### Frontend

```bash
cd frontend
cp .env.example .env       # defaults to http://localhost:5007, change if needed
npm install
npm run dev                  # starts the app on http://localhost:5173
```

Open `http://localhost:5173` and log in with the seeded admin account, or register a new (team member) account.

---

## 4. Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full list with comments. Key ones:

- `JWT_SECRET` / `JWT_REFRESH_SECRET` — **change these** before any real deployment.
- `DB_PATH` — path to the SQLite file (default: `./database/pms.sqlite`). Created automatically on `npm run migrate`.
- `STORAGE_PROVIDER` — `local` (default, zero setup) or `cloudinary` (requires `CLOUDINARY_*` credentials).
- `SMTP_HOST` — if left blank, verification/reset emails are logged to the backend console instead of sent.

---

## 5. What's Fully Implemented

Matching the original spec section by section:

- **Auth & Security** — register, login, logout, email verification, forgot/reset password, JWT + refresh-token rotation, bcrypt hashing, rate limiting, role-based authorization, blocked-user enforcement.
- **Dashboard** — summary cards, project progress / task priority / monthly completion / team productivity charts (Recharts), recent activity feed. Scoped per role (admins/PMs see org-wide, team members see their own).
- **User Management** — list/search/filter (role, status), edit profile, block/unblock, role change, delete, avatar upload.
- **Project Management** — full CRUD, status workflow (planning → in_progress → testing → completed), team assignment, auto-computed progress %, search/filter/sort.
- **Team Management** — CRUD, add/remove members, lead/member roles, per-team metrics (projects, completion rate).
- **Task Management + Kanban Board** — full CRUD, 5-column board (Backlog/To Do/In Progress/Review/Done), real drag-and-drop with position persistence, priority levels, due dates, assignees, live multi-user sync via Socket.IO.
- **Subtasks** — create/edit/delete/toggle, parent-child to tasks, completion %.
- **Comments** — threaded (parent_id), @mentions with notification, edit/delete, real-time via Socket.IO.
- **File Attachments** — task- and project-level uploads, preview/download/delete, pluggable storage (local/Cloudinary).
- **Notifications** — real-time via Socket.IO + persisted history, covers task assignment, status changes, comments, mentions, team invites.
- **Search & Filtering** — projects, tasks, teams, users; by status/priority/assignee/date; sortable.
- **Calendar** — month view with task/project deadlines, day detail panel.
- **Activity Logging** — every significant action (auth, CRUD on all entities) recorded with actor, timestamp, description, metadata.
- **Login Tracking** — login/logout timestamps, session duration, IP, device/browser info, per-user history.
- **Admin Login Monitoring** — total/active/online users, last login per user, daily/weekly/monthly login stats with charts.
- **User Activity Dashboard** — self-service profile, login history table, activity timeline.
- **Reports** — Excel and PDF export for project progress, team productivity, user performance, task completion, and login activity.
- **UI/UX** — responsive layout, dark/light mode, sidebar + mobile bottom nav, skeleton loaders, toast notifications, empty states.
- **Security** — Helmet, CORS, rate limiting, parameterized queries throughout (no string-concatenated SQL), express-validator on all write endpoints.

## 6. Intentionally Scoped Down

A couple of spec items were deliberately simplified rather than half-built:

- **Calendar** ships with a month view (the spec's primary use case) rather than day/week/month toggles.
- **Cloudinary** is wired and ready but defaults to local disk storage so the project runs immediately without external credentials — flip `STORAGE_PROVIDER=cloudinary` in `.env` once you have keys.

Everything else in the original spec is implemented as described above.

---

## 7. Architecture Notes

- **Auth**: short-lived JWT access token (sent via `Authorization: Bearer`) + long-lived refresh token (httpOnly cookie). The frontend Axios client auto-refreshes on 401 and retries the original request once.
- **Real-time**: a single shared Socket.IO connection per session. Clients join `user:<id>` (notifications), `project:<id>` (Kanban board), and `task:<id>` (comments) rooms as needed.
- **File storage**: a thin adapter (`backend/src/utils/storage.js`) abstracts local-disk vs. Cloudinary so controllers never branch on provider.
- **Authorization**: enforced both at the route level (`authorize('admin', ...)` middleware) and inside controllers where row-level ownership matters (e.g. editing your own comment, viewing your own login history).
- **Kanban drag-and-drop**: optimistic UI update on drop, persisted via `PATCH /tasks/:id/move`, with automatic rollback (full board refetch) if the API call fails.

---

## 8. Default Roles

| Role | Capabilities |
|---|---|
| `admin` | Everything: user management, login monitoring, all project/team/task operations |
| `project_manager` | Create/manage projects, teams, tasks; cannot manage users or view login monitoring |
| `team_member` | View assigned work, update their tasks, comment, upload files |

Public registration always creates a `team_member` account; admins promote users via the Users page.
