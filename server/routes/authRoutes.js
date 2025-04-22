const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
module.exports = router;

// Secret Admin Key (from environment variables)
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

// **Signup Route**
router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request received:", req.body);
    const { name, email, password, role, adminKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    let assignedRole = "user"; // Default role

    // Admin role verification
    if (role === "admin") {
      if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
        return res.status(403).json({ message: "Invalid admin key. Admin signup not allowed!" });
      }
      assignedRole = "admin"; // If key is correct, assign admin role
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **Login Route**
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Role Check (User cannot login as Admin & vice versa)
    if (user.role !== role) {
      return res.status(403).json({ message: "Invalid role selected!" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, role: user.role, name: user.name, email: user.email });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});