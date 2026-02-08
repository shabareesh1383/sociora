const mongoose = require("mongoose");

// Enhanced Video model with blockchain, templates, protection, and transparent revenue
const videoSchema = new mongoose.Schema(
  {
    // Basic Content
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [String],
    thumbnail: String,
    category: { type: String, default: "general" },

    // Creator & Ownership
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filePath: { type: String, required: true },
    isPublic: { type: Boolean, default: true },

    // Template System
    templateUsed: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
    isTemplate: { type: Boolean, default: false },
    templatePrice: { type: Number, default: 0 }, // If this video is sold as template

    // Blockchain & Crypto
    blockchainHash: String, // Immutable hash on blockchain
    videoTokenAddress: String, // Crypto for this specific video
    contractAddress: String, // Smart contract for this video
    
    // Content Protection (DRM)
    protectionLevel: { 
      type: String, 
      enum: ["public", "subscribers_only", "investors_only", "premium"],
      default: "public"
    },
    screenshotProtected: { type: Boolean, default: true },
    screenRecordProtected: { type: Boolean, default: true },
    downloadDisabled: { type: Boolean, default: true },
    watermarkEnabled: { type: Boolean, default: true },
    watermarkText: String,

    // Financial Metrics (Transparent)
    revenue: {
      totalEarned: { type: Number, default: 0 },
      creatorShare: { type: Number, default: 0 }, // Creator keeps %
      platformFee: { type: Number, default: 0 },  // Platform takes %
      investorReturns: { type: Number, default: 0 } // Paid to investors
    },

    // Investment & Unique Tracking
    minInvestment: { type: Number, default: 10 },
    maxInvestment: { type: Number, default: 10000 },
    expectedROI: { type: Number, default: 25 }, // Expected return % for investors
    
    // Unique Investors - No duplicates even if person invests multiple times
    investors: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        totalInvested: { type: Number, default: 0 }, // Total amount invested by this user
        investmentCount: { type: Number, default: 0 }, // Number of times invested
        lastInvestment: Date,
        returns: { type: Number, default: 0 },
        status: { type: String, enum: ["active", "withdrawn"], default: "active" }
      }
    ],
    totalInvested: { type: Number, default: 0 },
    uniqueInvestorCount: { type: Number, default: 0 }, // Count of unique investors

    // Engagement Features
    followers: [mongoose.Schema.Types.ObjectId], // Unique users following this video
    loves: [mongoose.Schema.Types.ObjectId], // Users who loved this video
    hates: [mongoose.Schema.Types.ObjectId], // Users who hated this video
    loveCount: { type: Number, default: 0 },
    hateCount: { type: Number, default: 0 },

    // Legacy - keeping for compatibility
    subscribers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        investmentAmount: Number,
        subscribedAt: Date,
        returns: { type: Number, default: 0 },
        status: { type: String, enum: ["active", "withdrawn"], default: "active" }
      }
    ],
    totalSubscribers: { type: Number, default: 0 },

    // Engagement & Access
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: Date
      }
    ],

    // Metadata
    duration: Number, // in seconds
    fileSize: Number, // in MB
    resolution: { type: String, default: "1080p" },
    
    // Transparency Log
    transparencyLog: [
      {
        timestamp: Date,
        event: String,
        amount: Number,
        description: String
      }
    ],

    // Status & Moderation
    status: { 
      type: String, 
      enum: ["draft", "published", "monetized", "flagged", "removed"],
      default: "published"
    },
    moderationNotes: String,

    // Crypto Generation
    cryptoGenerated: { type: Number, default: 0 }, // SOCIORA tokens created
    cryptoGenerationDate: Date
  },
  { timestamps: true }
);

// Indexes for efficient querying
videoSchema.index({ creatorId: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ blockchainHash: 1 });
videoSchema.index({ "investors.userId": 1 });
videoSchema.index({ followers: 1 });
videoSchema.index({ loves: 1 });
videoSchema.index({ hates: 1 });

module.exports = mongoose.model("Video", videoSchema);
