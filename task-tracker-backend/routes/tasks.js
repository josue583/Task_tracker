const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Normalize MongoDB doc for frontend: use `id` (string) instead of `_id`
function toTaskResponse(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

// GET /tasks/health — public, no auth (must be before authMiddleware)
router.get("/health", (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// All routes below require login
router.use(authMiddleware);

// GET /tasks — list tasks (optional ?date=YYYY-MM-DD)
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database not connected." });
    }
    const { date } = req.query;
    const baseFilter = { userId: req.user._id };
    const filter = date ? { ...baseFilter, date } : baseFilter;
    const tasks = await Task.find(filter).sort({ createdAt: 1 }).lean();
    const out = tasks.map(toTaskResponse);
    if (process.env.NODE_ENV !== "production") {
      console.log("GET /tasks", date ? `date=${date}` : "all", "->", out.length, "tasks");
    }
    res.json(out);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /tasks — create task
router.post("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database not connected. Restart backend and check MongoDB.",
      });
    }

    const { title, date, startTime, endTime } = req.body || {};
    const titleStr = title != null ? String(title).trim() : "";
    if (!titleStr) {
      return res.status(400).json({ message: "Title is required" });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const taskDate =
      date && String(date).trim() ? String(date).trim() : today;

    const doc = {
      userId: req.user._id,
      title: titleStr,
      completed: false,
      date: taskDate,
      startTime: startTime != null && String(startTime).trim() ? String(startTime).trim() : null,
      endTime: endTime != null && String(endTime).trim() ? String(endTime).trim() : null,
    };

    const task = await Task.create(doc);
    const out = toTaskResponse(task.toObject());
    console.log("Task created:", out.id, out.title, out.date);
    res.status(201).json(out);
  } catch (err) {
    console.error("Error creating task:", err);
    const message = err.message || "Failed to create task";
    res.status(500).json({ message });
  }
});

// PATCH /tasks/:id — update task
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};

    if (typeof req.body.completed === "boolean") {
      update.completed = req.body.completed;
    }
    if (typeof req.body.title === "string") {
      update.title = req.body.title.trim();
    }
    if (typeof req.body.startTime === "string") {
      update.startTime = req.body.startTime.trim() || null;
    }
    if (typeof req.body.endTime === "string") {
      update.endTime = req.body.endTime.trim() || null;
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    ).lean();

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(toTaskResponse(task));
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Task not found" });
    }
    console.error("Error updating task:", err);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// DELETE /tasks?date=YYYY-MM-DD — delete all tasks for a day (must be before /:id)
router.delete("/", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res
        .status(400)
        .json({ message: "Missing date query parameter (YYYY-MM-DD)" });
    }

    const result = await Task.deleteMany({ date, userId: req.user._id });
    return res.json({ removed: result.deletedCount || 0 });
  } catch (err) {
    console.error("Error clearing day tasks:", err);
    res.status(500).json({ message: "Failed to clear tasks for day" });
  }
});

// DELETE /tasks/:id — delete one task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(204).send();
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Task not found" });
    }
    console.error("Error deleting task:", err);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
