require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();
const corsOrigin = process.env.FRONTEND_URL || undefined;
app.use(cors(corsOrigin ? { origin: corsOrigin } : {}));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

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
