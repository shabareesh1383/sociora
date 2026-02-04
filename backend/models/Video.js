const mongoose = require("mongoose");

// Stores video metadata and local file path
const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filePath: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);
