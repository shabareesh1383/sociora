const express = require("express");
const auth = require("../middleware/auth");
const CryptoService = require("../services/cryptoService");
const CryptoTransaction = require("../models/CryptoTransaction");
const User = require("../models/User");
const Video = require("../models/Video");

const router = express.Router();

// ✅ GET WALLET - View current balance and all transactions
router.get("/wallet", auth, async (req, res) => {
  try {
    const walletDetails = await CryptoService.getWalletDetails(req.user.id);
    return res.json(walletDetails);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch wallet", error: error.message });
  }
});

// ✅ INVEST IN VIDEO - Creator investment with crypto
router.post("/invest", auth, async (req, res) => {
  try {
    const { videoId, amount } = req.body;

    if (!videoId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid video ID or amount" });
    }

    const result = await CryptoService.processInvestment(req.user.id, videoId, amount);
    
    return res.json({
      success: true,
      message: "Investment successful",
      transaction: result.transaction,
      distribution: result.distribution
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
});

// ✅ GET TRANSACTION HISTORY - Full transparency of all transactions
router.get("/transactions", auth, async (req, res) => {
  try {
    const { type, status, limit = 50, page = 1 } = req.query;

    const query = {
      $or: [
        { fromUser: req.user.id },
        { toUser: req.user.id }
      ]
    };

    if (type) query.transactionType = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const transactions = await CryptoTransaction.find(query)
      .populate("fromUser", "name email")
      .populate("toUser", "name email")
      .populate("videoId", "title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CryptoTransaction.countDocuments(query);

    return res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// ✅ GET SPECIFIC TRANSACTION DETAILS
router.get("/transaction/:txHash", async (req, res) => {
  try {
    const transaction = await CryptoTransaction.findOne({ 
      transactionHash: req.params.txHash 
    })
      .populate("fromUser")
      .populate("toUser")
      .populate("videoId")
      .populate("templateId");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.json(transaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch transaction" });
  }
});

// ✅ GET VIDEO TRANSPARENCY (Revenue Distribution)
router.get("/video/:videoId/transparency", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId)
      .populate("creatorId", "name email walletAddress")
      .populate("subscribers.userId", "name email");

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Get all transactions related to this video
    const transactions = await CryptoTransaction.find({ 
      videoId: req.params.videoId 
    }).sort({ createdAt: -1 });

    return res.json({
      videoTitle: video.title,
      creator: video.creatorId,
      blockchainHash: video.blockchainHash,
      createdAt: video.createdAt,
      
      financialMetrics: {
        totalEarned: video.revenue.totalEarned,
        creatorShare: video.revenue.creatorShare,
        platformFee: video.revenue.platformFee,
        investorReturnsReserve: video.revenue.investorReturns,
        totalInvested: video.totalInvested
      },

      subscribers: video.subscribers.map(sub => ({
        investorName: sub.userId.name,
        investmentAmount: sub.investmentAmount,
        investmentDate: sub.subscribedAt,
        returnsReceived: sub.returns,
        status: sub.status
      })),

      transparencyLog: video.transparencyLog,
      
      allTransactions: transactions.map(tx => ({
        hash: tx.transactionHash,
        type: tx.transactionType,
        amount: tx.amount,
        from: tx.fromUser,
        to: tx.toUser,
        distribution: tx.distribution,
        timestamp: tx.createdAt,
        blockchainConfirmed: tx.blockchainConfirmed
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch transparency data" });
  }
});

// ✅ GET CREATOR DASHBOARD - Full earnings breakdown
router.get("/creator/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "creator") {
      return res.status(403).json({ message: "Only creators can access this" });
    }

    // Get all videos created by this creator
    const videos = await Video.find({ creatorId: req.user.id }).populate("subscribers.userId");

    // Calculate total earnings by type
    const earnings = {
      videoCreation: 0,
      investments: 0,
      templateSales: 0,
      returns: 0
    };

    const transactions = await CryptoTransaction.find({
      toUser: req.user.id,
      status: "confirmed"
    });

    transactions.forEach(tx => {
      if (tx.transactionType === "crypto_generation") earnings.videoCreation += tx.amount;
      if (tx.transactionType === "video_investment") earnings.investments += tx.amount;
      if (tx.transactionType === "template_purchase") earnings.templateSales += tx.amount;
      if (tx.transactionType === "investor_returns") earnings.returns += tx.amount;
    });

    return res.json({
      creator: {
        name: user.name,
        walletAddress: user.walletAddress,
        subscriptionTier: user.subscriptionTier
      },
      balance: user.cryptoBalance,
      totalEarnings: user.totalEarned,
      earningsBreakdown: earnings,
      statistics: {
        videosUploaded: videos.length,
        totalInvested: videos.reduce((sum, v) => sum + v.totalInvested, 0),
        totalSubscribers: videos.reduce((sum, v) => sum + v.totalSubscribers, 0),
        averageROI: videos.length > 0 
          ? (videos.reduce((sum, v) => sum + v.expectedROI, 0) / videos.length).toFixed(2)
          : 0
      },
      videos: videos.map(v => ({
        id: v._id,
        title: v.title,
        cryptoGenerated: v.cryptoGenerated,
        totalInvested: v.totalInvested,
        subscribers: v.subscribers.length,
        earningsShare: v.revenue.creatorShare,
        status: v.status
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch dashboard" });
  }
});

// ✅ GET INVESTOR DASHBOARD - Investments and returns tracking
router.get("/investor/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get all investments
    const investmentTxs = await CryptoTransaction.find({
      fromUser: req.user.id,
      transactionType: "video_investment"
    }).populate("videoId", "title");

    // Get all returns received
    const returnsTxs = await CryptoTransaction.find({
      toUser: req.user.id,
      transactionType: "investor_returns"
    }).populate("videoId", "title");

    const portfolioValue = investmentTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const totalReturns = returnsTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const roi = portfolioValue > 0 
      ? (((totalReturns - portfolioValue) / portfolioValue) * 100).toFixed(2)
      : 0;

    return res.json({
      investor: {
        name: user.name,
        walletAddress: user.walletAddress
      },
      balance: user.cryptoBalance,
      portfolio: {
        totalInvested: user.totalInvested,
        totalReturns: user.totalReturns,
        portfolioValue: portfolioValue,
        ROI: roi,
        numberOfInvestments: investmentTxs.length
      },
      investments: investmentTxs.map(tx => ({
        videoTitle: tx.videoId.title,
        invested: tx.amount,
        investmentDate: tx.createdAt,
        returns: returnsTxs
          .filter(r => r.videoId._id.toString() === tx.videoId._id.toString())
          .reduce((sum, r) => sum + r.amount, 0)
      })),
      recentReturns: returnsTxs.slice(0, 10)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch investor dashboard" });
  }
});

// ✅ CALCULATE AND DISTRIBUTE RETURNS (Admin/Cron Job)
router.post("/distribute-returns/:videoId", async (req, res) => {
  try {
    // This would typically be called by a scheduled job
    const result = await CryptoService.calculateAndDistributeReturns(req.params.videoId);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to distribute returns" });
  }
});

module.exports = router;
