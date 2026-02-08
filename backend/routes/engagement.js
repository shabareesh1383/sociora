const express = require("express");
const auth = require("../middleware/auth");
const Video = require("../models/Video");
const User = require("../models/User");

const router = express.Router();

/* ==================== FOLLOW/UNFOLLOW CREATOR ==================== */

// ✅ FOLLOW a creator (or any user, including other creators)
router.post("/:creatorId/follow", auth, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const userId = req.user.id.toString();
    const targetId = creatorId.toString();

    // Prevent self-follow
    if (userId === targetId) {
      return res.status(400).json({ message: "❌ You cannot follow yourself" });
    }

    const target = await User.findById(creatorId);
    if (!target) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "❌ Current user not found" });
    }

    // Add to user's following list if not already following
    const isAlreadyFollowing = user.following.some(id => id.toString() === targetId);
    if (!isAlreadyFollowing) {
      user.following.push(creatorId);
      await user.save();
    }

    // Add to target's followers list if not already there
    const isAlreadyFollower = target.followers.some(id => id.toString() === userId);
    if (!isAlreadyFollower) {
      target.followers.push(req.user.id);
      if (target.creatorStats) {
        target.creatorStats.totalUniqueFollowers = (target.creatorStats.totalUniqueFollowers || 0) + 1;
      }
      await target.save();
    }

    return res.json({
      message: "✅ You are now following this creator!",
      following: true,
      followerCount: target.followers.length
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "❌ Failed to follow creator", error: error.message });
  }
});

