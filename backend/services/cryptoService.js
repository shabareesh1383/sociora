const crypto = require("crypto");
const CryptoTransaction = require("../models/CryptoTransaction");
const User = require("../models/User");
const Video = require("../models/Video");

class CryptoService {
  /**
   * Generate crypto when a video is uploaded
   * This is the core of the platform - automatic token generation
   */
  static async generateCryptoOnVideoUpload(videoId, creatorId) {
    try {
      const video = await Video.findById(videoId);
      const creator = await User.findById(creatorId);

      if (!video || !creator) throw new Error("Video or creator not found");

      // Calculate crypto generation based on video quality and creator tier
      const baseTokens = 100; // Base tokens per video
      const tierMultiplier = this.getTierMultiplier(creator.subscriptionTier);
      const tokensToGenerate = baseTokens * tierMultiplier;

      // Create blockchain transaction
      const txHash = this.generateTransactionHash();
      
      const transaction = await CryptoTransaction.create({
        transactionHash: txHash,
        fromUser: null, // Platform generates these
        toUser: creatorId,
        toWallet: creator.walletAddress,
        amount: tokensToGenerate,
        transactionType: "crypto_generation",
        videoId: videoId,
        status: "confirmed",
        description: `Crypto generated for video: ${video.title}`,
        netAmount: tokensToGenerate
      });

      // Update creator balance
      creator.cryptoBalance += tokensToGenerate;
      creator.totalEarned += tokensToGenerate;
      creator.transactionHistory.push(transaction._id);
      await creator.save();

      // Update video blockchain info
      video.blockchainHash = this.generateBlockchainHash(videoId);
      video.cryptoGenerated = tokensToGenerate;
      video.cryptoGenerationDate = new Date();
      await video.save();

      // Add to transparency log
      video.transparencyLog.push({
        timestamp: new Date(),
        event: "Crypto Generated",
        amount: tokensToGenerate,
        description: `${tokensToGenerate} SOCIORA tokens generated on upload`
      });
      await video.save();

      return {
        success: true,
        tokensGenerated: tokensToGenerate,
        transaction: transaction,
        message: `Successfully generated ${tokensToGenerate} SOCIORA tokens`
      };
    } catch (error) {
      console.error("Crypto generation error:", error);
      throw error;
    }
  }

  /**
   * Process investment transaction
   * Investor invests in video, tokens transferred, recorded transparently
   */
  static async processInvestment(investorId, videoId, amount) {
    try {
      const investor = await User.findById(investorId);
      const video = await Video.findById(videoId);

      if (!investor || !video) throw new Error("Investor or video not found");
      if (investor.cryptoBalance < amount) throw new Error("Insufficient balance");

      const creator = await User.findById(video.creatorId);

      // Calculate returns distribution
      const creatorEarnings = amount * 0.70; // Creator gets 70%
      const platformFee = amount * 0.20;     // Platform gets 20%
      const reserveForReturns = amount * 0.10; // Reserve 10% for investor returns

      // Create blockchain transaction
      const txHash = this.generateTransactionHash();
      
      const transaction = await CryptoTransaction.create({
        transactionHash: txHash,
        fromUser: investorId,
        toUser: video.creatorId,
        fromWallet: investor.walletAddress,
        toWallet: creator.walletAddress,
        amount: amount,
        transactionType: "video_investment",
        videoId: videoId,
        status: "confirmed",
        description: `Investment in video: ${video.title}`,
        distribution: {
          creatorShare: creatorEarnings,
          platformShare: platformFee,
          investorReturns: reserveForReturns
        },
        netAmount: amount,
        blockchainConfirmed: true
      });

      // Update balances
      investor.cryptoBalance -= amount;
      investor.totalInvested += amount;
      investor.transactionHistory.push(transaction._id);

      creator.cryptoBalance += creatorEarnings;
      creator.totalEarned += creatorEarnings;
      creator.transactionHistory.push(transaction._id);

      await investor.save();
      await creator.save();

      // Add subscriber to video
      video.subscribers.push({
        userId: investorId,
        investmentAmount: amount,
        subscribedAt: new Date(),
        returns: 0,
        status: "active"
      });
      video.totalInvested += amount;
      video.totalSubscribers += 1;
      video.revenue.creatorShare += creatorEarnings;
      video.revenue.platformFee += platformFee;
      video.revenue.investorReturns += reserveForReturns;

      video.transparencyLog.push({
        timestamp: new Date(),
        event: "Investment Received",
        amount: amount,
        description: `Investment from ${investor.email}: ${amount} SOCIORA`
      });

      await video.save();

      return {
        success: true,
        transaction: transaction,
        message: "Investment successful",
        distribution: {
          creatorEarnings,
          platformFee,
          investorReward: reserveForReturns
        }
      };
    } catch (error) {
      console.error("Investment processing error:", error);
      throw error;
    }
  }

