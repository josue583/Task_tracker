const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString() },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function toSafeUser(user) {
  const u = user.toObject ? user.toObject() : user;
  const { password, __v, ...rest } = u;
  return { ...rest, id: u._id.toString() };
}

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    const emailStr = (email != null && String(email).trim()) || "";
    const passwordStr = (password != null && typeof password === "string" ? password : "").trim();
    if (!emailStr) return res.status(400).json({ message: "Email is required." });
    if (passwordStr.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

    const existing = await User.findOne({ email: emailStr.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already registered." });

    const user = await User.create({
      email: emailStr.toLowerCase(),
      password: passwordStr,
      name: (name != null && String(name).trim()) || "",
    });
    const token = signToken(user);
    res.status(201).json({ user: toSafeUser(user), token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Registration failed." });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailStr = (email != null && String(email).trim()) || "";
    const passwordStr = (password != null && typeof password === "string" ? password : "").trim();
    if (!emailStr || !passwordStr) return res.status(400).json({ message: "Email and password required." });

    const user = await User.findOne({ email: emailStr.toLowerCase() });
    if (!user) {
      console.log("Login failed: no user for email", emailStr.toLowerCase());
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const ok = await user.comparePassword(passwordStr);
    if (!ok) {
      console.log("Login failed: wrong password for email", emailStr.toLowerCase());
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.log("Login success:", emailStr.toLowerCase());
    const token = signToken(user);
    res.json({ user: toSafeUser(user), token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message || "Login failed." });
  }
});

// GET /auth/me — current user (requires token)
router.get("/me", authMiddleware, (req, res) => {
  res.json(toSafeUser(req.user));
});

module.exports = router;