// ✅ UNFOLLOW a creator
router.post("/:creatorId/unfollow", auth, async (req, res) => {
  try {
    const { creatorId } = req.params;

    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const user = await User.findById(req.user.id);

    // Remove from user's following list
    user.following = user.following.filter(id => id.toString() !== creatorId);
    await user.save();

    // Remove from creator's followers list
    creator.followers = creator.followers.filter(id => id.toString() !== req.user.id);
    creator.creatorStats.totalUniqueFollowers = Math.max(0, (creator.creatorStats.totalUniqueFollowers || 1) - 1);
    await creator.save();

    return res.json({
      message: "✅ You unfollowed this creator",
      following: false
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to unfollow creator", error: error.message });
  }
});

// ✅ GET follow status
router.get("/:creatorId/follow-status", auth, async (req, res) => {
  try {
    const { creatorId } = req.params;

    const user = await User.findById(req.user.id);
    const isFollowing = user.following.includes(creatorId);

    return res.json({ isFollowing });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to check follow status" });
  }
});

/* ==================== LOVE/HATE VIDEO ==================== */

// ✅ LOVE a video
router.post("/video/:videoId/love", auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const user = await User.findById(req.user.id);
    const userIdStr = req.user.id;

    // Check if already loved
    const alreadyLoved = video.loves.some(id => id.toString() === userIdStr);
    if (alreadyLoved) {
      return res.json({ message: "✅ You already loved this video", loved: true });
    }

    // Remove from hates if present
    video.hates = video.hates.filter(id => id.toString() !== userIdStr);
    if (video.hates.length < (video.hateCount || 0)) {
      video.hateCount = Math.max(0, (video.hateCount || 1) - 1);
    }

    // Add to loves
    video.loves.push(req.user.id);
    video.loveCount = (video.loveCount || 0) + 1;
    await video.save();

    // Update user profile
    if (!user.videosLoved.includes(videoId)) {
      user.videosLoved.push(videoId);
      await user.save();
    }

    return res.json({
      message: "❤️ You loved this video!",
      loved: true,
      loveCount: video.loveCount,
      hateCount: video.hateCount
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to love video", error: error.message });
  }
});

// ✅ HATE a video
router.post("/video/:videoId/hate", auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const user = await User.findById(req.user.id);
    const userIdStr = req.user.id;

    // Check if already hated
    const alreadyHated = video.hates.some(id => id.toString() === userIdStr);
    if (alreadyHated) {
      return res.json({ message: "👎 You already hated this video", hated: true });
    }

    // Remove from loves if present
    video.loves = video.loves.filter(id => id.toString() !== userIdStr);
    if (video.loves.length < (video.loveCount || 0)) {
      video.loveCount = Math.max(0, (video.loveCount || 1) - 1);
    }

    // Add to hates
    video.hates.push(req.user.id);
    video.hateCount = (video.hateCount || 0) + 1;
    await video.save();

    // Update user profile
    if (!user.videosHated.includes(videoId)) {
      user.videosHated.push(videoId);
      await user.save();
    }

    return res.json({
      message: "👎 You disliked this video",
      hated: true,
      loveCount: video.loveCount,
      hateCount: video.hateCount
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to hate video", error: error.message });
  }
});

// ✅ UNLIKE a video (remove love or hate)
router.post("/video/:videoId/unlike", auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const userIdStr = req.user.id;
    let wasLoved = false;
    let wasHated = false;

    // Remove from loves
    if (video.loves.some(id => id.toString() === userIdStr)) {
      video.loves = video.loves.filter(id => id.toString() !== userIdStr);
      video.loveCount = Math.max(0, (video.loveCount || 1) - 1);
      wasLoved = true;
    }

    // Remove from hates
    if (video.hates.some(id => id.toString() === userIdStr)) {
      video.hates = video.hates.filter(id => id.toString() !== userIdStr);
      video.hateCount = Math.max(0, (video.hateCount || 1) - 1);
      wasHated = true;
    }

    await video.save();

    return res.json({
      message: "✅ Your reaction has been removed",
      loveCount: video.loveCount,
      hateCount: video.hateCount,
      wasLoved,
      wasHated
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to remove reaction", error: error.message });
  }
});

// ✅ GET engagement status for a video
router.get("/video/:videoId/engagement-status", auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const userIdStr = req.user.id;
    const isLoved = video.loves.some(id => id.toString() === userIdStr);
    const isHated = video.hates.some(id => id.toString() === userIdStr);

    return res.json({
      isLoved,
      isHated,
      loveCount: video.loveCount || 0,
      hateCount: video.hateCount || 0,
      uniqueInvestors: video.uniqueInvestorCount || 0,
      totalInvested: video.totalInvested || 0
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get engagement status" });
  }
});

// ✅ GET creator's followers
router.get("/:creatorId/followers", async (req, res) => {
  try {
    const { creatorId } = req.params;

    const creator = await User.findById(creatorId).populate("followers", "name email avatar");
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    return res.json({
      followersCount: creator.followers.length,
      followers: creator.followers
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get followers" });
  }
});

// ✅ GET user's profile statistics
router.get("/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get videos created by this user (if creator)
    const Video = require("../models/Video");
    const videos = await Video.find({ creatorId: userId });

    // Calculate total loves received
    let totalLovesReceived = 0;
    videos.forEach(video => {
      totalLovesReceived += (video.loveCount || 0);
    });

    // Get unique investors this creator has across all videos
    const uniqueInvestors = new Set();
    videos.forEach(video => {
      if (video.investors) {
        video.investors.forEach(inv => {
          uniqueInvestors.add(inv.userId.toString());
        });
      }
    });

    const stats = {
      name: user.name,
      email: user.email,
      role: user.role,
      followers: user.followers.length,
      following: user.following.length,
      videosCreated: videos.length,
      videosLoved: user.videosLoved.length,
      videosHated: user.videosHated.length,
      totalInvested: user.totalInvested || 0,
      totalEarned: user.totalEarned || 0,
      cryptoBalance: user.cryptoBalance || 0,
      totalLovesReceived,
      uniqueInvestors: uniqueInvestors.size,
      subscriptionTier: user.subscriptionTier,
      isVerified: user.isVerified,
      avatar: user.avatar,
      bio: user.bio
    };

    return res.json(stats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get user stats", error: error.message });
  }
});

module.exports = router;
