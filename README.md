# Task Tracker

A full-stack task tracker: **backend** (Node.js + Express + MongoDB) and **frontend** (Vite + TypeScript + Tailwind). One repo, two apps.

---

## Repository structure

```
├── task-tracker-backend/   # API (auth, tasks)
├── task-tracker-frontend/  # Web UI
├── DEPLOY.md               # How to deploy (Atlas, Render, Vercel)
└── README.md               # This file
```

---

## Run locally

**1. Backend**

```bash
cd task-tracker-backend
cp .env.example .env
# Edit .env: set MONGODB_URI and optionally JWT_SECRET
npm install
npm start
```

Runs at `http://localhost:5000`.

**2. Frontend**

```bash
cd task-tracker-frontend
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`). The app talks to the backend at `http://localhost:5000` by default.

---

## Deploy

See **[DEPLOY.md](./DEPLOY.md)** for hosting on MongoDB Atlas, Render (backend), and Vercel (frontend).

---

## Host on GitHub

From the repo root (this folder):

```bash
git init
git add .
git commit -m "Initial commit: Task Tracker backend + frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Then connect this repo to Render (backend) and Vercel (frontend) and set **Root Directory** to `task-tracker-backend` and `task-tracker-frontend` respectively.
