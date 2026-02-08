const express = require("express");
const multer = require("multer");
const path = require("path");
const Video = require("../models/Video");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const { createCryptoTokenSystem } = require("../services/cryptoTokenSystem");
const enhancedBlockchainService = require("../services/enhancedBlockchainService");

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

// ✅ UPLOAD VIDEO (authenticated creator only) - WITH CRYPTO GENERATION
router.post("/", auth, upload.single("video"), async (req, res) => {
  try {
    // 🔒 ROLE VALIDATION
    if (req.user.role !== "creator") {
      return res.status(403).json({ message: "Only creators can upload videos" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }

    const { title, description, minInvestment, expectedROI, protectionLevel } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Create video with enhanced fields
    const video = await Video.create({
      title,
      description,
      creatorId: req.user.id,
      filePath: `/uploads/${req.file.filename}`,
      isPublic: true,
      minInvestment: minInvestment || 10,
      expectedROI: expectedROI || 25,
      protectionLevel: protectionLevel || "public",
      status: "published"
    });

    // 🚀 GENERATE CRYPTO ON VIDEO UPLOAD - CORE FEATURE
    const cryptoTokenService = createCryptoTokenSystem();
    const tokensGenerated = await cryptoTokenService.calculateCreatorTokens(
      video.quality || 'standard',
      req.user.verificationLevel === 'pro'
    );

    // 🔐 RECORD VIDEO ON BLOCKCHAIN FOR IMMUTABILITY
    try {
      const blockchainRecord = enhancedBlockchainService.recordVideoUpload({
        _id: video._id,
        title: video.title,
        description: video.description,
        creatorId: req.user.id,
        creatorName: req.user.name,
        thumbnail: video.thumbnail,
        uploadedAt: video.createdAt.toISOString(),
        duration: video.duration,
        tags: video.tags || [],
        metadata: {
          resolution: '1080p',
          codec: 'h264',
          fileSize: req.file.size
        }
      });

      console.log('✅ Video recorded on blockchain:', blockchainRecord);

      return res.status(201).json({
        message: "Video uploaded successfully",
        video: video?.toObject ? video.toObject() : video,
        tokensGenerated: tokensGenerated || 0,
        blockchain: {
          recorded: true,
          videoHash: blockchainRecord.videoHash,
          blockId: blockchainRecord.blockId,
          verified: blockchainRecord.verified
        },
        details: {
          videoId: video?._id,
          tokensEarned: tokensGenerated || 0,
          walletAddress: req.user?.walletAddress || null
        }
      });
    } catch (blockchainError) {
      console.warn('⚠️ Blockchain recording failed (non-fatal):', blockchainError.message);
      
      // Still return success for video upload even if blockchain fails
      return res.status(201).json({
        message: "Video uploaded successfully (blockchain recording pending)",
        video: video?.toObject ? video.toObject() : video,
        tokensGenerated: tokensGenerated || 0,
        details: {
          videoId: video?._id,
          tokensEarned: tokensGenerated || 0,
          walletAddress: req.user?.walletAddress || null
        }
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// ✅ PUBLIC: Get all public videos with investment details
router.get("/public", async (req, res) => {
  try {
    const videos = await Video.find({ isPublic: true })
      .populate("creatorId", "name email walletAddress subscriptionTier")
      .sort({ createdAt: -1 });

    // Calculate total investment per video
    const videosWithInvestment = await Promise.all(
      videos.map(async (video) => {
        const totalInvested = await Transaction.aggregate([
          { $match: { videoId: video._id, type: "INVESTMENT" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        return {
          ...video.toObject(),
          totalInvestment: totalInvested[0]?.total || 0,
          cryptoGenerated: video.cryptoGenerated || 0,
          blockchainVerified: !!video.blockchainHash,
          transparencyScore: video.transparencyLog?.length || 0
        };
      })
    );

    return res.json(videosWithInvestment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to load public videos" });
  }
});

// PUBLIC: Get videos sorted by total investment and latest (no auth)
router.get("/public/discover", async (req, res) => {
  try {
    const videos = await Video.find({ isPublic: true }).populate("creatorId", "name email");

    const videosWithInvestment = await Promise.all(
      videos.map(async (video) => {
        const totalInvested = await Transaction.aggregate([
          { $match: { videoId: video._id, type: "INVESTMENT" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        return {
          ...video.toObject(),
          totalInvestment: totalInvested[0]?.total || 0
        };
      })
    );

    const sorted = videosWithInvestment.sort((a, b) => {
      if (b.totalInvestment !== a.totalInvestment) {
        return b.totalInvestment - a.totalInvestment;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json(sorted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to load public videos" });
  }
});

// PUBLIC: Search videos by title
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const videos = await Video.find({
      title: { $regex: q, $options: "i" }
    }).populate("creatorId", "name email");

    const videosWithInvestment = await Promise.all(
      videos.map(async (video) => {
        const totalInvested = await Transaction.aggregate([
          { $match: { videoId: video._id, type: "INVESTMENT" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        return {
          ...video.toObject(),
          totalInvestment: totalInvested[0]?.total || 0
        };
      })
    );

    const sorted = videosWithInvestment.sort((a, b) => {
      if (b.totalInvestment !== a.totalInvestment) {
        return b.totalInvestment - a.totalInvestment;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json(sorted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to search videos" });
  }
});

// Get video detail with full transparency log
router.get("/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("creatorId", "name email walletAddress subscriptionTier showEarnings")
      .populate({
        path: "comments.userId",
        select: "name email"
      });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    return res.json({
      ...video.toObject(),
      transparencyInformation: {
        blockchainHash: video.blockchainHash,
        cryptoGenerated: video.cryptoGenerated,
        totalInvested: video.totalInvested,
        totalSubscribers: video.totalSubscribers,
        transparencyLog: video.transparencyLog,
        revenueDistribution: video.revenue
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to load video" });
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

// ✅ POST: Add comment to video (authenticated users only)
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Add comment
    video.comments.push({
      userId: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    });

    await video.save();
    
    // Populate comments with user details
    const updatedVideo = await Video.findById(req.params.id).populate({
      path: "comments.userId",
      select: "name email"
    });

    return res.json(updatedVideo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to post comment" });
  }
});

module.exports = router;
