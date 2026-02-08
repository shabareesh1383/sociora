const mongoose = require("mongoose");

// Enhanced User model with crypto wallet, subscriptions, and transparent earnings
const userSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["creator", "investor", "admin"], default: "investor" },

    // Crypto Wallet
    walletAddress: { 
      type: String, 
      unique: true, 
      sparse: true,
      default: () => `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    cryptoBalance: { type: Number, default: 0 }, // SOCIORA tokens
    totalEarned: { type: Number, default: 0 },   // Lifetime earnings
    totalInvested: { type: Number, default: 0 }, // Total invested by this user
    totalReturns: { type: Number, default: 0 },  // Total returns received

    // Creator-Specific
    creatorStats: {
      videosUploaded: { type: Number, default: 0 },
      totalUniqueFollowers: { type: Number, default: 0 },
      averageReturnsToInvestors: { type: Number, default: 0 },
      templatesPurchased: [{ type: mongoose.Schema.Types.ObjectId, ref: "Template" }],
      customTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Template" }],
    },

    // Engagement & Relationship
    followers: [mongoose.Schema.Types.ObjectId], // Users who follow this creator
    following: [mongoose.Schema.Types.ObjectId], // Creators this user follows
    videosLoved: [mongoose.Schema.Types.ObjectId], // Videos this user loved
    videosHated: [mongoose.Schema.Types.ObjectId], // Videos this user hated
    
    // Investment Stats
    totalInvestments: { type: Number, default: 0 }, // Count of unique videos invested in
    uniqueInvestorsFollowing: [mongoose.Schema.Types.ObjectId], // Unique investors this creator has

    // Subscription Tier
    subscriptionTier: {
      type: String,
      enum: ["free", "pro", "premium", "elite"],
      default: "free"
    },
    subscriptionExpiry: Date,

    // Profile & Verification
    avatar: String,
    bio: String,
    isVerified: { type: Boolean, default: false },
    blockchainVerified: { type: Boolean, default: false },
    verificationHash: String, // Hash on blockchain

    // Privacy & Security
    twoFactorEnabled: { type: Boolean, default: false },
    blockedUsers: [mongoose.Schema.Types.ObjectId],
    
    // Transparency Settings
    showEarnings: { type: Boolean, default: true },
    showInvestments: { type: Boolean, default: false },
    transactionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "CryptoTransaction" }]
  },
  { timestamps: true }
);

// Index for faster queries (walletAddress is already indexed via unique: true)
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
