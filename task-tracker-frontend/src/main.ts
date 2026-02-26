import "./style.css";

const PRODUCTION_API = "https://task-tracker-1-ioxm.onrender.com";
const API_BASE =
  (import.meta.env.VITE_API_URL as string)?.trim() ||
  (import.meta.env.PROD ? PRODUCTION_API : "http://localhost:5000");
const TOKEN_KEY = "task_tracker_token";
const USER_KEY = "task_tracker_user";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  startTime: string | null;
  endTime: string | null;
  goalId?: string | null;
};

type Goal = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  targetDate: string;
  completed: boolean;
};

type User = { id: string; email: string; name?: string; role?: string };

const app = document.querySelector<HTMLDivElement>("#app")!;

// --- Auth helpers ---
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
function setUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

async function fetchApi(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers as object) },
  });
  if (res.status === 401) {
    clearAuth();
    renderAuthScreen();
  }
  return res;
}

// --- Auth screen: separate Login and Register forms ---
function showLoginForm() {
  const container = document.getElementById("auth-container");
  if (!container) return;
  container.innerHTML = `
    <h1 class="text-2xl font-bold text-center">Task Tracker</h1>
    <p class="text-sm text-slate-400 text-center">Log in to your account</p>
    <p id="auth-error" class="text-sm text-red-400 hidden"></p>
    <form id="login-form" class="space-y-3">
      <input id="login-email" type="email" placeholder="Email" required autocomplete="email"
        class="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500" />
      <input id="login-password" type="password" placeholder="Password" required autocomplete="current-password"
        class="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500" />
      <button type="submit" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium">Log in</button>
    </form>
    <p class="text-sm text-slate-400 text-center mt-4">
      Don't have an account? <button type="button" id="show-register-btn" class="text-indigo-400 hover:underline">Register</button>
    </p>
  `;
  document.getElementById("login-form")?.addEventListener("submit", handleLogin);
  document.getElementById("show-register-btn")?.addEventListener("click", showRegisterForm);
}

function showRegisterForm() {
  const container = document.getElementById("auth-container");
  if (!container) return;
  container.innerHTML = `
    <h1 class="text-2xl font-bold text-center">Task Tracker</h1>
    <p class="text-sm text-slate-400 text-center">Create an account</p>
    <p id="auth-error" class="text-sm text-red-400 hidden"></p>
    <form id="register-form" class="space-y-3">
      <input id="register-email" type="email" placeholder="Email" required autocomplete="email"
        class="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500" />
      <input id="register-password" type="password" placeholder="Password (min 6 characters)" required minlength="6" autocomplete="new-password"
        class="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500" />
      <input id="register-name" type="text" placeholder="Name (optional)" autocomplete="name"
        class="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500" />
      <button type="submit" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium">Register</button>
    </form>
    <p class="text-sm text-slate-400 text-center mt-4">
      Already have an account? <button type="button" id="show-login-btn" class="text-indigo-400 hover:underline">Log in</button>
    </p>
  `;
  document.getElementById("register-form")?.addEventListener("submit", handleRegister);
  document.getElementById("show-login-btn")?.addEventListener("click", showLoginForm);
}

async function handleLogin(e: Event) {
  e.preventDefault();
  const email = (document.getElementById("login-email") as HTMLInputElement).value.trim();
  const password = (document.getElementById("login-password") as HTMLInputElement).value;
  const authError = document.querySelector<HTMLParagraphElement>("#auth-error");
  if (authError) authError.classList.add("hidden");
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (authError) {
        authError.textContent = data.message || "Login failed.";
        authError.classList.remove("hidden");
      }
      return;
    }
    setToken(data.token);
    setUser(data.user);
    renderAppScreen();
  } catch (err) {
    if (authError) {
      authError.textContent =
        "Cannot reach server. Start the backend: open a terminal in task-tracker-backend and run npm start.";
      authError.classList.remove("hidden");
    }
    console.error("Login request failed:", err);
  }
}

async function handleRegister(e: Event) {
  e.preventDefault();
  const email = (document.getElementById("register-email") as HTMLInputElement).value.trim();
  const password = (document.getElementById("register-password") as HTMLInputElement).value;
  const name = (document.getElementById("register-name") as HTMLInputElement).value.trim();
  const authError = document.querySelector<HTMLParagraphElement>("#auth-error");
  if (authError) authError.classList.add("hidden");
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (authError) {
        authError.textContent = data.message || "Registration failed.";
        authError.classList.remove("hidden");
      }
      return;
    }
    setToken(data.token);
    setUser(data.user);
    renderAppScreen();
  } catch (err) {
    if (authError) {
      authError.textContent =
        "Cannot reach server. Start the backend: in task-tracker-backend run npm start.";
      authError.classList.remove("hidden");
    }
    console.error("Register request failed:", err);
  }
}

