const express = require("express");
const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

function toGoalResponse(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = obj;
  return { id: _id.toString(), ...rest };
}

// All goal routes require auth
router.use(authMiddleware);

// GET /goals — list long-term goals for current user (sorted by targetDate)
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database not connected." });
    }
    const goals = await Goal.find({ userId: req.user._id })
      .sort({ targetDate: 1, createdAt: 1 })
      .lean();
    res.json(goals.map(toGoalResponse));
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.status(500).json({ message: "Failed to fetch goals" });
  }
});

// POST /goals — create a long-term goal
router.post("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database not connected. Restart backend and check MongoDB.",
      });
    }

    const { title, description, startDate, targetDate } = req.body || {};
    const titleStr = title != null ? String(title).trim() : "";
    const startStr = startDate != null ? String(startDate).trim() : "";
    const targetStr = targetDate != null ? String(targetDate).trim() : "";
    if (!titleStr) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!startStr) {
      return res.status(400).json({ message: "Start date is required" });
    }
    if (!targetStr) {
      return res.status(400).json({ message: "Target date is required" });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      title: titleStr,
      description: description != null ? String(description).trim() : "",
      startDate: startStr,
      targetDate: targetStr,
    });
    res.status(201).json(toGoalResponse(goal));
  } catch (err) {
    console.error("Error creating goal:", err);
    res.status(500).json({ message: err.message || "Failed to create goal" });
  }
});

// PATCH /goals/:id — update goal (title, description, startDate, targetDate, completed)
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
    if (typeof req.body.description === "string") {
      update.description = req.body.description.trim();
    }
    if (typeof req.body.startDate === "string") {
      update.startDate = req.body.startDate.trim();
    }
    if (typeof req.body.targetDate === "string") {
      update.targetDate = req.body.targetDate.trim();
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    ).lean();

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json(toGoalResponse(goal));
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Goal not found" });
    }
    console.error("Error updating goal:", err);
    res.status(500).json({ message: "Failed to update goal" });
  }
});

// DELETE /goals/:id — delete one goal
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Goal.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: "Goal not found" });
    }
    res.status(204).send();
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Goal not found" });
    }
    console.error("Error deleting goal:", err);
    res.status(500).json({ message: "Failed to delete goal" });
  }
});

module.exports = router;
