const express = require("express");
const multer = require("multer");
const path = require("path");
const Video = require("../models/Video");
const auth = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Upload a video (creators only in MVP)
router.post("/", auth, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }

    const { title, description } = req.body;
    const video = await Video.create({
      title,
      description,
      creatorId: req.user.id,
      filePath: `/uploads/${req.file.filename}`
    });

    return res.status(201).json({ message: "Video uploaded", video });
  } catch (error) {
    return res.status(500).json({ message: "Upload failed" });
  }
});

// List all videos
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    return res.json(videos);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load videos" });
  }
});

module.exports = router;