function renderAuthScreen() {
  app.innerHTML = `
    <div class="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex items-center justify-center px-3 sm:px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="w-full max-w-sm bg-slate-900/70 border border-slate-700/70 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6" id="auth-container"></div>
    </div>
  `;
  showLoginForm();
}

// --- App screen refs (set when we render app) ---
const refs: {
  taskList?: HTMLUListElement;
  taskInput?: HTMLInputElement;
  taskStartInput?: HTMLInputElement;
  taskEndInput?: HTMLInputElement;
  taskForm?: HTMLFormElement;
  emptyState?: HTMLParagraphElement;
  statTotal?: HTMLParagraphElement;
  statCompleted?: HTMLParagraphElement;
  statRemaining?: HTMLParagraphElement;
  apiErrorEl?: HTMLParagraphElement;
} = {};

let tasks: Task[] = [];
let goals: Goal[] = [];
let selectedDate: string = new Date().toISOString().slice(0, 10);
let editingTaskId: string | null = null;

// --- Alarm: ring when a task's start/end time matches current time ---
const ALARM_CHECK_INTERVAL_MS = 15_000; // check every 15 seconds
const firedAlarmKeys = new Set<string>();

function getLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getLocalTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // fallback: no sound if AudioContext not allowed (e.g. no user gesture yet)
  }
}

function showAlarmNotification(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

let alarmIntervalId: ReturnType<typeof setInterval> | null = null;

function checkAlarms() {
  const now = new Date();
  const today = getLocalDateStr(now);
  const currentTime = getLocalTimeStr(now);
  if (selectedDate !== today) return;
  for (const task of tasks) {
    if (task.date !== today) continue;
    const alarmTime = task.startTime || task.endTime;
    if (!alarmTime || alarmTime !== currentTime) continue;
    const key = `${task.id}-${today}-${alarmTime}`;
    if (firedAlarmKeys.has(key)) continue;
    firedAlarmKeys.add(key);
    const label = task.startTime ? "Time to start" : "Time's up";
    playAlarmSound();
    showAlarmNotification(`Task: ${task.title}`, `${label} – ${task.title}`);
  }
}

function startAlarmChecker() {
  if (alarmIntervalId) return;
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission();
  }
  alarmIntervalId = setInterval(checkAlarms, ALARM_CHECK_INTERVAL_MS);
}
function stopAlarmChecker() {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}

function showApiError(message: string) {
  if (refs.apiErrorEl) {
    refs.apiErrorEl.textContent = message;
    refs.apiErrorEl.classList.remove("hidden");
  }
}
function clearApiError() {
  if (refs.apiErrorEl) {
    refs.apiErrorEl.textContent = "";
    refs.apiErrorEl.classList.add("hidden");
  }
}

async function loadGoals() {
  try {
    const res = await fetchApi("/goals");
    if (!res.ok) return;
    const data = await res.json().catch(() => []);
    goals = Array.isArray(data) ? data : [];
    renderGoalsList();
    setupTaskGoalSelect();
  } catch {
    goals = [];
    renderGoalsList();
    setupTaskGoalSelect();
  }
}

