/**
 * Reset a user's password (saves a proper bcrypt hash).
 * Usage: node scripts/reset-password.js <email> <newPassword>
 * Example: node scripts/reset-password.js user@example.com MyNewPass123
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI || "";

async function main() {
  const email = process.argv[2]?.trim()?.toLowerCase();
  const newPassword = process.argv[3];
  if (!email || !newPassword || newPassword.length < 6) {
    console.error("Usage: node scripts/reset-password.js <email> <newPassword>");
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }
  if (!MONGODB_URI) {
    console.error("MONGODB_URI missing in .env");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.error("No user found with email:", email);
    await mongoose.disconnect();
    process.exit(1);
  }
  user.password = newPassword;
  await user.save(); // pre("save") hashes it
  console.log("Password reset for:", email);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
