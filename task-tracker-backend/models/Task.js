const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", default: null },
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
