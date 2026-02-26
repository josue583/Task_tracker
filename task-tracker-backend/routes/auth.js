const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware, adminMiddleware, JWT_SECRET } = require("../middleware/auth");

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
  return { ...rest, id: u._id.toString(), role: u.role || "user" };
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

    const firstAdminEmail = (process.env.FIRST_ADMIN_EMAIL || "").trim().toLowerCase();
    const isFirstAdmin = firstAdminEmail && emailStr.toLowerCase() === firstAdminEmail;

    const user = await User.create({
      email: emailStr.toLowerCase(),
      password: passwordStr,
      name: (name != null && String(name).trim()) || "",
      role: isFirstAdmin ? "admin" : "user",
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
    if (!emailStr || !passwordStr) {
      return res.status(400).json({ message: "Email and password required." });
    }

    const normalizedEmail = emailStr.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    let ok = false;
    try {
      ok = await user.comparePassword(passwordStr);
    } catch (compareErr) {
      console.error("Password compare error (invalid hash in DB?):", compareErr.message);
      return res.status(500).json({ message: "Login failed. Try resetting your password via Register." });
    }
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const firstAdminEmail = (process.env.FIRST_ADMIN_EMAIL || "").trim().toLowerCase();
    if (firstAdminEmail && normalizedEmail === firstAdminEmail && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

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

// GET /auth/users — list all users (admin only)
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ email: 1 }).lean();
    const out = users.map((u) => ({ ...u, id: u._id.toString(), role: u.role || "user" }));
    res.json(out);
  } catch (err) {
    console.error("Error listing users:", err);
    res.status(500).json({ message: "Failed to list users" });
  }
});

// PATCH /auth/users/:id/role — set user role (admin only; cannot demote yourself)
router.patch("/users/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const roleStr = role === "admin" ? "admin" : role === "user" ? "user" : null;
    if (!roleStr) {
      return res.status(400).json({ message: "Role must be 'admin' or 'user'." });
    }
    const target = await User.findById(id).select("-password");
    if (!target) return res.status(404).json({ message: "User not found." });
    const isSelf = req.user._id.toString() === id;
    if (isSelf && roleStr === "user") {
      return res.status(400).json({ message: "You cannot remove your own admin role." });
    }
    target.role = roleStr;
    await target.save();
    res.json(toSafeUser(target));
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({ message: "Failed to update role" });
  }
});

module.exports = router;
