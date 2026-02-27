require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const goalRoutes = require("./routes/goals");

const app = express();
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.trim()]
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174"];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some((o) => o === origin)) return cb(null, true);
      return cb(null, true);
    },
  })
);
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/goals", goalRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Task API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Server starting without database. Fix MONGODB_URI and restart.");
    app.listen(PORT, () => {
      console.log(`Task API running on http://localhost:${PORT} (no DB – requests will fail)`);
    });
  });
