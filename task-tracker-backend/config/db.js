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
    console.error("  Current value (first 30 chars):", trimmed.slice(0, 30) + "...");
    console.error("  Check your .env file in the backend folder.");
    console.error("---\n");
    return Promise.resolve();
  }

  if (trimmed.includes("REPLACE_") || trimmed.includes("YOUR_CLUSTER")) {
    console.error("\n--- MongoDB connection ---");
    console.error("Replace YOUR_CLUSTER in .env with your real cluster host from Atlas.");
    console.error("  Where to find it: Atlas -> Cluster -> Connect -> Drivers");
    console.error("  In the connection string you see something like: @cluster0.XXXXX.mongodb.net");
    console.error("  Use that part: cluster0.XXXXX (your actual host). Put it in .env where YOUR_CLUSTER is.");
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
      if (err.message.includes("authentication")) {
        console.error("  -> Check username and password in MONGODB_URI (and URL-encode special chars in password)");
      }
      if (err.message.includes("ENOTFOUND") || err.message.includes("getaddrinfo")) {
        console.error("  -> Check cluster host in your connection string and internet connection");
      }
      console.error("---\n");
      return Promise.reject(err);
    });
}

module.exports = connectDB;
