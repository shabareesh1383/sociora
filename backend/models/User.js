const mongoose = require("mongoose");

// Minimal user model for creators/users
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["creator", "user"], default: "user" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
