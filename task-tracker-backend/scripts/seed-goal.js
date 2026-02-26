/**
 * One-time script: insert a test goal for the first user in the database.
 * Run from backend folder: node scripts/seed-goal.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Goal = require("../models/Goal");

const MONGODB_URI = process.env.MONGODB_URI || "";

async function seed() {
  if (!MONGODB_URI.trim()) {
    console.error("MONGODB_URI missing in .env");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne().select("_id email").lean();
  if (!user) {
    console.error("No user found. Register once via the app, then run this script.");
    await mongoose.disconnect();
    process.exit(1);
  }
  const existing = await Goal.findOne({ userId: user._id }).lean();
  if (existing) {
    console.log("A goal already exists for user", user.email, "- id:", existing._id.toString());
    await mongoose.disconnect();
    process.exit(0);
  }
  const startDate = new Date().toISOString().slice(0, 10);
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  const targetDate = d.toISOString().slice(0, 10);
  const goal = await Goal.create({
    userId: user._id,
    title: "Test long-term goal (seed)",
    description: "Inserted by scripts/seed-goal.js for testing.",
    startDate,
    targetDate,
  });
  console.log("Goal inserted:", goal._id.toString(), goal.title, "for user", user.email);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
