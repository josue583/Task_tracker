const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

function connectDB() {
  const trimmed = typeof MONGODB_URI === "string" ? MONGODB_URI.trim() : "";

  if (!trimmed) {
    console.error("\n--- MongoDB connection ---");
    console.error("MONGODB_URI is missing.");
    console.error("  1. Copy .env.example to .env in the backend folder");
    console.error("  2. In .env set MONGODB_URI=your_real_connection_string");
    console.error("  Example: MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/task-tracker?retryWrites=true&w=majority");
    console.error("---\n");
    return Promise.resolve();
  }

  if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) {
    console.error("\n--- MongoDB connection ---");
    console.error("MONGODB_URI must start with mongodb:// or mongodb+srv://");
    console.error("  Check your .env file in the backend folder.");
    console.error("---\n");
    return Promise.resolve();
  }

  return mongoose
    .connect(trimmed)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("\n--- MongoDB connection failed ---");
      console.error("Error:", err.message);
      console.error("---\n");
      return Promise.reject(err);
    });
}

module.exports = connectDB;