async function addGoal(title: string, startDate: string, targetDate: string, description: string) {
  const goalsError = document.querySelector<HTMLParagraphElement>("#goals-error");
  if (goalsError) goalsError.classList.add("hidden");
  try {
    const res = await fetchApi("/goals", {
      method: "POST",
      body: JSON.stringify({ title, startDate, targetDate, description }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (goalsError) {
        goalsError.textContent = data.message || "Failed to add goal.";
        goalsError.classList.remove("hidden");
      }
      return;
    }
    goals.push(data as Goal);
    renderGoalsList();
    setupTaskGoalSelect(); // refresh daily task Goal dropdown so new goal appears
  } catch (err) {
    if (goalsError) {
      goalsError.textContent =
        "Cannot reach server. Start the backend (npm start in task-tracker-backend) and use this app at http://localhost:5174";
      goalsError.classList.remove("hidden");
    }
    console.error("Save goal failed:", err);
  }
}

async function toggleGoalCompleted(goalId: string, completed: boolean) {
  try {
    const res = await fetchApi(`/goals/${encodeURIComponent(goalId)}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as Goal;
    goals = goals.map((g) => (g.id === goalId ? updated : g));
    renderGoalsList();
  } catch {
    // ignore for now
  }
}

async function deleteGoal(goalId: string) {
  if (!goalId || !String(goalId).trim()) return;
  const goalsError = document.querySelector<HTMLParagraphElement>("#goals-error");
  if (goalsError) goalsError.classList.add("hidden");
  try {
    const res = await fetchApi(`/goals/${encodeURIComponent(goalId)}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      if (goalsError) {
        goalsError.textContent = data.message || "Failed to delete goal.";
        goalsError.classList.remove("hidden");
      }
      return;
    }
    goals = goals.filter((g) => String(g.id) !== String(goalId));
    renderGoalsList();
    setupTaskGoalSelect();
  } catch (err) {
    if (goalsError) {
      goalsError.textContent = "Could not delete goal. Check your connection.";
      goalsError.classList.remove("hidden");
    }
    console.error("Delete goal failed:", err);
  }
}

function setupTaskGoalSelect() {
  const select = document.getElementById("task-goal") as HTMLSelectElement | null;
  if (!select) return;
  const previous = select.value;
  select.innerHTML = '<option value="">No goal</option>';
  for (const g of goals) {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.title;
    select.appendChild(opt);
  }
  if (previous) {
    select.value = previous;
  }
}

function renderGoalsList() {
  const list = document.querySelector<HTMLUListElement>("#goals-list");
  const empty = document.querySelector<HTMLParagraphElement>("#goals-empty");
  if (!list || !empty) return;
  list.innerHTML = "";
  if (!goals.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  const sorted = [...goals].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  for (const g of sorted) {
    // Progress logic:
    // - If goal is marked completed, bar is 100%.
    // - Otherwise, each completed task linked to this goal *today* adds 2%,
    //   capped below 100% (only the goal checkbox can make it full).
    const today = getTodayStr();
    const relatedTasks = tasks.filter((t) => String(t.goalId || "") === String(g.id) && t.date === today);
    const completedSteps = relatedTasks.filter((t) => t.completed).length;
    const totalSteps = relatedTasks.length;
    const percent = g.completed ? 100 : Math.min(98, completedSteps * 2);
    const li = document.createElement("li");
    li.className =
      "flex items-start gap-3 py-1.5 px-2 rounded-lg bg-slate-800/80 border border-slate-700/70";
    const rangeLabel = g.startDate
      ? `${g.startDate} → ${g.targetDate}`
      : `Target: ${g.targetDate}`;
    const notes = g.description && g.description.trim().length
      ? `<p class="mt-1 text-[0.7rem] text-slate-300 whitespace-pre-wrap break-words">${escapeHtml(
          g.description
        )}</p>`
      : "";
    li.innerHTML = `
      <label class="flex items-start gap-2 flex-1 min-w-0">
        <input type="checkbox" class="mt-1 goal-toggle" data-id="${g.id}" ${g.completed ? "checked" : ""} />
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm ${g.completed ? "line-through text-slate-400" : ""}">${escapeHtml(
              g.title
            )}</span>
            <span class="text-[0.7rem] text-slate-400 border border-slate-600 rounded-full px-2 py-0.5">
              ${rangeLabel}
            </span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-[0.7rem] text-slate-400">
            <div class="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div class="h-full rounded-full bg-emerald-500" style="width: ${percent}%;"></div>
            </div>
            <span>${completedSteps}/${totalSteps} steps (${percent}%)</span>
          </div>
          ${notes}
        </div>
      </label>
      <button type="button" class="text-xs text-red-300 hover:text-red-200 goal-delete" data-id="${
        g.id
      }">Delete</button>
    `;
    list.appendChild(li);
  }
  list.querySelectorAll<HTMLInputElement>(".goal-toggle").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.getAttribute("data-id");
      if (!id) return;
      toggleGoalCompleted(id, input.checked);
    });
  });
  list.querySelectorAll<HTMLButtonElement>(".goal-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (!id) return;
      deleteGoal(id);
    });
  });
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString(undefined, { weekday: "short" })} ${d.getDate()}`;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isPastDate(dateStr: string): boolean {
  return dateStr < getTodayStr();
}

function updateAddTaskFormState() {
  const past = isPastDate(selectedDate);
  const form = refs.taskForm;
  const input = refs.taskInput;
  const addBtn = form?.querySelector('button[type="submit"]');
  const startInput = refs.taskStartInput;
  const endInput = refs.taskEndInput;
  const notice = document.getElementById("past-date-notice");
  if (past) {
    input && (input.disabled = true);
    addBtn && ((addBtn as HTMLButtonElement).disabled = true);
    startInput && (startInput.disabled = true);
    endInput && (endInput.disabled = true);
    if (notice) {
      notice.classList.remove("hidden");
    }
  } else {
    input && (input.disabled = false);
    addBtn && ((addBtn as HTMLButtonElement).disabled = false);
    startInput && (startInput.disabled = false);
    endInput && (endInput.disabled = false);
    if (notice) {
      notice.classList.add("hidden");
    }
  }
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function renderDayPicker() {
  if (!refs.taskForm?.parentElement) return;
  let container = document.querySelector<HTMLDivElement>("#day-picker");
  if (!container) {
    container = document.createElement("div");
    container.id = "day-picker";
    container.className = "space-y-2";
    refs.taskForm.parentElement.insertBefore(container, refs.taskForm);
  }
  const days = getLast7Days();
  container.innerHTML = "";

  const hint = document.createElement("p");
  hint.className = "text-[0.65rem] sm:text-xs text-slate-500";
  hint.textContent = "Click a day to view its tasks. Use Delete on each task to remove it.";
  container.appendChild(hint);

  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-2 text-xs sm:text-[0.8rem]";
  const buttonsWrapper = document.createElement("div");
  buttonsWrapper.className = "flex gap-1 overflow-x-auto overflow-y-hidden -mx-0.5 px-0.5 pb-0.5 snap-x snap-mandatory scroll-smooth";
  days.forEach((dateStr) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = (dateStr === selectedDate ? "bg-indigo-600 text-slate-50 " : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 ") + "px-2.5 py-1.5 rounded-full border border-slate-700/80 text-[0.7rem] sm:text-xs whitespace-nowrap shrink-0 snap-start";
    btn.textContent = formatDayLabel(dateStr);
    btn.addEventListener("click", () => {
      selectedDate = dateStr;
      loadTasks();
      renderDayPicker();
    });
    buttonsWrapper.appendChild(btn);
  });
  row.appendChild(buttonsWrapper);
  container.appendChild(row);
}

function renderTasks() {
  if (!refs.taskList || !refs.emptyState || !refs.statTotal || !refs.statCompleted || !refs.statRemaining) return;
  refs.taskList.innerHTML = "";
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  refs.statTotal.textContent = String(total);
  refs.statCompleted.textContent = String(completed);
  refs.statRemaining.textContent = String(total - completed);
  if (tasks.length === 0) {
    refs.emptyState.textContent = "No tasks yet. Add what you want to focus on today.";
    refs.emptyState.classList.remove("hidden");
    return;
  }
  refs.emptyState.classList.add("hidden");
  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "flex items-center gap-2 sm:gap-3 bg-slate-800/90 hover:bg-slate-700/90 rounded-xl px-2.5 sm:px-3 py-2 border border-slate-700/80 transition-colors";

    if (editingTaskId === task.id) {
      li.classList.add("flex-col", "items-stretch");
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = task.title;
      titleInput.className = "flex-1 px-2 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500";
      titleInput.placeholder = "Task title";
      const timeRow = document.createElement("div");
      timeRow.className = "flex flex-wrap gap-x-2 gap-y-1 items-center text-xs text-slate-400";
      const startInput = document.createElement("input");
      startInput.type = "time";
      startInput.value = task.startTime || "";
      startInput.className = "px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100";
      const endInput = document.createElement("input");
      endInput.type = "time";
      endInput.value = task.endTime || "";
      endInput.className = "px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100";
      timeRow.appendChild(document.createTextNode("Start"));
      timeRow.appendChild(startInput);
      timeRow.appendChild(document.createTextNode("End"));
      timeRow.appendChild(endInput);
      const btnRow = document.createElement("div");
      btnRow.className = "flex gap-2 justify-end";
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () => {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
          editingTaskId = null;
          updateTask(task.id, newTitle, startInput.value, endInput.value);
        }
      });
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "text-xs px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-200";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => {
        editingTaskId = null;
        renderTasks();
      });
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(saveBtn);
      li.appendChild(titleInput);
      li.appendChild(timeRow);
      li.appendChild(btnRow);
    } else {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.className = "h-4 w-4 rounded border-slate-500 text-indigo-500 focus:ring-indigo-500 bg-slate-900/60 shrink-0";
      checkbox.addEventListener("change", () => toggleTask(task.id));
      const titleButton = document.createElement("button");
      titleButton.className = "flex-1 text-left min-w-0 overflow-hidden";
      const timeRange = task.startTime && task.endTime ? `${task.startTime} – ${task.endTime}` : task.startTime ? `Start: ${task.startTime}` : task.endTime ? `End: ${task.endTime}` : "";
      const titleClass = (task.completed ? "line-through text-slate-500 " : "text-slate-100 ") + "block truncate text-sm";
      const goalLabel =
        task.goalId != null && String(task.goalId).trim() && goals.length
          ? goals.find((g) => String(g.id) === String(task.goalId))?.title || ""
          : "";
      const goalBadge = goalLabel
        ? `<span class="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-600/60 text-[0.65rem] text-emerald-200 max-w-full truncate">Goal: ${escapeHtml(
            goalLabel
          )}</span>`
        : "";
      titleButton.innerHTML = `<div class="flex flex-col items-start min-w-0 w-full"><span class="${titleClass}" title="${task.title.replace(/"/g, "&quot;")}">${task.title}</span>${
        timeRange ? `<span class="mt-0.5 text-xs text-slate-400 truncate block">${timeRange}</span>` : ""
      }${goalBadge}</div>`;
      titleButton.addEventListener("click", () => toggleTask(task.id));
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "text-[0.65rem] sm:text-xs text-slate-300 hover:text-indigo-300 px-1.5 sm:px-2 py-1 rounded-lg border border-slate-500/50 bg-slate-700/50 shrink-0 whitespace-nowrap";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", (e) => {
        e.stopPropagation();
        editingTaskId = task.id;
        renderTasks();
      });
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "text-[0.65rem] sm:text-xs text-red-300 hover:text-red-200 px-1.5 sm:px-2 py-1 rounded-lg border border-red-500/40 bg-red-500/10 shrink-0 whitespace-nowrap";
      deleteButton.textContent = "Del";
      deleteButton.addEventListener("click", () => deleteTask(task.id));
      li.appendChild(checkbox);
      li.appendChild(titleButton);
      li.appendChild(editButton);
      li.appendChild(deleteButton);
    }
    refs.taskList.appendChild(li);
  }
}

async function loadTasks() {
  clearApiError();
  try {
    const res = await fetchApi(`/tasks?date=${encodeURIComponent(selectedDate)}`);
    if (res.status === 401) return;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showApiError(data.message || `Backend error ${res.status}.`);
      tasks = [];
    } else {
      tasks = await res.json();
    }
  } catch (err) {
    showApiError("Cannot reach backend.");
    tasks = [];
  } finally {
    renderTasks();
    renderGoalsList();
    updateAddTaskFormState();
  }
}

async function addTask(title: string) {
  const trimmed = title.trim();
  if (!trimmed || !refs.taskInput || !refs.taskStartInput || !refs.taskEndInput) return;
  if (isPastDate(selectedDate)) return;
  clearApiError();
  const goalSelect = document.getElementById("task-goal") as HTMLSelectElement | null;
  const goalId = goalSelect?.value || "";
  try {
    const res = await fetchApi("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: trimmed,
        date: selectedDate,
        startTime: refs.taskStartInput.value || null,
        endTime: refs.taskEndInput.value || null,
        goalId: goalId || undefined,
      }),
    });
    if (res.status === 401) return;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showApiError(data.message || "Failed to add task.");
      return;
    }
    tasks.push(data as Task);
    renderTasks();
  } catch (err) {
    showApiError("Cannot reach backend.");
  }
}

async function updateTask(id: string, title: string, startTime: string, endTime: string) {
  try {
    const res = await fetchApi(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: title.trim(),
        startTime,
        endTime,
      }),
    });
    if (res.status === 401) return;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showApiError(data.message || "Failed to update task.");
      return;
    }
    const updated: Task = await res.json();
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    renderTasks();
  } catch (err) {
    console.error("Failed to update task", err);
    showApiError("Failed to update task.");
  }
}

async function toggleTask(id: string) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  try {
    const res = await fetchApi(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !task.completed }),
    });
    if (res.status === 401) return;
    const updated: Task = await res.json();
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    renderTasks();
    renderGoalsList();
  } catch (err) {
    console.error("Failed to toggle task", err);
  }
}

async function deleteTask(id: string) {
  try {
    const res = await fetchApi(`/tasks/${id}`, { method: "DELETE" });
    if (res.status === 401) return;
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
    renderGoalsList();
  } catch (err) {
    console.error("Failed to delete task", err);
  }
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetchApi("/auth/users");
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

function renderAdminPanel() {
  app.innerHTML = `
    <div class="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex items-center justify-center px-3 sm:px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="w-full max-w-xl bg-slate-900/70 border border-slate-700/70 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4">
        <header class="flex items-center justify-between gap-2">
          <h1 class="text-xl font-bold">Admin – View user tasks</h1>
          <button type="button" id="admin-back-btn" class="px-3 py-1.5 rounded-lg text-sm bg-slate-700 hover:bg-slate-600">Back to my tasks</button>
        </header>
        <p id="admin-error" class="text-sm text-red-400 hidden"></p>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Select user</label>
          <select id="admin-user-select" class="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500">
            <option value="">— Choose a user —</option>
          </select>
        </div>
        <div id="admin-role-section" class="hidden">
          <p class="text-xs text-slate-400 mb-1">Role</p>
          <div class="flex items-center gap-2">
            <span id="admin-role-label" class="text-sm text-slate-300"></span>
            <button type="button" id="admin-role-btn" class="px-3 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500">Make admin</button>
          </div>
        </div>
        <div id="admin-user-tasks" class="space-y-2 max-h-80 overflow-y-auto text-sm pr-1 hidden">
          <p class="text-slate-400 text-xs">Tasks for selected user (read-only)</p>
          <ul id="admin-task-list" class="space-y-2"></ul>
        </div>
      </div>
    </div>
  `;
  const backBtn = document.getElementById("admin-back-btn");
  const selectEl = document.getElementById("admin-user-select") as HTMLSelectElement;
  const tasksContainer = document.getElementById("admin-user-tasks");
  const taskList = document.getElementById("admin-task-list");
  const errorEl = document.getElementById("admin-error");
  const roleSection = document.getElementById("admin-role-section");
  const roleLabel = document.getElementById("admin-role-label");
  const roleBtn = document.getElementById("admin-role-btn");
  let adminUsersList: User[] = [];

  const currentUserStr = localStorage.getItem(USER_KEY);
  const currentUser: User | null = currentUserStr ? JSON.parse(currentUserStr) : null;

  function fillUserSelect(users: User[]) {
    if (!selectEl) return;
    const kept = selectEl.value;
    selectEl.innerHTML = "<option value=\"\">— Choose a user —</option>";
    for (const u of users) {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.email + (u.name ? ` (${u.name})` : "") + (u.role === "admin" ? " [admin]" : "");
      selectEl.appendChild(opt);
    }
    if (kept) selectEl.value = kept;
  }

  function updateRoleSection() {
    const userId = selectEl?.value;
    if (!userId || !roleSection || !roleLabel || !roleBtn) return;
    const u = adminUsersList.find((x) => x.id === userId);
    if (!u) return;
    roleSection.classList.remove("hidden");
    roleLabel!.textContent = u.role === "admin" ? "Admin" : "User";
    const isSelf = currentUser?.id === userId;
    if (u.role === "admin") {
      roleBtn.textContent = isSelf ? "Cannot remove your own admin" : "Remove admin";
      (roleBtn as HTMLButtonElement).disabled = isSelf;
    } else {
      roleBtn.textContent = "Make admin";
      (roleBtn as HTMLButtonElement).disabled = false;
    }
  }

  backBtn?.addEventListener("click", () => {
    renderAppScreen();
  });

  roleBtn?.addEventListener("click", async () => {
    const userId = selectEl?.value;
    if (!userId || !errorEl) return;
    const u = adminUsersList.find((x) => x.id === userId);
    if (!u) return;
    const newRole = u.role === "admin" ? "user" : "admin";
    errorEl.classList.add("hidden");
    try {
      const res = await fetchApi(`/auth/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update role");
      }
      adminUsersList = await fetchUsers();
      fillUserSelect(adminUsersList);
      updateRoleSection();
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : "Failed to update role";
      errorEl.classList.remove("hidden");
    }
  });

  selectEl?.addEventListener("change", async () => {
    const userId = selectEl.value;
    if (!userId) {
      tasksContainer?.classList.add("hidden");
      roleSection?.classList.add("hidden");
      return;
    }
    updateRoleSection();
    if (!taskList || !errorEl) return;
    errorEl.classList.add("hidden");
    taskList.innerHTML = "<li class='text-slate-400'>Loading…</li>";
    tasksContainer?.classList.remove("hidden");
    try {
      const res = await fetchApi(`/tasks?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load tasks");
      }
      const tasks: Task[] = await res.json();
      taskList.innerHTML = "";
      if (tasks.length === 0) {
        taskList.innerHTML = "<li class='text-slate-400'>No tasks</li>";
      } else {
        for (const t of tasks) {
          const li = document.createElement("li");
          li.className = "flex items-center gap-2 py-1.5 px-2 rounded-lg bg-slate-800/80 border border-slate-700/70";
          li.innerHTML = `
            <span class="flex-1 min-w-0 truncate ${t.completed ? "text-slate-400 line-through" : ""}">${escapeHtml(t.title)}</span>
            <span class="text-xs text-slate-500">${t.date}</span>
            ${t.completed ? "<span class='text-emerald-400 text-xs'>Done</span>" : ""}
          `;
          taskList.appendChild(li);
        }
      }
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : "Failed to load tasks";
      errorEl.classList.remove("hidden");
      taskList.innerHTML = "";
    }
  });

  (async () => {
    if (!selectEl || !errorEl) return;
    errorEl.classList.add("hidden");
    try {
      adminUsersList = await fetchUsers();
      fillUserSelect(adminUsersList);
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : "Failed to load users";
      errorEl.classList.remove("hidden");
    }
  })();
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function renderAppScreen() {
  const userStr = localStorage.getItem(USER_KEY);
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  app.innerHTML = `
    <div class="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex items-center justify-center px-3 sm:px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="w-full max-w-xl bg-slate-900/70 border border-slate-700/70 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        <header class="flex flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div class="space-y-0.5 min-w-0 flex-1">
            <p class="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-indigo-400">Daily Focus</p>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Task Tracker</h1>
            <p class="text-xs sm:text-sm text-slate-400 truncate" title="${(user?.email ?? "").replace(/"/g, "&quot;")}">${user?.email ?? ""}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${(user?.role === "admin") ? `<button type="button" id="admin-btn" class="px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-indigo-700 hover:bg-indigo-600">Admin</button>` : ""}
            <button type="button" id="logout-btn" class="px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-slate-700 hover:bg-slate-600">Log out</button>
          </div>
        </header>
        <section class="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div class="rounded-xl bg-slate-800/80 border border-slate-700 px-2 py-2 sm:px-3 sm:py-2.5">
            <p class="text-slate-400">Total</p>
            <p id="stat-total" class="mt-1 text-base sm:text-lg font-semibold text-slate-50">0</p>
          </div>
          <div class="rounded-xl bg-emerald-900/40 border border-emerald-700/70 px-2 py-2 sm:px-3 sm:py-2.5">
            <p class="text-emerald-300/80">Completed</p>
            <p id="stat-completed" class="mt-1 text-base sm:text-lg font-semibold text-emerald-200">0</p>
          </div>
          <div class="rounded-xl bg-amber-900/40 border border-amber-700/70 px-2 py-2 sm:px-3 sm:py-2.5">
            <p class="text-amber-300/80">Remaining</p>
            <p id="stat-remaining" class="mt-1 text-base sm:text-lg font-semibold text-amber-200">0</p>
          </div>
        </section>
        <form id="task-form" class="space-y-2">
          <p id="past-date-notice" class="text-xs text-amber-400/90 hidden">Past date: you can view and update tasks, but cannot add new ones.</p>
          <div class="flex gap-2 min-w-0">
            <input id="task-input" class="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700/80 shadow-inner text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Add a task..." />
            <button type="submit" class="shrink-0 px-3 sm:px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold shadow-lg shadow-indigo-900/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Add</button>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <label class="flex items-center gap-2">
              <span class="w-16 shrink-0">Start</span>
              <input id="task-start" type="time" class="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80 text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-60" />
            </label>
            <label class="flex items-center gap-2">
              <span class="w-16 shrink-0">End</span>
              <input id="task-end" type="time" class="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80 text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-60" />
            </label>
          </div>
          <div class="text-xs text-slate-400">
            <label class="flex items-center gap-2">
              <span class="w-16 shrink-0">Goal</span>
              <select id="task-goal" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80 text-xs focus:ring-1 focus:ring-indigo-500">
                <option value="">No goal</option>
              </select>
            </label>
          </div>
        </form>
        <p id="api-error" class="text-sm text-red-400 hidden"></p>
        <ul id="task-list" class="space-y-2 max-h-80 overflow-y-auto text-sm pr-1"></ul>
        <p id="empty-state" class="text-sm text-slate-400">Loading tasks...</p>
        <section class="mt-4 border-t border-slate-800 pt-4 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-slate-100">Long-term goals</h2>
            <p class="text-[0.7rem] text-slate-400">Plan 1–5 years ahead</p>
          </div>
          <form id="goal-form" class="space-y-2">
            <input id="goal-title" class="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700/80 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Big goal (e.g. Get driving licence, Start a business)" />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
              <label class="flex items-center gap-2">
                <span class="w-16 shrink-0">Start</span>
                <input id="goal-start" type="date" class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/80 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </label>
              <label class="flex items-center gap-2">
                <span class="w-16 shrink-0">Target</span>
                <input id="goal-target" type="date" class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/80 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </label>
            </div>
            <textarea id="goal-notes" rows="2" class="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700/80 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Notes / requirements (money, documents, skills, people, etc.)"></textarea>
            <button type="submit" class="w-full sm:w-auto px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold">Save goal</button>
          </form>
          <p id="goals-error" class="text-sm text-red-400 hidden"></p>
          <p id="goals-empty" class="text-xs text-slate-400">No long-term goals yet. Add one above.</p>
          <ul id="goals-list" class="space-y-2 text-sm"></ul>
        </section>
      </div>
    </div>
  `;
  refs.taskList = document.querySelector<HTMLUListElement>("#task-list")!;
  refs.taskInput = document.querySelector<HTMLInputElement>("#task-input")!;
  refs.taskStartInput = document.querySelector<HTMLInputElement>("#task-start")!;
  refs.taskEndInput = document.querySelector<HTMLInputElement>("#task-end")!;
  refs.taskForm = document.querySelector<HTMLFormElement>("#task-form")!;
  refs.emptyState = document.querySelector<HTMLParagraphElement>("#empty-state")!;
  refs.statTotal = document.querySelector<HTMLParagraphElement>("#stat-total")!;
  refs.statCompleted = document.querySelector<HTMLParagraphElement>("#stat-completed")!;
  refs.statRemaining = document.querySelector<HTMLParagraphElement>("#stat-remaining")!;
  refs.apiErrorEl = document.querySelector<HTMLParagraphElement>("#api-error")!;

  refs.taskForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (refs.taskInput?.value.trim()) {
      addTask(refs.taskInput.value);
      refs.taskInput.value = "";
      if (refs.taskStartInput) refs.taskStartInput.value = "";
      if (refs.taskEndInput) refs.taskEndInput.value = "";
    }
  });
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    stopAlarmChecker();
    clearAuth();
    renderAuthScreen();
  });
  document.getElementById("admin-btn")?.addEventListener("click", () => {
    renderAdminPanel();
  });
  const goalForm = document.getElementById("goal-form") as HTMLFormElement | null;
  const goalTitleInput = document.getElementById("goal-title") as HTMLInputElement | null;
  const goalStartInput = document.getElementById("goal-start") as HTMLInputElement | null;
  const goalTargetInput = document.getElementById("goal-target") as HTMLInputElement | null;
  const goalNotesInput = document.getElementById("goal-notes") as HTMLTextAreaElement | null;
  goalForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = goalTitleInput?.value.trim() || "";
    const start = goalStartInput?.value || "";
    const target = goalTargetInput?.value || "";
    const notes = goalNotesInput?.value.trim() || "";
    if (!title || !start || !target) return;
    addGoal(title, start, target, notes);
    if (goalTitleInput) goalTitleInput.value = "";
    if (goalNotesInput) goalNotesInput.value = "";
  });
  renderDayPicker();
  loadTasks();
  loadGoals();
  updateAddTaskFormState();
  startAlarmChecker();
}

// --- Init: check token and show app or auth ---
(async () => {
  if (!getToken()) {
    renderAuthScreen();
    return;
  }
  try {
    const res = await fetchApi("/auth/me");
    if (res.ok) {
      const user = await res.json();
      setUser(user);
      renderAppScreen();
    } else {
      renderAuthScreen();
    }
  } catch {
    renderAuthScreen();
  }
})();
