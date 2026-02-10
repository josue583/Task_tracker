# Deploy Task Tracker – step-by-step

Use this order. Your repo: **https://github.com/josue583/Task_tracker**

---

## Step 1: MongoDB Atlas (database)

1. Go to **https://www.mongodb.com/cloud/atlas** → sign up / log in.
2. **Create** a free cluster (M0).
3. **Database Access** → **Add Database User** → username + password → **Create** (save the password).
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) → **Confirm**.
5. **Database** → **Connect** → **Drivers** → copy the connection string.
6. Edit it: replace `<password>` with your user password, and add `/task-tracker` before `?`:
   ```text
   mongodb+srv://USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/task-tracker?retryWrites=true&w=majority
   ```
7. Save this string; you’ll paste it into Render as **MONGODB_URI**.

---

## Step 2: Backend on Render

1. Go to **https://render.com** → **Get Started** → sign in with **GitHub**.
2. **New +** → **Web Service**.
3. Connect **josue583/Task_tracker** (or find it under “Configure account” if needed).
4. Settings:
   - **Name**: `task-tracker-api` (or any name).
   - **Root Directory**: `task-tracker-backend` (click “Edit”, type it, Save).
   - **Runtime**: Node.
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free.
5. **Environment** (Add Environment Variable):
   - `MONGODB_URI` = your Atlas connection string from Step 1.
   - `JWT_SECRET` = any long random string (e.g. `mySecretKey123ChangeInProduction456`).
6. **Create Web Service**. Wait for the first deploy to finish.
7. Copy the service URL (e.g. `https://task-tracker-api-xxxx.onrender.com`) — **no trailing slash**. You’ll use it for Vercel and CORS.

---

## Step 3: Frontend on Vercel

1. Go to **https://vercel.com** → sign in with **GitHub**.
2. **Add New…** → **Project**.
3. Import **josue583/Task_tracker**.
4. Settings:
   - **Root Directory**: click **Edit** → set to `task-tracker-frontend` → **Continue**.
   - **Framework Preset**: Vite (should auto-detect).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   - Name: `VITE_API_URL`
   - Value: your Render backend URL from Step 2 (e.g. `https://task-tracker-api-xxxx.onrender.com`) — **no trailing slash**.
6. **Deploy**. Wait for it to finish.
7. Copy the frontend URL (e.g. `https://task-tracker-xxxx.vercel.app`). You’ll use it in the next step.

---

## Step 4: CORS (backend allows frontend)

1. In **Render** → your **task-tracker-api** service → **Environment**.
2. **Add Environment Variable**:
   - Key: `FRONTEND_URL`
   - Value: your Vercel frontend URL from Step 3 (e.g. `https://task-tracker-xxxx.vercel.app`).
3. **Save Changes**. Render will redeploy automatically.

---

## Step 5: Use the app

1. Open your **Vercel frontend URL** in the browser.
2. **Register** a new user, then **Log in**.
3. Add tasks, switch days, edit/delete — everything goes to your Render backend and MongoDB Atlas.

---

## Quick reference

| Where   | What to set |
|--------|-------------|
| Render | **Root Directory**: `task-tracker-backend` |
| Render | **Env**: `MONGODB_URI`, `JWT_SECRET`, then `FRONTEND_URL` |
| Vercel | **Root Directory**: `task-tracker-frontend` |
| Vercel | **Env**: `VITE_API_URL` = Render backend URL (no trailing slash) |

If something fails, check **Render** → Logs and **Vercel** → Deployments → Build logs.
