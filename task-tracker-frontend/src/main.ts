import "./style.css";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
const TOKEN_KEY = "task_tracker_token";
const USER_KEY = "task_tracker_user";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  startTime: string | null;
  endTime: string | null;
};

type User = { id: string; email: string; name?: string };

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
      authError.textContent = "Cannot reach server.";
      authError.classList.remove("hidden");
    }
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
      authError.textContent = "Cannot reach server.";
      authError.classList.remove("hidden");
    }
  }
}

function renderAuthScreen() {
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex items-center justify-center px-3 sm:px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
      titleButton.innerHTML = `<div class="flex flex-col items-start min-w-0 w-full"><span class="${titleClass}" title="${task.title.replace(/"/g, "&quot;")}">${task.title}</span>${timeRange ? `<span class="mt-0.5 text-xs text-slate-400 truncate block">${timeRange}</span>` : ""}</div>`;
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
    updateAddTaskFormState();
  }
}

async function addTask(title: string) {
  const trimmed = title.trim();
  if (!trimmed || !refs.taskInput || !refs.taskStartInput || !refs.taskEndInput) return;
  if (isPastDate(selectedDate)) return;
  clearApiError();
  try {
    const res = await fetchApi("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: trimmed,
        date: selectedDate,
        startTime: refs.taskStartInput.value || null,
        endTime: refs.taskEndInput.value || null,
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
  } catch (err) {
    console.error("Failed to delete task", err);
  }
}

function renderAppScreen() {
  const userStr = localStorage.getItem(USER_KEY);
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex items-center justify-center px-3 sm:px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="w-full max-w-xl bg-slate-900/70 border border-slate-700/70 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        <header class="flex flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div class="space-y-0.5 min-w-0 flex-1">
            <p class="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-indigo-400">Daily Focus</p>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Task Tracker</h1>
            <p class="text-xs sm:text-sm text-slate-400 truncate" title="${(user?.email ?? "").replace(/"/g, "&quot;")}">${user?.email ?? ""}</p>
          </div>
          <button type="button" id="logout-btn" class="shrink-0 px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-slate-700 hover:bg-slate-600">Log out</button>
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
        </form>
        <p id="api-error" class="text-sm text-red-400 hidden"></p>
        <ul id="task-list" class="space-y-2 max-h-80 overflow-y-auto text-sm pr-1"></ul>
        <p id="empty-state" class="text-sm text-slate-400">Loading tasks...</p>
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
  renderDayPicker();
  loadTasks();
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
