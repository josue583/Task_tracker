const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    startDate: { type: String, required: true },
    targetDate: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", goalSchema);
