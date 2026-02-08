const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Creator/User signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "investor",
      // 💰 NEW ACCOUNTS START WITH 100 COINS
      cryptoBalance: 100,
      totalInvested: 0
    });

    // Generate token for immediate login
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(201).json({
      message: "✅ Account created! 🎉 You received 100 SOCIORA coins",
      token,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      cryptoBalance: user.cryptoBalance,
      walletAddress: user.walletAddress,
      subscriptionTier: user.subscriptionTier || "free"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({ 
      token, 
      id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      cryptoBalance: user.cryptoBalance || 0,
      walletAddress: user.walletAddress,
      subscriptionTier: user.subscriptionTier || "free"
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

// ✅ UPGRADE TO CREATOR (authenticated users only)
router.post("/upgrade-to-creator", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "creator") {
      return res.status(400).json({ message: "You are already a creator" });
    }

    // Upgrade user to creator
    user.role = "creator";
    await user.save();

    // Generate new token with updated role
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({ 
      message: "Successfully upgraded to creator!",
      token,
      id: user._id, 
      name: user.name, 
      role: user.role, 
      email: user.email,
      cryptoBalance: user.cryptoBalance || 0,
      walletAddress: user.walletAddress,
      subscriptionTier: user.subscriptionTier || "free"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to upgrade account" });
  }
});

module.exports = router;
