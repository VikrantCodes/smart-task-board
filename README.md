# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# smart-task-board


# Smart Task Board — Deployment Guide

**Stack:** React (Vite) · Flask · SQLite  
**Frontend deployed on:** Vercel  
**Backend deployed on:** Render  
**GitHub repo:** https://github.com/VikrantCodes/smart-task-board/

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [What Changed: Old ZIP → Deployable Version](#2-what-changed-old-zip--deployable-version)
3. [File-by-File Diff](#3-file-by-file-diff)
4. [Deploy Backend on Render](#4-deploy-backend-on-render)
5. [Deploy Frontend on Vercel](#5-deploy-frontend-on-vercel)
6. [Local Development Setup](#6-local-development-setup)
7. [Quick Checklist](#7-quick-checklist)

---

## 1. Project Structure

```
smart-task-board/
├── backend/
│   ├── app.py              # Flask API server
│   ├── database.py         # SQLite helpers (get_db, init_db)
│   └── requirements.txt    # Python dependencies (includes gunicorn)
│
├── src/
│   ├── api.js              # All fetch() calls — BASE_URL lives here
│   ├── App.jsx             # Root React component
│   ├── components/
│   │   ├── TaskForm.jsx
│   │   ├── TaskItem.jsx
│   │   └── TaskList.jsx
│   ├── main.jsx
│   ├── styles.css
│   └── index.css
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
└── .gitignore
```

---

## 2. What Changed: Old ZIP → Deployable Version

The original ZIP (`smart-task-board.zip`) was set up for **local development only**. Five specific changes were made to make the project production-deployable.

### Change 1 — `backend/app.py`: Server startup & CORS

The original ran Flask in debug mode bound only to `localhost`. This does not work on Render (or any cloud host) because:
- Debug mode is insecure in production
- `localhost` only accepts connections from the same machine — Render needs `0.0.0.0`
- `CORS(app)` allowed all origins — the new version locks CORS to the Vercel URL

Also, `init_db()` was moved from `if __name__ == '__main__'` into module-level so it runs even when gunicorn imports the app (gunicorn never calls `__main__`).

**Old `backend/app.py` (bottom section):**
```python
# CORS open to all origins
CORS(app)

if __name__ == '__main__':
    init_db()           # ← only called when run directly, not by gunicorn
    app.run(debug=True, port=5000)
```

**New `backend/app.py` (top & bottom):**
```python
import os                # ← added to read PORT env variable

app = Flask(__name__)
init_db()               # ← moved to module level so gunicorn triggers it

# CORS locked to your Vercel domain
CORS(app, origins=['https://smart-task-board-seven.vercel.app'])

# ...routes unchanged...

if __name__ == '__main__':
    # Binds to 0.0.0.0 and reads PORT from Render's environment
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
```

---

### Change 2 — `backend/requirements.txt`: Added gunicorn

Render (and any production WSGI host) needs **gunicorn** — the Flask built-in server is single-threaded and not suitable for production. It was missing from the original file.

**Old `requirements.txt`:**
```
blinker==1.9.0
click==8.1.8
Flask==3.1.3
flask-cors==6.0.2
importlib_metadata==8.7.1
itsdangerous==2.2.0
Jinja2==3.1.6
MarkupSafe==3.0.3
Werkzeug==3.1.8
zipp==3.23.1
```

**New `requirements.txt`** (additions highlighted):
```
blinker==1.9.0
click==8.1.8
Flask==3.1.3
flask-cors==6.0.2
gunicorn==23.0.0          ← ADDED — production WSGI server
importlib_metadata==8.7.1
itsdangerous==2.2.0
Jinja2==3.1.6
MarkupSafe==3.0.3
packaging==26.2           ← ADDED — gunicorn dependency
Werkzeug==3.1.8
zipp==3.23.1
```

---

### Change 3 — `src/api.js`: BASE_URL points to Render

In development the frontend talks to `http://127.0.0.1:5000`. Once deployed, it must point to the live Render URL.

**Old `src/api.js`:**
```js
const BASE_URL = 'http://127.0.0.1:5000';
```

**New `src/api.js`:**
```js
// const BASE_URL = 'http://127.0.0.1:5000';      ← commented out (kept for reference)
const BASE_URL = 'https://smart-task-board-n7k9.onrender.com/';
```

> **Note:** The trailing slash on the Render URL is harmless but be aware that routes in `app.py` start with `/tasks` — double slashes (`//tasks`) are handled fine by Flask/browsers but it's cleaner to remove the trailing slash from `BASE_URL`.

---

### Change 4 — `.gitignore`: Python and database entries added

The original `.gitignore` only covered Node/React artifacts. The new version adds Python and database ignores so the `venv/`, `__pycache__/`, `.env`, and `*.db` files are never committed to GitHub.

**Lines added to `.gitignore`:**
```gitignore
# Python
__pycache__/
*.pyc
venv/
.env

# Database
*.db
instance/
```

> **Why `*.db` matters:** Committing `tasks.db` to Git means Render would use a stale database from the repo rather than creating a fresh one. Since `init_db()` runs on startup, the DB is always auto-created on Render's filesystem.

---

### Change 5 — `public/` directory: Added SVG assets

The old ZIP had an empty `public/` folder. The deployed version added:
- `public/favicon.svg` — the browser tab icon referenced in `index.html`
- `public/icons.svg` — additional icon assets used by the UI

Without `favicon.svg`, the browser logs a 404 for every page load (cosmetic but noisy).

---

## 3. File-by-File Diff

| File | Old ZIP | New (Deployed) | What changed |
|---|---|---|---|
| `backend/app.py` | `CORS(app)` · `init_db()` inside `__main__` · `app.run(debug=True)` | `CORS(app, origins=[...])` · `init_db()` at module level · `app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))` | Production server binding, CORS locked, gunicorn-compatible startup |
| `backend/requirements.txt` | Missing `gunicorn`, `packaging` | Added `gunicorn==23.0.0`, `packaging==26.2` | gunicorn required for Render |
| `src/api.js` | `BASE_URL = 'http://127.0.0.1:5000'` | `BASE_URL = 'https://smart-task-board-n7k9.onrender.com/'` | Points to live backend |
| `.gitignore` | Node/React only | Added Python + DB patterns | Prevents venv and .db commits |
| `public/` | Empty | `favicon.svg`, `icons.svg` | Browser assets |
| `backend/tasks.db` | Committed in ZIP | Gitignored, auto-created at runtime | DB not in version control |
| `backend/venv/` | Included in ZIP | Gitignored | Never commit venv |
| `node_modules/` | Included in ZIP | Gitignored | Never commit node_modules |

---

## 4. Deploy Backend on Render

### Step 1 — Push your code to GitHub

Make sure your repository has the updated files (especially `requirements.txt` with gunicorn and the new `app.py`). The `backend/` folder must be at the repo root.

```bash
git add .
git commit -m "production: gunicorn, host 0.0.0.0, CORS locked"
git push origin main
```

### Step 2 — Create a new Web Service on Render

1. Go to https://render.com and sign in.
2. Click **New → Web Service**.
3. Connect your GitHub account and select the `smart-task-board` repository.

### Step 3 — Configure the Web Service

Fill in the following fields exactly:

| Field | Value |
|---|---|
| **Name** | `smart-task-board` (or any name — this sets your Render URL) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app` |
| **Instance Type** | Free (or paid for persistence) |

> **Root Directory is critical.** Setting it to `backend` tells Render to `cd backend` before running anything, so `requirements.txt` and `app.py` are found correctly.

### Step 4 — Set Environment Variables (optional but recommended)

In **Environment → Add Environment Variable**:

| Key | Value |
|---|---|
| `PYTHON_VERSION` | `3.11.0` |

Render auto-injects `PORT` — your `app.py` already reads it with `os.environ.get("PORT", 5000)`.

### Step 5 — Deploy

Click **Create Web Service**. Render will:
1. Clone your repo
2. Run `pip install -r requirements.txt` (installs Flask + gunicorn)
3. Run `gunicorn app:app` (starts the server)
4. Assign a public URL like `https://smart-task-board-n7k9.onrender.com`

### Step 6 — Verify the backend

Open your Render URL in a browser and append `/tasks`:

```
https://smart-task-board-n7k9.onrender.com/tasks
```

You should see an empty JSON array: `[]`

### ⚠️ Free Tier Note

On Render's free tier, the service **spins down after 15 minutes of inactivity**. The first request after a spin-down takes 30–60 seconds. This is normal. Upgrade to a paid instance or use a cron pinger (e.g., UptimeRobot) to keep it warm.

---

## 5. Deploy Frontend on Vercel

### Step 1 — Update `src/api.js` with your Render URL

Before deploying, make sure `api.js` points to your actual Render service URL:

```js
// src/api.js
const BASE_URL = 'https://YOUR-SERVICE-NAME.onrender.com';
```

Commit and push this change.

### Step 2 — Update CORS in `backend/app.py`

You need your Vercel URL **before** you can finish this step. If you don't know it yet, deploy Vercel first (Vercel assigns the URL on first deploy), then come back and update CORS.

```python
# backend/app.py
CORS(app, origins=['https://YOUR-APP.vercel.app'])
```

Push the change and Render will auto-redeploy.

### Step 3 — Import the project on Vercel

1. Go to https://vercel.com and sign in.
2. Click **Add New → Project**.
3. Select **Import Git Repository** → choose `smart-task-board`.

### Step 4 — Configure the project

Vercel auto-detects Vite/React projects. Confirm these settings:

| Field | Value |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `.` (repo root — not `src/`, not `backend/`) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

No environment variables are needed for the frontend (the Render URL is hardcoded in `api.js`).

### Step 5 — Deploy

Click **Deploy**. Vercel will:
1. Run `npm install`
2. Run `npm run build` (Vite builds to `/dist`)
3. Serve `/dist` as a static site on a CDN

Your app will be live at `https://smart-task-board-seven.vercel.app` (or your assigned URL).

### Step 6 — Verify end-to-end

1. Open your Vercel URL.
2. Add a task — it should appear after a moment (may be slow on first load if Render is waking up).
3. Check the browser DevTools → Network tab to confirm API calls go to your Render URL and return 200.

### Custom Domain (optional)

In **Vercel → Project → Settings → Domains**, add your domain. Vercel provisions SSL automatically.

---

## 6. Local Development Setup

### Backend

```bash
# Clone the repo
git clone https://github.com/VikrantCodes/smart-task-board.git
cd smart-task-board/backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask dev server
python app.py
# Server starts at http://127.0.0.1:5000
```

### Frontend

In a second terminal:

```bash
cd smart-task-board

# Temporarily switch api.js to localhost
# Edit src/api.js:
#   const BASE_URL = 'http://127.0.0.1:5000';

npm install
npm run dev
# App opens at http://localhost:5173
```

> Remember to revert `api.js` back to the Render URL before committing.

---

## 7. Quick Checklist

Use this before every deploy.

**Code changes:**
- [ ] `src/api.js` → `BASE_URL` points to Render URL (no trailing slash issues)
- [ ] `backend/app.py` → `CORS` origins list includes Vercel URL
- [ ] `backend/app.py` → `init_db()` called at module level (not inside `__main__`)
- [ ] `backend/app.py` → `app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))`
- [ ] `backend/requirements.txt` → `gunicorn` is present
- [ ] `.gitignore` → `venv/`, `*.db`, `node_modules/`, `dist/` all listed
- [ ] `tasks.db` is **not** committed to Git
- [ ] `venv/` is **not** committed to Git
- [ ] `node_modules/` is **not** committed to Git

**Render (backend):**
- [ ] Root Directory set to `backend`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `gunicorn app:app`
- [ ] Service is live — `/tasks` returns `[]`

**Vercel (frontend):**
- [ ] Framework Preset: Vite
- [ ] Root Directory: `.` (repo root)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Deployment successful — app loads in browser

---

*Generated from comparison of `smart-task-board.zip` (original) and `smart-task-board-main.zip` (deployed), cross-referenced with https://github.com/VikrantCodes/smart-task-board/*