  /**
   * Calculate investor returns
   * Returns are calculated based on video performance
   */
  static async calculateAndDistributeReturns(videoId) {
    try {
      const video = await Video.findById(videoId).populate("subscribers.userId");

      if (!video || video.subscribers.length === 0) {
        return { success: false, message: "No subscribers for this video" };
      }

      // Calculate returns based on views and engagement
      const performanceMultiplier = this.calculatePerformanceMultiplier(
        video.views,
        video.likes,
        video.comments.length
      );

      const totalReturnsPool = video.revenue.investorReturns * performanceMultiplier;
      const returnsPerSub = totalReturnsPool / video.subscribers.length;

      for (let sub of video.subscribers) {
        if (sub.status === "active") {
          // Calculate proportional returns
          const subReturn = (sub.investmentAmount / video.totalInvested) * totalReturnsPool;

          const txHash = this.generateTransactionHash();

          const returnTx = await CryptoTransaction.create({
            transactionHash: txHash,
            fromUser: null, // Platform distributes
            toUser: sub.userId._id,
            toWallet: sub.userId.walletAddress,
            amount: subReturn,
            transactionType: "investor_returns",
            videoId: videoId,
            status: "confirmed",
            description: `Returns from investment in: ${video.title}`,
            netAmount: subReturn,
            blockchainConfirmed: true
          });

          // Update investor balance and tracking
          sub.userId.cryptoBalance += subReturn;
          sub.userId.totalReturns += subReturn;
          sub.userId.transactionHistory.push(returnTx._id);
          sub.returns += subReturn;

          await sub.userId.save();
        }
      }

      video.transparencyLog.push({
        timestamp: new Date(),
        event: "Returns Distributed",
        amount: totalReturnsPool,
        description: `Distributed returns to ${video.subscribers.length} investors`
      });

      await video.save();

      return {
        success: true,
        totalReturnsDistributed: totalReturnsPool,
        subscribersRewarded: video.subscribers.length
      };
    } catch (error) {
      console.error("Returns calculation error:", error);
      throw error;
    }
  }

  /**
   * Template purchase transaction
   */
  static async purchaseTemplate(buyerId, templateId, templatePrice) {
    try {
      const buyer = await User.findById(buyerId);
      const Template = require("../models/Template");
      const template = await Template.findById(templateId).populate("creatorId");

      if (!buyer || !template) throw new Error("Buyer or template not found");
      if (buyer.cryptoBalance < templatePrice) throw new Error("Insufficient balance");

      const templateCreator = template.creatorId;
      
      // 80-20 split: Creator gets 80%, Platform gets 20%
      const creatorEarnings = templatePrice * 0.80;
      const platformFee = templatePrice * 0.20;

      const txHash = this.generateTransactionHash();

      const transaction = await CryptoTransaction.create({
        transactionHash: txHash,
        fromUser: buyerId,
        toUser: template.creatorId._id,
        fromWallet: buyer.walletAddress,
        toWallet: templateCreator.walletAddress,
        amount: templatePrice,
        transactionType: "template_purchase",
        templateId: templateId,
        status: "confirmed",
        description: `Template purchase: ${template.name}`,
        distribution: {
          creatorShare: creatorEarnings,
          platformShare: platformFee
        },
        netAmount: templatePrice
      });

      buyer.cryptoBalance -= templatePrice;
      buyer.creatorStats.templatesPurchased.push(templateId);
      buyer.transactionHistory.push(transaction._id);
      await buyer.save();

      templateCreator.cryptoBalance += creatorEarnings;
      templateCreator.totalEarned += creatorEarnings;
      templateCreator.transactionHistory.push(transaction._id);
      await templateCreator.save();

      template.purchaseCount += 1;
      template.creatorRevenue += creatorEarnings;
      await template.save();

      return {
        success: true,
        transaction: transaction,
        message: "Template purchased successfully"
      };
    } catch (error) {
      console.error("Template purchase error:", error);
      throw error;
    }
  }

  /**
   * Get wallet details with full transparency
   */
  static async getWalletDetails(userId) {
    try {
      const user = await User.findById(userId)
        .populate("transactionHistory")
        .select("-password");

      if (!user) throw new Error("User not found");

      const cryptoTransactions = await CryptoTransaction.find({
        $or: [{ fromUser: userId }, { toUser: userId }]
      }).sort({ createdAt: -1 }).limit(50);

      return {
        walletAddress: user.walletAddress,
        balance: user.cryptoBalance,
        role: user.role,
        stats: {
          totalEarned: user.totalEarned,
          totalInvested: user.totalInvested,
          totalReturns: user.totalReturns,
          subscriersCount: user.creatorStats?.totalSubscribers || 0,
          videosCount: user.creatorStats?.videosUploaded || 0
        },
        recentTransactions: cryptoTransactions,
        subscriptionTier: user.subscriptionTier
      };
    } catch (error) {
      console.error("Wallet details error:", error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */
  static generateTransactionHash() {
    return `0x${crypto.randomBytes(32).toString("hex")}`;
  }

  static generateBlockchainHash(videoId) {
    return crypto
      .createHash("sha256")
      .update(`${videoId}${Date.now()}`)
      .digest("hex");
  }

  static getTierMultiplier(tier) {
    const multipliers = {
      free: 1,
      pro: 1.5,
      premium: 2.5,
      elite: 4
    };
    return multipliers[tier] || 1;
  }

  static calculatePerformanceMultiplier(views, likes, comments) {
    // Base multiplier of 1.0
    let multiplier = 1.0;

    if (views > 1000) multiplier += 0.2;
    if (views > 10000) multiplier += 0.3;
    if (likes > 100) multiplier += 0.1;
    if (comments > 50) multiplier += 0.1;

    return Math.min(multiplier, 2.5); // Cap at 2.5x
  }
}

module.exports = CryptoService;
