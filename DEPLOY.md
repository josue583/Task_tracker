# Deploying the Task Tracker App

This guide deploys the **backend** (Node + Express + MongoDB) and **frontend** (Vite + TypeScript) so the app works on the internet. You'll use:

- **MongoDB Atlas** – free cloud database  
- **Render** – free tier for the backend API  
- **Vercel** – free tier for the frontend  

---

## 1. MongoDB Atlas (database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a **free cluster** (e.g. M0).
3. **Database Access** → Add user (username + password). Note the password.
4. **Network Access** → Add IP Address → "Allow Access from Anywhere" (`0.0.0.0/0`) for simplicity (or add Render's IPs later).
5. **Database** → Connect → **Drivers** → copy the connection string. It looks like:
   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `USER` and `PASSWORD` with your DB user. Add a database name in the path, e.g.:
   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/task-tracker?retryWrites=true&w=majority
   ```
   Save this as your **MONGODB_URI** (you'll use it in Render).

---

## 2. Deploy backend (Render)

1. Push your code to **GitHub** (this repo: one repo with `task-tracker-backend` and `task-tracker-frontend` inside the **task-tracker** folder).
2. Go to [render.com](https://render.com) and sign in with GitHub.
3. **New** → **Web Service**.
4. Connect the repo. Set **Root Directory** to `task-tracker-backend` (relative to repo root). If your repo root is the **task-tracker** folder, use `task-tracker-backend`. If your repo root is the parent of task-tracker, use `task-tracker/task-tracker-backend`.
5. **Build Command**: `npm install`. **Start Command**: `npm start`. **Instance Type**: Free.
6. **Environment**: `MONGODB_URI`, `JWT_SECRET`, and later `FRONTEND_URL`.
7. Deploy. Copy the backend URL for the frontend.

---

## 3. Deploy frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New** → **Project** → import the same repo.
3. **Root Directory**: `task-tracker-frontend` (or `task-tracker/task-tracker-frontend` if repo root is parent of task-tracker).
4. **Environment**: `VITE_API_URL` = your backend URL (no trailing slash).
5. Deploy. Copy the frontend URL.

---

## 4. CORS

In Render, set `FRONTEND_URL` to your Vercel frontend URL. Redeploy.

---

## 5. Test

Open the frontend URL, register, log in, add tasks.

---

## Root directory on Render / Vercel

- If your **GitHub repo root** is the **task-tracker** folder (you only pushed the contents of task-tracker):
  - Render **Root Directory**: `task-tracker-backend`
  - Vercel **Root Directory**: `task-tracker-frontend`

- If your **GitHub repo root** is the **parent** of task-tracker (e.g. you pushed from `e:\cursor` and have `task-tracker\` inside):
  - Render **Root Directory**: `task-tracker/task-tracker-backend`
  - Vercel **Root Directory**: `task-tracker/task-tracker-frontend`
