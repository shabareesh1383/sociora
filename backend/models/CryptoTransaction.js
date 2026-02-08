const mongoose = require("mongoose");

// Comprehensive transaction model for all crypto operations
const cryptoTransactionSchema = new mongoose.Schema(
  {
    // Transaction ID
    transactionHash: { type: String, unique: true, required: true },
    blockchainConfirmed: { type: Boolean, default: false },
    confirmationBlock: Number,
    
    // Parties Involved
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fromWallet: String,
    toWallet: String,
    
    // Transaction Details
    amount: { type: Number, required: true }, // SOCIORA tokens
    transactionType: {
      type: String,
      enum: [
        "video_investment",
        "template_purchase",
        "creator_payout",
        "investor_returns",
        "platform_fee",
        "subscription_payment",
        "crypto_generation",
        "wallet_transfer",
        "refund"
      ],
      required: true
    },
    
    // Related Entity
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
    
    // Status
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed", "cancelled"],
      default: "pending"
    },
    
    // Details & Transparency
    description: String,
    notes: String,
    
    // Fees
    gasFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number }, // Amount after fees
    
    // Revenue Distribution (for transparency)
    distribution: {
      creatorShare: { type: Number, default: 0 },
      investorReturns: { type: Number, default: 0 },
      platformShare: { type: Number, default: 0 },
      teamShare: { type: Number, default: 0 }
    },
    
    // Blockchain Details
    gasPrice: String,
    txFee: String,
    nonce: Number,
    blockNumber: Number,
    
    // Metadata
    ipAddress: String,
    deviceInfo: String,
    
    // Verification
    verificationCode: String,
    verified: { type: Boolean, default: false },
    
    // Dispute Resolution
    disputed: { type: Boolean, default: false },
    disputeReason: String,
    resolutionStatus: { type: String, enum: ["none", "pending", "resolved", "rejected"] }
  },
  { timestamps: true }
);

// Indexes for faster queries (transactionHash is already indexed via unique: true)
cryptoTransactionSchema.index({ fromUser: 1 });
cryptoTransactionSchema.index({ toUser: 1 });
cryptoTransactionSchema.index({ videoId: 1 });
cryptoTransactionSchema.index({ createdAt: -1 });
cryptoTransactionSchema.index({ blockchainConfirmed: 1 });
cryptoTransactionSchema.index({ status: 1 });

module.exports = mongoose.model("CryptoTransaction", cryptoTransactionSchema);
